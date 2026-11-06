import { icon, decoration, roomLayers, escapeText } from './art.js';
import './scene.css';

const bounds = {
  overview: [0, 0, 900, 610],
  wake: [24, 287, 270, 267],
  cake: [304, 224, 314, 225],
  stage: [299, 56, 525, 542],
  banner: [294, 62, 468, 207],
  cannon: [563, 342, 221, 251],
  host: [633, 339, 225, 205],
  wish: [319, 187, 272, 232],
};
const titles = { wake: '主持人开机计划', cake: '蛋糕保卫大作战', stage: '舞台最后的彩排', ceremony: '猫猫生日会', wish: '把愿望留在心里', finished: '全体猫猫，联合祝福' };
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const decorationNames = { strawberry: '草莓', star: '星星糖', paw: '猫爪饼干', sprinkle: '彩色糖针' };
const lights = [['warm', '暖暖的', 'spark'], ['starry', '星空', 'moon'], ['disco', '蹦迪', 'music']];
const cannons = [['paper', '彩纸', 'party'], ['fish', '小鱼干', 'fish'], ['paw', '猫爪', 'paw']];

export class RoomScene {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.active = false;
    this.frames = new Set();
    this.delays = new Map();
    this.layerCache = new Map();
    this.sequence = 0;
  }

  get state() { return this.callbacks.state(); }

  open(task) {
    if (this.active) return;
    this.svg = document.querySelector('.room-canvas > .room-art');
    if (!this.svg) return;
    this.active = true;
    this.closing = false;
    this.refitPending = false;
    this.sequence++;
    this.task = task;
    this.cameraName = 'overview';
    this.ui = { task, selected: null, snackOpen: false, pose: '', bannerAngle: this.state.stage.straight ? 0 : 9 };
    this.message = this.initialMessage(task);
    this.previousFocus = document.activeElement;
    this.layerCache.clear();
    const sourceRect = this.svg.getBoundingClientRect();
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'room-placeholder';
    this.svg.before(this.placeholder);
    this.shell = document.createElement('section');
    this.shell.className = 'scene-shell';
    this.shell.setAttribute('role', 'dialog');
    this.shell.setAttribute('aria-modal', 'true');
    this.shell.setAttribute('aria-labelledby', 'scene-title');
    this.shell.innerHTML = `<header class="scene-header"><button class="scene-back" data-scene-action="back">${icon('arrow', 18)}<span>房间全景</span></button><div><span class="scene-eyebrow">THE KITTY PARTY COMMITTEE</span><strong id="scene-title">${titles[task]}</strong></div><span class="scene-counter">${icon('paw', 15)}<span>${Object.values(this.state.tasks).filter(Boolean).length} / 3</span></span></header><div class="scene-workspace"><div class="scene-viewport"><div class="scene-location"><i></i><span></span></div><div class="scene-speech" role="status" aria-live="polite"></div><div class="scene-milestone" aria-live="polite"></div></div><aside class="scene-dock" aria-label="任务道具与操作"></aside></div><div class="scene-drag-ghost" aria-hidden="true"></div>`;
    document.body.append(this.shell);
    this.viewport = this.shell.querySelector('.scene-viewport');
    this.viewport.prepend(this.svg);
    this.svg.setAttribute('role', 'group');
    this.svg.setAttribute('aria-label', '可以直接操作的猫猫生日房间');
    this.svg.classList.add('interactive-room');
    document.querySelector('#app').inert = true;
    document.body.classList.add('scene-open');
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    this.shell.addEventListener('click', (event) => this.onClick(event), options);
    this.shell.addEventListener('keydown', (event) => this.onKey(event), options);
    this.shell.addEventListener('pointerdown', (event) => this.pointerDown(event), options);
    this.shell.addEventListener('pointermove', (event) => this.pointerMove(event), options);
    this.shell.addEventListener('pointerup', (event) => this.pointerUp(event), options);
    this.shell.addEventListener('pointercancel', () => this.cancelGesture(), options);
    window.addEventListener('blur', () => this.cancelGesture(), options);
    this.refresh();
    this.renderControls();
    this.setCamera(this.fit(bounds.overview));
    if (!reduced() && sourceRect.bottom > 0 && sourceRect.top < innerHeight) {
      const destination = this.viewport.getBoundingClientRect();
      this.viewport.animate([
        { transform: `translate(${sourceRect.left - destination.left}px, ${sourceRect.top - destination.top}px) scale(${sourceRect.width / destination.width}, ${sourceRect.height / destination.height})`, opacity: .8 },
        { transform: 'none', opacity: 1 },
      ], { duration: 430, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    this.resizeObserver = new ResizeObserver(() => {
      if (this.cameraAnimating) this.refitPending = true;
      else if (!this.closing && !this.gesture) this.zoom(this.cameraName, 180);
    });
    this.resizeObserver.observe(this.viewport);
    this.shell.querySelector('.scene-back').focus({ preventScroll: true });
    if (task === 'ceremony') this.runCeremony();
    else this.zoom(task === 'finished' ? 'overview' : task === 'stage' ? this.state.tasks.stage ? 'stage' : this.state.stage.straight ? 'cannon' : 'banner' : task, 800);
    if (task === 'cake') this.scheduleSteal();
  }

  initialMessage(task) {
    return {
      wake: this.state.tasks.wake ? '奶盖已经去舞台上班了。它的纸箱暂时空出来了。' : '奶盖：“呼……尊敬的各位罐头……呼……”',
      cake: '芝麻：“你来摆，我看着。财务那边也请顺便看一眼。”',
      stage: '花卷：“横幅有点歪，灯已经接好，礼炮还没有试过！”',
      ceremony: '奶盖清了清嗓子：“请今天的主角坐好——”',
      wish: '猫猫们都安静了。现在可以偷偷许一个愿望。',
      finished: '芝麻、金币、奶盖、花卷：生日快乐，今天你最大！',
    }[task];
  }

  refresh() {
    if (!this.active) return;
    const layers = roomLayers(this.state, this.ui);
    for (const [key, html] of Object.entries(layers)) {
      if (this.layerCache.get(key) === html) continue;
      const layer = this.svg.querySelector(`[data-room-layer="${key}"]`);
      if (layer) layer.innerHTML = html;
      this.layerCache.set(key, html);
    }
    const dark = (this.state.stage.lightsOn || this.state.tasks.stage || this.state.celebrating) && this.state.settings.light !== 'warm';
    this.svg.querySelector('[data-window-sky]')?.setAttribute('fill', dark ? '#405b66' : '#c5d5cb');
    this.svg.classList.toggle('party-disco', (this.state.stage.lightsOn || this.state.celebrating) && this.state.settings.light === 'disco');
    const speech = this.shell.querySelector('.scene-speech');
    speech.textContent = this.message;
    this.shell.querySelector('.scene-dock-speech')?.replaceChildren(document.createTextNode(this.message));
    const arm = this.svg.querySelector('.sneak-arm');
    if (arm) arm.parentNode.append(arm);
    this.shell.querySelector('.scene-counter span').textContent = `${Object.values(this.state.tasks).filter(Boolean).length} / 3`;
  }

  say(message) {
    this.message = message;
    this.shell.querySelector('.scene-speech').textContent = message;
    this.shell.querySelector('.scene-dock-speech')?.replaceChildren(document.createTextNode(message));
  }

  renderControls() {
    if (!this.active) return;
    const dock = this.shell.querySelector('.scene-dock');
    const focus = document.activeElement;
    const action = focus?.dataset.sceneAction;
    const value = focus?.dataset.value;
    const hadFocus = dock.contains(focus);
    const state = this.state;
    const task = this.task;
    this.shell.dataset.task = task;
    this.shell.querySelector('#scene-title').textContent = titles[task];
    this.shell.querySelector('.scene-location span').textContent = { wake: '纸箱角落 · 奶盖的秘密基地', cake: '蛋糕桌前 · 小心一只橘猫', stage: '舞台现场 · 请亲自彩排', ceremony: '全体猫猫 · 今日特别演出', wish: '许愿时间 · 愿望只属于你', finished: '生日快乐 · 全票通过' }[task];
    const heading = (label, title, copy) => `<div class="scene-dock-heading"><span>${label}</span><h2>${title}</h2><p>${copy}</p></div>`;
    const finish = (label, disabled = false) => `<button class="button button-primary scene-finish" data-scene-action="finish" ${disabled ? 'disabled' : ''}>${label} ${icon('arrow', 18)}</button>`;
    if (task === 'wake') {
      dock.innerHTML = heading('MISSION 01 / WAKE UP', state.tasks.wake ? '主持人终于上线。' : '让这只猫，起床营业。', state.tasks.wake ? '它跳出纸箱，拿上话筒，已经奔向舞台。' : '道具可以拖过去。猫条要先撕开，再送到鼻子前。') + (state.tasks.wake ? `<div class="scene-success-note">${icon('check', 22)}<span>空纸箱已释放<br><small>主持人已去舞台就位</small></span></div>${finish(this.ui.waking ? '奶盖正在奔向舞台…' : '拉回全景，看看它', this.ui.waking)}` : `<div class="scene-tools wake-tools"><button class="scene-tool" data-drag="alarm" data-scene-action="wake-tool" data-value="alarm">${icon('clock', 31)}<strong>小闹钟</strong><small>拖到它旁边</small></button><button class="scene-tool" data-drag="script" data-scene-action="wake-tool" data-value="script">${icon('note', 31)}<strong>主持词</strong><small>请它发个言</small></button><button class="scene-tool snack-tool ${this.ui.snackOpen ? 'snack-open' : ''}" data-drag="snack" data-scene-action="snack" aria-label="${this.ui.snackOpen ? '选中打开的猫条' : '撕开猫条'}"><span class="snack-packet"><i></i>${icon('fish', 18)}</span><strong>${this.ui.snackOpen ? '猫条开好啦' : '撕开猫条'}</strong><small>${this.ui.snackOpen ? '拖到鼻子前' : '向右滑，也可轻点'}</small></button></div>${this.ui.snackOpen ? '<button class="button button-secondary scene-feed" data-scene-action="feed">' + icon('snack', 17) + ' 把猫条送过去</button>' : '<p class="scene-tool-tip">也可以先点道具，再点奶盖。</p>'}`);
    } else if (task === 'cake') {
      const total = state.decorations.length;
      dock.innerHTML = heading('MISSION 02 / MAKE A CAKE', '这块蛋糕，随你摆。', '拖一份装饰到蛋糕上；也可以先选装饰，再点落点。') + `<div class="scene-tools decoration-tray">${Object.entries(decorationNames).map(([kind, label]) => `<button class="scene-tool ${this.ui.selected === kind ? 'selected' : ''}" data-drag="${kind}" data-scene-action="select-decoration" data-value="${kind}" aria-label="${label}" aria-pressed="${this.ui.selected === kind}" ${total >= 12 ? 'disabled' : ''}><svg viewBox="-30 -28 60 60" aria-hidden="true">${decoration(kind, 0, 0, 1.2)}</svg><strong>${label}</strong></button>`).join('')}</div><div class="scene-cake-status"><button class="text-button" data-scene-action="undo" ${total ? '' : 'disabled'}>${icon('replay', 14)} 撤回一份</button><span>${total} / 12 份${total < 3 ? ` · 再放 ${3 - total} 份` : ' · 寿星作品满分'}</span></div>${this.ui.stealing ? '<button class="scene-thief-alert" data-scene-action="catch">' + icon('paw', 18) + ' 金币伸爪了！拍它的爪子</button>' : '<p class="scene-tool-tip">金币的爪子会从桌边偷偷伸来，发现就拍回去！</p>'}${finish('蛋糕就长这样！', total < 3)}`;
    } else if (task === 'stage') {
      dock.innerHTML = heading('MISSION 03 / DRESS THE STAGE', '亲手把庆典点亮。', '把横幅右端往上扶，再向下拉一下礼炮绳。') + `<div class="scene-stage-checks"><button data-scene-action="straighten" class="${state.stage.straight ? 'checked' : ''}">${icon(state.stage.straight ? 'check' : 'note', 15)} 横幅${state.stage.straight ? '已扶正' : '有点歪'}</button><button data-scene-action="test-cannon" class="${state.stage.tested ? 'checked' : ''}">${icon(state.stage.tested ? 'check' : 'party', 15)} ${state.stage.tested ? '礼炮已试放' : '试放礼炮'}</button></div><div class="scene-setting"><span>点亮灯光</span><div>${lights.map(([key, label, symbol]) => this.option('light', key, label, symbol)).join('')}</div></div><div class="scene-setting"><span>写上横幅</span><div>${['生日快乐', '今天你最大', '寿星请上座'].map((label) => this.option('banner', label, label)).join('')}</div></div><div class="scene-setting"><span>礼炮装什么</span><div>${cannons.map(([key, label, symbol]) => this.option('confetti', key, label, symbol)).join('')}</div></div>${finish('彩排完成，拉回全景', !state.stage.straight || !state.stage.tested)}`;
    } else if (task === 'ceremony') {
      dock.innerHTML = heading('A LITTLE PARTY / JUST FOR YOU', '请今天的主角就座。', '主持人已开机，蛋糕正在登场。猫猫们正在努力对齐拍子。') + '<div class="ceremony-paws">' + icon('paw', 40) + icon('paw', 29) + icon('paw', 36) + '</div><p class="scene-ceremony-note">今天这场热闹，只为你营业。</p><button class="text-button scene-skip" data-scene-action="skip">略过开场，去许愿 ' + icon('arrow', 15) + '</button>';
    } else if (task === 'wish') {
      dock.innerHTML = heading('MAKE A WISH / TAKE YOUR TIME', '现在，许一个愿望。', '猫猫已经替你安静下来。愿望不用说出口，自己记着就好。') + '<div class="wish-quiet">' + icon('star', 32) + '<span>愿每个明天<br>都有值得期待的小事</span></div><button class="button button-primary scene-finish" data-scene-action="wish">许好啦，吹蜡烛 ' + icon('spark', 19) + '</button>';
    } else {
      dock.innerHTML = heading('HAPPY BIRTHDAY / ALL IN FAVOUR', `${escapeText(state.name)}，生日快乐！`, '蛋糕最大的一块，归你。今天所有的偏爱，也归你。') + '<div class="scene-approved">全票通过 ' + icon('paw', 24) + '</div><button class="button button-primary scene-finish" data-scene-action="card">带走猫猫生日卡 ' + icon('download', 18) + '</button><button class="text-button scene-skip" data-scene-action="back">回到房间，再摸摸猫猫</button>';
    }
    if (task === 'stage') {
      const speech = document.createElement('p');
      speech.className = 'scene-dock-speech';
      speech.setAttribute('role', 'status');
      speech.textContent = this.message;
      dock.querySelector('.scene-finish').before(speech);
    }
    if (hadFocus && action) {
      [...dock.querySelectorAll('[data-scene-action]')].find((element) => element.dataset.sceneAction === action && element.dataset.value === value && !element.disabled)?.focus({ preventScroll: true });
    }
  }

  option(key, value, label, symbol) {
    return `<button class="scene-option ${this.state.settings[key] === value ? 'selected' : ''}" data-scene-action="option" data-option="${key}" data-value="${value}" aria-pressed="${this.state.settings[key] === value}">${symbol ? icon(symbol, 14) : ''}${label}</button>`;
  }

  fit([x, y, width, height]) {
    const aspect = this.viewport.clientWidth / Math.max(1, this.viewport.clientHeight);
    const cameraWidth = Math.max(width, height * aspect);
    const cameraHeight = cameraWidth / aspect;
    return [x + width / 2 - cameraWidth / 2, y + height / 2 - cameraHeight / 2, cameraWidth, cameraHeight];
  }

  setCamera(values) { this.svg.setAttribute('viewBox', values.map((value) => value.toFixed(3)).join(' ')); }

  zoom(name, duration = 740) {
    this.cameraName = name;
    if (this.task === 'stage') this.shell.querySelector('.scene-location span').textContent = { banner: '横幅近景 · 往上扶正右端', cannon: '礼炮近景 · 向下拉一下绳子', stage: '舞台全景 · 看看彩排效果' }[name] || '舞台现场 · 亲自彩排';
    if (this.cameraFrame) cancelAnimationFrame(this.cameraFrame);
    this.cameraResolve?.(false);
    const start = this.svg.getAttribute('viewBox').split(/\s+/).map(Number);
    const target = this.fit(bounds[name] || bounds.overview);
    if (reduced() || !duration) { this.setCamera(target); this.cameraAnimating = false; return Promise.resolve(true); }
    this.cameraAnimating = true;
    const began = performance.now();
    return new Promise((resolve) => {
      this.cameraResolve = resolve;
      const tick = (now) => {
        if (!this.active) { resolve(false); return; }
        const progress = Math.min((now - began) / duration, 1);
        const ease = 1 - (1 - progress) ** 3;
        this.setCamera(start.map((value, index) => value + (target[index] - value) * ease));
        if (progress < 1) this.cameraFrame = requestAnimationFrame(tick);
        else {
          this.cameraAnimating = false; this.cameraResolve = null; resolve(true);
          if (this.refitPending && !this.closing) { this.refitPending = false; this.zoom(this.cameraName, 160); }
        }
      };
      this.cameraFrame = requestAnimationFrame(tick);
    });
  }

  pause(milliseconds) {
    return new Promise((resolve) => {
      const id = setTimeout(() => { this.delays.delete(id); resolve(this.active && !this.closing); }, reduced() ? Math.min(milliseconds, 160) : milliseconds);
      this.delays.set(id, resolve);
    });
  }

  point(clientX, clientY) {
    const matrix = this.svg.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  }

  pointerDown(event) {
    this.ignorePointerClick = false;
    if (this.closing || this.gesture || event.button !== 0 || this.ui.waking) return;
    const target = event.target.closest('[data-drag]');
    if (!target || target.disabled) return;
    event.preventDefault();
    const point = this.point(event.clientX, event.clientY);
    this.gesture = { id: event.pointerId, kind: target.dataset.drag, startX: event.clientX, startY: event.clientY, startPoint: point, bannerAngle: this.ui.bannerAngle, moved: false, wasOpen: this.ui.snackOpen };
    this.shell.setPointerCapture(event.pointerId);
    target.focus?.({ preventScroll: true });
  }

  pointerMove(event) {
    const gesture = this.gesture;
    if (!gesture || gesture.id !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    if (distance < 6 && !gesture.moved) return;
    gesture.moved = true;
    event.preventDefault();
    const point = this.point(event.clientX, event.clientY);
    if (!point) return;
    if (gesture.kind === 'banner') {
      this.ui.bannerAngle = clamp(gesture.bannerAngle + (point.y - gesture.startPoint.y) * (gesture.startPoint.x < 525 ? -.16 : .16), -18, 18);
      this.svg.querySelector('[data-room-layer="banner"] > g')?.setAttribute('transform', `rotate(${this.ui.bannerAngle} 525 153)`);
    } else if (gesture.kind === 'rope') {
      this.ui.pull = clamp(point.y - gesture.startPoint.y, 0, 42);
      this.refresh();
    } else {
      const ghost = this.shell.querySelector('.scene-drag-ghost');
      if (!ghost.classList.contains('visible')) {
        const content = decorationNames[gesture.kind] ? `<svg viewBox="-30 -28 60 60">${decoration(gesture.kind, 0, 0, 1.3)}</svg>` : icon(gesture.kind === 'alarm' ? 'clock' : gesture.kind === 'script' ? 'note' : 'snack', 52);
        ghost.innerHTML = content;
        ghost.classList.add('visible');
      }
      ghost.style.left = `${event.clientX}px`;
      ghost.style.top = `${event.clientY}px`;
      if (gesture.kind === 'snack' && !gesture.wasOpen) {
        const progress = clamp((event.clientX - gesture.startX) / 55, 0, 1);
        this.shell.querySelector('.snack-packet')?.style.setProperty('--tear', `${progress * 26}px`);
      }
      this.viewport.classList.toggle('holding-decoration', Boolean(decorationNames[gesture.kind]));
    }
  }

  pointerUp(event) {
    const gesture = this.gesture;
    if (!gesture || event.pointerId !== gesture.id) return;
    const point = this.point(event.clientX, event.clientY);
    this.cancelGesture(false);
    this.ignorePointerClick = true;
    if (!gesture.moved) {
      if (gesture.kind === 'banner') this.straighten();
      else if (gesture.kind === 'rope') this.testCannon();
      else if (decorationNames[gesture.kind]) this.selectDecoration(gesture.kind);
      else if (gesture.kind === 'snack') this.openSnack();
      else this.wakeTool(gesture.kind);
      return;
    }
    if (gesture.kind === 'banner') {
      if (Math.abs(this.ui.bannerAngle) < 3) this.straighten();
      else {
        this.state.stage.straight = false; this.state.tasks.stage = false;
        this.callbacks.save(); this.refresh(); this.renderControls();
        this.say('花卷：“再把右边往上扶一点，快正了！”');
      }
    } else if (gesture.kind === 'rope') {
      if (point && point.y - gesture.startPoint.y > 18) this.testCannon();
      else { this.ui.pull = 0; this.refresh(); this.say('花卷：“往下多拉一点点。绳子结实，放心！”'); }
    } else if (decorationNames[gesture.kind]) this.placeDecoration(gesture.kind, point);
    else if (gesture.kind === 'snack' && !gesture.wasOpen) {
      if (Math.abs(event.clientX - gesture.startX) > 25 || Math.abs(event.clientY - gesture.startY) > 30) this.openSnack();
      else this.say('沿着包装封口滑一下，就能把猫条撕开。');
    } else if (point && Math.hypot(point.x - 146, point.y - 411) < 110) {
      if (gesture.kind === 'snack') this.feed(); else this.wakeTool(gesture.kind);
    } else this.say('道具离奶盖有点远，再往纸箱旁边挪一挪。');
  }

  cancelGesture(restore = true) {
    const kind = this.gesture?.kind;
    if (this.gesture && this.shell.hasPointerCapture(this.gesture.id)) this.shell.releasePointerCapture(this.gesture.id);
    this.gesture = null;
    this.shell.querySelector('.scene-drag-ghost').classList.remove('visible');
    this.viewport.classList.remove('holding-decoration');
    if (restore && (kind === 'banner' || kind === 'rope')) {
      this.ui.bannerAngle = this.state.stage.straight ? 0 : 9;
      this.ui.pull = 0;
      this.refresh();
    }
  }

  onClick(event) {
    if (this.ignorePointerClick && event.detail && event.target.closest('[data-drag]')) { this.ignorePointerClick = false; return; }
    if (this.closing) return;
    const target = event.target.closest('[data-scene-action]');
    if (!target || target.disabled) return;
    const action = target.dataset.sceneAction;
    if (action === 'back') this.close();
    else if (action === 'wake-tool') this.wakeTool(target.dataset.value);
    else if (action === 'snack') this.openSnack();
    else if (action === 'feed') this.feed();
    else if (action === 'poke') {
      this.ui.pose = this.ui.pose === 'turned' ? '' : 'turned'; this.refresh();
      this.say('奶盖翻了个身，尾巴动了一下：“……再睡五分钟。”'); this.callbacks.sound('meow');
    }
    else if (action === 'select-decoration') this.selectDecoration(target.dataset.value);
    else if (action === 'place') this.placeDecoration(this.ui.selected, event.detail ? this.point(event.clientX, event.clientY) : { x: 455, y: 312 });
    else if (action === 'catch') this.catchPaw();
    else if (action === 'undo') {
      this.state.decorations.pop();
      if (this.state.decorations.length < 3) this.state.tasks.cake = false;
      this.callbacks.save(); this.refresh(); this.renderControls();
    }
    else if (action === 'straighten') this.straighten();
    else if (action === 'test-cannon') this.testCannon();
    else if (action === 'lights') this.setOption('light', lights[(lights.findIndex(([key]) => key === this.state.settings.light) + 1) % lights.length][0]);
    else if (action === 'option') this.setOption(target.dataset.option, target.dataset.value);
    else if (action === 'finish') this.finish();
    else if (action === 'skip') { this.sequence++; this.toWish(); }
    else if (action === 'wish') this.blowCandles();
    else if (action === 'card') this.close().then(() => this.callbacks.card());
  }

  onKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); this.close(); return; }
    if (event.key === 'Tab') {
      const focusable = [...this.shell.querySelectorAll('button:not(:disabled), [role="button"][tabindex="0"]')].filter((element) => element.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('g[role="button"], path[role="button"], ellipse[role="button"]')) {
      event.preventDefault(); this.onClick({ target: event.target, detail: 0 });
    }
  }

  wakeTool(kind) {
    if (this.task !== 'wake' || this.state.tasks.wake) return;
    this.ui.pose = kind;
    this.refresh();
    this.say(kind === 'alarm' ? '闹钟一响，奶盖伸爪按掉：“这位来宾，请保持安静。”' : '奶盖在梦里举爪：“同意。下一位罐头请发言。”');
    this.callbacks.sound(kind === 'alarm' ? 'alarm' : 'meow');
  }

  openSnack() {
    if (this.state.tasks.wake) return;
    const alreadyOpen = this.ui.snackOpen;
    this.ui.snackOpen = true;
    this.ui.selected = 'snack';
    this.ui.pose = 'sniffing';
    this.refresh(); this.renderControls();
    this.say(alreadyOpen ? '猫条拿好了。拖到奶盖鼻子前，或者轻点它。' : '嘶啦——猫条开了。奶盖的耳朵，悄悄竖起来了。');
    this.callbacks.sound('tap');
  }

  async feed() {
    if (this.task !== 'wake' || this.state.tasks.wake) return;
    if (!this.ui.snackOpen) { this.say('先撕开猫条包装，它才能闻到。'); return; }
    this.state.tasks.wake = true;
    this.ui.waking = true;
    this.callbacks.save(); this.refresh(); this.renderControls();
    this.say('奶盖瞬间睁眼：“各位来宾，我一直都在！”');
    this.callbacks.sound('success');
    const moving = this.svg.querySelector('[data-host-motion]');
    const began = performance.now();
    await new Promise((resolve) => {
      const tick = (now) => {
        if (!this.active || this.closing) { resolve(); return; }
        const t = reduced() ? 1 : Math.min((now - began) / 1500, 1);
        const x = 146 + 599 * t;
        const y = 380 + 70 * t - Math.abs(Math.sin(t * Math.PI * 3)) * 65;
        moving?.setAttribute('transform', `translate(${x} ${y})`);
        if (t < 1) { const id = requestAnimationFrame((time) => { this.frames.delete(id); tick(time); }); this.frames.add(id); }
        else resolve();
      };
      tick(began);
    });
    if (!this.active || this.closing) return;
    this.ui.waking = false; this.refresh(); this.renderControls();
    this.milestone('奶盖已开机 · 主持人奔向舞台');
  }

  selectDecoration(kind) {
    if (this.task !== 'cake' || this.state.decorations.length >= 12) return;
    this.ui.selected = kind;
    this.refresh(); this.renderControls();
    this.say(`拿好${decorationNames[kind]}啦。点蛋糕上想放的位置，也可以直接拖一份过去。`);
  }

  placeDecoration(kind, point) {
    if (!kind || !decorationNames[kind]) { this.say('先从道具盘里选一份装饰吧。'); return; }
    if (this.state.decorations.length >= 12 || !point) return;
    const x = (point.x - 455) / .87;
    const y = (point.y - 346) / .87;
    if ((x / 97) ** 2 + ((y + 39) / 35) ** 2 > 1.14) {
      this.ui.fumble = { kind, x: point.x, y: point.y };
      this.refresh(); this.say('哎呀，掉到桌布上了。花卷捡回来了，再放一次！');
      this.pause(900).then((active) => { if (active) { this.ui.fumble = null; this.refresh(); } });
      return;
    }
    this.state.decorations.push({ kind, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    this.callbacks.save(); this.refresh(); this.renderControls(); this.callbacks.sound('tap');
    const newest = this.svg.querySelector(`[data-decoration-index="${this.state.decorations.length - 1}"]`);
    if (!reduced()) newest?.animate([{ opacity: .2, translate: '0 -12px' }, { opacity: 1, translate: '0 0' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.3,1.4)' });
    this.say(this.state.decorations.length === 3 ? '芝麻：“这就很好看了。还想加，也完全可以。”' : `啪嗒，一份${decorationNames[kind]}放好了。金币似乎更想靠近了。`);
  }

  async scheduleSteal() {
    if (this.task !== 'cake' || this.state.stolen || this.state.tasks.cake) return;
    const token = this.sequence;
    if (!await this.pause(4200) || token !== this.sequence || this.task !== 'cake') return;
    this.ui.stealing = true; this.refresh(); this.renderControls();
    this.say('一只橘色爪子偷偷伸来了——快拍回去！');
    if (!await this.pause(6200) || token !== this.sequence || !this.ui.stealing) return;
    this.ui.stealing = false; this.state.stolen = true; this.callbacks.save();
    this.refresh(); this.renderControls(); this.callbacks.sound('meow');
    this.say('被它舔了一口！花卷赶紧插块饼干：“现在这是设计。”');
  }

  async catchPaw() {
    if (!this.ui.stealing) return;
    this.sequence++;
    this.ui.stealing = false; this.ui.caught = true;
    this.refresh(); this.renderControls(); this.callbacks.sound('meow');
    this.say('啪！爪子缩回桌下，传来金币的声音：“我在检查奶油厚度。”');
    if (await this.pause(900)) { this.ui.caught = false; this.refresh(); this.scheduleSteal(); }
  }

  straighten() {
    if (this.task !== 'stage') return;
    this.state.stage.straight = true;
    this.ui.bannerAngle = 0;
    this.callbacks.save(); this.refresh(); this.renderControls();
    this.say('横幅终于摆正了。花卷：“我刚刚觉得，倒着看也挺顺的。”');
    this.callbacks.sound('success');
    this.zoom('cannon', 900);
  }

  async testCannon() {
    if (this.task !== 'stage' || this.ui.recoil) return;
    this.ui.recoil = true;
    if (this.cameraName !== 'cannon') await this.zoom('cannon', 500);
    if (!this.active || this.closing) return;
    this.state.stage.tested = true; this.ui.pull = 0;
    this.callbacks.save(); this.refresh(); this.renderControls();
    this.callbacks.confetti(this.state.settings.confetti, 2400); this.callbacks.sound('success');
    this.say(this.state.settings.confetti === 'fish' ? '砰！金币立刻冲过来：“这个方案，我全力支持！”' : '砰！花卷往后一坐：“力道……比我想的大一点点。”');
    if (await this.pause(1100)) { this.ui.recoil = false; this.refresh(); if (this.cameraName === 'cannon') this.zoom('stage', 750); }
  }

  setOption(key, value) {
    this.state.settings[key] = value;
    if (key === 'light') this.state.stage.lightsOn = true;
    this.callbacks.save(); this.refresh(); this.renderControls(); this.callbacks.sound('tap');
    if (key === 'light') this.zoom('stage', 650);
    else if (key === 'banner') this.zoom('banner', 650);
    this.say(key === 'light' ? value === 'disco' ? '灯一亮，芝麻忍不住跟着晃：“我在测试地板稳定性。”' : '啪嗒。灯光照到墙上，整个房间都变了颜色。' : key === 'banner' ? '花卷认真抄下了这句话。寿星的决定，全票通过。' : '礼炮已经换好。再拉一下绳子，看看会掉下什么！');
  }

  milestone(message) {
    const element = this.shell.querySelector('.scene-milestone');
    element.textContent = message; element.classList.add('visible');
  }

  async finish() {
    if (this.ui.waking || this.closing) return;
    if (this.task === 'cake' && this.state.decorations.length < 3) return;
    if (this.task === 'stage' && (!this.state.stage.straight || !this.state.stage.tested)) return;
    this.state.tasks[this.task] = true;
    if (this.task === 'stage') this.state.stage.lightsOn = true;
    this.ui.stealing = false; this.ui.selected = null;
    this.sequence++;
    this.callbacks.save(); this.refresh(); this.callbacks.sound('success');
    this.milestone({ wake: '纸箱空出来了 · 主持人已上班', cake: '蛋糕已就位 · 财务请保持距离', stage: '灯光就绪 · 横幅扶正 · 礼炮通过' }[this.task]);
    if (await this.pause(550)) await this.close();
  }

  async runCeremony() {
    const token = this.sequence;
    const current = () => this.active && !this.closing && token === this.sequence;
    await this.zoom('host', 950);
    if (!current()) return;
    this.say('奶盖举起话筒：“各位来宾！今天最大的一位，已经到了！”');
    this.callbacks.birthdaySong();
    await this.pause(1700);
    if (!current()) return;
    await this.zoom('cake', 950);
    if (!current()) return;
    this.say('花卷把蛋糕往前推了推。金币：“我负责远距离欣赏。”');
    this.svg.querySelector('[data-room-layer="cake"]')?.animate([{ translate: '28px 0', opacity: .6 }, { translate: '0 0', opacity: 1 }], { duration: reduced() ? 1 : 700 });
    await this.pause(1700);
    if (!current()) return;
    await this.zoom('overview', 900);
    if (!current()) return;
    this.callbacks.confetti(this.state.settings.confetti, 5800);
    this.say('有人抢拍，有人忘词，但最后全体猫猫一起喊了出来：“生日快乐！”');
    await this.pause(1800);
    if (current()) this.toWish();
  }

  toWish() {
    if (!this.active || this.closing) return;
    this.task = this.state.wished ? 'finished' : 'wish'; this.ui.task = this.task;
    this.message = this.initialMessage(this.task);
    this.refresh(); this.renderControls(); this.zoom(this.task === 'finished' ? 'overview' : 'wish', 900);
  }

  async blowCandles() {
    if (this.state.wished || this.task !== 'wish') return;
    this.state.wished = true; this.callbacks.save();
    this.refresh(); this.say('呼——蜡烛熄灭了。愿望已经被猫猫认真记住。');
    this.viewport.classList.add('wish-reveal'); this.callbacks.sound('success');
    this.shell.querySelector('[data-scene-action="wish"]').disabled = true;
    if (!await this.pause(1000)) return;
    this.task = 'finished'; this.ui.task = 'finished'; this.message = this.initialMessage('finished');
    this.refresh(); this.renderControls(); this.zoom('overview', 1000);
    this.callbacks.confetti(this.state.settings.confetti, 4500);
  }

  close() {
    if (this.closing) return this.closePromise;
    if (!this.active) return Promise.resolve();
    this.closing = true;
    this.sequence++;
    this.cancelGesture();
    this.closePromise = this.leave();
    return this.closePromise;
  }

  async leave() {
    this.shell.classList.add('scene-leaving');
    this.ui = { task: '' };
    this.refresh();
    await this.zoom('overview', 650);
    this.resizeObserver.disconnect(); this.abort.abort();
    cancelAnimationFrame(this.cameraFrame); this.cameraResolve?.(false);
    for (const id of this.frames) cancelAnimationFrame(id);
    this.frames.clear();
    for (const [id, resolve] of this.delays) { clearTimeout(id); resolve(false); }
    this.delays.clear();
    this.svg.setAttribute('viewBox', '0 0 900 610');
    this.svg.setAttribute('role', 'img');
    this.svg.classList.remove('interactive-room');
    this.placeholder.replaceWith(this.svg);
    this.shell.remove(); this.active = false;
    document.querySelector('#app').inert = false;
    document.body.classList.remove('scene-open');
    this.callbacks.close();
    document.querySelector('.brief-main')?.focus({ preventScroll: true });
  }
}
