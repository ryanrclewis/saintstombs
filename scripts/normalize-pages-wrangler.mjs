import { readFile, writeFile } from 'node:fs/promises';

const WRANGLER_JSON_PATH = new URL('../dist/client/wrangler.json', import.meta.url);

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

  const triggers = config.triggers;
  if (!triggers || typeof triggers !== 'object' || Array.isArray(triggers)) {
    config.triggers = { crons: [] };
  } else if (!Array.isArray(triggers.crons)) {
    config.triggers = { ...triggers, crons: [] };
  }

  await writeFile(WRANGLER_JSON_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
  console.log('[normalize-pages-wrangler] Updated dist/client/wrangler.json for Cloudflare Pages compatibility.');
}

normalizeWranglerConfig().catch((error) => {
  console.error('[normalize-pages-wrangler] Failed to normalize wrangler.json:', error);
  process.exit(1);
});
