// Status time
const t = new Date();
document.getElementById('statusTime').textContent =
  `${((t.getHours()%12)||12)}:${String(t.getMinutes()).padStart(2,'0')}`;

// ==========================================
// PREMIUM ANIMATION UTILITIES
// ==========================================

// Ripple effect on tap
function addRippleEffect(e) {
  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  
  const ripple = document.createElement('span');
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'ripple';
  
  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// Add stagger animation to elements
function addStaggerAnimation(elements, delay = 50) {
  elements.forEach((el, i) => {
    el.style.animation = `fadeUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay * i}ms both`;
  });
}

// Smooth scroll to element
function smoothScroll(element, offset = 0) {
  const top = element.offsetTop - offset;
  document.querySelector('.screen.active')?.scrollTo({
    top: top,
    behavior: 'smooth'
  });
}

// Add glow effect on hover
function addGlowOnHover(element) {
  element.addEventListener('mouseenter', () => {
    element.style.boxShadow = 'var(--shadow-lg), 0 0 30px rgba(124,58,237,0.3)';
  });
  element.addEventListener('mouseleave', () => {
    element.style.boxShadow = '';
  });
}

// ==========================================
// INDEXEDDB OFFLINE PDF CACHE SYSTEM
// ==========================================
const DB_NAME = 'EvidyaOfflineCache';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_notes';

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

function cachePDF(pdfUrl, blob) {
  return openOfflineDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, pdfUrl);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }).catch(e => {
    console.error("IndexedDB cache put error:", e);
    return false;
  });
}

function getCachedPDF(pdfUrl) {
  return openOfflineDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(pdfUrl);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }).catch(e => {
    console.error("IndexedDB cache get error:", e);
    return null;
  });
}

// ==========================================
// REUSABLE PDF RESOLVER HELPER (Classes 5-12)
// ==========================================
function getPdfFile(className, subject, language) {
  const cls = String(className).trim();
  const subj = subject.toLowerCase().trim();
  let lang = language.toUpperCase().trim();
  
  let fileLang = lang.toLowerCase();
  if (fileLang === 'hi') fileLang = 'hindi';
  
  let subKey = '';
  if (subj.includes('math')) subKey = 'math';
  else if (subj.includes('biol')) subKey = 'biology';
  else if (subj.includes('phys') || subj.includes('science')) subKey = 'physics';
  else if (subj.includes('eng')) subKey = 'en';
  
  const notesFileMapping = {
    "5": {
      "math_en": "Notes/class5/math_en.pdf",
      "math_bn": "Notes/class5/math_bn.pdf",
      "en_en": "Notes/class5/en.pdf"
    },
    "6": {
      "biology_en": "Notes/class6/biology_en.pdf",
      "biology_bn": "Notes/class6/biology_bn.pdf",
      "biology_hindi": "Notes/class6/biology_hindi.pdf",
      "physics_en": "Notes/class6/physics_en.pdf",
      "physics_bn": "Notes/class6/physics_bn.pdf",
      "physics_hindi": "Notes/class6/physics_hindi.pdf"
    },
    "7": {
      "biology_en": "Notes/class7/Biology_en.pdf",
      "biology_bn": "Notes/class7/Biology_Bn.pdf",
      "biology_hindi": "Notes/class7/Biology_Hindi.pdf",
      "physics_en": "Notes/class7/Physics_en.pdf",
      "physics_bn": "Notes/class7/physics_bn.pdf",
      "physics_hindi": "Notes/class7/physics_hindi.pdf"
    },
    "8": {
      "biology_en": "Notes/class8/Biology_en.pdf",
      "physics_en": "Notes/class8/physics_en.pdf",
      "physics_bn": "Notes/class8/physics_bn.pdf",
      "physics_hindi": "Notes/class8/physics_hindi.pdf"
    },
    "10": {
      "biology_bn": "Notes/class10/biology_bn.pdf",
      "biology_hindi": "Notes/class10/biology_hindi.pdf"
    }
  };
  
  const key = `${subKey}_${fileLang}`;
  if (notesFileMapping[cls] && notesFileMapping[cls][key]) {
    return notesFileMapping[cls][key];
  }
  
  return null;
}


// ==========================================
// SCREEN NAVIGATION
// ==========================================
const screens = document.querySelectorAll('.screen');
const navItems = document.querySelectorAll('.nav-item');
const bottomNav = document.getElementById('bottomNav');

const NAV_SCREENS = ['home','notes','tutor','progress','profile','downloads'];

function go(name){
  screens.forEach(s => s.classList.toggle('active', s.dataset.screen === name));
  // Update bottom nav active state
  navItems.forEach(n => n.classList.toggle('active', n.dataset.go === name));
  
  // Highlight Notes icon in bottom-nav if on Downloads page
  if (name === 'downloads') {
    const notesNav = document.querySelector('.nav-item[data-go="notes"]');
    if (notesNav) notesNav.classList.add('active');
  }

  // Hide bottom nav on splash/onboarding/auth
  const hideNav = ['splash','onboarding','auth'].includes(name);
  bottomNav.style.display = hideNav ? 'none' : 'flex';
  
  // scroll top
  const active = document.querySelector('.screen.active');
  if(active) active.scrollTop = 0;

  // Onboarding reset to first slide when entering
  if (name === 'onboarding') {
    obIdx = 0;
    if (track) {
      track.scrollLeft = 0;
      updateActiveSlide(0);
    }
  }

  // Render trigger
  if (name === 'notes') {
    initNotesModule();
  } else if (name === 'downloads') {
    renderDownloadsScreen();
  } else if (name === 'progress') {
    initProgressModule();
  } else if (name === 'quiz') {
    initQuizModule();
  } else if (name === 'assignments') {
    initAssignmentsModule();
  } else if (name === 'notifications') {
    initNotificationsModule();
  }
}

document.body.addEventListener('click', (e)=>{
  const el = e.target.closest('[data-go]');
  if(el){ go(el.dataset.go); }
});

// Splash auto-advance
setTimeout(()=> go('onboarding'), 2200);

// Onboarding Slider Control and Reveals
const track = document.getElementById('obTrack');
const dots = document.querySelectorAll('#obDots .dot');
const obNext = document.getElementById('obNext');
let obIdx = 0;

function updateActiveSlide(idx) {
  if (!track) return;
  const slides = track.querySelectorAll('.ob-slide');
  slides.forEach((slide, i) => {
    slide.classList.toggle('active-slide', i === idx);
  });
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  
  if (idx === 2) {
    obNext.innerHTML = 'Get Started <i class="fa-solid fa-arrow-right"></i>';
  } else {
    obNext.innerHTML = 'Continue <i class="fa-solid fa-arrow-right"></i>';
  }
}

obNext.addEventListener('click', ()=>{
  obIdx++;
  if(obIdx > 2){ go('auth'); return; }
  track.scrollTo({left: obIdx * track.clientWidth, behavior:'smooth'});
  updateActiveSlide(obIdx);
});

track.addEventListener('scroll', ()=>{
  const i = Math.round(track.scrollLeft / track.clientWidth);
  if (obIdx !== i && i >= 0 && i <= 2) {
    obIdx = i;
    updateActiveSlide(i);
  }
});



// Eye toggle
document.querySelectorAll('.eye').forEach(eye =>
  eye.addEventListener('click', ()=>{
    const input = eye.parentElement.querySelector('input');
    input.type = input.type === 'password' ? 'text' : 'password';
    eye.classList.toggle('fa-eye');
    eye.classList.toggle('fa-eye-slash');
  })
);

// Chips
document.querySelectorAll('.chips').forEach(group=>{
  group.addEventListener('click', e=>{
    const c = e.target.closest('.chip');
    if(!c) return;
    group.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
  });
});

// Quiz options
document.querySelectorAll('.opt').forEach(o=>{
  o.addEventListener('click', ()=>{
    document.querySelectorAll('.opt').forEach(x=>x.style.borderColor='');
    o.style.borderColor = 'var(--primary)';
  });
});

// Chat
const chat = document.getElementById('chat');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const aiReplies = [
  "You can access all study notes by tapping the <strong>Notes</strong> icon at the bottom, selecting your class, stream, and subject! 📚<br><br><button class='guide-nav-btn' onclick='go(\"notes\")'><i class=\"fa-solid fa-book\"></i> Go to Notes</button>",
  "To study without internet, download a chapter from the Notes section. It will then appear in your <strong>Downloads</strong> list! 📶<br><br><button class='guide-nav-btn' onclick='go(\"downloads\")'><i class=\"fa-solid fa-download\"></i> Go to Downloads</button>",
  "Enable <strong>Dark Mode</strong> anytime in the <strong>Profile</strong> tab under Settings! 🌙<br><br><button class='guide-nav-btn' onclick='go(\"profile\")'><i class=\"fa-solid fa-user-gear\"></i> Open Profile</button>",
  "Check your overall progress, study streak, and performance metrics in the <strong>Progress</strong> tab! 📈<br><br><button class='guide-nav-btn' onclick='go(\"progress\")'><i class=\"fa-solid fa-chart-line\"></i> View Progress</button>",
  "Ask me anything about how to use the Evidya app, and I will guide you! 🤖"
];

