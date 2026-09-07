import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(demosRoot, 'manifest.json'), 'utf8'));
const decisions = JSON.parse(readFileSync(join(demosRoot, 'integration-decisions.json'), 'utf8'));
const releaseManifestPath = join(demosRoot, manifest.currentRelease.manifest);
const release = JSON.parse(readFileSync(releaseManifestPath, 'utf8'));
const deployments = JSON.parse(readFileSync(join(demosRoot, 'deployments.json'), 'utf8'));

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
assert.equal(release.deploymentManifest, 'deployments.json', 'release must identify its deployment contract');
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

assert.equal(deployments.schemaVersion, 1, 'deployment manifest schema must be version 1');
assert.equal(deployments.repository, release.repository, 'deployment repository must remain canonical');
assert.equal(deployments.releaseVersion, release.version, 'deployments must target the current release');
assert.equal(deployments.suiteTag, release.suiteTag, 'deployments must target the current suite tag');
assert.equal(deployments.domain.status, 'active', 'inttegro.dev must be recorded as an active release domain');
assert.equal(deployments.domain.provider, 'cloudflare');
assert.match(deployments.domain.activatedAt, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(deployments.domain.catalogHost, 'demos.inttegro.dev');
assert.equal(deployments.domain.demoHostTemplate, '{id}-demo.inttegro.dev');
assert.equal(deployments.domain.nativeBackendHost, 'mobile-api.inttegro.dev');
assert.equal(deployments.deployRefTemplate, 'deploy-{id}-v{version}');
assert.equal(deployments.environment.INTTEGRO_DEMO_CUSTOMER_ID.default, false);
for (const name of ['INTTEGRO_API_KEY', 'INTTEGRO_DEMO_PRODUCT_ID', 'INTTEGRO_DEMO_PRICE_ID', 'INTTEGRO_DEMO_PUBLIC_URL']) {
  assert.equal(deployments.environment[name].required, true, `${name} must be required for every server demo`);
}
assert.deepEqual(
  deployments.demos.map((demo) => demo.id).toSorted(),
  v1.map((demo) => demo.id).toSorted(),
  'deployment metadata must cover every V1 demo exactly once',
);

const providerStatuses = new Set(['prepared', 'verified', 'blocked']);
const providerRecommendations = new Set(['recommended', 'alternative', 'experimental']);
const providerIds = new Set(Object.keys(deployments.providers));
for (const provider of Object.values(deployments.providers)) {
  assert.match(provider.documentation, /^https:\/\//, `${provider.name} must link its canonical deployment documentation`);
  assert.match(provider.icon, /^\/assets\/providers\/[a-z-]+\.svg$/, `${provider.name} must define its provider icon`);
  assert(existsSync(join(demosRoot, provider.icon.slice(1))), `${provider.name} provider icon must exist`);
  if (provider.buttonImage) {
    assert.match(provider.buttonImage, /^https:\/\//, `${provider.name} button image must use HTTPS`);
  }
}

for (const demo of deployments.demos) {
  assert.equal(new Set(demo.providers.map((provider) => provider.id)).size, demo.providers.length, `${demo.id} provider IDs must be unique`);
  if (demo.mode === 'native') {
    assert.equal(demo.providers.length, 0, `${demo.id} must not advertise a cloud deployment for native application code`);
    assert.equal(demo.companionBackend, 'nextjs', `${demo.id} must identify the shared mobile backend`);
    continue;
  }
  if (demo.live) {
    assert.equal(demo.live.status, 'verified', `${demo.id} live deployment must be verified`);
    assert(['cloudflare', 'railway'].includes(demo.live.provider), `${demo.id} uses an unknown live provider`);
    assert.equal(
      demo.live.url,
      `https://${deployments.domain.demoHostTemplate.replace('{id}', demo.id)}`,
      `${demo.id} live URL must use the canonical host`,
    );
  }
  assert(demo.providers.length > 0, `${demo.id} must document at least one provider`);
  assert.equal(
    demo.providers.filter((provider) => provider.recommendation === 'recommended').length,
    1,
    `${demo.id} must identify exactly one recommended provider`,
  );
  for (const provider of demo.providers) {
    assert(providerIds.has(provider.id), `${demo.id} references unknown provider ${provider.id}`);
    assert(providerStatuses.has(provider.status), `${demo.id}/${provider.id} has invalid status`);
    assert(providerRecommendations.has(provider.recommendation), `${demo.id}/${provider.id} has invalid recommendation`);
    if (provider.config) {
      assert(existsSync(join(demosRoot, provider.config)), `${demo.id}/${provider.id} config does not exist: ${provider.config}`);
    }
    if (provider.status === 'blocked') {
      assert(provider.reason, `${demo.id}/${provider.id} must explain why it is blocked`);
    } else {
      assert(provider.config, `${demo.id}/${provider.id} must point to checked-in configuration`);
    }
    if (provider.id === 'railway' && provider.status !== 'blocked') {
      assert.match(
        provider.templateId,
        /^[A-Za-z0-9_-]{6}$/,
        `${demo.id}/railway must identify its shareable one-click template`,
      );
    }
  }
}

for (const id of ['nextjs', 'nuxt', 'express', 'django', 'fastapi', 'rails', 'laravel', 'go']) {
  const demo = deployments.demos.find((candidate) => candidate.id === id);
  assert.equal(demo.live?.status, 'verified', `${id} must record its verified first-party deployment`);
}
assert.equal(
  deployments.demos.find((demo) => demo.id === 'spring-boot').live,
  undefined,
  'Spring Boot must not claim a live deployment while its SDK publication is gated',
);

for (const id of ['express', 'django', 'fastapi', 'rails', 'laravel', 'go', 'spring-boot']) {
  for (const file of ['Dockerfile', '.dockerignore', 'render.yaml', 'railway.json']) {
    assert(existsSync(join(demosRoot, id, file)), `${id} must include ${file} for portable deployment`);
  }
}

for (const id of ['express', 'django', 'fastapi', 'go', 'rails', 'laravel']) {
  const deployment = deployments.demos.find((demo) => demo.id === id);
  const provider = deployment.providers.find((candidate) => candidate.id === 'cloud-run');
  assert(
    ['prepared', 'verified'].includes(provider.status),
    `${id}/cloud-run must be reader-launchable in the current release`,
  );
  assert.equal(provider.config, `${id}/app.json`, `${id}/cloud-run must reference its app.json contract`);

  const cloudRun = JSON.parse(readFileSync(join(demosRoot, id, 'app.json'), 'utf8'));
  for (const name of ['INTTEGRO_API_KEY', 'INTTEGRO_DEMO_PRODUCT_ID', 'INTTEGRO_DEMO_PRICE_ID']) {
    assert(cloudRun.env[name], `${id}/app.json must prompt for ${name}`);
  }
  assert.equal(cloudRun.env.INTTEGRO_API_KEY.value, undefined, `${id}/app.json must not contain an API key`);
  assert.equal(cloudRun.env.INTTEGRO_API_KEY.generator, undefined, `${id}/app.json must prompt for the API key`);
  assert.equal(cloudRun.options['allow-unauthenticated'], true, `${id} must create a public demo service`);
  assert(cloudRun.options['max-instances'] <= 3, `${id} must cap Cloud Run scale for reader cost safety`);
  const postcreate = cloudRun.hooks?.postcreate?.commands?.join('\n') ?? '';
  assert(postcreate.includes('$SERVICE_URL'), `${id} must derive its Cloud Run public origin`);
  assert(postcreate.includes('INTTEGRO_DEMO_PUBLIC_URL'), `${id} must configure its checkout return origin`);

  const readme = readFileSync(join(demosRoot, id, 'README.md'), 'utf8');
  assert(
    readme.includes(
      `https://deploy.cloud.run/?git_repo=https%3A%2F%2Fgithub.com%2Fzebodotdev%2Finttegro-demos.git&revision=deploy-${id}-v${release.version}`,
    ),
    `${id} README must launch Cloud Run from its immutable deployment ref`,
  );
}

const djangoCloudRun = JSON.parse(readFileSync(join(demosRoot, 'django/app.json'), 'utf8'));
assert.equal(djangoCloudRun.env.DJANGO_SECRET_KEY.generator, 'secret');
assert(djangoCloudRun.hooks.postcreate.commands.join('\n').includes('DJANGO_ALLOWED_HOSTS'));
assert(djangoCloudRun.hooks.postcreate.commands.join('\n').includes('DJANGO_CSRF_TRUSTED_ORIGINS'));
const railsCloudRun = JSON.parse(readFileSync(join(demosRoot, 'rails/app.json'), 'utf8'));
assert.equal(railsCloudRun.env.SECRET_KEY_BASE.generator, 'secret');
const laravelCloudRun = JSON.parse(readFileSync(join(demosRoot, 'laravel/app.json'), 'utf8'));
assert.equal(laravelCloudRun.env.APP_KEY.value, undefined);
assert.equal(laravelCloudRun.env.APP_KEY.generator, undefined);
assert(laravelCloudRun.env.APP_KEY.description.includes('key:generate --show'));

for (const id of ['express', 'django', 'fastapi', 'laravel', 'go']) {
  const railway = JSON.parse(readFileSync(join(demosRoot, id, 'railway.json'), 'utf8'));
  assert.equal(railway.deploy?.healthcheckPath, '/health', `${id} must retain its Railway health probe`);
}
const railsRailway = JSON.parse(readFileSync(join(demosRoot, 'rails/railway.json'), 'utf8'));
assert.equal(
  railsRailway.deploy?.healthcheckPath,
  undefined,
  'Rails must use Railway process readiness because its production HTTP probe redirects to HTTPS',
);

for (const id of ['nextjs', 'nuxt']) {
  assert(existsSync(join(demosRoot, id, 'vercel.json')), `${id} must include an explicit Vercel contract`);
  assert(existsSync(join(demosRoot, id, 'wrangler.jsonc')), `${id} must include an explicit Cloudflare contract`);
}
assert(existsSync(join(demosRoot, 'express/wrangler.jsonc')), 'Express must include its Cloudflare Worker contract');
assert(existsSync(join(demosRoot, 'catalog/wrangler.jsonc')), 'catalogue must be ready for Cloudflare Static Assets');
assert(existsSync(join(demosRoot, 'hosting/railway-edge/wrangler.jsonc')), 'Railway-hosted demos must define their first-party edge routes');

for (const configPath of ['nextjs/wrangler.jsonc', 'nuxt/wrangler.jsonc', 'express/wrangler.jsonc', 'catalog/wrangler.jsonc']) {
  const config = readFileSync(join(demosRoot, configPath), 'utf8');
  assert(!config.includes('inttegro.dev'), `${configPath} must remain host-neutral for reader-owned deployment`);
}
const nuxtWorkerConfig = readFileSync(join(demosRoot, 'nuxt/wrangler.jsonc'), 'utf8');
assert(
  nuxtWorkerConfig.includes('"no_nodejs_compat", "no_nodejs_compat_v2"'),
  'Nuxt must keep Nitro Node shims isolated from Cloudflare runtime Node shims',
);
for (const configPath of ['nextjs/wrangler.jsonc', 'express/wrangler.jsonc']) {
  const config = readFileSync(join(demosRoot, configPath), 'utf8');
  assert(
    config.includes('"nodejs_compat_populate_process_env"'),
    `${configPath} must map Worker bindings into the process.env contract used by its server runtime`,
  );
}

const generatedCatalogue = JSON.parse(readFileSync(join(demosRoot, 'catalog/public/demos.json'), 'utf8'));
assert.equal(generatedCatalogue.releaseVersion, release.version, 'catalogue must describe the current release');
assert.equal(generatedCatalogue.suiteTag, release.suiteTag, 'catalogue suite tag must be current');
assert.equal(generatedCatalogue.domainStatus, 'active', 'catalogue must label the active release domain truthfully');
assert.deepEqual(
  generatedCatalogue.demos.map((demo) => demo.id),
  v1.map((demo) => demo.id),
  'catalogue order must follow the V1 manifest',
);
const generatedNext = generatedCatalogue.demos.find((demo) => demo.id === 'nextjs');
assert(
  generatedNext.environment.some((variable) => variable.name === 'INTTEGRO_DEMO_CUSTOMER_ID'),
  'Next.js catalogue deployment requirements must include the mobile demo customer',
);
for (const demo of generatedCatalogue.demos.filter((candidate) => candidate.mode === 'server')) {
  const activeProviders = demo.providers.filter((provider) =>
    ['prepared', 'verified'].includes(provider.status),
  );
  const unavailableProviders = demo.providers.filter(
    (provider) => !['prepared', 'verified'].includes(provider.status),
  );
  assert.deepEqual(
    demo.providers,
    [...activeProviders, ...unavailableProviders],
    `${demo.id} must list active providers before unavailable providers`,
  );
  for (const [group, providers] of [
    ['active', activeProviders],
    ['unavailable', unavailableProviders],
  ]) {
    assert.deepEqual(
      providers.map((provider) => provider.name),
      providers.map((provider) => provider.name).toSorted((left, right) => left.localeCompare(right)),
      `${demo.id} ${group} providers must be alphabetical`,
    );
  }
  const expectedProductName = demo.id === 'nuxt' ? 'NUXT_DEMO_PRODUCT_ID' : 'INTTEGRO_DEMO_PRODUCT_ID';
  const expectedPriceName = demo.id === 'nuxt' ? 'NUXT_DEMO_PRICE_ID' : 'INTTEGRO_DEMO_PRICE_ID';
  assert(
    demo.environment.some((variable) => variable.name === expectedProductName),
    `${demo.id} must declare its server-side Product ID`,
  );
  assert(
    demo.environment.some((variable) => variable.name === expectedPriceName),
    `${demo.id} must declare its server-side Price ID`,
  );
}
for (const demo of generatedCatalogue.demos.filter((candidate) => candidate.mode === 'server' && candidate.id !== 'nextjs')) {
  assert(
    !demo.environment.some((variable) => variable.name === 'INTTEGRO_DEMO_CUSTOMER_ID'),
    `${demo.id} must not request the Next.js-only demo customer`,
  );
}

const catalogueApplication = readFileSync(join(demosRoot, 'catalog/public/app.js'), 'utf8');
assert(
  catalogueApplication.includes('const deploymentSource = `${data.repository}/tree/${demo.deployRef}`'),
  'catalogue deploy actions must use root-level immutable deployment refs',
);
assert(
  !catalogueApplication.includes('taggedSubdirectory'),
  'catalogue deploy actions must not send provider builds to tagged subdirectories',
);
assert(
  catalogueApplication.includes("['prepared', 'verified'].includes(provider.status)"),
  'catalogue must let readers launch prepared or verified provider configurations',
);
assert(
  catalogueApplication.includes('railway.com/new/template/${provider.templateId}'),
  'catalogue must build Railway actions from the release manifest template code',
);
assert(
  catalogueApplication.includes('https://deploy.cloud.run/?${query}'),
  'catalogue must build Cloud Run actions from immutable deployment refs',
);
assert(
  catalogueApplication.includes('<img src="${provider.icon}" alt="" />'),
  'catalogue provider choices must use provider logos',
);
const catalogueDocument = readFileSync(join(demosRoot, 'catalog/public/index.html'), 'utf8');
assert(!catalogueDocument.includes('Release candidate'), 'published catalogue must not label the current release as a candidate');
for (const providerId of Object.keys(deployments.providers)) {
  assert(
    catalogueDocument.includes(`<option value="${providerId}">`),
    `catalogue filter must expose ${providerId}`,
  );
}

for (const id of ['nextjs', 'nuxt', 'express']) {
  const readme = readFileSync(join(demosRoot, id, 'README.md'), 'utf8');
  assert(
    readme.includes(`/tree/deploy-${id}-v${release.version}`),
    `${id} deployment buttons must target its root-level immutable deployment ref`,
  );
}

const railwayTemplateIds = {
  express: 'MJF7nD',
  django: '0h-Ilj',
  fastapi: 'wk2B6a',
  go: 'ABT6ae',
  rails: 'CssQzr',
  laravel: 'p5qiP5',
};
for (const [id, templateId] of Object.entries(railwayTemplateIds)) {
  const readme = readFileSync(join(demosRoot, id, 'README.md'), 'utf8');
  assert(
    readme.includes(`railway.com/new/template/${templateId}`),
    `${id} README must link its shareable Railway template`,
  );
  const generatedDemo = generatedCatalogue.demos.find((demo) => demo.id === id);
  const railway = generatedDemo.providers.find((provider) => provider.id === 'railway');
  assert.equal(railway.templateId, templateId, `${id} catalogue must expose the Railway template code`);
  assert(
    ['prepared', 'verified'].includes(railway.status),
    `${id} Railway template must be reader-launchable`,
  );
}

for (const id of ['ios-swiftui', 'android-compose', 'flutter', 'react-native-expo']) {
  const readme = readFileSync(join(demosRoot, id, 'README.md'), 'utf8');
  assert(readme.includes('## Deploy the companion backend'), `${id} must explain how to deploy its server trust boundary`);
  assert(
    readme.includes(`/tree/deploy-nextjs-v${release.version}`),
    `${id} companion deployment button must target the immutable Next.js deployment ref`,
  );
}

const deployRefScript = readFileSync(join(demosRoot, 'scripts/prepare-deploy-refs.mjs'), 'utf8');
for (const requiredReleaseGuard of [
  "git(['verify-tag', requestedTag]",
  "git(['verify-tag', sourceDemoTag]",
  "typeof output === 'string' ? output.trim() : ''",
  "`${requestedTag}:LICENSE`",
  ".replaceAll('../DEPLOYING.md'",
]) {
  assert(
    deployRefScript.includes(requiredReleaseGuard),
    `deployment ref preparation must preserve release guard: ${requiredReleaseGuard}`,
  );
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

console.log('Demo contract check passed: release tags, 13 V1 entries, four stories, deployment contracts, catalogue metadata, source commentary, original artwork, and Inttegro SDK naming are consistent.');
