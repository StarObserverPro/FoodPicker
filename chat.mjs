import { chooseOpener } from './play/openers.mjs?v=38';
import { createDrawingPoster, paintDrawingQR } from './play/poster.mjs?v=41';

const $ = id => document.getElementById(id);
const MAX_TURNS = 6;
const MAX_MESSAGE = 600;
const NARRATION_INTERVAL = 2100;
const DRAWING_URL = location.origin + '/chat';
const TERMINAL_REQUEST_CODES = new Set([
  'plan_expired', 'variation_context_changed', 'image_no_longer_cached',
  'previous_attempt_failed', 'outcome_unknown',
]);
const FAILED_COMPOSE_CODES = new Set(['invalid_model_output', 'incomplete', 'refused']);
const FALLBACK_CODES = new Set(['not_configured', 'temporarily_unavailable']);
const state = {
  messages: [], seenOpeners: [], busy: '', epoch: 0, controller: null,
  pendingChat: null, pendingPicture: null, result: null, composing: false, narrationTimer: null,
};
const countCharacters = value => Array.from(value).length;
const userTurns = () => state.messages.filter(message => message.role === 'user').length;
const newId = () => crypto.randomUUID();
const snapshotMessages = () => state.messages.map(({ role, content }) => ({ role, content }));

function showError(message, { fallback = false } = {}) {
  $('errorText').textContent = message;
  $('errorPanel').hidden = false;
  $('fallbackLink').hidden = !fallback;
  updateControls();
}

function clearError() {
  $('errorPanel').hidden = true;
  $('errorText').textContent = '';
  $('fallbackLink').hidden = true;
}

function updateControls() {
  const input = $('messageInput');
  const count = countCharacters(input.value);
  const limit = userTurns() >= MAX_TURNS;
  $('composerInput').setAttribute('data-value', input.value);
  $('messageCount').textContent = `${count} / ${MAX_MESSAGE}`;
  input.setAttribute('aria-invalid', String(count > MAX_MESSAGE));
  input.disabled = Boolean(state.busy) || limit || Boolean(state.pendingChat);
  $('sendMessage').disabled = input.disabled || count > MAX_MESSAGE || !input.value.trim();
  $('drawImage').disabled = Boolean(state.busy) || userTurns() === 0;
  $('changeOpener').hidden = userTurns() > 0;
  $('changeOpener').disabled = Boolean(state.busy);
  $('retryChat').hidden = !state.pendingChat || Boolean(state.busy);
  $('retryChat').textContent = state.pendingChat && !state.pendingChat.requestId ? '再试一次' : '查看回复';
  $('retryPicture').hidden = !state.pendingPicture || Boolean(state.busy);
  $('retryPicture').textContent = state.pendingPicture?.plan ? '查看图片' : '继续画这张';
  $('newMismatch').disabled = Boolean(state.busy);
  $('newMismatch').textContent = state.result && !state.result.planToken ? '重新猜一道，再画一张' : '同一道菜，再画一张';
  $('pictureNote').textContent = state.result && !state.result.planToken ? '这次会重新猜一道菜，再想一个画面。' : '换个场景来画，食物还是这道。';
  $('continueChat').disabled = Boolean(state.busy);
  $('drawImage').textContent = state.pendingPicture ? '继续画这张' : '就这些，画出来';
  $('turnHint').textContent = limit ? '这一轮先聊到这里，可以画出来看看。' : state.pendingChat && !state.busy ? '还没收到回复。可以再试一次，也可以直接画。' : '说一句就可以画，也可以再聊几句。';
  $('messageForm').setAttribute('aria-busy', String(Boolean(state.busy)));
  $('progressPanel').hidden = !state.busy;
}

function setBusy(stage) {
  state.busy = stage;
  $('progressPanel').setAttribute('data-stage', stage);
  const label = ({ chat: '正在回复……', compose: '在想怎么画……', draw: '正在画……' })[stage] || '';
  $('progressText').textContent = label;
  $('drawingProgress').hidden = stage !== 'compose' && stage !== 'draw';
  $('drawingProgress').setAttribute('aria-valuetext', label);
  if (stage !== 'draw') stopNarration();
  updateControls();
}

function stopNarration() {
  clearTimeout(state.narrationTimer);
  state.narrationTimer = null;
  $('drawingNarration').replaceChildren();
}

