# i 六院 Web Clone

这是一个纯静态前端项目，适合直接部署到 GitHub Pages。

## 本地文件

- `index.html`
- `styles.css`
- `app.js`

## 页面占位约定

- 以后所有涉及“就诊人”的页面，默认姓名统一写 `xxx`
- 以后所有涉及“门诊号 / 就诊号”的页面，默认统一写 `00000`

除非你后续单独给了新的截图或明确指定真实文案，否则都按这个占位规则复刻。

## 部署到 GitHub Pages

1. 在 GitHub 新建一个仓库。
2. 把本地项目推上去。
3. 在仓库的 `Settings -> Pages` 中，将 `Source` 设为 `GitHub Actions`。
4. 推送代码后，等待 Actions 跑完即可生成站点。

## 推荐命令

```bash
git add .
git commit -m "Prepare GitHub Pages deployment"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

如果你的仓库名不是用户主页仓库，访问地址通常是：

`https://<你的 GitHub 用户名>.github.io/<仓库名>/`
