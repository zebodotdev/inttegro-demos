const grid = document.querySelector('#demo-grid');
const emptyState = document.querySelector('#empty-state');
const providerFilter = document.querySelector('#provider-filter');
const dialog = document.querySelector('#deploy-dialog');
const providerList = document.querySelector('#provider-list');
const environmentList = document.querySelector('#environment-list');
const releaseVersion = document.querySelector('#release-version');

const providerDescriptions = {
  cloudflare: 'Runs on Cloudflare Workers with the checked-in runtime adapter.',
  vercel: 'Uses the framework-native Vercel build and project creation flow.',
  render: 'Builds the released Dockerfile through a Render Blueprint.',
  railway: 'Creates an ejectable Railway project from the release-pinned template.',
  'cloud-run': 'Builds the released Dockerfile and creates a public Google Cloud Run service.',
  'app-runner': 'Runs a prebuilt container or connected source repository in AWS App Runner.',
  docker: 'Builds and runs the released container locally with Docker Compose.',
};

const storyDescriptions = {
  'kora-market': 'A considered storefront with a server-side hosted checkout handoff.',
  'afterglow-sessions': 'An editorial event page with a validated ticket reservation flow.',
  ledgerline: 'A focused client invoice portal with an auditable settlement path.',
  'kora-market-mobile': 'A native product journey that presents the Inttegro payment sheet.',
  openfield: 'A community campaign with trusted contribution tiers and immediate checkout.',
};

const storyImages = {
  'kora-market': '/assets/kora-dawn-brew.jpg',
  'afterglow-sessions': '/assets/accra-afterglow.jpg',
  ledgerline: '/assets/ledgerline-studio.jpg',
  'kora-market-mobile': '/assets/kora-dawn-brew.jpg',
  openfield: '/assets/openfield-garden.jpg',
};

let data;
let runtimeFilter = 'all';

function sourceUrl(demo) {
  return `${data.repository}/tree/${encodeURIComponent(demo.tag)}/${demo.id}`;
}

function deployUrl(demo, provider) {
  const deploymentSource = `${data.repository}/tree/${demo.deployRef}`;
  const variables = demo.environment.map((variable) => variable.name).join(',');
  const description = 'Add an Inttegro test API key and the public origin assigned to this deployment.';

  if (provider.id === 'cloudflare') {
    return `https://deploy.workers.cloudflare.com/?url=${encodeURIComponent(deploymentSource)}`;
  }
  if (provider.id === 'vercel') {
    const query = new URLSearchParams({
      'repository-url': deploymentSource,
      'project-name': `inttegro-demo-${demo.id}`,
      'repository-name': `inttegro-demo-${demo.id}`,
      env: variables,
      envDescription: description,
      envLink: 'https://studio.inttegro.com/keys',
    });
    return `https://vercel.com/new/clone?${query}`;
  }
  if (provider.id === 'render') {
    return `https://render.com/deploy?repo=${encodeURIComponent(deploymentSource)}`;
  }
  if (provider.id === 'railway' && provider.templateId) {
    return `https://railway.com/new/template/${provider.templateId}?utm_medium=integration&utm_source=inttegro-demos&utm_campaign=${demo.id}`;
  }
  if (provider.id === 'cloud-run') {
    const query = new URLSearchParams({
      git_repo: `${data.repository}.git`,
      revision: demo.deployRef,
    });
    return `https://deploy.cloud.run/?${query}`;
  }
  if (provider.id === 'docker') {
    return `${data.repository}/blob/${encodeURIComponent(demo.tag)}/${demo.id}/README.md#run-with-docker`;
  }
  return '';
}

function providerState(provider) {
  if (provider.status === 'blocked') return 'Blocked';
  if (provider.status === 'template-pending') return 'Template pending';
  if (provider.status === 'verified') return 'Deploy';
  return 'Prepared';
}

