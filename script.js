// --- SUPABASE INICIALIZÁCIA ---
const supabaseUrl = 'https://osgfwjpqtyvjrurhovob.supabase.co';
const supabaseKey = 'sb_publishable_2WS13vLq8lvRXXKgYbRjvA_JS86ULQU';
supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentUserProfile = null; 

// --- AUTOMATICKÉ NAČÍTANIE PROFILU PRI PRIHLÁSENÍ ---
supabase.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).limit(1);
        if (!error && data && data.length > 0) {
            currentUserProfile = data[0];
        } else {
            currentUserProfile = { id: session.user.id, is_premium: false }; 
        }
    } else {
        currentUserProfile = null; 
    }
    
    if (document.readyState === "complete" || document.readyState === "interactive") {
        applyFreemiumLocks();
        applyLanguage();
        checkOnboarding();
    }
});

let currentLang = ['sk', 'cs'].includes((navigator.language || 'en').slice(0, 2).toLowerCase()) ? 'SK' : 'EN', currentState = 'READY', timeLeft = 0, timerId = null, selectedTime = null, selectedFocus = null, currentGameIndex = 0, currentActiveGames = [];
let currentBlockPlan = [], currentBlockIndex = 0, timePassedInBlock = 0, audioCtx = null;
let currentTargets = [], targetInterval = 0, currentTargetIndex = 0;
const bellSound = new Audio("https://raw.githubusercontent.com/dcpoprad/dc-poprad-assets/main/ship-bell-two-chimes-102730%20(1).mp3");

let TIME_MULTIPLIER = 1; 

const dict = {
    EN: { 
        welcomeTitle: "WELCOME TO OCHE COACH", welcomeText: "This is your pure, zen training tool. No counting, no scoring, no pressure. Just you, the board, and the time flowing.", 
        btnUnderstand: "30-MIN FREE TRIAL", duration: "DURATION", focus: "FOCUS", tournament: "TOURNAMENT", 
        btnGoToOche: "GO TO OCHE", back: "BACK", exit: "EXIT", btnChange: "CHANGE", btnGameOn: "GAME ON!", 
        btnPause: "|| PAUSE", btnResume: "► RESUME", btnNextBlock: "NEXT BLOCK", btnDone: "DONE", 
        coachTip: "Take a short break between blocks. Switch off your focus, hydrate, and rest your arm. Matches take about 10-20 minutes, so it's important to practice resting and restarting your concentration.", 
        summaryTitle: "SESSION COMPLETE", ultimateTitle: "ULTIMATE SURVIVOR", 
        summaryQuote: "\"You are on a great path. All this practice will pay off 100% in your tournaments and matches. Maybe not tomorrow, maybe not next week, but it will absolutely come.\"", 
        tourneyQuote: "\"Good luck in the tournament! Let them fly and enjoy the darts.\"", 
        statsWeek: "This week", statsMonth: "This month", seqText: "SEQUENCE", freeText: "FREE CHOICE",
        tabLogin: "LOGIN", tabReg: "NEW ACCOUNT", 
        phEmail: "E-mail", phPass: "Password", phFName: "First Name", phLName: "Last Name",
        btnLogin: "LOG IN", btnReg: "CREATE ACCOUNT",
        msgProcessing: "Processing...", msgCreated: "Account created! Logging in...", msgCheck: "Checking...", msgSuccess: "Login successful!", msgErrLogin: "Login failed. Check your details.",
        phPassConf: "Confirm Password", forgotPass: "Forgot password?", btnReset: "SEND RESET LINK", msgPassMismatch: "Passwords do not match!", msgResetSent: "Reset link sent to your email.", msgErrReset: "Error sending reset link.",
        profWeek: "This week", profMonth: "This month", profTotal: "Total", profRemains: "Remaining: ", profDaysTxt: " days", profExpired: "Expired", profLogOut: "Log out", profFree: "FREE ACCOUNT", profUpgrade: "Upgrade to unlock",
        salesSubtitle: "Unlock all times and games, long-term training stats, and your full potential.",
        salesP1: "Access to 45, 60, 90 min blocks and Ultimate mode",
        salesP2: "Unlock the most comprehensive MIX mode",
        salesP3: "Detailed history and statistics tracking",
        salesPriceSub: "(Less than 0.85 € per month)",
        btnBuy: "GET PREMIUM",
        salesToProfile: "My profile / Log out",
        installTitle: "Install Oche Coach",
        installText: "Add app to home screen",
        btnInstall: "INSTALL"
    },
    SK: { 
        welcomeTitle: "VITAJ V OCHE COACH", welcomeText: "Toto je tvoj tréner na čiare. Bez zapisovania, bez hodnotenia, žiaden tlak. Len ty, šípky, terč a plynúci čas.", 
        btnUnderstand: "30-MIN FREE TRIAL", duration: "DURATION", focus: "FOCUS", tournament: "TOURNAMENT", 
        btnGoToOche: "GO TO OCHE", back: "BACK", exit: "EXIT", btnChange: "CHANGE", btnGameOn: "GAME ON!", 
        btnPause: "|| PAUSE", btnResume: "► RESUME", btnNextBlock: "NEXT BLOCK", btnDone: "DONE", 
        coachTip: "Medzi blokmi si daj krátku pauzu. Vypni sústredenie, napi sa a zves ruky. Zápasy trvajú cca 10-20 minút, preto je dôležité trénovať aj oddych a reštart koncentrácie.", 
        summaryTitle: "TRÉNING UKONČENÝ", ultimateTitle: "ULTIMATE SURVIVOR", 
        summaryQuote: "\"Si na skvelej ceste. Všetok tento tréning sa ti 100% vráti v turnajoch a zápasoch. Možno nie zajtra, ani o týždeň, ale určite to príde.\"", 
        tourneyQuote: "\"Držím palce v turnaji! Nech to lieta a hlavne sa bav šípkami.\"", 
        statsWeek: "Tento týždeň", statsMonth: "Tento mesiac", seqText: "SEKVENCIA", freeText: "VOĽNÝ VÝBER",
        tabLogin: "PRIHLÁSENIE", tabReg: "NOVÉ KONTO", 
        phEmail: "E-mail", phPass: "Heslo", phFName: "Meno", phLName: "Priezvisko",
        btnLogin: "PRIHLÁSIŤ SA", btnReg: "VYTVORIŤ KONTO",
        msgProcessing: "Spracovávam...", msgCreated: "Konto vytvorené! Prebieha prihlasovanie...", msgCheck: "Overujem...", msgSuccess: "Úspešne prihlásený!", msgErrLogin: "Chyba prihlásenia. Skontroluj údaje.",
        phPassConf: "Potvrď heslo", forgotPass: "Zabudnuté heslo?", btnReset: "ODOSLAŤ LINK", msgPassMismatch: "Heslá sa nezhodujú!", msgResetSent: "Link na obnovu hesla bol odoslaný.", msgErrReset: "Chyba pri odosielaní linku.",
        profWeek: "Tento týždeň", profMonth: "Tento mesiac", profTotal: "Celkovo", profRemains: "Zostáva: ", profDaysTxt: " dní", profExpired: "Vypršalo", profLogOut: "Odhlásiť sa", profFree: "BEZPLATNÉ KONTO", profUpgrade: "Získaj Premium",
        salesSubtitle: "Odomkni všetky časy a hry, dlhodobé štatistiky tréningu a celý svoj potenciál.",
        salesP1: "Prístup k 45, 60, 90 min. blokom a Ultimátnemu režimu",
        salesP2: "Odomknutý najkomplexnejší MIX režim",
        salesP3: "Podrobné ukladanie histórie a štatistík",
        salesPriceSub: "(Menej ako 0,85 € mesačne)",
        btnBuy: "ZÍSKAŤ PREMIUM",
        salesToProfile: "Môj profil / Odhlásiť sa",
        installTitle: "Nainštaluj si appku",
        installText: "Pridaj si appku na plochu",
        btnInstall: "INSTALL"
    }
};

