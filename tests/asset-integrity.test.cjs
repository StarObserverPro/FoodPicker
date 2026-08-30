const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'psychic-app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const localServer = fs.readFileSync(path.join(root, 'local-server.mjs'), 'utf8');

const assetUrls = [
  ...index.matchAll(/src="(\/assets\/landing\/[^"?]+\.png)"/g),
  ...app.matchAll(/['"](\/assets\/direct\/[^'"]+\.png)['"]/g),
  ...app.matchAll(/['"](\/assets\/quiz\/[^'"]+\.png)['"]/g)
].map(match => match[1]);

const expectedHashes = Object.freeze({
  '/assets/direct/direct-food-01-full.png': 'f660b4ec2d383ac1e9a160a2decc8ac4f284cf9eacd633224e78c424921df518',
  '/assets/direct/direct-food-02-full.png': '7302691bf53c6c6e1372617ec64d04d228ca10f58ee43beb1ab16452e96926b9',
  '/assets/direct/direct-food-03-full.png': '4fb9e964586bc7ca051e212fc4f1aed5b638ba93a4e5ae0a5477ebe80199d28a',
  '/assets/direct/direct-food-04-full.png': 'd7984c5f1bd4867ae680d6869bfaee82246edac44c541db81c56f9bc65d94642',
  '/assets/direct/direct-food-05-full.png': 'e5dd69ac793e5e7935ae84b8f39641936cdb2bc612b75e916b3cced0eebd8a81',
  '/assets/landing/hotpot-mj-full.png': '2ce56f2fd5145226a1755f2e676f41270a0180387c8eb7a9ba721788ce8a0106',
  '/assets/quiz/quiz-ingredients-border.png': '8974d879a8b6185fa7e39921e2d786bd06652d45f44f3b007147dc2ca70f4f42',
  '/assets/quiz/quiz-table-spread.png': '6e977eaed201ca539acbb6e8bc33acc815aa6aa4d460b81d9eda8a2dbd3d349b',
  '/assets/quiz/quiz-breakfast-place.png': '7b529f2457b104faf6d199558bc47107768e9138dab890b1d40d2138ce07a159',
  '/assets/quiz/quiz-scattered-plates.png': 'a7a9225f77d8e6daaf6cf809409758b42f46cfaf025e3a763b2baa72d54a6e83',
  '/assets/quiz/quiz-dim-sum-table.png': 'd621afda49bfbbaa7b6075ee2a338463911ee0a80053229d375e737f5b8684f3',
  '/assets/quiz/quiz-pastel-feast.png': '93891043ee2ff366815dce53e78a475eb86aeb853e0e983ecdda1f85e4012f29'
});

function inspectPng(url) {
  const file = path.join(root, url.replace(/^\//, ''));
  assert.equal(fs.existsSync(file), true, `${url} exists`);
  const bytes = fs.readFileSync(file);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${url} has a PNG signature`);

  let offset = 8;
  let width = 0;
  let height = 0;
  let ended = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const next = offset + 12 + length;
    assert.ok(next <= bytes.length, `${url} does not end inside ${type || 'a PNG chunk'}`);
    if (type === 'IHDR') {
      width = bytes.readUInt32BE(offset + 8);
      height = bytes.readUInt32BE(offset + 12);
    }
    offset = next;
    if (type === 'IEND') {
      ended = true;
      break;
    }
  }

  assert.equal(ended, true, `${url} has a complete IEND chunk`);
  assert.equal(offset, bytes.length, `${url} has no truncated or trailing payload`);
  assert.equal(width, 928, `${url} keeps the uploaded width`);
  assert.equal(height, 1232, `${url} keeps the uploaded height`);
  assert.equal(
    crypto.createHash('sha256').update(bytes).digest('hex'),
    expectedHashes[url],
    `${url} is byte-for-byte the approved upload`
  );
}

assert.equal(new Set(assetUrls).size, 12, 'landing, direct-result and six quiz PNG assets are referenced');
new Set(assetUrls).forEach(inspectPng);

assert.match(index, /styles\.css\?v=18/, 'HTML requests the current stylesheet build');
assert.match(index, /psychic-app\.js\?v=18/, 'HTML requests the current app build');
assert.match(serviceWorker, /meal-picker-v18/, 'service worker cache is isolated from earlier releases');
assert.match(serviceWorker, /direct-food-05-full\.png/, 'complete art is pre-cached');
assert.match(serviceWorker, /quiz-pastel-feast\.png/, 'quiz art is pre-cached');
assert.match(app, /drawImageContain/, 'share cards preserve the complete illustration');
assert.match(app, /shadowColor = 'rgba\(0,0,0,\.72\)'/, 'share-card white text receives a dark shadow');
assert.match(app, /contrast\.addColorStop\(1, 'rgba\(24,18,14,\.84\)'\)/, 'share-card text sits on a strong contrast gradient');
assert.match(app, /fillStyle = 'rgba\(255,255,255,\.70\)'/, 'share-card verdict panel lets the illustration show through');
assert.match(app, /今天吃什么，这是个问题。/, 'share-card footer uses the approved question copy');
assert.doesNotMatch(app, /扫码，再让运气管一顿。|完整结果都在这张图里。/, 'retired share-card footer copy stays removed');
assert.match(styles, /object-fit:contain/, 'quiz backgrounds preserve their complete composition');
assert.match(styles, /opacity:\.22/, 'quiz backgrounds remain translucent behind the questions');
assert.doesNotMatch(app, /direct-food-0[1-5]-v2\.png/, 'the cropped assets are no longer referenced');
assert.match(localServer, /'\.svg':\s*'image\/svg\+xml;/, 'local preview serves SVG with an image MIME type');

console.log(`asset integrity: ${new Set(assetUrls).size} original 928x1232 PNGs and production cache v18 verified`);