function card(demo, index) {
  const article = document.createElement('article');
  article.className = 'demo-card';
  article.dataset.runtime = demo.mode;
  article.dataset.providers = demo.providers.map((provider) => provider.id).join(' ');
  article.innerHTML = `
    <div class="demo-visual">
      <img src="${storyImages[demo.story]}" alt="" />
      <span class="demo-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="demo-kind">${demo.mode === 'native' ? 'Native SDK' : demo.storyLabel}</span>
    </div>
    <div class="demo-content">
      <div class="demo-meta"><span>${demo.language}</span><span class="status">${demo.releaseStatus}</span></div>
      <h3>${demo.technology}</h3>
      <p>${storyDescriptions[demo.story]}</p>
      ${demo.live?.status === 'verified'
        ? `<a class="hostname" href="${demo.live.url}" rel="noreferrer">Open live demo <span aria-hidden="true">↗</span></a>`
        : `<code class="hostname">${demo.hostname}</code>`}
      <div class="demo-footer">
        <button class="demo-action" type="button">${demo.mode === 'native' ? 'Run this demo' : 'Deploy this demo'} <span aria-hidden="true">↗</span></button>
        <a class="source-link" href="${sourceUrl(demo)}">Tagged source</a>
      </div>
    </div>`;
  article.querySelector('.demo-action').addEventListener('click', () => openDeployDialog(demo));
  return article;
}

function render() {
  const selectedProvider = providerFilter.value;
  const visible = data.demos.filter((demo) => {
    const runtimeMatches = runtimeFilter === 'all' || demo.mode === runtimeFilter;
    const providerMatches = selectedProvider === 'all' || demo.providers.some((provider) => provider.id === selectedProvider);
    return runtimeMatches && providerMatches;
  });

  grid.replaceChildren(...visible.map(card));
  emptyState.hidden = visible.length > 0;
}

function openDeployDialog(demo) {
  dialog.querySelector('#deploy-title span').textContent = demo.technology;
  dialog.querySelector('#deploy-intro').textContent = demo.mode === 'native'
    ? `Run the native application locally and deploy its ${demo.companionBackend} companion backend separately.`
    : `Choose a prepared target. Each flow starts from ${demo.tag}, asks for your own test credentials, and leaves you with source you control.`;

  if (demo.mode === 'native') {
    const backend = data.demos.find((candidate) => candidate.id === demo.companionBackend);
    const dockerUrl = backend ? deployUrl(backend, { id: 'docker' }) : '';
    providerList.innerHTML = `
      <div class="provider-option"><span class="provider-monogram">SDK</span><div class="provider-copy"><strong>Local development</strong><p>Follow the tagged README for platform tooling, simulator, and device instructions.</p></div><a class="provider-action" href="${sourceUrl(demo)}">Open guide</a></div>
      <div class="provider-option"><span class="provider-monogram"><img src="/assets/providers/docker.svg" alt="" /></span><div class="provider-copy"><strong>Docker backend</strong><p>Run the released Next.js companion backend with Docker Compose.</p></div><a class="provider-action" href="${dockerUrl}" rel="noreferrer">Open guide</a></div>`;
  } else {
    providerList.replaceChildren(...demo.providers.map((provider) => {
      const row = document.createElement('div');
      row.className = 'provider-option';
      const url = deployUrl(demo, provider);
      const actionable = ['prepared', 'verified'].includes(provider.status) && Boolean(url);
      row.innerHTML = `
        <span class="provider-monogram"><img src="${provider.icon}" alt="" /></span>
        <div class="provider-copy">
          <strong>${provider.name}${provider.recommendation === 'recommended' ? '<span class="tag">Recommended</span>' : ''}</strong>
          <p>${provider.reason || providerDescriptions[provider.id]}</p>
        </div>
        ${actionable
          ? `<a class="provider-action" href="${url}" rel="noreferrer">${provider.id === 'docker' ? 'Open guide' : 'Deploy'}</a>`
          : `<span class="provider-action" aria-disabled="true">${providerState(provider)}</span>`}`;
      return row;
    }));
  }

  const environmentOwner = demo.mode === 'native'
    ? data.demos.find((candidate) => candidate.id === demo.companionBackend) ?? demo
    : demo;
  environmentList.replaceChildren(...environmentOwner.environment.map((variable) => {
    const item = document.createElement('div');
    item.className = 'environment-variable';
    item.innerHTML = `<code>${variable.name}</code><p>${variable.description}</p>`;
    return item;
  }));

  dialog.showModal();
}

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    runtimeFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle('is-active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    render();
  });
});

providerFilter.addEventListener('change', render);
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

try {
  const response = await fetch('/demos.json');
  if (!response.ok) throw new Error(`Catalogue metadata returned ${response.status}`);
  data = await response.json();
  releaseVersion.textContent = data.suiteTag;
  render();
} catch (error) {
  grid.innerHTML = '<p class="empty-state">The demo catalogue could not be loaded. Tagged source remains available on GitHub.</p>';
  console.error(error);
}
