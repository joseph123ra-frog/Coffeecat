(() => {
  'use strict';
  const app = document.getElementById('app');
  const today = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const LIMIT = 5;
  let c, state, selected = null, clock, renderId = 0;
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (text, cls, action) => {
    const node = el('button', cls, text);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  };
  const hasFinal = name => (name.charCodeAt(name.length - 1) - 0xac00) % 28 > 0;
  const subject = name => name + (hasFinal(name) ? '이' : '가');
  const was = name => name + (hasFinal(name) ? '이었다냥' : '였다냥');
  const dateLabel = date => `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일`;
  const number = () => String(c.no).padStart(3, '0');

  function catSVG(fur) {
    const colors = { 주황: '#E8A15A', 검정: '#2B2725', 흰색: '#F4F1EC', 회색: '#9A958F', 삼색: '#F4F1EC', 고등어: '#9B8B79', 턱시도: '#2B2725', 갈색: '#8A6142' };
    const dark = fur === '검정' || fur === '턱시도';
    const pattern = fur === '삼색'
      ? '<path d="M22 49Q20 25 43 35L45 62Z" fill="#E8A15A"/><path d="M60 34Q83 29 82 55L62 60Z" fill="#2B2725"/>'
      : fur === '고등어' ? '<path d="M40 34L43 48M50 32V47M60 34L57 48M21 59L33 62M79 59L67 62" stroke="#51473D" stroke-width="4" stroke-linecap="round"/>'
      : fur === '턱시도' ? '<ellipse cx="50" cy="72" rx="23" ry="16" fill="#F4F1EC"/>' : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M20 45L21 12L42 30Q50 27 58 30L79 12L80 45Q91 62 79 79Q69 91 50 91Q31 91 21 79Q9 62 20 45Z" fill="${colors[fur] || colors.회색}" stroke="${dark ? '#B5AEA6' : '#66513F'}" stroke-width="2.5"/><path d="M26 24L27 39L37 32M74 24L73 39L63 32" fill="#DB9B98"/>${pattern}<path d="M31 57Q35 51 39 57M61 57Q65 51 69 57" fill="none" stroke="${dark ? '#E8C07D' : '#28221E'}" stroke-width="4" stroke-linecap="round"/><path d="M45 66H55L50 72Z" fill="#CB837E"/><path d="M50 72Q46 80 41 74M50 72Q54 80 59 74M29 69L12 66M29 75L13 79M71 69L88 66M71 75L87 79" fill="none" stroke="${dark && fur !== '턱시도' ? '#B5AEA6' : '#51473D'}" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  function face(fur) {
    // SVG에는 위의 고정된 색상과 도형만 사용한다.
    return new DOMParser().parseFromString(catSVG(fur), 'image/svg+xml').documentElement;
  }
  function decode() {
    const bytes = Uint8Array.from(atob(c.answer), ch => ch.charCodeAt(0));
    const key = new TextEncoder().encode(`kkaphwi-${c.date}`);
    const answer = JSON.parse(new TextDecoder().decode(bytes.map((b, i) => b ^ key[i % key.length])));
    if (!c.suspects.some(s => s.id === answer.culprit) || typeof answer.solution !== 'string' || typeof answer.culpritLine !== 'string') throw new Error('정답 형식 오류');
    return answer;
  }
  function save() {
    try { localStorage.setItem(`kd:${c.no}`, JSON.stringify(state)); } catch { /* 저장 불가 환경에서도 계속 진행한다. */ }
  }
  function restore() {
    const fresh = { stage: 'intro', picked: [], accused: null };
    try {
      const saved = JSON.parse(localStorage.getItem(`kd:${c.no}`));
      if (!saved || !['intro', 'investigate', 'accuse', 'result'].includes(saved.stage)) return fresh;
      const picked = [...new Set(Array.isArray(saved.picked) ? saved.picked : [])].filter(id => c.clues.some(clue => clue.id === id)).slice(0, LIMIT);
      const accused = c.suspects.some(s => s.id === saved.accused) ? saved.accused : null;
      return { stage: accused ? 'result' : saved.stage === 'result' ? 'intro' : saved.stage, picked, accused };
    } catch { return fresh; }
  }
  function go(stage) {
    state.stage = stage;
    save();
    render();
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }
  function suspect(s, interactive = false) {
    const card = interactive ? button('', 'suspect', () => { selected = s.id; render(); }) : el('div', 'suspect');
    card.append(face(s.fur), el('div', 'name', s.name), el('div', 'desc', s.desc));
    if (interactive) {
      card.classList.toggle('selected', selected === s.id);
      card.setAttribute('aria-pressed', String(selected === s.id));
      card.setAttribute('aria-label', s.name);
    }
    return card;
  }
  function heading() {
    app.append(el('p', 'meta', `사건 #${number()} · ${dateLabel(c.date)}`), el('h1', '', c.title));
    if (c.date !== today()) app.append(el('p', 'notice compact', `${dateLabel(c.date)} 사건이다냥. 오늘 사건은 준비 중이다냥.`));
  }
  function investigate() {
    const mini = el('div', 'mini-suspects');
    for (const s of c.suspects) { const chip = el('span'); chip.append(face(s.fur), document.createTextNode(s.name)); mini.append(chip); }
    const left = LIMIT - state.picked.length;
    const counter = el('div', 'counter');
    counter.setAttribute('aria-live', 'polite');
    counter.append(el('span', '', '남은 조사'), el('span', 'left', `${left} / ${LIMIT}`));
    app.append(mini, counter, el('p', 'paws', '🐾'.repeat(left) || '조사를 모두 마쳤다냥'));
    app.append(el('p', 'warn', '조사는 5번뿐이다냥. 단서를 신중하게 골라라냥.'));
    for (const clue of c.clues) {
      const open = state.picked.includes(clue.id);
      const row = el('div', `clue${open ? ' open' : ''}`);
      const toggle = button(`${clue.label} ${open ? '✓' : '+'}`, '', () => {
        if (state.picked.includes(clue.id) || state.picked.length >= LIMIT) return;
        state.picked.push(clue.id);
        save();
        render();
        app.querySelector(`[data-clue="${clue.id}"] button`)?.focus({ preventScroll: true });
      });
      row.dataset.clue = clue.id;
      toggle.disabled = !open && left === 0;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-controls', clue.id);
      row.append(toggle);
      if (open) { const text = el('div', 'text', clue.text); text.id = clue.id; row.append(text); }
      app.append(row);
    }
    const sticky = el('div', 'sticky');
    sticky.append(button('범인 지목하기', 'btn primary', () => go('accuse')));
    app.append(sticky);
  }
  function accuse() {
    app.append(el('p', 'intro', '범인이라고 생각하는 고양이를 골라라냥'));
    const grid = el('div', 'suspects');
    c.suspects.forEach(s => grid.append(suspect(s, true)));
    const chosen = c.suspects.find(s => s.id === selected);
    const confirm = button(chosen ? `${subject(chosen.name)} 범인이다냥!` : '고양이를 먼저 골라라냥', 'btn primary', () => {
      if (state.accused || !chosen) return;
      state.accused = chosen.id;
      go('result');
    });
    confirm.disabled = !chosen;
    app.append(grid, confirm, el('p', 'warn', '기회는 한 번뿐이다냥'));
    if (state.picked.length < LIMIT) app.append(button('다시 조사하기', 'btn ghost', () => go('investigate')));
  }
  function countdown(node) {
    const update = () => {
      const seconds = Math.max(0, Math.ceil((Date.parse(`${today()}T00:00:00+09:00`) + 86400e3 - Date.now()) / 1000));
      if (c.date !== today()) {
        node.replaceChildren(button('오늘 사건 열기', 'btn primary', () => location.reload()));
        return;
      }
      const stamp = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
      node.replaceChildren(document.createTextNode('다음 사건까지 '), el('b', '', stamp));
    };
    update(); clock = setInterval(update, 1000);
  }
  function result(id) {
    const answer = decode();
    const culprit = c.suspects.find(s => s.id === answer.culprit);
    const correct = state.accused === answer.culprit;
    const verdict = el('div', `verdict${correct ? '' : ' wrong'}`);
    verdict.append(el('div', 'big', correct ? '사건 해결!' : '아쉽다냥…'), face(culprit.fur), el('h2', '', correct ? `범인은 ${was(culprit.name)}` : `진짜 범인은 ${culprit.name}`));
    if (!correct) verdict.append(el('p', '', `내가 고른 고양이: ${c.suspects.find(s => s.id === state.accused).name}`));
    app.append(verdict, el('p', 'confess', answer.culpritLine), el('h2', '', '해설'), el('p', 'solution', answer.solution));
    if (correct) {
      const cardArea = el('section', 'result-card');
      cardArea.append(el('p', 'notice', '결과 카드를 그리는 중이다냥…'));
      app.append(cardArea);
      makeCard(culprit).then(blob => {
        if (id !== renderId) return;
        const url = URL.createObjectURL(blob);
        const img = el('img', 'card-img'); img.src = url; img.alt = `사건 #${number()} ${c.title} 해결 결과 카드`; img.width = 1080; img.height = 1920;
        cardArea.replaceChildren(img, el('p', 'warn', '이미지를 길게 눌러 저장하라냥'));
        const file = new File([blob], `kkaphwi-${c.date}.png`, { type: 'image/png' });
        let canShare = false;
        try { canShare = Boolean(navigator.canShare?.({ files: [file] })); } catch { /* 저장 버튼으로 진행한다. */ }
        if (canShare) cardArea.append(button('스토리에 공유하기', 'btn primary', async () => {
          try { await navigator.share({ files: [file] }); }
          catch (error) { if (error.name !== 'AbortError') cardArea.append(el('p', 'warn', '공유가 안 되면 이미지를 길게 눌러 저장하라냥.')); }
        }));
        const download = el('a', 'btn ghost', '이미지 저장'); download.href = url; download.download = file.name; cardArea.append(download);
      }).catch(() => { if (id === renderId) cardArea.replaceChildren(el('p', 'notice', '카드를 그리지 못했다냥. 새로고침하면 다시 그린다냥.')); });
    }
    const next = el('div', 'next'); app.append(next); countdown(next);
    const follow = el('a', 'btn ghost', '깝휘캣 인스타 팔로우'); follow.href = 'https://www.instagram.com/kkaphwi.cat/'; follow.target = '_blank'; follow.rel = 'noopener'; app.append(follow);
  }
  function wrap(ctx, text, maxWidth) {
    const lines = []; let line = '';
    for (const ch of text) {
      if (ch === '\n' || (line && ctx.measureText(line + ch).width > maxWidth)) { lines.push(line); line = ch === '\n' ? '' : ch; }
      else line += ch;
    }
    if (line) lines.push(line);
    return lines;
  }
  async function makeCard(culprit) {
    await Promise.all([400, 700, 900].map(weight => document.fonts.load(`${weight} 80px "Noto Sans KR"`)));
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#151413'; ctx.fillRect(0, 0, 1080, 1920);
    ctx.strokeStyle = '#E8C07D'; ctx.lineWidth = 4; ctx.strokeRect(42, 42, 996, 1836);
    ctx.textAlign = 'center';
    const text = (value, y, size, weight = 900, color = '#E8C07D') => { ctx.font = `${weight} ${size}px "Noto Sans KR", sans-serif`; ctx.fillStyle = color; ctx.fillText(value, 540, y); };
    text('깝휘캣', 210, 90); text('탐정', 280, 42, 700);
    text(`사건 #${number()}`, 405, 38, 700);
    let size = 64, lines;
    do { ctx.font = `900 ${size}px "Noto Sans KR"`; lines = wrap(ctx, c.title, 850); if (lines.length <= 3) break; size -= 4; } while (size > 20);
    lines.forEach((line, i) => text(line, 500 + i * (size + 16), size, 900, '#FFFFFF'));
    text('해결!', 820, 158);
    const image = new Image();
    const svgURL = URL.createObjectURL(new Blob([catSVG(culprit.fur)], { type: 'image/svg+xml' }));
    try { image.src = svgURL; await image.decode(); ctx.drawImage(image, 340, 900, 400, 400); }
    finally { URL.revokeObjectURL(svgURL); }
    text(`범인은 ${was(culprit.name)}`, 1410, 54, 900, '#FFFFFF');
    text(`조사 ${state.picked.length}번 만에 해결`, 1510, 40, 700);
    text(c.date, 1580, 34, 400, '#B5AEA6');
    text('@kkaphwi.cat', 1730, 44, 700);
    text('joseph123ra-frog.github.io/kkaphwi-detective/', 1800, 26, 400, '#B5AEA6');
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('카드 저장 오류')), 'image/png'));
  }
  function render() {
    clearInterval(clock); const id = ++renderId;
    app.replaceChildren(); heading();
    if (state.stage === 'intro') {
      app.append(el('p', 'intro', c.intro), el('h2', '', '용의자'));
      const grid = el('div', 'suspects'); c.suspects.forEach(s => grid.append(suspect(s))); app.append(grid);
      app.append(button('조사 시작', 'btn primary', () => go('investigate')));
    } else if (state.stage === 'investigate') investigate();
    else if (state.stage === 'accuse') accuse();
    else result(id);
  }
  async function load(path) {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error('파일 없음');
    const value = await response.json();
    if (!Number.isInteger(value.no) || !/^\d{4}-\d{2}-\d{2}$/.test(value.date) || value.date > today() || typeof value.title !== 'string' || typeof value.intro !== 'string' || value.suspects?.length !== 4 || value.clues?.length !== 7 || typeof value.answer !== 'string') throw new Error('사건 형식 오류');
    if (value.suspects.map(s => s.id).sort().join('') !== 'ABCD' || new Set(value.clues.map(clue => clue.id)).size !== 7 || !value.clues.every(clue => /^c[1-7]$/.test(clue.id) && typeof clue.text === 'string' && typeof clue.label === 'string')) throw new Error('단서 형식 오류');
    c = value; decode(); return value;
  }
  app.tabIndex = -1;
  (async () => {
    try { await load(`cases/${today()}.json`); }
    catch { try { await load('cases/latest.json'); } catch { app.replaceChildren(el('p', 'notice', '사건 파일을 찾지 못했다냥. 잠시 후 다시 와 달라냥')); return; } }
    state = restore(); render();
  })();
})();
