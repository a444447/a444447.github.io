# afourblog — 个人博客项目指引

> 本文件是项目的**权威架构说明**。任何会话在动手前都应完整读完，并以此为准。迁移自 Hugo。核心诉求：**简单、可控、可渐进扩展**。

## 权威参考文件

- **`CLAUDE.md`（本文件）** —— 架构 / 技术栈 / 规范的文字真相
- **`style-specimen.html`（项目根目录）** —— 设计的**视觉真相**。所有字体、色值、组件尺寸、交互效果都已在这个文件里实现并经作者确认通过。任何视觉层的疑问**以样片为准**，不以本文字描述为准——文字描述仅是样片的二次提取。
- 当文字描述与样片冲突时：**信样片**，并顺手修正本文件。

---

## 项目背景

- 前身是 Hugo 博客，因**心智负担过重**（主题系统、shortcode、taxonomy 等抽象）被弃用
- 目标：前端有设计感，后端可扩展，但现阶段保持**纯静态**
- 作者为单人博客，内容以技术 / 读书 / 生活 / 随笔为主
- 工作流维持 "markdown + `git push`"，和 Hugo 时代一致

---

## 技术栈（已锁定）

| 层 | 选择 | 说明 |
|---|---|---|
| 框架 | **Astro** | 默认零 JS，内容优先，React 可混用 |
| UI 组件 | **React + Tailwind CSS** | 和 Frontend Design Plugin 产出对齐 |
| 类型系统 | **TypeScript** | Content Collection 的 Zod schema 依赖它 |
| 内容 | **Markdown + Astro Content Collections** | Zod schema 校验 front matter，构建期报错 |
| 代码高亮 | **`astro-expressive-code`** | 基于 Shiki，支持双主题、行高亮、diff、标题、复制按钮 |
| 数学公式 | **KaTeX** (`remark-math` + `rehype-katex`) | 构建时渲染，零运行时 JS，CSS 全站加载 |
| 图片 | **Astro 内置 `<Image>` / `image()` schema** | 基于 sharp，自动 AVIF/WebP + 响应式 |
| 搜索 | **Pagefind** | 构建后扫描 `dist/` HTML，生成静态索引，零后端 |
| RSS | **`@astrojs/rss`** | **全文 RSS** 2.0，路径 `/rss.xml` |
| Sitemap | **`@astrojs/sitemap`** | 零配置，依赖 `site` 字段 |
| 包管理器 | **npm** | — |
| 部署 | **GitHub Actions → GitHub Pages (用户站)** | `actions/deploy-pages`，两段式 job |
| 域名 | **暂无自定义域名**，使用 `<username>.github.io` | 未来可迁移 |

### npm registry

本机网络下安装依赖优先使用 npm 镜像：

```bash
npm install <package> --registry=https://registry.npmmirror.com
```

需要固化版本时继续使用 `--save-exact`，例如：

```bash
npm install @astrojs/rss@2.4.4 @astrojs/sitemap@3.0.0 --save-exact --registry=https://registry.npmmirror.com
```

### 当前实现兼容版本（2026-04-12）

> 由于本机 Node 为 `18.13.0`，当前代码采用 Astro 2 兼容版本链路；后续升级 Node 后可整体升级到 Astro 新主线。

- `astro@2.10.15`
- `@astrojs/react@2.2.2`
- `@astrojs/tailwind@3.1.3`
- `@astrojs/rss@2.4.4`
- `@astrojs/sitemap@3.0.0`
- `sitemap@7.1.1`（作为直接依赖固定，避免 `7.1.3` 在 Astro 2 build output 绝对路径上的回归）
- `pagefind@1.5.2`
- `astro-expressive-code@0.24.0`（在 `astro.config.mjs` 中使用**默认导入**）
- `remark-math@5.1.1` + `rehype-katex@6.0.3` + `katex@0.16.25`
- `astro.config.mjs` 启用 `experimental.assets: true`（Astro 2 下 `image()` schema 需要）

**明确拒绝的选择**（不要再讨论）：
- ❌ Next.js（对博客过重，且"全栈"特性会诱惑把逻辑放错位置）
- ❌ SvelteKit（和 Frontend Design Plugin 的 React 产出有阻抗）
- ❌ Hugo（就是从这里跑出来的）
- ❌ Go / C++ 自己撸模板引擎（刚抛弃 Hugo 不能再走老路）
- ❌ `gh-pages` 分支部署（老式，用 `actions/deploy-pages`）
- ❌ MathJax（运行时 JS 渲染，违反静态优先哲学）
- ❌ 远程图片作为主要图源（外链失效风险，无法构建期优化）

---

## 目录结构

