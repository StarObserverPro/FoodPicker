import { STYLE_LIBRARY, MISMATCH_LIBRARY, ATMOSPHERE_LIBRARY } from './library.mjs';

export const PLAN_VERSION = 'food-play.v1';
export const PLAY_LIMITS = Object.freeze({ userCharacters: 600, assistantCharacters: 1200, userTurns: 6, messages: 13, bodyBytes: 32768, promptCharacters: 2600, promptWords: 400 });
const text = (maxLength, minLength = 1) => ({ type: 'string', minLength, maxLength });
const choices = values => ({ type: 'string', enum: values });
const list = (items, maxItems, minItems = 0) => ({ type: 'array', items, minItems, maxItems });
const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });

export const CHAT_SCHEMA = object({ reply: text(200), ready: { type: 'boolean' } });
export const PLAN_SCHEMA = object({
  version: choices([PLAN_VERSION]),
  food: object({ name: text(32), nativeName: text(60, 0), englishName: text(80), recognizableFeatures: list(text(65), 4, 2) }),
  clue: object({
    source: choices(['explicit', 'context', 'playful-guess']),
    evidence: list(text(120), 3),
    interpretation: text(180),
    mood: text(40),
    exploration: choices(['familiar', 'open', 'adventurous']),
    confidence: choices(['clear', 'tentative']),
    dietaryConstraints: list(text(70), 8),
  }),
  mismatch: object({
    id: choices(MISMATCH_LIBRARY.map(item => item.id)),
    anchorObject: text(100),
    bridge: text(180),
    transformation: text(300),
    preserve: text(140),
    secondaryEcho: text(100, 0),
  }),
  scene: object({ composition: text(180), environment: text(140), focalPoint: text(100) }),
  style: object({ id: choices(STYLE_LIBRARY.map(item => item.id)), extraDirection: text(100, 0) }),
  atmosphere: object({ id: choices(ATMOSPHERE_LIBRARY.map(item => item.id)), visibleCue: text(140) }),
  freedom: object({ allow: text(140), keep: text(100) }),
  caption: text(64),
  sceneDescription: text(180),
});

// Schema validation remains necessary even when the upstream uses strict JSON.
export function validateSchema(value, schema, path = 'value') {
  if (schema.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: object required`);
    for (const key of schema.required) if (!Object.hasOwn(value, key)) throw new Error(`${path}.${key}: missing`);
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(schema.properties, key)) throw new Error(`${path}.${key}: unknown field`);
      validateSchema(value[key], schema.properties[key], `${path}.${key}`);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length < schema.minItems || value.length > schema.maxItems) throw new Error(`${path}: invalid array`);
    value.forEach((item, index) => validateSchema(item, schema.items, `${path}[${index}]`));
  } else if (schema.type === 'string') {
    if (typeof value !== 'string') throw new Error(`${path}: string required`);
    const length = [...value].length;
    if (length < (schema.minLength ?? 0) || length > (schema.maxLength ?? Infinity) || (length && !value.trim())) throw new Error(`${path}: invalid length`);
    if (/\p{Cc}/u.test(value) || /<\/?(?:script|iframe)\b|sk-proj-/i.test(value)) throw new Error(`${path}: invalid text`);
  } else if (schema.type === 'boolean' && typeof value !== 'boolean') throw new Error(`${path}: boolean required`);
  if (schema.enum && !schema.enum.includes(value)) throw new Error(`${path}: invalid choice`);
  return value;
}

export function validateMessages(messages, { requireLastUser = false } = {}) {
  if (!Array.isArray(messages) || !messages.length || messages.length > PLAY_LIMITS.messages) throw new Error('invalid messages');
  let userTurns = 0;
  let previous = null;
  const result = messages.map(message => {
    if (!message || Object.keys(message).sort().join(',') !== 'content,role' || !['user', 'assistant'].includes(message.role)) throw new Error('invalid role');
    const cap = message.role === 'user' ? PLAY_LIMITS.userCharacters : PLAY_LIMITS.assistantCharacters;
    if (typeof message.content !== 'string' || !message.content.trim() || [...message.content].length > cap) throw new Error('invalid content');
    if (previous === message.role) throw new Error('messages must alternate');
    previous = message.role;
    if (message.role === 'user') userTurns++;
    return { role: message.role, content: message.content.trim() };
  });
  if (userTurns < 1 || userTurns > PLAY_LIMITS.userTurns || (requireLastUser && previous !== 'user')) throw new Error('invalid turns');
  return { messages: result, userTurns };
}

export function validatePlan(plan, messages, previousFood = null) {
  validateSchema(plan, PLAN_SCHEMA, 'plan');
  const userText = messages.filter(message => message.role === 'user').map(message => message.content);
  if (plan.clue.evidence.some(quote => !userText.some(content => content.includes(quote)))) throw new Error('invented evidence');
  if (plan.clue.source !== 'playful-guess' && !plan.clue.evidence.length) throw new Error('missing evidence');
  if (plan.clue.source === 'playful-guess' && plan.clue.confidence !== 'tentative') throw new Error('guess must stay tentative');
  if (previousFood && (plan.food.name !== previousFood.name || plan.food.englishName !== previousFood.englishName)) throw new Error('variation changed food');
  return plan;
}