let gamesDB = { Singles: [], Scoring: [], Doubles: [], Checkouts: [], Mix: [], Tournament: [] };
let isDbLoaded = false;
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlZbjJjH1cgIPJAB_dythYDtgd4joUx6ujzPBQUK_VSe3OhSEzzUvLNzOGGA6_EBuuqWd22KJMuKzC/pub?output=csv";

// --- WAKE LOCK API (ZABRÁNI ZHASNUTIU DISPLEJA) ---
let wakeLock = null;
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (err) {
    console.error('Wake Lock chyba:', err);
  }
}
function releaseWakeLock() {
  if (wakeLock !== null) {
    wakeLock.release().then(() => {
      wakeLock = null;
    });
  }
}
document.addEventListener('visibilitychange', async () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    requestWakeLock();
  }
});

document.addEventListener('DOMContentLoaded', () => { applyLanguage(); checkOnboarding(); setupEventListeners(); applyFreemiumLocks(); });

function applyLanguage() {
    document.getElementById('t_welcomeTitle').innerText = dict[currentLang].welcomeTitle; 
    document.getElementById('t_welcomeText').innerText = dict[currentLang].welcomeText;
    document.getElementById('btnUnderstand').innerText = dict[currentLang].btnUnderstand; 
    document.getElementById('t_duration').innerText = dict[currentLang].duration;
    document.getElementById('t_focus').innerText = dict[currentLang].focus; 
    document.getElementById('t_tournament').innerText = dict[currentLang].tournament;
    document.getElementById('enterBtn').innerText = dict[currentLang].btnGoToOche; 
    document.getElementById('t_back').innerText = dict[currentLang].back;
    document.getElementById('t_exit').innerText = dict[currentLang].exit; 
    document.getElementById('btnChangeGame').innerText = dict[currentLang].btnChange;
    document.getElementById('hintReadyBtn').innerText = dict[currentLang].btnGameOn;
    
    if(document.getElementById('t_coachTipText')) document.getElementById('t_coachTipText').innerText = dict[currentLang].coachTip;

    if(document.getElementById('t_summaryQuote')) {
        document.getElementById('t_summaryQuote').innerText = (selectedFocus === 'Tournament') ? dict[currentLang].tourneyQuote : dict[currentLang].summaryQuote;
    }
    if(document.getElementById('t_seq')) document.getElementById('t_seq').innerText = dict[currentLang].seqText;
    if(document.getElementById('t_free')) document.getElementById('t_free').innerText = dict[currentLang].freeText;
    if(document.getElementById('t_statsWeek')) document.getElementById('t_statsWeek').innerText = dict[currentLang].statsWeek + ":";
    if(document.getElementById('t_statsMonth')) document.getElementById('t_statsMonth').innerText = dict[currentLang].statsMonth + ":";
    if(document.getElementById('btnDone')) document.getElementById('btnDone').innerText = dict[currentLang].btnDone;
    if(document.getElementById('regPasswordConfirm')) document.getElementById('regPasswordConfirm').placeholder = dict[currentLang].phPassConf;
    if(document.getElementById('btnShowReset')) document.getElementById('btnShowReset').innerText = dict[currentLang].forgotPass;
    if(document.getElementById('btnResetSubmit')) document.getElementById('btnResetSubmit').innerText = dict[currentLang].btnReset;

    let isUlt = selectedTime === 180;
    if(document.getElementById('t_summaryTitle')) document.getElementById('t_summaryTitle').innerText = isUlt ? dict[currentLang].ultimateTitle : dict[currentLang].summaryTitle;

    if(selectedFocus && selectedTime) {
        let dynText = currentLang === 'EN' ? `Great ${selectedTime}-minute session focused on ${selectedFocus.toUpperCase()}!` : `Skvelá ${selectedTime}-minútovka zameraná na ${selectedFocus.toUpperCase()}!`;
        if (isUlt) dynText = currentLang === 'EN' ? "Brutal! You survived the ULTIMATE training!" : "Brutálne! Zvládol si ULTIMATE tréning!";
        if (selectedFocus === 'Tournament') dynText = currentLang === 'EN' ? "Great Warm-Up! You are match-ready." : "Skvelé rozohriatie! Si pripravený na zápas.";
        if(document.getElementById('summaryDynamicText')) document.getElementById('summaryDynamicText').innerText = dynText;
    }

    if(document.getElementById('t_installTitle')) document.getElementById('t_installTitle').innerText = dict[currentLang].installTitle;
    if(document.getElementById('t_installText')) document.getElementById('t_installText').innerText = dict[currentLang].installText;
    if(document.getElementById('btnInstallConfirm')) document.getElementById('btnInstallConfirm').innerText = dict[currentLang].btnInstall;

    if(document.getElementById('tabLogin')) document.getElementById('tabLogin').innerText = dict[currentLang].tabLogin;
    if(document.getElementById('tabRegister')) document.getElementById('tabRegister').innerText = dict[currentLang].tabReg;
    if(document.getElementById('btnLoginSubmit')) document.getElementById('btnLoginSubmit').innerText = dict[currentLang].btnLogin;
    if(document.getElementById('btnRegSubmit')) document.getElementById('btnRegSubmit').innerText = dict[currentLang].btnReg;
    
    if(document.getElementById('loginEmail')) document.getElementById('loginEmail').placeholder = dict[currentLang].phEmail;
    if(document.getElementById('loginPassword')) document.getElementById('loginPassword').placeholder = dict[currentLang].phPass;
    if(document.getElementById('regFirstName')) document.getElementById('regFirstName').placeholder = dict[currentLang].phFName;
    if(document.getElementById('regLastName')) document.getElementById('regLastName').placeholder = dict[currentLang].phLName;
    if(document.getElementById('regEmail')) document.getElementById('regEmail').placeholder = dict[currentLang].phEmail;
    if(document.getElementById('regPassword')) document.getElementById('regPassword').placeholder = dict[currentLang].phPass;

    if(document.getElementById('t_salesSubtitle')) document.getElementById('t_salesSubtitle').innerText = dict[currentLang].salesSubtitle;
    if(document.getElementById('t_salesPoint1')) document.getElementById('t_salesPoint1').innerText = dict[currentLang].salesP1;
    if(document.getElementById('t_salesPoint2')) document.getElementById('t_salesPoint2').innerText = dict[currentLang].salesP2;
    if(document.getElementById('t_salesPoint3')) document.getElementById('t_salesPoint3').innerText = dict[currentLang].salesP3;
    if(document.getElementById('t_salesPriceSub')) document.getElementById('t_salesPriceSub').innerText = dict[currentLang].salesPriceSub;
    if(document.getElementById('btnBuyPremium')) document.getElementById('btnBuyPremium').innerText = dict[currentLang].btnBuy;

    if (document.getElementById('btnSalesToProfile')) {
        document.getElementById('btnSalesToProfile').innerText = currentUserProfile ? dict[currentLang].salesToProfile : (currentLang === 'EN' ? "Already have an account? Log in" : "Už máš účet? Prihlás sa");
    }

    updateMainBtnText();
}

