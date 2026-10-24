// 디자인 시안 3종. 공통 마크업(slide.js)에 입히는 CSS만 다르다.

const editorial = {
  name: 'editorial',
  label: 'A. 에디토리얼',
  css: `
.slide{background:#F6F2EA;color:#1C1A17}
.mast{position:absolute;left:72px;right:72px;top:56px;display:flex;justify-content:space-between;align-items:baseline;
  border-bottom:2px solid #1C1A17;padding-bottom:16px;font-size:24px;letter-spacing:.04em}
.brand{font-family:'Noto Serif KR';font-weight:900;font-size:34px}
.media{position:absolute;left:72px;right:72px;top:136px}
.ph{background:#D9D2C5;color:#6B6358}
.s-cover .media{height:700px}
.s-body .media{height:560px}
.text{position:absolute;left:72px;right:72px}
.kicker{font-size:24px;color:#B4472F;font-weight:700;letter-spacing:.08em;margin-bottom:20px}
h1{font-family:'Noto Serif KR';font-weight:900;font-size:96px;line-height:1.18}
h2{font-family:'Noto Serif KR';font-weight:900;font-size:68px;line-height:1.25;margin-bottom:28px}
.sub{font-size:34px;line-height:1.5;margin-top:28px;color:#4A443C}
.body{font-size:36px;line-height:1.65;color:#2E2A25}
.s-cover .text{top:880px}
.s-body.has-img .text{top:740px}
.s-body.no-img .text,.s-summary .text{top:220px}
.s-body.no-img h2{font-size:92px;margin-bottom:48px}
.s-body.no-img .body{font-size:44px}
.points{list-style:none;counter-reset:p;margin-top:12px}
.points li{counter-increment:p;font-size:42px;line-height:1.45;padding:28px 0;border-bottom:1px solid #BDB4A6;display:flex;gap:28px}
.points li::before{content:counter(p,decimal-leading-zero);font-family:'Noto Serif KR';font-weight:900;color:#B4472F}
.sources{margin-top:56px;display:flex;flex-direction:column;gap:8px;font-size:24px;color:#5E574D}
.sources b{font-size:22px;letter-spacing:.1em;color:#1C1A17}
.notice{margin-top:28px;font-size:22px;color:#8A8276}
.foot{position:absolute;left:72px;right:72px;bottom:52px;display:flex;justify-content:space-between;font-size:22px;color:#6B6358}
`,
};

const pop = {
  name: 'pop',
  label: 'B. 볼드 팝',
  css: `
.slide{background:#FFEFD6;color:#3A2416}
.mast{position:absolute;left:64px;right:64px;top:52px;display:flex;justify-content:space-between;align-items:center;font-size:24px;font-weight:700}
.brand{background:#3A2416;color:#FFEFD6;padding:8px 22px;border-radius:999px;font-weight:900;font-size:28px}
.issue{color:#A0623A}
.media{position:absolute;left:64px;right:64px;top:130px;border-radius:48px;border:6px solid #3A2416;box-shadow:16px 16px 0 #FF7A3D}
.ph{background:repeating-linear-gradient(45deg,#F5C79A 0 28px,#F0B985 28px 56px);color:#7A4A2A}
.s-cover .media{height:680px}
.s-body .media{height:560px}
.text{position:absolute;left:64px;right:64px}
.kicker{display:inline-block;background:#FF7A3D;color:#fff;font-weight:900;font-size:26px;padding:6px 20px;border-radius:12px;margin-bottom:24px}
h1{font-weight:900;font-size:104px;line-height:1.12;letter-spacing:-.02em}
h2{font-weight:900;font-size:72px;line-height:1.2;letter-spacing:-.02em;margin-bottom:24px}
.sub{font-size:34px;font-weight:500;line-height:1.5;margin-top:24px}
.body{font-size:36px;font-weight:500;line-height:1.6}
.s-cover .text{top:870px}
.s-body.has-img .text{top:752px}
.s-body.no-img .text,.s-summary .text{top:200px}
.s-body.no-img h2{font-size:100px;margin-bottom:44px}
.s-body.no-img .body{font-size:46px}
.points{list-style:none;margin-top:16px;display:flex;flex-direction:column;gap:22px}
.points li{background:#fff;border:5px solid #3A2416;border-radius:28px;padding:28px 36px;font-size:40px;font-weight:700}
.points li:nth-child(odd){box-shadow:10px 10px 0 #FF7A3D}
.points li:nth-child(even){box-shadow:10px 10px 0 #6BB7A8}
.sources{margin-top:52px;display:flex;flex-direction:column;gap:6px;font-size:24px;color:#7A4A2A}
.notice{margin-top:24px;font-size:22px;color:#A0623A}
.foot{position:absolute;left:64px;right:64px;bottom:48px;display:flex;justify-content:space-between;font-size:24px;font-weight:700}
`,
};

const photo = {
  name: 'photo',
  label: 'C. 풀블리드 포토',
  css: `
.slide{background:#151413;color:#fff}
.mast{position:absolute;left:64px;right:64px;top:56px;display:flex;justify-content:space-between;font-size:24px;z-index:3;letter-spacing:.06em}
.brand{font-weight:900;font-size:30px}
.media{position:absolute;inset:0}
.media::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 40%,rgba(0,0,0,.88) 78%)}
.ph{background:radial-gradient(circle at 30% 30%,#7C6A58,#3B332C 70%);color:rgba(255,255,255,.55)}
.ph span{transform:translateY(-200px)}
.credit{z-index:2;top:110px;bottom:auto}
.meme{top:140px;z-index:2}
.text{position:absolute;left:64px;right:64px;bottom:150px;z-index:2}
.kicker{font-size:24px;font-weight:700;color:#E8C07D;letter-spacing:.12em;margin-bottom:22px}
h1{font-weight:900;font-size:100px;line-height:1.15;letter-spacing:-.02em}
h2{font-weight:900;font-size:70px;line-height:1.22;margin-bottom:24px}
.sub{font-size:34px;line-height:1.5;margin-top:24px;color:rgba(255,255,255,.85)}
.body{font-size:36px;line-height:1.6;color:rgba(255,255,255,.9)}
.s-body.no-img .text,.s-summary .text{top:210px;bottom:auto}
.s-body.no-img h2{font-size:96px;color:#E8C07D;margin-bottom:44px}
.s-body.no-img .body{font-size:46px}
.points{list-style:none;counter-reset:p;margin-top:20px}
.points li{counter-increment:p;font-size:42px;line-height:1.4;padding:30px 0;border-top:1px solid rgba(255,255,255,.25);display:flex;gap:30px}
.points li::before{content:counter(p);font-weight:900;color:#E8C07D}
.sources{margin-top:52px;display:flex;flex-direction:column;gap:6px;font-size:24px;color:rgba(255,255,255,.6)}
.notice{margin-top:24px;font-size:22px;color:rgba(255,255,255,.5)}
.foot{position:absolute;left:64px;right:64px;bottom:56px;display:flex;justify-content:space-between;font-size:22px;color:rgba(255,255,255,.7);z-index:3}
`,
};

export const styles = { editorial, pop, photo };
