import './styles.css';
import { icon, avatar, cat, cake, room, decoration, escapeText } from './art.js';
import { RoomScene } from './scene.js';

const STORAGE_KEY = 'kitty-birthday-v1';
const freshState = () => ({
  name: '苏苏', entered: false,
  tasks: { wake: false, cake: false, stage: false },
  decorations: [], stolen: false,
  settings: { light: 'warm', banner: '今天你最大', confetti: 'paper' },
  stage: { straight: false, tested: false, lightsOn: false },
  celebrating: false, wished: false, bow: false,
});
const lightOptions = [['warm', '暖暖的', 'spark'], ['starry', '梦幻星空', 'moon'], ['disco', '猫猫蹦迪', 'music']];
const bannerOptions = ['生日快乐', '今天你最大', '寿星请上座'];
const confettiOptions = [['paper', '彩纸雨', 'party'], ['fish', '小鱼干雨', 'fish'], ['paw', '满天猫爪', 'paw']];
const decorationNames = { strawberry: '草莓', star: '星星糖', paw: '猫爪饼干', sprinkle: '彩色糖针' };
const cats = [
  { id: 'black', name: '芝麻', role: '努力镇定的委员长', quote: '“一切都在计划之内。计划正在修改。”', color: 'sage' },
  { id: 'orange', name: '橘总', role: '经常嘴馋的财务', quote: '“吃的是损耗，财务上可以解释。”', color: 'peach' },
  { id: 'white', name: '奶盖', role: '正在梦里彩排的主持', quote: '“我没睡，我在闭目排练。”', color: 'cream' },
  { id: 'calico', name: '花卷', role: '干劲过剩的实习生', quote: '“大的！我准备了一个超级大的！”', color: 'rose' },
];

function loadState() {
  const fallback = freshState();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return fallback;
    const valid = freshState();
    const savedName = typeof saved.name === 'string' ? saved.name.trim().slice(0, 12) : '';
    valid.name = savedName && savedName !== '小寿星' ? savedName : fallback.name;
    valid.entered = saved.entered === true;
    valid.decorations = Array.isArray(saved.decorations) ? saved.decorations.filter((item) => {
      if (typeof item === 'string') return Object.hasOwn(decorationNames, item);
      return item && Object.hasOwn(decorationNames, item.kind) && Number.isFinite(item.x) && Number.isFinite(item.y) && (item.x / 97) ** 2 + ((item.y + 39) / 35) ** 2 <= 1.14;
    }).slice(0, 12) : [];
    valid.stolen = saved.stolen === true;
    valid.bow = saved.bow === true;
    valid.settings.light = lightOptions.some(([key]) => key === saved.settings?.light) ? saved.settings.light : fallback.settings.light;
    valid.settings.banner = bannerOptions.includes(saved.settings?.banner) ? saved.settings.banner : fallback.settings.banner;
    valid.settings.confetti = confettiOptions.some(([key]) => key === saved.settings?.confetti) ? saved.settings.confetti : fallback.settings.confetti;
    for (const key of Object.keys(valid.tasks)) valid.tasks[key] = valid.entered && saved.tasks?.[key] === true;
    valid.stage = { straight: saved.stage?.straight === true || valid.tasks.stage, tested: saved.stage?.tested === true || valid.tasks.stage, lightsOn: saved.stage?.lightsOn === true || valid.tasks.stage };
    if (valid.decorations.length < 3) valid.tasks.cake = false;
    valid.celebrating = Object.values(valid.tasks).every(Boolean) && saved.celebrating === true;
    valid.wished = valid.celebrating && saved.wished === true;
    return valid;
  } catch { return fallback; }
}

let state = loadState();
let activeDialog = null;
let toastTimer;
let orangeClicks = 0;
let boxClicks = 0;
let cardUrl = null;
let cardBlob = null;
let cardBusy = false;
let musicEnabled = false;
let audioContext;
let musicTimer;
let confettiFrame;
let previousFocus;

const app = document.querySelector('#app');
const dialogRoot = document.querySelector('#dialog-root');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const completedCount = () => Object.values(state.tasks).filter(Boolean).length;
const saveState = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Game also works without browser storage. */ } };
const scene = new RoomScene({ state: () => state, save: saveState, sound: soundEffect, confetti: showConfetti, birthdaySong, close: render, card: () => openDialog('card') });

