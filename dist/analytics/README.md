# 实验埋点 (activesg / supermarket / mobile-plan)

三个原型部署在 GitHub Pages（纯静态、无后端）。埋点脚本 `track.js` 采集事件后，用
`navigator.sendBeacon` 发到一个 **Google Apps Script Web App**，事件按行写进一张
**Google Sheet**，你随时可以在表格里筛选 / 导出。

## 采集的事件

| event | 含义 | 关键字段 |
| --- | --- | --- |
| `pageview` | 用户打开了哪个页面 | `app`, `page`, `path`, `referrer` |
| `click` | 点了哪个按钮 / 链接 | `target_text`（按钮文字）, `target_href`（跳转目标）, `target_selector`（位置）, `click_x/y` |
| `screen_view` | supermarket 单页切到哪个屏（路径） | `page`（如 home / categories / cart / checkout） |

每条事件都带匿名 `user_id`（持久）和 `session_id`（30 分钟无操作后翻新），可用来还原
「同一个人的点击路径」。

> 隐私：脚本**从不记录用户输入的内容**。地址 / 支付表单等输入框只记录字段名和 placeholder，不记录填的值。

## 一次性配置（约 5 分钟）

### 1. 建表格 + 部署收集端

1. 打开 <https://sheets.google.com> 新建一个空白表格（名字随意，比如「实验埋点」）。
2. 在该表格里点 **扩展程序 → Apps Script**，会打开脚本编辑器。
3. 把编辑器里默认的 `Code.gs` 内容全部删掉，粘贴本目录 [`apps-script.gs`](./apps-script.gs) 的全部内容，保存。
4. 右上角点 **部署 → 新建部署**：
   - 类型选 **Web 应用 (Web app)**；
   - **执行身份 (Execute as)**：以我自己 (Me)；
   - **谁可以访问 (Who has access)**：**任何人 (Anyone)** ← 一定要选这个，匿名用户才能上报；
   - 点部署，首次会要求授权，按提示允许即可。
5. 复制得到的 **Web 应用 URL**，形如：
   `https://script.google.com/macros/s/AKfycb.../exec`

### 2. 把 URL 填进埋点脚本

打开仓库根目录的 [`../track.js`](../track.js)，把顶部这一行的占位符换成上一步的 URL：

```js
var ENDPOINT = window.ANALYTICS_ENDPOINT || "__PASTE_APPS_SCRIPT_URL__";
//                                          ↑ 换成 https://script.google.com/macros/s/.../exec
```

### 3. 重新构建 dist 并部署

```bash
node scripts/build-sites-dist.mjs   # 把根目录改动同步进 dist/
git add -A && git commit -m "Add experiment analytics" && git push
```

GitHub Actions 会自动重新部署。

## 查看 / 导出数据

回到那张 Google Sheet，会看到自动生成的 `events` 工作表，每来一个用户操作就新增一行。
- 用「数据 → 创建筛选器」按 `app` / `event` / `session_id` 筛选；
- 用「文件 → 下载 → CSV」导出做分析；
- 想按会话还原路径：按 `user_id` + `session_id` 分组，再按 `ts` 排序看 `page` / `target_text` 序列。

## 本地自测（可选）

`ENDPOINT` 还没填时，脚本不会发网络请求，而是把每条事件打到浏览器控制台
（`console.debug("[track]", ...)`），可以先在本地开页面点几下、看 F12 Console 验证采集内容。
