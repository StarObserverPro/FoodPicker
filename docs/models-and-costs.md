# 模型配置与试玩预算

核对日期：2026-11-19（America/New_York）。以下均为美元，采用普通 Standard 处理价格。费用用请求返回的 usage 估算，实际账单以 OpenAI 平台为准。

## 当前配置

`server/model-config.mjs` 的 `getModelConfig(env)` 只读取模型设置，不读取密钥。默认聊天和构思均用 `gpt-6-luna`，图片用 `gpt-image-2.6-flare`，1024×1536、medium、JPEG、`output_compression: 80`。固定明确尺寸和质量，避免 `auto` 让估算条件变化。

| 环境变量 | 默认值 | 用途 |
| --- | --- | --- |
| `FOOD_CHAT_MODEL` | `gpt-6-luna` | 接住用户的话、继续聊天 |
| `FOOD_PLANNER_MODEL` | 跟随 `FOOD_CHAT_MODEL` | 选食物、构思错配、填写结构化场景 |
| `FOOD_REASONING_EFFORT` | `low` | 文字模型推理档；支持 low / medium / high |
| `FOOD_IMAGE_MODEL` | `gpt-image-2.6-flare` | 最后一次图片生成 |
| `FOOD_IMAGE_QUALITY` | `medium` | 支持 low / medium / high / xhigh / max |

模型 ID 可以换成其他合法 ID，代码不会擅自回退型号；当前计价表不认识的型号返回 `null` 费用，不能算成免费。配置变更是否需要重新部署取决于宿主环境。模型权限和实际可用性在后续接入时确认。

目前官方目录列出 `gpt-6-luna`、`gpt-6.1-terra`、`gpt-6.2-sol`。没有查到独立的 `gpt-6.2-luna` 或 `gpt-6.2-sol-light`。三个文字型号都支持 Responses 和 Structured Outputs；6.2 Sol 不接受 `reasoning.effort: none`，本项目共同采用 low / medium / high。迁移到 6.2 时不要发送不支持的 `temperature` / `top_p`。正式 schema 要求每个 object 关闭 `additionalProperties`，字段均列为 required；可空字段用 null 联合类型。

