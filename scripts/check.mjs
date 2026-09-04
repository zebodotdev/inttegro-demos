import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(demosRoot, 'manifest.json'), 'utf8'));

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.demos.length, 18, 'the roadmap must contain 18 demos');
assert.equal(new Set(manifest.demos.map((demo) => demo.id)).size, 18, 'demo IDs must be unique');

const v1 = manifest.demos.filter((demo) => demo.release === 'v1');
const v2 = manifest.demos.filter((demo) => demo.release === 'v2');
assert.equal(v1.length, 13, 'V1 must contain 13 demos');
assert.equal(v2.length, 5, 'V2 must contain 5 demos');
assert(v2.every((demo) => demo.status === 'planned'));

for (const demo of v1) {
  const directory = join(demosRoot, demo.id);
  assert(existsSync(directory), `missing V1 directory: ${demo.id}`);
  assert(existsSync(join(directory, 'README.md')), `missing V1 README: ${demo.id}`);
}

for (const id of [
  'nextjs', 'express', 'nuxt', 'go', 'django', 'fastapi', 'rails', 'laravel',
  'spring-boot', 'flutter', 'react-native-expo',
]) {
  assert(existsSync(join(demosRoot, id, '.env.example')), `missing environment template: ${id}`);
}

const skippedDirectories = new Set([
  '.build', '.bundle', '.git', '.gradle', '.kotlin', '.next', '.nuxt', '.output',
  '.swiftpm', '.venv', 'DerivedData', 'build', 'dist', 'lib', 'node_modules',
  'target', 'vendor',
]);
const textExtensions = new Set([
  '.dart', '.json', '.kt', '.kts', '.md', '.php', '.swift', '.ts', '.tsx', '.yaml', '.yml',
]);

function textFiles(directory) {
  const output = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...textFiles(path));
    else if (textExtensions.has(entry.name.slice(entry.name.lastIndexOf('.')))) output.push(path);
  }
  return output;
}

const staleSDKName = ['Inttegro', 'Payments'].join('');
for (const path of textFiles(demosRoot)) {
  assert(!readFileSync(path, 'utf8').includes(staleSDKName), `stale SDK name in ${path}`);
}

console.log('Demo contract check passed: 13 V1 entries, 5 V2 entries, Inttegro SDK naming is consistent.');
