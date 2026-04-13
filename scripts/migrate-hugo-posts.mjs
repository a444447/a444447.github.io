#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

const SOURCE_ROOT = '/Users/afourseven/blog/content/posts';
const TARGET_ROOT = path.resolve('src/content/posts');
const REPORT_PATH = path.resolve('migration-report.md');
const WRITE = process.argv.includes('--write');

const SKIP_EXACT = new Set([
  '_index.md',
  'hello-world.md',
  'tech/zzz-demo.md',
  'tech/建站技术/write-shortcodes.md',
]);

const CATEGORY_MAP = new Map([
  ['算法', '技术'],
  ['技术', '技术'],
  ['深度学习入门', '技术'],
  ['cs231n', '技术'],
  ['机器学习', '技术'],
  ['仿真', '技术'],
  ['golang', '技术'],
  ['harness工程', '技术'],
  ['mit6824', '技术'],
  ['编译器', '技术'],
  ['llvm', '技术'],
  ['建站技术', '技术'],
  ['音视频', '技术'],
  ['研究生', '生活'],
  ['未分类', '随笔'],
]);

const PINYIN_WORDS = new Map([
  ['数组', 'array'],
  ['二分查找', 'binary-search'],
  ['移除元素', 'remove-element'],
  ['长度最小的子数组', 'minimum-size-subarray-sum'],
  ['有序数组的平方', 'sorted-squares'],
  ['螺旋矩阵与总结', 'spiral-matrix-summary'],
  ['链表', 'linked-list'],
  ['移动', 'move'],
  ['设计链表元素', 'design-linked-list'],
  ['翻转', 'reverse'],
  ['交换', 'swap'],
  ['删除', 'remove'],
  ['相邻重复', 'adjacent-duplicates'],
  ['相交', 'intersection'],
  ['环形', 'cycle'],
  ['哈希表', 'hash-table'],
  ['有效字母异位词', 'valid-anagram'],
  ['数组交集', 'array-intersection'],
  ['快乐数', 'happy-number'],
  ['两数之和', 'two-sum'],
  ['四数相加', 'four-sum-count'],
  ['赎金信', 'ransom-note'],
  ['三数', 'three-sum'],
  ['四数之和', 'four-sum'],
  ['字符串', 'string'],
  ['反转字符串', 'reverse-string'],
  ['翻转单词', 'reverse-words'],
  ['右旋转', 'right-rotate'],
  ['实现', 'implement'],
  ['重复子字符串', 'repeated-substring'],
  ['栈与队列', 'stack-queue'],
  ['有效的括号', 'valid-parentheses'],
  ['逆波兰', 'rpn'],
  ['滑动窗口最大值', 'sliding-window-maximum'],
  ['前k个高频元素', 'top-k-frequent'],
  ['二叉树', 'binary-tree'],
  ['层次遍历', 'level-order'],
  ['续', 'continued'],
  ['第二周', 'week-2'],
  ['第三周', 'week-3'],
  ['回溯', 'backtracking'],
  ['第一周', 'week-1'],
  ['贪心', 'greedy'],
  ['动态规划', 'dynamic-programming'],
  ['第四次', 'part-4'],
  ['第五次', 'part-5'],
  ['子序列', 'subsequence'],
  ['单调栈', 'monotonic-stack'],
  ['图论', 'graph'],
  ['并查集', 'union-find'],
  ['前缀树', 'trie'],
  ['记录', 'notes'],
  ['笔记', 'notes'],
  ['入门', 'intro'],
  ['编写一个LLVM后端', 'write-an-llvm-backend'],
  ['为cpu0实现llvm后端', 'llvm-backend-for-cpu0'],
  ['总结', 'summary'],
  ['音视频', 'audio-video'],
  ['无题', 'untitled'],
  ['仿真调研', 'simulation-research'],
  ['仿真', 'simulation'],
  ['架构', 'architecture'],
  ['机制', 'mechanism'],
  ['大模型', 'llm'],
  ['技术', 'tech'],
  ['算法', 'algorithm'],
]);

function normalizeRel(file) {
  return path.relative(SOURCE_ROOT, file).split(path.sep).join('/');
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(full);
  }
  return files.sort();
}

function splitFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, body: raw, rawFrontmatter: '' };
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: raw, rawFrontmatter: '' };
  const rawFrontmatter = match[1];
  let data = {};
  try {
    data = YAML.parse(rawFrontmatter) || {};
  } catch (error) {
    data = { __parseError: error.message };
  }
  return { data, body: raw.slice(match[0].length), rawFrontmatter };
}

