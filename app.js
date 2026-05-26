/* ============================================================
   Loma' 海洋喝吧 — app.js
   ============================================================ */

'use strict';

/* ── 內容資料 ── */
const MOMENTS_DATA = [
  {
    id: 1,
    amis: "Mihamis kamo haw?",
    zh: "你今天喝了嗎？",
    story: "部落長輩見面的問候不是「你好嗎」，而是「你喝了嗎？」——飲食即關懷，滋養即問候。",
    duration: 30,
    mood: ["tired", "homesick"],
    audioSrc: null
  },
  {
    id: 2,
    amis: "Nga'ay ho, wawa!",
    zh: "你好啊，孩子！",
    story: "Nga'ay ho 是阿美族最溫暖的問候語。無論身在何處，你永遠是族人的孩子。",
    duration: 30,
    mood: ["homesick", "peaceful"],
    audioSrc: null
  },
  {
    id: 3,
    amis: "Lalung ko tayra.",
    zh: "讓我們一起去吧。",
    story: "阿美族的文化從不是獨行，而是共行。海洋的路，需要族人一起走。",
    duration: 30,
    mood: ["tired", "nostalgic"],
    audioSrc: null
  },
  {
    id: 4,
    amis: "Matinaay ko faloco' ko wawa.",
    zh: "孩子的心是純淨的。",
    story: "每一個長大後迷路的人，都曾擁有最清澈的海洋之心。回到那裡，你還在。",
    duration: 30,
    mood: ["nostalgic", "peaceful"],
    audioSrc: null
  }
];

const SHOP_DATA = [
  { id: 1, name: "手工藺草杯墊", brand: "太巴塱工坊", price: 280, emoji: "🌾" },
  { id: 2, name: "阿美族刺繡胸針", brand: "Sra 手作", price: 450, emoji: "🧵" },
  { id: 3, name: "天然小米酒", brand: "部落釀造所", price: 580, emoji: "🌾" },
  { id: 4, name: "海岸山蔗糖", brand: "花蓮好食", price: 320, emoji: "🎋" }
];

const MAP_DATA = [
  {
    id: 1,
    name: "花蓮石梯坪",
    type: "海岸聖地",
    desc: "阿美族傳統漁場，望向太平洋的第一排。",
    hours: "全天開放",
    find: "沿台11線往南，花蓮縣豐濱鄉石梯坪路段。",
    bestTime: "清晨5-7點，海面反光最美，可見豐年祭前族人捕魚。",
    story: "這片海是祖先記憶的起點。每年豐年祭前，族中長輩仍會來此向海祈福，帶回第一條魚。",
    who: "適合想感受阿美族海洋文化的旅人，也適合想靜下來聽海的都市族人。",
    founder: ""
  },
  {
    id: 2,
    name: "太巴塱部落",
    type: "文化部落",
    desc: "全台最大阿美族部落之一，竹製工藝聞名。",
    hours: "文化中心 9:00-17:00（週一休）",
    find: "花蓮縣光復鄉大興村，從光復火車站搭計程車約10分鐘。",
    bestTime: "週末午後，常有文化導覽與手作體驗活動。",
    story: "太巴塱意為「螃蟹多的地方」，這裡的族人世代以竹藺草編織維生，每一件工藝都是文化的記憶。",
    who: "喜歡手作體驗、想深入了解阿美族文化的旅人。",
    founder: "Loma' 合作夥伴：太巴塱工坊"
  }
];

/* ── State ── */
const state = {
  currentScreen: 'screen-home',
  selectedMood: null,
  currentMoment: MOMENTS_DATA[0],
  isPlaying: false,
  playProgress: 0,
  playTimer: null,
  showLyrics: true,
  ambientWavesOn: true,
  ambientCampfireOn: false,
  bookmarks: [],
  notificationsRead: false,
  profileName: '',
  profileTribe: ''
};

/* ── LIFF Init ── */
async function initLiff() {
  try {
    if (typeof liff !== 'undefined') {
      await liff.init({ liffId: "YOUR_LIFF_ID" });
      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        state.profileName = profile.displayName || '';
        const nameInput = document.getElementById('profile-name');
        if (nameInput && state.profileName) nameInput.value = state.profileName;
      }
    }
  } catch (e) {
    console.log('LIFF not available (dev mode)');
  }
}