function addMsg(text, who='user'){
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  div.innerHTML = `<p>${text}</p>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}
function showTyping(){
  const div = document.createElement('div');
  div.className = 'msg bot typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function send(){
  const v = chatInput.value.trim();
  if(!v) return;
  addMsg(v,'user');
  chatInput.value = '';
  const typing = showTyping();
  setTimeout(()=>{
    typing.remove();
    const query = v.toLowerCase();
    let reply = "";
    if (query.includes('offline') || query.includes('download')) {
      reply = "To study without internet, go to the <strong>Notes</strong> screen, choose your class and subject, and click <strong>Download Notes</strong> on any chapter. Then you can access them from the <strong>Downloads</strong> screen anytime!<br><br><button class=\"guide-nav-btn\" onclick=\"go('notes')\"><i class=\"fa-solid fa-book\"></i> Go to Notes</button> <button class=\"guide-nav-btn\" onclick=\"go('downloads')\"><i class=\"fa-solid fa-download\"></i> Go to Downloads</button>";
    } else if (query.includes('quiz') || query.includes('test') || query.includes('practice') || query.includes('exam')) {
      reply = "Test your preparation with quizzes! You can access them from the <strong>Quiz</strong> button in the Quick Access area on the Home screen.<br><br><button class=\"guide-nav-btn\" onclick=\"go('quiz')\"><i class=\"fa-solid fa-circle-question\"></i> Open Demo Quiz</button> <button class=\"guide-nav-btn\" onclick=\"go('home')\"><i class=\"fa-solid fa-house\"></i> Go to Home</button>";
    } else if (query.includes('dark') || query.includes('theme') || query.includes('mode') || query.includes('setting')) {
      reply = "You can toggle <strong>Dark Mode</strong> or change other settings under your Profile settings. Tap the button below to open Settings directly!<br><br><button class=\"guide-nav-btn\" onclick=\"go('profile')\"><i class=\"fa-solid fa-user-gear\"></i> Go to Profile Settings</button>";
    } else if (query.includes('progress') || query.includes('streak') || query.includes('stats') || query.includes('performance') || query.includes('score')) {
      reply = "You can track your study time, streaks, and scores in the <strong>Progress</strong> tab. Tap below to see your achievements!<br><br><button class=\"guide-nav-btn\" onclick=\"go('progress')\"><i class=\"fa-solid fa-chart-line\"></i> View My Progress</button>";
    } else if (query.includes('class') || query.includes('syllabus') || query.includes('subject') || query.includes('board')) {
      reply = "We offer board-aligned materials for the West Bengal board. Classes 6 to 10 follow WBBSE, and Classes 11 & 12 follow WBCHSE streams (Science, Commerce, Arts).<br><br><button class=\"guide-nav-btn\" onclick=\"go('notes')\"><i class=\"fa-solid fa-graduation-cap\"></i> Select My Class</button>";
    } else if (query.includes('home') || query.includes('dashboard') || query.includes('menu')) {
      reply = "Tap the Home button below to return to the main dashboard. You can access subjects, streak tracking, and quick recommendation tiles from there.<br><br><button class=\"guide-nav-btn\" onclick=\"go('home')\"><i class=\"fa-solid fa-house\"></i> Go to Home</button>";
    } else if (query.includes('help') || query.includes('use the app') || query.includes('guide') || query.includes('tutorial') || query.includes('what can you do')) {
      reply = "I am your Guide Bot! I can assist you with:<br>• Downloading chapters for offline study<br>• Accessing and taking quizzes<br>• Changing themes/dark mode settings<br>• Tracking your progress and streak<br><br>Just ask me any question like 'how to download notes' or click a suggestion below!";
    } else if (query === 'hi' || query === 'hello' || query === 'hey' || query === 'greeting') {
      reply = "Hello Joydip! 👋 How can I help you navigate the Evidya app today?";
    } else {
      reply = aiReplies[Math.floor(Math.random()*aiReplies.length)];
    }
    addMsg(reply,'bot');
  }, 700 + Math.random()*400);
}
sendBtn?.addEventListener('click', send);
chatInput?.addEventListener('keydown', e => { if(e.key==='Enter') send(); });

document.querySelectorAll('.prompt').forEach(p=>{
  p.addEventListener('click', ()=>{
    chatInput.value = p.textContent.replace(/^[^\w]+/,'').trim();
    send();
  });
});

// Dark mode with smooth transitions
const darkToggle = document.getElementById('darkToggle');
darkToggle?.addEventListener('change', ()=>{
  const isDark = darkToggle.checked;
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('shiksha_dark_mode', isDark ? 'true' : 'false');
  
  // Add smooth transition effect
  const phone = document.querySelector('.phone');
  phone.style.transition = 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1), color 0.6s ease';
});

// Restore dark mode preference
window.addEventListener('DOMContentLoaded', () => {
  const savedDarkMode = localStorage.getItem('shiksha_dark_mode') === 'true';
  if (savedDarkMode) {
    document.body.classList.add('dark');
    const darkToggle = document.getElementById('darkToggle');
    if (darkToggle) darkToggle.checked = true;
  }
});

// ==========================================
// PREMIUM NOTES & DOWNLOADS MODULE LOGIC
// ==========================================

const WBBSE_NOTES = [
  {
    id: "c6_math_ch1",
    classNum: "6",
    stream: "General",
    subject: "Mathematics",
    chapterNum: "1",
    titleEN: "Numbers & Operations",
    titleBN: "সংখ্যা ও তার ধারণা",
    size: "1.8 MB",
    contentEN: `
      <h3>Chapter 1: Numbers & Operations</h3>
      <p>In this chapter, we explore the wonderful world of natural numbers, whole numbers, and basic arithmetic operations.</p>
      <h4>1. Place Value & Face Value</h4>
      <p>The <strong>place value</strong> of a digit depends on its position in the number, while the <strong>face value</strong> is the digit itself. For example, in 563:</p>
      <ul>
        <li>Place value of 6 is 60 (Tens place).</li>
        <li>Face value of 6 is 6.</li>
      </ul>
      <h4>2. WBBSE Concept Review</h4>
      <p>Natural numbers start from 1, 2, 3... Whole numbers include zero (0, 1, 2, 3...). Remember, zero is a whole number but not a natural number!</p>
    `,
    contentBN: `
      <h3>অধ্যায় ১: সংখ্যা ও তার ধারণা</h3>
      <p>এই অধ্যায়ে আমরা স্বাভাবিক সংখ্যা, অখণ্ড সংখ্যা এবং মৌলিক গাণিতিক প্রক্রিয়াগুলি আলোচনা করব।</p>
      <h4>১. স্থানীয় মান ও প্রকৃত মান</h4>
      <p>একটি সংখ্যার কোনো অঙ্কের <strong>স্থানীয় মান</strong> তার অবস্থানের ওপর নির্ভর করে, কিন্তু তার <strong>প্রকৃত মান</strong> সর্বদা অপরিবর্তিত থাকে। যেমন ৫৬৩ সংখ্যাটিতে:</p>
      <ul>
        <li>৬ এর স্থানীয় মান হলো ৬০ (দশক স্থান)।</li>
        <li>৬ এর প্রকৃত মান হলো ৬।</li>
      </ul>
      <h4>২. ধারণা ও পর্যালোচনা</h4>
      <p>স্বাভাবিক সংখ্যা ১ থেকে শুরু হয় (১, ২, ৩...)। অখণ্ড সংখ্যার মধ্যে শূন্য (০) অন্তর্ভুক্ত থাকে। মনে রাখবে, শূন্য একটি অখণ্ড সংখ্যা কিন্তু স্বাভাবিক সংখ্যা নয়!</p>
    `
  },
  {
    id: "c6_sci_ch1",
    classNum: "6",
    stream: "General",
    subject: "Science",
    chapterNum: "1",
    titleEN: "Source of Food",
    titleBN: "খাদ্য ও খাদ্যের উৎস",
    size: "2.1 MB",
    contentEN: `
      <h3>Chapter 1: Source of Food</h3>
      <p>All living organisms need food to survive, grow, and perform daily activities. Food gives us energy and protects us from diseases.</p>
      <h4>1. Producers vs Consumers</h4>
      <p><strong>Producers (Green Plants)</strong> make their own food through photosynthesis. <strong>Consumers (Animals)</strong> rely on plants or other animals for food.</p>
      <h4>2. Classification of Animals based on Food Habits</h4>
      <ul>
        <li><strong>Herbivores</strong>: Eat only plants (e.g., Cow, Deer).</li>
        <li><strong>Carnivores</strong>: Eat only other animals (e.g., Lion, Tiger).</li>
        <li><strong>Omnivores</strong>: Eat both plants and animals (e.g., Human, Crow).</li>
      </ul>
    `,
    contentBN: `
      <h3>অধ্যায় ১: খাদ্য ও খাদ্যের উৎস</h3>
      <p>সমস্ত জীবন্ত বস্তুর বেঁচে থাকার জন্য, বৃদ্ধির জন্য এবং দৈনন্দিন কাজ করার জন্য খাদ্যের প্রয়োজন। খাদ্য আমাদের শক্তি জোগায় এবং রোগ থেকে রক্ষা করে।</p>
      <h4>১. উৎপাদক বনাম খাদক</h4>
      <p><strong>উৎপাদক (সবুজ উদ্ভিদ)</strong> সালোকসংশ্লেষ প্রক্রিয়ার মাধ্যমে নিজেদের খাদ্য নিজেরাই তৈরি করে। <strong>খাদক (প্রাণী)</strong> খাদ্যের জন্য উদ্ভিদ বা অন্যান্য প্রাণীর ওপর নির্ভর করে।</p>
      <h4>২. খাদ্যভ্যাসের ওপর ভিত্তি করে প্রাণীদের শ্রেণীবিভাগ</h4>
      <ul>
        <li><strong>তৃণভোজী</strong>: যারা কেবল গাছপালা খায় (যেমন: গরু, হরিণ)।</li>
        <li><strong>মাংসাশী</strong>: যারা কেবল অন্য প্রাণী খায় (যেমন: সিংহ, বাঘ)।</li>
        <li><strong>সর্বভুক</strong>: যারা উদ্ভিদ ও প্রাণী উভয়ই খায় (যেমন: মানুষ, কাক)।</li>
      </ul>
    `
  },
  {
    id: "c10_ps_ch5",
    classNum: "10",
    stream: "General",
    subject: "Physical Science",
    chapterNum: "5",
    titleEN: "Light & Refraction",
    titleBN: "আলো এবং প্রতিসরণ",
    size: "3.4 MB",
    contentEN: `
      <h3>Chapter 5: Light & Refraction</h3>
      <p>Light is a form of electromagnetic radiation that can be detected by the human eye. In this chapter, we focus on spherical mirrors and refraction of light.</p>
      <h4>1. Refraction of Light</h4>
      <p>When a ray of light travels from one transparent medium to another, its direction changes at the interface. This phenomenon is called <strong>refraction</strong>.</p>
      <h4>2. Snell's Law of Refraction</h4>
      <p>The ratio of the sine of the angle of incidence to the sine of the angle of refraction is constant for a given pair of media and a given color of light:</p>
      <p style="text-align:center;font-size:18px;margin:10px 0;font-weight:bold;color:var(--primary)">sin i / sin r = <sub>1</sub>&mu;<sub>2</sub> (Refractive Index)</p>
      <h4>3. Total Internal Reflection</h4>
      <p>When light travels from a denser medium to a rarer medium at an angle of incidence greater than the critical angle, it is completely reflected back into the denser medium.</p>
    `,
    contentBN: `
      <h3>অধ্যায় ৫: আলো এবং প্রতিসরণ</h3>
      <p>আলো হলো এক ধরণের তড়িৎ-চৌম্বকীয় তরঙ্গ যা আমাদের চোখে দর্শনের অনুভূতি জাগায়। এই অধ্যায়ে আমরা গোলীয় দর্পণ এবং আলোর প্রতিসরণ নিয়ে আলোচনা করব।</p>
      <h4>১. আলোর প্রতিসরণ</h4>
      <p>যখন একটি আলোক রশ্মি একটি স্বচ্ছ মাধ্যম থেকে অন্য স্বচ্ছ মাধ্যমে প্রবেশ করে, তখন মাধ্যম দুটির বিভেদতলে আলোর গতির অভিমুখ পরিবর্তিত হয়। এই ঘটনাকে <strong>প্রতিসরণ</strong> বলা হয়।</p>
      <h4>২. স্নেলের সূত্র (Snell's Law)</h4>
      <p>নির্দিষ্ট একবর্ণী আলো এবং দুটি নির্দিষ্ট মাধ্যমের ক্ষেত্রে, আপতন কোণের সাইন (sine) এবং প্রতিসরণ কোণের সাইনের অনুপাত সর্বদা ধ্রুবক থাকে:</p>
      <p style="text-align:center;font-size:18px;margin:10px 0;font-weight:bold;color:var(--primary)">sin i / sin r = &mu; (প্রতিসরাঙ্ক)</p>
      <h4>৩. আলোর অভ্যন্তরীণ পূর্ণ প্রতিফলন</h4>
      <p>যখন আলো ঘন মাধ্যম থেকে লঘু মাধ্যমে যাওয়ার সময় আপতন কোণের মান সংকট কোণের চেয়ে বেশি হয়, তখন প্রতিসৃত না হয়ে আলো সম্পূর্ণরূপে ঘন মাধ্যমেই ফিরে আসে।</p>
    `
  },
  {
    id: "c10_math_ch1",
    classNum: "10",
    stream: "General",
    subject: "Mathematics",
    chapterNum: "1",
    titleEN: "Quadratic Equations",
    titleBN: "একচল বিশিষ্ট দ্বিঘাত সমীকরণ",
    size: "2.8 MB",
    contentEN: `
      <h3>Chapter 1: Quadratic Equations with One Variable</h3>
      <p>A quadratic equation is a second-order polynomial equation in a single variable. The general form is:</p>
      <p style="text-align:center;font-size:18px;margin:10px 0;font-weight:bold;color:var(--primary)">ax² + bx + c = 0</p>
      <p>where <em>a</em>, <em>b</em>, and <em>c</em> are real numbers and <em>a &ne; 0</em>.</p>
      <h4>1. Sridhar Acharya's Formula</h4>
      <p>The roots of the quadratic equation ax² + bx + c = 0 can be directly calculated using the formula:</p>
      <p style="text-align:center;font-size:18px;margin:10px 0;font-weight:bold;color:var(--primary)">x = [-b &plusmn; &radic;(b² - 4ac)] / 2a</p>
      <h4>2. Nature of Roots (Discriminant)</h4>
      <ul>
        <li>If <strong>D = b² - 4ac > 0</strong>, roots are real and unequal.</li>
        <li>If <strong>D = b² - 4ac = 0</strong>, roots are real and equal.</li>
        <li>If <strong>D = b² - 4ac < 0</strong>, roots are imaginary (no real roots).</li>
      </ul>
    `,
    contentBN: `
      <h3>অধ্যায় ১: একচল বিশিষ্ট দ্বিঘাত সমীকরণ</h3>
      <p>দ্বিঘাত সমীকরণ হলো এমন একটি সমীকরণ যার চলের সর্বোচ্চ ঘাত দুই। এর সাধারণ রূপটি হলো:</p>
      <p style="text-align:center;font-size:18px;margin:10px 0;font-weight:bold;color:var(--primary)">ax² + bx + c = 0</p>
      <p>যেখানে <em>a</em>, <em>b</em>, এবং <em>c</em> হলো বাস্তব সংখ্যা এবং <em>a &ne; ০</em>।</p>
      <h4>১. শ্রীধর আচার্যের সূত্র</h4>
      <p>ax² + bx + c = 0 সমীকরণের বীজ দুটি সরাসরি নির্ণয়ের সূত্রটি হলো:</p>
      <p style="text-align:center;font-size:18px;margin:10px 0;font-weight:bold;color:var(--primary)">x = [-b &plusmn; &radic;(b² - 4ac)] / 2a</p>
      <h4>২. বীজের প্রকৃতি (নিরূপক)</h4>
      <ul>
        <li>যদি <strong>D = b² - 4ac > ০</strong> হয়, বীজদ্বয় বাস্তব ও অসমান হবে।</li>
        <li>যদি <strong>D = b² - 4ac = ০</strong> হয়, বীজদ্বয় বাস্তব ও সমান হবে।</li>
        <li>যদি <strong>D = b² - 4ac < ০</strong> হয়, সমীকরণের কোনো বাস্তব বীজ থাকবে না।</li>
      </ul>
    `
  },
  {
    id: "c12_phy_ch1",
    classNum: "12",
    stream: "Science",
    subject: "Physics",
    chapterNum: "1",
    titleEN: "Electrostatics & Coulomb's Law",
    titleBN: "স্থিরতড়িৎ ও কুলম্বের সূত্র",
    size: "4.2 MB",
    contentEN: `
      <h3>Chapter 1: Electrostatics</h3>
      <p>Electrostatics deals with the study of forces, fields, and potentials arising from static charges.</p>
      <h4>1. Coulomb's Law</h4>
      <p>The electrostatic force of attraction or repulsion between two point charges is directly proportional to the product of the charges and inversely proportional to the square of the distance between them:</p>
      <p style="text-align:center;font-size:18px;margin:10px 0;font-weight:bold;color:var(--primary)">F = k · (q₁ · q₂) / r²</p>
      <p>Where <em>k = 1 / (4&pi;&epsilon;₀) &approx; 9 &times; 10⁹ N·m²/C²</em> in vacuum.</p>
      <h4>2. Electric Field Intensity</h4>
      <p>Electric field intensity at any point is the force experienced by a unit positive test charge placed at that point:</p>
      <p style="text-align:center;font-size:16px;margin:5px 0;font-weight:bold;">E = F / q</p>
    `,
    contentBN: `
      <h3>অধ্যায় ১: স্থিরতড়িৎ ও কুলম্বের সূত্র</h3>
      <p>স্থিরতড়িৎ বিজ্ঞান স্থির আধানের ফলে সৃষ্ট বল, ক্ষেত্র এবং বিভব নিয়ে আলোচনা করে।</p>
      <h4>১. কুলম্বের সূত্র (Coulomb's Law)</h4>
      <p>দুটি স্থির বিন্দু-আধানের মধ্যে পারস্পরিক আকর্ষণ বা বিকর্ষণ বল আধানদ্বয়ের পরিমাণের গুণফলের সমানুপাতিক এবং তাদের মধ্যবর্তী দূরত্বের বর্গের ব্যস্তানুপাতিক:</p>
      <p style="text-align:center;font-size:18px;margin:10px 0;font-weight:bold;color:var(--primary)">F = k · (q₁ · q₂) / r²</p>
      <p>শূন্য মাধ্যমে ধ্রুবক <em>k = ১ / (৪&pi;&epsilon;₀) &approx; ৯ &times; ১০⁹ N·m²/C²</em>।</p>
      <h4>২. তড়িৎ ক্ষেত্রের প্রাবল্য</h4>
      <p>তড়িৎ ক্ষেত্রের কোনো বিন্দুতে একটি একক ধনাত্মক আধান রাখলে সেটি যে বল অনুভব করে, তাকে ওই বিন্দুর তড়িৎ ক্ষেত্র প্রাবল্য বলা হয়:</p>
      <p style="text-align:center;font-size:16px;margin:5px 0;font-weight:bold;">E = F / q</p>
    `
  },
  {
    id: "c12_chem_ch1",
    classNum: "12",
    stream: "Science",
    subject: "Chemistry",
    chapterNum: "1",
    titleEN: "Solid State",
    titleBN: "পদার্থের কঠিন অবস্থা",
    size: "3.9 MB",
    contentEN: `
      <h3>Chapter 1: The Solid State</h3>
      <p>Solids have a definite shape, volume, and mass due to short intermolecular distances and strong intermolecular forces.</p>
      <h4>1. Crystalline vs Amorphous Solids</h4>
      <ul>
        <li><strong>Crystalline</strong>: Sharp melting points, anisotropic, definite heat of fusion, long-range order (e.g., Quartz, NaCl).</li>
        <li><strong>Amorphous</strong>: Melt over a range of temperature, isotropic, short-range order (e.g., Glass, Rubber).</li>
      </ul>
      <h4>2. Unit Cells & Bravais Lattices</h4>
      <p>A <strong>unit cell</strong> is the smallest repeating unit of a crystal lattice. There are 14 types of Bravais lattices grouped into 7 crystal systems.</p>
    `,
    contentBN: `
      <h3>অধ্যায় ১: পদার্থের কঠিন অবস্থা</h3>
      <p>কঠিন পদার্থের অণুগুলির মধ্যবর্তী দূরত্ব অত্যন্ত কম এবং আকর্ষণ বল তীব্র হওয়ায় এদের নির্দিষ্ট আকৃতি, আয়তন ও ভর থাকে।</p>
      <h4>১. কেলাসাকার বনাম অনিয়তাকার কঠিন পদার্থ</h4>
      <ul>
        <li><strong>কেলাসাকার</strong>: নির্দিষ্ট গলনাঙ্ক থাকে, অসমসারক (anisotropic), দীর্ঘ পাল্লার বিন্যাস যুক্ত (যেমন- কোয়ার্টজ, সোডিয়াম ক্লোরাইড)।</li>
        <li><strong>অনিয়তাকার</strong>: নির্দিষ্ট গলনাঙ্ক থাকে না, সমসারক (isotropic), স্বল্প পাল্লার বিন্যাস যুক্ত (যেমন- কাচ, রবার)।</li>
      </ul>
      <h4>২. একক কোশ (Unit Cell)</h4>
      <p>একটি ক্রিস্টাল ল্যাটিসের ক্ষুদ্রতম পুনরাবৃত্ত অংশকে <strong>একক কোশ</strong> বলে। মোট ১৪টি ব্রেভিস ল্যাটিস রয়েছে যা ৭টি ক্রিস্টাল সিস্টেমে বিভক্ত।</p>
    `
  },
  {
    id: "c12_acc_ch1",
    classNum: "12",
    stream: "Commerce",
    subject: "Accountancy",
    chapterNum: "1",
    titleEN: "Partnership Accounts",
    titleBN: "অংশীদারি কারবারের হিসাবনিকাশ",
    size: "3.1 MB",
    contentEN: `
      <h3>Chapter 1: Partnership Accounts</h3>
      <p>Partnership is the relation between persons who have agreed to share the profits of a business carried on by all or any of them acting for all.</p>
      <h4>1. Profit & Loss Appropriation A/c</h4>
      <p>This account is prepared after the Profit & Loss Account to distribute the net profit among the partners based on the partnership deed.</p>
      <h4>2. Key Adjustments:</h4>
      <ul>
        <li>Interest on Capital: Allowed to partners on their capitals.</li>
        <li>Interest on Drawings: Charged on withdrawals by partners.</li>
        <li>Partner's Salary & Commission.</li>
      </ul>
    `,
    contentBN: `
      <h3>অধ্যায় ১: অংশীদারি কারবারের হিসাবনিকাশ</h3>
      <p>অংশীদারি হলো এমন ব্যক্তিদের মধ্যে পারস্পরিক সম্পর্ক যারা সকলের দ্বারা বা সকলের পক্ষে কোনো একজনের দ্বারা পরিচালিত ব্যবসার লাভ নিজেদের মধ্যে ভাগ করে নেওয়ার জন্য সম্মত হয়েছে।</p>
      <h4>১. লাভ-ক্ষতি বণ্টন হিসাব (P&L Appropriation A/c)</h4>
      <p>অংশীদারি চুক্তির ভিত্তিতে অংশীদারদের মধ্যে নিট মুনাফা বা ক্ষতি বণ্টনের জন্য সাধারণ লাভ-ক্ষতি হিসাব তৈরির পর এই হিসাবটি প্রস্তুত করা হয়।</p>
      <h4>২. প্রধান সমন্বয়সমূহ (Key Adjustments):</h4>
      <ul>
        <li>মূলধনের ওপর সুদ (Interest on Capital)</li>
        <li>উত্তোলনের ওপর সুদ (Interest on Drawings)</li>
        <li>অংশীদারদের বেতন ও কমিশন</li>
      </ul>
    `
  },
  {
    id: "c12_hist_ch1",
    classNum: "12",
    stream: "Arts",
    subject: "History",
    chapterNum: "1",
    titleEN: "Remembering the Past",
    titleBN: "অতীত স্মরণ",
    size: "2.6 MB",
    contentEN: `
      <h3>Chapter 1: Remembering the Past</h3>
      <p>This chapter analyzes how human history is preserved, conceptualized, and remembered through various forms like myths, legends, folk tales, memoirs, and professional museums.</p>
      <h4>1. Oral History & Folk Tales</h4>
      <p>Before writing, history was transmitted orally. Folk tales contain historical memories of local societies.</p>
      <h4>2. Types of Museums</h4>
      <p>Museums are modern institutions of historical preservation. Types include Historical Museums, Science Museums, and Specialized Art Museums.</p>
    `,
    contentBN: `
      <h3>অধ্যায় ১: অতীত স্মরণ</h3>
      <p>এই অধ্যায়ে বিশ্লেষণ করা হয়েছে কীভাবে রূপকথা, কিংবদন্তি, লোকগাথা, স্মৃতিকথা এবং আধুনিক জাদুঘরের মতো বিভিন্ন মাধ্যমে মানব ইতিহাস সংরক্ষিত ও স্মরণ করা হয়।</p>
      <h4>১. মৌখিক ইতিহাস ও লোকগাথা</h4>
      <p>লিখন প্রণালী আবিষ্কারের পূর্বে ইতিহাস মুখে মুখে ছড়িয়ে পড়ত। লোকগাথাগুলি স্থানীয় সমাজের ঐতিহাসিক স্মৃতির বাহক।</p>
      <h4>২. জাদুঘরের প্রকারভেদ</h4>
      <p>জাদুঘর বা মিউজিয়াম হলো ইতিহাস সংরক্ষণের আধুনিক প্রতিষ্ঠান। এর প্রকারভেদ হলো ঐতিহাসিক মিউজিয়াম, বিজ্ঞান মিউজিয়াম, এবং বিশেষায়িত শিল্প মিউজিয়াম।</p>
    `
  }
];

// Automatically populate WBBSE_NOTES with mock chapters for all missing class/stream/subject combinations
(function populateWbbseNotes() {
  const targetSubjects = ['Mathematics', 'Physical Science', 'Biology', 'Bengali', 'English', 'History', 'Geography'];
  const subjectMetadata = {
    'Mathematics': { titleBN: 'গণিত', size: '2.8 MB', titleEN_Ch: 'Algebra & Geometry Essentials', titleBN_Ch: 'বীজগণিত ও জ্যামিতি সারসংক্ষেপ' },
    'Physical Science': { titleBN: 'ভৌতবিজ্ঞান', size: '3.2 MB', titleEN_Ch: 'Matter, Force & Chemical Systems', titleBN_Ch: 'পদার্থ, বল ও রাসায়নিক প্রণালী' },
    'Biology': { titleBN: 'জীবনবিজ্ঞান', size: '3.0 MB', titleEN_Ch: 'Life Processes & Cells', titleBN_Ch: 'জীবন প্রক্রিয়া ও কোশ' },
    'Bengali': { titleBN: 'বাংলা', size: '2.4 MB', titleEN_Ch: 'Grammar and Comprehension', titleBN_Ch: 'ব্যাকরণ ও বোধপরীক্ষণ' },
    'English': { titleBN: 'ইংরেজি', size: '2.6 MB', titleEN_Ch: 'Grammar and Composition', titleBN_Ch: 'ইংরেজি ব্যাকরণ ও রচনাশৈলী' },
    'History': { titleBN: 'ইতিহাস', size: '2.9 MB', titleEN_Ch: 'Ancient and Modern Eras', titleBN_Ch: 'প্রাচীন ও আধুনিক যুগসমূহ' },
    'Geography': { titleBN: 'ভূগোল', size: '3.1 MB', titleEN_Ch: 'Earth and Resources', titleBN_Ch: 'পৃথিবী ও প্রাকৃতিক সম্পদ' }
  };

  // Populate missing class/stream/subject combinations with mock chapters
  const classes = ['5', '6', '7', '8', '9', '10', '11', '12'];
  classes.forEach(cls => {
    const streams = (cls === '11' || cls === '12') ? ['Science', 'Commerce', 'Arts'] : ['General'];
    streams.forEach(stream => {
      targetSubjects.forEach(subj => {
        const exists = WBBSE_NOTES.some(n => 
          n.classNum === cls && 
          (cls < 11 || n.stream === stream) && 
          n.subject === subj
        );
        if (!exists) {
          const meta = subjectMetadata[subj];
          const noteId = `gen_c${cls}_${stream.toLowerCase()}_${subj.toLowerCase().replace(/\s+/g, '_')}_ch1`;
          WBBSE_NOTES.push({
            id: noteId,
            classNum: cls,
            stream: stream,
            subject: subj,
            chapterNum: "1",
            titleEN: meta.titleEN_Ch,
            titleBN: meta.titleBN_Ch,
            size: meta.size,
            contentEN: `
              <h3>Chapter 1: ${meta.titleEN_Ch}</h3>
              <p>Welcome to Class ${cls} ${subj} notes. This is a comprehensive guide prepared according to the latest syllabus.</p>
              <h4>Key Topics Covered:</h4>
              <ul>
                <li>Fundamental concepts and definitions.</li>
                <li>Detailed explanations with illustrative examples.</li>
                <li>Practice questions and self-assessment guide.</li>
              </ul>
            `,
            contentBN: `
              <h3>অধ্যায় ১: ${meta.titleBN_Ch}</h3>
              <p>ক্লাস ${cls}-এর ${meta.titleBN} বিষয়ের নোটে আপনাকে স্বাগত। এই নোটটি সর্বশেষ সিলেবাস অনুযায়ী প্রস্তুত করা হয়েছে।</p>
              <h4>প্রধান আলোচিত বিষয়সমূহ:</h4>
              <ul>
                <li>মৌলিক ধারণা এবং সংজ্ঞাসমূহ।</li>
                <li>চিত্র ও উদাহরণসহ বিস্তারিত আলোচনা।</li>
                <li>অনুশীলনের জন্য প্রশ্ন ও স্ব-মূল্যায়ন নির্দেশিকা।</li>
              </ul>
            `
          });
        }
      });
    });
  });

  // Assign PDF paths & dynamic language support arrays to ALL notes in WBBSE_NOTES using our global getPdfFile helper
  WBBSE_NOTES.forEach(note => {
    note.pdfEN = getPdfFile(note.classNum, note.subject, 'EN');
    note.pdfBN = getPdfFile(note.classNum, note.subject, 'BN');
    note.pdfHI = getPdfFile(note.classNum, note.subject, 'HI');

    const langs = [];
    if (note.pdfEN) langs.push('EN');
    if (note.pdfBN) langs.push('BN');
    if (note.pdfHI) langs.push('HI');

    // Default to EN and BN as HTML fallbacks if no PDFs are found at all
    if (langs.length === 0) {
      langs.push('EN', 'BN');
    }
    note.languages = langs;
  });
})();


let notesSel = {
  classNum: null,
  stream: null,
  subject: null
};

let downloadedNotes = JSON.parse(localStorage.getItem('shiksha_downloads') || '[]');
let pdfReaderState = {
  note: null,
  zoom: 100,
  night: false,
  lang: 'EN'
};

// Initializer for the notes selection flow
function initNotesModule() {
  notesSel = { classNum: null, stream: null, subject: null };
  document.getElementById('notesBreadcrumbs').style.display = 'none';
  
  // Show step 1, hide others
  showFlowStep('stepClassSelect');
  document.getElementById('notesPageTitle').textContent = 'Notes Library';
}

function showFlowStep(stepId) {
  document.querySelectorAll('.flow-step').forEach(el => {
    el.style.display = 'none';
    el.classList.remove('active');
  });
  const activeEl = document.getElementById(stepId);
  if (activeEl) {
    activeEl.style.display = 'block';
    activeEl.classList.add('active');
  }
  
  // Scroll Notes container to top
  const notesScreen = document.querySelector('.screen[data-screen="notes"]');
  if (notesScreen) notesScreen.scrollTop = 0;
}

// Update breadcrumbs indicator
function updateNotesBreadcrumbs() {
  const bc = document.getElementById('notesBreadcrumbs');
  if (!notesSel.classNum) {
    bc.style.display = 'none';
    return;
  }
  
  bc.style.display = 'flex';
  
  const crumbClass = document.getElementById('crumbClass');
  crumbClass.textContent = `Class ${notesSel.classNum}`;
  
  const crumbStream = document.getElementById('crumbStream');
  const streamSep = document.getElementById('crumbStreamSep');
  if (notesSel.classNum >= 11 && notesSel.stream) {
    crumbStream.style.display = 'inline';
    streamSep.style.display = 'inline';
    crumbStream.textContent = notesSel.stream;
  } else {
    crumbStream.style.display = 'none';
    streamSep.style.display = 'none';
  }
  
  const crumbSubject = document.getElementById('crumbSubject');
  const subjectSep = document.getElementById('crumbSubjectSep');
  if (notesSel.subject) {
    crumbSubject.style.display = 'inline';
    subjectSep.style.display = 'inline';
    crumbSubject.textContent = notesSel.subject;
  } else {
    crumbSubject.style.display = 'none';
    subjectSep.style.display = 'none';
  }
}

// Bind clicks for selecting classes
document.querySelectorAll('.class-card').forEach(card => {
  card.addEventListener('click', () => {
    notesSel.classNum = card.dataset.class;
    document.getElementById('notesPageTitle').textContent = `Class ${notesSel.classNum} Notes`;
    updateNotesBreadcrumbs();

    if (notesSel.classNum >= 11) {
      showFlowStep('stepStreamSelect');
    } else {
      notesSel.stream = 'General';
      renderSubjectsList();
      showFlowStep('stepSubjectSelect');
    }
  });
});

// Bind clicks for selecting streams
document.querySelectorAll('.stream-card').forEach(card => {
  card.addEventListener('click', () => {
    notesSel.stream = card.dataset.stream;
    updateNotesBreadcrumbs();
    renderSubjectsList();
    showFlowStep('stepSubjectSelect');
  });
});

// Render list of subjects based on selected class and stream
function renderSubjectsList() {
  const grid = document.getElementById('subjectsFlowGrid');
  grid.innerHTML = '';
  
  // Filter notes array to see what subjects we have for this class/stream
  const availableNotes = WBBSE_NOTES.filter(n => 
    n.classNum === notesSel.classNum && 
    (notesSel.classNum < 11 || n.stream === notesSel.stream)
  );
  
  // Get unique subjects
  const subjects = [...new Set(availableNotes.map(n => n.subject))];
  
  // Custom design gradients for subjects
  const colors = {
    'Mathematics': { g1: '#7c3aed', g2: '#4f46e5', icon: 'fa-square-root-variable' },
    'Science': { g1: '#10b981', g2: '#22c55e', icon: 'fa-flask' },
    'Physical Science': { g1: '#06b6d4', g2: '#0ea5e9', icon: 'fa-atom' },
    'Physics': { g1: '#06b6d4', g2: '#0ea5e9', icon: 'fa-atom' },
    'Chemistry': { g1: '#f59e0b', g2: '#ef4444', icon: 'fa-flask' },
    'Accountancy': { g1: '#ec4899', g2: '#8b5cf6', icon: 'fa-calculator' },
    'History': { g1: '#3b82f6', g2: '#06b6d4', icon: 'fa-scroll' },
    'Biology': { g1: '#10b981', g2: '#22c55e', icon: 'fa-dna' },
    'Bengali': { g1: '#ec4899', g2: '#f43f5e', icon: 'fa-language' },
    'English': { g1: '#3b82f6', g2: '#60a5fa', icon: 'fa-book-open' },
    'Geography': { g1: '#f59e0b', g2: '#fbbf24', icon: 'fa-globe' }
  };

  subjects.forEach(subject => {
    const col = colors[subject] || { g1: '#7c3aed', g2: '#06b6d4', icon: 'fa-book' };
    const div = document.createElement('div');
    div.className = 'subject';
    div.style = `--g1:${col.g1};--g2:${col.g2};`;
    div.innerHTML = `
      <div class="sub-ico"><i class="fa-solid ${col.icon}"></i></div>
      <h4>${subject}</h4>
      <small>Chapter Notes</small>
      <div class="bar"><span style="width:100%"></span></div>
    `;
    
    div.addEventListener('click', () => {
      notesSel.subject = subject;
      updateNotesBreadcrumbs();
      renderChaptersList();
      showFlowStep('stepNotesList');
    });
    
    grid.appendChild(div);
  });
}

// Render dynamic notes list for the selected subject
// Render dynamic notes list for the selected subject
function renderChaptersList() {
  const list = document.getElementById('chapterCardsList');
  list.innerHTML = '';
  
  const chapters = WBBSE_NOTES.filter(n => 
    n.classNum === notesSel.classNum && 
    (notesSel.classNum < 11 || n.stream === notesSel.stream) &&
    n.subject === notesSel.subject
  );
  
  document.getElementById('notesChaptersHeading').textContent = `${notesSel.subject} Chapters`;
  
  updateNotesStorageStats();
  
  if (chapters.length === 0) {
    list.innerHTML = `
      <div class="downloads-empty">
        <div class="empty-ico"><i class="fa-solid fa-folder-open"></i></div>
        <h4>No Chapters Available</h4>
        <p>Offline course material for this selection is being prepared under board directives.</p>
      </div>
    `;
    return;
  }

  const firstNote = chapters[0];
  if (firstNote && firstNote.languages && firstNote.languages.length > 0) {
    // If notesSel.lang is not selected or not supported by this note, default to first available
    if (!notesSel.lang || !firstNote.languages.includes(notesSel.lang)) {
      notesSel.lang = firstNote.languages[0];
    }

    // Render language selection pills if more than 1 language is available
    if (firstNote.languages.length > 1) {
      const langSelectDiv = document.createElement('div');
      langSelectDiv.className = 'chapters-lang-selector';
      langSelectDiv.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:16px; padding:4px 8px; background:rgba(255,255,255,0.06); border-radius:12px; border:1px solid rgba(255,255,255,0.08); width:fit-content;';
      
      const langLabel = document.createElement('span');
      langLabel.textContent = 'Language:';
      langLabel.style.cssText = 'font-size:11px; font-weight:700; color:var(--muted); margin-right:4px; text-transform:uppercase; letter-spacing:0.5px;';
      langSelectDiv.appendChild(langLabel);
      
      const langNames = {
        'EN': 'English',
        'BN': 'Bengali',
        'HI': 'Hindi'
      };
      
      firstNote.languages.forEach(l => {
        const btn = document.createElement('button');
        btn.textContent = langNames[l] || l;
        btn.className = `filter-btn ${notesSel.lang === l ? 'active' : ''}`;
        btn.style.cssText = 'padding:6px 12px; font-size:11px; border-radius:8px; margin:0; cursor:pointer; font-family:inherit; font-weight:600;';
        
        btn.addEventListener('click', () => {
          notesSel.lang = l;
          renderChaptersList();
        });
        langSelectDiv.appendChild(btn);
      });
      
      list.appendChild(langSelectDiv);
    }
  } else {
    notesSel.lang = 'EN';
  }

  chapters.forEach(note => {
    const isDownloaded = downloadedNotes.includes(note.id);
    const card = document.createElement('div');
    card.className = 'chapter-card';
    card.id = `card_${note.id}`;
    
    // Choose titles based on active language selection
    let displayTitle = note.titleEN;
    let subtitle = note.titleBN;
    let chPrefix = `Chapter ${note.chapterNum}`;
    let subChPrefix = `অধ্যায় ${note.chapterNum}`;
    
    if (notesSel.lang === 'BN') {
      displayTitle = note.titleBN;
      subtitle = note.titleEN;
      chPrefix = `অধ্যায় ${note.chapterNum}`;
      subChPrefix = `Chapter ${note.chapterNum}`;
    } else if (notesSel.lang === 'HI') {
      displayTitle = `${note.titleEN} (Hindi)`;
      subtitle = note.titleBN;
      chPrefix = `Chapter ${note.chapterNum}`;
      subChPrefix = `অধ্যায় ${note.chapterNum}`;
    }
    
    // Check if the current note has a real PDF for the selected language
    const currentPdf = notesSel.lang === 'EN' ? note.pdfEN : (notesSel.lang === 'BN' ? note.pdfBN : note.pdfHI);
    
    card.innerHTML = `
      <div class="ch-header">
        <div class="ch-meta">
          <h5>${chPrefix}: ${displayTitle}</h5>
          <span class="bengali-title">${subChPrefix}: ${subtitle}</span>
          <div class="ch-badges">
            <span class="ch-badge subj">${note.subject}</span>
            <span class="ch-badge size">${note.size}</span>
            <span class="ch-badge offline-ready" id="badge_${note.id}" style="${isDownloaded ? 'display:flex' : 'display:none'}">
              <i class="fa-solid fa-circle-check"></i> Offline Ready (${notesSel.lang})
            </span>
          </div>
        </div>
      </div>
      
      <!-- Download Progress -->
      <div class="ch-download-progress-container" id="prog_cont_${note.id}">
        <div class="ch-progress-bar-bg"><div class="ch-progress-fill" id="prog_fill_${note.id}"></div></div>
        <div class="ch-progress-text">
          <span>Downloading PDF Notes (${notesSel.lang})...</span>
          <span id="prog_text_${note.id}">0%</span>
        </div>
      </div>

      <div class="ch-action-wrap" id="action_wrap_${note.id}" style="display:flex; gap:8px;">
        ${isDownloaded ? 
          `<button class="ch-btn read-btn" onclick="openPdfModal('${note.id}')" style="flex:1;"><i class="fa-solid fa-book-open"></i> Read Offline</button>` :
          (currentPdf ? 
            `<button class="ch-btn read-btn" onclick="openPdfModal('${note.id}')" style="flex:1; background:linear-gradient(135deg,#06b6d4,#0ea5e9);"><i class="fa-solid fa-book-open"></i> Read</button>
             <button class="ch-btn download-btn" onclick="triggerDownloadNotes('${note.id}')" style="flex:1;"><i class="fa-solid fa-cloud-arrow-down"></i> Download</button>` :
            `<button class="ch-btn read-btn" onclick="openPdfModal('${note.id}')" style="flex:1; background:linear-gradient(135deg,#7c3aed,#4f46e5);"><i class="fa-solid fa-book-open"></i> Read Summary</button>`
          )
        }
      </div>
    `;
    list.appendChild(card);
  });
}

// Trigger animated notes download simulation
function triggerDownloadNotes(noteId) {
  const progCont = document.getElementById(`prog_cont_${noteId}`);
  const actionWrap = document.getElementById(`action_wrap_${noteId}`);
  
  if (!progCont || !actionWrap) return;
  
  // Hide action button, show progress bar
  actionWrap.style.display = 'none';
  progCont.style.display = 'flex';
  
  const fill = document.getElementById(`prog_fill_${noteId}`);
  const txt = document.getElementById(`prog_text_${noteId}`);
  
  let percent = 0;
  const interval = setInterval(() => {
    percent += 8 + Math.floor(Math.random() * 8);
    if (percent >= 100) {
      percent = 100;
      clearInterval(interval);
      
      // Save download state
      if (!downloadedNotes.includes(noteId)) {
        downloadedNotes.push(noteId);
        localStorage.setItem('shiksha_downloads', JSON.stringify(downloadedNotes));
      }
      
      // Trigger a real browser file download to local memory for the active language and pre-cache in IndexedDB
      const note = WBBSE_NOTES.find(n => n.id === noteId);
      if (note) {
        const activePdf = notesSel.lang === 'EN' ? note.pdfEN : (notesSel.lang === 'BN' ? note.pdfBN : note.pdfHI);
        if (activePdf) {
          // Pre-cache PDF in IndexedDB (only if running via HTTP/HTTPS protocols)
          if (window.location.protocol !== 'file:') {
            fetch(activePdf)
              .then(res => {
                if (res.ok) return res.blob();
                throw new Error("Fetch failed");
              })
              .then(blob => {
                cachePDF(activePdf, blob);
                console.log(`Pre-cached PDF on download: ${activePdf}`);
              })
              .catch(err => {
                console.error(`Failed to pre-cache PDF on download: ${activePdf}`, err);
              });
          }

          const link = document.createElement('a');
          link.href = activePdf;
          link.download = activePdf.split('/').pop();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
      // Update stats and card
      updateNotesStorageStats();
      
      setTimeout(() => {
        // Dynamic card update with smooth animations
        progCont.style.display = 'none';
        actionWrap.style.display = 'flex';
        actionWrap.innerHTML = `<button class="ch-btn read-btn" onclick="openPdfModal('${noteId}')"><i class="fa-solid fa-book-open"></i> Read Offline</button>`;
        
        const badge = document.getElementById(`badge_${noteId}`);
        if (badge) {
          badge.style.display = 'flex';
          badge.textContent = `Offline Ready (${notesSel.lang})`;
        }
        
        // Custom haptic glow feedback
        const card = document.getElementById(`card_${noteId}`);
        if (card) {
          card.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.4)';
          card.style.borderColor = '#22c55e';
          setTimeout(() => {
            card.style.boxShadow = '';
            card.style.borderColor = '';
          }, 1200);
        }
      }, 300);
    }
    
    fill.style.width = `${percent}%`;
    txt.textContent = `${percent}%`;
  }, 100);
}

// Calculate sizes for Storage statistics
function getStorageDetails() {
  const list = WBBSE_NOTES.filter(n => downloadedNotes.includes(n.id));
  const count = list.length;
  const totalMB = list.reduce((acc, note) => {
    const size = parseFloat(note.size.replace(' MB', ''));
    return acc + size;
  }, 0);
  
  return {
    count,
    totalMB: totalMB.toFixed(1),
    pct: Math.min(((totalMB / 100) * 100).toFixed(0), 100)
  };
}

function updateNotesStorageStats() {
  const stats = getStorageDetails();
  const bar = document.getElementById('notesStorageBar');
  const txt = document.getElementById('notesStorageStatus');
  
  if (bar) bar.style.width = `${stats.pct}%`;
  if (txt) txt.textContent = `${stats.count} chapters cached · ${stats.totalMB} MB`;
}

// Custom Back button handler for Notes screen steps
const notesBackBtn = document.getElementById('notesBackBtn');
notesBackBtn.addEventListener('click', () => {
  if (document.getElementById('stepNotesList').classList.contains('active')) {
    showFlowStep('stepSubjectSelect');
    notesSel.subject = null;
    updateNotesBreadcrumbs();
  } else if (document.getElementById('stepSubjectSelect').classList.contains('active')) {
    if (notesSel.classNum >= 11) {
      showFlowStep('stepStreamSelect');
      notesSel.stream = null;
    } else {
      showFlowStep('stepClassSelect');
      notesSel.classNum = null;
    }
    updateNotesBreadcrumbs();
  } else if (document.getElementById('stepStreamSelect').classList.contains('active')) {
    showFlowStep('stepClassSelect');
    notesSel.classNum = null;
    updateNotesBreadcrumbs();
  } else {
    // Already at class selection, go to Home
    go('home');
  }
});

// Breadcrumbs click jumps
document.getElementById('crumbClass').addEventListener('click', () => {
  notesSel.stream = null;
  notesSel.subject = null;
  updateNotesBreadcrumbs();
  showFlowStep('stepClassSelect');
});
document.getElementById('crumbStream').addEventListener('click', () => {
  notesSel.subject = null;
  updateNotesBreadcrumbs();
  showFlowStep('stepStreamSelect');
});

// Clear cache from Notes library
document.getElementById('notesClearCacheBtn').addEventListener('click', () => {
  if (downloadedNotes.length === 0) return;
  if (confirm('Are you sure you want to clear your local offline cache?')) {
    downloadedNotes = [];
    localStorage.setItem('shiksha_downloads', JSON.stringify(downloadedNotes));
    updateNotesStorageStats();
    renderChaptersList();
  }
});

// Render the dedicated Downloads offline section
function renderDownloadsScreen() {
  const stats = getStorageDetails();
  
  document.getElementById('downloadsStoragePct').textContent = `${stats.pct}%`;
  document.getElementById('downloadsStorageBar').style.width = `${stats.pct}%`;
  
  const text = document.getElementById('downloadsStorageText');
  if (stats.count === 0) {
    text.textContent = `No offline notes saved · 0.0 MB`;
  } else {
    text.textContent = `${stats.count} notes saved · ${stats.totalMB} MB`;
  }
  
  const list = document.getElementById('offlineNotesList');
  list.innerHTML = '';
  
  if (downloadedNotes.length === 0) {
    list.innerHTML = `
      <div class="downloads-empty">
        <div class="empty-ico"><i class="fa-solid fa-cloud-arrow-down"></i></div>
        <h4>No Offline Notes</h4>
        <p>You haven't downloaded any notes yet. Browse syllabus chapters and save them locally.</p>
        <button onclick="go('notes')"><i class="fa-solid fa-magnifying-glass"></i> Browse Notes</button>
      </div>
    `;
    return;
  }
  
  downloadedNotes.forEach(noteId => {
    const note = WBBSE_NOTES.find(n => n.id === noteId);
    if (!note) return;
    
    const div = document.createElement('div');
    div.className = 'offline-note-item';
    div.innerHTML = `
      <div class="pdf-icon"><i class="fa-solid fa-file-pdf"></i></div>
      <div class="note-details">
        <h5>${note.titleEN}</h5>
        <small>${note.titleBN}</small>
        <br/>
        <small class="muted" style="font-size:9px">Class ${note.classNum} · ${note.subject} · ${note.size}</small>
      </div>
      <div class="action-buttons">
        <button class="action-btn open" onclick="openPdfModal('${note.id}')" title="Open PDF"><i class="fa-solid fa-folder-open"></i></button>
        <button class="action-btn delete" onclick="deleteSingleDownload('${note.id}')" title="Remove offline"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    `;
    list.appendChild(div);
  });
}

// Delete single offline download
function deleteSingleDownload(noteId) {
  downloadedNotes = downloadedNotes.filter(id => id !== noteId);
  localStorage.setItem('shiksha_downloads', JSON.stringify(downloadedNotes));
  renderDownloadsScreen();
}

// Delete all offline downloads
document.getElementById('downloadsClearBtn').addEventListener('click', () => {
  if (downloadedNotes.length === 0) return;
  if (confirm('Delete all offline notes from local cache?')) {
    downloadedNotes = [];
    localStorage.setItem('shiksha_downloads', JSON.stringify(downloadedNotes));
    renderDownloadsScreen();
  }
});

// Storage DB Icon trigger inside Notes library page
document.getElementById('notesStorageBtn').addEventListener('click', () => {
  go('downloads');
});

// ==========================================
// PREMIUM PDF READER CONTROLS
// ==========================================
const pdfModal = document.getElementById('pdfModal');

let currentPdfDoc = null;
let currentPdfPageNum = 1;
let pdfPageRendering = false;
let pdfPageNumPending = null;

function openPdfModal(noteId) {
  const note = WBBSE_NOTES.find(n => n.id === noteId);
  if (!note) return;
  
  // Set default language from our selected language in notes selector, or first available of the note
  let initialLang = notesSel.lang || 'EN';
  if (!note.languages.includes(initialLang)) {
    initialLang = note.languages[0];
  }
  
  pdfReaderState = {
    note,
    zoom: 100,
    night: false,
    lang: initialLang
  };
  
  // Header texts
  document.getElementById('pdfReaderTitle').textContent = `${note.titleEN}.pdf`;
  document.getElementById('pdfReaderSub').textContent = `Class ${note.classNum} ${note.subject} · ${note.stream === 'General' ? 'WBBSE' : 'WBCHSE'}`;
  
  // Set controls initial state
  document.getElementById('pdfZoomVal').textContent = '100%';
  document.getElementById('pdfLangIndicator').textContent = pdfReaderState.lang;
  
  // Show or hide language toggle button based on availability of multiple languages
  const langToggle = document.getElementById('pdfLangToggle');
  if (langToggle) {
    if (note.languages && note.languages.length > 1) {
      langToggle.style.display = 'flex';
    } else {
      langToggle.style.display = 'none';
    }
  }

  const pdfBody = document.getElementById('pdfBody');
  pdfBody.classList.remove('night-mode');
  
  const nightBtn = document.getElementById('pdfNightToggle');
  nightBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  
  // Open modal
  pdfModal.classList.add('active');
  
  renderPdfPage();
}

function renderPdfPage() {
  const container = document.getElementById('pdfPageContainer');
  const note = pdfReaderState.note;
  
  if (!note) return;
  
  // Reset container transform (used for HTML rendering zoom)
  container.style.transform = '';
  container.style.marginBottom = '';
  
  // Find correct PDF url based on active reader language
  const pdfUrl = pdfReaderState.lang === 'EN' ? note.pdfEN : (pdfReaderState.lang === 'BN' ? note.pdfBN : note.pdfHI);
  
  // CRITICAL REQUIREMENT: Add console.log(pdfUrl) for debugging
  console.log("Loading PDF URL:", pdfUrl);
  
  if (!pdfUrl) {
    showPdfNotAvailable(container, note, "No PDF path specified for this language.");
    return;
  }
  
  // Render loading spinner
  container.innerHTML = `
    <div class="pdf-loading-spinner" style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:300px; color:var(--text); gap:12px;">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:32px; color:var(--primary);"></i>
      <span style="font-size:14px; font-weight:500;">Loading PDF notes...</span>
    </div>
  `;
  
  currentPdfPageNum = 1;
  currentPdfDoc = null;
  
  // Check if running on local file system (CORS restriction bypass)
  if (window.location.protocol === 'file:') {
    console.log("Running under file:// protocol. Bypassing fetch and rendering via iframe fallback.");
    renderIframePDF(container, pdfUrl, note);
    return;
  }
  
  // If running via HTTP/HTTPS, attempt to load from IndexedDB or fetch from server
  getCachedPDF(pdfUrl).then(cachedBlob => {
    if (cachedBlob) {
      console.log("Loaded PDF from IndexedDB Cache:", pdfUrl);
      loadPdfWithLib(cachedBlob, container, note, pdfUrl);
    } else {
      console.log("PDF not cached. Fetching from network:", pdfUrl);
      fetch(pdfUrl)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to fetch PDF: status ${res.status}`);
          }
          return res.blob();
        })
        .then(blob => {
          // Cache in IndexedDB for subsequent offline requests
          cachePDF(pdfUrl, blob);
          loadPdfWithLib(blob, container, note, pdfUrl);
        })
        .catch(err => {
          console.error("Network fetch failed for PDF:", err);
          showPdfNotAvailable(container, note, `⚠ PDF not available`);
        });
    }
  }).catch(err => {
    console.error("IndexedDB cache read failed, attempting direct fetch:", err);
    fetch(pdfUrl)
      .then(res => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.blob();
      })
      .then(blob => {
        loadPdfWithLib(blob, container, note, pdfUrl);
      })
      .catch(fetchErr => {
        console.error("Direct fetch failed:", fetchErr);
        showPdfNotAvailable(container, note, `⚠ PDF not available`);
      });
  });
}