function revealNarration(plan, ticket) {
  stopNarration();
  const lines = Array.isArray(plan.narration) ? plan.narration : [plan.sceneDescription];
  const displayLines = lines.filter(line => typeof line === 'string' && line.trim()).slice(0, 4);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const appendLine = line => {
    const item = document.createElement('li');
    item.textContent = line;
    $('drawingNarration').append(item);
  };
  if (reducedMotion) {
    displayLines.forEach(appendLine);
    return;
  }
  let next = 0;
  const revealNext = () => {
    if (ticket !== state.epoch || state.busy !== 'draw' || next >= displayLines.length) return;
    appendLine(displayLines[next++]);
    if (next < displayLines.length) state.narrationTimer = setTimeout(revealNext, NARRATION_INTERVAL);
  };
  revealNext();
}

function appendMessage(role, content) {
  state.messages.push({ role, content });
  const item = document.createElement('li');
  item.className = `message message-${role}`;
  item.textContent = content;
  $('messages').append(item);
}

function focusLatest() {
  $('messages').lastElementChild?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
}

function changeOpener() {
  if (state.busy || userTurns()) return;
  const opener = chooseOpener({ seenIds: state.seenOpeners });
  state.seenOpeners = [...state.seenOpeners, opener.id].slice(-40);
  try { sessionStorage.setItem('foodpicker.openers.seen.v1', JSON.stringify(state.seenOpeners)); } catch {}
  state.messages = [];
  $('messages').replaceChildren();
  appendMessage('assistant', opener.text);
  updateControls();
}

function abortCurrent(showNotice = true) {
  const stage = state.busy;
  state.epoch += 1;
  state.controller?.abort();
  state.controller = null;
  setBusy('');
  if (showNotice && stage) showError(stage === 'draw' ? '已停止等待。图片可能还在生成，稍后可以点“查看图片”。' : '已停止等待，稍后可以继续。');
}

function resetChat() {
  abortCurrent(false);
  releasePicture(state.result);
  state.messages = [];
  state.pendingChat = null;
  state.pendingPicture = null;
  state.result = null;
  $('foodPicture').removeAttribute('src');
  $('pictureResult').hidden = true;
  $('conversation').hidden = false;
  $('messageInput').value = '';
  $('saveStatus').textContent = '';
  updateShareControls();
  clearError();
  changeOpener();
}

function friendlyError(error, kind = 'picture') {
  if (FALLBACK_CODES.has(error.code)) return '聊天和画图暂时用不了，可以先随机选一道菜。';
  if (error.code === 'quota_reached') return '暂时达到使用限额了，可以先随机选一道菜。';
  if (error.code === 'upstream_busy') return '服务暂时忙不过来，稍后再试。';
  if (error.code === 'in_progress') {
    if (kind === 'chat') return '还在等回复，稍后可以点“查看回复”。';
    return state.pendingPicture?.plan ? '这张图还在生成，稍后可以点“查看图片”。' : '还在想画面，稍后可以点“继续画这张”。';
  }
  if (TERMINAL_REQUEST_CODES.has(error.code)) {
    if (kind === 'chat') return '没能拿到刚才的回复。可以点“再试一次”，不会自动重试。';
    const reason = ({
      plan_expired: '刚才的构思已经失效了。',
      variation_context_changed: '聊天内容变了，需要重新想一张。',
      image_no_longer_cached: '这张图已经画过，但现在取不到图片了。',
      previous_attempt_failed: '上次没有完成。',
      outcome_unknown: '还没能确认这次有没有完成。',
    })[error.code];
    return `${reason}这次不会自动重画。想再试，可以重新画一张。`;
  }
  if (error.status === 429) return '暂时无法继续，稍后再试。';
  if (error.name === 'AbortError') return '等得有点久了，还没收到结果。可以稍后再试。';
  if (navigator.onLine === false) return '网络好像断了，连上后可以继续。';
  return '刚才没有收到结果。你说的话还在，可以再试一次。';
}

async function post(path, body, timeout, ticket) {
  const controller = new AbortController();
  state.controller = controller;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: controller.signal, credentials: 'same-origin',
    });
    const payload = await response.json();
    if (ticket !== state.epoch) return null;
    if (!response.ok) {
      const error = new Error('Request failed');
      error.status = response.status;
      error.code = typeof payload?.error?.code === 'string' ? payload.error.code.toLowerCase() : '';
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timer);
    if (state.controller === controller) state.controller = null;
  }
}

