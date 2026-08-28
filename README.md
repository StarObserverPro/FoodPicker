# FoodPicker · 一会儿吃啥呢？

一个面向手机竖屏的随机下顿饭选择器。完整数据仍保留中国、欧洲和美洲约 620 个候选餐食，但默认抽取池现在面向中国使用场景：保留全部中国菜，并只纳入一组在国内较常见的国际快餐/大众西餐；其余国际菜完整保留为扩展池。

## Current version

**v4 + China menu split**

- 完整世界菜单约 620 个候选餐食，数据仍集中在 `food-data.js`。
- `food-policy.js` 负责菜单可用性分层：`china`（默认）、`internationalOnly`（国际扩展项）、`international`（完整世界池）。
- 默认中国池保留全部中国菜，以及汉堡、披萨、炸鸡、三明治、常见意面/墨西哥快餐等国内较容易找到的国际餐食。
- 访问 `?menu=world` 或 `?menu=international` 可临时切回完整世界菜单，便于测试；后续 UI 可直接调用 `FOOD_PICKER_MENU.setMode()`。
- 非中文菜显示源语言名称，并优先用源语言/英文索引搜索图片。
- 背景装饰具有缓慢漂移、旋转和颜色呼吸。
- 针对 iPhone 竖屏、安全区和较矮屏幕做了响应式布局。
- 图片检索无需付费 API：服务器端查询开放图片源，并通过本站 `/api/image` 同源转发。
- 支持 PWA、系统分享，以及 `/share` 动态分享入口。

## Structure

```text
index.html              页面结构
styles.css              UI / 响应式样式
food-data.js            完整菜品库、原语名称与英文搜索索引
food-policy.js          中国默认池 / 国际扩展池切分策略
app-core.js             随机滚动与基础交互
app-media.js            背景动画与图片检索
app-share.js            分享与启动逻辑
functions/api/images.js 开放图片检索
functions/api/image.js  图片同源代理与缓存
functions/share.js      分享入口
assets/                 PWA 图标
manifest.webmanifest    PWA manifest
sw.js                   Service Worker
README_DEPLOY.md        部署说明
```

## Local preview

直接打开 `index.html` 可以测试随机滚动和交互。图片检索与 `/share` 需要部署到支持 Functions 的平台后才完整工作。

部署细节见 [`README_DEPLOY.md`](./README_DEPLOY.md)。
