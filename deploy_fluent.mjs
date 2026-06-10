// deploy_fluent.mjs — Upload all dist/app XML files via api/fluent/load/{scopeId}
// Batches files in groups to avoid timeout. Chains targetUpdateSetId across batches.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSTANCE = 'https://dev387073.service-now.com';
const USER = 'admin';
const PASS = 'Oq+k3*sRkCP4';
const SCOPE_ID = 'f4dba8f693d5cb9050bbf6fa3d03d6fa';
const BUILD_DIR = path.join(__dirname, 'dist', 'app');
const BATCH_SIZE = 5;

const AUTH = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64');

function collectXmlFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectXmlFiles(full, results);
    } else if (entry.isFile() && entry.name.endsWith('.xml')) {
      results.push(full);
    }
  }
  return results;
}

async function uploadBatch(files, targetUpdateSetId) {
  const form = new FormData();
  for (const filePath of files) {
    const content = fs.readFileSync(filePath);
    const blob = new Blob([content], { type: 'application/xml' });
    form.append('files', blob, path.basename(filePath));
  }

  const params = new URLSearchParams();
  if (targetUpdateSetId) {
    params.set('targetUpdateSetId', targetUpdateSetId);
  }

  const url = `${INSTANCE}/api/fluent/load/${SCOPE_ID}?${params}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': AUTH },
    body: form,
    signal: AbortSignal.timeout(300000),
  });

  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${typeof data === 'object' ? JSON.stringify(data) : data}`);
  }
  return data?.result?.targetUpdateSetId;
}

// Collect and sort: scope/ first (sys_app record), then rest
const allFiles = collectXmlFiles(BUILD_DIR);
const scopeFiles = allFiles.filter(f => f.includes(path.sep + 'scope' + path.sep));
const otherFiles = allFiles.filter(f => !f.includes(path.sep + 'scope' + path.sep));
const orderedFiles = [...scopeFiles, ...otherFiles];

console.log(`Found ${orderedFiles.length} XML files (${scopeFiles.length} scope, ${otherFiles.length} other)`);

// Split into batches
const batches = [];
for (let i = 0; i < orderedFiles.length; i += BATCH_SIZE) {
  batches.push(orderedFiles.slice(i, i + BATCH_SIZE));
}
console.log(`Uploading in ${batches.length} batches of up to ${BATCH_SIZE} files each...\n`);

let targetUpdateSetId = undefined;
for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  const names = batch.map(f => path.basename(f));
  console.log(`Batch ${i + 1}/${batches.length} (${batch.length} files)...`);
  try {
    targetUpdateSetId = await uploadBatch(batch, targetUpdateSetId);
    console.log(`  OK — targetUpdateSetId: ${targetUpdateSetId}`);
  } catch (e) {
    console.error(`  FAILED: ${e.message}`);
    process.exit(1);
  }
}

console.log(`\nAll ${orderedFiles.length} files uploaded successfully.`);
console.log(`Update Set ID: ${targetUpdateSetId}`);
console.log(`\nApp URL: ${INSTANCE}/nav_to.do?uri=sys_app.do?sys_id=${SCOPE_ID}`);