function updateMainBtnText() {
    const btn = document.getElementById('mainBtn'); 
    if(!btn) return;
    if (currentState === 'PAUSED') btn.innerText = dict[currentLang].btnResume; 
    else if (currentState === 'RUNNING') btn.innerText = dict[currentLang].btnPause;
    else if (currentState === 'FINISHED') btn.innerText = dict[currentLang].btnNextBlock; 
    else btn.innerText = dict[currentLang].btnPause;
}

function checkOnboarding() {
    const infoBtn = document.getElementById('infoToggle');
    if (currentUserProfile && currentUserProfile.is_premium) {
        document.getElementById('onboardingView').classList.add('hidden');
        document.getElementById('lobbyView').classList.remove('hidden');
        if (infoBtn) {
            infoBtn.innerText = "★ PROFIL ★";
            infoBtn.classList.add('premium-active');
            infoBtn.style.backgroundColor = "";
            infoBtn.style.color = "";
            infoBtn.style.borderColor = "";
            infoBtn.style.fontWeight = "";
        }
    } else {
        document.getElementById('onboardingView').classList.remove('hidden');
        document.getElementById('lobbyView').classList.add('hidden');
        if (infoBtn) {
            if (!currentUserProfile) {
                infoBtn.innerText = currentLang === 'EN' ? "LOGIN" : "PRIHLÁSENIE";
                infoBtn.classList.remove('premium-active');
                infoBtn.style.backgroundColor = "";
                infoBtn.style.color = "";
                infoBtn.style.borderColor = "";
                infoBtn.style.fontWeight = "";
            } else {
                infoBtn.innerText = "GO PREMIUM";
                infoBtn.classList.remove('premium-active');
                infoBtn.style.backgroundColor = "#22c55e";
                infoBtn.style.color = "var(--bg-dark)";
                infoBtn.style.borderColor = "#22c55e";
                infoBtn.style.fontWeight = "700";
            }
        }
    }
}

function playSystemBeep(freq = 800, duration = 0.15) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playOscillator = (startTime, f, dur) => {
        const osc = audioCtx.createOscillator(), gainNode = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(f, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        osc.connect(gainNode); gainNode.connect(audioCtx.destination); osc.start(startTime); osc.stop(startTime + dur);
    };
    playOscillator(audioCtx.currentTime, freq, duration);
}