```
afourblog/
├── CLAUDE.md                      ← 本文件
├── astro.config.mjs               ← site、integrations、markdown 插件
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── public/
│   ├── .nojekyll                  ← 防 GH Pages 跑 Jekyll（必须）
│   ├── robots.txt                 ← 指向 sitemap
│   ├── favicon.ico
│   └── ... (apple-touch-icon、manifest 等)
├── src/
│   ├── content/
│   │   ├── config.ts              ← Content Collection 的 Zod schema
│   │   └── posts/
│   │       └── 2026-04-11-astro-blog-setup/   ← **一文一目录**
│   │           ├── index.md
│   │           ├── cover.jpg
│   │           └── diagram-1.png
│   ├── layouts/
│   │   ├── BaseLayout.astro       ← <head>、主题初始化脚本、全局 CSS
│   │   └── PostLayout.astro
│   ├── pages/
│   │   ├── index.astro            ← 首页
│   │   ├── posts/[...slug].astro  ← 文章页
│   │   ├── archive.astro          ← 归档页
│   │   ├── categories.astro       ← 分类索引页
│   │   ├── categories/[category].astro  ← 按分类归档（静态生成）
│   │   ├── tags.astro             ← 标签索引页
│   │   ├── tags/[tag].astro             ← 按标签归档（静态生成）
│   │   ├── rss.xml.ts             ← RSS 端点
│   │   └── 404.astro
│   ├── components/
│   │   ├── static/                ← 构建时渲染的 React 组件（不水合）
│   │   │   ├── PostCard.tsx
│   │   │   └── ...
│   │   └── islands/                ← 水合的 React 组件（客户端运行）
│   │       ├── ThemeToggle.tsx
│   │       ├── MobileMenu.tsx
│   │       └── SearchBox.tsx
│   ├── lib/
│   │   └── content.ts             ← 内容读取与聚合（published posts / categories / tags）
│   └── styles/
│       └── global.css             ← Tailwind base + CSS 变量 + KaTeX CSS
└── .github/
    └── workflows/
        └── deploy.yml             ← 两段式 build + deploy
```

**目录划分约定**（关键）：
- `components/static/` 里的组件**默认不水合**，是"构建期 HTML 模板"
- `components/islands/` 里的组件**总是水合**，每个都是一个独立 React root
- 看到一个组件在哪个目录，立即知道它是否上客户端 bundle

---

## Front Matter Schema（已锁定）

所有字段通过 `src/content/config.ts` 的 Zod schema 校验，写错构建失败。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `title` | `string` | ✅ | — | 标题 |
| `date` | `date` | ✅ | — | 发布时间（排序 / 归档 / RSS） |
| `updated` | `date` | ❌ | — | 最后更新（技术文章推荐填） |
| `description` | `string` | ✅ | — | 摘要 1–2 句，SEO + 社交卡片 + 列表 preview |
| `category` | `z.enum([...])` | ✅ | — | **单值固定枚举**：`技术` / `读书` / `生活` / `随笔` |
| `tags` | `string[]` | ❌ | `[]` | 自由字符串 |
| `draft` | `boolean` | ❌ | `false` | `true` 时构建过滤，不生成页面、不进 RSS、不进 sitemap |
| `cover` | **`image()` schema** | ❌ | — | 使用 Astro Content Collection 的 `image()`，相对当前 post 目录 |

**已显式砍掉的字段**：
- ❌ `author` — 单人博客，写进站点全局配置
- ❌ `slug` — 文件名即 slug
- ❌ `category` 多值 — 用 tags 代替

**文件命名约定**：
```
src/content/posts/YYYY-MM-DD-english-slug/index.md
```
- 日期和 slug 都在目录名里
- 图片等资源同目录共存
- markdown 内部用相对路径 `![](./cover.jpg)` 引用，自动被 Astro 优化

---

## URL 结构（已锁定）

| 页面 | URL |
|---|---|
| 首页 | `/` |
| 文章页 | `/posts/<slug>` |
| 归档页 | `/archive` |
| 分类索引 | `/categories` |
| 按分类 | `/categories/<category>` |
| 标签索引 | `/tags` |
| 按标签 | `/tags/<tag>` |
| RSS | `/rss.xml` |
| Sitemap | `/sitemap-index.xml` |

**关键原则**：`category` / `tags` **不进文章 URL**。文章永远是 `/posts/<slug>`，即使改了分类链接也不会失效。

---

## 组件架构心智模型（★ 最重要 ★）

### 核心原则："Static by default, interactive by exception"

Astro **不是** Next.js。在 Astro 里：

> 写一个 React 组件，默认情况下它在构建时被渲染成 HTML，**React runtime 和组件代码一字节都不会发到浏览器**。React 在这里只是一个模板引擎。

只有显式加 `client:*` 指令的组件才会作为 **island** 被打包 + 水合。

### 决策问题

对每个组件问一个问题：

> "它**运行时**需要 JS 才能完成职责吗？"

- 卡片、列表、导航、header、footer、meta 信息 → **静态**，不加指令
- 主题切换、移动菜单、搜索框、复制按钮、评论区 → **island**

### Hydration 指令选择

