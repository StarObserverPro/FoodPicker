# 配置、部署交接与验证

新流程于 2026-11-20 首次发布至既有 Sites 项目的 v37，并完成一次真实 OpenAI 调用链路。源码从 Sites d8c1e7 同步到 GitHub 基线 1da0628，GitHub 合并与 Sites 发布分别核验。

## 构建与路由

零运行时依赖，使用 Node 内置能力：

    npm run dev
    npm test
    npm run build

本地服务默认端口 4173，PORT 可覆盖。首页 / 保留开场动画，以「聊几句，画张图」进入 /chat，「只想选菜」为备选入口。Sites 将 /chat.html 重定向到 /chat，Service Worker 预缓存 /chat 并把重定向交回浏览器。构建生成 dist/client/ 前端白名单资产、dist/server/index.js Worker，以及 dist/.openai/hosting.json。只有静态开场库直接发给浏览器，创意库、schema 和提示词随服务端打包。

不要将 server/、环境文件或源文档作为静态目录发布。scripts/bundle-worker.mjs 仅处理本项目的有限 ESM 语法；新增不支持的 import/export 会使构建失败，不要绕过错误发布。

| 路由 | 行为 |
| --- | --- |
| POST /api/chat | 接收当前对话，生成短回复 |
| POST /api/compose | 生成并校验场景 JSON，返回签名计划、绘制时逐句显示的旁白及题跋 |
| POST /api/draw | 接受签名计划，用编译好的提示词调用图片 API |

worker/index.mjs 和本地服务接入这三条路由；functions/api/chat.js、compose.js、draw.js 为 Pages 适配器，使用同一个后端。其余 /api/ 请求在 Sites Worker 中返回 404。server/food-chat.mjs、旧问卷和 chat.js 留作归档，/api/legacy-chat 没有部署路由；旧文件存在不代表旧接口仍可用。

## 服务端设置

| 设置 | 默认或要求 |
| --- | --- |
| OPENAI_API_KEY | 服务端 secret，新聊天与生图必需 |
| FOOD_SIGNING_SECRET | 可选独立 secret；未设时从 API key 派生 HMAC key |
| FOOD_CHAT_MODEL | gpt-6-luna |
| FOOD_PLANNER_MODEL | 跟随聊天型号；可独立设为 gpt-6.2-sol |
| FOOD_REASONING_EFFORT | low；允许 low / medium / high |
| FOOD_IMAGE_MODEL | gpt-image-2.6-flare |
| FOOD_IMAGE_QUALITY | medium；允许 low / medium / high / xhigh / max |
| FOOD_MONTHLY_BUDGET_USD | 本应用日志预算默认 $10，0 可停止新调用 |
| FOOD_DAILY_IMAGE_LIMIT | 默认每天 40 次新绘图请求 |
| FOOD_ALLOW_EPHEMERAL_STATE | 默认不启用；仅显式字符串 true 允许无 D1 的本地内存日志 |

图片固定为 1024x1536、jpeg、output_compression: 80，每次一张。OPENAI_MODEL 属于旧配置，新流程不读取。换型号前确认账户实际可用性；未知型号的费用记为未计量，不冒充 $0。

本地服务从进程环境及被 Git 忽略的 .env.local 读取设置。.env.local 使用简单 KEY=value 行，不加 export、引号或行末注释；文件同名值覆盖进程环境。真实本地调用需提供服务端 key，并显式启用 FOOD_ALLOW_EPHEMERAL_STATE=true，或使用可绑定 D1 的运行环境。仅看页面、换开场白和随机选菜无需 key。

签名 secret 或作为签名来源的 API key 变更会让已有计划失效。签名计划有效期一小时，用于当前绘图和变体，不是公开图片 URL，不应放进分享链接。

## 持久存储与迁移

源清单 .openai/hosting.json 当前声明：

    {
      "d1": "FOOD_PLAY_DB",
      "project_id": "appgprj_6a91f88719dc81919c25c17b4703d49b",
      "r2": "FOOD_IMAGES"
    }

