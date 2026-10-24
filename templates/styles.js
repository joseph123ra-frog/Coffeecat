// 디자인 스타일. 공통 마크업(slide.js)에 입히는 CSS만 다르다.
// photo: 사진이 화면 전체를 채우고 글을 사진 위에 얹는다.
// split: 본문 장을 위 사진 70% / 아래 흰 공간 30%로 나눈다. 표지·시그니처는 photo와 같다.

const GOLD = '#E8C07D';
const INK = '#151413';

const base = `
.slide{background:${INK};color:#fff}
.mast{position:absolute;left:64px;right:64px;top:56px;display:flex;justify-content:space-between;font-size:24px;z-index:3;letter-spacing:.06em}
.brand{font-weight:900;font-size:30px}
.media{position:absolute;inset:0}
.media::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 40%,rgba(0,0,0,.88) 78%)}
.ph{background:radial-gradient(circle at 30% 30%,#7C6A58,#3B332C 70%);color:rgba(255,255,255,.55)}
.ph span{transform:translateY(-200px)}
.credit{z-index:2;top:110px;bottom:auto}
.text{position:absolute;left:64px;right:64px;bottom:150px;z-index:2}
.kicker{font-size:24px;font-weight:700;color:${GOLD};letter-spacing:.12em;margin-bottom:22px}
h1{font-weight:900;font-size:100px;line-height:1.15;letter-spacing:-.02em}
h2{font-weight:900;font-size:70px;line-height:1.22;margin-bottom:24px}
.sub{font-size:34px;line-height:1.5;margin-top:24px;color:rgba(255,255,255,.85)}
.body{font-size:36px;line-height:1.6;color:rgba(255,255,255,.9)}
.s-body.no-img .text{top:210px;bottom:auto}
.s-body.no-img h2{font-size:96px;color:${GOLD};margin-bottom:44px}
.s-body.no-img .body{font-size:46px}
.foot{position:absolute;left:64px;right:64px;bottom:56px;display:flex;justify-content:space-between;font-size:22px;color:rgba(255,255,255,.7);z-index:3}
.sig{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
  background:radial-gradient(circle at 50% 38%,#2A2420,${INK} 70%)}
.sig-mark{font-weight:900;font-size:190px;letter-spacing:-.04em;color:${GOLD};line-height:1}
.sig-en{margin-top:24px;font-size:30px;font-weight:700;letter-spacing:.42em;color:rgba(255,255,255,.7)}
.sig-tag{margin-top:96px;font-size:46px;font-weight:700;line-height:1.5}
.sig-cta{margin-top:96px;padding:22px 48px;border:3px solid ${GOLD};border-radius:999px;font-size:34px;font-weight:700;color:${GOLD}}
.sig-handle{margin-top:28px;font-size:30px;color:rgba(255,255,255,.7)}
.sig .notice{position:absolute;bottom:64px;left:64px;right:64px;font-size:22px;color:rgba(255,255,255,.45)}
`;

const photo = {
  name: 'photo',
  label: 'C. 풀블리드 포토',
  css: base,
};

// ratio: 사진이 차지하는 세로 비율
const makeSplit = (name, ratio) => {
  const SPLIT = Math.round(1350 * ratio);
  const pct = Math.round(ratio * 100);
  return {
  name,
  label: `C-2. 사진 ${pct} / 글 ${100 - pct} 분할`,
  css: `${base}
.s-body{background:#fff}
.s-body .media{inset:auto;left:0;right:0;top:0;height:${SPLIT}px}
.s-body .media::after{background:linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 55%,rgba(0,0,0,.78) 100%)}
.s-body .ph span{transform:translateY(-120px)}
.s-body::before{content:'';position:absolute;left:0;right:0;top:${SPLIT}px;height:6px;background:${GOLD};z-index:4}
.s-body.no-img::after{content:'';position:absolute;left:0;right:0;top:0;height:${SPLIT}px;background:${INK}}
.s-body .text,.s-body.no-img .text{top:${SPLIT}px;bottom:0;padding-top:52px}
.s-body .head{position:absolute;left:0;right:0;bottom:calc(100% + 44px)}
.s-body h2,.s-body.no-img h2{font-size:76px;color:#fff;margin-bottom:0}
.s-body.no-img h2{color:${GOLD}}
.s-body .body,.s-body.no-img .body{font-size:36px;line-height:1.6;color:#222}
.s-body .foot{color:#8A8580}
`,
  };
};

export const styles = { photo, split: makeSplit('split', 0.7), split80: makeSplit('split80', 0.8) };