| 指令 | 时机 | 使用场景 |
|---|---|---|
| `client:load` | 页面加载立即 | 必须立刻可用：主题切换、移动菜单 |
| `client:idle` | 浏览器空闲时 | 次要交互：代码复制按钮、分享按钮 |
| `client:visible` | 滚入视口 | 首屏外的东西：评论区 |
| `client:media` | 匹配媒体查询 | 仅某端需要的交互 |
| `client:only` | 纯客户端 | 无法 SSR 的组件（用到 `window` / canvas 等） |

**默认首选 `client:idle` 或 `client:visible`**。`client:load` 只给必须即时响应的东西。

### Island 粒度：要细

- ✅ `<ThemeToggle client:load />` 只水合那个按钮
- ❌ `<Header client:load />` 把整个 header 水合——浪费几十 KB JS

Header 的正确形态：外壳是静态 `.astro`，内部只有 ThemeToggle 和 MobileMenu 是 island。

### ★ 绝对禁忌：React Context 跨 island 不工作

Frontend Design Plugin 很可能产出 `<ThemeProvider>` 包裹整页的代码。**这在 Astro 里完全不工作**，因为每个 island 是**独立的 React root**，Provider 的作用域只在那个 island 内部。

**正确的主题切换模式**：

1. `<html>` 上用 `class="dark"` 或 `class="light"` 控制 Tailwind 的 `dark:` 变体
2. `<head>` 里放一段**内联原生 JS**（不是 React），在渲染前读 `localStorage.theme`，立即设 `<html>` 的 class——**避免 FOUC**
3. 主题切换按钮是一个 **React island**，`client:load`。行为：改 `localStorage` + 改 `document.documentElement.classList`
4. 所有 island 写 Tailwind 的 `dark:bg-*` 就能自动响应 `<html>` 的 class

**所有跨组件共享状态**都走 DOM（class / data attributes）或 `localStorage`，**永远不走 React Context**。

### 归档过滤走静态路由，不走客户端 island

- ✅ `/categories/技术`、`/tags/rust` 是构建期生成的独立页面，零 JS
- ❌ 不要做"客户端过滤" island——博客归档不是电商筛选，用户不会频繁切换
- ✅ 分类详情页（如 `/categories/技术`）当前视觉采用**无外框列表**（标题/日期/摘要直接排版，不套卡片边框）

### 轻量交互可以写原生 JS，不必 React island

示例：文章页 TOC 的"当前章节高亮"只需要 IntersectionObserver + 一小段原生 JS，不需要 React island。**不是所有交互都值得 React 水合**。

---

## 构建 & 部署（已锁定）

### 流程

```
 push 到 main
     │
     ▼
[Job 1: build]
  ├─ checkout
  ├─ setup-node@v4 (node 20, cache: npm)
  ├─ npm ci
  ├─ npm run build           ← astro build → dist/，随后 pagefind 扫描 dist/
  └─ actions/upload-pages-artifact (from dist/)
     │
     ▼
[Job 2: deploy]
  └─ actions/deploy-pages
```

### 关键点

1. **Pagefind 必须在 `astro build` 之后**：它扫描 HTML 产物，顺序反了就抓不到内容；当前脚本为 `astro build && pagefind --site dist --output-subdir _pagefind`
2. **两段 job** 是权限隔离的纵深防御：build 跑代码但无发布权限，deploy 只处理 artifact
3. **触发器**：`push: [main]` + `workflow_dispatch`；**不要** `pull_request`（单人博客不需要）
4. **concurrency group**：同组只保留最新 run，取消进行中的
5. **不要用 `gh-pages` 分支**
6. **Settings → Pages → Source** 必须手动设为 "GitHub Actions"（一次性配置，易忘）

### `astro.config.mjs` 的 `site` 字段

**必须配置正确**。RSS 链接、sitemap URL、Pagefind 跳转链接、OG 标签的绝对 URL 全部依赖它。

- 现在：`site: 'https://<username>.github.io'`
- 未来换域名时改这一行，其它地方都能自动同步
- **不需要 `base` 字段**（用户站部署到根路径）

### `.nojekyll`

`public/.nojekyll` 是空文件，**必须存在**——保险措施，防止 GH Pages 把下划线开头目录（`_astro/`、`_pagefind/`）当成 Jekyll 特殊文件忽略。

---

## 内容增强配置

### 代码高亮：Expressive Code

- 使用 `astro-expressive-code`（不是默认的纯 Shiki）
- 配**双主题**（light + dark），和 `<html>` 的 class 联动，零 JS 切换
- 具体主题等设计稿敲定后再选
- 使用它**自带的复制按钮插件**，不自己写 island

### 数学公式：KaTeX

- `remark-math` + `rehype-katex` 接入 markdown 管线
- KaTeX CSS **全站加载**（不做按需加载的过度优化）
- 写 `$...$` 内联 / `$$...$$` 块级即可

### 图片

- 走 Astro `<Image>` 组件和 `image()` schema
- **图片和文章同目录**，markdown 用相对路径
- **`public/` 不是图片存放处**——放这里不会被处理
- 远程图片需在 `astro.config.mjs` 的 `image.domains` / `image.remotePatterns` 显式列出，**尽量避免**

### RSS