function loadPdfWithLib(blob, container, note, pdfUrl) {
  const blobUrl = URL.createObjectURL(blob);
  
  if (typeof pdfjsLib !== 'undefined') {
    try {
      pdfjsLib.getDocument(blobUrl).promise.then(function(pdfDoc_) {
        currentPdfDoc = pdfDoc_;
        const totalPagesSpan = document.getElementById('pdfTotalPages');
        if (totalPagesSpan) totalPagesSpan.textContent = pdfDoc_.numPages;
        
        renderCanvasPage(1);
      }).catch(function(error) {
        console.error("PDF.js promise load error, falling back to iframe:", error);
        renderIframePDF(container, pdfUrl, note);
      });
    } catch (e) {
      console.error("PDF.js synchronous load error, falling back to iframe:", e);
      renderIframePDF(container, pdfUrl, note);
    }
  } else {
    console.warn("PDF.js not defined. Loading in iframe.");
    renderIframePDF(container, pdfUrl, note);
  }
}

function renderIframePDF(container, pdfUrl, note) {
  container.innerHTML = `
    <div style="width: 100%; height: 100%; min-height: 500px; display: flex; flex-direction: column;">
      <iframe src="${pdfUrl}" style="width:100%; height:100%; flex:1; border:none; border-radius:12px; box-shadow: var(--shadow-sm);"></iframe>
      <div style="text-align: center; margin-top: 12px; padding: 0 16px;">
        <span style="font-size:12px; color:var(--muted);">If the PDF does not display, click the download button at the top right to open it in your system viewer.</span>
      </div>
    </div>
  `;
  const totalPagesSpan = document.getElementById('pdfTotalPages');
  if (totalPagesSpan) totalPagesSpan.textContent = '1';
  document.getElementById('pdfPageNum').textContent = '1';
}