来源：[模型目录](https://developers.openai.com/api/docs/models)、[Luna](https://developers.openai.com/api/docs/models/gpt-6-luna)、[Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra)、[Sol](https://developers.openai.com/api/docs/models/gpt-6.2-sol)、[6.2 迁移说明](https://developers.openai.com/api/docs/guides/latest-model)、[Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)。

## 文字费用

下列单价均为每百万 token。缓存写入按默认 30 分钟保留期；12 小时保留期、其他处理层级、区域溢价不在本估算器范围内。

| 型号 | 普通输入 | 缓存读取 | 缓存写入（30 分钟） | 输出（含推理） |
| --- | ---: | ---: | ---: | ---: |
| `gpt-6-luna` | $0.10 | $0.01 | $0.125 | $0.50 |
| `gpt-6.1-terra` | $1.00 | $0.05 | $1.25 | $5.00 |
| `gpt-6.2-sol` | $2.00 | $0.10 | $2.50 | $10.00 |

`estimateTextCost(usage, model)` 分别计普通输入、缓存读取和缓存写入。`output_tokens` 已包含隐藏推理，不再加 `reasoning_tokens`。输入超过 272,000 token 时，这三个型号按官方长上下文规则将输入及缓存费乘 2、输出费乘 1.5；本网站短会话不应接近这一范围。

```text
普通输入 = input_tokens - cached_tokens - cache_write_tokens
费用 = (普通输入 × 输入单价 + cached_tokens × 缓存读取单价
      + cache_write_tokens × 缓存写入单价 + output_tokens × 输出单价) / 1,000,000
```

来源：[价格总表](https://developers.openai.com/api/docs/pricing)、以上三个模型页、[缓存计费字段与公式](https://developers.openai.com/api/docs/guides/prompt-caching)、[Responses usage 与输出上限](https://developers.openai.com/api/reference/resources/responses/methods/create)。`max_output_tokens` 同时约束可见输出和推理，不能简单按最终 JSON 的字数设置。

## 图片费用与前次估价更正

GPT Image 2.6 Flare 和 Sunburst 的 Standard 费率相同：文字输入 $5 / 百万 token、图片输入 $8 / 百万 token、图片输出 $30 / 百万 token。相同费率不保证两型号在实际工作流中的总费用始终相同。

此前讨论把 $15 / 百万图片输出 token 当作 Standard，又使用了旧模型的 408 / 1,584 / 6,240 token 表。这两个口径都不适用于此配置：$15 是 Batch；旧 token 表属于 `gpt-image-2` 之前的模型。

以下按官方图片生成页面当前计算器的算法复算，是估算值，实际以 `usage` 为准：

| 1024×1536 竖图 | 预计图片输出 tokens | 仅图片输出费用 |
| --- | ---: | ---: |
| low | 664 | $0.01992 |
| **medium（当前）** | **1,132** | **$0.03396** |
| high | 1,372 | $0.04116 |

medium 的计算步骤：长边网格为 24，短边按长宽比计算为 16；`ceil(24 × 16 × (2,000,000 + 1024 × 1536) / 4,000,000) = 343`；2.6 medium 系数为 3.3，取整后为 1,132 token；再乘 $30 / 百万得到 $0.03396。计算器对 low 使用系数 4.2，对 high 使用系数 1。遇到半整数的网格舍入采用取最近偶数的规则；不能用这张表外推所有尺寸为简单面积关系。

如果图片提示词用 400 个文字输入 token，另加 $0.002，一张 medium 竖图约 $0.03596。400 token 是预算假设，不是代码字符限制对应的固定值。JPEG 压缩、油画感、水彩感和粗笔触主要影响文件与画面表现，不能当作直接降低 token 费率的开关。

来源：[图片成本与官方计算器](https://developers.openai.com/api/docs/guides/image-generation#calculating-costs)、[Flare 费率](https://developers.openai.com/api/docs/models/gpt-image-2.6-flare)、[图片生成 API](https://developers.openai.com/api/reference/resources/images/methods/generate)。核验时官方文档引用的计算器资产为 `/_astro/GptImageTokenCalculator.react.DYPC2yT7.js`；此资产名会随文档版本变化，应从页面读取当前引用。页面静态默认的 823 tokens / $0.02469 对应 1024 方图 low，不能用作本项目的竖图 medium 报价。

图片直接走 `/v1/images/generations`，不额外经过一个主文字模型。GPT Image 默认返回 `data[0].b64_json`，不要传旧 `response_format` 参数。`estimateImageCost` 处理直接 raster 请求，并分别计文字输入、图片输入、图片输出；缺少模态分项或遇到 SVG 等混合输出时返回 `null`，不猜费用。

2.6 的 `complexity` 控制构思和关系规划，`quality` 控制渲染档位；两者独立。未传 complexity 时默认 high，可以先保留以处理错配关系；粗笔触和少细节在提示词里描述。参考：[图片提示指南](https://developers.openai.com/api/docs/guides/image-prompting)。

## 先升级构思，还是把聊天一起升级

预算场景：一次完整游玩累计 8,000 输入 token、2,500 计费输出 token；其中最后一次构思为 3,000 输入 + 1,000 输出，其余聊天为 5,000 输入 + 1,500 输出。输出数字包含推理。全部暂按普通输入价，不预设缓存命中。实际库长度、会话长度和重试都会改变消耗。

| 方案 | 单次文字费 | 100 次文字费 | 1,000 次文字费 |
| --- | ---: | ---: | ---: |
| 聊天 Luna，构思 Luna | $0.00205 | $0.205 | $2.05 |
| 聊天 Luna，构思 Terra | $0.00925 | $0.925 | $9.25 |
| 聊天 Luna，构思 Sol 6.2 | $0.01725 | $1.725 | $17.25 |
| 聊天与构思全部 Terra | $0.02050 | $2.05 | $20.50 |
| 聊天与构思全部 Sol 6.2 | $0.04100 | $4.10 | $41.00 |

再假设每次生成一张上述约 $0.03596 的图：

| 方案 | 100 次总费用 | 1,000 次总费用 |
| --- | ---: | ---: |
| 全文字 Luna + 一张图 | 约 $3.80 | 约 $38.01 |
| 仅构思升级 Terra + 一张图 | 约 $4.52 | 约 $45.21 |
| 仅构思升级 Sol 6.2 + 一张图 | 约 $5.32 | 约 $53.21 |
| 全文字 Sol 6.2 + 一张图 | 约 $7.70 | 约 $76.96 |

首发保留 Luna。初次线上测试中，馄饨和画风清楚，碗和玻璃棚的错配偏弱，因此先调整构思和成图提示，要求把不可能的接合放在主体上。若后续样本仍频繁出现同类问题，可只改 `FOOD_PLANNER_MODEL` 对比 Sol。

## 接入后记录什么

2026-11-20 v37 的一轮在线测试包括一次聊天、一次构思和一张 medium JPEG。按 D1 记录的 usage 估算分别为 $0.000102、$0.000782、$0.036325，合计约 $0.0372。用同一签名计划重新取回的是同一张图，数据库只有一笔绘图记录。

分别记录聊天、构思和图片请求的型号、参数、完整 usage、耗时、成功与否以及重试次数；未知或缺失 usage 标为未计量，不能写成 $0。估算器不是账单接口，也不是预算硬截止机制。首次试玩后用实际每次会话、每张可用图的费用修正上述预算。分享已生成的同一张图不需要再次调用图片 API。
