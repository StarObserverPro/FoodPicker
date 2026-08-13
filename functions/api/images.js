const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=1800, s-maxage=21600',
  'access-control-allow-origin': '*'
};

const stripTags = (value = '') => String(value).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const hashText = (text = '') => Array.from(text).reduce((n, ch) => ((n * 31 + ch.charCodeAt(0)) | 0), 7);
const seededRandom = seed => () => {
  seed |= 0;
  seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

const ALLOWED_IMAGE_HOSTS = [
  /(^|\.)upload\.wikimedia\.org$/i,
  /(^|\.)wikimedia\.org$/i,
  /(^|\.)openverse\.org$/i,
  /(^|\.)staticflickr\.com$/i,
  /(^|\.)flickr\.com$/i,
  /(^|\.)loremflickr\.com$/i,
  /(^|\.)images\.pexels\.com$/i,
  /(^|\.)images\.unsplash\.com$/i,
  /(^|\.)cdn\.pixabay\.com$/i,
  /(^|\.)wordpress\.com$/i,
  /(^|\.)wp\.com$/i
];

function isAllowedImageURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.some(rule => rule.test(url.hostname));
  } catch { return false; }
}

function base64url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function proxied(value) {
  return isAllowedImageURL(value) ? `/api/image?u=${base64url(value)}` : '';
}

function shuffled(items, seed) {
  const copy = [...items];
  const random = seededRandom(seed || 1);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function coreMealName(name) {
  const first = name.split(/[+＋]|配|加|套餐|拼盘/)[0].trim();
  return (first.length >= 2 ? first : name)
    .replace(/(中式|欧式|美式|经典|小份|全套)$/g, '')
    .trim();
}

function englishHint(name, region) {
  const rules = [
    [/披萨/, 'pizza'], [/(意面|通心粉|肉酱面)/, 'pasta'], [/烩饭/, 'risotto'], [/千层面/, 'lasagna'],
    [/汉堡/, 'burger'], [/(三明治|法棍|贝果|帕尼尼)/, 'sandwich'], [/(塔可|玉米饼)/, 'tacos'], [/(卷饼|法希塔)/, 'burrito'],
    [/(饺|馄饨|云吞|锅贴|抄手)/, 'dumplings'], [/(包|烧卖)/, 'bao buns'], [/(面|米线|粉|粿条)/, 'noodles'],
    [/(炒饭|盖饭|米饭|饭碗|煲仔饭|抓饭)/, 'rice dish'], [/(炸鸡|鸡排|鸡柳)/, 'fried chicken'], [/(烤鸡|鸡肉|鸡腿|鸡翅)/, 'chicken dish'],
    [/(牛排|牛肉|牛腩|牛胸)/, 'beef dish'], [/(猪排|排骨|叉烧|猪肉|肉夹馍)/, 'pork dish'], [/(鱼|虾|蟹|海鲜|龙虾|鲑鱼|三文鱼)/, 'seafood dish'],
    [/(沙拉|蔬菜碗|藜麦碗)/, 'salad bowl'], [/(汤|粥|羹|浓汤)/, 'soup'], [/咖喱/, 'curry'], [/(馅饼|咸派|肉派)/, 'savory pie'],
    [/(烤肉|烧烤|烤串)/, 'grilled meat'], [/火锅|麻辣烫|冒菜/, 'hot pot'], [/可丽饼/, 'crepe'], [/可颂/, 'croissant'],
    [/肉丸/, 'meatballs'], [/海鲜饭/, 'paella'], [/皮塔/, 'pita'], [/库斯库斯/, 'couscous'], [/牧羊人派/, "shepherd's pie"], [/穆萨卡/, 'moussaka']
  ];
  const match = rules.find(([re]) => re.test(name));
  return match ? match[1] : ({ 中国: 'Chinese food', 欧洲: 'European food', 美洲: 'American food' }[region] || 'lunch food');
}

function fallbackTag(name, region) {
  return englishHint(name, region).toLowerCase().replace(/\s+/g, ',');
}

async function searchOpenverse(query, seed) {
  const api = new URL('https://api.openverse.org/v1/images/');
  api.searchParams.set('q', query);
  api.searchParams.set('page_size', '20');
  api.searchParams.set('mature', 'false');
  const response = await fetch(api.toString(), {
    headers: {
      accept: 'application/json',
      'user-agent': 'MealPicker/3.0 (open-image-search)'
    }
  });
  if (!response.ok) throw new Error(`Openverse ${response.status}`);
  const data = await response.json();
  return shuffled(data.results || [], seed).map(item => ({
    thumbnail: item.thumbnail || item.url,
    original: item.url || item.thumbnail,
    title: item.title || query,
    link: item.foreign_landing_url || item.detail_url || item.url,
    creator: item.creator || '',
    license: [item.license, item.license_version].filter(Boolean).join(' '),
    provider: 'Openverse',
    approximate: false
  })).filter(item => item.thumbnail && isAllowedImageURL(item.thumbnail));
}

async function searchCommons(query, seed) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('generator', 'search');
  api.searchParams.set('gsrsearch', query);
  api.searchParams.set('gsrnamespace', '6');
  api.searchParams.set('gsrlimit', '20');
  api.searchParams.set('prop', 'imageinfo');
  api.searchParams.set('iiprop', 'url|extmetadata');
  api.searchParams.set('iiurlwidth', '900');
  api.searchParams.set('format', 'json');
  api.searchParams.set('formatversion', '2');
  api.searchParams.set('origin', '*');
  const response = await fetch(api.toString(), { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Wikimedia ${response.status}`);
  const data = await response.json();
  return shuffled(data.query?.pages || [], seed).map(page => {
    const info = page.imageinfo?.[0] || {};
    const meta = info.extmetadata || {};
    const license = stripTags(meta.LicenseShortName?.value || meta.UsageTerms?.value || '');
    const creator = stripTags(meta.Artist?.value || meta.Credit?.value || '');
    return {
      thumbnail: info.thumburl || info.url,
      original: info.url || info.thumburl,
      title: page.title?.replace(/^File:/, '') || query,
      link: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title || '')}`,
      creator,
      license,
      provider: 'Wikimedia',
      approximate: false
    };
  }).filter(item => item.thumbnail);
}

