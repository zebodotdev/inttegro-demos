import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requestedTag = process.argv[2];
const deployments = JSON.parse(readFileSync(join(root, 'deployments.json'), 'utf8'));
const expectedTag = deployments.suiteTag;

if (!requestedTag || requestedTag !== expectedTag) {
  console.error(`Usage: node scripts/prepare-deploy-refs.mjs ${expectedTag}`);
  process.exit(1);
}

const git = (args, options = {}) => {
  const output = execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'inherit'],
    env: options.env || process.env,
  });
  return typeof output === 'string' ? output.trim() : '';
};

let sourceCommit;
try {
  git(['verify-tag', requestedTag], { stdio: ['ignore', 'ignore', 'ignore'] });
  sourceCommit = git(['rev-parse', '--verify', `${requestedTag}^{commit}`], {
    stdio: ['ignore', 'pipe', 'ignore'],
  });
} catch {
  console.error(`Suite tag ${requestedTag} is missing or its signature cannot be verified locally.`);
  process.exit(1);
}

const deployable = deployments.demos.filter((demo) =>
  demo.providers.some((provider) => provider.config),
);
const deploymentRefs = deployable.map((demo) => ({
  demo,
  branch: deployments.deployRefTemplate
    .replace('{id}', demo.id)
    .replace('{version}', deployments.releaseVersion),
  sourceDemoTag: `${demo.id}-v${deployments.releaseVersion}`,
}));

for (const { branch, sourceDemoTag } of deploymentRefs) {
  try {
    git(['verify-tag', sourceDemoTag], { stdio: ['ignore', 'ignore', 'ignore'] });
    const demoCommit = git(['rev-parse', '--verify', `${sourceDemoTag}^{commit}`], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    if (demoCommit !== sourceCommit) throw new Error('tag target mismatch');
  } catch {
    console.error(`${sourceDemoTag} is missing, unverified, or does not match ${requestedTag}.`);
    process.exit(1);
  }

  try {
    git(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
    console.error(`${branch} already exists; release deployment refs are immutable.`);
    process.exit(1);
  } catch (error) {
    if (error.status !== 1) throw error;
  }
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'inttegro-deploy-refs-'));
const licenseBlob = git(['rev-parse', '--verify', `${requestedTag}:LICENSE`]);

try {
  for (const { demo, branch, sourceDemoTag } of deploymentRefs) {
    const ref = `refs/heads/${branch}`;

    const splitCommit = git(['subtree', 'split', '--prefix', demo.id, requestedTag]);
    const metadataPath = join(temporaryDirectory, `${demo.id}.json`);
    writeFileSync(metadataPath, `${JSON.stringify({
      schemaVersion: 1,
      demo: demo.id,
      version: deployments.releaseVersion,
      sourceSuiteTag: requestedTag,
      sourceDemoTag,
      sourceCommit,
      sourceSubtreeCommit: splitCommit,
    }, null, 2)}\n`);

    const indexPath = join(temporaryDirectory, `${demo.id}.index`);
    const indexEnvironment = { ...process.env, GIT_INDEX_FILE: indexPath };
    git(['read-tree', `${splitCommit}^{tree}`], { env: indexEnvironment });

    const taggedReadme = git(['show', `${requestedTag}:${demo.id}/README.md`]);
    const suiteDocumentRoot = `${deployments.repository}/blob/${requestedTag}`;
    const suiteAssetRoot = `${deployments.repository.replace('https://github.com/', 'https://raw.githubusercontent.com/')}/${requestedTag}`;
    const portableReadme = taggedReadme
      .replaceAll('../DEPLOYING.md', `${suiteDocumentRoot}/DEPLOYING.md`)
      .replaceAll('../INTEGRATION_GUIDE.md', `${suiteDocumentRoot}/INTEGRATION_GUIDE.md`)
      .replaceAll('../integration-decisions.json', `${suiteDocumentRoot}/integration-decisions.json`)
      .replaceAll('../assets/providers/docker-button.svg', `${suiteAssetRoot}/assets/providers/docker-button.svg`);
    const readmePath = join(temporaryDirectory, `${demo.id}.README.md`);
    writeFileSync(readmePath, `${portableReadme}\n`);

    const readmeBlob = git(['hash-object', '-w', readmePath]);
    const metadataBlob = git(['hash-object', '-w', metadataPath]);
    git(
      ['update-index', '--add', '--cacheinfo', `100644,${metadataBlob},INTTEGRO_DEMO_RELEASE.json`],
      { env: indexEnvironment },
    );
    git(
      ['update-index', '--add', '--cacheinfo', `100644,${readmeBlob},README.md`],
      { env: indexEnvironment },
    );
    git(
      ['update-index', '--add', '--cacheinfo', `100644,${licenseBlob},LICENSE`],
      { env: indexEnvironment },
    );
    const tree = git(['write-tree'], { env: indexEnvironment });
    const message = `release: prepare ${demo.id} ${deployments.releaseVersion} deploy ref`;
    const commit = execFileSync('git', ['commit-tree', '-S', tree, '-p', splitCommit, '-m', message], {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
      stdio: ['ignore', 'pipe', 'inherit'],
    }).trim();
    git(['update-ref', ref, commit, '']);
    console.log(`${branch} -> ${commit}`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Prepared ${deployable.length} signed local deployment refs; no refs were pushed.`);