async function runChat() {
  if (state.busy || !state.pendingChat) return;
  // A terminal attempt is replaced only after a deliberate retry click, never in a catch/retry loop.
  if (!state.pendingChat.requestId) state.pendingChat.requestId = newId();
  const ticket = ++state.epoch;
  clearError();
  setBusy('chat');
  try {
    const result = await post('/api/chat', state.pendingChat, 65000, ticket);
    if (ticket !== state.epoch || !result) return;
    if (typeof result.reply !== 'string' || !result.reply.trim() || countCharacters(result.reply) > 1200) throw new Error('Invalid reply');
    appendMessage('assistant', result.reply);
    state.pendingChat = null;
    focusLatest();
  } catch (error) {
    if (ticket === state.epoch) {
      if (TERMINAL_REQUEST_CODES.has(error.code)) state.pendingChat.requestId = null;
      showError(friendlyError(error, 'chat'), { fallback: FALLBACK_CODES.has(error.code) });
    }
  } finally {
    if (ticket === state.epoch) setBusy('');
  }
}

function sendMessage(event) {
  event.preventDefault();
  const content = $('messageInput').value.trim();
  if (state.busy || state.pendingChat || !content || countCharacters(content) > MAX_MESSAGE || userTurns() >= MAX_TURNS) return;
  // A changed conversation gets a new plan; a failed unchanged drawing keeps its IDs.
  state.pendingPicture = null;
  appendMessage('user', content);
  $('messageInput').value = '';
  state.pendingChat = { messages: snapshotMessages(), requestId: newId() };
  focusLatest();
  void runChat();
}

function imageBlob(dataUrl) {
  if (typeof dataUrl !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=\r\n]+$/.test(dataUrl)) throw new Error('Invalid image');
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return new Blob([Uint8Array.from(binary, character => character.charCodeAt(0))], { type: 'image/jpeg' });
}

function releasePicture(result) {
  if (!result) return;
  URL.revokeObjectURL(result.url);
  if (result.share?.url && result.share.url !== result.url) URL.revokeObjectURL(result.share.url);
}

function updateShareControls() {
  const file = state.result?.share;
  const save = $('savePicture');
  $('sharePicture').disabled = !file;
  $('sharePicture').textContent = file?.original ? '分享原图' : '分享给朋友';
  save.textContent = file?.original ? '保存原图' : '保存分享图';
  if (file) {
    save.href = file.url;
    save.download = file.name;
    save.removeAttribute('aria-disabled');
  } else {
    save.removeAttribute('href');
    save.removeAttribute('download');
    save.setAttribute('aria-disabled', 'true');
  }
}

async function preparePoster(result, image) {
  try {
    const blob = await createDrawingPoster(result, DRAWING_URL);
    if (state.result !== result) return;
    result.share = { blob, url: URL.createObjectURL(blob), name: 'tonights-strange-dinner-card.jpg' };
    $('saveStatus').textContent = '';
  } catch {
    if (state.result !== result) return;
    result.share = { blob: image, url: result.url, name: 'tonights-strange-dinner.jpg', original: true };
    $('saveStatus').textContent = '分享图没装好，可以先保存原图。';
  }
  updateShareControls();
}

function showPicture(data, plan) {
  if (!data.food?.name || typeof data.caption !== 'string') throw new Error('Invalid picture');
  const blob = imageBlob(data.image?.dataUrl);
  const url = URL.createObjectURL(blob);
  const previous = state.result;
  const result = {
    food: data.food, caption: data.caption, sceneDescription: data.sceneDescription,
    url, planToken: plan.planToken, share: null,
  };
  state.result = result;
  $('foodName').textContent = data.food.name;
  $('foodNative').textContent = data.food.nativeName || '';
  $('foodNative').hidden = !data.food.nativeName || data.food.nativeName === data.food.name;
  $('foodPicture').src = url;
  $('foodPicture').alt = data.sceneDescription || `${data.food.name}的插画`;
  $('pictureCaption').textContent = data.caption;
  const qr = $('pictureQR');
  try {
    paintDrawingQR(qr, DRAWING_URL);
    qr.hidden = false;
  } catch {
    qr.hidden = true;
  }
  $('conversation').hidden = true;
  $('pictureResult').hidden = false;
  $('saveStatus').textContent = '正在装裱分享图……';
  updateShareControls();
  releasePicture(previous);
  void preparePoster(result, blob);
  $('pictureResult').scrollIntoView({ behavior: 'auto', block: 'start' });
}

