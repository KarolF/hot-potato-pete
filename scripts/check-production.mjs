import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const target of ['dist', 'dist-poki']) {
  const directory = path.join(root, target);
  const scripts = readdirSync(directory).filter((name) => name.endsWith('.js'));
  assert.deepEqual(scripts, ['bundle.min.js'], `${target} has unexpected JavaScript chunks`);
  const bundle = readFileSync(path.join(directory, scripts[0]), 'utf8');
  for (const marker of ['hot-potato-pete-dev', 'botCardCssClickPoints', 'forcePlayerWin', 'installDebugBridge', 'winMatch']) {
    assert(!bundle.includes(marker), `${target} includes development marker: ${marker}`);
  }
  assert(!/window\.(?:hotPotatoPete|game)\s*=/.test(bundle), `${target} exports a browser debug bridge`);
  const pack = JSON.parse(readFileSync(path.join(directory, 'assets/asset-pack.json'), 'utf8'));
  for (const asset of pack.section1.files) {
    for (const url of [asset.url].flat()) {
      assert(existsSync(path.resolve(directory, 'assets', url)), `${target} is missing ${url}`);
    }
  }
  assert(existsSync(path.join(directory, 'licenses/phaser.txt')), 'Missing Phaser license');
  console.log(`${target}: no debug bridge or cheats; all assets present; ${statSync(path.join(directory, scripts[0])).size} JS bytes.`);
}