function showDevToast(message) {
    let toast = document.getElementById('devToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'devToast';
        toast.style.cssText = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:rgba(0,0,0,0.9); border:2px solid var(--gold); color:var(--gold); padding:15px 25px; border-radius:10px; font-family:'Oswald',sans-serif; font-size:1.2rem; z-index:9999; text-transform:uppercase; letter-spacing:1px; box-shadow:0 0 20px rgba(223,177,91,0.5); pointer-events:none; transition:opacity 0.3s ease;";
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

function saveAndGetStats(mins) {
    const isPremium = currentUserProfile && currentUserProfile.is_premium;
    
    if (!isPremium) {
        return { w: "★ PREMIUM ★", m: "★ PREMIUM ★" };
    }

    let history = JSON.parse(localStorage.getItem('ocheCoach_history')) || [];
    let now = new Date().getTime();
    if(mins > 0) { 
        history.push({ts: now, m: mins}); 
        localStorage.setItem('ocheCoach_history', JSON.stringify(history)); 
        
        if (currentUserProfile) {
            supabase.from('training_logs').insert([
                { player_id: currentUserProfile.id, duration: mins, focus: selectedFocus || 'General' }
            ]).then(({ error }) => {
                if (error) console.error("Chyba pri zápise tréningu do Supabase:", error.message);
            });
        }
    }
    let weekMins = 0, monthMins = 0;
    let oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    let currMonth = new Date().getMonth(), currYear = new Date().getFullYear();
    history.forEach(item => {
        if(item.ts >= oneWeekAgo) weekMins += item.m;
        let d = new Date(item.ts);
        if(d.getMonth() === currMonth && d.getFullYear() === currYear) monthMins += item.m;
    });
    const formatTime = (total) => { let h = Math.floor(total / 60); let m = total % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; };
    return { w: formatTime(weekMins), m: formatTime(monthMins) };
}

function showSummary() {
    releaseWakeLock();
    if (timerId) { clearInterval(timerId); timerId = null; }
    document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden'));
    
    let stats = saveAndGetStats(selectedTime);
    let isUlt = selectedTime === 180;
    const isPremium = currentUserProfile && currentUserProfile.is_premium;
    
    document.getElementById('t_summaryTitle').style.color = isUlt ? 'var(--gold)' : 'var(--copper)';
    
    const weekEl = document.getElementById('statWeekVal');
    const monthEl = document.getElementById('statMonthVal');
    const infoBtn = document.getElementById('infoToggle');
    
    weekEl.innerText = stats.w;
    monthEl.innerText = stats.m;
    
    if (!isPremium) {
        weekEl.style.color = "#22c55e";
        monthEl.style.color = "#22c55e";
        if (infoBtn) {
            infoBtn.style.backgroundColor = "#22c55e";
            infoBtn.style.color = "var(--bg-dark)";
            infoBtn.style.borderColor = "#22c55e";
            infoBtn.style.fontWeight = "700";
        }
    } else {
        weekEl.style.color = "var(--copper)";
        monthEl.style.color = "var(--copper)";
    }
    
    applyLanguage();
    
    document.getElementById('summaryView').classList.remove('hidden');
    document.getElementById('langToggle').classList.remove('hidden'); 
    document.getElementById('infoToggle').classList.remove('hidden');
}

function resetToLobby() {
    releaseWakeLock();
    if (timerId) { clearInterval(timerId); timerId = null; }
    document.querySelectorAll('.app-container').forEach(el => el.classList.add('hidden')); 
    document.getElementById('lobbyView').classList.remove('hidden');
    document.getElementById('langToggle').classList.remove('hidden'); 
    document.getElementById('infoToggle').classList.remove('hidden');
    document.getElementById('timerDisplay').classList.remove('hidden');
    if(document.getElementById('coachTipBox')) { document.getElementById('coachTipBox').classList.add('invisible'); document.getElementById('coachTipBox').classList.remove('hidden'); }
    if(document.getElementById('completionRing')) { document.getElementById('completionRing').classList.add('hidden'); document.getElementById('completionRing').classList.remove('ring-animate'); }
    selectedTime = null; selectedFocus = null; currentState = 'READY'; document.querySelectorAll('.tile').forEach(t => t.classList.remove('active')); document.getElementById('enterBtn').setAttribute('disabled', 'true'); updateTimerUI();
    
    const infoBtn = document.getElementById('infoToggle');
    if (infoBtn && (!currentUserProfile || !currentUserProfile.is_premium)) {
        infoBtn.style.backgroundColor = "";
        infoBtn.style.color = "";
        infoBtn.style.borderColor = "";
        infoBtn.style.fontWeight = "";
    }
    
    applyFreemiumLocks();
}

function setupEventListeners() {
    document.getElementById('langToggle').addEventListener('click', () => { currentLang = currentLang === 'EN' ? 'SK' : 'EN'; applyLanguage(); if(selectedFocus) updateHintTexts(); });
    
    document.getElementById('btnSalesToProfile').addEventListener('click', async (e) => {
        e.preventDefault();
        document.getElementById('salesModal').classList.add('hidden');
        if (currentUserProfile) {
            await supabase.auth.signOut();
            window.location.reload(); 
        } else {
            document.getElementById('authModal').classList.remove('hidden');
            document.getElementById('authMessage').innerText = "";
            document.getElementById('tabLogin').click();
        }
    });

    document.getElementById('closeSalesBtn').addEventListener('click', () => {
        document.getElementById('salesModal').classList.add('hidden');
    });

    document.getElementById('btnBuyPremium').addEventListener('click', () => {
        if (!currentUserProfile) {
            document.getElementById('salesModal').classList.add('hidden');
            document.getElementById('authModal').classList.remove('hidden');
            document.getElementById('authMessage').innerText = "";
            document.getElementById('tabRegister').click();
        } else {
            const stripeLink = "https://buy.stripe.com/test_14A6oJb5wdlh1cM0oVafS00"; 
            const checkoutUrl = `${stripeLink}?client_reference_id=${currentUserProfile.id}`;
            window.location.href = checkoutUrl;
        }
    });

    document.getElementById('infoToggle').addEventListener('click', async (e) => { 
        e.preventDefault(); 
        
        if (!currentUserProfile) {
            document.getElementById('authModal').classList.remove('hidden');
            document.getElementById('authMessage').innerText = "";
        } else if (currentUserProfile && !currentUserProfile.is_premium) {
            document.getElementById('salesModal').classList.remove('hidden');
        } else {
            document.getElementById('t_profWeek').innerText = dict[currentLang].profWeek;
            document.getElementById('t_profMonth').innerText = dict[currentLang].profMonth;
            document.getElementById('t_profTotal').innerText = dict[currentLang].profTotal;
            document.getElementById('btnLogout').innerText = dict[currentLang].profLogOut;
            
            document.getElementById('profName').innerText = `${currentUserProfile.first_name || ''} ${currentUserProfile.last_name || ''}`;
            document.getElementById('profEmail').innerText = currentUserProfile.email || '';
            
            const statusBox = document.getElementById('profStatusBox');
            const statusText = document.getElementById('profStatus');
            const daysText = document.getElementById('profDays');
            
            statusBox.style.borderColor = "var(--gold)";
            statusText.style.color = "var(--gold)";
            statusText.innerText = "★ PREMIUM ★";
            
            if (currentUserProfile.premium_until) {
                const pUntil = new Date(currentUserProfile.premium_until);
                const diffDays = Math.ceil((pUntil - new Date()) / (1000 * 60 * 60 * 24));
                daysText.innerText = diffDays > 0 ? `${dict[currentLang].profRemains}${diffDays}${dict[currentLang].profDaysTxt}` : dict[currentLang].profExpired;
            } else {
                daysText.innerText = "LIFETIME";
            }
            
            document.getElementById('profWeekVal').innerText = "...";
            document.getElementById('profMonthVal').innerText = "...";
            document.getElementById('profTotalVal').innerText = "...";
            document.getElementById('profileModal').classList.remove('hidden');
            
            const { data } = await supabase.from('training_logs').select('duration, created_at').eq('player_id', currentUserProfile.id);
            if (data) {
                let w=0, m=0, t=0;
                const now = new Date();
                const oneWeekAgo = now.getTime() - (7*24*60*60*1000);
                
                data.forEach(row => {
                    let dur = row.duration || 0;
                    let d = new Date(row.created_at);
                    t += dur;
                    if (d.getTime() >= oneWeekAgo) w += dur;
                    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) m += dur;
                });
                
                const fmt = (mins) => { let hr = Math.floor(mins/60); return hr>0 ? `${hr}h ${mins%60}m` : `${mins}m`; };
                document.getElementById('profWeekVal').innerText = fmt(w);
                document.getElementById('profMonthVal').innerText = fmt(m);
                document.getElementById('profTotalVal').innerText = fmt(t);
            } else {
                document.getElementById('profWeekVal').innerText = "0m";
                document.getElementById('profMonthVal').innerText = "0m";
                document.getElementById('profTotalVal').innerText = "0m";
            }
        }
    });

    document.getElementById('closeProfileBtn').addEventListener('click', () => {
        document.getElementById('profileModal').classList.add('hidden');
    });

    document.getElementById('btnLogout').addEventListener('click', async (e) => {
        e.preventDefault();
        await supabase.auth.signOut();
        window.location.reload(); 
    });
    
    document.getElementById('btnUnderstand').addEventListener('click', () => { 
        document.getElementById('onboardingView').classList.add('hidden'); 
        document.getElementById('lobbyView').classList.remove('hidden'); 
        applyFreemiumLocks();
    });

    const btnPremium = document.getElementById('btnPremiumLogin');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const resetForm = document.getElementById('resetForm');
    const authMessage = document.getElementById('authMessage');
    const btnShowReset = document.getElementById('btnShowReset');

    if (btnPremium) {
        btnPremium.addEventListener('click', () => {
            openSalesModal();
        });
    }

    closeAuthBtn.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        resetForm.classList.add('hidden');
        authMessage.innerText = "";
    });

    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        resetForm.classList.add('hidden');
        authMessage.innerText = "";
    });

    btnShowReset.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        resetForm.classList.remove('hidden');
        authMessage.innerText = "";
    });

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        authMessage.innerText = dict[currentLang].msgProcessing;
        authMessage.style.color = "var(--text-dim)";

        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            authMessage.innerText = dict[currentLang].msgErrReset;
            authMessage.style.color = "var(--color-red)";
        } else {
            authMessage.innerText = dict[currentLang].msgResetSent;
            authMessage.style.color = "#22c55e";
            setTimeout(() => { tabLogin.click(); }, 3000);
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fName = document.getElementById('regFirstName').value;
        const lName = document.getElementById('regLastName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const passConfirm = document.getElementById('regPasswordConfirm').value;
        
        if (password !== passConfirm) {
            authMessage.innerText = dict[currentLang].msgPassMismatch;
            authMessage.style.color = "var(--color-red)";
            return;
        }

        authMessage.innerText = dict[currentLang].msgProcessing;
        authMessage.style.color = "var(--text-dim)";

        const { data, error } = await supabase.auth.signUp({
            email: email, password: password, options: { data: { first_name: fName, last_name: lName } }
        });

        if (error) {
            authMessage.innerText = error.message; 
            authMessage.style.color = "var(--color-red)";
        } else {
            if (data && data.user) {
                sparujDCID(data.user.id, fName, lName, email);
            }

            authMessage.innerText = dict[currentLang].msgCreated;
            authMessage.style.color = "#22c55e"; 
            setTimeout(() => {
                authModal.classList.add('hidden');
                document.getElementById('onboardingView').classList.add('hidden');
                document.getElementById('lobbyView').classList.remove('hidden');
            }, 1500);
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        authMessage.innerText = dict[currentLang].msgCheck;
        authMessage.style.color = "var(--text-dim)";

        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            authMessage.innerText = dict[currentLang].msgErrLogin;
            authMessage.style.color = "var(--color-red)";
        } else {
            authMessage.innerText = dict[currentLang].msgSuccess;
            authMessage.style.color = "#22c55e";
            setTimeout(() => {
                authModal.classList.add('hidden');
                document.getElementById('onboardingView').classList.add('hidden');
                document.getElementById('lobbyView').classList.remove('hidden');
                applyFreemiumLocks();
            }, 1000);
        }
    });

    const durationTitle = document.getElementById('t_duration');
    if (durationTitle) {
        durationTitle.style.cursor = "pointer";
        durationTitle.addEventListener('dblclick', () => {
            if (TIME_MULTIPLIER === 1) {
                TIME_MULTIPLIER = 60;
                playSystemBeep(1200, 0.1); setTimeout(() => playSystemBeep(1600, 0.1), 120);
                showDevToast("DEV MODE: 60x SPEED");
            } else {
                TIME_MULTIPLIER = 1;
                playSystemBeep(600, 0.2);
                showDevToast("REAL TIME MODE: 1x");
            }
        });
    }

    document.querySelectorAll('.time-tile').forEach(tile => {
        tile.addEventListener('click', function() {
            if (this.classList.contains('disabled')) {
                openSalesModal();
                return;
            }
            document.querySelectorAll('.tourney-tile').forEach(t => t.classList.remove('active')); 
            document.querySelectorAll('.time-tile').forEach(t => t.classList.remove('active')); 
            this.classList.add('active');
            
            selectedTime = parseInt(this.getAttribute('data-val')); 
            const mixTile = document.getElementById('mixTile');
            window.isTourneySeq = false;
            
            const isPremium = currentUserProfile && currentUserProfile.is_premium;
    
            if (selectedTime >= 60) { 
                document.querySelectorAll('.focus-tile').forEach(f => { f.classList.remove('active'); if (f.id !== 'mixTile') f.classList.add('disabled'); }); 
                mixTile.classList.remove('disabled'); mixTile.classList.add('active'); selectedFocus = 'Mix'; 
            } else { 
                document.querySelectorAll('.focus-tile').forEach(f => { 
                    if (f.id === 'mixTile' && !isPremium) {
                        f.classList.add('disabled');
                    } else {
                        f.classList.remove('disabled');
                    }
                }); 
            } 
            checkRequirements();
        });
    });

    document.querySelectorAll('.focus-tile').forEach(tile => { 
        tile.addEventListener('click', function() { 
            if (this.classList.contains('disabled')) { openSalesModal(); return; }
            document.querySelectorAll('.tourney-tile').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.focus-tile').forEach(f => f.classList.remove('active')); 
            this.classList.add('active'); selectedFocus = this.getAttribute('data-val'); checkRequirements(); 
        }); 
    });

    document.getElementById('warmUpSeqBtn').addEventListener('click', function() { 
        document.querySelectorAll('.tile').forEach(t => t.classList.remove('active')); 
        this.classList.add('active'); 
        selectedTime = 15; 
        selectedFocus = 'Tournament'; 
        window.isTourneySeq = true; 
        checkRequirements(); 
    });

    document.getElementById('enterBtn').addEventListener('click', () => {
        requestWakeLock();
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        currentActiveGames = gamesDB[selectedFocus]; 
        
        if (selectedTime === 30) currentBlockPlan = [10, 10, 10]; 
        else if (selectedTime === 45) currentBlockPlan = [10, 10, 10, 15]; 
        else if (selectedTime === 60) currentBlockPlan = [10, 10, 10, 15, 15]; 
        else if (selectedTime === 90) currentBlockPlan = [10, 10, 10, 15, 15, 15, 15]; 
        else if (selectedTime === 180) currentBlockPlan = [10, 10, 10, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]; 
        else if (selectedFocus === 'Tournament') currentBlockPlan = [10, 5]; 
        else currentBlockPlan = [15];
        
        currentBlockIndex = 0;
        currentGameIndex = getSmartGameIndex(currentActiveGames, currentBlockPlan[currentBlockIndex], -1);
        updateHintTexts();
        
        if (window.isTourneySeq) document.getElementById('btnChangeGame').classList.add('hidden');
        else document.getElementById('btnChangeGame').classList.remove('hidden');

        document.getElementById('lobbyView').classList.add('hidden'); 
        document.getElementById('hintView').classList.remove('hidden'); 
        document.getElementById('langToggle').classList.add('hidden'); 
        document.getElementById('infoToggle').classList.add('hidden');
    });

    document.querySelector('.back-trigger').addEventListener('click', () => { 
        document.getElementById('hintView').classList.add('hidden'); 
        document.getElementById('lobbyView').classList.remove('hidden'); 
        document.getElementById('langToggle').classList.remove('hidden'); 
        document.getElementById('infoToggle').classList.remove('hidden'); 
    });

    document.getElementById('btnChangeGame').addEventListener('click', () => { 
        let bm = currentBlockPlan[currentBlockIndex];
        let attempts = 0;
        do { 
            currentGameIndex = (currentGameIndex + 1) % currentActiveGames.length; attempts++; 
        } while (attempts < currentActiveGames.length && (currentActiveGames[currentGameIndex].en_title === "MasterCaller" || currentActiveGames[currentGameIndex].en_title === "Game 201 DO") && bm !== 15 && bm !== 20);
        updateHintTexts(); 
    });

    document.getElementById('hintReadyBtn').addEventListener('click', () => {
        const game = currentActiveGames[currentGameIndex];
        document.getElementById('blockCategory').innerText = selectedFocus.toUpperCase(); 
        document.getElementById('blockTitle').innerText = currentLang === 'EN' ? game.en_title : game.sk_title; 
        document.getElementById('blockShortInstructions').innerText = currentLang === 'EN' ? game.en_short : game.sk_short;
        
        document.getElementById('hintView').classList.add('hidden'); 
        document.getElementById('timerView').classList.remove('hidden'); 
        document.getElementById('timerDisplay').classList.remove('hidden');
        
        if(document.getElementById('coachTipBox')) { document.getElementById('coachTipBox').classList.add('invisible'); document.getElementById('coachTipBox').classList.remove('hidden'); }
        if(document.getElementById('completionRing')) { document.getElementById('completionRing').classList.add('hidden'); document.getElementById('completionRing').classList.remove('ring-animate'); }
        
        let blockMins = currentBlockPlan[currentBlockIndex]; 
        timeLeft = (blockMins * 60) / TIME_MULTIPLIER; 
        timePassedInBlock = 0;
        
        currentTargets = game.targets || [];
        currentTargetIndex = 0;
        
        const targetDisp = document.getElementById('activeTargetDisplay');
        if (currentTargets.length > 0) {
            let tText = currentTargets[0];
            targetDisp.innerText = tText;
            targetDisp.classList.remove('hidden');
            if (currentTargets.length > 1) {
                let totalSeconds = (blockMins * 60) / TIME_MULTIPLIER;
                targetInterval = totalSeconds / currentTargets.length;
            } else {
                targetInterval = 0;
            }
        } else {
            targetDisp.classList.add('hidden');
            targetInterval = 0;
        }
        
        currentState = 'RUNNING'; 
        startTimer();
    });

    document.getElementById('mainBtn').addEventListener('click', () => {
        if (currentState === 'RUNNING') { clearInterval(timerId); currentState = 'PAUSED'; updateTimerUI(); } 
        else if (currentState === 'PAUSED') { currentState = 'RUNNING'; startTimer(); } 
        else if (currentState === 'FINISHED') {
            currentBlockIndex++;
            if (currentBlockIndex >= currentBlockPlan.length) showSummary();
            else {
                currentGameIndex = getSmartGameIndex(currentActiveGames, currentBlockPlan[currentBlockIndex], currentGameIndex); 
                updateHintTexts();
                document.getElementById('timerView').classList.add('hidden'); 
                document.getElementById('hintView').classList.remove('hidden'); 
                document.getElementById('timerDisplay').classList.remove('hidden');
                if(document.getElementById('coachTipBox')) { document.getElementById('coachTipBox').classList.add('invisible'); document.getElementById('coachTipBox').classList.remove('hidden'); }
                if(document.getElementById('completionRing')) { document.getElementById('completionRing').classList.add('hidden'); document.getElementById('completionRing').classList.remove('ring-animate'); }
            }
        }
    });

    document.querySelectorAll('.exit-trigger').forEach(trigger => trigger.addEventListener('click', resetToLobby));
    document.getElementById('btnDone').addEventListener('click', resetToLobby);
}