function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 3600);
}

function render() {
  const count = completedCount();
  const allDone = count === 3;
  const name = escapeText(state.name);
  const phase = state.wished ? '生日快乐，今天你最大。' : state.celebrating ? '嘘，到了许愿时间。' : state.entered ? '现场有点忙，快乐不打烊。' : '嘘，猫猫正在偷偷开会。';
  app.innerHTML = `
    <div class="site-shell">
      <header class="site-header">
        <a class="brand" href="./" aria-label="猫猫生日筹备委员会首页"><span class="brand-mark">${icon('paw', 29)}</span><span><strong>猫猫生日筹备委员会</strong><small>THE KITTY PARTY COMMITTEE</small></span></a>
        <div class="header-tools"><span class="office-status"><i></i> ${state.celebrating ? '庆典营业中' : '今日特别营业'}</span><button class="icon-button sound-button ${musicEnabled ? 'is-on' : ''}" data-action="sound" aria-label="${musicEnabled ? '关闭' : '开启'}背景音乐" aria-pressed="${musicEnabled}" title="${musicEnabled ? '关闭' : '开启'}声音">${icon(musicEnabled ? 'sound' : 'muted', 20)}<span>${musicEnabled ? '声音开' : '声音关'}</span></button></div>
      </header>

      <main>
        <section class="hero" aria-labelledby="page-title">
          <div class="hero-copy"><div class="eyebrow"><span></span> 一份毛茸茸的生日特别企划</div>
            <h1 id="page-title">${state.celebrating ? `今天你最大，<br><span class="hero-accent">全体猫猫同意！<svg viewBox="0 0 310 14" aria-hidden="true"><path d="M4 10q146-13 302-4"/></svg></span>` : `寿星怎么<span class="title-break"><br></span><span class="hero-accent">提前来了！<svg viewBox="0 0 260 14" aria-hidden="true"><path d="M4 10q120-13 252-4"/></svg></span>`}</h1>
            <p>${state.celebrating ? '蛋糕、灯光、还有一屋子猫猫，都在等你许一个愿。' : '走近一点，亲手帮这群猫把生日会办起来。'}</p>
          </div>
          <button class="birthday-stamp" data-action="nickname" aria-label="修改寿星昵称，当前${name}"><span class="stamp-spark">✧</span><span class="stamp-label">BIRTHDAY VIP</span><span class="stamp-name">${name}</span><span class="stamp-bottom">今日专属 · 点此署名 ${icon('edit', 12)}</span><span class="stamp-paw">${icon('paw', 24)}</span></button>
        </section>

        <section class="party-board" aria-label="猫猫筹备现场">
          <div class="room-card">
            <div class="room-toolbar"><span><i class="live-dot"></i> ${state.celebrating ? '生日会现场' : '筹备室实况'} <small>ROOM 01</small></span><span class="room-count">${icon('paw', 13)} 4 位成员已就位</span></div>
            <div class="room-canvas">${room(state)}
              ${state.entered && !state.celebrating ? `<button class="room-hotspot hotspot-wake ${state.tasks.wake ? 'is-complete' : ''}" data-action="task" data-task="wake" aria-label="${state.tasks.wake ? '查看' : '开始'}叫醒奶盖任务">${icon(state.tasks.wake ? 'check' : 'clock', 17)}<span>${state.tasks.wake ? '已开机' : '叫醒奶盖'}</span></button><button class="room-hotspot hotspot-cake ${state.tasks.cake ? 'is-complete' : ''}" data-action="task" data-task="cake" aria-label="${state.tasks.cake ? '查看' : '开始'}装饰蛋糕任务">${icon(state.tasks.cake ? 'check' : 'cake', 17)}<span>${state.tasks.cake ? '蛋糕就位' : '抢救蛋糕'}</span></button><button class="room-hotspot hotspot-stage ${state.tasks.stage ? 'is-complete' : ''}" data-action="task" data-task="stage" aria-label="${state.tasks.stage ? '查看' : '开始'}布置舞台任务">${icon(state.tasks.stage ? 'check' : 'party', 17)}<span>${state.tasks.stage ? '舞台就绪' : '布置舞台'}</span></button>` : ''}
              <button class="scene-easter clock-easter" data-action="clock" aria-label="查看墙上的钟" title="寿星标准时间"></button>
              <button class="scene-easter bow-easter" data-action="bow" aria-label="摸摸芝麻的领结" title="委员长的领结"></button>
              <button class="scene-easter box-easter" data-action="box" aria-label="敲敲纸箱" title="纸箱里还有谁？"></button>
              ${state.celebrating ? '<span class="room-celebration-badge">HAPPY BIRTHDAY TO YOU</span>' : ''}
            </div>
            <div class="room-caption"><span class="handwritten-mark">${icon('heart', 16)}</span><p>${phase}</p><span class="caption-dots"><i></i><i></i><i></i></span></div>
          </div>

          <aside class="brief-card ${state.entered ? 'in-progress' : ''}">
            <span class="paper-tape"></span>
            <div class="brief-kicker"><span>${state.celebrating ? '猫猫委员会 · 正式决议' : state.entered ? '荣誉监督 · 工作手册' : '绝密文件 · 寿星亲启'}</span>${icon(state.celebrating ? 'heart' : 'paw', 19)}</div>
            ${state.celebrating ? celebrationBrief(name) : state.entered ? `
              <div class="progress-heading"><h2>${allDone ? '一切就绪，\n只差你点头。' : '欢迎，\n荣誉监督。'}</h2><div class="progress-ring" style="--progress:${count * 120}deg"><span>${count}<small>/ 3</small></span></div></div>
              <p class="brief-description">${allDone ? '猫猫们已经站好。虽然队伍有点歪，但心意非常端正。' : '您负责指一下，我们负责干活。<br>点点房间，或从下方认领任务。'}</p>
              <div class="checklist">${[['wake', 'clock', '叫醒主持人'], ['cake', 'cake', '抢救生日蛋糕'], ['stage', 'party', '批准舞台方案']].map(([key, symbol, label]) => `<button class="checklist-item ${state.tasks[key] ? 'done' : ''}" data-action="task" data-task="${key}"><span class="check-square">${state.tasks[key] ? icon('check', 13) : ''}</span><span>${label}</span><small>${state.tasks[key] ? '完成' : '去看看'} ${icon('arrow', 13)}</small></button>`).join('')}</div>
              <button class="button button-primary brief-main" data-action="${allDone ? 'celebrate' : 'next-task'}">${allDone ? '允许猫猫开场' : count === 0 ? '先去叫醒奶盖' : '继续筹备'} ${icon(allDone ? 'party' : 'arrow', 19)}</button>
              <p class="brief-footnote">${allDone ? '请准备好接受一屋子猫猫的祝福' : '没有倒计时，寿星可以慢慢来'}</p>
            ` : `
              <h2>这场生日会，<br>就差你啦。</h2>
              <p class="brief-description">我们本来都准备好了。<br>本来。</p>
              <div class="meeting-note"><span class="note-quote">“</span><p>主持人还在睡，<br>蛋糕被财务盯上了，<br>实习生买了一个巨型礼炮。</p><span class="note-signature">—— 努力镇定的委员长 · 芝麻</span></div>
              <button class="button button-primary brief-main" data-action="enter">推门，抓个现行 ${icon('arrow', 19)}</button>
              <p class="brief-footnote">${icon('clock', 12)} 约 3–5 分钟 · 点点就能玩</p>
            `}
          </aside>
        </section>

        <section class="tasks-section" aria-labelledby="tasks-heading">
          <div class="section-heading"><div><span class="section-label">TODAY'S LITTLE MISSIONS</span><h2 id="tasks-heading">${state.wished ? '快乐筹备记录' : '一份不太靠谱的筹备清单'}<span class="tiny-star">✳</span></h2></div><span class="section-meta">${state.entered ? `${count} / 3 项已就绪` : '寿星只需要负责开心'}</span></div>
          <div class="task-grid">${taskCard('wake', '01', '主持人开机计划', '奶盖还在梦里主持，谁来叫醒它？', 'white', 'sage')}${taskCard('cake', '02', '蛋糕保卫大作战', '装饰蛋糕，顺便盯一下财务。', 'orange', 'peach')}${taskCard('stage', '03', '隆重得刚刚好', '灯光、横幅、礼炮，全听你的。', 'calico', 'rose')}</div>
        </section>

        <section class="crew-section" aria-label="本届筹备组成员"><div class="crew-heading"><span class="section-label">MEET THE COMMITTEE</span><h2>本届筹备组<span>（靠谱程度随机）</span></h2></div><div class="crew-list">${cats.map((member) => `<button class="crew-member" data-action="cat" data-cat="${member.id}" aria-label="和${member.name}聊天"><span class="crew-avatar ${member.color}">${avatar(member.id, member.id === 'white' && !state.tasks.wake)}</span><span class="crew-info"><strong>${member.name}<span>↗</span></strong><small>${member.role}</small></span></button>`).join('')}</div></section>
      </main>
      <footer class="site-footer"><span>${icon('paw', 13)} 猫猫出品，爪印保证。</span><span class="footer-message">愿你今天的快乐，多到装不下。</span><button data-action="restart">${icon('replay', 13)} 重新开会</button></footer>
    </div>`;
}

