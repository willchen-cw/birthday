const SOUND_KEY = 'kitty-birthday-sound';
const TEMPO = 108;
const STEP_SECONDS = 60 / TEMPO / 2;

// An original music-box waltz. Six eighth notes make one bar.
const THEME = [
  ['C3', ['C4', 'E4', 'G4'], ['E5', null, 'G5', null, 'A5', 'G5']],
  ['A2', ['C4', 'E4', 'A4'], ['E5', null, 'C5', null, 'E5', 'G5']],
  ['F3', ['C4', 'F4', 'A4'], ['A5', null, 'G5', 'F5', 'A5', null]],
  ['G2', ['B3', 'D4', 'G4'], ['G5', null, 'D5', null, 'B4', 'D5']],
  ['E3', ['B3', 'E4', 'G4'], ['E5', null, 'G5', null, 'B5', 'A5']],
  ['A2', ['C4', 'E4', 'A4'], ['A5', null, 'E5', null, 'C5', 'E5']],
  ['D3', ['D4', 'F4', 'A4'], ['F5', null, 'A5', 'G5', 'F5', null]],
  ['G2', ['B3', 'D4', 'F4'], ['D5', null, 'G5', null, 'B5', null]],
  ['C3', ['C4', 'E4', 'G4'], ['C6', null, 'B5', 'G5', 'E5', null]],
  ['B2', ['B3', 'D4', 'G4'], ['B5', null, 'A5', 'G5', 'D5', null]],
  ['A2', ['C4', 'E4', 'A4'], ['A5', null, 'G5', 'E5', 'C5', null]],
  ['F3', ['C4', 'F4', 'A4'], ['F5', null, 'A5', null, 'C6', 'A5']],
  ['D3', ['D4', 'F4', 'A4'], ['G5', 'F5', 'D5', null, 'F5', null]],
  ['G2', ['B3', 'D4', 'F4'], ['E5', 'D5', 'B4', null, 'D5', null]],
  ['C3', ['C4', 'E4', 'G4'], ['E5', null, 'G5', null, 'D5', 'E5']],
  ['C3', ['C4', 'E4', 'G4'], ['C5', null, 'E5', null, 'G5', null]],
];

// All four lines of the traditional birthday melody, including their held notes.
const BIRTHDAY_NOTES = [
  ['G4', 1], ['G4', 1], ['A4', 2], ['G4', 2], ['C5', 2], ['B4', 4],
  ['G4', 1], ['G4', 1], ['A4', 2], ['G4', 2], ['D5', 2], ['C5', 4],
  ['G4', 1], ['G4', 1], ['G5', 2], ['E5', 2], ['C5', 2], ['B4', 2], ['A4', 4],
  ['F5', 1], ['F5', 1], ['E5', 2], ['C5', 2], ['D5', 2], ['C5', 4],
];
const BIRTHDAY_STEPS = BIRTHDAY_NOTES.flatMap(([pitch, length]) => [{ pitch, length }, ...Array(length - 1).fill(null)]);

function frequency(pitch) {
  const [, letter, sharp, octave] = /^([A-G])(#?)(\d)$/.exec(pitch);
  const semitone = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter] + (sharp ? 1 : 0);
  return 440 * 2 ** (((Number(octave) + 1) * 12 + semitone - 69) / 12);
}

export class PartyAudio {
  constructor({ onChange, onUnavailable } = {}) {
    this.onChange = onChange;
    this.onUnavailable = onUnavailable;
    this.enabled = true;
    try { this.enabled = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* Storage is optional. */ }
    this.started = false;
    this.paused = document.hidden;
    this.voices = new Set();
    this.track = 'theme';
    this.step = 0;
    this.mood = 'party';

    document.addEventListener('visibilitychange', () => this.visibilityChanged());
    window.addEventListener('pagehide', () => { this.paused = true; this.pause(); });
    window.addEventListener('pageshow', () => this.visibilityChanged());
    const recover = (event) => {
      if (event.target.closest?.('[data-audio-toggle]')) return;
      if (this.started && this.enabled && !this.paused && !this.playing) this.startIfEnabled();
    };
    document.addEventListener('pointerdown', recover, { capture: true });
    document.addEventListener('keydown', recover, { capture: true });
  }