function getSmartGameIndex(list, blockMins, prevIndex) {
    if (window.isTourneySeq) return currentBlockIndex;
    
    if (!window.playedSessionGames) {
        window.playedSessionGames = [];
    }

    let progress = currentBlockPlan.length > 1 ? currentBlockIndex / (currentBlockPlan.length - 1) : 0;
    let targetPhase = 1;
    if (progress > 0.75) targetPhase = 4;
    else if (progress > 0.50) targetPhase = 3;
    else if (progress > 0.20) targetPhase = 2;
    
    let valid = [];
    for (let i = 0; i < list.length; i++) {
        if (!list[i].phases.includes(targetPhase)) continue;
        if ((list[i].en_title === "MasterCaller" || list[i].en_title === "Game 201 DO") && blockMins !== 15 && blockMins !== 20) continue;
        if (selectedFocus === 'Mix' && currentBlockIndex > 0 && gamesDB['Tournament'].includes(list[i])) continue;
        valid.push(i);
    }
    
    if (valid.length === 0) {
        for (let i = 0; i < list.length; i++) {
            if ((list[i].en_title === "MasterCaller" || list[i].en_title === "Game 201 DO") && blockMins !== 15 && blockMins !== 20) continue;
            if (selectedFocus === 'Mix' && currentBlockIndex > 0 && gamesDB['Tournament'].includes(list[i])) continue;
            valid.push(i);
        }
    }

    let unplayed = valid.filter(i => !window.playedSessionGames.includes(i));
    
    if (unplayed.length === 0) {
        window.playedSessionGames = window.playedSessionGames.filter(id => !valid.includes(id));
        unplayed = valid;
    }
    
    let chosen = unplayed[Math.floor(Math.random() * unplayed.length)];
    window.playedSessionGames.push(chosen);
    return chosen;
}