function taskCard(key, number, title, description, type, color) {
  const done = state.tasks[key];
  return `<button class="task-card ${color} ${done ? 'task-done' : ''}" data-action="task" data-task="${key}" aria-label="${done ? '查看已完成任务：' : ''}${title}"><div class="task-card-top"><span class="task-number">MISSION ${number}</span><span class="task-badge ${done ? 'done' : ''}">${done ? `${icon('check', 11)} 已就绪` : !state.entered ? '待开门' : '待认领'}</span></div><div class="task-card-body"><div><h3>${title}</h3><p>${description}</p></div><span class="task-mini-cat">${avatar(type, key === 'wake' && !done)}</span></div><span class="task-card-arrow">${icon(done ? 'check' : 'arrow', 18)}</span></button>`;
}

function celebrationBrief(name) {
  if (state.wished) return `<h2>${name}，<br>生日快乐！</h2><p class="brief-description">蛋糕最大的一块，归你。<br>最舒服的位置，归你。<br>今天的主角，也是你。</p><div class="approved-stamp"><span>全票通过</span><small>APPROVED BY ALL CATS</small>${icon('paw', 22)}</div><button class="button button-primary brief-main" data-action="card">带走猫猫生日卡 ${icon('download', 18)}</button><button class="text-button replay-party" data-action="replay">${icon('replay', 14)} 再庆祝一次</button>`;
  return `<h2>现在，<br>许一个愿望吧。</h2><p class="brief-description">我们已经安排橘总暂时停止说话。<br>愿望可以只留在你的心里。</p><div class="wish-illustration">${icon('star', 36)}<span>愿你的每一个明天<br>都有值得期待的小事</span>${icon('spark', 23)}</div><button class="button button-primary brief-main" data-action="wish">走近蛋糕，许个愿 ${icon('spark', 19)}</button><p class="brief-footnote">不用真的吹，轻轻点一下就好</p>`;
}