function showPdfNotAvailable(container, note, message = "⚠ PDF not available") {
  container.innerHTML = `
    <div class="pdf-not-available-card" style="background: rgba(239, 68, 68, 0.08); border: 1.5px dashed rgba(239, 68, 68, 0.25); border-radius: 16px; padding: 24px; text-align: center; margin: 16px; display: flex; flex-direction: column; align-items: center; gap: 10px; animation: fadeIn 0.3s ease;">
      <div style="background: rgba(239, 68, 68, 0.15); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ef4444; font-size: 20px;">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h4 style="color: #ef4444; margin: 0; font-size: 16px; font-weight: 600;">${message}</h4>
      <p style="font-size: 13px; color: var(--text-muted); margin: 0; max-width: 320px;">The PDF file for this chapter could not be loaded. Showing HTML summary below instead.</p>
    </div>
  `;
  
  // Append HTML fallback summary below the warning card
  let summaryHtml = "";
  if (pdfReaderState.lang === 'EN') {
    summaryHtml = note.contentEN;
  } else if (pdfReaderState.lang === 'BN') {
    summaryHtml = note.contentBN;
  } else {
    summaryHtml = `<div style="font-size:11px; color:var(--muted); margin-bottom:8px;"><i class="fa-solid fa-info-circle"></i> Hindi summary is currently unavailable. Displaying English version instead.</div>` + note.contentEN;
  }
  
  container.innerHTML += `<div class="html-summary-content" style="padding: 16px;">${summaryHtml}</div>`;
  
  const totalPagesSpan = document.getElementById('pdfTotalPages');
  if (totalPagesSpan) totalPagesSpan.textContent = '1';
  document.getElementById('pdfPageNum').textContent = '1';
}

function renderCanvasPage(num) {
  if (!currentPdfDoc) return;
  pdfPageRendering = true;
  currentPdfPageNum = num;
  
  const container = document.getElementById('pdfPageContainer');
  container.innerHTML = '';
  
  const canvas = document.createElement('canvas');
  canvas.id = 'pdfCanvas';
  canvas.style.maxWidth = '100%';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.borderRadius = '12px';
  canvas.style.boxShadow = 'var(--shadow-md)';
  container.appendChild(canvas);
  
  currentPdfDoc.getPage(num).then(function(page) {
    // Dynamically calculate scale to fit the mobile screen container width perfectly (with 8px padding)
    const containerWidth = container.clientWidth || 360;
    const unscaledViewport = page.getViewport({scale: 1.0});
    const fitScale = (containerWidth - 16) / unscaledViewport.width;
    const scale = fitScale * (pdfReaderState.zoom / 100);
    const viewport = page.getViewport({scale: scale});
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    const renderTask = page.render(renderContext);
    
    renderTask.promise.then(function() {
      pdfPageRendering = false;
      document.getElementById('pdfPageNum').textContent = num;
      
      if (pdfPageNumPending !== null) {
        renderCanvasPage(pdfPageNumPending);
        pdfPageNumPending = null;
      }
    });
  }).catch(function(err) {
    console.error("Error rendering page:", err);
    pdfPageRendering = false;
  });
}

function queueRenderPage(num) {
  if (pdfPageRendering) {
    pdfPageNumPending = num;
  } else {
    renderCanvasPage(num);
  }
}

function renderHtmlFallback(container, note, warningText = "") {
  container.style.transform = `scale(${pdfReaderState.zoom / 100})`;
  container.style.marginBottom = `${(pdfReaderState.zoom - 100) * 1.5}px`;
  
  let headerHtml = "";
  if (warningText) {
    headerHtml = `<div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#ef4444; padding:12px; border-radius:12px; margin-bottom:16px; font-size:12px; display:flex; align-items:center; gap:8px;">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${warningText}</span>
    </div>`;
  }
  
  if (pdfReaderState.lang === 'EN') {
    container.innerHTML = headerHtml + note.contentEN;
  } else if (pdfReaderState.lang === 'BN') {
    container.innerHTML = headerHtml + note.contentBN;
  } else {
    // If active language is Hindi (HI) but HTML is only EN/BN, fallback to EN with small tip
    container.innerHTML = headerHtml + `<div style="font-size:11px; color:var(--muted); margin-bottom:8px;"><i class="fa-solid fa-info-circle"></i> Hindi summary is currently unavailable. Displaying English version instead.</div>` + note.contentEN;
  }
  
  const totalPagesSpan = document.getElementById('pdfTotalPages');
  if (totalPagesSpan) totalPagesSpan.textContent = '1';
  document.getElementById('pdfPageNum').textContent = '1';
}

// Close PDF modal
const closePdf = () => {
  pdfModal.classList.remove('active');
  pdfReaderState.note = null;
  currentPdfDoc = null;
};
document.getElementById('pdfCloseBtn').addEventListener('click', closePdf);
document.querySelector('#pdfModal .pdf-modal-overlay')?.addEventListener('click', closePdf);

// Translate toggling cycling through available languages
document.getElementById('pdfLangToggle').addEventListener('click', () => {
  const note = pdfReaderState.note;
  if (!note || !note.languages || note.languages.length <= 1) return;
  
  const currIdx = note.languages.indexOf(pdfReaderState.lang);
  const nextIdx = (currIdx + 1) % note.languages.length;
  pdfReaderState.lang = note.languages[nextIdx];
  
  document.getElementById('pdfLangIndicator').textContent = pdfReaderState.lang;
  renderPdfPage();
});

