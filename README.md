# FoodPicker · 扎心版今天吃什么

手机优先的“今天吃什么”决策器。首页可以直接随机选一道菜，也可以回答八道题，根据当下偏好得到推荐和人格插画。核心流程不需要运行时依赖或 API key。

## Current experience

- 八题流程：五道随机抽取的人格题、一道校准题、两道当下状态题。问题和判词保持娱乐化，不冒充心理诊断。
- 推荐权重约为：真实偏好为主、当日/时辰玄学做扰动、最后用判词把决定讲圆。
- 问答结果显示人格插画、判词和菜名；随机结果显示一张完整插画及三个备选。两个入口均支持换菜、返回首页、生成分享图、保存图片和复制链接。
- 默认菜单面向中国可获得性：保留完整中国菜单，并纳入国内常见汉堡、炸鸡、披萨、意面、三明治、塔可等国际快餐/大众西餐。
- 旧国际完整菜单仍保留在 `food-data.js`；`?menu=world` 或 `?menu=international` 可切到世界池做内部 review。
- `personality-engine.js` 为菜单生成推荐标签，并对少数代表菜做精确覆盖；`psychic-app.js` 负责交互和分享。
- 网页使用同分辨率 WebP，原始 PNG 保留；人格图在结果页直接显示图层，分享时才合成。图片失败仍可选菜并生成文字分享卡。
- 保留 iPhone safe-area、PWA manifest 与离线缓存。

## Structure

```text
index.html              扎心版入口、问答与结果页结构
styles.css              视觉系统、问答/结果/分享与响应式样式
food-data.js            完整旧菜单库、原语名称与搜索索引
food-policy.js          中国默认池 / 国际扩展池切分策略
personality-engine.js   人格、推荐评分与抽样
persona-art.js          人格插画描述、图层加载与分享合成
psychic-app.js          八题交互、结果与分享任务
manifest.webmanifest    PWA manifest
sw.js                   Service Worker
functions/              旧版图片/分享 Functions，暂保留兼容资产
assets/                 插画、原始 PNG、WebP 与 PWA 图标
scripts/optimize-art.py 开发用图片编码工具（Pillow）
tests/                  入口、推荐、资源、分享及缓存回归
```

## Local preview

用 Node.js 启动本地 HTTP 预览：

```text
node local-server.mjs
```

然后访问 `http://127.0.0.1:4173`。部署环境下可同时使用 PWA 与系统分享能力。

部署细节见 [`README_DEPLOY.md`](./README_DEPLOY.md)。