function enter() {
  if (state.entered) return;
  state.entered = true;
  saveState(); render();
  soundEffect('enter');
  openDialog('welcome');
}

function openDialog(kind) {
  if (['wake', 'cake', 'stage'].includes(kind)) { closeDialog(false); scene.open(kind); return; }
  if (cardBusy && kind === 'card') return;
  closeDialog(false);
  activeDialog = kind;
  previousFocus = document.activeElement;
  dialogRoot.innerHTML = `<dialog id="game-dialog" class="game-dialog" aria-labelledby="dialog-title"><button class="dialog-close icon-button" data-action="close-dialog" aria-label="关闭弹窗">${icon('close', 21)}</button><div class="dialog-content"></div></dialog>`;
  const dialog = document.querySelector('#game-dialog');
  renderDialog();
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(); });
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeDialog();
  });
  dialog.showModal();
  document.body.classList.add('dialog-open');
  if (kind === 'nickname') requestAnimationFrame(() => { const input = document.querySelector('#nickname'); input?.focus(); input?.select(); });
  if (kind === 'card') generateCard();
}

function closeDialog(restoreFocus = true) {
  const dialog = document.querySelector('#game-dialog');
  if (dialog) { dialog.close(); dialogRoot.innerHTML = ''; }
  document.body.classList.remove('dialog-open');
  activeDialog = null;
  if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  else if (restoreFocus && dialog) document.querySelector('.brief-main')?.focus({ preventScroll: true });
}

