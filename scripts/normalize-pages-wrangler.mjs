import { readFile, writeFile } from 'node:fs/promises';

const WRANGLER_JSON_PATH = new URL('../dist/client/wrangler.json', import.meta.url);
const DEPLOY_CONFIG_PATH = new URL('../.wrangler/deploy/config.json', import.meta.url);
const ROOT_WRANGLER_CONFIG_PATH = '../../wrangler.toml';

const TOP_LEVEL_FIELDS_TO_REMOVE = [
  'definedEnvironments',
  'secrets_store_secrets',
  'unsafe_hello_world',
  'worker_loaders',
  'ratelimits',
  'vpc_services',
  'python_modules',
];

const DEV_FIELDS_TO_REMOVE = ['enable_containers', 'generate_types'];

async function normalizeDeployConfigRedirect() {
  let raw;

  try {
    raw = await readFile(DEPLOY_CONFIG_PATH, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }

  const deployConfig = JSON.parse(raw);
  deployConfig.configPath = ROOT_WRANGLER_CONFIG_PATH;
  if (!Array.isArray(deployConfig.auxiliaryWorkers)) {
    deployConfig.auxiliaryWorkers = [];
  }

  await writeFile(DEPLOY_CONFIG_PATH, JSON.stringify(deployConfig, null, 2) + '\n', 'utf8');
}

async function normalizeWranglerConfig() {
  let raw;

  try {
    raw = await readFile(WRANGLER_JSON_PATH, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      console.warn('[normalize-pages-wrangler] No dist/client/wrangler.json found; skipping.');
      return;
    }

    throw error;
  }

  const config = JSON.parse(raw);

  for (const field of TOP_LEVEL_FIELDS_TO_REMOVE) {
    if (field in config) {
      delete config[field];
    }
  }

  if (config.dev && typeof config.dev === 'object') {
    for (const field of DEV_FIELDS_TO_REMOVE) {
      if (field in config.dev) {
        delete config.dev[field];
      }
    }
  }

  // Cloudflare Pages rejects worker-style assets config in wrangler.json.
  if ('assets' in config) {
    delete config.assets;
  }

  const triggers = config.triggers;
  if (!triggers || typeof triggers !== 'object' || Array.isArray(triggers)) {
    config.triggers = { crons: [] };
  } else if (!Array.isArray(triggers.crons)) {
    config.triggers = { ...triggers, crons: [] };
  }

  await writeFile(WRANGLER_JSON_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
  await normalizeDeployConfigRedirect();
  console.log('[normalize-pages-wrangler] Updated dist/client/wrangler.json for Cloudflare Pages compatibility.');
}

normalizeWranglerConfig().catch((error) => {
  console.error('[normalize-pages-wrangler] Failed to normalize wrangler.json:', error);
  process.exit(1);
});
