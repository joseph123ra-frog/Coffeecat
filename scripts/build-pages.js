import { access, cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const root = resolve('out/pages');
const slides = process.argv[2] ? resolve(process.argv[2]) : null;
const exists = async (path) => access(path).then(() => true, () => false);

await rm(root, { recursive: true, force: true });
await mkdir(root, { recursive: true });
await cp('games/balance/site', join(root, 'balance'), { recursive: true });
await cp('games/detective/site', join(root, 'detective'), { recursive: true });

if (slides && await exists(slides)) {
  for (const entry of await readdir(slides, { withFileTypes: true })) {
    await cp(join(slides, entry.name), join(root, entry.name), { recursive: entry.isDirectory() });
  }
}

const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
const config = `window.BALANCE_CONFIG = Object.freeze(${JSON.stringify({ supabaseUrl, supabaseAnonKey }, null, 2)});\n`;
await writeFile(join(root, 'balance', 'config.js'), config, 'utf8');
await writeFile(join(root, '.nojekyll'), '', 'utf8');

console.log(`Pages 준비 완료: ${basename(root)} · 밸런스 ${supabaseUrl && supabaseAnonKey ? '집계 연결' : '화면만'} · 탐정 게임`);
