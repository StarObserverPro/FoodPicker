const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const meal = (url.searchParams.get('meal') || '今天吃点好的').slice(0, 60);
  const region = (url.searchParams.get('region') || '随机推荐').slice(0, 20);
  const target = `${url.origin}/?meal=${encodeURIComponent(meal)}&region=${encodeURIComponent(region)}`;
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>下一顿：${esc(meal)}</title><meta name="description" content="命运替我选了：${esc(meal)}"><meta property="og:title" content="下一顿：${esc(meal)}"><meta property="og:description" content="命运替我选了：${esc(meal)}。你也来摇一个？"><meta property="og:image" content="${url.origin}/share-card.png"><meta property="og:type" content="website"><meta property="og:url" content="${esc(url.href)}"><meta http-equiv="refresh" content="0;url=${esc(target)}"><style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#fff4dd;font-family:system-ui;color:#432f2a}main{text-align:center;padding:28px}h1{color:#ed5b4f}a{color:#7a66a8}</style></head><body><main><div style="font-size:64px">🍔</div><h1>${esc(meal)}</h1><p>正在打开随机饭局……</p><a href="${esc(target)}">没有自动跳转？点这里</a></main><script>location.replace(${JSON.stringify(target)})</script></body></html>`;
  return new Response(html, { headers: { 'content-type':'text/html; charset=utf-8', 'cache-control':'public, max-age=300' } });
}