- **全文 RSS 2.0**（不是摘要），读者优先
- 过滤 `draft: true`
- 每页 `<head>` 里 `<link rel="alternate" type="application/rss+xml">` 自动发现

### Sitemap + robots

- Sitemap 零配置，靠 `@astrojs/sitemap` 自动生成
- `public/robots.txt` 手写三行：`User-agent: *` / `Allow: /` / `Sitemap: ...`

### Open Graph

- 每页 `<head>` 有 `<SEO />` 组件统一输出 `og:*` + `twitter:*`
- **策略 A→B**：站点默认 OG 图，文章有 `cover` 时用 `cover`
- 策略 C（构建期 Satori 生成独特 OG）**暂不做**

### Favicon / 404 / `.nojekyll`

- Favicon 全家桶放 `public/`
- `src/pages/404.astro` → 构建产出 `404.html`（GH Pages 自动识别）
- `public/.nojekyll` 空文件

---

## 设计系统（已锁定）

> **所有 token 来自 `style-specimen.html` 并已由作者确认通过。** 本节是样片的规格化提取——实现时以样片为准。基调："简洁 + 克制 + 编辑感"，接近 Linear / Vercel / Anthropic 的气质，但字体更偏文学（全站 serif）。

### 字体系统

**三个字体族**（全部 serif/mono，无 sans）：

| Tailwind key | Stack | 用途 |
|---|---|---|
| `font-fraunces` | `['Fraunces', '"Noto Serif SC"', 'Georgia', 'serif']` | 标题 H1/H2/H3、首页 hero、卡片标题、品牌字 |
| `font-news` | `['Newsreader', '"Noto Serif SC"', 'Georgia', 'serif']` | 正文、卡片描述、按钮文案、meta、引用块 |
| `font-mono` | `['"JetBrains Mono"', 'Menlo', 'monospace']` | 代码、section label、chip、技术元信息、行号 |

**中文回退至关重要**：Fraunces 和 Newsreader 都**没有中文字形**，必须回退到 `Noto Serif SC`（900 / 700 / 400 三个字重）。样片两个 stack 都已配好，照搬即可。

#### 字体加载策略

**两种等价方案**（优先方案 A）：

- **A. 通过 `@fontsource*` 本地托管**（推荐）：
  - `@fontsource-variable/fraunces`
  - `@fontsource-variable/newsreader`
  - `@fontsource/jetbrains-mono`
  - `@fontsource/noto-serif-sc`（400 / 700 / 900）
  - 好处：不依赖第三方、无隐私追踪、自托管缓存、构建期资源处理
- **B. Google Fonts CDN**（样片使用的方式，是后备）：
  ```
  https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Newsreader:ital,opsz,wght@0,6..72,300..800;1,6..72,300..800&family=JetBrains+Mono:wght@400;500&family=Noto+Serif+SC:wght@400;700;900&display=swap
  ```
  - 注意 `display=swap` 避免 FOIT

**无论选哪个都必须加载 Fraunces 的 italic + variable 两个轴**（`ital,opsz,wght`），因为 H1/H2/H3 需要按字号使用不同 `opsz`。

### Fraunces 变量字体光学尺寸（必须配置）

Fraunces 是**可变字体**，大标题若不设置 `opsz` 会失去它"有温度的衬线"特征，看起来像普通 Times。在 global CSS 里定义三个工具类：

```css
.fvar-h1 { font-variation-settings: 'opsz' 144, 'SOFT' 8; }
.fvar-h2 { font-variation-settings: 'opsz' 72,  'SOFT' 6; }
.fvar-h3 { font-variation-settings: 'opsz' 36,  'SOFT' 4; }
```

配合对应字号的 heading 使用。**不要省略**，这是整个视觉系统"暖而有骨"的关键。

### 色板（已锁定）

完整的 Tailwind `theme.extend.colors`：

```js
colors: {
  paper:   '#FAF9F5',
  ink:     { DEFAULT: '#1F1F1C', muted: '#7A7A72', faint: '#C8C7C0' },
  accent:  { DEFAULT: '#C96442', hover: '#B55536' },
  night:   {
    DEFAULT: '#0A0A0A',
    surface: '#0F0F0D',
    text:    '#EDECEA',
    muted:   '#888880',
    border:  '#242421',
  },
}
```

语义用法：

| Token | 用途 |
|---|---|
| `bg-paper` / `bg-night` | 页面主背景 |
| `text-ink` / `text-night-text` | 主要文本（标题、正文） |
| `text-ink-muted` / `text-night-muted` | 次要文本（meta、描述、section label） |
| `text-ink-faint` / `text-night-muted` | 极弱文本（行号、分隔符、版本号） |
| `border-ink-faint` / `border-night-border` | 全站默认 1px 边框（卡片、分隔线、按钮） |
| `bg-accent` / `bg-accent-hover` | 主按钮背景、accent 强调 |
| `text-accent` | 强调文本、链接 hover、章节标题 hover |
| `bg-night-surface` | 代码块 toolbar（dark 模式） |

