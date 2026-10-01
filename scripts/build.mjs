// content/articles/*.json から静的サイトを docs/ に生成する（TikTok誘導サイト「ひとり暮らしハック」）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const out = path.join(root, 'docs');
const BASE = (process.env.SITE_BASE_URL || cfg.baseUrl).replace(/\/$/, '');

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const ymd = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${y}年${m}月${d}日`; };
const write = (rel, html) => { fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true }); fs.writeFileSync(path.join(out, rel), html); };

const dir = path.join(root, 'content', 'articles');
const articles = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
  .sort((a, b) => (b.published + b.slug).localeCompare(a.published + a.slug));

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'img'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'assets'))) fs.copyFileSync(path.join(root, 'assets', f), path.join(out, 'img', f));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);

const css = `:root{--bg:#fffaf0;--fg:#3a2410;--mut:#7a6650;--card:#fff;--line:#f0e2c4;--acc:#e8932a;--acc2:#2a9d8f;--hot:#e8453c;--soft:#fff0cf}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;font:16px/1.85 system-ui,"Hiragino Sans","Yu Gothic",sans-serif;background:var(--bg);color:var(--fg)}
a{color:#b45f06}img{max-width:100%;height:auto}
header{background:var(--acc);padding:10px 16px}header a{color:#fff;text-decoration:none}
.w{max-width:760px;margin:0 auto}main.w{padding:8px 16px 24px}
.brand{display:flex;align-items:center;gap:10px}.brand img{width:44px;height:44px;border-radius:50%;background:#fff;object-fit:cover}
.brand strong{font-size:1.15rem;display:block;line-height:1.3}.brand span{font-size:.78rem;opacity:.95}
nav{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:.92rem}
h1{font-size:1.45rem;line-height:1.45;margin:.8em 0 .4em}h2{font-size:1.2rem;margin:2.2em 0 .6em;padding-left:10px;border-left:6px solid var(--acc)}
.meta{color:var(--mut);font-size:.88rem}.badge{display:inline-block;font-size:.78rem;padding:1px 9px;border-radius:99px;background:var(--soft);color:#8a4b00;margin-right:6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:12px 0}.card h3{margin:0 0 4px;font-size:1.05rem;line-height:1.5}.card p{margin:.3em 0 0;color:var(--mut);font-size:.92rem}
.hero{display:flex;align-items:center;gap:14px;background:var(--soft);border-radius:16px;padding:14px 16px;margin:14px 0}.hero img{width:96px;flex:none}
.bubble{display:flex;gap:12px;align-items:flex-start;margin:14px 0}.bubble img{width:72px;flex:none}.bubble div{background:#fff;border:2px solid var(--acc);border-radius:14px;padding:10px 14px;position:relative}
.points{background:#fff;border:2px solid var(--acc2);border-radius:12px;padding:12px 16px}.points strong{color:var(--acc2)}.points ul{margin:.4em 0 0;padding-left:1.2em}
table{border-collapse:collapse;width:100%;background:#fff;font-size:.92rem}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}th{background:var(--soft)}
.note{background:#fff3d6;border:1px solid #f0d9a0;border-radius:10px;padding:10px 14px;font-size:.9rem;margin:12px 0}
.btn{display:inline-block;background:var(--hot);color:#fff;text-decoration:none;padding:10px 18px;border-radius:99px;font-weight:700;margin:6px 0}
.src li{margin:.4em 0;font-size:.9rem}.pr{display:inline-block;font-size:.72rem;background:#999;color:#fff;border-radius:4px;padding:0 6px;margin-right:6px}
footer{background:#3a2410;color:#f6e7c8;padding:18px 16px;font-size:.85rem;margin-top:32px}footer a{color:#ffd88a}
ol,ul{padding-left:1.4em}li{margin:.25em 0}details{background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 14px;margin:8px 0}summary{cursor:pointer;font-weight:700}`;
fs.writeFileSync(path.join(out, 'style.css'), css);

const gaScript = cfg.googleAnalyticsId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(cfg.googleAnalyticsId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(cfg.googleAnalyticsId)}');</script>` : '';
const adsScript = cfg.adsenseClient ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(cfg.adsenseClient)}" crossorigin="anonymous"></script>` : '';
const nav = `<a href="${BASE}/">ホーム</a>${Object.entries(cfg.categories).map(([k, c]) => `<a href="${BASE}/c/${k}.html">${esc(c.name)}</a>`).join('')}<a href="${BASE}/about.html">このサイトについて</a>`;

const page = ({ title, desc, path: p, body, ld, noTitleSuffix }) => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}${noTitleSuffix ? '' : '｜' + esc(cfg.siteName)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${BASE}${p}"><link rel="stylesheet" href="${BASE}/style.css">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="article"><meta property="og:url" content="${BASE}${p}"><meta property="og:image" content="${BASE}/img/nachi-smile.png">
${cfg.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(cfg.googleSiteVerification)}">` : ''}${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}${gaScript}${adsScript}</head>
<body><header><div class="w"><a class="brand" href="${BASE}/"><img src="${BASE}/img/nachi-smile.png" alt="なちくん"><span><strong>${esc(cfg.siteName)}</strong><span>${esc(cfg.tagline)}</span></span></a><nav>${nav}</nav></div></header>
<main class="w">${body}</main>
<footer><div class="w">${esc(cfg.contactText)}<br>情報は公的機関・メーカー等の公式情報をもとに、AIの補助を受けて作成しています。内容は確認日時点のもので、変更される場合があります。最新情報は各公式サイトでご確認ください。<br><a href="${BASE}/about.html">このサイトについて・免責・プライバシーポリシー</a>　<a href="${esc(cfg.tiktokUrl)}" rel="noopener">TikTok</a></div></footer></body></html>`;

const card = (a) => `<div class="card"><h3><a href="${BASE}/hack/${a.slug}.html">${esc(a.title)}</a></h3><div class="meta"><span class="badge">${esc(cfg.categories[a.category].name)}</span>確認日：${ymd(a.checked)}</div><p>${esc(a.desc)}</p></div>`;

const sectionHtml = (s) => {
  let h = `<h2>${esc(s.h)}</h2>`;
  for (const t of s.p || []) h += `<p>${esc(t)}</p>`;
  if (s.ol) h += `<ol>${s.ol.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;
  if (s.ul) h += `<ul>${s.ul.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  if (s.table) h += `<div style="overflow-x:auto"><table><tr>${s.table.head.map((x) => `<th>${esc(x)}</th>`).join('')}</tr>${s.table.rows.map((r) => `<tr>${r.map((x) => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table></div>`;
  for (const t of s.p2 || []) h += `<p>${esc(t)}</p>`;
  if (s.note) h += `<p class="note">${esc(s.note)}</p>`;
  return h;
};

for (const a of articles) {
  const related = articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  const aff = (cfg.affiliateBlocks[a.slug] || []).map((b) => `<div class="card"><span class="pr">PR</span><strong>${esc(b.title)}</strong><div>${b.html}</div></div>`).join('');
  const ld = {
    '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.desc, inLanguage: 'ja',
    datePublished: a.published, dateModified: a.checked, mainEntityOfPage: `${BASE}/hack/${a.slug}.html`,
    author: { '@type': 'Organization', name: cfg.operatorName }, publisher: { '@type': 'Organization', name: cfg.operatorName },
    image: `${BASE}/img/nachi-${a.nachi || 'smile'}.png`, citation: a.sources.map((s) => s.url),
  };
  const faqLd = a.faq?.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  const body = `<p class="meta"><a href="${BASE}/">ホーム</a> ＞ <a href="${BASE}/c/${a.category}.html">${esc(cfg.categories[a.category].name)}</a></p>
<h1>${esc(a.title)}</h1><div class="meta">公開日：${ymd(a.published)}　確認日：${ymd(a.checked)}</div>
<div class="bubble"><img src="${BASE}/img/nachi-${a.nachi || 'smile'}.png" alt="なちくん"><div><strong>なちくん</strong><br>${esc(a.lead)}</div></div>
<div class="points"><strong>この記事のポイント</strong><ul>${a.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
${a.tiktok?.url ? `<p><a class="btn" href="${esc(a.tiktok.url)}" rel="noopener">▶ TikTokの動画で見る</a></p>` : ''}
${a.sections.map(sectionHtml).join('')}${aff}
${a.faq?.length ? `<h2>よくある質問</h2>${a.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : ''}
<h2>参考にした公式情報</h2><ul class="src">${a.sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener nofollow">${esc(s.title)}</a>（確認日：${ymd(s.checkedOn)}）</li>`).join('')}</ul>
<p class="note">この記事は、上記の公式情報をもとに作成し、${ymd(a.checked)}時点の内容を確認しています。制度・価格・製品仕様は変更されることがあります。実際の手続きや製品の使用にあたっては、公式の最新情報・製品の表示をご確認ください。</p>
<h2>あわせて読みたい</h2>${related.map(card).join('')}`;
  write(`hack/${a.slug}.html`, page({ title: a.title, desc: a.desc, path: `/hack/${a.slug}.html`, body, ld: faqLd ? [ld, faqLd] : ld }));
}

// ホーム
write('index.html', page({
  title: `${cfg.siteName}｜${cfg.tagline}`, noTitleSuffix: true, desc: 'ひとり暮らしの洗濯・手続き・防災などのハックを、公式情報をもとにわかりやすくまとめたサイト。TikTok「ひとり暮らしハックなち」の保存版です。', path: '/',
  body: `<div class="hero"><img src="${BASE}/img/nachi-happy.png" alt="なちくん"><div><h1 style="margin:0">ひとり暮らしの“困った”を、ハックで解決！</h1><p style="margin:.4em 0 0">ライフハック大好き「なちくん」が、公式情報をもとに、毎日の暮らしに役立つコツを紹介するよ。</p></div></div>
<p><a class="btn" href="${esc(cfg.tiktokUrl)}" rel="noopener">▶ TikTokでも見る</a></p>
<h2>新着の記事</h2>${articles.map(card).join('')}
<h2>カテゴリから探す</h2>${Object.entries(cfg.categories).map(([k, c]) => `<div class="card"><h3><a href="${BASE}/c/${k}.html">${esc(c.name)}</a></h3><p>${esc(c.desc)}（${articles.filter((a) => a.category === k).length}件）</p></div>`).join('')}`,
}));

// カテゴリ
for (const [k, c] of Object.entries(cfg.categories)) {
  const l = articles.filter((a) => a.category === k);
  write(`c/${k}.html`, page({ title: `${c.name}の記事一覧`, desc: c.desc, path: `/c/${k}.html`, body: `<h1>${esc(c.name)}</h1><p>${esc(c.desc)}</p>${l.map(card).join('') || '<p>準備中です。</p>'}` }));
}

// このサイトについて
write('about.html', page({
  title: 'このサイトについて・免責・プライバシーポリシー', desc: '運営者情報、情報の作り方、AIの利用、免責事項、プライバシーポリシー、広告の表記について', path: '/about.html',
  body: `<h1>このサイトについて</h1>
<h2>運営者</h2><p>${esc(cfg.operatorName)}が運営しています。TikTokアカウント「<a href="${esc(cfg.tiktokUrl)}" rel="noopener">@hitorigurashi_nachi</a>」で配信している動画の内容を、保存版の記事としてまとめるサイトです。</p>
<h2>情報の作り方</h2><p>記事は、官公庁・自治体・メーカーなどの公式情報を参照して作成しています。各記事の末尾に、参考にした公式情報へのリンクと確認日を載せています。個人の体験談や、出典のない数字は載せない方針です。</p>
<h2>AIの利用について</h2><p>記事・動画の企画、文章の作成、動画の制作には、AI（Claude）の補助を利用しています。公開前に、出典と記載内容の整合を確認しています。それでも誤りが含まれる可能性があるため、重要な手続きや製品の使用にあたっては、必ず公式の最新情報をご確認ください。動画の音声は合成音声（VOICEVOX：猫使アル）です。</p>
<h2>免責事項</h2><p>本サイトの情報は、確認日時点のものです。制度・価格・製品仕様は予告なく変更されることがあります。本サイトの情報を利用して生じた損害について、当サイトは責任を負いません。個別の状況に関する判断は、公的機関やメーカー、専門家にご相談ください。</p>
<h2>広告・アフィリエイトについて</h2><p>当サイトは、今後、広告（Google AdSense等）やアフィリエイトプログラムを利用する場合があります。広告・アフィリエイトリンクを含む記事・箇所には「PR」と表示します。広告の有無によって、記事の内容や評価を変えることはありません。</p>
<h2>プライバシーポリシー</h2><p>当サイトは、広告配信・アクセス解析のために、Cookie等を利用する場合があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。Cookieは、ブラウザの設定で無効にできます。${cfg.googleAnalyticsId ? '当サイトは、アクセス状況を把握するために、Googleが提供するアクセス解析ツール「Googleアナリティクス」を利用しています。Googleアナリティクスは、Cookieを使用してトラフィックデータを収集します。このデータは匿名で収集されており、個人を特定するものではありません。収集を望まない場合は、Cookieを無効にするか、<a href="https://tools.google.com/dlpage/gaoptout?hl=ja" rel="noopener nofollow">Google アナリティクス オプトアウト アドオン</a>をご利用ください。詳しくは、<a href="https://policies.google.com/technologies/partner-sites?hl=ja" rel="noopener nofollow">Googleのポリシー</a>をご確認ください。' : ''}取得した情報は、サイトの改善以外の目的には使用しません。</p>
<h2>著作権・引用について</h2><p>キャラクター「なちくん」のイラストは、運営者が作成した素材です。参照した公式情報の著作権は、各権利者に帰属します。当サイトは、出典を明記し、要約・加工して掲載しています。</p>
<h2>お問い合わせ</h2><p>${cfg.contactUrl ? `<a href="${esc(cfg.contactUrl)}" rel="noopener">お問い合わせフォーム</a>` : 'お問い合わせの方法は準備中です。内容の誤りのご指摘は、TikTokアカウントのコメントまたはDMでお知らせください。'}</p>`,
}));

// サイトマップ
const urls = ['/', '/about.html', ...Object.keys(cfg.categories).map((k) => `/c/${k}.html`), ...articles.map((a) => `/hack/${a.slug}.html`)];
const lastmod = articles.map((a) => a.checked).sort().pop();
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${BASE}${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('')}</urlset>`);
console.log(`生成完了: 記事${articles.length}本 / ページ${urls.length}件`);
