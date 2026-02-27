#!/usr/bin/env node
/**
 * populate.js — Seed the D1 database from the regions/*.md files.
 *
 * Usage (run from repo root):
 *   node workers/search/populate.js
 *
 * The script writes a series of INSERT SQL statements to stdout which you
 * pipe into wrangler:
 *
 *   node workers/search/populate.js | wrangler d1 execute saints-search --remote --file=/dev/stdin
 *
 * Or write to a file first:
 *   node workers/search/populate.js > /tmp/seed.sql
 *   wrangler d1 execute saints-search --remote --file=/tmp/seed.sql
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const REGIONS_DIR = join(import.meta.dirname, '../../regions');

// Map filename stems to human-readable region names
const REGION_LABELS = {
  africa: 'Africa',
  asia: 'Asia',
  austria: 'Austria',
  belgium: 'Belgium',
  britain: 'Britain',
  'eastern-europe': 'Eastern Europe',
  france: 'France',
  germany: 'Germany',
  ireland: 'Ireland',
  italy: 'Italy',
  'latin-america': 'Latin America',
  netherlands: 'Netherlands',
  'north-america': 'North America',
  oceania: 'Oceania',
  portugal: 'Portugal',
  scandinavia: 'Scandinavia',
  spain: 'Spain',
  switzerland: 'Switzerland',
};

function escape(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Parse one markdown file into rows.
 *
 * The format used across all region files is:
 *
 *   Location paragraph (no leading `-`)
 *
 *   - Church name (top-level list item, single indent)
 *
 *     - Saint / entry (nested list item, double indent)
 *
 * Lines that are continuation lines of the previous entry (indented but not
 * starting with `-`) are appended to the current entry.
 */
function parseRegionFile(content, regionLabel) {
  const rows = [];
  const lines = content.split('\n');

  let currentLocation = '';
  let currentChurch = '';
  let currentEntry = '';

  function flushEntry() {
    if (currentEntry.trim()) {
      rows.push({
        region: regionLabel,
        location: currentLocation.trim(),
        church: currentChurch.trim() || null,
        entry: currentEntry.trim(),
      });
    }
    currentEntry = '';
  }

  for (let raw of lines) {
    const line = raw.trimEnd();

    // Skip blank lines
    if (!line.trim()) continue;

    // Detect indentation level
    const indent = line.length - line.trimStart().length;
    const stripped = line.trimStart();

    if (stripped.startsWith('- ')) {
      const text = stripped.slice(2).trim();

      if (indent === 0) {
        // Top-level list item → church
        flushEntry();
        currentChurch = text;
      } else {
        // Nested list item → saint entry
        flushEntry();
        currentEntry = text;
      }
    } else if (indent > 2 && currentEntry) {
      // Continuation line of the current entry
      currentEntry += ' ' + stripped;
    } else {
      // Plain paragraph → location
      flushEntry();
      currentChurch = '';
      currentLocation = line.trim();
    }
  }
  flushEntry();

  return rows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const files = readdirSync(REGIONS_DIR).filter(
  (f) => f.endsWith('.md') && f !== 'about.md' && !f.includes('formatted')
);

const allRows = [];
for (const file of files) {
  const stem = basename(file, '.md');
  const label = REGION_LABELS[stem] || stem;
  const content = readFileSync(join(REGIONS_DIR, file), 'utf8');
  const rows = parseRegionFile(content, label);
  allRows.push(...rows);
}

// Emit SQL
console.log('DELETE FROM saints;');
console.log('DELETE FROM saints_fts;');
console.log('');

for (const row of allRows) {
  console.log(
    `INSERT INTO saints (region, location, church, entry) VALUES (${escape(row.region)}, ${escape(row.location)}, ${escape(row.church)}, ${escape(row.entry)});`
  );
}

process.stderr.write(`Emitted ${allRows.length} rows from ${files.length} files.\n`);