**注意**：Dark 模式下许多 `text-ink-faint` 的使用场景映射到 `text-night-muted`（而不是单独的 "night-faint"），因为 dark 模式用不到三级灰阶——`night-border` 承担边框角色。

### 排版尺度

#### 英文（Fraunces + Newsreader）

| 层级 | 字体 | 字重 | 字号 | 行高 | 字距 | 变量轴类 |
|---|---|---|---|---|---|---|
| H1 | `font-fraunces` | 900 (black) | 60px | 1.05 | `tracking-tight` | `.fvar-h1` |
| H2 | `font-fraunces` | 600 (semibold) | 40px | 1.15 | `tracking-tight` | `.fvar-h2` |
| H3 | `font-fraunces` | 400 (normal) | 26px | 1.38 | default | `.fvar-h3` |
| 卡片标题 | `font-fraunces` | 600 | 24px | 1.3 | `tracking-tight` | `.fvar-h3` |
| 品牌字 | `font-fraunces` | 500 | 15px | default | `tracking-tight` | `.fvar-h3` |
| Body | `font-news` | 400 | 18px | 1.85 | default | — |
| 卡片描述 | `font-news` | 400 | 16.5px | `leading-relaxed` | default | — |
| Meta row | `font-news` | 400 | 15px | default | default | — |
| 按钮文案 | `font-news` | 500 (medium) | 15px | default | default | — |
| 代码 | `font-mono` | 400 | 13.5px | 1.82 | default | — |
| 行号 | `font-mono` | 400 | 12px | 1.82 | default | — |
| Section label | `font-mono` | 400 | 9.5px | default | `tracking-[0.16em]` | UPPERCASE |
| Chip | `font-mono` | 400 | 9.5px | default | `tracking-[0.11em]` | UPPERCASE |
| Footer 文字 | `font-mono` | 400 | 9.5px | default | `tracking-[0.14em]` | UPPERCASE |
| 版本 chip | `font-mono` | 400 | 9px | default | `tracking-widest` | UPPERCASE |

#### 中文（回退到 Noto Serif SC）

中文因字形特性需要**更大行高 + 无字距**：

| 层级 | 字重 | 字号 | 行高 | 字距 |
|---|---|---|---|---|
| H1 | 900 | 60px | 1.2 | `tracking-normal` |
| H2 | 700 | 40px | 1.3 | `tracking-normal` |
| H3 | 400 | 26px | 1.5 | `tracking-normal` |
| 正文 | 400 | 18px | 2.0 | `tracking-normal` |

**规则**：只要内容可能出现中文（即几乎所有文章内容），就使用这套参数。安全策略——所有 prose 用中文参数，英文段落读起来只会"略宽松"不会丑。

### 布局常量

| 项 | 值 | Tailwind |
|---|---|---|
| 主内容最大宽度 | **720px** | `max-w-[720px]` |
| 水平 padding | 32px | `px-8` |
| Sticky header 高度 | 56px | `h-14` |
| Main 垂直 padding | 80px | `py-20` |
| 组件块间距 | 56px | `my-14`（用于 section 间的水平线 `<Rule />`） |
| 卡片 padding | 32px | `p-8` |
| 卡片内 meta 下距 | 20px | `mb-5` |
| 卡片标题下距 | 12px | `mb-3` |

**文章页 prose 宽度同为 720px**——不使用更宽的布局，可读性优先。

### 圆角规范

不同组件使用**略微不同**的圆角，不是"全站一个值"：

| 组件 | 圆角 |
|---|---|
| 色板 swatch | `rounded-[7px]` |
| 按钮 | `rounded-[7px]` |
| 次按钮 / 主题切换按钮 | `rounded-[6px]` |
| 卡片 / 代码块容器 | `rounded-[8px]` |
| Chip | `rounded-[5px]` |

用 `rounded-md` / `rounded-lg` 会不准。**用样片里的具体像素值**。

### 组件样式规范

以下是样片里各组件的**实现级规格**。最终的 class 组合以样片为准，这里列语义：

#### Section Label

- `font-mono text-[9.5px] tracking-[0.16em] uppercase`
- `text-ink-muted dark:text-night-muted`
- `mb-6 select-none`

#### Chip（元数据小标签）

- `font-mono text-[9.5px] tracking-[0.11em] uppercase`
- `text-accent border border-accent/30`
- `rounded-[5px] px-1.5 py-[2px] leading-none`

#### 主按钮（Primary）

- `font-news font-medium text-[15px]`
- `bg-accent text-white`
- `rounded-[7px] px-5 py-2.5`
- `transition-all duration-150 ease-out`
- hover: `hover:bg-accent-hover hover:-translate-y-px`
- active: `active:translate-y-0`

#### 次按钮（Secondary）

- `font-news font-medium text-[15px]`
- `border border-ink-faint dark:border-night-border`
- `text-ink dark:text-night-text`
- `rounded-[7px] px-5 py-2.5`
- `transition-all duration-150 ease-out`
- hover: `hover:border-ink-muted dark:hover:border-night-muted hover:-translate-y-px`

