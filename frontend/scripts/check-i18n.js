import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');
const LOCALES_DIR = path.resolve(SRC_DIR, 'locales');

// 1. Load locale JSON files
const languages = ['en', 'hi', 'mr'];
const localeData = {};

for (const lang of languages) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing locale file: ${filePath}`);
    process.exit(1);
  }
  localeData[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// Helper to get nested value by dot path
function getNestedValue(obj, keyPath) {
  // First check if flat key exists
  if (Object.prototype.hasOwnProperty.call(obj, keyPath)) {
    return obj[keyPath];
  }
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

// 2. Scan all TS/TSX files for t('key') and <Trans i18nKey="key">
const usedKeys = new Set();
const keyRegex = /\bt\(\s*['"]([^'"\n]+)['"]/g;
const transRegex = /i18nKey=['"]([^'"\n]+)['"]/g;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'locales' && entry.name !== '__tests__') {
        scanDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      let match;
      while ((match = keyRegex.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
      while ((match = transRegex.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
    }
  }
}

scanDir(SRC_DIR);

console.log(`Scanned frontend/src: found ${usedKeys.size} distinct i18n keys in code.`);

// 3. Check for missing keys across all languages
let hasErrors = false;
const missingReport = { en: [], hi: [], mr: [] };

for (const key of Array.from(usedKeys).sort()) {
  for (const lang of languages) {
    const val = getNestedValue(localeData[lang], key);
    if (val === undefined || val === '') {
      missingReport[lang].push(key);
      hasErrors = true;
    }
  }
}

// 4. Check for keys present in en but missing in hi or mr
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getAllKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enAllKeys = getAllKeys(localeData.en);
const hiMissingFromEn = [];
const mrMissingFromEn = [];

for (const k of enAllKeys) {
  if (getNestedValue(localeData.hi, k) === undefined) {
    hiMissingFromEn.push(k);
    hasErrors = true;
  }
  if (getNestedValue(localeData.mr, k) === undefined) {
    mrMissingFromEn.push(k);
    hasErrors = true;
  }
}

// Print results
console.log('\n--- i18n Audit Report ---');
for (const lang of languages) {
  if (missingReport[lang].length > 0) {
    console.error(`[FAIL] ${missingReport[lang].length} keys used in code are missing in ${lang}.json:`);
    missingReport[lang].forEach(k => console.error(`  - ${k}`));
  } else {
    console.log(`[PASS] All keys used in code are defined in ${lang}.json`);
  }
}

if (hiMissingFromEn.length > 0) {
  console.error(`[FAIL] ${hiMissingFromEn.length} keys in en.json are missing from hi.json:`);
  hiMissingFromEn.forEach(k => console.error(`  - ${k}`));
}
if (mrMissingFromEn.length > 0) {
  console.error(`[FAIL] ${mrMissingFromEn.length} keys in en.json are missing from mr.json:`);
  mrMissingFromEn.forEach(k => console.error(`  - ${k}`));
}

if (hasErrors) {
  console.error('\ni18n check failed. Please resolve all missing translation keys.\n');
  process.exit(1);
} else {
  console.log('\n[SUCCESS] i18n check passed: 100% keys translated across en, hi, and mr!\n');
  process.exit(0);
}
