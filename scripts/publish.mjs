// 記事を更新したあとの公開手順: 生成 → 検証 → (OKなら) commit & push
// 使い方: node scripts/publish.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
  console.log(`$ ${cmd} ${args.join(' ')}\n${r.stdout || ''}${r.stderr || ''}`);
  return r.status === 0;
};

for (const step of ['build', 'verify']) {
  if (!run('node', [`scripts/${step}.mjs`])) { console.error(`失敗: ${step}。公開せず終了します`); process.exit(1); }
}
if (!fs.existsSync(path.join(root, '.git'))) { console.log('gitリポジトリ未設定のため公開(push)はスキップ。手順書「サイト公開手順」を参照'); process.exit(0); }
run('git', ['add', '-A']);
if (spawnSync('git', ['diff', '--cached', '--quiet'], { cwd: root }).status === 0) { console.log('変更なし'); process.exit(0); }
const date = new Date().toISOString().slice(0, 10);
if (!run('git', ['commit', '-m', `update ${date}`]) || !run('git', ['push'])) { console.error('git push失敗'); process.exit(1); }
console.log('公開完了');