  get playing() {
    return this.enabled && this.started && !this.paused && !document.hidden && this.context?.state === 'running';
  }

  get status() { return !this.enabled ? 'muted' : this.playing ? 'playing' : 'ready'; }

  emit() { this.onChange?.(this.status); }

  ensureContext() {
    if (this.context) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Audio is unavailable');
    this.context = new AudioContext({ latencyHint: 'interactive' });
    this.music = this.context.createGain();
    this.effects = this.context.createGain();
    this.master = this.context.createGain();
    this.limiter = this.context.createDynamicsCompressor();
    this.master.gain.value = 0;
    this.music.gain.value = this.mood === 'wish' ? .36 : .8;
    this.effects.gain.value = .7;
    this.limiter.threshold.value = -16;
    this.limiter.knee.value = 18;
    this.limiter.ratio.value = 3;
    this.limiter.attack.value = .006;
    this.limiter.release.value = .18;
    this.music.connect(this.limiter);
    this.effects.connect(this.limiter);
    this.limiter.connect(this.master);
    this.master.connect(this.context.destination);
    this.context.addEventListener('statechange', () => {
      if (this.playing) this.startScheduler(); else this.stopScheduler();
      this.emit();
    });
  }

  async startIfEnabled() {
    if (!this.enabled || this.paused || document.hidden) return false;
    clearTimeout(this.suspendTimer);
    this.started = true;
    try {
      this.ensureContext();
      // Resume is called in the original click/tap handler, before awaiting anything.
      if (this.context.state !== 'running') await this.context.resume();
      if (!this.playing) { this.emit(); return false; }
      this.master.gain.setTargetAtTime(.76, this.context.currentTime, .035);
      this.startScheduler();
      this.emit();
      return true;
    } catch {
      this.emit();
      if (!this.reportedUnavailable) {
        this.reportedUnavailable = true;
        this.onUnavailable?.();
      }
      return false;
    }
  }

  toggle() {
    if (this.playing) {
      this.enabled = false;
      try { localStorage.setItem(SOUND_KEY, 'off'); } catch { /* Storage is optional. */ }
      this.pause();
      return Promise.resolve(false);
    }
    this.enabled = true;
    try { localStorage.setItem(SOUND_KEY, 'on'); } catch { /* Storage is optional. */ }
    return this.startIfEnabled();
  }

  pause() {
    this.stopScheduler();
    this.stopVoices();
    clearTimeout(this.suspendTimer);
    if (this.context) {
      this.master.gain.setTargetAtTime(0, this.context.currentTime, .012);
      this.suspendTimer = setTimeout(() => {
        if (!this.enabled || this.paused || document.hidden) this.context.suspend().catch(() => {});
      }, 65);
    }
    this.emit();
  }

  visibilityChanged() {
    this.paused = document.hidden;
    if (this.paused) this.pause();
    else if (this.started && this.enabled) this.startIfEnabled();
  }

  setMood(mood) {
    this.mood = mood;
    if (this.context) this.music.gain.setTargetAtTime(mood === 'wish' ? .36 : .8, this.context.currentTime, .35);
  }