/* ── NAVIGATION ── */
window.navigateTo = function(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    state.currentScreen = screenId;
  }

  // Update bottom nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === screenId);
  });

  // Hide/show nav bar on welcome screen
  const frame = document.querySelector('.mobile-frame');
  if (frame) {
    frame.classList.remove('nav-hidden');
  }

  // Screen-specific init
  if (screenId === 'screen-moments') renderMoments();
  if (screenId === 'screen-shop') renderShop();
  if (screenId === 'screen-map') renderMap();
};

/* ── WELCOME SCREEN ── */
function initWelcome() {
  const enterBtn = document.getElementById('btn-enter-space');
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      const welcome = document.getElementById('welcome-screen');
      if (welcome) {
        welcome.style.opacity = '0';
        welcome.style.transition = 'opacity 0.6s ease';
        setTimeout(() => {
          welcome.classList.remove('active');
          welcome.style.display = 'none';
        }, 600);
      }
      // Show main app
      const frame = document.querySelector('.mobile-frame');
      if (frame) frame.classList.remove('nav-hidden');
      navigateTo('screen-home');
    });
  }
}

/* ── STARS CANVAS ── */
function initStars() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height * 0.6,
    r: Math.random() * 1.2 + 0.3,
    alpha: Math.random() * 0.6 + 0.3,
    speed: Math.random() * 0.008 + 0.003,
    phase: Math.random() * Math.PI * 2
  }));

  let frame = 0;
  function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;
    stars.forEach(s => {
      const a = s.alpha * (0.7 + 0.3 * Math.sin(s.phase + frame * s.speed));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  drawStars();
}

/* ── VISUALIZER ── */
function initVisualizer() {
  const svg = document.getElementById('svgVisualizer');
  if (!svg) return;

  const bars = 28;
  const svgNS = "http://www.w3.org/2000/svg";
  const barW = 8;
  const gap = 6;
  const totalW = bars * (barW + gap) - gap;
  const startX = (400 - totalW) / 2;

  const barEls = [];
  for (let i = 0; i < bars; i++) {
    const rect = document.createElementNS(svgNS, 'rect');
    const x = startX + i * (barW + gap);
    const h = 10 + Math.random() * 40;
    rect.setAttribute('x', x);
    rect.setAttribute('y', (120 - h) / 2);
    rect.setAttribute('width', barW);
    rect.setAttribute('height', h);
    rect.setAttribute('rx', '4');
    rect.setAttribute('fill', i % 3 === 0 ? 'rgba(212,165,116,0.7)' : 'rgba(10,92,110,0.6)');
    svg.appendChild(rect);
    barEls.push(rect);
  }

  function animate() {
    barEls.forEach((rect, i) => {
      const h = state.isPlaying
        ? 15 + Math.abs(Math.sin(Date.now() * 0.003 + i * 0.5)) * 60
        : 8 + Math.abs(Math.sin(Date.now() * 0.001 + i * 0.8)) * 18;
      rect.setAttribute('y', (120 - h) / 2);
      rect.setAttribute('height', h);
    });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ── STATUS BAR TIME ── */
function updateStatusTime() {
  const el = document.querySelector('.status-time');
  if (!el) return;
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  el.textContent = `${h}:${m}`;
}

/* ── MOMENTS SCREEN ── */
function renderMoments() {
  const container = document.getElementById('screen-moments');
  if (!container) return;

  // Mood selection
  container.querySelectorAll('.mood-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.mood-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.selectedMood = card.dataset.mood;
      loadMomentByMood(state.selectedMood);
    });
  });

  // Load first moment
  loadMoment(MOMENTS_DATA[0]);
}

function loadMomentByMood(mood) {
  const found = MOMENTS_DATA.find(m => m.mood.includes(mood));
  if (found) loadMoment(found);
}

function loadMoment(moment) {
  state.currentMoment = moment;
  state.playProgress = 0;
  state.isPlaying = false;
  stopPlayer();

  // Update player UI elements if they exist
  const titleEl = document.querySelector('.player-title');
  const subEl = document.querySelector('.player-subtitle');
  const lyricsAmis = document.querySelector('.lyrics-amis');
  const lyricsZh = document.querySelector('.lyrics-zh');

  if (titleEl) titleEl.textContent = moment.amis;
  if (subEl) subEl.textContent = moment.zh;
  if (lyricsAmis) lyricsAmis.textContent = moment.amis;
  if (lyricsZh) lyricsZh.textContent = moment.story;

  updatePlayerUI();
}

