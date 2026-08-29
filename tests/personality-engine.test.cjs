const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'personality-engine.js'), 'utf8');
const context = { window: {}, URL, console };
vm.createContext(context);
vm.runInContext(source, context, { filename: 'personality-engine.js' });
const E = context.window.FOOD_PICKER_ENGINE;

assert.ok(E, 'engine should attach to window');
assert.equal(E.PROFILE_QUESTIONS.length, 5, 'five core projection questions');
assert.equal(E.DAILY_QUESTIONS.length, 2, 'two daily-state questions');
assert.equal(Object.keys(E.ARCHETYPES).length, 16, 'sixteen pot/persona archetypes');

const titles = Object.values(E.ARCHETYPES).map(item => `${item.pot}${item.defaultWord}${item.role}`);
assert.equal(new Set(titles).size, 16, 'default titles must be unique');
assert.ok(titles.includes('火锅梦想炼金师'));
assert.ok(titles.includes('砂锅昨日守夜人'));
const allSafeTitles = Object.values(E.ARCHETYPES).flatMap(item => item.words.map(([word]) => `${item.pot}${word}${item.role}`));
assert.equal(allSafeTitles.length, 96, 'six reviewed floating words per archetype');
assert.equal(new Set(allSafeTitles).size, 96, 'all reviewed title combinations must be unique');

for (const [key, archetype] of Object.entries(E.ARCHETYPES)) {
  const axis = { heat: archetype.center[0], texture: archetype.center[1], focus: archetype.center[2], meaning: archetype.center[3] };
  const profile = E.buildProfile([{ axis }], key);
  assert.equal(profile.key, key, `center vector should resolve ${key}`);
  assert.equal(profile.archetypeId, archetype.id);
}

const uncertain = E.getCalibrationQuestion([
  { axis: { heat: 2, texture: 1 } },
  { axis: { heat: -2, meaning: 1 } },
  { axis: { focus: 2, heat: 1 } }
]);
assert.ok(['heat', 'texture', 'focus', 'meaning'].includes(uncertain.calibrationAxis));
assert.equal(uncertain.options.length, 4);

const samples = [
  { name: '麻辣香锅', region: '中国' },
  { name: '潮汕砂锅粥', region: '中国' },
  { name: '兰州牛肉面', region: '中国' },
  { name: '清蒸鱼 + 时蔬 + 米饭', region: '中国' },
  { name: '英式炸鱼薯条', region: '欧洲' },
  { name: '烤蔬菜藜麦碗', region: '北美' },
  { name: '番茄炒蛋盖饭', region: '中国' },
  { name: '火腿奶酪三明治', region: '欧洲' }
];

for (const meal of samples) {
  const mapped = E.profileMeal(meal);
  assert.equal(mapped.name, meal.name);
  assert.ok(mapped.cross.length >= 1 && mapped.cross.length <= 3, `${meal.name} should expose 1-3 mappings`);
  assert.ok(mapped.tags.length > 0);
  for (const axis of E.AXES) assert.ok(mapped.axis[axis.key] >= -1 && mapped.axis[axis.key] <= 1);
}

const profile = E.buildProfile([
  { axis: { heat: -2, texture: 2 } },
  { axis: { focus: 2, meaning: -2 } },
  { axis: { heat: -2, texture: 1 } }
], 'hotpot-test');
const daily = E.buildDaily([
  { title: '给我一个明确的刺激', mood: { stimulus: 5, spicy: 3 } },
  { title: '今晚可以认真一点', mood: { ritual: 5, reward: 3 } }
]);
const fortune = E.fortuneFor('2026-08-28:test');
const ranked = E.rankMeals(samples, profile, daily, { social: true }, { seed: 'rank-test', fortune });
assert.equal(ranked.length, samples.length);
assert.ok(ranked[0].score >= ranked.at(-1).score);
assert.ok(ranked.every(item => item.breakdown.profile >= 0 && item.breakdown.profile <= 100));

const noSeafood = E.rankMeals(samples, profile, daily, { noSeafood: true }, { seed: 'filter-test', fortune });
assert.ok(noSeafood.every(item => !item.flags.seafood));

const draw = E.weightedDraw(ranked, 4, 'draw-test');
assert.equal(draw.length, 4);
assert.equal(new Set(draw.map(item => item.name)).size, draw.length, 'draw should not repeat meals');

const archetype = E.archetypeById(profile.archetypeId);
const word = E.chooseFloatWord(archetype, daily, 'float-test');
assert.ok(archetype.words.some(([candidate]) => candidate === word));

const share = E.makeShareUrl(samples[0], '火锅梦想炼金师', { origin: 'https://example.com', pathname: '/' });
assert.match(share, /^https:\/\/example\.com\//);
assert.match(share, /meal=/);

console.log(`personality-engine: ${Object.keys(E.ARCHETYPES).length} archetypes, ${samples.length} sample meals, all checks passed`);