  startScheduler() {
    if (this.timer || !this.playing) return;
    this.nextTime = this.context.currentTime + .06;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 100);
  }

  stopScheduler() {
    clearInterval(this.timer);
    this.timer = null;
  }

  schedule() {
    if (!this.playing) return;
    const now = this.context.currentTime;
    if (this.nextTime < now - .15) this.nextTime = now + .03;
    while (this.nextTime < now + .3) {
      if (this.track === 'birthday') this.scheduleBirthday();
      else this.scheduleTheme();
      this.nextTime += STEP_SECONDS;
    }
  }

  scheduleTheme() {
    const bar = THEME[Math.floor(this.step / 6) % THEME.length];
    const beat = this.step % 6;
    const melody = bar[2][beat];
    if (melody) this.note(frequency(melody), .95, this.nextTime, .15, { bell: true });
    if (beat === 0) this.note(frequency(bar[0]), .8, this.nextTime, .12, { type: 'triangle' });
    if (beat === 2 || beat === 4) {
      bar[1].forEach((pitch, index) => this.note(frequency(pitch), .46, this.nextTime + index * .012, .04));
    }
    this.step = (this.step + 1) % (THEME.length * 6);
  }

  scheduleBirthday() {
    const entry = BIRTHDAY_STEPS[this.step];
    if (entry) this.note(frequency(entry.pitch), entry.length * STEP_SECONDS + .16, this.nextTime, .19, { bell: true });
    if (this.step % 6 === 0) {
      const chord = this.step < 12 ? ['C3', 'E4', 'G4'] : this.step < 24 ? ['G2', 'D4', 'G4'] : this.step < 38 ? ['A2', 'C4', 'E4'] : this.step < 44 ? ['F3', 'A4', 'C5'] : ['C3', 'E4', 'G4'];
      chord.forEach((pitch, index) => this.note(frequency(pitch), .9, this.nextTime + index * .016, index ? .045 : .1, { type: index ? 'sine' : 'triangle' }));
    }
    this.step++;
    if (this.step >= BIRTHDAY_STEPS.length) {
      this.track = 'theme'; this.step = 0;
      this.nextTime += STEP_SECONDS * 2;
    }
  }

  note(hertz, duration, when, volume, { type = 'sine', bell = false, effect = false, glide } = {}) {
    if (!this.playing) return;
    const context = this.context;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(volume, when + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
    gain.connect(effect ? this.effects : this.music);
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(hertz, when);
    if (glide) oscillator.frequency.exponentialRampToValueAtTime(glide, when + duration * .8);
    oscillator.connect(gain);
    const sources = [oscillator];
    let overtoneGain;
    if (bell) {
      const overtone = context.createOscillator();
      overtone.frequency.value = hertz * 2.003;
      overtoneGain = context.createGain();
      overtoneGain.gain.value = .13;
      overtone.connect(overtoneGain); overtoneGain.connect(gain);
      sources.push(overtone);
    }
    const voice = { sources, gain, effect };
    this.voices.add(voice);
    oscillator.onended = () => {
      this.voices.delete(voice);
      sources.forEach((source) => source.disconnect());
      overtoneGain?.disconnect(); gain.disconnect();
    };
    for (const source of sources) { source.start(when); source.stop(when + duration + .02); }
  }

  stopVoices(musicOnly = false) {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const voice of this.voices) {
      if (musicOnly && voice.effect) continue;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(.0001, now, .012);
      voice.sources.forEach((source) => { try { source.stop(now + .05); } catch { /* Already ended. */ } });
    }
  }

  effect(kind) {
    if (!this.playing) return;
    const time = this.context.currentTime + .005;
    const play = (hertz, length, delay = 0, options = {}) => this.note(hertz, length, time + delay, .13, { effect: true, ...options });
    if (kind === 'success' || kind === 'enter') [523.25, 659.25, 783.99].forEach((pitch, index) => play(pitch, .4, index * .1, { bell: true }));
    else if (kind === 'alarm') [880, 660, 880, 660].forEach((pitch, index) => play(pitch, .11, index * .14));
    else if (kind === 'meow') play(720, .35, 0, { type: 'triangle', glide: 420 });
    else play(659.25, .1);
  }

  birthdaySong() {
    if (!this.playing) return;
    this.stopVoices(true);
    this.track = 'birthday'; this.step = 0;
    this.nextTime = this.context.currentTime + .07;
    this.schedule();
  }
}