async function draw({ variation = false } = {}) {
  if (state.busy || userTurns() === 0) return;
  if (!state.pendingPicture || variation) {
    const previousPlanToken = variation ? state.result?.planToken : null;
    state.pendingPicture = {
      compose: {
        messages: snapshotMessages(), seed: newId(), requestId: newId(),
        ...(previousPlanToken ? { previousPlanToken, variation: 'new-mismatch' } : {}),
      },
      plan: null, drawId: newId(),
    };
  }
  const job = state.pendingPicture;
  const ticket = ++state.epoch;
  clearError();
  setBusy(job.plan ? 'draw' : 'compose');
  $('progressPanel').scrollIntoView({ behavior: 'auto', block: 'start' });
  try {
    if (!job.plan) {
      const plan = await post('/api/compose', job.compose, 85000, ticket);
      if (ticket !== state.epoch || !plan) return;
      if (typeof plan.planToken !== 'string' || !plan.planToken) throw new Error('Invalid plan');
      job.plan = plan;
      setBusy('draw');
    }
    revealNarration(job.plan, ticket);
    const result = await post('/api/draw', { planToken: job.plan.planToken, requestId: job.drawId }, 185000, ticket);
    if (ticket !== state.epoch || !result) return;
    showPicture(result, job.plan);
    state.pendingPicture = null;
    state.pendingChat = null;
  } catch (error) {
    if (ticket === state.epoch) {
      if (TERMINAL_REQUEST_CODES.has(error.code) || (!job.plan && FAILED_COMPOSE_CODES.has(error.code))) {
        state.pendingPicture = null;
        if (state.result && ['plan_expired', 'variation_context_changed'].includes(error.code)) state.result.planToken = null;
      }
      showError(friendlyError(error), { fallback: FALLBACK_CODES.has(error.code) });
    }
  } finally {
    if (ticket === state.epoch) setBusy('');
  }
}

async function sharePicture() {
  const result = state.result;
  const share = result?.share;
  if (!share) return;
  try {
    const file = new File([share.blob], share.name, { type: 'image/jpeg' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `今天吃${result.food.name}` });
      if (state.result === result) $('saveStatus').textContent = '';
    } else {
      $('savePicture').click();
    }
  } catch (error) {
    if (error.name !== 'AbortError' && state.result === result) $('saveStatus').textContent = '暂时分享不了，可以先存下来，再发给朋友。';
  }
}

$('messageForm').addEventListener('submit', sendMessage);
$('messageInput').addEventListener('input', updateControls);
$('messageInput').addEventListener('compositionstart', () => { state.composing = true; });
$('messageInput').addEventListener('compositionend', () => { state.composing = false; updateControls(); });
$('messageInput').addEventListener('keydown', event => {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || state.composing || event.keyCode === 229) return;
  event.preventDefault();
  if (!event.repeat && !$('sendMessage').disabled) $('messageForm').requestSubmit();
});
$('changeOpener').addEventListener('click', changeOpener);
$('drawImage').addEventListener('click', () => { void draw(); });
$('retryPicture').addEventListener('click', () => { void draw(); });
$('retryChat').addEventListener('click', () => { void runChat(); });
$('newMismatch').addEventListener('click', () => { void draw({ variation: true }); });
$('cancelRequest').addEventListener('click', () => abortCurrent());
$('resetChat').addEventListener('click', resetChat);
$('sharePicture').addEventListener('click', () => { void sharePicture(); });
$('continueChat').addEventListener('click', () => {
  if (state.busy) return;
  // Drawing may have succeeded after a chat failure. Reuse the actual generated caption
  // as visible context instead of inventing a reply or sending consecutive user messages.
  if (state.messages.at(-1)?.role === 'user' && state.result) {
    appendMessage('assistant', state.result.caption.trim()
      ? `刚才这张图的配文：${state.result.caption}`
      : `刚才画的是${state.result.food.name}。`);
  }
  $('conversation').hidden = false;
  $('pictureResult').hidden = true;
  clearError();
  updateControls();
  $('messageInput').focus({ preventScroll: true });
});
addEventListener('pagehide', () => abortCurrent(false));
addEventListener('pageshow', event => {
  if (event.persisted && (state.pendingChat || state.pendingPicture)) showError('接着刚才聊的来，也可以重新开始。');
});
try {
  const seen = JSON.parse(sessionStorage.getItem('foodpicker.openers.seen.v1') || '[]');
  if (Array.isArray(seen)) state.seenOpeners = seen.filter(value => typeof value === 'string').slice(-40);
} catch {}
resetChat();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js?v=42', { updateViaCache: 'none' }).catch(() => {});