#### 主题切换按钮（特殊次按钮）

- `flex items-center gap-2`
- `font-mono text-[10px] tracking-[0.1em] uppercase`
- `text-ink-muted dark:text-night-muted`
- `border border-ink-faint dark:border-night-border`
- `rounded-[6px] px-3 py-1.5`
- `transition-all duration-150 ease-out`
- hover: `hover:border-ink-muted dark:hover:border-night-muted hover:text-ink dark:hover:text-night-text`
- 内容：`◑ Dark` / `☀ Light`（字形 + 空格 + 文字）

#### 文章卡片（Article Card）

根元素：`article group cursor-pointer`

- `border border-ink-faint dark:border-night-border`
- `rounded-[8px] p-8`
- `transition-all duration-150 ease-out`
- hover:
  - `hover:border-ink-muted dark:hover:border-night-muted`
  - `hover:shadow-[0_2px_16px_rgba(0,0,0,0.05)]`
  - `dark:hover:shadow-[0_2px_16px_rgba(0,0,0,0.35)]`

内部结构（自上而下）：

1. **meta row**：`flex items-center gap-3 mb-5`
   - Chip（分类）
   - `<time>`: `font-news text-sm text-ink-muted dark:text-night-muted`
2. **标题 H3**：`.fvar-h3 font-fraunces font-semibold text-[24px] leading-[1.3] tracking-tight mb-3`
   - 色：`text-ink dark:text-night-text`
   - hover 跟随 group：`group-hover:text-accent transition-colors duration-150 ease-out`
3. **描述**：`font-news text-[16.5px] leading-relaxed text-ink-muted dark:text-night-muted`

#### 代码块（Expressive Code 主题目标）

整体容器：`rounded-[8px] border border-ink-faint dark:border-night-border overflow-hidden`

**Toolbar**：
- `flex items-center justify-between px-5 py-3`
- light bg: `#F0EFE9`（比 paper 略深的"代码卡片色"，没对应 Tailwind token，用任意值类 `bg-[#F0EFE9]`）
- dark bg: `dark:bg-night-surface`（`#0F0F0D`）
- 下边框：`border-b border-ink-faint dark:border-night-border`
- 左侧：三个 2.5×2.5 `rounded-full` 小圆点，`bg-ink-faint dark:bg-night-border`，`gap-1.5`
- 右侧：文件名 `font-mono text-[9.5px] tracking-wide text-ink-muted dark:text-night-muted`

**代码区**：
- `font-mono text-[13.5px] leading-[1.82]`
- `p-5 overflow-x-auto`
- light bg: `bg-[#F6F5F0]`
- dark bg: `dark:bg-[#0C0C0A]`
- 文字色：`text-ink dark:text-night-text`
- 行号：`select-none w-6 text-right mr-5 shrink-0 text-[12px] leading-[1.82] text-ink-faint dark:text-night-muted`

**语法高亮 token**（配置 Expressive Code / Shiki 的双主题）：

| Token | Light | Dark |
|---|---|---|
| keyword (`interface`, `const`, `return`, `function`, `type`, `export`, `extends`) | `#B5512E` | `#E08A68` |
| type (`string`, `number`, `boolean`, `Date`, `void`, custom types) | `#3878A8` | `#79B0D4` |
| string literal | `#4E8C68` | `#7DC49A` |
| comment (italic) | `#A09890` | `#5A5A52` |
| 默认文字 | `#1F1F1C` | `#EDECEA` |

**Expressive Code 配置提示**：不能原样使用内置主题（如 `github-light`）——它们会自带和站点不协调的背景色、边框、阴影。**必须用 `styleOverrides`** 把 `codeBackground`、`borderColor`、`frames.frameBoxShadow`、`frames.editorBackground`、`frames.editorTabBarBackground` 全部对齐到上述规格。首选方案：基于 `github-light` + `one-dark-pro` 做 minimal override，或直接构造一对自定义 Shiki 主题 JSON。

#### Sticky Header

- `sticky top-0 z-20`
- `backdrop-blur-sm bg-paper/90 dark:bg-night/90`（半透明 + 模糊，滚动时透出下方内容）
- `border-b border-ink-faint dark:border-night-border`
- `transition-colors duration-300`
- 内容容器：`max-w-[720px] mx-auto px-8 h-14 flex items-center justify-between`
- 左侧：品牌字（Fraunces medium 15px）+ 可选版本号 chip
- 右侧：导航链接 + 主题切换按钮（island）

#### Footer

- `border-t border-ink-faint dark:border-night-border`
- 内容容器：`max-w-[720px] mx-auto px-8 py-6 flex items-center justify-between`
- 文字：`font-mono text-[9.5px] tracking-[0.14em] uppercase text-ink-faint dark:text-night-muted`

### 过渡与动效