通过既有 Sites 发布流程在同一项目配置两个绑定。部署包带上 **drizzle/0000_food_play.sql**，由 Sites 发布时应用到 FOOD_PLAY_DB，创建 food_play_requests 和相关索引。v37 已验证线上表及 R2 成图写入。后续 schema 变更追加迁移。

**D1 必需。** 新收费请求先在 D1 原子检查额度并占位；没有 D1 且未明确启用本地内存模式时返回未配置，不调用模型。内存模式重启会失去记录，不可承担公开站点的跨实例去重和预算。

**R2 保存成图。** 图片写入 FOOD_IMAGES，D1 保存对应 key；不同实例上重试同一计划可以取回已生成图片。未绑定 R2 或存储失败时仍可返回本次成图，但后续跨实例恢复没有保证，不能为补图再次调用模型。R2 对象不是自动公开的分享链接，当前前端分享 JPEG 文件。

D1 记录请求 ID、哈希访客标识、时间、状态、usage、费用估算和短结果，不写完整聊天和证据原文。生成回复、配文、签名计划等结果可能含从聊天推导的内容。前端只把最近展示的开场 ID 放在 sessionStorage，对话和计划留在页面内存。

## 费用与重试边界

预算按 UTC 自然月、日限额按 UTC 日期统计。同一哈希访客每分钟最多 12 次新请求，每小时最多 6 次新绘图。访客标识由 Cloudflare 提供的 IP、当天和 secret 派生，不存明文 IP。

新请求先预留估计费用，再按 usage 对账。medium 图当前预留 $0.15，这是应用占位，不是官方图片单价。未知费用或结果不明时保留占位。**FOOD_MONTHLY_BUDGET_USD 是此站点的调用门槛，不是 OpenAI 账户硬扣费上限**；其他项目、未知型号价格、价格变化及超时后提供方继续执行等，不能由本地估算消除。详见 [模型与成本](docs/models-and-costs.md)。

聊天和构思按访客及 requestId 去重；绘图按签名计划 ID 去重，更换客户端 requestId 不会为同一计划再次出图。没有自动重试收费调用。手动“接着取这张图”复用原计划；结果确定失败或计划过期后，用户明确重新构思才发起新请求。

上游文字最多等待 60 秒、图片 180 秒。实例中断留下的 pending 在文字 90 秒、绘图 240 秒后报告结果未确认，保留预算和幂等占位。前端取消接收不能承诺提供方立即取消生成。成图已拿到后即使记账确认失败，也优先返回已有结果，不重新生成。

## 内容与协议

静态开场不收费。每句用户消息最多 600 码点，最多六条用户消息，请求体最多 32 KiB。模型短回复最多 200 码点；聊天输出 token 上限 1,024，构思上限 4,096，均包含隐藏推理。

构思使用严格 JSON Schema，服务端再次检查原话证据、当次候选 ID 和字段长度。编译后的提示词最多 400 词、2,600 码点；核心食物、错配关系和发散区域不会因截断而静默丢失。变体保持原菜、换主错配，并绑定原对话哈希；新增忌口后应重新构思。

模型调用只在服务端，文字请求 store:false，不启用外部工具。签名计划携带图片所需内容，不携带整段聊天。文字用 textContent 显示，JPEG 格式检查后才展示；这些边界不代表已保证模型语义质量。Service Worker 缓存页面外壳，不缓存 API POST。

## 下一轮部署验收

1. 在现有项目配置 key、模型变量及 D1 / R2，应用迁移，确认生产环境未开启临时内存模式。
2. 运行 npm test 和 npm run build，核对产物；发布此次准确源码版本。GitHub 提交不替代 Sites 的保存与部署。
3. 配置或构思规则变更后，验证“本地开场 → 聊天 → 构思 → medium 竖图”，记录 usage、耗时和实际错配效果。
4. 核对网络中断后同计划取图、跨实例 R2 恢复、变体新请求、额度不足和 API 故障时的随机入口。
5. 用真实浏览器或设备检查约 375×667、390×844、430×932 布局、中文输入法回车、取消、长按存图和系统文件分享；复核动画跳过、减动效、中国默认菜单与世界池。

发布交接区分具体版本的自动测试、真实模型调用和手机分享实测，并记录剩余验证。