function renderDialog() {
  const container = document.querySelector('.dialog-content');
  if (!container) return;
  const oldFocus = document.activeElement;
  const hadDialogFocus = Boolean(oldFocus?.closest('dialog'));
  const focusedAction = oldFocus?.dataset.action;
  const focusedValue = oldFocus?.dataset.value;
  if (activeDialog === 'welcome') {
    container.innerHTML = `<div class="welcome-dialog"><span class="dialog-eyebrow">紧 急 状 况</span><div class="welcome-cats">${avatar('black')}${avatar('calico')}</div><h2 id="dialog-title">“寿星怎么提前来了！”</h2><p>花卷：“启动紧急预案吗？”<br>芝麻：“启动。让寿星亲自监督。”</p><div class="supervisor-pass"><span>荣誉监督通行证</span><strong>${escapeText(state.name)}</strong><small>权限：指挥猫猫 / 享受快乐 / 今天最大</small>${icon('paw', 29)}</div><button class="button button-primary" data-action="close-dialog">好，带我看看 ${icon('arrow', 18)}</button></div>`;
  } else if (activeDialog === 'nickname') {
    container.innerHTML = `<div class="nickname-dialog"><span class="dialog-emblem">${icon('paw', 32)}</span><span class="dialog-eyebrow">登记一位特别来宾</span><h2 id="dialog-title">今天，怎么称呼你？</h2><p>猫猫会把这个名字写进生日祝福里。</p><form id="nickname-form"><label for="nickname">寿星昵称</label><input id="nickname" name="nickname" type="text" value="${escapeText(state.name)}" maxlength="12" placeholder="例如：小桃" autocomplete="off" required><small>最多 12 个字，叫得亲切就好。</small><button class="button button-primary" type="submit">请猫猫记住 ${icon('check', 18)}</button></form></div>`;
  } else if (activeDialog === 'restart') {
    container.innerHTML = `<div class="simple-dialog"><span class="dialog-emblem">${icon('replay', 32)}</span><h2 id="dialog-title">再开一场筹备会？</h2><p>猫猫会把道具放回原位，蛋糕也重新准备。<br>寿星的昵称会留在座位上。</p><button class="button button-primary" data-action="confirm-restart">好，从推门开始 ${icon('arrow', 18)}</button><button class="text-button" data-action="close-dialog">让猫猫再歇一会儿</button></div>`;
  } else if (activeDialog === 'card') {
    container.innerHTML = `<div class="card-dialog"><span class="dialog-eyebrow">一份可以带走的小快乐</span><h2 id="dialog-title">猫猫已联合按爪。</h2><p>${cardUrl ? '手机上可以长按图片保存，也可以用下面的按钮。' : '正在给生日卡盖上最后一个爪印……'}</p><div class="card-preview">${cardUrl ? `<img src="${cardUrl}" alt="${escapeText(state.name)}的专属猫猫生日卡，包含亲手装饰的蛋糕和四只猫猫">` : '<div class="card-loading">' + icon('paw', 40) + '<span>猫猫正在认真排版</span></div>'}</div><div class="card-button-row">${cardUrl ? `<a class="button button-primary" href="${cardUrl}" download="猫猫祝你生日快乐.png">${icon('download', 17)} 保存生日卡</a>${canShareCard() ? `<button class="button button-secondary" data-action="share-card">分享生日卡 ${icon('arrow', 17)}</button>` : ''}` : ''}</div><p class="card-tip">${cardUrl ? '愿这份毛茸茸的快乐，陪你久一点。' : '生日卡会在当前设备生成'}</p></div>`;
  }
  if (focusedAction && hadDialogFocus && !oldFocus.isConnected) {
    const replacement = [...container.querySelectorAll('[data-action]')].find((element) => element.dataset.action === focusedAction && element.dataset.value === focusedValue);
    replacement?.focus({ preventScroll: true });
  }
}

