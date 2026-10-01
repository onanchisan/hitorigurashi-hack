// 公開前の自己検証。1つでも失敗したら exit 1 (=公開しない)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const errors = [], warns = [];

const BAN = ['必ず', '絶対', '最安', '確実に得', '誰でも稼', '投資', '副業', '情報商材', 'ローン', 'ギャンブル', '100%'];
const STALE_DAYS = 90;
const dir = path.join(root, 'content', 'articles');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
if (!files.length) errors.push('記事がない');

for (const f of files) {
  const a = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const id = a.slug || f;
  for (const k of ['slug', 'category', 'title', 'desc', 'published', 'checked', 'lead', 'points', 'sections', 'sources']) if (!a[k]) errors.push(`${id}: ${k}がない`);
  if (!cfg.categories[a.category]) errors.push(`${id}: 未定義のカテゴリ ${a.category}`);
  if (!a.sources?.length) errors.push(`${id}: 出典がない`);
  for (const s of a.sources || []) {
    if (!/^https:\/\//.test(s.url)) errors.push(`${id}: 出典URLが不正 ${s.url}`);
    if (!s.checkedOn) errors.push(`${id}: 出典の確認日がない`);
    else {
      const age = (Date.now() - new Date(s.checkedOn).getTime()) / 864e5;
      if (age > STALE_DAYS) warns.push(`${id}: 出典の確認から${Math.floor(age)}日。再確認が必要 (${s.title.slice(0, 30)})`);
    }
  }
  const text = JSON.stringify(a);
  for (const b of BAN) if (text.includes(b)) errors.push(`${id}: 禁止表現「${b}」`);
  const aff = cfg.affiliateBlocks[a.slug];
  if (aff?.length && !aff.every((b) => b.title)) errors.push(`${id}: アフィリエイトブロックの形式が不正`);
  const html = path.join(docs, 'hack', `${a.slug}.html`);
  if (!fs.existsSync(html)) { errors.push(`${id}: 生成されたHTMLがない`); continue; }
  const h = fs.readFileSync(html, 'utf8');
  if (!h.includes('参考にした公式情報')) errors.push(`${id}: 出典セクションがない`);
  if (!h.includes('時点の内容を確認しています')) errors.push(`${id}: 確認日の注記がない`);
  if (/undefined|NaN|>null</.test(h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''))) errors.push(`${id}: 不正な値(undefined/NaN/null)`);
  if (aff?.length && !h.includes('class="pr"')) errors.push(`${id}: アフィリエイトなのに「PR」表記がない`);
}

for (const f of ['index.html', 'about.html', 'sitemap.xml', 'robots.txt', 'style.css']) if (!fs.existsSync(path.join(docs, f))) errors.push(`${f}がない`);
const about = fs.existsSync(path.join(docs, 'about.html')) ? fs.readFileSync(path.join(docs, 'about.html'), 'utf8') : '';
for (const k of ['運営者', 'AIの利用', '免責事項', 'プライバシーポリシー', 'PR']) if (!about.includes(k)) errors.push(`about.htmlに「${k}」の記載がない`);
if (cfg.googleAnalyticsId && !about.includes('Googleアナリティクス')) errors.push('GA導入済みなのにプライバシーポリシーに記載がない');
if (cfg.googleAnalyticsId && !/^G-[A-Z0-9]+$/.test(cfg.googleAnalyticsId)) errors.push('googleAnalyticsIdの形式が不正（G-XXXXXXXXXX）');
if (fs.existsSync(path.join(docs, 'sitemap.xml')) && fs.readFileSync(path.join(docs, 'sitemap.xml'), 'utf8').includes('YOUR-USER')) errors.push('sitemap.xmlのURLが仮の値');

for (const w of warns) console.warn('警告: ' + w);
if (errors.length) { console.error('検証NG:\n- ' + errors.join('\n- ')); process.exit(1); }
console.log(`検証OK: 記事${files.length}本`);
