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

const expectedStories = {
  'kora-market': ['nextjs', 'nuxt', 'rails', 'laravel'],
  'afterglow-sessions': ['express', 'django', 'fastapi'],
  ledgerline: ['go', 'spring-boot'],
  'kora-market-mobile': ['ios-swiftui', 'android-compose', 'flutter', 'react-native-expo'],
};

for (const [story, expectedIds] of Object.entries(expectedStories)) {
  const actualIds = v1.filter((demo) => demo.story === story).map((demo) => demo.id).sort();
  assert.deepEqual(actualIds, expectedIds.toSorted(), `${story} demo mapping must stay intentional`);
}

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

for (const asset of [
  'assets/kora-dawn-brew.jpg',
  'assets/accra-afterglow.jpg',
  'assets/ledgerline-studio.jpg',
  'assets/favicon.svg',
]) {
  assert(existsSync(join(demosRoot, asset)), `missing original demo artwork: ${asset}`);
}

for (const [asset, directories] of Object.entries({
  'kora-dawn-brew.jpg': ['nextjs/public', 'nuxt/public', 'rails/public', 'laravel/public'],
  'accra-afterglow.jpg': ['express/public', 'django/checkout/static/checkout', 'fastapi/app/static'],
  'ledgerline-studio.jpg': ['go/static', 'spring-boot/src/main/resources/static'],
  'favicon.svg': [
    'nextjs/public', 'nuxt/public', 'rails/public', 'laravel/public', 'express/public',
    'django/checkout/static/checkout', 'fastapi/app/static', 'go/static',
    'spring-boot/src/main/resources/static',
  ],
})) {
  for (const directory of directories) {
    assert(existsSync(join(demosRoot, directory, asset)), `missing ${asset} in ${directory}`);
  }
}

for (const mobileArtwork of [
  'android-compose/app/src/main/res/drawable/kora_dawn_brew.jpg',
  'flutter/assets/kora-dawn-brew.jpg',
  'ios-swiftui/InttegroSwiftUIDemo/Assets.xcassets/KoraProduct.imageset/kora-dawn-brew.jpg',
  'react-native-expo/assets/kora-dawn-brew.jpg',
]) {
  assert(existsSync(join(demosRoot, mobileArtwork)), `missing mobile product artwork: ${mobileArtwork}`);
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
const staleStoryName = ['Inttegro integration', 'workshop'].join(' ');
const staleMobileField = ['payment', 'Session', 'Secret'].join('');
for (const path of textFiles(demosRoot)) {
  const source = readFileSync(path, 'utf8');
  assert(!source.includes(staleSDKName), `stale SDK name in ${path}`);
  assert(!source.includes(staleStoryName), `stale generic story in ${path}`);
  assert(!source.includes(staleMobileField), `stale mobile SDK field in ${path}`);
}

console.log('Demo contract check passed: 13 V1 entries, four intentional stories, original artwork, and Inttegro SDK naming are consistent.');