function startCelebration() {
  if (completedCount() !== 3) return;
  closeDialog();
  state.celebrating = true; state.wished = false;
  saveState(); render();
  scene.open('ceremony');
}

function wish() {
  if (!state.celebrating || state.wished) return;
  scene.open('wish');
}

function talkToCat(id) {
  const member = cats.find((entry) => entry.id === id);
  if (!member) return;
  let text = member.quote;
  if (id === 'orange') {
    orangeClicks++;
    const lines = ['“我没偷吃。我只是离蛋糕比较近。”', '“今日账单：奶油，必要支出。草莓，必要支出。小鱼干，特别必要支出。”', '“采购部有两票，因为我有两只前爪。”'];
    text = lines[(orangeClicks - 1) % lines.length];
  }
  if (id === 'white') text = state.tasks.wake ? state.wished ? '“生日会很成功。现在请允许主持人下班……呼……”' : '“请放心。我已经把罐头改成来宾了。”' : '“呼……下一位发言的罐头……呼……”';
  if (id === 'calico' && state.tasks.stage) text = '“方案已批准！礼炮保证大，方向我再研究一下。”';
  toast(`${member.name}：${text}`); soundEffect('meow');
}

// Short synthesized tones keep the game self-contained and play only after sound is enabled.
function ensureAudio() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return true;
}

function tone(frequency, duration = .18, delay = 0, volume = .035, type = 'sine') {
  if (!musicEnabled || !ensureAudio()) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const time = audioContext.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(volume, time + .015);
  gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
  oscillator.connect(gain); gain.connect(audioContext.destination);
  oscillator.start(time); oscillator.stop(time + duration + .02);
}

function soundEffect(kind) {
  if (!musicEnabled) return;
  if (kind === 'success' || kind === 'enter') [523.25, 659.25, 783.99].forEach((note, i) => tone(note, .38, i * .1));
  else if (kind === 'alarm') [880, 660, 880, 660].forEach((note, i) => tone(note, .1, i * .13));
  else if (kind === 'meow') { tone(680, .18); tone(490, .26, .12); }
  else tone(650, .09, 0, .025);
}

function birthdaySong() {
  const notes = [[392, .5], [392, .25], [440, .75], [392, .75], [523.25, .75], [493.88, 1.2], [392, .5], [392, .25], [440, .75], [392, .75], [587.33, .75], [523.25, 1.2]];
  let delay = 0;
  for (const [note, length] of notes) { tone(note, length * .48, delay, .05, 'triangle'); delay += length * .48; }
}

function toggleSound() {
  musicEnabled = !musicEnabled;
  clearInterval(musicTimer);
  if (musicEnabled) {
    if (!ensureAudio()) { musicEnabled = false; toast('这个浏览器暂时不支持声音，猫猫会用字幕好好祝福。'); }
    else {
      audioContext.resume().catch(() => {});
      const phrase = () => { if (document.hidden || state.celebrating) return; [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23].forEach((note, i) => tone(note, .7, i * .45, .015)); };
      phrase(); musicTimer = setInterval(phrase, 4200); soundEffect('tap');
    }
  } else audioContext?.suspend().catch(() => {});
  render();
}

