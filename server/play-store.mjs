import { PlayError } from './provider.mjs';

const quotaError = () => new PlayError('quota_reached', '今天先画到这儿，过一会儿再来看看。', 429);
const conflictError = () => new PlayError('request_conflict', '这次请求没对上，请回去重新开始。', 409);

export function budgetSettings(env = {}) {
  const number = (key, fallback, min, max) => {
    if (env[key] === undefined || env[key] === '') return fallback;
    const value = Number(env[key]);
    if (!Number.isFinite(value) || value < min || value > max) throw new TypeError(`Invalid ${key}`);
    return value;
  };
  return {
    monthlyBudgetMicros: Math.floor(number('FOOD_MONTHLY_BUDGET_USD', 10, 0, 1000) * 1000000),
    dailyImageLimit: Math.floor(number('FOOD_DAILY_IMAGE_LIMIT', 40, 0, 10000)),
  };
}

function recordOf(input) {
  return { ...input, period: new Date(input.now).toISOString().slice(0, 7), day: new Date(input.now).toISOString().slice(0, 10), status: 'pending', result: null, actualMicros: null, usage: null };
}

// Local previews can use this explicitly. Public deployments should bind FOOD_PLAY_DB.
// The journal never evicts live operation IDs: losing an image must not re-charge the plan.
export class MemoryPlayStore {
  constructor() { this.records = new Map(); }
  async reserve(input) {
    const old = this.records.get(input.id);
    if (old) {
      if (old.fingerprint !== input.fingerprint) throw conflictError();
      return { fresh: false, record: old };
    }
    const current = recordOf(input);
    const records = [...this.records.values()];
    const spent = records.filter(row => row.period === current.period).reduce((sum, row) => sum + (row.actualMicros ?? row.reserveMicros), 0);
    const dailyImages = records.filter(row => row.day === current.day && row.kind === 'draw').length;
    const recent = records.filter(row => row.actor === current.actor && row.now > current.now - 60000).length;
    const hourlyImages = records.filter(row => row.actor === current.actor && row.kind === 'draw' && row.now > current.now - 3600000).length;
    if (this.records.size >= 4000 || spent + current.reserveMicros > input.monthlyBudgetMicros || recent >= 12 || (current.kind === 'draw' && (dailyImages >= input.dailyImageLimit || hourlyImages >= 6))) throw quotaError();
    this.records.set(current.id, current);
    return { fresh: true, record: current };
  }
  async finish(id, { status, result = null, actualMicros = null, usage = null, errorCode = null }) {
    const record = this.records.get(id);
    if (record.status === 'complete') return;
    Object.assign(record, { status, result, actualMicros, usage, errorCode });
  }
}

// This single conditional INSERT is atomic across Worker isolates. There is no
// read-then-write budget race, and UNIQUE(id) coalesces duplicate image plans.
export const RESERVE_SQL = `INSERT OR IGNORE INTO food_play_requests
  (id, fingerprint, kind, actor, created_at, period, day, status, reserve_micros)
  SELECT ?, ?, ?, ?, ?, ?, ?, 'pending', ?
  WHERE (SELECT COALESCE(SUM(COALESCE(actual_micros, reserve_micros)), 0) FROM food_play_requests WHERE period = ?) + ? <= ?
    AND (SELECT COUNT(*) FROM food_play_requests WHERE actor = ? AND created_at > ?) < 12
    AND (? != 'draw' OR (
      (SELECT COUNT(*) FROM food_play_requests WHERE kind = 'draw' AND day = ?) < ?
      AND (SELECT COUNT(*) FROM food_play_requests WHERE kind = 'draw' AND actor = ? AND created_at > ?) < 6
    ))`;

export class D1PlayStore {
  constructor(db) { this.db = db; }
  async reserve(input) {
    const row = recordOf(input);
    const inserted = await this.db.prepare(RESERVE_SQL).bind(
      row.id, row.fingerprint, row.kind, row.actor, row.now, row.period, row.day, row.reserveMicros,
      row.period, row.reserveMicros, input.monthlyBudgetMicros, row.actor, row.now - 60000,
      row.kind, row.day, input.dailyImageLimit, row.actor, row.now - 3600000,
    ).run();
    if (inserted.meta?.changes === 1) return { fresh: true, record: row };
    const old = await this.db.prepare('SELECT * FROM food_play_requests WHERE id = ?').bind(row.id).first();
    if (!old) throw quotaError();
    if (old.fingerprint !== row.fingerprint) throw conflictError();
    return { fresh: false, record: { status: old.status, result: old.result_json ? JSON.parse(old.result_json) : null, errorCode: old.error_code, now: old.created_at, kind: old.kind } };
  }
  async finish(id, { status, result = null, actualMicros = null, usage = null, errorCode = null }) {
    await this.db.prepare("UPDATE food_play_requests SET status = ?, result_json = ?, actual_micros = ?, usage_json = ?, error_code = ? WHERE id = ? AND status != 'complete'")
      .bind(status, result ? JSON.stringify(result) : null, actualMicros, usage ? JSON.stringify(usage) : null, errorCode, id).run();
  }
}

const localStore = new MemoryPlayStore();
export function getPlayStore(env) {
  if (env.FOOD_PLAY_DB) return new D1PlayStore(env.FOOD_PLAY_DB);
  if (env.FOOD_ALLOW_EPHEMERAL_STATE === 'true') return localStore;
  throw new PlayError('not_configured', '厨房还没开火，先去随便选一道吧。', 503);
}
