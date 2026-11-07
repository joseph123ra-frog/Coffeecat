(() => {
  'use strict';

  const app = document.getElementById('app');
  const config = window.BALANCE_CONFIG || {};
  const questions = window.BALANCE_QUESTIONS || [];
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const index = Math.floor((Date.parse(`${date}T00:00:00+09:00`) - Date.parse('2026-11-08T00:00:00+09:00')) / 86400000);
  const question = questions[((index % questions.length) + questions.length) % questions.length];
  const storageKey = `kkaphwi-balance:${date}`;
  let selected = localStorage.getItem(storageKey);
  let counts = { A: 0, B: 0 };
  let refreshTimer;

  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function voterId() {
    const key = 'kkaphwi-voter';
    let value = localStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      localStorage.setItem(key, value);
    }
    return value;
  }

  async function voterHash() {
    const bytes = new TextEncoder().encode(`${date}:${voterId()}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function rpc(name, body) {
    const headers = {
      apikey: config.supabaseAnonKey,
      'Content-Type': 'application/json'
    };
    // 기존 JWT형 anon 키만 Authorization에 넣는다. 새 sb_publishable 키는 apikey로만 보낸다.
    if (!config.supabaseAnonKey.startsWith('sb_publishable_')) {
      headers.Authorization = `Bearer ${config.supabaseAnonKey}`;
    }
    const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`집계 오류 ${response.status}`);
    return response.json();
  }

  function normalize(rows) {
    const next = { A: 0, B: 0 };
    for (const row of rows || []) if (row.choice === 'A' || row.choice === 'B') next[row.choice] = Number(row.total) || 0;
    return next;
  }

  async function loadResults() {
    counts = normalize(await rpc('get_balance_results', { p_vote_date: date }));
    paintResults();
  }

  async function vote(choice) {
    if (!ready || selected) return;
    setStatus('투표를 저장하는 중…');
    document.querySelectorAll('.choice').forEach(node => { node.disabled = true; });
    try {
      const result = await rpc('cast_balance_vote', {
        p_vote_date: date,
        p_choice: choice,
        p_voter_hash: await voterHash()
      });
      selected = result.choice || choice;
      localStorage.setItem(storageKey, selected);
      counts = { A: Number(result.a_count) || 0, B: Number(result.b_count) || 0 };
      paintResults();
    } catch {
      setStatus('투표를 저장하지 못했습니다. 잠시 뒤 다시 눌러 주세요.');
      document.querySelectorAll('.choice').forEach(node => { node.disabled = false; });
    }
  }

  function percentage(choice) {
    const total = counts.A + counts.B;
    return total ? Math.round(counts[choice] / total * 100) : 0;
  }

  function setStatus(text) {
    const node = document.querySelector('.status');
    if (node) node.textContent = text;
  }

  function paintResults() {
    const total = counts.A + counts.B;
    document.querySelectorAll('.choice').forEach(node => {
      const choice = node.dataset.choice;
      const percent = percentage(choice);
      node.disabled = Boolean(selected) || !ready;
      node.classList.toggle('mine', selected === choice);
      node.querySelector('.fill').style.width = selected ? `${percent}%` : '0';
      node.querySelector('.percent').textContent = selected ? `${percent}%` : '';
    });
    if (!ready) setStatus('실시간 투표 집계를 연결하는 중입니다.');
    else if (selected) setStatus(`${total.toLocaleString('ko-KR')}명 참여 · 결과는 5초마다 갱신됩니다.`);
    else setStatus(total ? `지금까지 ${total.toLocaleString('ko-KR')}명 참여` : '첫 번째로 골라 주세요.');
  }

  async function share() {
    const text = `오늘의 깝휘캣 밸런스\n${question[0]} vs ${question[1]}`;
    try {
      if (navigator.share) await navigator.share({ title: '깝휘캣 밸런스', text, url: location.href });
      else {
        await navigator.clipboard.writeText(`${text}\n${location.href}`);
        setStatus('링크를 복사했습니다.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setStatus('주소창의 링크를 복사해 주세요.');
    }
  }

  function render() {
    const month = Number(date.slice(5, 7));
    const day = Number(date.slice(8, 10));
    app.replaceChildren(
      el('p', 'date', `${month}월 ${day}일 · 오늘의 선택`),
      el('h1', '', '하나만 골라야 한다면?'),
      el('p', 'hint', '투표하면 모두의 선택을 바로 볼 수 있어요.')
    );
    const choices = el('section', 'choices');
    ['A', 'B'].forEach((choice, i) => {
      const button = el('button', `choice choice-${choice.toLowerCase()}`);
      button.type = 'button';
      button.dataset.choice = choice;
      button.addEventListener('click', () => vote(choice));
      const fill = el('span', 'fill');
      const inner = el('span', 'choice-inner');
      inner.append(el('span', 'letter', choice), el('span', 'choice-text', question[i]), el('span', 'percent'));
      button.append(fill, inner);
      choices.append(button);
    });
    const status = el('p', 'status');
    status.setAttribute('role', 'status');
    const shareButton = el('button', 'share', '친구에게 보내기');
    shareButton.type = 'button';
    shareButton.addEventListener('click', share);
    app.append(choices, status, shareButton);
    paintResults();
  }

  if (!question) {
    app.replaceChildren(el('p', 'notice', '오늘의 질문을 불러오지 못했습니다.'));
    return;
  }

  render();
  if (ready) {
    loadResults().catch(() => setStatus('실시간 결과를 불러오지 못했습니다.'));
    refreshTimer = setInterval(() => loadResults().catch(() => {}), 5000);
    window.addEventListener('pagehide', () => clearInterval(refreshTimer), { once: true });
  }
})();