function showConfetti(kind = 'paper', duration = 5000) {
  cancelAnimationFrame(confettiFrame);
  const canvas = document.querySelector('#confetti');
  const context = canvas.getContext('2d');
  if (!context) return;
  const width = window.innerWidth, height = window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * ratio; canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = reducedMotion.matches ? 24 : width < 600 ? 65 : 105;
  const palette = ['#e2ad79', '#91ac93', '#e0bd61', '#d9a19b', '#c8c9a5'];
  const particles = Array.from({ length: count }, () => ({ x: Math.random() * width, y: -Math.random() * height, size: 5 + Math.random() * 7, speed: 45 + Math.random() * 90, angle: Math.random() * Math.PI, spin: (Math.random() - .5) * 2, color: palette[Math.floor(Math.random() * palette.length)] }));
  const start = performance.now(); let last = start;
  const draw = (time) => {
    const delta = Math.min((time - last) / 1000, .04); last = time;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.y += particle.speed * delta; particle.x += Math.sin(time / 800 + particle.angle) * 15 * delta; particle.angle += particle.spin * delta;
      context.save(); context.translate(particle.x, particle.y); context.rotate(particle.angle); context.fillStyle = particle.color;
      if (kind === 'fish') { context.beginPath(); context.ellipse(0, 0, particle.size, particle.size * .48, 0, 0, Math.PI * 2); context.fill(); context.beginPath(); context.moveTo(particle.size * .6, 0); context.lineTo(particle.size * 1.5, -particle.size * .65); context.lineTo(particle.size * 1.5, particle.size * .65); context.fill(); }
      else if (kind === 'paw') { context.beginPath(); context.ellipse(0, 2, particle.size * .55, particle.size * .4, 0, 0, Math.PI * 2); context.fill(); for (let j = 0; j < 4; j++) { context.beginPath(); context.arc((j - 1.5) * particle.size * .4, -particle.size * (.4 + (j === 1 || j === 2 ? .2 : 0)), particle.size * .2, 0, Math.PI * 2); context.fill(); } }
      else context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size * .55);
      context.restore();
    }
    if (time - start < (reducedMotion.matches ? 1800 : duration)) confettiFrame = requestAnimationFrame(draw);
    else context.clearRect(0, 0, width, height);
  };
  confettiFrame = requestAnimationFrame(draw);
}

function cardSvg() {
  const dark = state.settings.light !== 'warm';
  const headingSize = Math.min(48, Math.floor(670 / [...`${state.name}，生日快乐！`].length));
  const confetti = Array.from({ length: 30 }, (_, i) => decoration(state.settings.confetti === 'fish' ? 'fish' : state.settings.confetti === 'paw' ? 'paw' : ['star', 'sprinkle'][i % 2], 40 + (i * 151) % 720, 145 + (i * 97) % 570, .3 + i % 3 * .08)).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1080" viewBox="0 0 800 1080"><rect width="800" height="1080" fill="#f7f3e7"/><rect x="25" y="25" width="750" height="1030" rx="24" fill="none" stroke="#a6b59a" stroke-width="2" stroke-dasharray="5 7"/><path d="M80 465q320-130 640 0v300H80Z" fill="${dark ? '#445f60' : '#e5e7d2'}"/>${confetti}<g font-family="'PingFang SC','Microsoft YaHei',sans-serif" fill="#344e46" text-anchor="middle"><text x="400" y="95" font-size="17" letter-spacing="5">猫猫生日筹备委员会</text><text x="400" y="195" font-size="${headingSize}" font-weight="700">${escapeText(state.name)}，生日快乐！</text><text x="400" y="243" font-size="20" letter-spacing="2">${escapeText(state.settings.banner)} · 全体猫猫同意</text><text x="400" y="315" font-size="19" fill="#7b8873">愿你的每一个明天，都有值得期待的小事。</text></g>${cake({ x: 400, y: 515, scale: 1.55, decorations: state.decorations, stolen: state.stolen, candles: true, lit: true })}${cat('black', { x: 150, y: 683, scale: 1.03, happy: true, bow: state.bow })}${cat('orange', { x: 318, y: 703, scale: 1.03, happy: true })}${cat('white', { x: 488, y: 703, scale: 1.03, happy: true })}${cat('calico', { x: 650, y: 683, scale: 1.03, happy: true })}<g font-family="'PingFang SC','Microsoft YaHei',sans-serif" fill="#344e46" text-anchor="middle"><text x="400" y="852" font-size="22">蛋糕最大的一块，归你。</text><text x="400" y="893" font-size="22">今天所有的偏爱，也归你。</text><text x="400" y="971" font-size="16" fill="#7b8873">芝麻 · 橘总 · 奶盖 · 花卷　联合按爪生效</text><text x="400" y="1010" font-size="12" letter-spacing="3" fill="#8b967f">MADE WITH PAWS &amp; A WHOLE LOT OF LOVE</text></g></svg>`;
}

