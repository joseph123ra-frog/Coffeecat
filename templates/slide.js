// 슬라이드 1장을 HTML로 만든다. 마크업은 공통이고 스타일(CSS)만 바뀐다.

const FONTS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Noto+Serif+KR:wght@700;900&display=block';

const esc = (s = '') =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const lines = (s = '') => esc(s).replace(/\n/g, '<br>');

function media(image) {
  if (!image) return '';
  const inner = image.url
    ? `<img src="${esc(image.url)}" alt="">`
    : `<div class="ph"><span>${esc(image.placeholder || '사진 영역')}</span></div>`;
  const meme = image.meme ? `<div class="meme">${esc(image.meme)}</div>` : '';
  const credit = image.credit ? `<span class="credit">${esc(image.credit)}</span>` : '';
  return `<div class="media">${inner}${meme}${credit}</div>`;
}

function content(slide, index, total) {
  const no = String(index + 1).padStart(2, '0');
  switch (slide.type) {
    case 'cover':
      return `<div class="text">
        <div class="kicker">${esc(slide.kicker || '오늘의 질문')}</div>
        <h1>${lines(slide.title)}</h1>
        ${slide.subtitle ? `<p class="sub">${esc(slide.subtitle)}</p>` : ''}
      </div>`;
    case 'signature':
      // 매 호 마지막에 고정으로 들어가는 시그니처 페이지
      return `<div class="sig">
        <div class="sig-mark">깝휘캣</div>
        <div class="sig-en">COFFEE CAT MAGAZINE</div>
        <p class="sig-tag">궁금한 건 못 참는 고양이가<br>대신 찾아봤다냥</p>
        <div class="sig-cta">팔로우하고 다음 호 받아보기</div>
        <div class="sig-handle">@아이디</div>
        <p class="notice">*해당 콘텐츠는 AI의 조사만을 거친 게시물로, 내용에 오류가 있을 수 있습니다</p>
      </div>`;
    default:
      return `<div class="text">
        <div class="head">
          <div class="kicker">${no} / ${String(total).padStart(2, '0')}</div>
          <h2>${esc(slide.title)}</h2>
        </div>
        <p class="body">${lines(slide.body)}</p>
      </div>`;
  }
}

export function slideHtml({ data, slide, index, style }) {
  const total = data.slides.length;
  const cls = [`s-${slide.type}`, slide.image ? 'has-img' : 'no-img'].join(' ');
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px;overflow:hidden}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;word-break:keep-all}
.media{position:relative;overflow:hidden}
.media img{width:100%;height:100%;object-fit:cover;display:block}
.ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.ph span{font-size:30px;letter-spacing:.02em}
.credit{position:absolute;right:20px;bottom:16px;font-size:18px;color:#fff;opacity:.85;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.meme{position:absolute;left:0;right:0;top:36px;text-align:center;font-family:'Noto Sans KR';font-weight:900;font-size:64px;color:#fff;
  -webkit-text-stroke:3px #000;paint-order:stroke fill}
.dummy{position:absolute;left:50%;top:0;transform:translateX(-50%);background:#ff0;color:#000;font-size:18px;padding:4px 14px;z-index:9}
${style.css}
</style></head><body>
<div class="slide ${cls}">
  ${data.dummy ? '<div class="dummy">시안용 더미 텍스트</div>' : ''}
  ${slide.type === 'signature' ? '' : `<header class="mast"><span class="brand">깝휘캣</span><span class="issue">No.${String(data.issue).padStart(2, '0')} · ${esc(data.date)}</span></header>`}
  ${slide.type === 'signature' ? '' : media(slide.image)}
  ${content(slide, index, total)}
  ${slide.type === 'signature' ? '' : `<footer class="foot"><span>${index + 1}/${total}</span><span>넘겨서 계속 →</span></footer>`}
</div></body></html>`;
}