// Night Mode Toggle
document.getElementById('pdfNightToggle').addEventListener('click', () => {
  pdfReaderState.night = !pdfReaderState.night;
  const body = document.getElementById('pdfBody');
  const btn = document.getElementById('pdfNightToggle');
  
  if (pdfReaderState.night) {
    body.classList.add('night-mode');
    btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    body.classList.remove('night-mode');
    btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
});

// Zoom In
document.getElementById('pdfZoomInBtn').addEventListener('click', () => {
  if (pdfReaderState.zoom >= 140) return;
  pdfReaderState.zoom += 10;
  document.getElementById('pdfZoomVal').textContent = `${pdfReaderState.zoom}%`;
  if (currentPdfDoc) {
    queueRenderPage(currentPdfPageNum);
  } else {
    renderPdfPage();
  }
});

// Zoom Out
document.getElementById('pdfZoomOutBtn').addEventListener('click', () => {
  if (pdfReaderState.zoom <= 80) return;
  pdfReaderState.zoom -= 10;
  document.getElementById('pdfZoomVal').textContent = `${pdfReaderState.zoom}%`;
  if (currentPdfDoc) {
    queueRenderPage(currentPdfPageNum);
  } else {
    renderPdfPage();
  }
});

// Prev / Next Page Buttons
document.getElementById('pdfPrevBtn')?.addEventListener('click', () => {
  if (!currentPdfDoc || currentPdfPageNum <= 1) return;
  queueRenderPage(currentPdfPageNum - 1);
});

document.getElementById('pdfNextBtn')?.addEventListener('click', () => {
  if (!currentPdfDoc || currentPdfPageNum >= currentPdfDoc.numPages) return;
  queueRenderPage(currentPdfPageNum + 1);
});

// Download PDF button in the Reader Header
document.getElementById('pdfModalDownloadBtn')?.addEventListener('click', () => {
  const note = pdfReaderState.note;
  if (!note) return;
  const pdfUrl = pdfReaderState.lang === 'EN' ? note.pdfEN : (pdfReaderState.lang === 'BN' ? note.pdfBN : note.pdfHI);
  if (pdfUrl) {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfUrl.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});

// ==========================================
// PROFILE CUSTOMIZATION MODULE
// ==========================================

const profileModal = document.getElementById('profileModal');
const editProfileBtn = document.getElementById('editProfileBtn');
const profileCloseBtn = document.getElementById('profileCloseBtn');
const profileModalOverlay = document.getElementById('profileModalOverlay');
const profileSaveBtn = document.getElementById('profileSaveBtn');

const editNameInput = document.getElementById('editNameInput');
const editClassSelect = document.getElementById('editClassSelect');
const editStreamSelect = document.getElementById('editStreamSelect');
const editStreamLabel = document.getElementById('editStreamLabel');
const editStreamField = document.getElementById('editStreamField');
const editAvatarInput = document.getElementById('editAvatarInput');

// Default Profile Settings
let userProfile = {
  name: "Joydip",
  classNum: "10",
  stream: "Science",
  avatar: "J"
};

function loadUserProfile() {
  const saved = localStorage.getItem('shiksha_profile');
  if (saved) {
    try {
      userProfile = JSON.parse(saved);
    } catch(e) {
      console.error(e);
    }
  }
  applyUserProfile();
}

function applyUserProfile() {
  // Update names in DOM
  const homeGreetName = document.getElementById('homeGreetName');
  const profileCardName = document.getElementById('profileCardName');
  if (homeGreetName) homeGreetName.textContent = userProfile.name;
  if (profileCardName) profileCardName.textContent = userProfile.name;

  // Update avatars in DOM
  document.querySelectorAll('.avatar-char').forEach(el => {
    el.textContent = userProfile.avatar;
  });

  // Update Class & Stream display in Profile
  const profileCardSub = document.getElementById('profileCardSub');
  if (profileCardSub) {
    const streamStr = userProfile.classNum >= 11 ? ` · ${userProfile.stream}` : '';
    profileCardSub.textContent = `Class ${userProfile.classNum}${streamStr} · 🏆 Level 14`;
  }

  // Update Guide Bot welcome message dynamically
  const chatWelcome = document.querySelector('#chat .msg.bot p');
  if (chatWelcome) {
    chatWelcome.innerHTML = `Hi ${userProfile.name}! 👋 I'm your Guide Bot. I can show you how to use this app, find notes, study offline, or run quizzes. What would you like to do?`;
  }
}

// Toggle Stream Field based on class selection
function toggleEditStreamVisibility() {
  const val = editClassSelect.value;
  if (parseInt(val) >= 11) {
    editStreamLabel.style.display = 'block';
    editStreamField.style.display = 'flex';
  } else {
    editStreamLabel.style.display = 'none';
    editStreamField.style.display = 'none';
  }
}

editClassSelect.addEventListener('change', toggleEditStreamVisibility);

// Open Modal
editProfileBtn?.addEventListener('click', () => {
  editNameInput.value = userProfile.name;
  editClassSelect.value = userProfile.classNum;
  editStreamSelect.value = userProfile.stream || "General";
  editAvatarInput.value = userProfile.avatar;
  
  toggleEditStreamVisibility();
  profileModal.classList.add('active');
});

// Close Modal
function closeProfileModal() {
  profileModal.classList.remove('active');
}
profileCloseBtn?.addEventListener('click', closeProfileModal);
profileModalOverlay?.addEventListener('click', closeProfileModal);

// Save Modal Data
profileSaveBtn?.addEventListener('click', () => {
  const newName = editNameInput.value.trim();
  const newAvatar = editAvatarInput.value.trim();
  const newClass = editClassSelect.value;
  const newStream = newClass >= 11 ? editStreamSelect.value : "General";

  if (!newName) {
    alert("Please enter a name.");
    return;
  }
  if (!newAvatar) {
    alert("Please enter an avatar initial or emoji.");
    return;
  }

  userProfile = {
    name: newName,
    classNum: newClass,
    stream: newStream,
    avatar: newAvatar
  };

  localStorage.setItem('shiksha_profile', JSON.stringify(userProfile));
  applyUserProfile();
  closeProfileModal();
});

// ==========================================
// PERFORMANCE / PROGRESS MODULE LOGIC
// ==========================================

const CLASS_RANKINGS = [
  { rank: 1, name: "Aarav Sharma", score: 98, xp: 3210, avatar: "A", isYou: false, isGold: true },
  { rank: 2, name: "Priya Mukherjee", score: 95, xp: 2980, avatar: "P", isYou: false, isSilver: true },
  { rank: 3, name: "Rahul Kar", score: 91, xp: 2700, avatar: "R", isYou: false, isBronze: true },
  { rank: 4, name: "Sneha Sen", score: 88, xp: 2620, avatar: "S", isYou: false },
  { rank: 5, name: "Joydip Dey", score: 82, xp: 2480, avatar: "J", isYou: true }, // The User
  { rank: 6, name: "Ananya Roy", score: 80, xp: 2390, avatar: "A", isYou: false },
  { rank: 7, name: "Subhadip Saha", score: 79, xp: 2310, avatar: "S", isYou: false },
  { rank: 8, name: "Debarati Das", score: 75, xp: 2240, avatar: "D", isYou: false },
  { rank: 9, name: "Rohan Paul", score: 72, xp: 2180, avatar: "R", isYou: false },
  { rank: 10, name: "Bikram Ghosh", score: 68, xp: 2010, avatar: "B", isYou: false }
];

const SCHOOL_RANKINGS = [
  { rank: 1, name: "Sourav Ganguly", score: 99, xp: 5400, avatar: "S", isYou: false, isGold: true },
  { rank: 2, name: "Mimi Chakraborty", score: 97, xp: 4800, avatar: "M", isYou: false, isSilver: true },
  { rank: 3, name: "Dev Adhikari", score: 96, xp: 4200, avatar: "D", isYou: false, isBronze: true },
  { rank: 4, name: "Koel Mallick", score: 94, xp: 3900, avatar: "K", isYou: false },
  { rank: 11, name: "Aarav Sharma", score: 90, xp: 3210, avatar: "A", isYou: false },
  { rank: 12, name: "Joydip Dey", score: 82, xp: 2480, avatar: "J", isYou: true },
  { rank: 13, name: "Priya Mukherjee", score: 81, xp: 2980, avatar: "P", isYou: false },
  { rank: 14, name: "Subhradeep Paul", score: 80, xp: 2300, avatar: "S", isYou: false },
  { rank: 15, name: "Ishita Kundu", score: 78, xp: 2100, avatar: "I", isYou: false }
];

const DISTRICT_RANKINGS = [
  { rank: 1, name: "Srinjoy Dutta", score: 100, xp: 9800, avatar: "S", isYou: false, isGold: true },
  { rank: 2, name: "Anupam Roy", score: 99, xp: 8700, avatar: "A", isYou: false, isSilver: true },
  { rank: 3, name: "Shreya Ghoshal", score: 99, xp: 8500, avatar: "S", isYou: false, isBronze: true },
  { rank: 4, name: "Jeet Madnani", score: 98, xp: 7200, avatar: "J", isYou: false },
  { rank: 147, name: "Rohit Sen", score: 83, xp: 2500, avatar: "R", isYou: false },
  { rank: 148, name: "Joydip Dey", score: 82, xp: 2480, avatar: "J", isYou: true },
  { rank: 149, name: "Swagata Bose", score: 81, xp: 2460, avatar: "S", isYou: false }
];

const achievementModal = document.getElementById('achievementModal');
const leaderboardModal = document.getElementById('leaderboardModal');
let activeRankTab = 'class';

// Render Leaderboard in Modal
function renderLeaderboardModalList(filterQuery = '') {
  const list = document.getElementById('leaderboardModalList');
  if (!list) return;
  
  list.innerHTML = '';
  const query = filterQuery.toLowerCase();
  
  // Choose source list and subtitles
  let sourceList = CLASS_RANKINGS;
  let subtitleText = "Live rankings of Class 10";
  
  if (activeRankTab === 'school') {
    sourceList = SCHOOL_RANKINGS;
    subtitleText = "Top learners in GramEvidya High School";
  } else if (activeRankTab === 'district') {
    sourceList = DISTRICT_RANKINGS;
    subtitleText = "Rankings across Purba Medinipur District";
  }
  
  const sub = document.getElementById('leaderboardModalSub');
  if (sub) sub.textContent = subtitleText;
  
  // Dynamic replacement of logged-in user details
  const currentProfile = JSON.parse(localStorage.getItem('shiksha_profile') || '{}');
  const loggedInName = currentProfile.name || "Joydip Dey";
  const loggedInAvatar = currentProfile.avatar || "J";
  
  const currentXP = parseInt(localStorage.getItem('shiksha_user_xp') || '2480');
  
  const updatedList = sourceList.map(student => {
    if (student.isYou) {
      return {
        ...student,
        name: loggedInName + " (You)",
        avatar: loggedInAvatar,
        xp: currentXP
      };
    }
    return student;
  });
  
  const filtered = updatedList.filter(student => 
    student.name.toLowerCase().includes(query)
  );
  
  if (filtered.length === 0) {
    list.innerHTML = `
      <div style="text-align:center; padding: 40px 10px; color: var(--muted)">
        <i class="fa-solid fa-user-slash" style="font-size:28px; margin-bottom:10px; opacity:0.5"></i>
        <h5>No matches found</h5>
        <small>Try searching another name</small>
      </div>
    `;
    return;
  }
  
  filtered.forEach(item => {
    const div = document.createElement('div');
    let itemClass = 'lb-item';
    let rankEmoji = `#${item.rank}`;
    
    if (item.isGold) { itemClass += ' gold'; rankEmoji = '🥇'; }
    else if (item.isSilver) { itemClass += ' silver'; rankEmoji = '🥈'; }
    else if (item.isBronze) { itemClass += ' bronze'; rankEmoji = '🥉'; }
    
    if (item.isYou) { itemClass += ' you pulsing-you-row'; }
    
    div.className = itemClass;
    
    let medalHtml = '';
    if (item.isGold) {
      medalHtml = `<div class="crown-medal"><i class="fa-solid fa-crown"></i></div>`;
    } else if (item.isSilver) {
      medalHtml = `<div class="glow-medal silver-glow-effect"><i class="fa-solid fa-sparkles"></i></div>`;
    } else if (item.isBronze) {
      medalHtml = `<div class="glow-medal bronze-shine-effect"><i class="fa-solid fa-circle-nodes"></i></div>`;
    }
    
    div.innerHTML = `
      <span class="lb-rank">${rankEmoji}</span>
      <div class="lb-av-container">
        <div class="lb-av ${item.isYou ? 'you-av' : ''}">${item.avatar}</div>
        ${medalHtml}
      </div>
      <div class="lb-info">
        <h5>${item.name}</h5>
        <small>${item.xp.toLocaleString()} XP</small>
      </div>
      <span class="lb-score ${item.isYou ? 'you-score' : ''}">${item.score}%</span>
    `;
    list.appendChild(div);
  });
}

// Show achievement details modal
function showAchievementModal(name, isLocked, iconHtml, styles) {
  const title = document.getElementById('achievementModalTitle');
  const modalName = document.getElementById('achievementModalName');
  const modalDesc = document.getElementById('achievementModalDesc');
  const modalStatus = document.getElementById('achievementModalStatus');
  const iconWrap = document.getElementById('achievementModalIconWrap');
  
  const descriptions = {
    '7-Day Streak': 'Maintain a daily learning habit. Study every day for 7 consecutive days to keep your streak burning!',
    'Quiz Master': 'Prove your knowledge mastery. Score 80% or higher in 10 quizzes across any subject.',
    'Bookworm': 'Notes scholar. Read and download 5 or more comprehensive chapter syllabus notes for offline study.',
    'Top 10%': 'Elite academic standard. Keep your overall class scores in the top 10% of all West Bengal board learners.',
    'Streak King': 'Streak champion! Log in and study consecutively to keep the flames of consistency alive.',
    'Legend': 'Academic excellence legend. Reach Level 20 and accumulate over 5,000 XP through study and quizzes.',
    'Perfect Score': 'Flawless performance. Score 100% in 5 quizzes to unlock the gold crown of perfection.',
    'Perfect 100': 'Flawless performance. Score 100% in 5 quizzes to unlock the gold crown of perfection.'
  };
  
  modalName.textContent = name;
  modalDesc.textContent = descriptions[name] || 'A dynamic study achievement earned by advancing your curriculum preparation on Evidya.';
  
  iconWrap.className = 'achievement-modal-ico-wrap' + (isLocked ? ' locked' : '');
  iconWrap.innerHTML = iconHtml;
  iconWrap.setAttribute('style', styles);
  
  if (isLocked) {
    modalStatus.textContent = 'Locked';
    modalStatus.className = 'achievement-modal-status-badge locked';
    title.textContent = 'Badge Locked';
  } else {
    modalStatus.textContent = 'Unlocked';
    modalStatus.className = 'achievement-modal-status-badge';
    title.textContent = 'Achievement Unlocked! 🎉';
    
    setTimeout(() => {
      iconWrap.style.transform = 'scale(1.15)';
      setTimeout(() => {
        iconWrap.style.transform = '';
      }, 250);
    }, 300);
  }
  
  achievementModal.classList.add('active');
}

// Interactive Weekly Activity Tooltip click callback
function showWeeklyTooltip(day, xp, element) {
  document.querySelectorAll('.b .b-tip').forEach(tip => {
    tip.style.opacity = '';
    tip.style.transform = '';
  });
  
  const tip = element.querySelector('.b-tip');
  if (tip) {
    tip.textContent = `${day} → ${xp}`;
    tip.style.opacity = '1';
    tip.style.transform = 'translateY(-4px)';
    
    setTimeout(() => {
      if (tip.textContent === `${day} → ${xp}`) {
        tip.style.opacity = '';
        tip.style.transform = '';
      }
    }, 2500);
  }
}

// Particle Confetti Emitter for Daily Mission Rewards
function triggerConfetti() {
  const container = document.getElementById('rewardConfetti');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < 65; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-p';
    
    // Spread horizontal offset and gravity fall height
    const tx = (Math.random() * 260 - 130) + 'px';
    const ty = (Math.random() * 180 + 100) + 'px';
    
    p.style.setProperty('--tx', tx);
    p.style.setProperty('--ty', ty);
    
    // Position center relative
    p.style.left = '50%';
    p.style.top = '40%';
    p.style.marginLeft = (Math.random() * 20 - 10) + 'px';
    p.style.marginTop = (Math.random() * 20 - 10) + 'px';
    
    const colors = ['#7c3aed', '#00C2FF', '#f59e0b', '#10b981', '#ec4899', '#ff4500'];
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    const scale = Math.random() * 0.8 + 0.6;
    p.style.transform = `scale(${scale})`;
    p.style.animationDelay = (Math.random() * 0.25) + 's';
    
    container.appendChild(p);
  }
}

// Smooth XP levels and text elements count sweep
function incrementXPAndAnimate() {
  const ptsEl = document.querySelector('.xp-pts');
  const fillEl = document.querySelector('.xp-bar-fill');
  const nextEl = document.querySelector('.xp-next');
  
  if (!ptsEl || !fillEl || !nextEl) return;
  
  const currentXP = parseInt(localStorage.getItem('shiksha_user_xp') || '2480');
  const targetXP = currentXP + 120;
  localStorage.setItem('shiksha_user_xp', targetXP);
  
  let animXP = currentXP;
  const increment = 5;
  const intervalTime = 25;
  
  const timer = setInterval(() => {
    animXP += increment;
    if (animXP >= targetXP) {
      animXP = targetXP;
      clearInterval(timer);
    }
    
    ptsEl.textContent = `${animXP.toLocaleString()} XP`;
    
    // Level 14 is e.g. 2000 to 3000 XP. Level progress:
    const progressPct = Math.floor((animXP - 2000) / 1000 * 100);
    fillEl.style.setProperty('--xp-w', `${progressPct}%`);
    fillEl.style.width = `${progressPct}%`;
    nextEl.textContent = `${3000 - animXP} XP to Level 15`;
    
    // Sync profile and leaderboard items
    const miniStatsXp = document.querySelector('.mini-stats div h4');
    if (miniStatsXp) miniStatsXp.textContent = animXP.toLocaleString();
    
    const youLbItemXpSummary = document.querySelector('.leaderboard-card .lb-item.you small');
    if (youLbItemXpSummary) youLbItemXpSummary.textContent = `${animXP.toLocaleString()} XP`;
  }, intervalTime);
}

// Setup Performance screen events & initializers
let xpPopupTimeouts = [];
function initProgressModule() {
  // Clear any pending XP popup timeouts
  xpPopupTimeouts.forEach(t => clearTimeout(t));
  xpPopupTimeouts = [];

  // Restore persisted XP settings
  const currentXP = parseInt(localStorage.getItem('shiksha_user_xp') || '2480');
  const ptsEl = document.querySelector('.xp-pts');
  const fillEl = document.querySelector('.xp-bar-fill');
  const nextEl = document.querySelector('.xp-next');
  if (ptsEl && fillEl && nextEl) {
    ptsEl.textContent = `${currentXP.toLocaleString()} XP`;
    const progressPct = Math.floor((currentXP - 2000) / 1000 * 100);
    fillEl.style.setProperty('--xp-w', `${progressPct}%`);
    fillEl.style.width = `${progressPct}%`;
    nextEl.textContent = `${3000 - currentXP} XP to Level 15`;
  }

  // 1. Dynamic SVG progress ring sweep animation
  const perfRing = document.getElementById('perfRing');
  const perfPctVal = document.getElementById('perfPct');
  if (perfRing && perfPctVal) {
    const pct = parseInt(perfPctVal.textContent) || 82;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    
    perfRing.style.strokeDasharray = `${circumference}`;
    perfRing.style.strokeDashoffset = `${circumference}`;
    
    // Force DOM reflow to ensure the sweep animation runs from 0%
    perfRing.getBoundingClientRect();
    
    const offset = circumference - (circumference * pct / 100);
    perfRing.style.strokeDashoffset = `${offset}`;
  }
  
  // 2. Counter count-up animations
  const counters = document.querySelectorAll('.anim-counter');
  counters.forEach(counter => {
    if (counter.dataset.timerId) {
      clearInterval(parseInt(counter.dataset.timerId));
    }
    counter.textContent = '0';
    const target = parseInt(counter.dataset.target) || 0;
    const suffix = counter.dataset.suffix || '';
    if (target === 0) return;
    
    let current = 0;
    const duration = 1200; // milliseconds
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = target / steps;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = Math.floor(current) + suffix;
    }, stepTime);
    counter.dataset.timerId = timer;
  });
  
  // 3. Dynamic replacement of logged-in user details in leaderboard summary
  const currentProfile = JSON.parse(localStorage.getItem('shiksha_profile') || '{}');
  const loggedInName = currentProfile.name || "Joydip";
  const loggedInAvatar = currentProfile.avatar || "J";
  
  const youLbItemName = document.querySelector('.lb-item.you .lb-info h5');
  const youLbItemAv = document.querySelector('.lb-item.you .lb-av');
  const youLbItemXp = document.querySelector('.lb-item.you .lb-info small');
  
  if (youLbItemName) youLbItemName.textContent = loggedInName + " (You)";
  if (youLbItemAv) youLbItemAv.textContent = loggedInAvatar;
  if (youLbItemXp) youLbItemXp.textContent = `${currentXP.toLocaleString()} XP`;

  // 4. Spawn flying XP popup tokens on card load that drift up and disappear
  const xpContainer = document.getElementById('xpPopupsContainer');
  if (xpContainer) {
    xpContainer.innerHTML = '';
    const popups = [
      { text: '+50 XP', top: '38%', left: '25%' },
      { text: '+120 XP', top: '32%', left: '72%' }
    ];
    popups.forEach((pop, idx) => {
      const t1 = setTimeout(() => {
        const el = document.createElement('span');
        el.className = 'xp-popup-token';
        el.textContent = pop.text;
        el.style.top = pop.top;
        el.style.left = pop.left;
        xpContainer.appendChild(el);
        
        const t2 = setTimeout(() => el.remove(), 1500);
        xpPopupTimeouts.push(t2);
      }, idx * 400);
      xpPopupTimeouts.push(t1);
    });
  }
}