function loremFallback(name, region, seed) {
  const tag = fallbackTag(name, region);
  return [0, 1, 2].map((_, index) => ({
    thumbnail: `https://loremflickr.com/720/540/${encodeURIComponent(tag)}?lock=${Math.abs(seed + index + 1) % 9999}`,
    original: `https://loremflickr.com/1200/900/${encodeURIComponent(tag)}?lock=${Math.abs(seed + index + 1) % 9999}`,
    title: `${name} · 关键词示意图`,
    link: 'https://loremflickr.com/',
    creator: '',
    license: 'CC',
    provider: 'LoremFlickr',
    approximate: true
  }));
}

function uniqueImages(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.original || item.thumbnail;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const meal = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const region = (url.searchParams.get('region') || '').trim().slice(0, 20);
  const preferredSearch = (url.searchParams.get('search') || '').trim().slice(0, 140);
  const requestedSeed = Number.parseInt(url.searchParams.get('seed') || '', 10);
  const seed = Number.isFinite(requestedSeed) ? requestedSeed : hashText(meal);
  if (!meal) return new Response(JSON.stringify({ message: '缺少菜名' }), { status: 400, headers: JSON_HEADERS });

  const core = coreMealName(meal);
  const hint = englishHint(meal, region);
  const queries = [...new Set([preferredSearch, `${preferredSearch || hint} food`, `${core} ${hint}`, hint, core].filter(Boolean))];
  const found = [];

  for (const query of queries.slice(0, 3)) {
    try {
      found.push(...await searchOpenverse(query, seed + found.length));
      if (uniqueImages(found).length >= 8) break;
    } catch {}
  }

  if (uniqueImages(found).length < 3) {
    for (const query of [core, hint]) {
      try {
        found.push(...await searchCommons(query, seed + 101 + found.length));
        if (uniqueImages(found).length >= 6) break;
      } catch {}
    }
  }

  let images = uniqueImages(found);
  if (images.length) {
    images = shuffled(images, seed).slice(0, 3);
  } else {
    images = loremFallback(meal, region, seed);
  }

  images = images.map(item => ({
    ...item,
    thumbnail: proxied(item.thumbnail || item.original),
    original: proxied(item.original || item.thumbnail)
  })).filter(item => item.thumbnail || item.original);

  if (!images.length) {
    images = loremFallback(meal, region, seed).map(item => ({
      ...item,
      thumbnail: proxied(item.thumbnail),
      original: proxied(item.original)
    })).filter(item => item.thumbnail || item.original);
  }

  return new Response(JSON.stringify({
    query: meal,
    search_query: queries[0],
    provider: images.some(item => item.approximate) ? 'LoremFlickr（本站转发）' : 'Openverse / Wikimedia（本站转发）',
    images
  }), { headers: JSON_HEADERS });
}
