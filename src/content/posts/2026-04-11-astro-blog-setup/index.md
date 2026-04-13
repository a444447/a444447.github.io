---
title: Astro 博客初始化记录
date: 2026-04-11
description: 这是一篇用于验证 Content Collection schema 与构建链路的示例文章。
category: 技术
tags:
  - astro
  - blog
draft: false
---

这是第三步的 dummy 内容，用来验证 front matter schema。

后续会替换为正式首篇文章。

内联公式示例：欧拉恒等式 $e^{i\pi} + 1 = 0$。

块级公式示例：

$$
\int_{0}^{1} x^2 \, dx = \frac{1}{3}
$$

代码块示例：

```ts
interface PostMeta {
  title: string;
  date: Date;
  draft?: boolean;
}

// 构建期过滤草稿，避免进入 RSS 和 sitemap。
export function isPublished(post: PostMeta): boolean {
  const status = post.draft ? 'draft' : 'published';
  return status === 'published';
}
```