/* ── PLAYER ── */
function initPlayer() {
  document.querySelectorAll('.ctrl-btn-play').forEach(btn => {
    btn.addEventListener('click', togglePlay);
  });

  document.querySelectorAll('.progress-bar-track').forEach(track => {
    track.addEventListener('click', (e) => {
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      state.playProgress = pct * state.currentMoment.duration;
      updatePlayerUI();
    });
  });
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (state.isPlaying) {
    startPlayer();
  } else {
    stopPlayer();
  }
  updatePlayerUI();
}

function startPlayer() {
  if (state.playProgress >= state.currentMoment.duration) {
    state.playProgress = 0;
  }
  state.playTimer = setInterval(() => {
    state.playProgress += 0.1;
    if (state.playProgress >= state.currentMoment.duration) {
      state.playProgress = state.currentMoment.duration;
      state.isPlaying = false;
      stopPlayer();
    }
    updatePlayerUI();
  }, 100);
}

function stopPlayer() {
  if (state.playTimer) {
    clearInterval(state.playTimer);
    state.playTimer = null;
  }
}

function updatePlayerUI() {
  const pct = (state.playProgress / (state.currentMoment?.duration || 30)) * 100;
  const remaining = Math.max(0, (state.currentMoment?.duration || 30) - state.playProgress);
  const secs = Math.floor(remaining);
  const timeStr = `0:${secs.toString().padStart(2, '0')}`;

  document.querySelectorAll('.progress-bar-fill').forEach(el => {
    el.style.width = pct + '%';
  });

  document.querySelectorAll('.time-remaining').forEach(el => {
    el.textContent = timeStr;
  });

  document.querySelectorAll('.ctrl-btn-play').forEach(btn => {
    btn.classList.toggle('playing', state.isPlaying);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.setAttribute('data-lucide', state.isPlaying ? 'pause' : 'play');
    }
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ── SHOP ── */
function renderShop() {
  const grid = document.querySelector('.shop-grid');
  if (!grid || grid.children.length > 0) return;

  SHOP_DATA.forEach(item => {
    const card = document.createElement('div');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="shop-card-img">${item.emoji}</div>
      <div class="shop-card-info">
        <div class="shop-card-name">${item.name}</div>
        <div class="shop-card-brand">${item.brand}</div>
        <div class="shop-card-price">NT$ ${item.price}</div>
      </div>
    `;
    card.addEventListener('click', () => openShopItem(item));
    grid.appendChild(card);
  });
}

function openShopItem(item) {
  alert(`即將前往 ${item.brand} 購買 ${item.name}\n\n（正式上線後將連結至品牌購買頁）`);
}

/* ── MAP ── */
function renderMap() {
  const cards = document.querySelector('.map-location-cards');
  if (!cards || cards.children.length > 0) return;

  MAP_DATA.forEach(loc => {
    const card = document.createElement('div');
    card.className = 'map-loc-card glass-panel';
    card.innerHTML = `
      <div class="map-loc-name">${loc.name}</div>
      <div class="map-loc-type">${loc.type}</div>
      <div class="map-loc-desc">${loc.desc}</div>
    `;
    card.addEventListener('click', () => openMapDrawer(loc));
    cards.appendChild(card);
  });
}

function openMapDrawer(loc) {
  const drawer = document.getElementById('map-detail-drawer');
  if (!drawer) {
    // Fallback: simple info
    showDrawer('about-loma-drawer');
    return;
  }
  document.getElementById('drawer-map-name') && (document.getElementById('drawer-map-name').textContent = loc.name);
  document.getElementById('drawer-map-type') && (document.getElementById('drawer-map-type').textContent = loc.type);
  document.getElementById('drawer-map-hours') && (document.getElementById('drawer-map-hours').textContent = loc.hours);
  document.getElementById('drawer-map-find') && (document.getElementById('drawer-map-find').textContent = loc.find);
  document.getElementById('drawer-map-best-time') && (document.getElementById('drawer-map-best-time').textContent = loc.bestTime);
  document.getElementById('drawer-map-story') && (document.getElementById('drawer-map-story').textContent = loc.story);
  document.getElementById('drawer-map-who') && (document.getElementById('drawer-map-who').textContent = loc.who);
  if (document.getElementById('drawer-map-founder-box')) {
    document.getElementById('drawer-map-founder-box').style.display = loc.founder ? 'block' : 'none';
    document.getElementById('drawer-map-founder') && (document.getElementById('drawer-map-founder').textContent = loc.founder);
  }
  showDrawer('map-detail-drawer');
}

/* ── DRAWERS ── */
function showDrawer(id) {
  const drawer = document.getElementById(id);
  if (!drawer) return;
  drawer.classList.add('open');
  showOverlay();
}

function closeDrawer(id) {
  const drawer = document.getElementById(id);
  if (!drawer) return;
  drawer.classList.remove('open');
  hideOverlay();
}

function showOverlay() {
  let overlay = document.getElementById('drawer-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'drawer-overlay';
    overlay.className = 'drawer-overlay';
    document.querySelector('.mobile-frame')?.appendChild(overlay);
    overlay.addEventListener('click', closeAllDrawers);
  }
  overlay.classList.add('visible');
}

function hideOverlay() {
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) overlay.classList.remove('visible');
}

function closeAllDrawers() {
  document.querySelectorAll('.action-drawer.open').forEach(d => d.classList.remove('open'));
  hideOverlay();
}

/* ── BOOKMARKS ── */
function toggleBookmark(momentId) {
  const idx = state.bookmarks.indexOf(momentId);
  if (idx > -1) {
    state.bookmarks.splice(idx, 1);
  } else {
    state.bookmarks.push(momentId);
  }
  renderBookmarks();
}

function renderBookmarks() {
  const grid = document.getElementById('bookmarks-grid');
  const empty = document.getElementById('empty-bookmarks');
  if (!grid || !empty) return;

  if (state.bookmarks.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  grid.style.display = 'grid';
  empty.style.display = 'none';
  grid.innerHTML = '';

  state.bookmarks.forEach(id => {
    const moment = MOMENTS_DATA.find(m => m.id === id);
    if (!moment) return;
    const card = document.createElement('div');
    card.className = 'mood-card glass-panel';
    card.innerHTML = `
      <div class="mood-name" style="font-family:var(--font-family-serif);font-style:italic;color:var(--color-amber)">${moment.amis}</div>
      <div class="mood-desc">${moment.zh}</div>
    `;
    grid.appendChild(card);
  });
}

/* ── AMBIENT SOUNDS (placeholder — wire up Howler when audio files ready) ── */
function initAmbient() {
  document.querySelectorAll('.ambient-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('on');
      const isOn = btn.classList.contains('on');
      btn.textContent = isOn ? 'ON' : 'OFF';
    });
  });
}

/* ── BOTTOM NAV ── */
function initBottomNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) navigateTo(tab);
    });
  });
}

/* ── NOTIFICATION ── */
function initNotifications() {
  const btn = document.getElementById('btn-home-notification');
  if (btn) {
    btn.addEventListener('click', () => showDrawer('notification-drawer'));
  }

  const closeBtn = document.getElementById('btn-close-notification-drawer');
  if (closeBtn) closeBtn.addEventListener('click', () => closeDrawer('notification-drawer'));

  const readAll = document.getElementById('btn-read-all-notifications');
  if (readAll) {
    readAll.addEventListener('click', () => {
      document.querySelectorAll('.notification-item.unread').forEach(el => el.classList.remove('unread'));
      const badge = document.getElementById('home-notification-badge');
      if (badge) badge.style.display = 'none';
    });
  }
}

/* ── MENU ── */
function initMenu() {
  const menuBtn = document.getElementById('btn-home-menu');
  if (menuBtn) menuBtn.addEventListener('click', () => showDrawer('about-loma-drawer'));

  const closeAbout = document.getElementById('btn-close-about-drawer');
  if (closeAbout) closeAbout.addEventListener('click', () => closeDrawer('about-loma-drawer'));
}

/* ── CLOSE BUTTONS ── */
function initCloseButtons() {
  document.querySelectorAll('.btn-close-drawer').forEach(btn => {
    btn.addEventListener('click', closeAllDrawers);
  });
}

/* ── PROFILE ── */
function initProfile() {
  const nameInput = document.getElementById('profile-name');
  const tribeInput = document.getElementById('profile-tribe');

  if (nameInput) {
    nameInput.value = state.profileName;
    nameInput.addEventListener('input', () => { state.profileName = nameInput.value; });
  }
  if (tribeInput) {
    tribeInput.addEventListener('input', () => { state.profileTribe = tribeInput.value; });
  }
}

/* ── LUCIDE ICONS ── */
function initIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

/* ── MAIN INIT ── */
document.addEventListener('DOMContentLoaded', async () => {
  initIcons();
  initStars();
  initVisualizer();
  initWelcome();
  initBottomNav();
  initPlayer();
  initAmbient();
  initNotifications();
  initMenu();
  initCloseButtons();
  initProfile();
  updateStatusTime();
  setInterval(updateStatusTime, 30000);
  setInterval(initIcons, 500); // re-render icons after dynamic content

  await initLiff();

  // Welcome screen text (fill in Chinese text that was lost due to encoding)
  const welcomeTitle = document.querySelector('.welcome-title');
  const welcomeSubtitle = document.querySelector('.welcome-subtitle');
  const welcomeTagline = document.querySelector('.welcome-tagline');
  const enterBtn = document.querySelector('.btn-enter-space span');
  const welcomeFooterP = document.querySelector('.welcome-footer p');

  if (welcomeSubtitle) welcomeSubtitle.textContent = '海洋喝吧';
  if (welcomeTagline) welcomeTagline.textContent = '每天 30 秒・讓族人感覺被看見';
  if (enterBtn) enterBtn.textContent = '進入海洋空間';
  if (welcomeFooterP) welcomeFooterP.textContent = '阿美族海洋文化微服務 × 臺北市原住民族事業體扶植計畫';

  // Home screen text
  const brandSubtitles = document.querySelectorAll('.brand-subtitle-serif');
  brandSubtitles.forEach(el => { if (!el.textContent.trim()) el.textContent = '海洋喝吧'; });
  const brandSlogans = document.querySelectorAll('.brand-slogan');
  brandSlogans.forEach(el => { if (!el.textContent.trim()) el.textContent = '每天一口・海洋的味道'; });

  // Header titles
  const headerTitles = document.querySelectorAll('.header-title');
  const screens = ['screen-moments', 'screen-shop', 'screen-map', 'screen-profile'];
  const titles = ['今日片刻', "Loma' 好物市集", '族人地圖', '我的 Loma\''];
  screens.forEach((id, i) => {
    const screen = document.getElementById(id);
    if (screen) {
      const h = screen.querySelector('.header-title');
      if (h && !h.textContent.trim()) h.textContent = titles[i];
    }
  });

  // Mood cards text
  const moodNames = document.querySelectorAll('.mood-name');
  const moodDescs = document.querySelectorAll('.mood-desc');
  const moodData = [
    { name: '好累好累', desc: '需要被聽見' },
    { name: '想家了', desc: '思念部落的味道' },
    { name: '有點懷念', desc: '回憶飄過來了' },
    { name: '還好啦', desc: '平靜的夜晚' }
  ];
  moodNames.forEach((el, i) => { if (moodData[i] && !el.textContent.trim()) el.textContent = moodData[i].name; });
  moodDescs.forEach((el, i) => { if (moodData[i] && !el.textContent.trim()) el.textContent = moodData[i].desc; });

  // Nav items text
  const navLabels = ['首頁', '片刻', '好物', '地圖', '我的'];
  document.querySelectorAll('.nav-item span').forEach((el, i) => {
    if (navLabels[i] && !el.textContent.trim()) el.textContent = navLabels[i];
  });

  // Section titles
  const sectionTitle = document.querySelector('.mood-title');
  if (sectionTitle && !sectionTitle.textContent.trim()) sectionTitle.textContent = '今天的心情是？';

  // Lobby card texts
  const lobbyTitle = document.querySelector('.home-lobby-card h4');
  const lobbySpan = document.querySelector('.home-lobby-card span');
  const lobbyP = document.querySelector('.home-lobby-card p');
  const lobbyBtn = document.querySelector('.home-lobby-card button span');
  if (lobbyTitle && !lobbyTitle.textContent.trim()) lobbyTitle.textContent = 'Sra 海洋長老說…';
  if (lobbySpan && !lobbySpan.textContent.trim()) lobbySpan.textContent = "Nga'ayho，今天的海很平靜";
  if (lobbyP && !lobbyP.textContent.trim()) lobbyP.textContent = '今天的海浪很輕柔，就像長輩說的，平靜的海最深。點進來，讓族語陪你走過今晚。';
  if (lobbyBtn && !lobbyBtn.textContent.trim()) lobbyBtn.textContent = '進入今日片刻';

  // Re-render icons after all dynamic content
  setTimeout(() => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 200);

  console.log("🌊 Loma' 海洋喝吧 — 啟動完成");
});
