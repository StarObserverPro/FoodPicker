const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const meal = (url.searchParams.get('meal') || '今天吃点好的').slice(0, 60);
  const persona = (url.searchParams.get('persona') || url.searchParams.get('type') || '一口还没起名的锅').slice(0, 40);
  const target = new URL('/', url.origin);
  target.searchParams.set('from', 'share');
  target.searchParams.set('meal', meal);
  target.searchParams.set('persona', persona);

  const title = `${persona} · 今天落到${meal}`;
  const description = `今天测出一口「${persona}」，顺手落到${meal}。点开看看你是哪口锅。`;
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${url.origin}/share-card.png"><meta property="og:type" content="website"><meta property="og:url" content="${escapeHtml(url.href)}"><meta http-equiv="refresh" content="0;url=${escapeHtml(target)}"><style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#fff4dd;font-family:system-ui;color:#432f2a}main{text-align:center;padding:28px}h1{color:#a8322c;font-family:serif}a{color:#506f80}</style></head><body><main><div style="font-size:64px">🍲</div><h1>${escapeHtml(persona)}</h1><p>今天落到：${escapeHtml(meal)}</p><a href="${escapeHtml(target)}">没有自动跳转？点这里</a></main><script>location.replace(${JSON.stringify(target.toString())})</script></body></html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
}
