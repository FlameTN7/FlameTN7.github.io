# Agent Map — FlameTN7.github.io Blog

本文件帮助 AI 编码助手理解此项目的结构和约定。请在修改代码前阅读。

---

## 首次阅读

- `docs/.vitepress/config.ts` — VitePress 配置，侧边栏、导航、主题
- `README.md` — 项目概览
- `package.json` — 依赖和脚本命令

## 常用命令

```bash
# 启动编辑器和后端（本地开发）
pnpm editor:all

# 单独启动编辑器前端（:5173）
pnpm editor

# 单独启动编辑器后端 API（:5174）
pnpm editor:server

# 构建文档网站（输出到 docs/.vitepress/dist）
pnpm docs:build

# 本地预览构建结果（:5175）
python3 scripts/preview-server.py

# 代码检查
pnpm lint
pnpm format
```

## systemd 服务

两个服务由 systemd 管理，编辑修改后需重启对应服务：

| 服务 | systemd 单元 | 端口 | 说明 |
|------|-------------|------|------|
| 编辑器 | `blog-editor.service` | 5173（前端）+ 5174（后端 API）| 全栈编辑器 |
| 预览 | `blog-preview.service` | 5175 | 静态构建 + Python HTTP 文件监听 |

重启方式：
```bash
systemctl restart blog-editor    # 重启编辑器
systemctl restart blog-preview   # 重启预览
```

> **注意：** VitePress 的 `vitepress dev` 在 systemd 下运行会报 `__VP_HASH_MAP__ is not defined` 错误（SSR 虚拟模块注入失败）。不要改 systemd 用 dev 模式。预览服务用 `docs:build` + Python http.server 是可靠的替代方案。

## 项目结构

```
flametn7.github.io/
├── docs/                          # 只提交此目录到 GitHub
│   ├── index.md                   # 主页文章
│   ├── projects/                  # 项目文章
│   ├── tutorial/                  # 教程笔记
│   └── .vitepress/
│       ├── config.ts              # VitePress 配置（侧边栏、导航）
│       └── theme/                 # 自定义主题
├── editor-server/                 # 编辑器后端
│   ├── index.ts                   # 入口
│   ├── routes/                    # API 路由
│   └── lib/                       # 工具库
├── src/                           # 编辑器前端（Vue 3）
│   ├── App.vue
│   ├── components/
│   ├── stores/
│   └── utils/
├── scripts/
│   └── preview-server.py          # 本地预览 HTTP 服务器（文件监听 + 自动构建）
├── public/                        # 静态资源
├── .github/workflows/             # GitHub Actions 部署
├── .gitignore
├── package.json
└── vite.config.ts
```

## Git 工作流

```
main ← GitHub Actions 自动部署到 Pages
↑
仅提交 docs/ 目录（文章 + .vitepress/config.ts）
```

**硬规则：**
- ❌ **不提交**：`scripts/`、`start-*.sh`、`editor-server/.env`、`src/assets/pics/占位图`
- ✅ **只提交**：`docs/` 目录下的文章和配置
- ✅ `.gitignore` 已排除上述文件，无需手动处理

## 编辑器后端

编辑器后端提供文章草稿管理、自动保存和图片上传功能。

**环境变量**（存于 `editor-server/.env`，**不提交 Git**）：

| 变量 | 说明 |
|------|------|
| `R2_ACCOUNT_ID` | Cloudflare R2 账户 ID |
| `R2_ACCESS_KEY_ID` | R2 S3 Access Key |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Key |
| `R2_BUCKET` | 存储桶名称（`blog`）|
| `R2_PUBLIC_BASE` | 公开访问地址 |
| `EDITOR_PORT` | 后端端口（5174）|

**R2 用于：** 文章图片上传存储，通过 S3 兼容 API 操作。

## 博客配置要点

- VitePress 使用 `withMermaid()` 包装配置以支持 mermaid 图表
- 主题：深色模式（`appearance: 'dark'`）
- mermaid 主题也使用深色（`theme: 'dark'`）
- 编辑器使用 content-addressable SVG 缓存模式解决 mermaid 预览抖动
- 侧边栏和导航在 `docs/.vitepress/config.ts` 的 `themeConfig` 中配置

## 当 agent 卡住时

1. 运行 `pnpm docs:build` 检查构建是否通过
2. 检查 `.vitepress/cache` 是否损坏（删除后重试）
3. 查看 GitHub Actions 日志确认部署状态
4. 如需编辑文章内容，直接修改 `docs/` 下的 `.md` 文件即可
