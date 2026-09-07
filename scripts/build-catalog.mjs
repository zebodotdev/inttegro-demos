import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const deployments = JSON.parse(readFileSync(join(root, 'deployments.json'), 'utf8'));
const release = JSON.parse(readFileSync(join(root, `releases/v${deployments.releaseVersion}.json`), 'utf8'));
const outputDirectory = join(root, 'catalog/public');
const assetDirectory = join(outputDirectory, 'assets');
const providerAssetDirectory = join(assetDirectory, 'providers');

const releaseById = new Map(release.demos.map((demo) => [demo.id, demo]));
const deploymentById = new Map(deployments.demos.map((demo) => [demo.id, demo]));
const storyLabels = {
  'kora-market': 'Kora Market',
  'afterglow-sessions': 'Afterglow Sessions',
  ledgerline: 'Ledgerline',
  'kora-market-mobile': 'Kora Market mobile',
};

const providerIsActive = (provider) => provider.status === 'prepared' || provider.status === 'verified';
const compareProviders = (left, right) => {
  const activityOrder = Number(providerIsActive(right)) - Number(providerIsActive(left));
  return activityOrder || left.name.localeCompare(right.name);
};

const environmentFor = (demo) => {
  if (demo.mode === 'native') return [];
  const defaultNames = Object.entries(deployments.environment)
    .filter(([, definition]) => definition.default !== false)
    .map(([name]) => name);
  const names = [...defaultNames, ...(demo.additionalEnvironment || [])];
  return names.map((canonicalName) => {
    const name = demo.environmentAliases?.[canonicalName] || canonicalName;
    const common = deployments.environment[canonicalName];
    return {
      name,
      description: common?.description || `A framework signing secret generated in the reader's deployment.`,
      secret: common?.secret ?? true,
    };
  });
};

const demos = manifest.demos.filter((demo) => demo.release === 'v1').map((demo) => {
  const deployment = deploymentById.get(demo.id);
  const released = releaseById.get(demo.id);
  if (!deployment || !released) throw new Error(`Missing release or deployment metadata for ${demo.id}`);
  return {
    id: demo.id,
    technology: demo.technology,
    language: demo.language,
    story: demo.story,
    storyLabel: storyLabels[demo.story],
    releaseStatus: demo.status,
    mode: deployment.mode || 'server',
    companionBackend: deployment.companionBackend,
    live: deployment.live,
    hostname: deployments.domain.demoHostTemplate.replace('{id}', demo.id),
    tag: released.tag,
    deployRef: deployments.deployRefTemplate.replace('{id}', demo.id).replace('{version}', release.version),
    environment: environmentFor(deployment),
    providers: deployment.providers
      .map((provider) => ({
        ...provider,
        name: deployments.providers[provider.id].name,
        icon: deployments.providers[provider.id].icon,
        documentation: deployments.providers[provider.id].documentation,
      }))
      .sort(compareProviders),
  };
});

mkdirSync(assetDirectory, { recursive: true });
mkdirSync(providerAssetDirectory, { recursive: true });
for (const asset of ['kora-dawn-brew.jpg', 'accra-afterglow.jpg', 'ledgerline-studio.jpg', 'favicon.svg']) {
  copyFileSync(join(root, 'assets', asset), join(assetDirectory, asset));
}
for (const provider of Object.values(deployments.providers)) {
  const fileName = provider.icon.split('/').at(-1);
  copyFileSync(join(root, 'assets/providers', fileName), join(providerAssetDirectory, fileName));
}

writeFileSync(join(outputDirectory, 'demos.json'), `${JSON.stringify({
  schemaVersion: 1,
  repository: deployments.repository,
  releaseVersion: release.version,
  suiteTag: release.suiteTag,
  domainStatus: deployments.domain.status,
  demos,
}, null, 2)}\n`);

console.log(`Built catalogue metadata for ${demos.length} demos at ${join(outputDirectory, 'demos.json')}`);
