const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'psychic-app.js'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const localServer = fs.readFileSync(path.join(root, 'local-server.mjs'), 'utf8');

const assetUrls = [
  ...index.matchAll(/src="(\/assets\/landing\/[^"?]+\.png)"/g),
  ...app.matchAll(/['"](\/assets\/direct\/[^'"]+\.png)['"]/g)
].map(match => match[1]);

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
  assert.ok(width >= 900 && height >= 300, `${url} keeps a usable illustration crop`);
}

assert.ok(assetUrls.length >= 6, 'landing and direct result PNG assets are referenced');
new Set(assetUrls).forEach(inspectPng);

assert.match(index, /styles\.css\?v=16/, 'HTML requests the current stylesheet build');
assert.match(index, /psychic-app\.js\?v=16/, 'HTML requests the current app build');
assert.match(serviceWorker, /meal-picker-v16/, 'service worker cache is isolated from the broken release');
assert.match(serviceWorker, /direct-food-05-v2\.png/, 'repaired art is pre-cached');
assert.match(localServer, /'\.svg':\s*'image\/svg\+xml;/, 'local preview serves SVG with an image MIME type');

console.log(`asset integrity: ${new Set(assetUrls).size} complete PNGs and production cache v16 verified`);
