# FoodPicker · 一会儿吃啥呢？

一个面向手机竖屏的随机下顿饭选择器：快速滚动几百种中国、欧洲和美洲常见快餐/简餐，点击汉堡按钮停下；停止后可查看菜名原语、开放图片搜索结果并分享选择。

## Current version

**v4**

- 620 个候选餐食，数据集中在 `food-data.js`。
- 非中文菜显示源语言名称，并优先用源语言/英文索引搜索图片。
- 背景装饰具有缓慢漂移、旋转和颜色呼吸。
- 针对 iPhone 竖屏、安全区和较矮屏幕做了响应式布局。
- 图片检索无需付费 API：服务器端查询开放图片源，并通过本站 `/api/image` 同源转发。
- 支持 PWA、系统分享，以及 `/share` 动态分享入口。

## Structure

```text
index.html              页面结构
styles.css              UI / 响应式样式
food-data.js            菜品库、原语名称与英文搜索索引
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
