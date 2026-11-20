# FoodPicker · 今天吃什么

手机优先的吃饭社交玩具：随便聊几句，猜一道真实食物，再把对话中的一个细节拧成有审美的错配画。食物仍要认得出来，奇怪来自物体之间的关系。

2026-11-20，新流程在原 Sites 项目发布，已验证真实聊天、构思、出图和同一计划重取。开发基线先将线上 Sites 源码 d8c1e7 同步到 GitHub 提交 1da0628，保留既有首页、开场动画、美术和随机选菜。GitHub 源码提交与 Sites 发布是独立步骤。

## 当前流程

首页在苏醒动画后以「聊几句，画张图」为主入口，点击进入 /chat。文学摘录下方的「只想选菜」可以直接看随机推荐。

1. 本地从 **240 条静态开场白**中选一句；打开页面或换一句不调用模型。
2. 用户自由接话后才调用聊天模型。最多六条用户消息，每条最多 600 个 Unicode 码点；说过一句就可以点“就这些，画出来”，不用填满问卷。
3. 服务端生成严格的场景 JSON：真实食物、用户原话线索、错配对象及关系、构图、画风、气氛与允许发散的区域。明确口味和忌口优先；无线索时可以扩大范围猜，不把娱乐猜测写成人格诊断。
4. 从 **14 种风格、12 种错配方向、8 种气氛**中抽候选，模型再完成具体场景。库提供方向，不把用户的话套成固定菜品或固定画面。
5. 代码将校验通过的场景编译成最多 400 词、2,600 码点的图片提示词，保住食物、嫁接关系与受控发散空间，再调用图片 API。
6. 显示错配图、菜名与短配文。可保存 JPEG、调用手机系统分享，或保留同一道菜另想一种错配。分享复用已经生成的图，不再次出图。

默认聊天与构思均为 **gpt-6-luna**；图片为 **gpt-image-2.6-flare，1024×1536 / medium / JPEG**。聊天、构思与图片型号分别可配置，升级构思不必同时升级聊天。参数与预算见 [模型配置和费用](docs/models-and-costs.md)，材料见 [创意库说明](docs/creative-library.md)。

## 原有体验继续保留

- 随机选菜不需要付费 API；聊天或生图不可用时仍能从首页直接挑菜。
- 默认菜单保持中国可获得性取向；?menu=world 或 ?menu=international 可检查完整世界菜单，保留原语名称和搜索名。
- 原有苏醒动画、减动效处理、iPhone safe-area、随机结果及分享功能继续复用。
- 旧两轮聊天、问卷和人格结果代码留作历史兼容材料，没有活动入口；旧聊天 API 协议不再接到部署路由。
- PWA 缓存页面外壳与静态资产，不缓存聊天或生图 POST。离线打开页面不等于可以离线调用 AI。

## 主要文件

| 文件 | 职责 |
| --- | --- |
| index.html、psychic-app.js、styles.css | 原首页、聊天入口、随机选菜及分享 |
| wake-intro.js / .css、literary-intro.js / .css | 既有开场与文字动画 |
| chat.html、chat.mjs、play-chat.css | 新聊天、生图、取消、同请求取回与文件分享 |
| play/openers.mjs | 240 条本地开场白 |
| play/library.mjs | 风格、错配方向、气氛与可复现抽样 |
| play/schema.mjs、play/prompts.mjs | JSON 契约、输入校验、构思指令与提示词编译 |
| server/play-api.mjs、server/provider.mjs | 三个新 API 端点及 OpenAI 请求 |
| server/plan-token.mjs、server/play-store.mjs | 签名计划、请求去重、预算预留与结果恢复 |
| server/model-config.mjs | 可替换模型配置与 usage 费用估算 |
| worker/index.mjs、scripts/build.mjs | Sites Worker 与前端白名单构建 |
| drizzle/0000_food_play.sql | D1 请求日志和索引迁移 |
| food-data.js、food-policy.js | 完整菜单与随机选菜范围 |

项目保持零运行时依赖。server/food-chat.mjs、chat.js、chat-questions.mjs 和旧问卷继续留在源码中，新请求不调用它们。

## 本地运行与交接

    npm run dev
    npm test
    npm run build

默认访问 http://127.0.0.1:4173，聊天页面是 /chat。不提供 API 配置也能看页面、换开场白、使用随机选菜；真实聊天和绘图需要服务端配置。

生产环境需要 FOOD_PLAY_DB D1 处理跨实例预算与去重，FOOD_IMAGES R2 保存图片以便跨实例取回。本地测试若使用内存日志，必须显式设置 FOOD_ALLOW_EPHEMERAL_STATE=true；这个开关不能当作生产持久预算机制。具体配置、迁移、费用边界和下一轮验收见 [README_DEPLOY.md](README_DEPLOY.md)。

自动测试覆盖协议、状态、提示词约束、成本计算和既有功能回归。模拟 API 响应与构建成功不能证明真实模型的笑点、关系遵循、画质或耗时；本轮尚未做真实付费调用，也不宣称已经完成真实手机浏览器和生成图片的完整验收。

本轮 `npm test` 65 项通过，构建通过；手机尺寸布局、预期错误提示及验证边界见 [验收记录](docs/validation.md)。
