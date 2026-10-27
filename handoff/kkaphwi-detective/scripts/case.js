// 사건의 형식(zod 스키마), 논리 검사, 공개용 변환.

import { z } from 'zod';
import { SUSPECTS, CLUES, PICKS, FUR } from './config.js';

export const IDS = ['A', 'B', 'C', 'D'];

export const Case = z.object({
  // 필드 순서대로 생성되므로 설계를 맨 앞에 둔다.
  plan: z.string().describe('먼저 설계: 범인, 범행 방법, 각 무고한 용의자가 어떤 단서로 빠지는지, 헷갈리게 하는 단서가 무엇인지. 5문장 이내'),
  title: z.string().describe('사건 이름. "~ 사건"으로 끝남. 15자 이내'),
  intro: z.string().describe('사건 소개. 언제, 어디서, 무엇이 사라졌거나 벌어졌는지. 3문장 이내, 150자 이내'),
  suspects: z
    .array(
      z.object({
        id: z.enum(IDS),
        name: z.string().describe('고양이 이름. 2~3글자'),
        fur: z.enum(FUR).describe('털 색'),
        desc: z.string().describe('한 줄 소개. 25자 이내'),
      }),
    )
    .describe(`정확히 ${SUSPECTS}마리. id는 A, B, C, D를 하나씩`),
  clues: z
    .array(
      z.object({
        label: z.string().describe('조사 버튼 이름. 예: "찬장 살펴보기", "치즈 심문". 12자 이내'),
        text: z.string().describe('조사하면 보이는 내용. 대사는 따옴표. 130자 이내'),
        eliminates: z.array(z.enum(IDS)).describe('이 단서만으로 확실히 범인이 아니라고 말할 수 있는 용의자 id. 없으면 빈 배열'),
        pointsTo: z.array(z.enum(IDS)).describe('이 단서가 의심스럽게 보이게 하는 용의자 id. 없으면 빈 배열'),
      }),
    )
    .describe(`정확히 ${CLUES}개`),
  culprit: z.enum(IDS),
  culpritLine: z.string().describe('들킨 범인의 귀여운 자백 한마디. 40자 이내'),
  solution: z.string().describe('정답 해설. 무고한 용의자마다 어떤 단서로 빠지는지, 헷갈리는 단서는 왜 아닌지, 범인을 가리키는 단서. 250자 이내'),
});

// 단서 집합 중 무고한 용의자를 모두 빼 주는 가장 작은 조합을 찾는다. 없으면 null.
export function minimalCover(c) {
  const innocents = IDS.filter((id) => id !== c.culprit);
  const n = c.clues.length;
  let best = null;
  for (let mask = 1; mask < 1 << n; mask++) {
    const picked = [...Array(n).keys()].filter((i) => mask & (1 << i));
    if (best && picked.length >= best.length) continue;
    const out = new Set(picked.flatMap((i) => c.clues[i].eliminates));
    if (innocents.every((id) => out.has(id))) best = picked;
  }
  return best;
}

// 코드로 확인할 수 있는 규칙을 검사한다. 문제 목록을 돌려준다 (비어 있으면 통과).
export function checkCase(c) {
  const errors = [];
  const ids = c.suspects.map((s) => s.id).sort().join('');
  if (c.suspects.length !== SUSPECTS || ids !== IDS.join('')) errors.push(`용의자는 A~D ${SUSPECTS}마리여야 함 (${ids})`);
  if (new Set(c.suspects.map((s) => s.name)).size !== c.suspects.length) errors.push('용의자 이름이 겹침');
  if (c.clues.length !== CLUES) errors.push(`단서는 ${CLUES}개여야 함 (${c.clues.length}개)`);
  if (!IDS.includes(c.culprit)) errors.push('범인 id가 잘못됨');
  c.clues.forEach((clue, i) => {
    if (clue.eliminates.includes(c.culprit)) errors.push(`단서 ${i + 1}이 범인을 제외함`);
  });
  for (const id of IDS.filter((id) => id !== c.culprit)) {
    if (!c.clues.some((clue) => clue.eliminates.includes(id))) errors.push(`용의자 ${id}를 제외하는 단서가 없음`);
  }
  if (!c.clues.some((clue) => clue.pointsTo.includes(c.culprit))) errors.push('범인을 가리키는 단서가 없음');
  if (!c.clues.some((clue) => clue.pointsTo.some((id) => id !== c.culprit))) errors.push('헷갈리게 하는 단서가 없음');
  const cover = errors.length ? null : minimalCover(c);
  if (!errors.length) {
    if (!cover) errors.push('단서로 범인을 좁힐 수 없음');
    else if (cover.length > PICKS) errors.push(`범인을 가리는 데 단서 ${cover.length}개가 필요함 (최대 ${PICKS}개)`);
    else if (cover.length < 2) errors.push('단서 하나로 풀리는 너무 쉬운 사건');
  }
  return { errors, cover };
}

// 플레이어가 보는 사건 설명. 정답과 단서의 제외 정보는 넣지 않는다.
export function playerText(c, clueIdx = c.clues.map((_, i) => i)) {
  const suspects = c.suspects.map((s) => `- ${s.id}. ${s.name} (${s.fur}): ${s.desc}`).join('\n');
  const clues = clueIdx.map((i) => `- ${c.clues[i].label}: ${c.clues[i].text}`).join('\n');
  return `# ${c.title}\n${c.intro}\n\n## 용의자\n${suspects}\n\n## 조사 결과\n${clues}`;
}

// 정답은 공개 파일에 그대로 두지 않고 날짜를 열쇠로 뒤섞는다 (파일만 열어서는 바로 안 보이게).
export function scramble(obj, key) {
  const data = Buffer.from(JSON.stringify(obj), 'utf8');
  const k = Buffer.from(key, 'utf8');
  return Buffer.from(data.map((b, i) => b ^ k[i % k.length])).toString('base64');
}

// 사이트가 읽는 공개 파일. 단서 순서는 섞는다.
export function toPublic(c, { no, date }) {
  const order = c.clues.map((_, i) => i).sort(() => Math.random() - 0.5);
  return {
    no,
    date,
    title: c.title,
    intro: c.intro,
    suspects: c.suspects.map(({ id, name, fur, desc }) => ({ id, name, fur, desc })),
    clues: order.map((i, n) => ({ id: `c${n + 1}`, label: c.clues[i].label, text: c.clues[i].text })),
    answer: scramble({ culprit: c.culprit, culpritLine: c.culpritLine, solution: c.solution }, `kkaphwi-${date}`),
  };
}
