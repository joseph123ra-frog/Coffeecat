// 사진 검색: Unsplash → Pexels → Wikimedia Commons 순. 키가 없는 출처는 건너뛴다.
// 관련 사진이 없으면 같은 출처에서 웃긴 고양이 사진을 대신 쓴다. 슬라이드 글은 그대로 들어간다.

const UA = 'CoffeecatMagazine/0.1 (https://github.com/joseph123ra-frog/Coffeecat)';

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}`);
  return res.json();
}

async function unsplash(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const q = new URLSearchParams({ query, orientation: 'portrait', per_page: '10', content_filter: 'high' });
  const json = await getJson(`https://api.unsplash.com/search/photos?${q}`, { Authorization: `Client-ID ${key}` });
  return json.results.map((p) => ({
    id: `unsplash:${p.id}`,
    url: `${p.urls.raw}&w=1080&q=85&fm=jpg`,
    credit: `Photo by ${p.user.name} on Unsplash`,
    // Unsplash API 지침: 사진을 쓸 때 download_location을 호출해야 한다.
    onUse: () => fetch(p.links.download_location, { headers: { Authorization: `Client-ID ${key}` } }),
  }));
}

async function pexels(query) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const q = new URLSearchParams({ query, orientation: 'portrait', per_page: '10' });
  const json = await getJson(`https://api.pexels.com/v1/search?${q}`, { Authorization: key });
  return json.photos.map((p) => ({
    id: `pexels:${p.id}`,
    url: p.src.large2x,
    credit: `Photo by ${p.photographer} on Pexels`,
  }));
}

const stripTags = (s = '') => s.replace(/<[^>]*>/g, '').trim();

async function wikimedia(query) {
  const q = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1080',
  });
  const json = await getJson(`https://commons.wikimedia.org/w/api.php?${q}`);
  return Object.values(json.query?.pages ?? {})
    .sort((a, b) => a.index - b.index)
    .map((p) => ({ p, info: p.imageinfo?.[0] }))
    .filter(({ info }) => info?.thumburl && /\.(jpe?g|png)$/i.test(info.url))
    .map(({ p, info }) => {
      const meta = info.extmetadata ?? {};
      const artist = stripTags(meta.Artist?.value) || '작자 미상';
      const license = meta.LicenseShortName?.value ?? '';
      return {
        id: `wikimedia:${p.pageid}`,
        url: info.thumburl,
        credit: `${artist} · Wikimedia Commons${license ? ` · ${license}` : ''}`,
      };
    });
}

const SOURCES = [unsplash, pexels, wikimedia];

async function firstUnused(query, used, { random = false } = {}) {
  for (const source of SOURCES) {
    let found;
    try {
      found = (await source(query)).filter((c) => !used.has(c.id));
    } catch (err) {
      console.warn(`사진 검색 실패 (${source.name}): ${err.message}`);
      continue;
    }
    if (found.length) return random ? found[Math.floor(Math.random() * found.length)] : found[0];
  }
  return null;
}

// queries: 슬라이드별 검색어 → [{ url, credit }]
export async function pickImages(queries) {
  const used = new Set();
  const picked = [];
  for (const query of queries) {
    const image = (await firstUnused(query, used)) ?? (await firstUnused('funny cat', used, { random: true }));
    if (!image) throw new Error(`사진을 하나도 찾지 못했습니다 (검색어: ${query}). 사진 API 상태를 확인하세요.`);
    used.add(image.id);
    await image.onUse?.().catch(() => {});
    picked.push({ url: image.url, credit: image.credit });
  }
  return picked;
}
