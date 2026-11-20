import '../qr-code.js?v=38';

const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",system-ui,sans-serif';
const PAPER = '#fbf8f0';
const INK = '#2e2b29';
const ACCENT = '#943b30';
const MUTED = '#655b52';
const QR_TEXT = '扫码也画一张';

export function paintDrawingQR(canvas, url) {
  const context = canvas.getContext('2d');
  globalThis.FoodPickerQR.paint(context, url, 0, 0, canvas.width, { dark: INK });
}

function wrap(context, text, width) {
  const lines = [];
  let line = '';
  for (const character of text) {
    const next = line + character;
    if (line && context.measureText(next).width > width) {
      lines.push(line.trimEnd());
      line = character.trimStart();
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function paintLines(context, lines, x, y, leading) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * leading));
}

export async function createDrawingPoster({ url, food, caption }, target) {
  const art = new Image();
  art.src = url;
  await art.decode();

  const canvas = document.createElement('canvas');
  const inset = 48;
  const artWidth = 1024;
  const artHeight = Math.round(artWidth * art.naturalHeight / art.naturalWidth);
  const qrSize = 225;
  canvas.width = artWidth + inset * 2;
  const context = canvas.getContext('2d');
  if (!context || !artHeight) throw new Error('Poster canvas unavailable');

  const dishFont = `700 65px ${FONT}`;
  const nativeFont = `400 31px ${FONT}`;
  const captionFont = `500 42px ${FONT}`;
  context.font = dishFont;
  const dishLines = wrap(context, food.name, artWidth);
  context.font = nativeFont;
  const nativeLines = food.nativeName && food.nativeName !== food.name
    ? wrap(context, food.nativeName, artWidth) : [];
  context.font = captionFont;
  const captionLines = wrap(context, caption, artWidth - qrSize - 48);
  const dishY = 94;
  const nativeY = dishY + dishLines.length * 77 + 2;
  const artY = nativeY + nativeLines.length * 39 + 25;
  const footerY = artY + artHeight + 37;
  const footerHeight = Math.max(captionLines.length * 59, qrSize + 37);
  canvas.height = footerY + footerHeight + 36;

  context.textBaseline = 'top';
  context.fillStyle = PAPER;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = ACCENT;
  context.font = `600 28px ${FONT}`;
  context.fillText('今天吃什么', inset, 47);
  context.fillStyle = INK;
  context.font = dishFont;
  paintLines(context, dishLines, inset, dishY, 77);
  context.fillStyle = MUTED;
  context.font = nativeFont;
  paintLines(context, nativeLines, inset, nativeY, 39);
  context.drawImage(art, inset, artY, artWidth, artHeight);

  context.fillStyle = INK;
  context.font = captionFont;
  paintLines(context, captionLines, inset, footerY + Math.floor((footerHeight - captionLines.length * 59) / 2), 59);
  const qrX = canvas.width - inset - qrSize;
  globalThis.FoodPickerQR.paint(context, target, qrX, footerY, qrSize, { dark: INK });
  context.fillStyle = MUTED;
  context.textAlign = 'center';
  context.font = `500 25px ${FONT}`;
  context.fillText(QR_TEXT, qrX + qrSize / 2, footerY + qrSize + 11);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob?.type === 'image/jpeg') resolve(blob);
      else reject(new Error('Poster encoding failed'));
    }, 'image/jpeg', .94);
  });
}
