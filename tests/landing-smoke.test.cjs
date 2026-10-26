const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createRuntime, source } = require('./helpers/runtime.cjs');

{
  const { context, nodes } = createRuntime();
  vm.runInContext(source, context, { filename: 'psychic-app.js' });
  assert.equal(context.document.documentElement.dataset.appReady, 'true', 'app boots and marks itself ready');
  assert.equal(nodes.startBtn.disabled, false, 'psychology entrance stays enabled');
  assert.equal(nodes.randomBtn.disabled, false, 'random entrance stays enabled');

  nodes.startBtn.click();
  assert.equal(nodes.quiz.classList.contains('hidden'), false, 'psychology click opens quiz');
  assert.equal(nodes.intro.classList.contains('hidden'), true, 'psychology click leaves landing');
  assert.match(nodes.qStep.textContent, /^第 1 题 \/ 8$/, 'quiz renders the expected eight-step flow');
  assert.ok(nodes.qText.textContent.length > 0, 'first question renders copy');
  assert.equal(nodes.choices.children.length, 4, 'first question renders four choices');
  const firstQuestionRun = JSON.parse(context.localStorage.getItem('foodpicker.quiz-recent.v1'));
  assert.equal(firstQuestionRun.length, 5, 'the profile-question draw is remembered for the next run');

  const quizBackgrounds = new Set();
  for (let step = 0; step < 8; step += 1) {
    if (step < 5) {
      assert.equal(nodes.quizBackground.hidden, false, `profile question ${step + 1} shows background art`);
      assert.match(nodes.quizBackground.src, /^\/assets\/quiz\/quiz-[a-z-]+-v19\.webp$/, 'profile background uses the quiz art pool');
      quizBackgrounds.add(nodes.quizBackground.src);
    } else {
      assert.equal(nodes.quizBackground.hidden, true, 'calibration and daily questions keep a quiet background');
    }
    const firstChoice = nodes.choices.children[0];
    assert.ok(firstChoice, `choice exists at step ${step + 1}`);
    firstChoice.click();
  }
  assert.equal(quizBackgrounds.size, 5, 'the five profile questions receive five different backgrounds');
  assert.equal(nodes.result.classList.contains('hidden'), false, 'eight answers reach result');
  assert.ok(nodes.mealName.textContent.length > 0, 'psychology flow renders a meal');

  nodes.startBtn.click();
  const secondQuestionRun = JSON.parse(context.localStorage.getItem('foodpicker.quiz-recent.v1'));
  assert.equal(
    secondQuestionRun.some(questionId => firstQuestionRun.includes(questionId)),
    false,
    'a new run avoids the five profile questions shown immediately before it'
  );
}

{
  const { context, nodes } = createRuntime();
  vm.runInContext(source, context, { filename: 'psychic-app.js' });
  nodes.randomBtn.click();
  assert.equal(nodes.result.classList.contains('hidden'), false, 'random click opens result');
  assert.equal(nodes.intro.classList.contains('hidden'), true, 'random click leaves landing');
  assert.ok(nodes.mealName.textContent.length > 0, 'random flow renders a meal');
  assert.equal(nodes.psychVerdict.textContent, '不分析了，就它。', 'random flow remains the no-analysis path');
  assert.match(nodes.directArt.src, /^\/assets\/direct\/direct-food-0[1-5]-full-v19\.webp$/, 'random flow selects a complete direct result illustration');
}

(async () => {
  {
    const { context, nodes } = createRuntime();
    vm.runInContext(source, context, { filename: 'psychic-app.js' });
    nodes.randomBtn.click();
    const firstArt = nodes.directArt.src;
    assert.equal(nodes.resultArtFallback.hidden, false, 'direct fallback stays visible while art loads');
    assert.equal(nodes.directArt.hidden, true, 'direct art stays hidden while loading');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes.resultArtFallback.hidden, true, 'direct fallback hides after art loads');
    assert.equal(nodes.directArt.hidden, false, 'direct result art appears after loading');

    nodes.rerollBtn.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.notEqual(nodes.directArt.src, firstArt, 'direct reroll rotates to a different art asset');
  }

  const artDetail = {
    title: '砂锅 · 稳场派',
    verdict: '稳场先把今天接住。慢一点也没关系。吃完再往前走。',
    theme: 'light',
    backgroundUrl: '/assets/persona/r3/backgrounds/light-river.svg',
    potUrl: '/assets/persona/r3/pots/mock.png',
    characterUrl: '/assets/persona/r3/characters/mock.png'
  };

  {
    const { context, nodes } = createRuntime();
    let resolveArt;
    const pendingArt = new Promise(resolve => { resolveArt = resolve; });
    context.window.FoodPickerPersonaArt = {
      describe: () => artDetail,
      load: () => pendingArt
    };
    vm.runInContext(source, context, { filename: 'psychic-app.js' });
    nodes.startBtn.click();
    for (let step = 0; step < 8; step += 1) nodes.choices.children[0].click();

    assert.equal(nodes.resultArtFallback.hidden, false, 'fallback stays visible while persona art loads');
    assert.equal(nodes.personaBackground.hidden, true, 'background stays hidden while art loads');
    assert.equal(nodes.personaPot.hidden, true, 'pot stays hidden while art loads');
    assert.equal(nodes.personaCharacter.hidden, true, 'character stays hidden while art loads');

    resolveArt({ ...artDetail, image: {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes.resultArtFallback.hidden, true, 'fallback hides after every art layer loads');
    assert.equal(nodes.personaBackground.hidden, false, 'background appears after art load succeeds');
    assert.equal(nodes.personaPot.hidden, false, 'pot appears after art load succeeds');
    assert.equal(nodes.personaCharacter.hidden, false, 'character appears after art load succeeds');
  }

  {
    const { context, nodes } = createRuntime();
    context.console = { ...console, error: () => {} };
    context.window.FoodPickerPersonaArt = {
      describe: () => artDetail,
      load: () => Promise.reject(new Error('asset request failed'))
    };
    vm.runInContext(source, context, { filename: 'psychic-app.js' });
    nodes.startBtn.click();
    for (let step = 0; step < 8; step += 1) nodes.choices.children[0].click();
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(nodes.resultArtFallback.hidden, false, 'fallback remains visible when art loading fails');
    assert.equal(nodes.personaBackground.hidden, true, 'failed background stays hidden');
    assert.equal(nodes.personaPot.hidden, true, 'failed pot stays hidden');
    assert.equal(nodes.personaCharacter.hidden, true, 'failed character stays hidden');
  }

  console.log('landing smoke: both entrances, direct art rotation and persona-art fallback states work');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