| 场景 | 参数 |
|---|---|
| 常规交互 hover（按钮、卡片、链接） | `duration-150 ease-out` |
| 主题色切换（页面大面积颜色变化） | `duration-300 ease-out`，写在外层 `.grain` 容器上 |
| 按钮 hover 上浮 | `-translate-y-px`（仅 1px） |
| 按钮 active 回落 | `translate-y-0` |
| 卡片 hover 阴影 | `shadow-[0_2px_16px_rgba(0,0,0,0.05)]` / dark `rgba(0,0,0,0.35)` |
| 卡片标题 accent 跟随 | `group-hover:text-accent transition-colors duration-150 ease-out` |

**禁用的动效**：parallax、scroll-triggered 旋转/缩放、> 300ms 的 ease 曲线、bounce / spring、闪烁的 pulse。首屏可以用一次轻微淡入（`opacity` + `translate-y-2` → `0`）但不是必需。

### 特效

#### 纸面颗粒（Paper Grain）— 仅 Light 模式

在页面最外层容器加 `.grain` class，通过 `::after` 伪元素叠一层 SVG noise，营造"暖纸"质感。**Dark 模式必须关闭**（`.dark .grain::after { opacity: 0; }`）。

```css
.grain::after {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
}
.dark .grain::after { opacity: 0; }
```

**完整 SVG data URI 和文字一字不差**——见 `style-specimen.html` 第 63–69 行。不要自己改 `baseFrequency` 或 `opacity`。

#### 文本选择高亮

全站 accent 色 18% 透明度：

```css
::selection { background: rgba(201, 100, 66, 0.18); }
```

### Markdown Prose 样式

文章正文（markdown 渲染）的默认样式必须和样片的 Body text 一致：

| 元素 | 样式 |
|---|---|
| `<p>` | `font-news text-[18px] leading-[1.85] text-ink dark:text-night-text`；中文段落 `leading-[2.0]` |
| `<h1>` | 与英文 H1 规格一致，`.fvar-h1` + Fraunces 900 + 60px + lh 1.05 |
| `<h2>` | `.fvar-h2` + Fraunces 600 + 40px + lh 1.15 |
| `<h3>` | `.fvar-h3` + Fraunces 400 + 26px + lh 1.38 |
| `<a>` | `text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent transition-colors` |
| `<blockquote>` | `border-l-2 border-accent/50 pl-4 italic text-ink-muted dark:text-night-muted` |
| inline `<code>` | `font-mono text-[0.92em] bg-ink-faint/30 dark:bg-night-border/50 rounded px-1 py-0.5` |
| 代码块 (fenced) | 见"代码块"组件，由 Expressive Code 渲染 |
| `<ul>` / `<ol>` | `font-news text-[18px] leading-[1.85]`，`<li>` 有 `mb-2` |
| `<hr>` | `border-0 border-t border-ink-faint dark:border-night-border my-14` |
| 行宽 | `max-w-[720px]`（不使用 `@tailwindcss/typography` 默认的 65ch） |

**不要使用 `@tailwindcss/typography` 的默认 `prose` 样式**——它会与上述 token 冲突。正确做法二选一：
- **A. 手写一组 prose CSS**（几十行，放 `global.css` 或单独的 `prose.css`）
- **B. 引入 `@tailwindcss/typography` 后在 Tailwind config 的 `typography` 里**完全覆盖**默认值**——工作量和方案 A 差不多

推荐方案 A，更透明，更好调。

### KaTeX 样式调整

KaTeX 默认 CSS 会引入自己的 Computer Modern 字体——**保留数学公式本身的字体**（它的 math font 就是对的），但周围的布局参数要覆盖：

- 块级公式 `$$...$$`：`my-6` + `overflow-x-auto`
- 居中块级公式
- 公式颜色跟随 `currentColor`，自然继承 `text-ink` / `text-night-text`
- **确认 KaTeX CSS 在 `global.css` 里被全站引入**（不是按需）

### Favicon / OG 图（占位策略）

上线阶段先做最小占位，不阻塞发布：

- **Favicon**：从 Fraunces 字母 "a" 出发，paper 背景 + ink 字 + accent 点作装饰。32×32 + 180×180 + 192×192 + 512×512 放 `public/`
- **OG 默认图**：1200×630，paper 背景，居中品牌字 `afourblog`（Fraunces 900 + accent 色装饰线），放 `public/og-default.png`
- **精致化版本**（构建期 Satori 生成的动态 OG）：列入**未来扩展**，不做在 v1

---

### 与样片的对齐原则

1. 任何本节与 `style-specimen.html` 不一致的地方，**以样片为准**
2. 样片里出现的 class 组合（尤其是 `bg-[#F0EFE9]`、`bg-[#F6F5F0]`、`bg-[#0C0C0A]` 这类任意值）**原样使用**，不要转成"最近的 Tailwind 预设"——样片里的每一个像素和每一个十六进制都是作者确认过的
3. 样片是 Tailwind CDN play mode + React + Babel standalone 的开发版——生产实现时**不要把这些 CDN 搬进来**，而是：
   - Fraunces / Newsreader / JetBrains Mono / Noto Serif SC 通过 `@fontsource*` 本地化
   - Tailwind 在 Astro 项目里正常通过 `@astrojs/tailwind` integration 加载
   - React 组件通过 `@astrojs/react` integration 在构建期 SSR
   - 所有 CSS 变量和 class 和样片一致

