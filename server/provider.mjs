export class PlayError extends Error {
  constructor(code, message, status = 400, { uncertain = false, usage = null } = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.uncertain = uncertain;
    this.usage = usage;
  }
}

export async function readBoundedJSON(response, maxBytes = 32768) {
  const reader = response.body?.getReader();
  if (!reader) throw new PlayError('invalid_body', '这条消息没接完整，再试一次。');
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new PlayError('body_too_large', '这条有点长，缩短一点再发吧。', 413);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new PlayError('invalid_body', '这条消息没接完整，再试一次。'); }
}

async function postOpenAI(path, body, env, fetcher, timeout, maxBytes) {
  if (!env.OPENAI_API_KEY) throw new PlayError('not_configured', '厨房还没开火，先去随便选一道吧。', 503);
  let response;
  try {
    response = await fetcher(`https://api.openai.com/v1/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new PlayError('upstream_uncertain', '这次没等到完整回应，先缓一会儿。', 503, { uncertain: true });
  }
  if (!response.ok) {
    // Never expose upstream response text, credentials or prompt material to visitors.
    const limited = response.status === 429;
    throw new PlayError(limited ? 'upstream_busy' : 'upstream_failed', limited ? '厨房正忙，稍后再试一下。' : '这次没接好，再试一次吧。', 503, { uncertain: response.status >= 500 });
  }
  try { return await readBoundedJSON(response, maxBytes); }
  catch { throw new PlayError('upstream_incomplete', '回应没有完整送到，先缓一会儿。', 502, { uncertain: true }); }
}

export async function generateStructured({ model, reasoning, instructions, input, schema, name, maxOutputTokens = 4096 }, env, fetcher = fetch) {
  const data = await postOpenAI('responses', {
    model,
    store: false,
    reasoning: { effort: reasoning },
    max_output_tokens: maxOutputTokens,
    input: [{ role: 'developer', content: instructions }, { role: 'user', content: JSON.stringify(input) }],
    text: { format: { type: 'json_schema', name, strict: true, schema } },
  }, env, fetcher, 60000, 512000);
  const content = (data.output || []).flatMap(item => item.content || []);
  if (content.some(item => item.type === 'refusal')) throw new PlayError('refused', '这个构思没画成，换个说法试试吧。', 422, { usage: data.usage });
  if (data.status !== 'completed') throw new PlayError('incomplete', '这一段没想完整，再试一次吧。', 502, { usage: data.usage });
  const raw = content.filter(item => item.type === 'output_text').map(item => item.text).join('');
  try { return { value: JSON.parse(raw), usage: data.usage ?? null, model: data.model ?? model }; }
  catch { throw new PlayError('invalid_model_output', '这次没组织好，再试一次吧。', 502, { usage: data.usage }); }
}

export async function generateImage(prompt, config, env, fetcher = fetch) {
  const data = await postOpenAI('images/generations', {
    model: config.imageModel,
    prompt,
    n: 1,
    size: config.imageSize,
    quality: config.imageQuality,
    output_format: config.imageFormat,
    output_compression: config.imageCompression,
    background: 'opaque',
  }, env, fetcher, 180000, 12000000);
  const base64 = data.data?.[0]?.b64_json;
  if (data.data?.length !== 1 || typeof base64 !== 'string' || !base64.startsWith('/9j/') || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new PlayError('invalid_image', '图片没有完整送到，原请求不会自动再画。', 502, { uncertain: true, usage: data.usage });
  }
  const [width, height] = config.imageSize.split('x').map(Number);
  return { image: { dataUrl: `data:image/jpeg;base64,${base64}`, mimeType: 'image/jpeg', width, height }, usage: data.usage ?? null, model: config.imageModel };
}