function checkRequirements() { 
    if (selectedTime && selectedFocus && isDbLoaded) document.getElementById('enterBtn').removeAttribute('disabled'); 
    else document.getElementById('enterBtn').setAttribute('disabled', 'true'); 
}

function openSalesModal() {
    if (currentUserProfile) {
        if(document.getElementById('btnSalesToProfile')) document.getElementById('btnSalesToProfile').innerText = dict[currentLang].salesToProfile;
    } else {
        if(document.getElementById('btnSalesToProfile')) document.getElementById('btnSalesToProfile').innerText = currentLang === 'EN' ? "Already have an account? Log in" : "Už máš účet? Prihlás sa";
    }
    document.getElementById('salesModal').classList.remove('hidden');
}

function applyFreemiumLocks() {
    const isPremium = currentUserProfile && currentUserProfile.is_premium;
    
    document.querySelectorAll('.time-tile').forEach(tile => {
        const val = parseInt(tile.getAttribute('data-val'));
        if (val > 30 && !isPremium) {
            tile.classList.add('disabled');
            if (tile.classList.contains('active')) {
                tile.classList.remove('active');
                selectedTime = null;
            }
        } else {
            tile.classList.remove('disabled');
        }
    });

    const mixTile = document.getElementById('mixTile');
    if (mixTile) {
        if (!isPremium) {
            mixTile.classList.add('disabled');
            if (mixTile.classList.contains('active')) {
                mixTile.classList.remove('active');
                if (selectedFocus === 'Mix') selectedFocus = null;
            }
        } else {
            mixTile.classList.remove('disabled');
        }
    }
    
    checkRequirements();
}