async function generateCard() {
  cardBusy = true;
  try {
    if (cardUrl) URL.revokeObjectURL(cardUrl);
    cardUrl = null; cardBlob = null;
    const source = new Blob([cardSvg()], { type: 'image/svg+xml;charset=utf-8' });
    const sourceUrl = URL.createObjectURL(source);
    try {
      const image = new Image();
      image.src = sourceUrl;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 1200; canvas.height = 1620;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      cardBlob = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image export failed')), 'image/png'));
      cardUrl = URL.createObjectURL(cardBlob);
    } finally { URL.revokeObjectURL(sourceUrl); }
    if (activeDialog === 'card') renderDialog();
  } catch {
    toast('猫猫手滑了，生日卡没印好。请关掉弹窗，再试一次。');
    if (activeDialog === 'card') {
      const preview = document.querySelector('.card-preview');
      if (preview) preview.innerHTML = '<p class="card-error">爪印机暂时卡纸了。<br><button class="button button-secondary" data-action="retry-card">再印一次</button></p>';
    }
  } finally { cardBusy = false; }
}

function canShareCard() {
  if (!cardBlob || !navigator.canShare || !navigator.share) return false;
  try { return navigator.canShare({ files: [new File([cardBlob], '猫猫生日卡.png', { type: 'image/png' })] }); } catch { return false; }
}

async function shareCard() {
  if (!canShareCard()) return;
  try { await navigator.share({ title: '猫猫祝你生日快乐', files: [new File([cardBlob], '猫猫生日卡.png', { type: 'image/png' })] }); }
  catch (error) { if (error.name !== 'AbortError') toast('可以长按生日卡图片，保存后分享给喜欢的人。'); }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'enter') enter();
  else if (action === 'sound') toggleSound();
  else if (action === 'nickname') openDialog('nickname');
  else if (action === 'close-dialog') closeDialog();
  else if (action === 'task') {
    if (!state.entered) { enter(); return; }
    if (state.celebrating) { toast('筹备已经完成啦。可以在「重新开会」中再做一个新方案。'); return; }
    openDialog(button.dataset.task);
  }
  else if (action === 'next-task') openDialog(Object.keys(state.tasks).find((key) => !state.tasks[key]) || 'wake');
  else if (action === 'celebrate' || action === 'replay') startCelebration();
  else if (action === 'wish') wish();
  else if (action === 'cat') talkToCat(button.dataset.cat);
  else if (action === 'clock') { toast('寿星标准时间：现在是快乐点，开心分。今天可以慢慢来。'); soundEffect('tap'); }
  else if (action === 'bow') { state.bow = !state.bow; saveState(); render(); toast('芝麻整理了一下领结：“节日着装，可以理解。”'); }
  else if (action === 'box') { boxClicks++; toast(`纸箱里探出第 ${boxClicks} 只猫：“本委员会编制已满，明天再来应聘。”`); }
  else if (action === 'restart') openDialog('restart');
  else if (action === 'confirm-restart') {
    const name = state.name; state = freshState(); state.name = name;
    cancelAnimationFrame(confettiFrame);
    const canvas = document.querySelector('#confetti'); canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    saveState(); closeDialog(); render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('猫猫各就各位。嘘，寿星还没进门。');
  }
  else if (action === 'card') openDialog('card');
  else if (action === 'share-card') shareCard();
  else if (action === 'retry-card') { if (!cardBusy) generateCard(); }
});

document.addEventListener('submit', (event) => {
  if (event.target.id !== 'nickname-form') return;
  event.preventDefault();
  const name = new FormData(event.target).get('nickname')?.trim().slice(0, 12);
  if (!name) { document.querySelector('#nickname').setCustomValidity('猫猫想知道怎么称呼你，写一个昵称吧。'); document.querySelector('#nickname').reportValidity(); return; }
  state.name = name; saveState(); closeDialog(); render(); toast(`收到！今天的主角是${name}。`);
});

document.addEventListener('input', (event) => { if (event.target.id === 'nickname') event.target.setCustomValidity(''); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audioContext?.suspend().catch(() => {});
  else if (musicEnabled) audioContext?.resume().catch(() => {});
});
window.addEventListener('pagehide', () => { clearInterval(musicTimer); });

render();