function asArray(value) {
  if (Array.isArray(value)) return value.map(String).map((v) => v.trim()).filter(Boolean);
  if (typeof value === 'string') return [value.trim()].filter(Boolean);
  return [];
}

function getOldCategories(data) {
  return [...asArray(data.categories), ...asArray(data.Categories)];
}

function getCategory(oldCategories, rel) {
  for (const category of oldCategories) {
    if (CATEGORY_MAP.has(category)) return CATEGORY_MAP.get(category);
  }
  if (rel.startsWith('algorithm/')) return '技术';
  if (rel.startsWith('dl-learning/') || rel.startsWith('llvm/') || rel.startsWith('tech/')) return '技术';
  if (rel.startsWith('杂文/')) return '随笔';
  return '随笔';
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function toDateOnly(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function replaceKnownChinese(input) {
  let output = input;
  const entries = [...PINYIN_WORDS.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [cn, en] of entries) output = output.replaceAll(cn, `-${en}-`);
  return output;
}

function slugify(input) {
  const replaced = replaceKnownChinese(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[+]/g, 'plus')
    .replace(/[&]/g, 'and')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
  return replaced || 'post';
}

function makeTargetSlug(dateOnly, rel, title) {
  const withoutExt = rel.replace(/\.md$/, '');
  const sourcePart = slugify(withoutExt);
  const titlePart = slugify(title || '');
  const stem = sourcePart === 'post' ? titlePart : sourcePart;
  return `${dateOnly}-${stem}`;
}

function stripHtml(value) {
  return value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
}

function removeShortcodesForDescription(body) {
  return body
    .replace(/\{\{<\s*imgcap[\s\S]*?>\}\}/g, '')
    .replace(/\{\{<\/?\s*(notice|blockquote|detail)[^>]*>\}\}/g, '')
    .replace(/\{\{<[^>]+>\}\}/g, '');
}

function makeDescription(body) {
  const cleaned = removeShortcodesForDescription(body)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .split(/\r?\n/)
    .map((line) => stripHtml(line).replace(/^#+\s*/, '').trim())
    .filter((line) => line && !/^[-*_]{3,}$/.test(line) && !line.startsWith('|'));
  const first = cleaned.find((line) => /[\p{Letter}\p{Number}]/u.test(line)) || '迁移自旧版 Hugo 博客。';
  return first.length > 110 ? `${first.slice(0, 107)}...` : first;
}

function parseAttrs(input) {
  const attrs = {};
  for (const match of input.matchAll(/(\w+)=("[^"]*"|'[^']*'|[^\s>]+)/g)) {
    attrs[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return attrs;
}

function blockquoteIntro(attrs) {
  const title = attrs.title || '引用';
  const author = attrs.author || '';
  const link = attrs.link || '';
  const titleText = link ? `[**${title}**](${link})` : `**${title}**`;
  return author ? `${titleText}  \n来源：${author}` : titleText;
}

function quoteBlock(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length || (lines.length === 1 && !lines[0])) return '';
  return lines.map((line) => (line.trim() ? `> ${line}` : '>')).join('\n');
}

function convertContainerShortcode(body, name, openerRegex, renderHeader) {
  let output = body;
  let changed = true;
  while (changed) {
    changed = false;
    output = output.replace(new RegExp(`${openerRegex.source}([\\s\\S]*?)\\{\\{<\\s*\\/${name}\\s*>\\}\\}`, 'g'), (full, open, inner) => {
      changed = true;
      return renderHeader(open, inner);
    });
  }
  return output;
}

function convertShortcodes(body) {
  let output = body;

  output = convertContainerShortcode(
    output,
    'notice',
    /\{\{<\s*notice\s+([^>]+?)\s*>\}\}/,
    (kind, inner) => {
      const labelMap = { note: 'Note', info: 'Info', tip: 'Tip', warning: 'Warning', 'notice-note': 'Note' };
      const label = labelMap[kind.trim()] || kind.trim();
      return `\n> **${label}**\n>\n${quoteBlock(inner)}\n`;
    },
  );

  output = convertContainerShortcode(
    output,
    'notice',
    /\{\{<\s*notice\s*([^>]*?)\s*>\}\}/,
    (kind, inner) => {
      const label = kind.trim() || 'Note';
      return `\n> **${label}**\n>\n${quoteBlock(inner)}\n`;
    },
  );

  output = convertContainerShortcode(
    output,
    'blockquote',
    /\{\{<\s*blockquote\s*([^>]*?)\s*>\}\}/,
    (attrText, inner) => {
      const attrs = parseAttrs(attrText);
      const intro = Object.keys(attrs).length ? `${blockquoteIntro(attrs)}\n\n` : '';
      return `\n${quoteBlock(`${intro}${inner}`)}\n`;
    },
  );

  output = output.replace(/\{\{<\s*imgcap\s+([^>]+?)\s*>\}\}/g, (_, attrText) => {
    const attrs = parseAttrs(attrText);
    if (!attrs.src) return '';
    const title = attrs.title || '';
    return `\n<figure>\n  <img src="${attrs.src}" alt="${title}">\n${title ? `  <figcaption>${title}</figcaption>\n` : ''}</figure>\n`;
  });

  output = output.replace(/\{\{<\s*align\s+(left|center|right)\s+"([^"]*)"\s*>\}\}/g, (_, align, text) => {
    return `\n<p style="text-align: ${align};">${text}</p>\n`;
  });

  output = output.replace(/\{\{<\s*mark\s+text="([^"]*)"\s*>\}\}/g, '<mark>$1</mark>');

  output = convertContainerShortcode(
    output,
    'detail',
    /\{\{<\s*detail\s+"([^"]*)"\s*>\}\}/,
    (summary, inner) => `\n<details>\n  <summary>${summary}</summary>\n\n${inner.trim()}\n</details>\n`,
  );

  output = output.replace(/\{\{<\s*\/notice\s*>\}\}/g, '');
  output = output.replace(/\{\{<\s*\/blockquote\s*>\}\}/g, '');
  output = output.replace(/\{\{<\s*[^>]+>\}\}/g, (match) => `<!-- TODO unsupported Hugo shortcode: ${match.replace(/--/g, '')} -->`);

  return output.replace(/\n{4,}/g, '\n\n\n');
}

function normalizeFenceLanguages(body) {
  const languageMap = new Map([
    ['c++', 'cpp'],
    ['llvm', 'text'],
  ]);

  return body.replace(/^```([^\s`]+)(.*)$/gm, (full, lang, rest) => {
    const normalized = languageMap.get(lang.toLowerCase());
    return normalized ? `\`\`\`${normalized}${rest}` : full;
  });
}

function rewriteLocalImages(body, sourceDir, targetDir, copiedAssets, issues) {
  return body.replace(/!\[([^\]]*)\]\(([^)\s]+)([^)]*)\)/g, (full, alt, rawUrl, rest) => {
    if (/^(https?:)?\/\//.test(rawUrl) || rawUrl.startsWith('#') || rawUrl.startsWith('/')) return full;
    const sourceAsset = path.resolve(sourceDir, decodeURIComponent(rawUrl));
    const assetName = path.basename(sourceAsset);
    const targetAsset = path.join(targetDir, assetName);
    copiedAssets.push({ sourceAsset, targetAsset, assetName });
    return `![${alt}](./${assetName}${rest})`;
  });
}

function makeFrontmatter({ title, dateOnly, description, category, tags, draft }) {
  const lines = ['---'];
  lines.push(`title: ${yamlString(title)}`);
  lines.push(`date: ${dateOnly}`);
  lines.push(`description: ${yamlString(description)}`);
  lines.push(`category: ${yamlString(category)}`);
  if (tags.length) {
    lines.push('tags:');
    for (const tag of tags) lines.push(`  - ${yamlString(tag)}`);
  }
  lines.push(`draft: ${draft ? 'true' : 'false'}`);
  lines.push('---');
  return `${lines.join('\n')}\n\n`;
}

async function pathExists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function main() {
  const files = await walk(SOURCE_ROOT);
  const rows = [];

  for (const file of files) {
    const rel = normalizeRel(file);
    const raw = await fs.readFile(file, 'utf8');
    const { data, body } = splitFrontmatter(raw);
    const issues = [];
    const copiedAssets = [];
    let action = 'migrate';

    if (SKIP_EXACT.has(rel)) action = 'skip';
    if (data.__parseError) issues.push(`frontmatter parse error: ${data.__parseError}`);

    const title = data.title ? String(data.title) : '';
    const dateOnly = data.date ? toDateOnly(data.date) : '';
    const draftValue = data.draft;
    const draft = draftValue === true;
    if (draftValue !== undefined && typeof draftValue !== 'boolean') issues.push(`invalid draft value: ${String(draftValue)}`);
    if (!title) issues.push('missing title');
    if (!dateOnly) issues.push('missing date');
    if (draft) action = 'skip';
    if (issues.some((issue) => issue.startsWith('missing') || issue.startsWith('frontmatter') || issue.startsWith('invalid draft'))) action = 'skip';

    const oldCategories = getOldCategories(data);
    const category = getCategory(oldCategories, rel);
    const tags = [...new Set([...oldCategories, ...rel.split('/').slice(0, -1)])]
      .map((tag) => tag.trim())
      .filter((tag) => tag && !['未分类', 'Demo Post', 'getting started', 'test'].includes(tag));
    const description = makeDescription(body);
    const targetSlug = dateOnly && title ? makeTargetSlug(dateOnly, rel, title) : '';
    const targetDir = targetSlug ? path.join(TARGET_ROOT, targetSlug) : '';
    const targetFile = targetDir ? path.join(targetDir, 'index.md') : '';

    let convertedBody = normalizeFenceLanguages(convertShortcodes(body)).trim() + '\n';
    convertedBody = rewriteLocalImages(convertedBody, path.dirname(file), targetDir, copiedAssets, issues);
    if (/\{\{<|\{\{</.test(convertedBody)) issues.push('unconverted shortcode remains');

    rows.push({ rel, action, title, dateOnly, draft, oldCategories, category, tags, description, targetSlug, targetFile, issues, copiedAssets });

    if (WRITE && action === 'migrate') {
      if (await pathExists(targetDir)) throw new Error(`Target already exists: ${targetDir}`);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(targetFile, makeFrontmatter({ title, dateOnly, description, category, tags, draft: false }) + convertedBody);
      for (const asset of copiedAssets) {
        if (await pathExists(asset.sourceAsset)) {
          await fs.copyFile(asset.sourceAsset, asset.targetAsset);
        } else {
          console.warn(`Missing local asset for ${rel}: ${asset.sourceAsset}`);
        }
      }
    }
  }

  const migrating = rows.filter((row) => row.action === 'migrate');
  const skipped = rows.filter((row) => row.action === 'skip');
  const withIssues = rows.filter((row) => row.issues.length);
  const report = [];
  report.push('# Hugo Migration Report');
  report.push('');
  report.push(`Mode: ${WRITE ? 'write' : 'dry-run'}`);
  report.push(`Source: \`${SOURCE_ROOT}\``);
  report.push(`Target: \`${TARGET_ROOT}\``);
  report.push('');
  report.push(`- Total markdown files: ${rows.length}`);
  report.push(`- Will migrate: ${migrating.length}`);
  report.push(`- Skipped: ${skipped.length}`);
  report.push(`- With issues: ${withIssues.length}`);
  report.push('');
  report.push('## Migrating');
  report.push('');
  for (const row of migrating) {
    report.push(`- \`${row.rel}\` -> \`${row.targetSlug}/\``);
    report.push(`  - title: ${row.title}`);
    report.push(`  - date: ${row.dateOnly}`);
    report.push(`  - category: ${row.category}`);
    report.push(`  - tags: ${row.tags.join(', ') || '(none)'}`);
    report.push(`  - description: ${row.description}`);
    if (row.copiedAssets.length) report.push(`  - local assets: ${row.copiedAssets.map((a) => a.assetName).join(', ')}`);
    if (row.issues.length) report.push(`  - issues: ${row.issues.join('; ')}`);
  }
  report.push('');
  report.push('## Skipped');
  report.push('');
  for (const row of skipped) {
    const reasons = [];
    if (SKIP_EXACT.has(row.rel)) reasons.push('explicit skip');
    if (row.draft) reasons.push('draft true');
    reasons.push(...row.issues);
    report.push(`- \`${row.rel}\`: ${reasons.join('; ') || 'skipped'}`);
  }

  await fs.writeFile(REPORT_PATH, `${report.join('\n')}\n`);
  console.log(`${WRITE ? 'Migrated' : 'Analyzed'} ${rows.length} files.`);
  console.log(`Will migrate: ${migrating.length}; skipped: ${skipped.length}; with issues: ${withIssues.length}.`);
  console.log(`Report written to ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