// Bind Achievements list click handlers
document.addEventListener('DOMContentLoaded', () => {
  const badgeChips = document.querySelectorAll('.badge-chip');
  badgeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const badgeName = chip.querySelector('small').textContent;
      const isLocked = chip.querySelector('.badge-ico').classList.contains('locked') || chip.querySelector('.badge-ico').classList.contains('locked-blur');
      const iconHtml = chip.querySelector('.badge-ico').innerHTML;
      const styles = chip.querySelector('.badge-ico').getAttribute('style') || '';
      
      showAchievementModal(badgeName, isLocked, iconHtml, styles);
    });
  });
  
  // Bind AI Insights expand/collapse toggle
  document.querySelectorAll('.ai-recommendation-card').forEach(card => {
    const btn = card.querySelector('.expand-ai-btn');
    const header = card.querySelector('.ai-insight-header');
    const expandable = card.querySelector('.ai-expandable-content');
    
    const toggleCard = (e) => {
      if (e.target.closest('.ai-suggest-btn') || e.target.closest('.ai-action-buttons')) return;
      const isExpanded = card.classList.toggle('expanded');
      if (expandable) {
        expandable.style.display = isExpanded ? 'block' : 'none';
      }
    };
    
    header?.addEventListener('click', toggleCard);
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCard(e);
    });
  });

  // Bind AI Mathematics suggest button (Practice 5 Algebra MCQs)
  const mathsActionBtn = document.getElementById('aiMathActionBtn');
  if (mathsActionBtn) {
    mathsActionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notesSel = {
        classNum: "10",
        stream: "General",
        subject: "Mathematics"
      };
      updateNotesBreadcrumbs();
      renderChaptersList();
      showFlowStep('stepNotesList');
      go('notes');
      
      // Custom haptic spotlight effect scrolling and pulsing the Mathematics card
      setTimeout(() => {
        const targetCard = document.getElementById('card_c10_math_ch1');
        if (targetCard) {
          targetCard.style.transition = 'all 0.6s ease';
          targetCard.style.boxShadow = '0 0 25px rgba(124, 58, 237, 0.55)';
          targetCard.style.borderColor = 'var(--primary)';
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          setTimeout(() => {
            targetCard.style.boxShadow = '';
            targetCard.style.borderColor = '';
          }, 3000);
        }
      }, 500);
    });
  }

  // Biology recommendation suggestion action button
  const bioActionBtn = document.querySelector('.biology-reco .ai-suggest-btn');
  if (bioActionBtn) {
    bioActionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Show dynamic locked badge unlock trigger
      showAchievementModal('Perfect Score', false, '<i class="fa-solid fa-award"></i>', '--bc:#ec4899;--bs:rgba(236,72,153,.35)');
    });
  }
  
  // Bind Leaderboard "View All" interaction
  const lbViewAllBtn = document.getElementById('lbViewAllLink');
  lbViewAllBtn?.addEventListener('click', () => {
    activeRankTab = 'class';
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('lbTabClass')?.classList.add('active');
    renderLeaderboardModalList();
    leaderboardModal.classList.add('active');
  });

  const achSecHead = Array.from(document.querySelectorAll('.progress-page .sec-head')).find(el => el.textContent.includes('Achievements'));
  const achViewAllBtn = achSecHead ? achSecHead.querySelector('.link') : null;
  achViewAllBtn?.addEventListener('click', () => {
    showAchievementModal('7-Day Streak', false, '<i class="fa-solid fa-fire"></i>', '--bc:#fbbf24;--bs:rgba(251,191,36,.35)');
  });

  // Bind close buttons for new modals
  document.getElementById('achievementCloseBtn')?.addEventListener('click', () => {
    achievementModal.classList.remove('active');
  });
  document.getElementById('achievementModalOverlay')?.addEventListener('click', () => {
    achievementModal.classList.remove('active');
  });
  document.getElementById('leaderboardCloseBtn')?.addEventListener('click', () => {
    leaderboardModal.classList.remove('active');
  });
  document.getElementById('leaderboardModalOverlay')?.addEventListener('click', () => {
    leaderboardModal.classList.remove('active');
  });
  
  // Bind Leaderboard Search input
  document.getElementById('leaderboardSearchInput')?.addEventListener('input', (e) => {
    renderLeaderboardModalList(e.target.value);
  });

  // Bind Leaderboard Modal tab click handlers
  document.getElementById('lbTabClass')?.addEventListener('click', () => {
    activeRankTab = 'class';
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('lbTabClass').classList.add('active');
    renderLeaderboardModalList();
  });

  document.getElementById('lbTabSchool')?.addEventListener('click', () => {
    activeRankTab = 'school';
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('lbTabSchool').classList.add('active');
    renderLeaderboardModalList();
  });

  document.getElementById('lbTabDistrict')?.addEventListener('click', () => {
    activeRankTab = 'district';
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('lbTabDistrict').classList.add('active');
    renderLeaderboardModalList();
  });

  // Wire Gamified Daily Missions Checklist Claim trigger
  const claimMissionBtn = document.getElementById('claimMissionBtn');
  if (claimMissionBtn) {
    // Restore persisted claimed state on load
    const isClaimed = localStorage.getItem('shiksha_mission_claimed') === 'true';
    if (isClaimed) {
      claimMissionBtn.disabled = true;
      claimMissionBtn.textContent = 'Claimed';
      claimMissionBtn.classList.remove('active-claim');
      claimMissionBtn.classList.add('claimed');
      
      const unclaimedItem = document.getElementById('unclaimedMission');
      if (unclaimedItem) {
        const icoBox = unclaimedItem.querySelector('.mission-ico-box');
        if (icoBox) {
          icoBox.classList.remove('pulse-active');
          icoBox.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        }
      }
    }

    claimMissionBtn.addEventListener('click', () => {
      const rewardModal = document.getElementById('rewardModal');
      if (rewardModal) rewardModal.classList.add('active');
      
      triggerConfetti();
      incrementXPAndAnimate();
      
      localStorage.setItem('shiksha_mission_claimed', 'true');
      
      claimMissionBtn.disabled = true;
      claimMissionBtn.textContent = 'Claimed';
      claimMissionBtn.classList.remove('active-claim');
      claimMissionBtn.classList.add('claimed');
      
      const unclaimedItem = document.getElementById('unclaimedMission');
      if (unclaimedItem) {
        const icoBox = unclaimedItem.querySelector('.mission-ico-box');
        if (icoBox) {
          icoBox.classList.remove('pulse-active');
          icoBox.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        }
      }
    });
  }

  // Reward Modal close triggers
  document.getElementById('rewardCloseBtn')?.addEventListener('click', () => {
    document.getElementById('rewardModal').classList.remove('active');
  });
  document.getElementById('rewardModalOverlay')?.addEventListener('click', () => {
    document.getElementById('rewardModal').classList.remove('active');
  });

  // Wire AI Companion Orb click tooltip cycling
  const companionTips = [
    "🤖 Need help with Maths today?",
    "💡 Tap Achievements to view your milestones!",
    "🚀 Your Science score is up +5%!",
    "📚 Download physical science chapters to study offline!",
    "🔥 Keep your streak alive! 3 days left to level up!"
  ];
  let tipIndex = 0;
  
  const companionOrb = document.getElementById('aiCompanionOrb');
  const orbTooltip = document.getElementById('orbTooltip');
  
  if (companionOrb && orbTooltip) {
    companionOrb.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = companionOrb.classList.contains('show-tip');
      
      if (isShowing) {
        tipIndex = (tipIndex + 1) % companionTips.length;
        orbTooltip.textContent = companionTips[tipIndex];
        
        const core = companionOrb.querySelector('.orb-core');
        if (core) {
          core.style.transform = 'scale(0.85)';
          setTimeout(() => core.style.transform = '', 150);
        }
      } else {
        companionOrb.classList.add('show-tip');
      }
    });
    
    document.body.addEventListener('click', () => {
      companionOrb.classList.remove('show-tip');
    });
  }
});

// ==========================================
// QUIZ MODULE FUNCTIONALITY
// ==========================================
const QUIZ_QUESTIONS = {
  Mathematics: [
    {
      text: "What is the value of pi (approximate to 2 decimal places)?",
      options: ["A. 3.12", "B. 3.14", "C. 3.16", "D. 3.18"],
      correctIdx: 1
    },
    {
      text: "If 3x + 5 = 20, what is the value of x?",
      options: ["A. 3", "B. 4", "C. 5", "D. 6"],
      correctIdx: 2
    },
    {
      text: "The sum of angles in a triangle is:",
      options: ["A. 90 degrees", "B. 180 degrees", "C. 270 degrees", "D. 360 degrees"],
      correctIdx: 1
    },
    {
      text: "What is the square root of 144?",
      options: ["A. 10", "B. 11", "C. 12", "D. 13"],
      correctIdx: 2
    },
    {
      text: "Which of the following is a prime number?",
      options: ["A. 9", "B. 15", "C. 21", "D. 23"],
      correctIdx: 3
    }
  ],
  Physics: [
    {
      text: "Which law explains rocket propulsion?",
      options: ["A. Newton's First Law", "B. Newton's Second Law", "C. Newton's Third Law", "D. Law of Gravitation"],
      correctIdx: 2
    },
    {
      text: "What is the unit of electric current?",
      options: ["A. Volt", "B. Ampere", "C. Ohm", "D. Watt"],
      correctIdx: 1
    },
    {
      text: "What type of wave is light?",
      options: ["A. Longitudinal wave", "B. Sound wave", "C. Electromagnetic wave", "D. Pressure wave"],
      correctIdx: 2
    },
    {
      text: "Which instrument is used to measure atmospheric pressure?",
      options: ["A. Thermometer", "B. Barometer", "C. Ammeter", "D. Lactometer"],
      correctIdx: 1
    },
    {
      text: "The speed of sound is maximum in:",
      options: ["A. Vacuum", "B. Air", "C. Water", "D. Steel / Solids"],
      correctIdx: 3
    }
  ]
};

let quizState = {
  subject: null,
  questions: [],
  currentIdx: 0,
  score: 0,
  timerInterval: null,
  timerSeconds: 0,
  hasAnswered: false
};

function initQuizModule() {
  stopQuizTimer();
  quizState = {
    subject: null,
    questions: [],
    currentIdx: 0,
    score: 0,
    timerInterval: null,
    timerSeconds: 0,
    hasAnswered: false
  };
  renderQuizStartScreen();
}

function stopQuizTimer() {
  if (quizState.timerInterval) {
    clearInterval(quizState.timerInterval);
    quizState.timerInterval = null;
  }
}

function startQuizTimer() {
  stopQuizTimer();
  quizState.timerSeconds = 0;
  const timerEl = document.getElementById('quizTimer');
  if (timerEl) timerEl.innerHTML = `<i class="fa-regular fa-clock"></i> 00:00`;
  
  quizState.timerInterval = setInterval(() => {
    quizState.timerSeconds++;
    const mins = String(Math.floor(quizState.timerSeconds / 60)).padStart(2, '0');
    const secs = String(quizState.timerSeconds % 60).padStart(2, '0');
    const tEl = document.getElementById('quizTimer');
    if (tEl) {
      tEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${mins}:${secs}`;
    }
  }, 1000);
}

function renderQuizStartScreen() {
  const page = document.getElementById('quizPageContent');
  if (!page) return;
  
  page.innerHTML = `
    <header class="page-head">
      <button class="icon-btn back" data-go="home"><i class="fa-solid fa-arrow-left"></i></button>
      <h3>Quiz Challenge</h3>
    </header>
    
    <div style="padding: 10px 0;">
      <div class="quiz-start-card">
        <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(6, 182, 212, 0.15)); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 28px; margin: 0 auto 16px;">
          <i class="fa-solid fa-graduation-cap"></i>
        </div>
        <h4 style="font-size:18px; font-weight:700; margin-bottom:8px; color:var(--text)">Test Your Knowledge</h4>
        <p style="font-size:13px; color:var(--muted); margin-bottom:20px; line-height:1.5;">Choose a subject below to start a quick 5-question quiz challenge. Earn XP and level up your rank!</p>
        
        <button class="quiz-subject-btn math" onclick="startQuiz('Mathematics')">
          <i class="fa-solid fa-square-root-variable"></i> Mathematics Quiz
        </button>
        <button class="quiz-subject-btn physics" onclick="startQuiz('Physics')">
          <i class="fa-solid fa-atom"></i> Physics Quiz
        </button>
      </div>
    </div>
    <div class="bottom-pad"></div>
  `;
}

function startQuiz(subject) {
  quizState.subject = subject;
  quizState.questions = [...QUIZ_QUESTIONS[subject]];
  quizState.currentIdx = 0;
  quizState.score = 0;
  quizState.hasAnswered = false;
  
  startQuizTimer();
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const page = document.getElementById('quizPageContent');
  if (!page) return;
  
  const question = quizState.questions[quizState.currentIdx];
  const total = quizState.questions.length;
  const pct = Math.round(((quizState.currentIdx + 1) / total) * 100);
  
  page.innerHTML = `
    <header class="page-head">
      <button class="icon-btn back" onclick="initQuizModule()"><i class="fa-solid fa-arrow-left"></i></button>
      <h3>Quiz · ${quizState.subject}</h3>
      <span class="timer" id="quizTimer"><i class="fa-regular fa-clock"></i> 00:00</span>
    </header>
    <div class="quiz-progress"><span style="width:${pct}%"></span></div>
    <p class="qcount">Question ${quizState.currentIdx + 1} of ${total}</p>
    
    <div class="question-card">
      <h3 style="font-size: 15px; line-height:1.5; color:var(--text);">${question.text}</h3>
      <div class="options" id="quizOptionsContainer">
        ${question.options.map((optText, index) => `
          <button class="opt" onclick="selectQuizOption(${index})">${optText}</button>
        `).join('')}
      </div>
    </div>
    
    <div class="xp" id="quizXpAlert" style="display:none; animation: fadeIn 0.3s ease;">
      <i class="fa-solid fa-bolt"></i> <span id="quizXpAlertText">+30 XP earned</span>
    </div>
    
    <button class="primary-btn" id="quizNextBtn" style="display:none; width: 100%; justify-content: center; align-items: center; gap: 8px; margin-top: 10px;" onclick="nextQuizQuestion()">
      <span>Next Question</span> <i class="fa-solid fa-arrow-right"></i>
    </button>
    <div class="bottom-pad"></div>
  `;
  
  // Sync timer display immediately
  const timerEl = document.getElementById('quizTimer');
  if (timerEl) {
    const mins = String(Math.floor(quizState.timerSeconds / 60)).padStart(2, '0');
    const secs = String(quizState.timerSeconds % 60).padStart(2, '0');
    timerEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${mins}:${secs}`;
  }
}

function selectQuizOption(selectedIdx) {
  if (quizState.hasAnswered) return;
  quizState.hasAnswered = true;
  
  const question = quizState.questions[quizState.currentIdx];
  const optionsContainer = document.getElementById('quizOptionsContainer');
  if (!optionsContainer) return;
  const buttons = optionsContainer.querySelectorAll('.opt');
  const isCorrect = selectedIdx === question.correctIdx;
  
  if (isCorrect) {
    quizState.score++;
  }
  
  buttons.forEach((btn, idx) => {
    // Disable interactions
    btn.removeAttribute('onclick');
    btn.style.cursor = 'default';
    
    if (idx === question.correctIdx) {
      btn.classList.add('correct');
    } else if (idx === selectedIdx && !isCorrect) {
      btn.classList.add('incorrect');
    }
  });
  
  // Show XP Alert banner
  const xpAlert = document.getElementById('quizXpAlert');
  const xpAlertText = document.getElementById('quizXpAlertText');
  const nextBtn = document.getElementById('quizNextBtn');
  
  if (xpAlert && xpAlertText && nextBtn) {
    if (isCorrect) {
      xpAlert.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a)';
      xpAlert.style.color = '#92400e';
      xpAlertText.textContent = '+30 XP earned';
    } else {
      xpAlert.style.background = 'rgba(239, 68, 68, 0.08)';
      xpAlert.style.color = '#ef4444';
      xpAlertText.textContent = 'Incorrect (+0 XP)';
    }
    xpAlert.style.display = 'block';
    
    // If it's the last question, change next button text
    if (quizState.currentIdx === quizState.questions.length - 1) {
      nextBtn.querySelector('span').textContent = 'Finish Quiz';
    }
    nextBtn.style.display = 'flex';
  }
}

