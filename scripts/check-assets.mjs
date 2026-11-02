import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packDirectory = path.join(root, 'public/assets');
const pack = JSON.parse(readFileSync(path.join(packDirectory, 'asset-pack.json'), 'utf8'));
const assets = pack.section1.files;
const keys = new Set();
for (const asset of assets) {
  assert(!keys.has(asset.key), `Duplicate asset key: ${asset.key}`);
  keys.add(asset.key);
  for (const url of [asset.url].flat()) {
    const resolved = path.resolve(packDirectory, url);
    assert(resolved.startsWith(path.join(root, 'public') + path.sep), `Asset escapes public: ${url}`);
    assert(existsSync(resolved), `Missing asset: ${url}`);
  }
}
const constants = readFileSync(path.join(root, 'src/CST.ts'), 'utf8');
const audio = constants.match(/AUDIO: \{([\s\S]*?)\n  \}/)[1];
for (const [, key] of audio.matchAll(/"([^"]+)"/g)) {
  assert(keys.has(key), `Audio constant has no loaded asset: ${key}`);
}
console.log(`Verified ${assets.length} asset keys and every audio constant.`);
