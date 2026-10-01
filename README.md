# 05_サイト：ひとり暮らしハック（TikTok誘導サイト）

TikTok「ひとり暮らしハックなち」の動画を、公式情報つきの保存版記事にまとめる静的サイト。

- `content/articles/*.json` … 記事データ（本文・出典・確認日・FAQ）
- `site.config.json` … サイト名・URL・カテゴリ・広告/アフィリエイト設定
- `assets/` … なちくんの画像
- `scripts/build.mjs` … 記事から `docs/` を生成
- `scripts/verify.mjs` … 公開前の自己検証（出典・確認日・禁止表現・PR表記・免責）
- `scripts/publish.mjs` … 生成 → 検証 → push
- `docs/` … 公開用（GitHub Pagesの公開フォルダ）。手で編集しない

```
node scripts/build.mjs
node scripts/verify.mjs
```

公開手順は `../03_手順書/サイト公開手順.md`。記事の追加は、既存のJSONをコピーして書き換える。
