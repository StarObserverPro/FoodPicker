import test from 'node:test';
import assert from 'node:assert/strict';
import {getModelConfig, estimateTextCost, estimateImageCost} from '../server/model-config.mjs';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} differs from ${expected}`);

test('model defaults and independent planner upgrade do not read credentials', () => {
  const env = {get OPENAI_API_KEY() { throw new Error('Do not inspect credentials'); }};
  assert.deepEqual(getModelConfig(env), {
    chatModel: 'gpt-6-luna', plannerModel: 'gpt-6-luna', reasoning: 'low',
    imageModel: 'gpt-image-2.6-flare', imageSize: '1024x1536',
    imageQuality: 'medium', imageFormat: 'jpeg', imageCompression: 80
  });
  const upgraded = getModelConfig({FOOD_PLANNER_MODEL: 'gpt-6.2-sol', FOOD_REASONING_EFFORT: 'medium'});
  assert.equal(upgraded.chatModel, 'gpt-6-luna');
  assert.equal(upgraded.plannerModel, 'gpt-6.2-sol');
  assert.equal(upgraded.reasoning, 'medium');
  assert.equal(getModelConfig({FOOD_CHAT_MODEL: 'gpt-future-model'}).plannerModel, 'gpt-future-model');
  assert.equal(getModelConfig({FOOD_IMAGE_QUALITY: 'high'}).imageQuality, 'high');
});

test('invalid explicit configuration fails instead of quietly changing a model', () => {
  for (const env of [null, [], {FOOD_CHAT_MODEL: 'invalid model'}, {FOOD_PLANNER_MODEL: 42},
    {FOOD_IMAGE_MODEL: '\n'}, {FOOD_REASONING_EFFORT: 'none'}, {FOOD_IMAGE_QUALITY: 'auto'}]) {
    assert.throws(() => getModelConfig(env), TypeError);
  }
});

test('text estimates separate cache writes and reads and count reasoning only once', () => {
  const usage = {input_tokens: 3000, input_tokens_details: {cached_tokens: 1000, cache_write_tokens: 1000},
    output_tokens: 1000, output_tokens_details: {reasoning_tokens: 600}};
  close(estimateTextCost(usage, 'gpt-6-luna'), 0.000735);
  close(estimateTextCost({input_tokens: 3000, output_tokens: 1000}, 'gpt-6.2-sol'), 0.016);
  close(estimateTextCost({input_tokens: 272001, output_tokens: 1000}, 'gpt-6-luna'), 0.0551502);
});

test('image estimate uses the image Standard rates and rejects unpriced mixed output', () => {
  const usage = {input_tokens: 400, input_tokens_details: {text_tokens: 400, image_tokens: 0}, output_tokens: 1132};
  close(estimateImageCost(usage, 'gpt-image-2.6-flare'), 0.03596);
  close(estimateImageCost({...usage, input_tokens: 500, input_tokens_details: {text_tokens: 400, image_tokens: 100}}, 'gpt-image-2.6-sunburst'), 0.03676);
  assert.equal(estimateImageCost({...usage, output_tokens_details: {image_tokens: 1100, text_tokens: 32}}, 'gpt-image-2.6-flare'), null);
});

test('missing, malformed, or unknown usage is not reported as a free request', () => {
  for (const usage of [null, {}, {input_tokens: -1, output_tokens: 2}, {input_tokens: 1, output_tokens: Infinity},
    {input_tokens: 1, output_tokens: 2, input_tokens_details: {cached_tokens: 2}}]) {
    assert.equal(estimateTextCost(usage, 'gpt-6-luna'), null);
  }
  assert.equal(estimateTextCost({input_tokens: 1, output_tokens: 2}, 'gpt-future-model'), null);
  assert.equal(estimateTextCost({input_tokens: 1, output_tokens: 2}, 'toString'), null);
  assert.equal(estimateImageCost(null, 'gpt-image-2.6-flare'), null);
  assert.equal(estimateImageCost({input_tokens: 400, output_tokens: 1132}, 'gpt-image-2.6-flare'), null);
  assert.equal(estimateTextCost({input_tokens: 0, output_tokens: 0}, 'gpt-6-luna'), 0);
  assert.equal(estimateImageCost({input_tokens: 0, input_tokens_details: {text_tokens: 0, image_tokens: 0}, output_tokens: 0}, 'gpt-image-2.6-flare'), 0);
});
