# FoodPicker · 扎心版今天吃什么

手机优先的“今天吃什么”决策器。现在的主流程不是纯随机摇菜，而是四次点击完成一轮“心理取样 → 感官偏好 → 动机审讯 → 玄学采样”，再从默认可获得菜单池里给出一份带心理判词、食运解释和大忽悠拍板的今日推荐。

## Current experience

- 四题心理/玄学问答，问题和判词保持娱乐化，不冒充心理诊断。
- 推荐权重约为：真实偏好为主、当日/时辰玄学做扰动、最后用判词把决定讲圆。
- 结果页包含“心理学怎么说 / 命理怎么说 / 大忽悠最后拍板”、自洽度、三个同命备选、改命一次、重新测试和系统分享。
- 默认菜单面向中国可获得性：保留完整中国菜单，并纳入国内常见汉堡、炸鸡、披萨、意面、三明治、塔可等国际快餐/大众西餐。
- 旧国际完整菜单仍保留在 `food-data.js`；`?menu=world` 或 `?menu=international` 可切到世界池做内部 review。
- `psychic-app.js` 会给当前菜单池自动打上 comfort / spicy / stimulus / carb / ritual / easy / fresh 等心理推荐标签，并对少数代表菜做精确标签覆盖。
- 保留 iPhone safe-area、PWA manifest 与离线缓存。

## Structure

```text
index.html              扎心版入口、问答与结果页结构
styles.css              街边算命摊 × 心理杂志视觉与响应式样式
food-data.js            完整旧菜单库、原语名称与搜索索引
food-policy.js          中国默认池 / 国际扩展池切分策略
psychic-app.js           问答、菜单标签 adapter、推荐排序、食运与判词
manifest.webmanifest    PWA manifest
sw.js                   Service Worker
functions/              旧版图片/分享 Functions，暂保留兼容资产
assets/                 PWA 图标
```

## Local preview

直接打开 `index.html` 可以测试核心问答与推荐；部署环境下可同时使用 PWA 与系统分享能力。

部署细节见 [`README_DEPLOY.md`](./README_DEPLOY.md)。