---

## 未来扩展路径（现在不做，但不堵）

- **动态功能**：评论 / 点赞 / 访问统计 → 加独立 **Rust 后端（axum）**，前端 island 走 `fetch`，CORS 配两行
  - 前端部署保持 GH Pages 不变
  - 后端独立部署（VPS / Cloudflare Workers / 其它）
- **Astro SSR 模式**：真需要时加 adapter，某些路由变 SSR，其它保持静态
- **迁移到其它平台**：有自定义域名后 DNS 一改就能迁到 Cloudflare Pages / Vercel
- **C++ 后端**：**不推荐**（生态太薄），Rust 是 web 后端的明显更优选择

**关键**：现在不需要为这些付任何前期成本。Astro 的渐进升级路径保证了这一点。

---

## 关键禁忌速查（DO NOT）

- ❌ **不要用 React Context 共享状态跨 island**——每个 island 是独立 React root
- ❌ **不要把整个 header / page 做成一个大 island**——island 粒度要细
- ❌ **不要在 `src/` 外（`public/`）放博客图片**——不会被优化
- ❌ **不要用 `public/` 放 `cover` 图**——cover 字段必须走 `image()` schema，必须在 post 目录内
- ❌ **不要手动写 `slug` 字段**——文件名就是 slug
- ❌ **不要给 `category` 写多值**——单值固定枚举
- ❌ **不要把 `category` 放进 URL**——URL 永远是 `/posts/<slug>`
- ❌ **不要忘了 `site` 字段**——RSS / sitemap / Pagefind / OG 全依赖它
- ❌ **不要在 `astro build` 之前跑 pagefind**——顺序反了没索引
- ❌ **不要用 `gh-pages` 分支部署**——用 `actions/deploy-pages`
- ❌ **不要把 `public/.nojekyll` 删掉**——会被 Jekyll 坑
- ❌ **不要用 MathJax**——运行时 JS 渲染，违背静态优先
- ❌ **不要迁回 Hugo / Next.js / SvelteKit**——每个都有明确的拒绝理由（见技术栈表）

---

## 状态索引

### 已锁定（可以直接据此实现）

- ✅ 整体技术栈
- ✅ Front matter schema
- ✅ 文件 / 目录结构
- ✅ URL 结构
- ✅ 组件架构（static vs island，主题切换模式）
- ✅ 构建 / 部署流程（GitHub Actions → Pages）
- ✅ 内容增强配置（Expressive Code / KaTeX / RSS / Sitemap / OG）
- ✅ **设计系统 token**（字体 / 色板 / 排版尺度 / 布局常量 / 组件样式 / 动效 / 特效）
- ✅ **视觉样片** `style-specimen.html`（作者已确认通过）

### 待进行

- ✅ 项目脚手架初始化（已完成；当前为 Astro 2 兼容实现）
- ✅ Tailwind config / global.css / font loading 已落地
- ✅ Content Collection schema 已落地（`src/content/config.ts`）
- ✅ `BaseLayout.astro` + 主题初始化内联脚本已落地
- ✅ 首页（`src/pages/index.astro`）已落地
- ✅ 文章页（`src/pages/posts/[...slug].astro`）已落地
- ✅ 归档页 + 分类页 + 标签页（含 `/categories`、`/tags` 索引）已落地
- ✅ KaTeX + 数学公式测试已通过
- ✅ RSS / Sitemap / robots / .nojekyll / 404 / favicon / OG 默认图占位
- ✅ Pagefind 集成（构建后执行 + 搜索 island）
- ⏸ Expressive Code 主题 override（暂不启用；当前使用默认代码块，保留复制按钮）
- ⏳ GitHub Actions workflow（`.github/workflows/deploy.yml`）
- ✅ Favicon / OG 默认图占位
- ✅ 第一篇验证文章（dummy）已落地，待替换为正式内容

### 建议的实施顺序

推荐按以下顺序推进，每一步都能独立验证：

1. **脚手架 + 字体 + Tailwind config + global.css** → `npm run dev` 打开首页应看到 paper 背景 + 正确字体
2. **`BaseLayout.astro` + 主题切换 island + `.grain`** → 主题切换应该工作，dark/light 视觉对齐样片
3. **Content Collection schema + 一篇 dummy 文章** → 构建成功，schema 校验生效
4. **首页** → 列出文章，样式匹配样片
5. **文章页 + prose 样式 + Expressive Code** → 代码块、标题、正文都对齐样片
6. **归档 / 分类 / 标签静态路由** → 三个列表页面生成
7. **KaTeX + 数学公式测试** ✅
8. **RSS / Sitemap / robots / 404 / favicon** ✅
9. **Pagefind + 搜索 island** ✅
10. **GitHub Actions workflow + 首次部署** ⏳

每一步完成后都应和样片做视觉对比，发现偏差立即修正。
