# 部署与验证

当前主流程为首页双入口：直接随机选菜，或聊两轮后得到拼图、判词和推荐菜。原八题问卷保留在代码和 DOM 中，没有活动入口。开场动画、文学引文、菜单和分享图继续复用。

## 运行与发布

零运行时依赖。Node 本地服务只公开前端白名单和 `assets/`，服务端从被 Git 忽略的 `.env.local` 读取 `OPENAI_API_KEY`；可选 `OPENAI_MODEL` 默认为 `gpt-5.4-nano`。密钥只在服务器上使用。

```sh
node local-server.mjs
npm test
npm run build
```

本地默认端口 4173。Sites 由 `.openai/hosting.json` 的原项目 ID 标识，已经从纯静态模式改为 Worker：`dist/server/index.js` 接收 `/api/chat`，`dist/client/` 是原页面和美术资源。产物不包含测试、文档、环境文件或源码目录。Sites 后台把 `OPENAI_API_KEY` 设为 secret，`OPENAI_MODEL` 为普通变量；修改环境后需要部署保存版本才能生效。GitHub 与 Sites 源代码仓库及发布是独立步骤。

Pages Functions 兼容入口是 `functions/api/chat.js`。纯静态托管仍可使用随机选菜，但聊天需要这个服务端接口。API 不可用时，服务器按本地关键词脚本返回相同结构，原随机选菜和分享功能也不依赖 API。

## 对话边界

- `chat-questions.mjs`保留十道原题，每次抽两道不同的题，题目不由AI生成。服务端只接受库内ID，并将首答、AI回应和题目ID签入15分钟有效会话；第二轮使用完整可信上下文。
- 模型生成50–100字回应和四轴、心情、胃口枚举。生活内容不是跑题，用户夹带的操作指令不可执行；不使用工具。第一轮接话，第二轮综合答案产生判词，复用原人物／锅／背景、选菜与分享。
- 提示词强调完整句子、清楚指代、具体依据和试探性主观判断，先作反应再贡献判断，避免复述用户、套话和编造动机。长度及结构验证失败会尝试一次重写，仍失败则明确说明未能细说，不假装模型已理解。自由生成的语义质量不能由JSON校验保证，仍需持续审读真实样例。
- 第一轮按短句分屏弹出，有字号层次；旧内容淡化向上退出，聊天区不累积记录、不出现滚动条。减少动态效果时保留静态分屏阅读。离开、重开可取消后续页面更新。第二轮结果静态显示。
- 每轮用户输入最多50码点；请求体4096字节。模型单次超时20秒、最多一次重写；浏览器45秒超时。无工具，`store:false`，不持久保存输入。可解码签名会话只在页面内存流转，不进入分享链接。
- 同源校验及每IP每Worker实例12次/分钟限流保留，非跨实例硬预算。输出仅通过textContent绘制，校验链接、标签及异常字段；密钥仅服务端持有。

## 缓存与回归

Service Worker v24预缓存应用外壳、聊天前端和共享题库，不缓存POST。检查覆盖接口校验、完整会话、普通生活内容、错误回退及原有菜单、拼图、分享和缓存。
浏览器环境没有视口调整接口，375×667、390×844、430×932三个精确尺寸仍需设备补充验收。

## 2026-11-05 接话修订
固定界面文字与十道题采用已对齐的口语稿。第一轮自然接话并生成一个相关追问，追问写入签名会话，第二轮按实际追问理解答案。口味和四轴判断仅用于幕后选菜；第一轮失败返回明确重试提示。末轮现有判词机制和人物美术保留，等待方向评审后另改。

首页入口顺序改为左上聊天、右下随机，聊天入口加大；客观限制和强偏好的最终推荐规则仍在讨论，尚未实现硬过滤。

结果判词目标60–80字、最大90字；卡片随文字高度排版并为人物留空间，分享图按实际行数画底板，不截掉末行。请求期间显示三点呼吸提示，成功、失败及离开时停止，减少动态效果时静态显示。


## Parameter selection and conversation (2026-11-05)
- AI never receives the menu. Final structured selection carries confidence, required/excluded/preferred dimension rules, and optional exhaustive equipment limits. Frontend filters hard requirements before weighted sampling. An empty pool remains empty; model failures permit retry instead of dropping constraints.
- `meal-parameters.js` owns v1 metadata and matching. Extend records through `meal.parameters` with a persistent `id`, version, cuisine, temperature, diet, complexity, method, kind and equipment. Equipment is OR-of-AND groups. Preserve the ID when renaming a dish. Null means unknown and never satisfies hard constraints. Existing names provide conservative initial tags; curated self-cooking records cover only a small initial subset. Delivery denotes ordering suitability, not geographic availability. Ingredients/inventory and allergy verification are not implemented.
- New metadata fields are additive. Add allowed AI values and server validation together when exposing a new dimension. Avoid inferring vegetarian ingredients from absence of meat in a name.
- Opening shows a real random catalog entry; accepting keeps that exact dish. Earlier intro plays at 2x speed through the first 10.4 seconds; final 吃什么 animation retains its timing.
- Conversation accumulates with upward following and a faded top; no visible scrollbar. AI waiting indicator is shown for each request. Final confidence wording is appended only when appropriate; never excuses hard-condition violations.

### Motion refinement
Opening pairs share a start time and enter from opposite diagonals; the 11s duration and final 吃什么 cue remain. Conversation phrases now have valid default animation delay and opacity-only fades; scroll anchoring is disabled to avoid immediate jumps when content grows. Waiting indicator reserves its height while fading. Screen changes fade out then in, with reduced-motion bypass.

### Unasked-question isolation fix
First-round model input now contains only stage, the displayed first question and the current user answer. The reserve question remains server-side compatibility metadata and is never provided as first-round conversational context. Round two includes the actual generated follow-up and the signed current conversation, not a previous test. Regression covers the idle-afternoon answer with the stalled-room reserve question and independent new sessions.

### Entry emphasis and typing
Primary chat entry has a 2.8s size/shadow breathing cycle and larger 35px copy. Its per-character reveal starts after the intro is removed and completes in about 3s. Questions, model replies and final verdict use a shared cancellable per-character fade with a blinking cursor during output; previous chat content stays mounted and follows upward. Reduced-motion displays complete text immediately.

### Forty conversational asides
The opening bank now contains 40 authored setup/hook entries. One is selected per page load and used both on the breathing entry card and as the actual first chat prompt; entering chat preserves that context without replaying it or drawing a different question. Entry copy reveals at about 95ms/character with punctuation pauses, with an accented final hook. First-turn model input still excludes the unasked reserve. Prompt voice is mildly sidetracked and curious, not service-oriented; meal constraints remain separate.

### Converging follow-up and meal reveal
The single generated follow-up must now connect the user's story to one missing, actionable meal dimension; it may not open a second unrelated topic. Explicit restrictions remain stronger than guesses, and unknowns stay unknown. After the opening, the already selected meal gets a 2.4s oversized blur/scale entrance and fades toward the actual heading before the aside begins. Both surfaces read the same meal. Reduced motion and intro=0 bypass this flourish.

### Enter submission and isolated meal interlude
Enter sends the short chat input (including the mobile send key); composing/isComposing/keyCode 229 guard Chinese IME confirmation, and held keys cannot resubmit. The meal reveal now uses the existing white light-stage SVG. Landing content stays invisible through the wake intro and meal-only reveal, then fades in together after cleanup.