function updateHintTexts() { 
    if(currentActiveGames.length === 0 || !currentActiveGames[currentGameIndex]) return; 
    const g = currentActiveGames[currentGameIndex]; 
    document.getElementById('hintCategory').innerText = selectedFocus.toUpperCase(); 
    document.getElementById('hintTitle').innerText = currentLang === 'EN' ? g.en_title : g.sk_title; 
    document.getElementById('hintLongText').innerText = currentLang === 'EN' ? g.en_long : g.sk_long; 
}

function startTimer() {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        timeLeft--; timePassedInBlock++;
        
        if (timeLeft > 0 && targetInterval > 0) {
            let expectedIndex = Math.floor(timePassedInBlock / targetInterval);
            if (expectedIndex > currentTargetIndex && expectedIndex < currentTargets.length) {
                currentTargetIndex = expectedIndex;
                let targetDisp = document.getElementById('activeTargetDisplay');
                let tText = currentTargets[currentTargetIndex];
                targetDisp.innerText = tText;
                playSystemBeep(800, 0.15); setTimeout(() => playSystemBeep(800, 0.15), 200);
            }
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerId); timerId = null; timeLeft = 0; currentState = 'ZERO_WAIT'; updateTimerUI();
            bellSound.volume = 1.0; bellSound.play().catch(e => console.log(e));
            setTimeout(() => { 
                if (currentBlockIndex >= currentBlockPlan.length - 1) {
                    showSummary(); 
                } else { 
                    currentState = 'FINISHED'; updateTimerUI(); 
                }
            }, 3000);
        } else updateTimerUI();
    }, 1000);
    updateTimerUI();
}

function updateTimerUI() {
    const disp = document.getElementById('timerDisplay'), tip = document.getElementById('coachTipBox'), ring = document.getElementById('completionRing'), btn = document.getElementById('mainBtn'), targetDisp = document.getElementById('activeTargetDisplay');
    if (!disp) return; 
    let t = TIME_MULTIPLIER !== 1 && currentState !== 'FINISHED' ? timeLeft * TIME_MULTIPLIER : timeLeft;
    disp.innerText = `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`;
  
    if (currentState === 'FINISHED') { 
        document.getElementById('blockShortInstructions').classList.add('invisible'); 
        disp.classList.add('hidden'); 
        if(ring) ring.classList.add('hidden'); 
        if(targetDisp) targetDisp.classList.add('hidden'); 
        if(tip) { 
            tip.classList.remove('hidden');
            if(selectedFocus === 'Tournament') tip.classList.add('invisible'); 
            else tip.classList.remove('invisible'); 
        } 
        btn.style.visibility = 'visible'; 
    }
    else if (currentState === 'ZERO_WAIT') { 
        document.getElementById('blockShortInstructions').classList.remove('invisible'); 
        disp.classList.remove('hidden'); 
        if(tip) { tip.classList.remove('hidden'); tip.classList.add('invisible'); } 
        if(targetDisp) targetDisp.classList.add('hidden'); 
        if(ring) { ring.classList.remove('hidden'); void ring.offsetWidth; ring.classList.add('ring-animate'); } 
        btn.style.visibility = 'hidden'; 
    } 
    else { 
        document.getElementById('blockShortInstructions').classList.remove('invisible'); 
        disp.classList.remove('hidden'); 
        if(tip) { tip.classList.remove('hidden'); tip.classList.add('invisible'); } 
        if(targetDisp && currentTargets.length > 0) targetDisp.classList.remove('hidden'); 
        if(ring) { ring.classList.add('hidden'); ring.classList.remove('ring-animate'); } 
        btn.style.visibility = 'visible'; 
    }
  
    if (timeLeft <= (10 / TIME_MULTIPLIER) && timeLeft > 0) disp.className = timeLeft > (5 / TIME_MULTIPLIER) ? 'timer alert-pulse' : 'timer red-zone'; else disp.className = 'timer';
    if (currentState === 'PAUSED') disp.classList.add('paused'); else disp.classList.remove('paused');
    updateMainBtnText();
}

function loadDatabase() {
    fetch(CSV_URL)
    .then(response => response.text())
    .then(csvText => {
        let rows = parseCSV(csvText);
        for(let i = 1; i < rows.length; i++) {
            let r = rows[i];
            if(r.length < 7 || !r[0]) continue; 
            
            let rawCat = r[0].trim().toUpperCase();
            let cat = "";
            
            if (rawCat === "TOURNAMENT WARM-UP") cat = "Tournament";
            else if (rawCat === "SINGLES") cat = "Singles";
            else if (rawCat === "SCORING") cat = "Scoring";
            else if (rawCat === "DOUBLES") cat = "Doubles";
            else if (rawCat === "CHECKOUTS") cat = "Checkouts";
            else continue; 
            
            let targetsRaw = r.length > 7 && r[7] ? r[7].trim() : "";
            let targetsArr = targetsRaw ? targetsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
            
            let phasesRaw = r.length > 8 && r[8] ? r[8].trim() : "";
            let phasesArr = phasesRaw ? phasesRaw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : [1, 2, 3, 4];
            
            gamesDB[cat].push({
                en_title: r[1].trim(), sk_title: r[2].trim(),
                en_short: r[3].trim(), sk_short: r[4].trim(),
                en_long: r[5].trim(), sk_long: r[6].trim(),
                targets: targetsArr,
                phases: phasesArr
            });
        }
        
        gamesDB['Mix'] = [].concat(gamesDB['Tournament'], gamesDB['Singles'], gamesDB['Scoring'], gamesDB['Doubles'], gamesDB['Checkouts']);
        isDbLoaded = true;
        checkRequirements(); 
        console.log("OCHE COACH Database successfully loaded from Google Sheets!");
    })
    .catch(err => {
        console.error("Database Load Error:", err);
    });
}

