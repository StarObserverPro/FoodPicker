const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../persona-art.js'), 'utf8');
const context = { window: {}, Set, Map, Object, Promise };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'persona-art.js' });

const art = context.window.FoodPickerPersonaArt;
const entries = Object.entries(art.manifest);

assert.equal(entries.length, 16, 'all sixteen pot personas have runtime art');
assert.equal(new Set(entries.map(([, item]) => item.characterUrl)).size, 16, 'each persona has its own character');
assert.equal(new Set(entries.map(([, item]) => item.potUrl)).size, 16, 'each persona has its own pot');

for (const [id, item] of entries) {
  const profile = {
    archetypeId: id,
    word: '今日',
    archetype: { id, pot: '测试锅', defaultWord: '今日' }
  };
  const detail = art.describe(profile, 0);
  const verdicts = art.verdicts(profile);

  assert.ok(detail, `${id} can be described before images load`);
  assert.match(detail.title, /^测试锅 · 今日/, `${id} title includes the floating word`);
  assert.ok(detail.verdict.includes('今日'), `${id} verdict includes the floating word`);
  assert.equal(item.verdictCount, 3, `${id} exposes three verdict variants`);
  assert.equal(verdicts.length, 3, `${id} renders three verdict variants`);
  assert.equal(new Set(verdicts).size, 3, `${id} verdict variants are distinct`);
  assert.ok(verdicts.every(verdict => verdict.includes('今日')), `${id} alternatives include the floating word`);
  assert.ok((detail.verdict.match(/[。！？]/g) || []).length >= 2, `${id} has a complete persona verdict`);

  for (const url of [item.characterUrl, item.potUrl, detail.backgroundUrl]) {
    const local = path.join(__dirname, '..', url.replace(/^\//, ''));
    assert.equal(fs.existsSync(local), true, `${url} exists`);
  }
}

const backgrounds = [
  ['真相', 'dark-bridge.svg'],
  ['梦想', 'light-stage.svg'],
  ['昨日', 'dark-lantern.svg'],
  ['余温', 'light-river.svg']
];
for (const [word, file] of backgrounds) {
  const detail = art.describe({
    archetypeId: 'iron-peak-origin',
    word,
    archetype: { id: 'iron-peak-origin', pot: '铁锅' }
  });
  assert.ok(detail.backgroundUrl.endsWith(file), `${word} uses ${file}`);
}

console.log('persona art: 16 characters, 16 pots, 4 backgrounds and 48 verdict variants are wired');
