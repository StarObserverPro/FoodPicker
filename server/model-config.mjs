// Standard processing, USD per one million tokens; checked 2026-11-19.
// Sources and estimation assumptions: ../docs/models-and-costs.md.
export const TEXT_COST_RATES = Object.freeze({
  'gpt-6-luna': Object.freeze({input: 0.10, output: 0.50, cachedInput: 0.01, cacheWrite: 0.125}),
  'gpt-6.1-terra': Object.freeze({input: 1.00, output: 5.00, cachedInput: 0.05, cacheWrite: 1.25}),
  'gpt-6.2-sol': Object.freeze({input: 2.00, output: 10.00, cachedInput: 0.10, cacheWrite: 2.50})
});

export const IMAGE_COST_RATES = Object.freeze({
  'gpt-image-2.6-flare': Object.freeze({textInput: 5.00, imageInput: 8.00, imageOutput: 30.00}),
  'gpt-image-2.6-sunburst': Object.freeze({textInput: 5.00, imageInput: 8.00, imageOutput: 30.00})
});

const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const REASONING = new Set(['low', 'medium', 'high']);
const IMAGE_QUALITY = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
const tokenCount = value => Number.isSafeInteger(value) && value >= 0;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function configuredString(env, name, fallback) {
  const value = env[name];
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a non-empty string`);
  return value.trim();
}

function modelId(env, name, fallback) {
  const value = configuredString(env, name, fallback);
  if (!MODEL_ID.test(value)) throw new TypeError(`${name} is not a valid model ID`);
  return value;
}

/** Read only public model settings. Credentials are deliberately not accessed here. */
export function getModelConfig(env = {}) {
  if (!record(env)) throw new TypeError('Model configuration must be an object');
  const chatModel = modelId(env, 'FOOD_CHAT_MODEL', 'gpt-6-luna');
  const plannerModel = modelId(env, 'FOOD_PLANNER_MODEL', chatModel);
  const reasoning = configuredString(env, 'FOOD_REASONING_EFFORT', 'low');
  const imageModel = modelId(env, 'FOOD_IMAGE_MODEL', 'gpt-image-2.6-flare');
  const imageQuality = configuredString(env, 'FOOD_IMAGE_QUALITY', 'medium');
  if (!REASONING.has(reasoning)) throw new TypeError('FOOD_REASONING_EFFORT must be low, medium, or high');
  if (!IMAGE_QUALITY.has(imageQuality)) throw new TypeError('FOOD_IMAGE_QUALITY must be low, medium, high, xhigh, or max');
  return Object.freeze({
    chatModel, plannerModel, reasoning, imageModel,
    imageSize: '1024x1536', imageQuality, imageFormat: 'jpeg', imageCompression: 80
  });
}

/** Estimate Standard USD, assuming the default 30-minute cache retention. */
export function estimateTextCost(usage, model) {
  const rates = Object.hasOwn(TEXT_COST_RATES, model) ? TEXT_COST_RATES[model] : null;
  if (!rates || !record(usage) || !tokenCount(usage.input_tokens) || !tokenCount(usage.output_tokens)) return null;
  const details = usage.input_tokens_details;
  if (details !== undefined && details !== null && !record(details)) return null;
  const cached = details?.cached_tokens ?? 0;
  const written = details?.cache_write_tokens ?? 0;
  if (!tokenCount(cached) || !tokenCount(written) || cached + written > usage.input_tokens) return null;
  const ordinary = usage.input_tokens - cached - written;
  const longContext = usage.input_tokens > 272_000;
  const inputCost = (ordinary * rates.input + cached * rates.cachedInput + written * rates.cacheWrite) * (longContext ? 2 : 1);
  // output_tokens already includes reasoning_tokens. Never add reasoning a second time.
  const outputCost = usage.output_tokens * rates.output * (longContext ? 1.5 : 1);
  return (inputCost + outputCost) / 1_000_000;
}

/** Estimate a direct Images API raster request; no mainline-model/tool charge. */
export function estimateImageCost(usage, model) {
  const rates = Object.hasOwn(IMAGE_COST_RATES, model) ? IMAGE_COST_RATES[model] : null;
  if (!rates || !record(usage) || !tokenCount(usage.input_tokens) || !tokenCount(usage.output_tokens)) return null;
  const details = usage.input_tokens_details;
  if (!record(details) || !tokenCount(details.text_tokens) || !tokenCount(details.image_tokens)) return null;
  if (details.text_tokens + details.image_tokens !== usage.input_tokens) return null;
  const outputDetails = usage.output_tokens_details;
  // SVG and other mixed-output workflows need a separate authoring-model estimate.
  if (outputDetails !== undefined && outputDetails !== null) {
    if (!record(outputDetails) || !tokenCount(outputDetails.image_tokens) ||
      !tokenCount(outputDetails.text_tokens) || outputDetails.text_tokens !== 0 ||
      outputDetails.image_tokens !== usage.output_tokens) return null;
  }
  return (details.text_tokens * rates.textInput + details.image_tokens * rates.imageInput + usage.output_tokens * rates.imageOutput) / 1_000_000;
}
