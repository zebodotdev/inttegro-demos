import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(demosRoot, 'manifest.json'), 'utf8'));
const decisions = JSON.parse(readFileSync(join(demosRoot, 'integration-decisions.json'), 'utf8'));
const releaseManifestPath = join(demosRoot, manifest.currentRelease.manifest);
const release = JSON.parse(readFileSync(releaseManifestPath, 'utf8'));

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.demos.length, 18, 'the roadmap must contain 18 demos');
assert.equal(new Set(manifest.demos.map((demo) => demo.id)).size, 18, 'demo IDs must be unique');

const v1 = manifest.demos.filter((demo) => demo.release === 'v1');
const v2 = manifest.demos.filter((demo) => demo.release === 'v2');
assert.equal(v1.length, 13, 'V1 must contain 13 demos');
assert.equal(v2.length, 5, 'V2 must contain 5 demos');
assert(v2.every((demo) => demo.status === 'planned'));

assert.equal(release.schemaVersion, 1, 'release manifest schema must be version 1');
assert.match(release.version, /^\d+\.\d+\.\d+$/, 'release version must use SemVer');
assert.equal(manifest.currentRelease.version, release.version, 'current release version must resolve to its manifest');
assert.equal(manifest.currentRelease.suiteTag, release.suiteTag, 'current suite tag must resolve to its manifest');
assert.equal(release.suiteTag, `v${release.version}`, 'suite tag must match the release version');
assert.equal(
  release.repository,
  'https://github.com/zebodotdev/inttegro-demos',
  'release repository must remain canonical',
);
assert.equal(
  release.permalinkTemplate,
  `${release.repository}/blob/{tag}/{file}#L{start}-L{end}`,
  'Studio permalink template must use an immutable tag and explicit line range',
);
assert.equal(
  release.rawTemplate,
  'https://raw.githubusercontent.com/zebodotdev/inttegro-demos/{tag}/{file}',
  'raw source template must use an immutable tag',
);
assert(existsSync(join(demosRoot, release.releaseNotes)), 'release notes referenced by the manifest must exist');
assert.equal(release.demos.length, v1.length, 'current release must include every implemented V1 demo');
assert.deepEqual(
  release.demos.map((demo) => demo.id).toSorted(),
  v1.map((demo) => demo.id).toSorted(),
  'current release demo IDs must match V1',
);
assert.equal(new Set(release.demos.map((demo) => demo.tag)).size, v1.length, 'per-demo release tags must be unique');

for (const demo of release.demos) {
  assert.equal(demo.version, release.version, `${demo.id} version must match the suite release`);
  assert.equal(demo.tag, `${demo.id}-v${release.version}`, `${demo.id} tag must be deterministic`);
  assert.equal(demo.path, demo.id, `${demo.id} release path must match its manifest directory`);
  assert.deepEqual(
    demo.entryPoints,
    decisions.sourceEntryPoints[demo.id],
    `${demo.id} release entry points must match the integration registry`,
  );
  for (const sourcePath of demo.entryPoints) {
    assert(sourcePath.startsWith(`${demo.path}/`), `${sourcePath} must remain inside ${demo.path}`);
    assert(existsSync(join(demosRoot, sourcePath)), `release entry point does not exist: ${sourcePath}`);
  }
}

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

assert(existsSync(join(demosRoot, 'INTEGRATION_GUIDE.md')), 'missing human-readable integration guide');
assert.equal(decisions.schemaVersion, 1, 'integration decision schema must be version 1');
assert.deepEqual(
  decisions.markers,
  ['FLOW', 'SECURITY', 'DECISION', 'ALTERNATIVE', 'VERIFY', 'OBSERVABILITY', 'DOCS'],
  'the public source-comment vocabulary must stay stable',
);

const documentationEntries = Object.entries(decisions.canonicalDocs);
assert(documentationEntries.length >= 8, 'decision registry must link the canonical documentation set');
for (const [key, value] of documentationEntries) {
  assert.match(value, /^https:\/\/studio\.inttegro\.com\/[a-z0-9#/-]+$/, `invalid canonical documentation URL: ${key}`);
}

const decisionIds = decisions.decisions.map((decision) => decision.id);
assert.equal(new Set(decisionIds).size, decisionIds.length, 'integration decision IDs must be unique');
assert(decisionIds.length >= 15, 'decision registry must cover the material integration trade-offs');
for (const decision of decisions.decisions) {
  assert.match(decision.id, /^[a-z0-9-]+$/, `invalid decision ID: ${decision.id}`);
  assert(decision.selected && decision.rationale, `${decision.id} must state the selected option and rationale`);
  assert(decision.alternatives.length > 0, `${decision.id} must document at least one alternative`);
  for (const documentationKey of decision.docs) {
    assert(decisions.canonicalDocs[documentationKey], `${decision.id} references unknown docs key: ${documentationKey}`);
  }
}

assert.deepEqual(
  Object.keys(decisions.sourceEntryPoints).toSorted(),
  v1.map((demo) => demo.id).toSorted(),
  'every V1 demo must have documented source entry points',
);

const knownDecisionIds = new Set(decisionIds);
const decisionReferencePattern = /INTTEGRO:(?:FLOW|SECURITY|DECISION|ALTERNATIVE|VERIFY|OBSERVABILITY) \[([a-z0-9-]+)\]/g;
for (const [demoId, sourcePaths] of Object.entries(decisions.sourceEntryPoints)) {
  let combinedSource = '';
  for (const sourcePath of sourcePaths) {
    const absolutePath = join(demosRoot, sourcePath);
    assert(existsSync(absolutePath), `missing documented source entry point: ${sourcePath}`);
    const source = readFileSync(absolutePath, 'utf8');
    combinedSource += `\n${source}`;
    assert(source.includes('INTTEGRO:'), `${sourcePath} must use the Inttegro comment vocabulary`);
    assert(source.includes('https://studio.inttegro.com/'), `${sourcePath} must link canonical Inttegro documentation`);
    for (const match of source.matchAll(decisionReferencePattern)) {
      assert(knownDecisionIds.has(match[1]), `${sourcePath} references unknown decision ID: ${match[1]}`);
    }
  }
  assert(combinedSource.includes('INTTEGRO:DECISION'), `${demoId} must explain its selected integration decisions`);
  assert(combinedSource.includes('INTTEGRO:ALTERNATIVE'), `${demoId} must explain a viable integration alternative`);
}

const guide = readFileSync(join(demosRoot, 'INTEGRATION_GUIDE.md'), 'utf8');
for (const marker of decisions.markers) {
  assert(guide.includes(`INTTEGRO:${marker}`), `integration guide must define INTTEGRO:${marker}`);
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
  '.swiftpm', '.venv', 'DerivedData', 'build', 'dist', 'node_modules',
  'target', 'vendor',
]);
const textExtensions = new Set([
  '.dart', '.go', '.java', '.json', '.kt', '.kts', '.md', '.php', '.py', '.rb',
  '.swift', '.ts', '.tsx', '.yaml', '.yml',
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

console.log('Demo contract check passed: release tags, 13 V1 entries, four intentional stories, integration decisions, source commentary, original artwork, and Inttegro SDK naming are consistent.');