function parseCSV(str) {
    const arr = []; let quote = false;
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || []; arr[row][col] = arr[row][col] || '';
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
        if (cc == '"') { quote = !quote; continue; }
        if (cc == ',' && !quote) { ++col; continue; }
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }
        arr[row][col] += cc;
    }
    return arr;
}

async function sparujDCID(userId, firstName, lastName, email) {
    try {
        const MASTER_USERS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWWdHKHJ8Te8u3ddgaXLlqAEmFHkgBQj3I8YByX5nkYp2LTIt6twgsCRtVel7sp3ueWpOaeTEmP34s/pub?gid=0&single=true&output=csv";
        
        const normalize = (str) => {
            if (!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
        };

        const normalizeEmail = (mail) => {
            if (!mail) return "";
            let cleaned = mail.toLowerCase().trim();
            if (cleaned.includes('@gmail.com')) {
                let parts = cleaned.split('@');
                parts[0] = parts[0].replace(/\./g, '');
                cleaned = parts.join('@');
            }
            return cleaned;
        };

        const getEditDistance = (a, b) => {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;
            const matrix = [];
            for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
            for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                    }
                }
            }
            return matrix[b.length][a.length];
        };

        const userEmail = normalizeEmail(email);
        const userFullName = normalize(firstName) + normalize(lastName);
        const userFullNameRev = normalize(lastName) + normalize(firstName); 

        const response = await fetch(MASTER_USERS_URL);
        if (!response.ok) return; 

        const csvText = await response.text();
        const rows = parseCSV(csvText);

        let matchedDcId = null;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 4 || !row[2]) continue; 
            
            const rowDcId = row[2].trim();
            const rowEmail = normalizeEmail(row[3]);
            const rowFullName = normalize(row[1]) + normalize(row[0]);

            if (userEmail && rowEmail && userEmail === rowEmail) {
                matchedDcId = rowDcId;
                break;
            }
            
            if (userFullName === rowFullName || userFullNameRev === rowFullName) {
                matchedDcId = rowDcId;
                break;
            }
        }

        if (!matchedDcId && userFullName.length > 5) {
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length < 4 || !row[2]) continue;
                
                const rowDcId = row[2].trim();
                const rowFullName = normalize(row[1]) + normalize(row[0]);
                
                const dist1 = getEditDistance(userFullName, rowFullName);
                const dist2 = getEditDistance(userFullNameRev, rowFullName);
                
                if (dist1 <= 2 || dist2 <= 2) {
                    matchedDcId = rowDcId;
                    break;
                }
            }
        }

        if (matchedDcId) {
            let attempts = 0;
            const maxAttempts = 5;
            let errorOccurred = true;

            while (errorOccurred && attempts < maxAttempts) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 600));

                const { error } = await supabase
                    .from('profiles')
                    .update({ dc_id: matchedDcId })
                    .eq('id', userId);

                if (!error) {
                    errorOccurred = false;
                }
            }
        }
    } catch (error) {
        console.error("Chyba párovania:", error);
    }
}

// --- PWA INSTALL BANNER LOGIKA ---
let isAppInstalled = localStorage.getItem('ocheCoach_installed') === 'true';
let installBannerShown = false;
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: fullscreen)').matches || 
                         window.matchMedia('(display-mode: minimal-ui)').matches || 
                         window.navigator.standalone;
    
    // Ak je appka na ploche, alebo je už v pamäti označená ako nainštalovaná -> blokujeme banner
    if (isStandalone || isAppInstalled || installBannerShown) return; 
    
    deferredPrompt = e;
    installBannerShown = true;
    
    const pwaInstallModal = document.getElementById('pwaInstallModal');
    if (pwaInstallModal) {
        // Počkáme 3 sekundy po načítaní appky, nech to nevyskočí hneď do tváre
        setTimeout(() => {
            pwaInstallModal.classList.remove('hidden');
            setTimeout(() => { pwaInstallModal.style.transform = 'translate(-50%, 0)'; }, 50);
        }, 3000); 
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const pwaInstallModal = document.getElementById('pwaInstallModal');
    const closeInstallBtn = document.getElementById('closeInstallBtn');
    const btnInstallConfirm = document.getElementById('btnInstallConfirm'); // Opravené priradenie premennej
    
    const isStandaloneNow = window.matchMedia('(display-mode: standalone)').matches || 
                            window.matchMedia('(display-mode: fullscreen)').matches || 
                            window.matchMedia('(display-mode: minimal-ui)').matches || 
                            window.navigator.standalone || 
                            isAppInstalled;
    
    if (pwaInstallModal) {
        if (isStandaloneNow) {
            pwaInstallModal.remove(); // Úplne odstráni HTML bannera, ak sme v appke
        } else {
            pwaInstallModal.classList.add('hidden');
        }
    }

    if (btnInstallConfirm) {
        btnInstallConfirm.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem('ocheCoach_installed', 'true');
                    isAppInstalled = true;
                }
                deferredPrompt = null;
            }
            
            if (pwaInstallModal) {
                pwaInstallModal.style.transform = 'translate(-50%, 150%)';
                setTimeout(() => { pwaInstallModal.classList.add('hidden'); }, 400);
            }
        });
    }

    if (closeInstallBtn) {
        closeInstallBtn.addEventListener('click', () => {
            if (pwaInstallModal) {
                pwaInstallModal.style.transform = 'translate(-50%, 150%)';
                setTimeout(() => { pwaInstallModal.classList.add('hidden'); }, 400);
            }
        });
    }
});

window.addEventListener('appinstalled', () => {
    localStorage.setItem('ocheCoach_installed', 'true');
    isAppInstalled = true;
    installBannerShown = true;
    
    const pwaInstallModal = document.getElementById('pwaInstallModal');
    if (pwaInstallModal) pwaInstallModal.remove();
    deferredPrompt = null;
});

// START APLIKÁCIE
loadDatabase();