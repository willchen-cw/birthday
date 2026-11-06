export const colors = { ink: '#344e46', orange: '#df9560', cream: '#fff9eb', mint: '#c9d8c1', pink: '#e9b3aa' };

export const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function icon(name, size = 24) {
  const paths = {
    paw: '<ellipse cx="12" cy="16" rx="5.8" ry="4.4" fill="currentColor" stroke="none"/><ellipse cx="5" cy="9" rx="2.5" ry="3.2" transform="rotate(-25 5 9)" fill="currentColor" stroke="none"/><ellipse cx="10" cy="5.6" rx="2.3" ry="3" fill="currentColor" stroke="none"/><ellipse cx="16" cy="6.2" rx="2.3" ry="3" transform="rotate(15 16 6.2)" fill="currentColor" stroke="none"/><ellipse cx="20" cy="11" rx="2.3" ry="3" transform="rotate(30 20 11)" fill="currentColor" stroke="none"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    sound: '<path d="m11 5-5 4H3v6h3l5 4zM15 8q5 4 0 8m3-11q8 7 0 14"/>',
    muted: '<path d="m11 5-5 4H3v6h3l5 4zM16 9l6 6m-6 0 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    spark: '<path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7z"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 8v5l3 2M5 2 2 5m17-3 3 3M6 21l-1 2m13-2 1 2"/>',
    note: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7m-7 4h5"/>',
    snack: '<path d="m9 2 7 2-3 17-7-2zM8 8l7 2M7 14l7 2"/><path d="m17 5 3-2m-2 7h4"/>',
    cake: '<path d="M3 13h18v8H3zM5 13V9h14v4M8 9V6m8 3V6m-4 3V4M3 16q3 4 6 0 3 4 6 0 3 4 6 0"/><path d="M12 1v1M8 3v1m8-1v1"/>',
    party: '<path d="m3 21 4-14 10 10zM7 7l10 10M5 14l6 6M12 6l2-3m3 7 4-1m-4-4 2-3M4 3l2 1m14 12 2 2"/>',
    star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
    edit: '<path d="m4 16-1 5 5-1L20 8l-4-4zM14 6l4 4M3 21l5-1"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    replay: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
    heart: '<path d="M12 21 3.5 12.5C-2 6 6 0 12 7c6-7 14-1 8.5 5.5z"/>',
    fish: '<path d="M3 12q7-10 14-2l5-5v14l-5-5Q10 22 3 12z"/><circle cx="8" cy="11" r=".7" fill="currentColor"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12z"/>',
    music: '<path d="M9 18V5l12-3v13M9 9l12-3"/><ellipse cx="5.5" cy="18.5" rx="3.5" ry="2.5"/><ellipse cx="17.5" cy="15.5" rx="3.5" ry="2.5"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
}

// All illustrations are drawn locally; there are no image or font requests.
export function cat(type = 'black', { x = 0, y = 0, scale = 1, sleeping = false, happy = false, id = '', bow = false } = {}) {
  const coat = { black: '#3d5148', orange: '#dda06b', white: '#fffaf0', calico: '#fff9ed' }[type];
  const outline = '#344e46';
  const eye = type === 'black' ? '#fff1bc' : outline;
  return `<g transform="translate(${x} ${y}) scale(${scale})" class="cat cat-${type}" ${id ? `id="${id}"` : ''}>
    <ellipse cx="0" cy="88" rx="65" ry="10" fill="#344e46" opacity=".10"/>
    <path d="M42 65q43 10 35-25" fill="none" stroke="${outline}" stroke-width="18" stroke-linecap="round"/>
    <path d="M42 65q43 10 35-25" fill="none" stroke="${coat}" stroke-width="12" stroke-linecap="round" class="cat-tail"/>
    <path d="M-43 29Q-57 54-49 82q13 13 31 1h36q19 13 31-1 8-28-7-53" fill="${coat}" stroke="${outline}" stroke-width="3"/>
    ${type === 'orange' ? '<path d="m-43 45 18 5m-24 10 20 3m74-18-18 5m21 10-20 3" stroke="#bd784b" stroke-width="5" stroke-linecap="round"/>' : ''}
    <path d="M-48-19-48-57-19-37Q0-43 20-37L49-57l-2 39Q66 23 33 36q-33 14-66 0-34-13-15-55Z" fill="${coat}" stroke="${outline}" stroke-width="3" stroke-linejoin="round"/>
    <path class="cat-ears" d="m-40-43 2 20 13-11m65-9-2 20-13-11" fill="${type === 'black' ? '#bc9480' : '#e8b3a3'}"/>
    ${happy ? '<g class="party-hat"><path d="m-22-38 20-55 25 55Z" fill="#e4ba70" stroke="#344e46" stroke-width="2"/><path d="m-14-56 27 9m-21-26 13 5" stroke="#fff2c9" stroke-width="5"/><circle cx="-2" cy="-95" r="7" fill="#dca99a" stroke="#344e46" stroke-width="2"/></g>' : ''}
    ${type === 'calico' ? '<path d="M-48-19-48-57-19-37-8-38q-4 38-35 41Z" fill="#d99562"/><path d="m20-37 29-20-2 39q9 18 5 26-35-4-32-45" fill="#596457"/>' : ''}
    ${type === 'orange' ? '<path d="m-14-35 6 14m9-16v15m13-13-6 14" stroke="#bd784b" stroke-width="5" stroke-linecap="round"/>' : ''}
    <g class="cat-face">
      ${sleeping || happy ? `<path d="m-26 4q7 ${sleeping ? '-8' : '-12'} 14 0m24 0q7 ${sleeping ? '-8' : '-12'} 14 0" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/>` : `<ellipse cx="-19" cy="1" rx="3" ry="5" fill="${eye}"/><ellipse cx="19" cy="1" rx="3" ry="5" fill="${eye}"/>`}
      <path class="cat-nose" d="m-4 11 4 3 4-3Z" fill="${type === 'black' ? '#e4b39c' : '#bb8175'}"/>
      <path d="M0 14q-2 8-8 3m8-3q2 8 8 3" fill="none" stroke="${eye}" stroke-width="2" stroke-linecap="round"/>
      <path d="m-36 7-15-3m16 10-15 3m86-10 15-3m-16 10 15 3" stroke="${outline}" stroke-width="2" stroke-linecap="round"/>
      ${type !== 'black' ? '<ellipse cx="-32" cy="13" rx="7" ry="4" fill="#e9afa1" opacity=".6"/><ellipse cx="32" cy="13" rx="7" ry="4" fill="#e9afa1" opacity=".6"/>' : ''}
    </g>
    ${type === 'black' || bow ? `<path d="m-2 40-${bow ? '25' : '17'}-8v20l${bow ? '25' : '17'}-8m4-4 ${bow ? '25' : '17'}-8v20L2 44" fill="${bow ? '#d8a3a1' : '#e0a266'}" stroke="#344e46" stroke-width="2"/><circle cy="42" r="4" fill="#f5d390" stroke="#344e46" stroke-width="2"/>` : ''}
    ${type === 'white' && !sleeping ? '<path d="M-7 53h14v25H-7z" fill="#7a8e7b" stroke="#344e46" stroke-width="2"/><circle cy="50" r="10" fill="#d6cbb7" stroke="#344e46" stroke-width="2"/><path d="m-6 47 12 6m-12-2 9 5" stroke="#8d9a89" stroke-width="2"/>' : ''}
    ${sleeping ? '<g class="sleep-z" fill="#7c8a79" font-family="Georgia,serif" font-style="italic"><text x="53" y="-28" font-size="23">z</text><text x="71" y="-51" font-size="30">z</text><text x="93" y="-77" font-size="38">z</text></g>' : ''}
  </g>`;
}

export function avatar(type, sleeping = false) {
  return `<svg viewBox="-75 -65 150 165" aria-hidden="true">${cat(type, { sleeping })}</svg>`;
}

export function decoration(kind, x, y, scale = 1) {
  const shapes = {
    strawberry: '<path d="M-13-5Q-22 6-3 22q4 4 8-1Q23 3 12-6Z" fill="#d77c67" stroke="#704e3b" stroke-width="2"/><path d="m-14-5 10 1L0-14 4-5l11-2-8 8L0-1-8 3Z" fill="#6e9175" stroke="#456554" stroke-width="1.5"/><path d="m-8 5 2 2m11-4-1 2m-6 7 1 2m8-4-1 2" stroke="#ffe3a2" stroke-width="2"/>',
    star: '<path d="m0-16 5 10 12 2-9 8 2 12L0 10l-11 6 2-12-9-8 12-2Z" fill="#eac465" stroke="#8b7445" stroke-width="2"/>',
    paw: '<circle cy="7" r="16" fill="#e2b788" stroke="#997450" stroke-width="2"/><ellipse cy="10" rx="7" ry="5" fill="#b87e58"/><circle cx="-9" cy="1" r="3" fill="#b87e58"/><circle cx="-3" cy="-3" r="3" fill="#b87e58"/><circle cx="4" cy="-3" r="3" fill="#b87e58"/><circle cx="10" cy="2" r="3" fill="#b87e58"/>',
    sprinkle: '<g stroke-width="5" stroke-linecap="round"><path d="m-13-6 5 5m6-12 3 6" stroke="#d89085"/><path d="m8-5 5-5m-7 15 5 3" stroke="#789f8a"/><path d="m-10 9 5-2m6 7 3 4" stroke="#d4ac4b"/></g>',
    fish: '<path d="M-18 0q13-16 26-3l13-10v26L8 3Q-5 16-18 0Z" fill="#d4b473" stroke="#8f865a" stroke-width="2"/><circle cx="-10" cy="-1" r="2" fill="#50634e"/>',
  };
  return `<g transform="translate(${x} ${y}) scale(${scale})">${shapes[kind] || shapes.star}</g>`;
}

export function cake({ x = 0, y = 0, scale = 1, decorations = [], stolen = false, candles = false, lit = true } = {}) {
  const spots = [[-62, -56], [49, -66], [-16, -37], [79, -35], [-79, -20], [22, -15], [0, -73], [58, -13], [-41, -14], [0, -50], [-90, -45], [85, -56]];
  return `<g transform="translate(${x} ${y}) scale(${scale})" class="birthday-cake">
    <ellipse cy="47" rx="128" ry="23" fill="#e5e5cf" stroke="#536856" stroke-width="2.5"/>
    <path d="M-105-39v67c0 30 210 30 210 0v-67" fill="#f2cea0" stroke="#775f48" stroke-width="2.5"/>
    <path d="M-104-10q25 17 51 0t52 0 52 0 53 0v-29h-208Z" fill="#fff9e9"/>
    <path d="M-104-10q25 17 51 0t52 0 52 0 53 0" fill="none" stroke="#dcc9a9" stroke-width="2"/>
    <ellipse cy="-39" rx="105" ry="40" fill="#fffaf0" stroke="#775f48" stroke-width="2.5"/>
    <ellipse cy="-39" rx="92" ry="31" fill="none" stroke="#e9ddc3" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>
    ${decorations.map((item, index) => {
      const [px, py] = spots[index % spots.length];
      return `<g class="cake-decoration" data-decoration-index="${index}">${typeof item === 'string' ? decoration(item, px, py, .85) : decoration(item.kind, item.x, item.y, .85)}</g>`;
    }).join('')}
    ${stolen ? '<path d="m74-59-9 17 16 4-6 14 25-2q15-21-7-33Z" fill="#e9d9ba"/><g transform="translate(87 -47) rotate(15)"><path d="M-28-15h56v27h-56z" fill="#f4cc79" stroke="#775f48" stroke-width="2"/><text y="3" text-anchor="middle" font-size="9" fill="#344e46" font-family="sans-serif">生日快乐</text><path d="M0 12v16" stroke="#775f48" stroke-width="2"/></g>' : ''}
    ${candles ? [-38, 0, 38].map((cx, index) => `<g transform="translate(${cx} ${index === 1 ? -61 : -48})"><rect x="-4" y="-41" width="8" height="43" rx="2" fill="${['#d59e93', '#8aaa94', '#d5b45d'][index]}" stroke="#6c7561" stroke-width="1.5"/><path d="m-3-34 6 5m-6 5 6 5m-6 5 6 5" stroke="#fff8e9" stroke-width="2"/><path d="M0-42v-5" stroke="#344e46" stroke-width="2"/>${lit ? '<path class="candle-flame" d="M0-68q-15 16-4 20 16 3 4-20Z" fill="#efbc56"/><path d="M0-58q-6 8 0 9 6-1 0-9Z" fill="#fff0af"/>' : '<path d="M0-48q-8-9 0-15t0-14" stroke="#b9b9a8" stroke-width="2" fill="none" class="candle-smoke"/>'}</g>`).join('') : ''}
  </g>`;
}

export function room(state) {
  const layers = roomLayers(state);
  return `<svg class="room-art" viewBox="0 0 900 610" role="img" aria-label="猫猫生日筹备室：左边是奶盖的纸箱，中间是蛋糕，右边是舞台" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="wall-lines" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M0 0v38" stroke="#dcd7c4" stroke-width="1" opacity=".35"/></pattern>
      <pattern id="floor-lines" width="180" height="48" patternUnits="userSpaceOnUse"><path d="M0 0h180M0 0v48m90-24v24" stroke="#b9a688" stroke-width="1.5" opacity=".4"/></pattern>
      <clipPath id="window-clip"><path d="M64 265V139a91 91 0 0 1 182 0v126Z"/></clipPath>
      <radialGradient id="lamp-glow"><stop stop-color="#ffe3a0" stop-opacity=".7"/><stop offset="1" stop-color="#ffe3a0" stop-opacity="0"/></radialGradient>
    </defs>
    <path d="M0 0h900v610H0Z" fill="#f2ecdd"/>
    <path d="M0 0h900v423H0Z" fill="url(#wall-lines)"/>
    <path d="M0 423h900v187H0Z" fill="#dbcaab"/>
    <path d="M0 423h900v187H0Z" fill="url(#floor-lines)"/>
    <path d="M0 414h900v13H0Z" fill="#afad8d" stroke="#7b8268" stroke-width="2"/>
    <g class="room-window"><path d="M56 270V139a99 99 0 0 1 198 0v131Z" fill="#fbf5e5" stroke="#7c8e78" stroke-width="3"/>
      <g clip-path="url(#window-clip)"><path data-window-sky d="M64 40h182v225H64Z" fill="#c5d5cb"/>
      <circle cx="194" cy="104" r="26" fill="#f7e7b2"/><path d="M57 230q53-47 101-8t100-17v80H57Z" fill="#9aafa0"/><path d="M46 253q56-35 94-7t115-10v40H46Z" fill="#afc0a5"/>
      </g>
      <path d="M155 49v217M64 166h182" stroke="#f7f1df" stroke-width="7"/>
      <path d="M48 268h214v12H48Z" fill="#e0cdb1" stroke="#7c8e78" stroke-width="2"/>
      <path d="M37 67q19 115-2 183l36 9q24-114-7-202Z" fill="#e6d2ad" stroke="#b4a58c" stroke-width="2"/>
    </g>
    <path d="M265 51q280 93 583-6" fill="none" stroke="#7a8770" stroke-width="2"/>
    ${[298, 360, 423, 488, 553, 618, 683, 748, 810].map((x, i) => `<path d="m${x} ${[63, 75, 84, 91, 93, 90, 81, 69, 55][i]} 14 30 14-24" fill="${['#a6b8a0', '#e0b375', '#d8a497'][i % 3]}" stroke="#7a8770" stroke-width="1.3"/>`).join('')}
    <g data-room-layer="lights">${layers.lights}</g>
    <g data-room-layer="banner">${layers.banner}</g>
    <g transform="translate(804 222)"><circle r="36" fill="#faf6e6" stroke="#74836a" stroke-width="3"/><path d="M0-25v3m25 3h-3m-22 44v-3m-25-22h3M0 0l-13-12M0 0l15-5" stroke="#74836a" stroke-width="3" stroke-linecap="round"/><circle r="3" fill="#74836a"/></g>
    <path d="M39 326h221v10H39Z" fill="#ab9679" stroke="#6c765d" stroke-width="2"/>
    <g transform="translate(84 318)"><path d="M-15 0-20-42H20L15 0Z" fill="#c68d70" stroke="#7f7056" stroke-width="2"/><path d="M0-40q-26-17-21-40 24 1 21 40m1 0q28-26 16-48-22 8-16 48m0-2q-4-39-16-50" fill="#809a76" stroke="#58735a" stroke-width="2"/></g>
    <g transform="translate(148 318)"><path d="M-16 0v-40h30V0Z" fill="#e6bb72" stroke="#7f7056" stroke-width="2"/><path d="M-11-26h20m-20 6h20m-20 6h15" stroke="#b08e5c" stroke-width="2"/></g>
    <path d="M192 285v32h29v-32Z" fill="#a9b8a0" stroke="#71816a" stroke-width="2"/><path d="M201 287v29m9-29v29" stroke="#e7e5cf" stroke-width="3"/>
    <g transform="translate(723 325)"><path d="m-52 39 105-3 7 31-113 3Z" fill="#c7b19a" stroke="#6c765d" stroke-width="2"/><path d="m-38 67-7 66m81-67 6 65" stroke="#6c765d" stroke-width="7"/></g>
    <g data-room-layer="chaircat">${layers.chaircat}</g>
    <g class="table-group"><ellipse cx="455" cy="522" rx="216" ry="32" fill="#9a947a" opacity=".15"/><path d="m304 407-13 129h20l29-129m245-2 25 131h20l-10-131" fill="#ae8e68" stroke="#6c765d" stroke-width="3"/>
      <path d="M275 363q179-47 361 0l20 59q-29 20-54 1-26 23-53 1-28 23-55 1-26 23-55 0-28 22-55-2-31 21-55-2-36 20-63-5Z" fill="#a7b6a0" stroke="#6c7c62" stroke-width="2.5"/>
      <path d="M284 367q178-38 345 0" fill="none" stroke="#dbe0ca" stroke-width="3"/>
      <g data-room-layer="cake">${layers.cake}</g>
    </g>
    <g data-room-layer="sleeper">${layers.sleeper}</g>
    <g data-room-layer="orange">${layers.orange}</g>
    <g data-room-layer="helper">${layers.helper}</g>
    <g data-room-layer="host">${layers.host}</g>
    <g transform="translate(814 451)"><path d="M-31 0h62l-7 72h-47Z" fill="#b7c4a6" stroke="#6c7c62" stroke-width="2"/><path d="M0 0q-38-28-36-62 38 8 36 62m1-4q39-28 30-65Q1-65 1-4m0-1q-20-51-5-81 21 31 5 81" fill="#8fa47a" stroke="#647c5d" stroke-width="2"/></g>
    <g transform="translate(753 531) rotate(8)"><path d="M-34-22h68v45h-68Z" fill="#dba9a1" stroke="#7f705f" stroke-width="2"/><path d="M-40-25h80v10h-80Z" fill="#e1b5a9" stroke="#7f705f" stroke-width="2"/><path d="M-5-25v48H5v-48" fill="#f3de9f"/><path d="M0-27q-30 0-22-14 11-12 22 14 14-28 25-12 5 12-25 12" fill="none" stroke="#b19559" stroke-width="3"/></g>
    <path d="m294 548 12-5m277 22 11 5m-345-18-6 9m294-16 5 9m240-7 9-6" stroke="#bf9673" stroke-width="4" stroke-linecap="round"/>
    <g data-room-layer="lighting" pointer-events="none">${layers.lighting}</g>
    <g data-room-layer="props">${layers.props}</g>
    <g data-room-layer="effects" pointer-events="none">${layers.effects}</g>
  </svg>`;
}

export function roomLayers(state, ui = {}) {
  const { tasks, entered, settings, decorations, stolen, celebrating, wished } = state;
  const stage = state.stage || {};
  const awake = tasks.wake;
  const stageVisible = stage.straight || stage.lightsOn || tasks.stage || celebrating || ui.task === 'stage';
  const angle = ui.bannerAngle ?? (stage.straight || celebrating ? 0 : 9);
  const banner = stageVisible ? settings.banner : '猫猫生日筹备中';
  const dark = stageVisible && settings.light !== 'warm';
  const active = (action, label) => `data-scene-action="${action}" role="button" tabindex="0" aria-label="${label}"`;
  const group = (x, y, content, attributes = '') => `<g transform="translate(${x} ${y})" ${attributes}>${content}</g>`;
  const text = (x, y, content, size = 12, fill = '#657a57') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="sans-serif" font-size="${size}" fill="${fill}">${content}</text>`;
  return {
    lights: `<g ${ui.task === 'stage' ? active('lights', '点灯串切换灯光') : ''}><path d="M303 82q253 64 513-8" stroke="#667e64" stroke-width="2" fill="none"/>${[329, 390, 451, 512, 573, 634, 695, 756, 808].map((x, i) => `<g transform="translate(${x} ${[89, 102, 112, 116, 116, 111, 102, 89, 76][i]})">${stageVisible ? '<circle r="22" fill="url(#lamp-glow)"/>' : ''}<path d="M0 0v9" stroke="#7c8c6c" stroke-width="2"/><ellipse cy="12" rx="6" ry="9" fill="${stageVisible ? ['#f6d483', '#bcd0ad', '#edb8aa'][i % 3] : '#dbd7bd'}" stroke="#8b9576" stroke-width="1.5"/></g>`).join('')}<path d="M310 70h515v65H310Z" fill="transparent"/></g>`,
    banner: `<g transform="rotate(${angle} 525 153)" ${ui.task === 'stage' ? `data-drag="banner" ${active('straighten', '扶正横幅')}` : ''}><path d="m313 117 418-5 7 72-420 4Z" fill="#faf4de" stroke="#79846c" stroke-width="2"/><path d="m329 109 28 4-3 15-28-3Zm365-8 29 3-1 16-29-3Z" fill="#c6cab1"/><text x="525" y="157" text-anchor="middle" dominant-baseline="middle" fill="#4e6653" font-size="29" font-weight="700" letter-spacing="5" font-family="sans-serif">${escapeText(banner)}</text>${ui.task === 'stage' && !stage.straight ? '<circle cx="724" cy="150" r="17" fill="#f1ce8c" stroke="#b7975d" stroke-width="2"/><path d="m719 143 8 7-8 7" stroke="#8f794e" stroke-width="2" fill="none"/>' : ''}</g>`,
    chaircat: cat('black', { x: 724, y: 284, scale: .81, happy: celebrating, bow: state.bow }),
    cake: cake({ x: 455, y: 346, scale: .87, decorations, stolen, candles: celebrating || tasks.cake, lit: !wished }),
    sleeper: `<g class="sleeping-station"><path d="m58 431 170-9 11 102-171 2Z" fill="#d0ae7c" stroke="#7e765b" stroke-width="2.5"/>${!awake ? `<g class="milk-pose ${ui.pose || ''}">${cat('white', { x: 146, y: 402, scale: .84, sleeping: true })}</g>` : '<path d="m103 453 27-14m15 12 22-13m13 11 17-14" stroke="#b89e76" stroke-width="2"/>'}<path d="m61 463 169-8 9 69-171 2Z" fill="#d8bb8d" stroke="#7e765b" stroke-width="2.5"/><path d="m61 463-24-24 174-11 19 27m0 0 27-23-8 64-13 16" fill="#e1c699" stroke="#7e765b" stroke-width="2"/><g transform="translate(111 484) rotate(-3)"><path d="M-5-8h108v33H-5Z" fill="#f4e7c7"/>${text(47, 13, awake ? '已上班，勿找' : '内有一只困猫', 13)}</g>${ui.task === 'wake' && !awake ? `<path ${active(ui.snackOpen ? 'feed' : 'poke', ui.snackOpen ? '把猫条送到奶盖鼻子前' : '轻敲奶盖的纸箱')} d="M65 345h177v162H65Z" fill="transparent"/>` : ''}</g>`,
    host: awake ? group(ui.waking ? 146 : 745, ui.waking ? 380 : 450, cat('white', { scale: .84, happy: celebrating, bow: true }), 'data-host-motion') : '',
    orange: ui.task === 'cake' ? '' : group(tasks.cake ? 300 : 447, 488, cat('orange', { scale: .77, happy: celebrating })),
    helper: group(659, 443, `<g class="flower-pose ${ui.recoil ? 'cannon-recoil' : ''}">${cat('calico', { scale: .79, happy: celebrating })}<g transform="translate(30 36) rotate(-28)"><path d="m-17 34 3-66 30 2 2 64Z" fill="#dbad66" stroke="#6c765d" stroke-width="2.5"/><path d="m-14-20 29 19m-31 0 32 19" stroke="#f3dfb0" stroke-width="5"/><ellipse cy="-33" rx="15" ry="6" fill="#787f64"/></g></g>`),
    lighting: `${dark ? '<path d="M0 0h900v610H0Z" fill="#153a4a" opacity=".31"/>' : ''}${stageVisible ? settings.light === 'warm' ? '<ellipse cx="520" cy="250" rx="330" ry="290" fill="url(#lamp-glow)" opacity=".3"/>' : settings.light === 'starry' ? Array.from({ length: 26 }, (_, i) => `<g transform="translate(${280 + (i * 91) % 570} ${40 + (i * 67) % 360})" fill="#f8e7ac" class="room-party-sparkles"><path d="M0-5 2-1 6 0 2 2 0 6-2 2-6 0-2-1Z"/></g>`).join('') : '<g class="disco-lights" opacity=".3"><path d="m360 90-140 520h400Z" fill="#e9c67d"/><path d="m750 90-300 520h440Z" fill="#e2afcf"/></g>' : ''}${ui.task === 'wish' && !wished ? '<path d="M0 0h900v610H0Z" fill="#172d38" opacity=".4"/><circle cx="455" cy="282" r="120" fill="url(#lamp-glow)"/>' : ''}`,
    props: `${ui.task === 'wake' && !awake ? wakeProps(ui, active, text) : ''}${ui.stealing ? `<g class="sneak-arm" ${active('catch', '拦住橘总偷吃')}><path d="M582 433q-8-77-60-112-25-20-37-3-9 17 16 28 28 25 31 87" fill="#dda06b" stroke="#344e46" stroke-width="3"/><path d="m539 384 22-11m-16 28 22-9" stroke="#bd784b" stroke-width="5"/><path d="M585 433q-8-77-60-112" stroke="transparent" stroke-width="45" fill="none"/><circle cx="508" cy="327" r="24" fill="transparent"/></g>` : ''}${ui.task === 'cake' ? `<ellipse data-cake-surface ${active('place', '把选好的装饰放到蛋糕上')} cx="455" cy="312" rx="84" ry="32" fill="transparent"/>${ui.selected ? '<ellipse cx="455" cy="312" rx="87" ry="34" fill="none" stroke="#caab61" stroke-width="1.5" stroke-dasharray="4 5" pointer-events="none"/>' : ''}` : ''}${ui.task === 'stage' ? `<g data-drag="rope" ${active('test-cannon', '向下拉礼炮绳')}><path d="M690 503q-5 20 0 ${38 + (ui.pull || 0)}" stroke="#9b845a" stroke-width="3" fill="none"/><circle cx="690" cy="${548 + (ui.pull || 0)}" r="12" fill="#f4d49b" stroke="#9b845a" stroke-width="2"/>${text(690, 580 + (ui.pull || 0), stage.tested ? '还可以再拉！' : '↓ 向下拉', 11)}<path d="M665 508h50v83h-50Z" fill="transparent"/></g>` : ''}${ui.fumble ? group(ui.fumble.x, ui.fumble.y, decoration(ui.fumble.kind, 0, 0, .7), 'class="fumbled-decoration"') : ''}`,
    effects: `${!entered ? '<g transform="translate(340 258) rotate(-5)"><path d="M-12-32h217v59H24L7 45l1-18h-20Z" fill="#fffcf1" stroke="#8b927a" stroke-width="1.7"/><text x="98" y="-7" text-anchor="middle" fill="#52634f" font-size="16" font-family="sans-serif">“蛋糕怎么少了一口？”</text><text x="98" y="15" text-anchor="middle" fill="#9a9c84" font-size="11" font-family="sans-serif">—— 来自一场紧急会议</text></g>' : ''}${ui.caught ? group(521, 315, decoration('star', 0, 0, 1.1), 'class="swat-star"') : ''}${celebrating ? '<g class="room-party-sparkles" fill="#e0b766"><path d="m290 230 4 10 10 4-10 4-4 10-4-10-10-4 10-4Zm379-15 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/></g>' : ''}`,
  };
}

function wakeProps(ui, active, text) {
  const alarm = ui.pose === 'alarm' ? '<g transform="translate(244 429)"><g class="alarm-ringing"><circle r="23" fill="#e7b976" stroke="#586d53" stroke-width="2"/><circle r="17" fill="#fff8e0" stroke="#586d53"/><path d="M0-10V0l7 4m-18 15-4 7m26-7 4 7M-18-16l-8-6m44 6 8-6" stroke="#586d53" stroke-width="2" fill="none"/></g></g><path class="snooze-arm" d="m169 427q36 26 75 7" fill="none" stroke="#344e46" stroke-width="14" stroke-linecap="round"/><path class="snooze-arm" d="m169 427q36 26 75 7" fill="none" stroke="#fffaf0" stroke-width="10" stroke-linecap="round"/>' : '';
  const script = ui.pose === 'script' ? '<g transform="translate(237 429) rotate(8)"><path d="M-25-38h50v76h-50Z" fill="#faf0cd" stroke="#8b9672" stroke-width="2"/><path d="M-16-20h32m-32 11h30m-30 11h26m-26 11h32m-32 11h22" stroke="#b5b797" stroke-width="2"/></g><path d="M153 440v-33" stroke="#344e46" stroke-width="14" stroke-linecap="round"/><path d="M153 440v-33" stroke="#fffaf0" stroke-width="10" stroke-linecap="round"/>' : '';
  const target = ui.snackOpen ? `<g ${active('feed', '送猫条给奶盖')}><circle cx="146" cy="413" r="27" fill="#efcc7a" fill-opacity=".18" stroke="#bca260" stroke-width="1.5" stroke-dasharray="3 4"/>${text(146, 331, '把猫条送到鼻子前', 12)}<circle cx="146" cy="413" r="36" fill="transparent"/></g>` : '';
  return alarm + script + target;
}