function nextQuizQuestion() {
  quizState.currentIdx++;
  quizState.hasAnswered = false;
  
  if (quizState.currentIdx < quizState.questions.length) {
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  stopQuizTimer();
  const page = document.getElementById('quizPageContent');
  if (!page) return;
  
  const total = quizState.questions.length;
  const finalScore = quizState.score;
  const xpEarned = finalScore * 30; // 30 XP per correct answer
  const pct = Math.round((finalScore / total) * 100);
  
  // Save XP to localStorage and update app stats
  if (xpEarned > 0) {
    const currentXP = parseInt(localStorage.getItem('shiksha_user_xp') || '2480');
    const targetXP = currentXP + xpEarned;
    localStorage.setItem('shiksha_user_xp', targetXP);
    
    // Sync XP values inside UI stats if they exist
    const ptsEl = document.querySelector('.xp-pts');
    if (ptsEl) ptsEl.textContent = `${targetXP.toLocaleString()} XP`;
    
    const fillEl = document.querySelector('.xp-bar-fill');
    if (fillEl) {
      const progressPct = Math.floor((targetXP - 2000) / 1000 * 100);
      fillEl.style.setProperty('--xp-w', `${progressPct}%`);
      fillEl.style.width = `${progressPct}%`;
    }
    
    const nextEl = document.querySelector('.xp-next');
    if (nextEl) nextEl.textContent = `${3000 - targetXP} XP to Level 15`;
    
    const miniStatsXp = document.querySelector('.mini-stats div h4');
    if (miniStatsXp) miniStatsXp.textContent = targetXP.toLocaleString();
    
    const youLbItemXpSummary = document.querySelector('.leaderboard-card .lb-item.you small');
    if (youLbItemXpSummary) youLbItemXpSummary.textContent = `${targetXP.toLocaleString()} XP`;
  }
  
  let resultMsg = "Keep practicing to improve! 📚";
  if (pct === 100) {
    resultMsg = "Outstanding! Perfect Score! 🏆";
  } else if (pct >= 80) {
    resultMsg = "Amazing job! You're super smart! 🌟";
  } else if (pct >= 60) {
    resultMsg = "Good effort! Try again to get 100%! 👍";
  }
  
  page.innerHTML = `
    <header class="page-head">
      <button class="icon-btn back" onclick="initQuizModule()"><i class="fa-solid fa-arrow-left"></i></button>
      <h3>Quiz Complete</h3>
    </header>
    
    <div style="padding: 10px 0;">
      <div class="quiz-result-card">
        <h4 style="font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 8px;">${resultMsg}</h4>
        <p style="font-size: 13px; color: var(--muted); margin-bottom: 16px;">Subject: ${quizState.subject}</p>
        
        <div class="quiz-score-circle" style="border-color: ${pct >= 60 ? '#22c55e' : '#7c3aed'};">
          <h2>${finalScore}/${total}</h2>
          <span>Correct</span>
        </div>
        
        <p style="font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 24px;">
          Accuracy: <span style="color: ${pct >= 60 ? '#22c55e' : '#7c3aed'};">${pct}%</span>
        </p>
        
        <div class="xp" style="margin-bottom: 24px; animation: pulse 2s infinite;">
          <i class="fa-solid fa-bolt"></i> +${xpEarned} XP Awarded!
        </div>
        
        <button class="quiz-subject-btn math" style="margin-top: 0; margin-bottom: 12px;" onclick="initQuizModule()">
          <i class="fa-solid fa-rotate-left"></i> Take Another Quiz
        </button>
        
        <button class="quiz-subject-btn physics" style="background: transparent; color: var(--primary); border: 2px solid var(--primary); box-shadow: none;" onclick="go('home')">
          <i class="fa-solid fa-house"></i> Back to Home
        </button>
      </div>
    </div>
    <div class="bottom-pad"></div>
  `;
}

// Bind to window for inline HTML onclick compatibility
window.initQuizModule = initQuizModule;
window.startQuiz = startQuiz;
window.renderQuizQuestion = renderQuizQuestion;
window.selectQuizOption = selectQuizOption;
window.nextQuizQuestion = nextQuizQuestion;
window.finishQuiz = finishQuiz;

// ==========================================
// ASSIGNMENTS MODULE SYSTEM
// ==========================================
const ASSIGNMENTS_DATABASE = [
  // Class 6
  {
    id: "assign_c6_math_ex12",
    classNum: "6",
    subject: "Mathematics",
    title: "Solve Exercise 1.2 on Numbers & Operations",
    deadline: "In 2 days",
    daysRemaining: 2,
    difficulty: "Easy",
    xp: 100,
    resources: {
      noteId: "c6_math_ch1",
      chapter: "Chapter 1: Numbers & Operations",
      video: "Video Lecture: Whole Numbers and arithmetic rules",
      materials: "Reference sheet for Place Value and arithmetic operations"
    }
  },
  {
    id: "assign_c6_bio_cell",
    classNum: "6",
    subject: "Biology",
    title: "Draw and label structure of a plant cell",
    deadline: "June 3, 2026",
    daysRemaining: 7,
    difficulty: "Medium",
    xp: 150,
    resources: {
      noteId: "gen_c6_general_biology_ch1",
      chapter: "Chapter 1: Life Processes & Cells",
      video: "Video: Overview of plant cell structures",
      materials: "Handout: Plant cell organelles diagram list"
    }
  },
  // Class 7
  {
    id: "assign_c7_phy_newton",
    classNum: "7",
    subject: "Physical Science",
    title: "Write 5 examples of Newton's third law in daily life",
    deadline: "Tomorrow",
    daysRemaining: 1,
    difficulty: "Medium",
    xp: 120,
    resources: {
      noteId: "gen_c7_general_physical_science_ch1",
      chapter: "Chapter 1: Matter, Force & Chemical Systems",
      video: "Video Lecture: Newton's laws of motion animations",
      materials: "Newtonian mechanics cheat sheet"
    }
  },
  {
    id: "assign_c7_bio_animal",
    classNum: "7",
    subject: "Biology",
    title: "List components of animal cells and functions",
    deadline: "In 4 days",
    daysRemaining: 4,
    difficulty: "Hard",
    xp: 200,
    resources: {
      noteId: "gen_c7_general_biology_ch1",
      chapter: "Chapter 1: Life Processes & Cells",
      video: "Video Lecture: Animal cells vs Plant cells organelle analysis",
      materials: "Handout: Organelles dictionary list"
    }
  },
  // Class 8
  {
    id: "assign_c8_bio_cells",
    classNum: "8",
    subject: "Biology",
    title: "Compare plant cells and animal cells in a table",
    deadline: "June 8, 2026",
    daysRemaining: 12,
    difficulty: "Medium",
    xp: 150,
    resources: {
      noteId: "gen_c8_general_biology_ch1",
      chapter: "Chapter 1: Life Processes & Cells",
      video: "Video: Structural comparison of cells",
      materials: "Summary sheet: Cell structures Venn diagram guide"
    }
  },
  {
    id: "assign_c8_phy_speed",
    classNum: "8",
    subject: "Physical Science",
    title: "Explain the difference between speed and velocity",
    deadline: "Tomorrow",
    daysRemaining: 1,
    difficulty: "Easy",
    xp: 100,
    resources: {
      noteId: "gen_c8_general_physical_science_ch1",
      chapter: "Chapter 1: Matter, Force & Chemical Systems",
      video: "Video Lecture: Scalar vs Vector quantities",
      materials: "Mechanics reference notes"
    }
  },
  // Class 9
  {
    id: "assign_c9_math_quad",
    classNum: "9",
    subject: "Mathematics",
    title: "Solve quadratic equation practice problems",
    deadline: "In 3 days",
    daysRemaining: 3,
    difficulty: "Hard",
    xp: 180,
    resources: {
      noteId: "gen_c9_general_mathematics_ch1",
      chapter: "Chapter 1: Algebra & Geometry Essentials",
      video: "Video Lecture: Solving basic quadratic equations",
      materials: "Exercise worksheet: 15 equations with step solutions"
    }
  },
  // Class 10
  {
    id: "assign_c10_phy_refrac",
    classNum: "10",
    subject: "Physical Science",
    title: "Solve refraction index numerical problems",
    deadline: "June 2, 2026",
    daysRemaining: 6,
    difficulty: "Hard",
    xp: 200,
    resources: {
      noteId: "c10_ps_ch5",
      chapter: "Chapter 5: Light & Refraction",
      video: "Video Lecture: Snell's Law and Refractive Indices calculations",
      materials: "Formulas list: Light refraction index and angles"
    }
  },
  {
    id: "assign_c10_math_quads",
    classNum: "10",
    subject: "Mathematics",
    title: "Solve board level quadratic equations",
    deadline: "Tomorrow",
    daysRemaining: 1,
    difficulty: "Medium",
    xp: 150,
    resources: {
      noteId: "c10_math_ch1",
      chapter: "Chapter 1: Quadratic Equations",
      video: "Video: Sridhar Acharya formula derivation and roots",
      materials: "Formula Sheet: Quadratic roots classification"
    }
  },
  // Class 11
  {
    id: "assign_c11_phy_coulomb",
    classNum: "11",
    subject: "Physics",
    title: "State and derive Coulomb's Law",
    deadline: "June 6, 2026",
    daysRemaining: 10,
    difficulty: "Medium",
    xp: 150,
    resources: {
      noteId: "gen_c11_science_physics_ch1",
      chapter: "Chapter 1: Matter, Force & Chemical Systems",
      video: "Video: Coulomb's Law and electrostatic constants",
      materials: "Reference notes: Forces and field points"
    }
  },
  // Class 12
  {
    id: "assign_c12_phy_electro",
    classNum: "12",
    subject: "Physics",
    title: "Solve Electrostatics field intensity problems",
    deadline: "Tomorrow",
    daysRemaining: 1,
    difficulty: "Hard",
    xp: 220,
    resources: {
      noteId: "c12_phy_ch1",
      chapter: "Chapter 1: Electrostatics & Coulomb's Law",
      video: "Video Lecture: Field Intensity vectors step-by-step",
      materials: "Worked problems sheet: 10 field points calculations"
    }
  },
  {
    id: "assign_c12_chem_solid",
    classNum: "12",
    subject: "Chemistry",
    title: "Differentiate between crystalline and amorphous solids",
    deadline: "In 3 days",
    daysRemaining: 3,
    difficulty: "Medium",
    xp: 160,
    resources: {
      noteId: "c12_chem_ch1",
      chapter: "Chapter 1: Solid State",
      video: "Video Lecture: Crystal systems structure overview",
      materials: "Handout: Bravais Lattice structures cheat sheet"
    }
  }
];

let customAssignments = JSON.parse(localStorage.getItem('shiksha_custom_assignments') || '[]');
let completedAssignmentIds = JSON.parse(localStorage.getItem('shiksha_completed_assignments') || '[]');
let activeAssignmentFilter = 'all';

function initAssignmentsModule() {
  const currentClass = userProfile.classNum || "10";
  const headerClassEl = document.getElementById('assignClassHeader');
  if (headerClassEl) {
    headerClassEl.textContent = currentClass;
  }
  
  activeAssignmentFilter = 'all';
  
  // Highlight active filter pill
  updateAssignmentFilterPills();
  
  renderAssignmentsList();
}

function updateAssignmentFilterPills() {
  const filterIds = {
    'all': 'btnAssignFilterAll',
    'pending': 'btnAssignFilterPending',
    'due': 'btnAssignFilterDue',
    'completed': 'btnAssignFilterCompleted'
  };
  
  Object.keys(filterIds).forEach(fKey => {
    const el = document.getElementById(filterIds[fKey]);
    if (el) {
      el.classList.toggle('active', fKey === activeAssignmentFilter);
    }
  });
}

function filterAssignments(filterType) {
  activeAssignmentFilter = filterType;
  updateAssignmentFilterPills();
  renderAssignmentsList();
}

function renderAssignmentsList() {
  const container = document.getElementById('assignmentsListContainer');
  if (!container) return;
  
  const currentClass = String(userProfile.classNum || "10").trim();
  
  // Filter assignments matching active class (custom assignments placed first)
  let assignments = [...customAssignments, ...ASSIGNMENTS_DATABASE].filter(a => String(a.classNum).trim() === currentClass);
  
  // Apply filter states
  if (activeAssignmentFilter === 'pending') {
    assignments = assignments.filter(a => !completedAssignmentIds.includes(a.id));
  } else if (activeAssignmentFilter === 'due') {
    assignments = assignments.filter(a => !completedAssignmentIds.includes(a.id) && a.daysRemaining <= 2);
  } else if (activeAssignmentFilter === 'completed') {
    assignments = assignments.filter(a => completedAssignmentIds.includes(a.id));
  }
  
  if (assignments.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--muted); animation: fadeUp 0.3s ease;">
        <i class="fa-solid fa-folder-open" style="font-size: 36px; margin-bottom: 12px; opacity: 0.5;"></i>
        <p style="font-size: 14px; font-weight: 500;">No assignments found under this filter.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = assignments.map(a => {
    const isCompleted = completedAssignmentIds.includes(a.id);
    const diffClass = a.difficulty.toLowerCase();
    
    // Check if the referenced noteId exists in our WBBSE_NOTES array
    const noteExists = WBBSE_NOTES.some(n => n.id === a.resources.noteId);
    
    return `
      <div class="assignment-card ${isCompleted ? 'completed-glow' : ''}" id="card_${a.id}">
        <div class="assignment-header">
          <span class="assignment-subject">${a.subject}</span>
          <span class="assignment-diff ${diffClass}">${a.difficulty}</span>
        </div>
        
        <h4 class="assignment-title">${a.title}</h4>
        
        <div class="assignment-meta-row">
          <div class="assignment-meta-item xp-badge">
            <i class="fa-solid fa-bolt"></i> +${a.xp} XP
          </div>
          <div class="assignment-meta-item">
            <i class="fa-regular fa-calendar"></i> Due: ${a.deadline}
          </div>
        </div>
        
        <!-- Resources Needed Section -->
        <div class="assignment-resources">
          <div class="assignment-resources-title">
            <i class="fa-solid fa-suitcase"></i> Resources Needed
          </div>
          ${noteExists ? `
            <div class="resource-link" onclick="openPdfModal('${a.resources.noteId}')">
              <i class="fa-regular fa-file-pdf"></i>
              <span>PDF Notes: ${a.resources.chapter}</span>
            </div>
          ` : `
            <div class="resource-link" style="opacity: 0.7; cursor: default;">
              <i class="fa-solid fa-book-open"></i>
              <span>Chapter: ${a.resources.chapter}</span>
            </div>
          `}
          <div class="resource-link" style="opacity: 0.7; cursor: default;">
            <i class="fa-solid fa-circle-play"></i>
            <span>${a.resources.video}</span>
          </div>
          <div class="resource-link" style="opacity: 0.7; cursor: default;">
            <i class="fa-solid fa-link"></i>
            <span>${a.resources.materials}</span>
          </div>
        </div>
        
        <div class="assignment-action-wrapper" id="action_wrap_${a.id}">
          ${isCompleted ? `
            <div class="assignment-completed-badge">
              <i class="fa-solid fa-circle-check"></i> Completed
            </div>
          ` : `
            <button class="assignment-action-btn" onclick="markAssignmentComplete('${a.id}', ${a.xp})">
              <i class="fa-solid fa-check"></i> Mark as Complete
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function markAssignmentComplete(assignId, xp) {
  if (completedAssignmentIds.includes(assignId)) return;
  
  // Update state and save
  completedAssignmentIds.push(assignId);
  localStorage.setItem('shiksha_completed_assignments', JSON.stringify(completedAssignmentIds));
  
  // Award XP using existing progressive animation
  const ptsEl = document.querySelector('.xp-pts');
  const fillEl = document.querySelector('.xp-bar-fill');
  const nextEl = document.querySelector('.xp-next');
  
  const currentXP = parseInt(localStorage.getItem('shiksha_user_xp') || '2480');
  const targetXP = currentXP + xp;
  localStorage.setItem('shiksha_user_xp', targetXP);
  
  let animXP = currentXP;
  const timer = setInterval(() => {
    animXP += 5;
    if (animXP >= targetXP) {
      animXP = targetXP;
      clearInterval(timer);
    }
    
    if (ptsEl) ptsEl.textContent = `${animXP.toLocaleString()} XP`;
    if (fillEl) {
      const progressPct = Math.floor((animXP - 2000) / 1000 * 100);
      fillEl.style.setProperty('--xp-w', `${progressPct}%`);
      fillEl.style.width = `${progressPct}%`;
    }
    if (nextEl) nextEl.textContent = `${3000 - animXP} XP to Level 15`;
    
    const miniStatsXp = document.querySelector('.mini-stats div h4');
    if (miniStatsXp) miniStatsXp.textContent = animXP.toLocaleString();
    
    const youLbItemXpSummary = document.querySelector('.leaderboard-card .lb-item.you small');
    if (youLbItemXpSummary) youLbItemXpSummary.textContent = `${animXP.toLocaleString()} XP`;
  }, 25);
  
  // Smooth CSS state transition animation on card
  const card = document.getElementById(`card_${assignId}`);
  const actionWrap = document.getElementById(`action_wrap_${assignId}`);
  
  if (card) {
    card.classList.add('completed-glow');
  }
  
  if (actionWrap) {
    actionWrap.innerHTML = `
      <div class="assignment-completed-badge">
        <i class="fa-solid fa-circle-check"></i> Completed
      </div>
    `;
  }
  
  // Trigger success toast representation or simple micro feedback
  console.log(`Assignment ${assignId} completed! Awarded ${xp} XP.`);
  
  // Re-render list after animation complete if filter is set to pending to hide it smoothly
  if (activeAssignmentFilter === 'pending' || activeAssignmentFilter === 'completed') {
    setTimeout(() => {
      renderAssignmentsList();
    }, 1200);
  }
}

function openAddAssignmentModal() {
  // Clear/Reset fields
  document.getElementById('newAssignSubject').value = "Mathematics";
  document.getElementById('newAssignTitle').value = "";
  document.getElementById('newAssignDeadline').value = "";
  document.getElementById('newAssignDifficulty').value = "Medium";
  document.getElementById('newAssignXp').value = "100";
  document.getElementById('newAssignMaterial').value = "";
  
  // Populate notes dropdown based on active class
  const currentClass = String(userProfile.classNum || "10").trim();
  const selectNote = document.getElementById('newAssignNoteAttachment');
  if (selectNote) {
    selectNote.innerHTML = '<option value="">None (Custom Task Only)</option>';
    
    // Filter WBBSE_NOTES matching student's active class
    const classNotes = WBBSE_NOTES.filter(n => String(n.classNum).trim() === currentClass);
    classNotes.forEach(note => {
      const opt = document.createElement('option');
      opt.value = note.id;
      opt.textContent = `${note.subject} - ${note.titleEN}`;
      selectNote.appendChild(opt);
    });
  }
  
  const modal = document.getElementById('addAssignmentModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeAddAssignmentModal() {
  const modal = document.getElementById('addAssignmentModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function submitNewAssignment() {
  const subject = document.getElementById('newAssignSubject').value;
  const title = document.getElementById('newAssignTitle').value.trim();
  const deadline = document.getElementById('newAssignDeadline').value.trim();
  const difficulty = document.getElementById('newAssignDifficulty').value;
  const xp = parseInt(document.getElementById('newAssignXp').value) || 100;
  const noteId = document.getElementById('newAssignNoteAttachment').value;
  const materials = document.getElementById('newAssignMaterial').value.trim() || 'Reference notes';

  if (!title) {
    alert("Please enter an assignment title.");
    return;
  }
  if (!deadline) {
    alert("Please enter a deadline/due date.");
    return;
  }

  // Find note info if attached
  let chapterTitle = "Study Chapter";
  if (noteId) {
    const attachedNote = WBBSE_NOTES.find(n => n.id === noteId);
    if (attachedNote) {
      chapterTitle = `Chapter ${attachedNote.chapterNum || 1}: ${attachedNote.titleEN}`;
    }
  }

  const currentClass = String(userProfile.classNum || "10").trim();

  const newAssignment = {
    id: "assign_custom_" + Date.now(),
    classNum: currentClass,
    subject: subject,
    title: title,
    deadline: deadline,
    daysRemaining: 5,
    difficulty: difficulty,
    xp: xp,
    resources: {
      noteId: noteId || "",
      chapter: chapterTitle,
      video: `Video: Reference lecture for ${subject}`,
      materials: materials
    }
  };

  customAssignments.push(newAssignment);
  localStorage.setItem('shiksha_custom_assignments', JSON.stringify(customAssignments));

  closeAddAssignmentModal();
  renderAssignmentsList();
}

// Bind to window for inline HTML onclick compatibility
window.initAssignmentsModule = initAssignmentsModule;
window.filterAssignments = filterAssignments;
window.markAssignmentComplete = markAssignmentComplete;
window.openAddAssignmentModal = openAddAssignmentModal;
window.closeAddAssignmentModal = closeAddAssignmentModal;
window.submitNewAssignment = submitNewAssignment;

// ============================================================
// NOTIFICATIONS MODULE (KOLKATA SCHOLARSHIP ALERTS)
// ============================================================

// Default notification data
const DEFAULT_NOTIFICATIONS = [
  {
    id: "notif_svmcm",
    title: "SVMCM Scholarship 2026",
    category: "scholarship",
    date: "Just now",
    summary: "Swami Vivekananda Merit-cum-Means Scholarship is open for West Bengal board students. Apply online.",
    unread: true,
    icon: "fa-graduation-cap",
    details: {
      amount: "₹12,000 to ₹60,000 / Year",
      description: "The Swami Vivekananda Merit-cum-Means Scholarship (SVMCM) is a premier West Bengal government scheme providing financial aid to merit students of Kolkata and West Bengal who are studying at post-madhyamik or higher levels.",
      eligibility: [
        "Must be a resident of West Bengal and studying in a WB institution",
        "Must have secured at least 60% marks in the qualifying board exam (Madhyamik / HS)",
        "Annual family income must not exceed ₹2,50,000"
      ],
      documents: [
        "Mark sheet of Madhyamik / HS examination",
        "Admit card / Proof of Admission in current course",
        "Family Income Certificate from Gazetted Officer (A-grade)",
        "Domicile Certificate (Aadhaar / Voter Card / Ration Card)",
        "Bank account passbook first page showing IFSC and Account Number"
      ],
      deadline: "August 31, 2026",
      provider: "Govt of West Bengal (Higher Education Dept)",
      applyUrl: "https://svmcm.wbhed.gov.in"
    }
  },
  {
    id: "notif_kanyashree",
    title: "Kanyashree K2 Grant Open",
    category: "scholarship",
    date: "2 hours ago",
    summary: "One-time scholarship grant of ₹25,000 for female students in Kolkata schools.",
    unread: true,
    icon: "fa-award",
    details: {
      amount: "₹25,000 One-time Grant",
      description: "Kanyashree Prakalpa (K2 Scheme) is a targeted cash transfer program by the Government of West Bengal that aims to improve the status of girls and discourage child marriage. It provides a financial incentive for girls to continue school and college education.",
      eligibility: [
        "Must be a female resident of West Bengal",
        "Aged between 18 and 19 years old",
        "Enrolled in and regularly attending school, college, or vocational training in Kolkata/West Bengal",
        "Family income must not exceed ₹1,20,000 per annum (income ceiling waived for girls with special needs or institutional care)"
      ],
      documents: [
        "Age proof certificate (Madhyamik Admit Card / Birth Certificate)",
        "Declaration of unmarried status signed by self and parent/guardian",
        "Income Certificate / Self-Declaration",
        "Institution enrollment copy (admission receipt)",
        "Bank account details (linked to Aadhaar)"
      ],
      deadline: "July 31, 2026",
      provider: "Dept of Women & Child Development, West Bengal",
      applyUrl: "https://www.wbkanyashree.gov.in"
    }
  },
  {
    id: "notif_nabanna",
    title: "Nabanna (Chief Minister's) Scholarship",
    category: "scholarship",
    date: "1 day ago",
    summary: "Chief Minister's Relief Fund scholarship is open. Award of ₹10,000 per year.",
    unread: false,
    icon: "fa-landmark",
    details: {
      amount: "₹10,000 / Year",
      description: "The Nabanna Scholarship (also known as the Chief Minister's Relief Fund Scholarship) helps needy, meritorious students of Kolkata and West Bengal who have passed Madhyamik or HS and wish to continue their education but require financial assistance.",
      eligibility: [
        "Must be a permanent resident of West Bengal",
        "Passed previous Board exam with 50% to 60% marks (Madhyamik or HS)",
        "Must not be receiving any other state/central government scholarship",
        "Annual family income must be less than ₹1,20,000"
      ],
      documents: [
        "Application Form with recommendation of local MLA/MP",
        "Previous exam Marksheets and Admit Cards",
        "Income Certificate from BDO / SD / DM / Gazetted Group A Officer",
        "Self-Declaration regarding non-receipt of other scholarships",
        "Bank Passbook showing Account No and IFSC"
      ],
      deadline: "October 15, 2026",
      provider: "Chief Minister's Office (CMO), Nabanna, Shibpur",
      applyUrl: "https://wbcmo.gov.in"
    }
  },
  {
    id: "notif_aikyashree",
    title: "Aikyashree minority scheme open",
    category: "scholarship",
    date: "3 days ago",
    summary: "Pre-matric & post-matric minority scholarship application is active.",
    unread: false,
    icon: "fa-book-reader",
    details: {
      amount: "₹3,000 to ₹18,000 / Year",
      description: "Aikyashree is a flagship scholarship portal for minority students (Buddhist, Christian, Muslim, Sikh, Parsi, Jain) in West Bengal. It offers Pre-Matric, Post-Matric, Merit-cum-Means, and Talent Support scholarships to help students pursue school and university degrees.",
      eligibility: [
        "Must be a citizen of India and domicile of West Bengal",
        "Must belong to a recognized Minority community",
        "Secured at least 50% marks in the previous final examination (except Class 1)",
        "Family income must be below ₹2,000,000 per year (for post-matric & merit-cum-means)"
      ],
      documents: [
        "Self-attested copy of previous qualifying mark sheet",
        "Domicile Certificate of West Bengal",
        "Minority Community self-declaration certificate",
        "Income certificate issued by competent authority",
        "Bank Passbook copy with IFSC"
      ],
      deadline: "September 30, 2026",
      provider: "West Bengal Minority Development & Finance Corporation (WBMDFC)",
      applyUrl: "http://wbmdfcscholarship.org"
    }
  },
  {
    id: "notif_gpbirla",
    title: "GP Birla Scholarship 2026",
    category: "scholarship",
    date: "1 week ago",
    summary: "Scholarship of up to ₹50,000 per year for students passed Class 12.",
    unread: false,
    icon: "fa-user-graduate",
    details: {
      amount: "Up to ₹50,000 / Year + Hostel Allowance",
      description: "The G.P. Birla Educational Foundation provides financial support to Kolkata/West Bengal students who have recently passed Class 12 board exams and are looking to study engineering, medicine, commerce, science, or arts in any Indian college.",
      eligibility: [
        "Must have passed Class 12 from West Bengal Council of Higher Secondary Education (WBCHSE) or CBSE/ICSE in West Bengal in 2026",
        "Rank in top 15,000 in WB Board or secured 85% or more in CBSE/ISC",
        "Family income must be less than ₹3,00,000 per year"
      ],
      documents: [
        "Class 10 and 12 Board Marksheet",
        "Proof of admission in undergraduate course (Engineering, Medical, BSC, BCOM, etc.)",
        "Income tax return copy / Income Certificate from appropriate authorities",
        "Two letters of recommendation from high school principals or teachers"
      ],
      deadline: "July 15, 2026",
      provider: "G.P. Birla Educational Foundation, Kolkata",
      applyUrl: "https://gpbirlafoundation.com"
    }
  },
  {
    id: "notif_jbnsts",
    title: "JBNSTS Senior Talent Search Alert",
    category: "scholarship",
    date: "2 weeks ago",
    summary: "Scientific talent search examination in West Bengal. Stipend + book grant.",
    unread: false,
    icon: "fa-atom",
    details: {
      amount: "₹4,000 / Month + ₹5,000 Annual Book Grant",
      description: "Jagadis Bose National Science Talent Search (JBNSTS) is a premier autonomous scientific institution in Kolkata, West Bengal. The Senior Talent Search aims to identify and nurture Kolkata's best science minds currently studying basic science, engineering, or medicine in West Bengal colleges.",
      eligibility: [
        "Passed Class 12 Board Exam from West Bengal (WBCHSE / CBSE / ISC)",
        "Currently enrolled in 1st year Science (Hons), Engineering (BE/BTech), or Medicine (MBBS) degree in West Bengal colleges",
        "Strong passion for research in science and technology"
      ],
      documents: [
        "Class 10 and 12 Board Mark sheets",
        "Admission slip / Course Fees Receipt of current institution",
        "Pass passport size photo",
        "Application Fee details (or online receipt)"
      ],
      deadline: "July 20, 2026",
      provider: "Jagadis Bose National Science Talent Search, Kolkata",
      applyUrl: "https://jbnsts.ac.in"
    }
  },
  {
    id: "notif_update_offline",
    title: "Siksha Offline Mode 2.0 Live",
    category: "update",
    date: "3 weeks ago",
    summary: "You can now download and view biology notes completely offline. Try it now!",
    unread: false,
    icon: "fa-circle-down",
    details: {
      amount: "New App Update",
      description: "Siksha has upgraded the offline studying mechanism. You can now download notes including full Bengali translations and diagram references, completely saving storage. Turn on offline mode in profile settings to test.",
      eligibility: [
        "All registered learners on Siksha app",
        "WBBSE Class 5-10, WBCHSE Class 11-12 syllabus notes"
      ],
      documents: [
        "No documents required. Simply update the app from the settings menu."
      ],
      deadline: "N/A (Permanent feature)",
      provider: "Siksha Dev Team, Kolkata",
      applyUrl: "#offline-download"
    }
  }
];

let notifList = [];
let notifFilter = 'all';

function initNotificationsModule() {
  // Load from localStorage or seed
  const stored = localStorage.getItem('shiksha_notifications');
  if (stored) {
    notifList = JSON.parse(stored);
  } else {
    notifList = JSON.parse(JSON.stringify(DEFAULT_NOTIFICATIONS));
    localStorage.setItem('shiksha_notifications', JSON.stringify(notifList));
  }
  
  // Render
  renderNotificationsList();
  
  // Clear home page notification badge dot when visiting
  clearNotificationBadges();
}

function clearNotificationBadges() {
  // Hide red dot badges on the app
  document.querySelectorAll('.dot-badge').forEach(badge => {
    badge.style.display = 'none';
  });
}

function updateNotificationBadgeDot() {
  // Check if we have any unread notifications
  const stored = localStorage.getItem('shiksha_notifications');
  const items = stored ? JSON.parse(stored) : DEFAULT_NOTIFICATIONS;
  const hasUnread = items.some(n => n.unread);
  
  document.querySelectorAll('.dot-badge').forEach(badge => {
    badge.style.display = hasUnread ? 'block' : 'none';
  });
}

function renderNotificationsList() {
  const container = document.getElementById('notificationsList');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Filter items
  const filtered = notifList.filter(item => {
    if (notifFilter === 'scholarships') return item.category === 'scholarship';
    if (notifFilter === 'updates') return item.category === 'update';
    return true;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="notif-empty-state">
        <i class="fa-solid fa-bell-slash"></i>
        <h4>No notifications found</h4>
        <p>There are no notifications in this category right now.</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach((notif, index) => {
    const card = document.createElement('div');
    card.className = `notification-card ${notif.unread ? 'unread' : ''}`;
    card.style.animationDelay = `${index * 50}ms`;
    
    // Select styling based on category
    const iconClass = notif.category === 'scholarship' ? 'scholarship' : 'update';
    const tagClass = notif.category === 'scholarship' ? 'scholarship' : 'update';
    const tagText = notif.category === 'scholarship' ? 'Scholarship' : 'App Update';
    
    // Add date/deadline details
    let footerHtml = '';
    if (notif.category === 'scholarship') {
      footerHtml = `
        <div class="notif-footer">
          <div class="notif-deadline-info">
            <i class="fa-regular fa-calendar-times"></i> Apply by ${notif.details.deadline}
          </div>
          <button class="notif-more-btn">Apply Now <i class="fa-solid fa-chevron-right"></i></button>
        </div>
      `;
    } else {
      footerHtml = `
        <div class="notif-footer">
          <span style="font-size: 10px; color: var(--muted)">Read release notes</span>
          <button class="notif-more-btn">Details <i class="fa-solid fa-chevron-right"></i></button>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="notif-header">
        <div class="notif-icon ${iconClass}">
          <i class="fa-solid ${notif.icon}"></i>
        </div>
        <div class="notif-meta">
          <h5>${notif.title}</h5>
          <small>${notif.date}</small>
        </div>
        <span class="notif-badge ${tagClass}">${tagText}</span>
      </div>
      <div class="notif-body">
        ${notif.summary}
      </div>
      ${footerHtml}
    `;
    
    card.addEventListener('click', () => {
      openNotificationDetails(notif.id);
    });
    
    container.appendChild(card);
  });
}

function filterNotifications(filter) {
  notifFilter = filter;
  
  // Update active buttons styling
  document.querySelectorAll('#btnNotifFilterAll, #btnNotifFilterScholarships, #btnNotifFilterUpdates').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (filter === 'all') {
    document.getElementById('btnNotifFilterAll')?.classList.add('active');
  } else if (filter === 'scholarships') {
    document.getElementById('btnNotifFilterScholarships')?.classList.add('active');
  } else if (filter === 'updates') {
    document.getElementById('btnNotifFilterUpdates')?.classList.add('active');
  }
  
  renderNotificationsList();
}

function openNotificationDetails(id) {
  // Find item
  const notif = notifList.find(n => n.id === id);
  if (!notif) return;
  
  // Mark as read
  if (notif.unread) {
    notif.unread = false;
    localStorage.setItem('shiksha_notifications', JSON.stringify(notifList));
    renderNotificationsList();
    updateNotificationBadgeDot();
  }
  
  // Populate modal
  document.getElementById('notifDetailsTitle').textContent = notif.title;
  document.getElementById('notifDetailsSubtitle').textContent = notif.category === 'scholarship' ? 'Kolkata Scholarship' : 'System Notice';
  document.getElementById('notifDetailsAmt').textContent = notif.details.amount;
  document.getElementById('notifDetailsDesc').textContent = notif.details.description;
  document.getElementById('notifDetailsDeadline').textContent = notif.details.deadline;
  document.getElementById('notifDetailsProvider').textContent = notif.details.provider;
  
  // Icon
  const iconWrap = document.getElementById('notifDetailsIconWrap');
  if (iconWrap) {
    iconWrap.innerHTML = `<i class="fa-solid ${notif.icon}"></i>`;
    if (notif.category === 'scholarship') {
      iconWrap.style.background = 'linear-gradient(135deg, #10b981, #22c55e)';
    } else {
      iconWrap.style.background = 'linear-gradient(135deg, #3b82f6, #06b6d4)';
    }
  }
  
  // Badge
  const badge = document.getElementById('notifDetailsBadge');
  if (badge) {
    badge.textContent = notif.category === 'scholarship' ? 'Scholarship' : 'App Update';
    badge.className = `notif-badge ${notif.category}`;
  }
  
  // Eligibility
  const elList = document.getElementById('notifDetailsEligibility');
  const elWrap = document.getElementById('notifDetailsEligibilityWrap');
  if (elList && elWrap) {
    elList.innerHTML = '';
    if (notif.details.eligibility && notif.details.eligibility.length > 0) {
      elWrap.style.display = 'block';
      notif.details.eligibility.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        elList.appendChild(li);
      });
    } else {
      elWrap.style.display = 'none';
    }
  }
  
  // Documents
  const docList = document.getElementById('notifDetailsDocs');
  const docWrap = document.getElementById('notifDetailsDocsWrap');
  if (docList && docWrap) {
    docList.innerHTML = '';
    if (notif.details.documents && notif.details.documents.length > 0) {
      docWrap.style.display = 'block';
      notif.details.documents.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        docList.appendChild(li);
      });
    } else {
      docWrap.style.display = 'none';
    }
  }
  
  // Action apply button
  const applyBtn = document.getElementById('notifDetailsApplyBtn');
  if (applyBtn) {
    if (notif.category === 'scholarship') {
      applyBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Apply Now`;
      applyBtn.onclick = () => {
        // Mock copy to clipboard and toast
        navigator.clipboard.writeText(notif.details.applyUrl).then(() => {
          showToast(`Application link copied to clipboard! 🚀`);
          closeNotificationDetails();
        }).catch(err => {
          // Fallback if clipboard fails
          showToast(`Link: ${notif.details.applyUrl}`);
          closeNotificationDetails();
        });
      };
    } else {
      applyBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Acknowledge`;
      applyBtn.onclick = () => {
        if (notif.details.applyUrl === '#offline-download') {
          closeNotificationDetails();
          go('downloads');
        } else {
          showToast(`Thank you for confirming! 👍`);
          closeNotificationDetails();
        }
      };
    }
  }
  
  // Open modal
  document.getElementById('notifDetailsModal')?.classList.add('active');
}

function closeNotificationDetails() {
  document.getElementById('notifDetailsModal')?.classList.remove('active');
}

function markAllNotificationsRead() {
  notifList.forEach(n => {
    n.unread = false;
  });
  localStorage.setItem('shiksha_notifications', JSON.stringify(notifList));
  renderNotificationsList();
  updateNotificationBadgeDot();
  showToast(`All notifications marked as read! 🧹`, `fa-check-double`);
}

// Toast helper
function showToast(msg, icon = 'fa-check') {
  // Remove existing toast if present
  const oldToast = document.querySelector('.evidya-toast');
  if (oldToast) oldToast.remove();
  
  const toast = document.createElement('div');
  toast.className = 'evidya-toast';
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${msg}</span>
  `;
  
  const phone = document.querySelector('.phone');
  if (phone) {
    phone.appendChild(toast);
    
    // Trigger animations
    setTimeout(() => toast.classList.add('active'), 50);
    
    // Self-destruct
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }
}

// Bind modal closing
document.getElementById('notifDetailsCloseBtn')?.addEventListener('click', closeNotificationDetails);
document.getElementById('notifDetailsModalOverlay')?.addEventListener('click', closeNotificationDetails);
document.getElementById('notifMarkAllReadBtn')?.addEventListener('click', markAllNotificationsRead);

// Check if badge needs initialization at startup
window.addEventListener('DOMContentLoaded', () => {
  // If notifications data isn't in localStorage, seed it so that unread badge appears on startup
  if (!localStorage.getItem('shiksha_notifications')) {
    localStorage.setItem('shiksha_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
  }
  updateNotificationBadgeDot();
});

// Bind methods for window context
window.initNotificationsModule = initNotificationsModule;
window.filterNotifications = filterNotifications;
window.openNotificationDetails = openNotificationDetails;
window.closeNotificationDetails = closeNotificationDetails;
window.markAllNotificationsRead = markAllNotificationsRead;
window.showToast = showToast;

// Init
loadUserProfile();
go('splash');


