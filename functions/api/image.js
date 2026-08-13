const CACHE_HEADERS = {
  'cache-control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000',
  'access-control-allow-origin': '*',
  'x-content-type-options': 'nosniff'
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

function decodeBase64url(value = '') {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function allowed(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.some(rule => rule.test(url.hostname));
  } catch { return false; }
}

export async function onRequest(context) {
  const requestURL = new URL(context.request.url);
  let remote = '';
  try { remote = decodeBase64url(requestURL.searchParams.get('u') || ''); } catch {}
  if (!allowed(remote)) return new Response('Unsupported image source', { status: 400 });

  try {
    let target = remote;
    let upstream;
    for (let redirectCount = 0; redirectCount <= 3; redirectCount++) {
      upstream = await fetch(target, {
        redirect: 'manual',
        headers: {
          accept: 'image/avif,image/webp,image/apng,image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5',
          'user-agent': 'MealPicker/4.0 image relay'
        }
      });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const location = upstream.headers.get('location');
      if (!location || redirectCount === 3) return new Response('Unsafe image redirect', { status: 502 });
      target = new URL(location, target).toString();
      if (!allowed(target)) return new Response('Unsupported redirect host', { status: 400 });
    }
    if (!upstream?.ok) return new Response('Image unavailable', { status: 502 });
    const contentType = upstream.headers.get('content-type') || '';
    const length = Number(upstream.headers.get('content-length') || 0);
    if (!contentType.toLowerCase().startsWith('image/')) return new Response('Not an image', { status: 415 });
    if (length && length > 8_000_000) return new Response('Image too large', { status: 413 });

    const headers = new Headers(CACHE_HEADERS);
    headers.set('content-type', contentType);
    const etag = upstream.headers.get('etag');
    if (etag) headers.set('etag', etag);
    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return new Response('Image relay failed', { status: 502 });
  }
}
