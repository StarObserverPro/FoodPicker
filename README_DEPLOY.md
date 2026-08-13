# 一会儿吃啥呢？v4

本包包含完整前端、开放图片搜索/代理 Functions、分享入口、PWA manifest 和离线缓存。

## 图片方案
浏览器只访问本站：`页面 → /api/images → 开放图片源 → /api/image → 页面`。不需要付费 API key。

## 推荐部署
推荐支持 Functions 的平台（如 Tencent EdgeOne Pages/Makers 或 Cloudflare Pages）。部署根目录为仓库根目录。

## 本地文件模式
直接打开 `index.html` 可测试随机选择和动画；图片检索与 `/share` 需要部署后的 HTTPS 环境。

## 中国大陆
图片由本站同源转发可降低前端直连海外图片域名失败的概率；正式发布前仍应使用中国大陆移动网络和微信内置浏览器实测。
