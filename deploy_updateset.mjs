// deploy_updateset.mjs — Deploys the SDK build output to ServiceNow via remote update set.
// Bypasses sn_appclient_upload_processor.do entirely.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSTANCE = 'https://dev387073.service-now.com';
const AUTH = 'Basic ' + Buffer.from('admin:Oq+k3*sRkCP4').toString('base64');
const SCOPE_SYS_ID = 'f4dba8f693d5cb9050bbf6fa3d03d6fa';
const BUILD_DIR = path.join(__dirname, 'dist', 'app');

const hdrs = {
  'Authorization': AUTH,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function sn(method, url, body) {
  const res = await fetch(INSTANCE + url, {
    method,
    headers: hdrs,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

// 1. Create a fresh remote update set
console.log('Creating remote update set...');
const rusRes = await sn('POST', '/api/now/table/sys_remote_update_set', {
  name: 'Platform Governance & Health Copilot 1.0.0',
  state: 'loaded',
  application: SCOPE_SYS_ID,
});
if (!rusRes.ok) {
  console.error('Failed:', JSON.stringify(rusRes.data));
  process.exit(1);
}
const RUS_ID = rusRes.data.result.sys_id;
console.log('Remote update set created:', RUS_ID);

// 2. Import all XML files from build output
const folders = ['scope', 'update', 'dictionary'];
let count = 0, errors = 0;

for (const folder of folders) {
  const dir = path.join(BUILD_DIR, folder);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xml'));
  console.log(`\nImporting ${files.length} files from /${folder}/...`);

  for (const file of files) {
    const payload = fs.readFileSync(path.join(dir, file), 'utf8');

    // Parse key fields from the XML
    const tableM = payload.match(/table="([^"]+)"/);
    const actionM = payload.match(/action="([^"]+)"/);
    const nameM = payload.match(/<sys_update_name[^>]*>([^<]+)<\/sys_update_name>/);
    const dispM = payload.match(/<name[^>]*>([^<]+)<\/name>/);

    const updateName = nameM ? nameM[1] : path.basename(file, '.xml');
    const targetName = dispM ? dispM[1].replace(/&amp;/g, '&') : updateName;

    const r = await sn('POST', '/api/now/table/sys_update_xml', {
      remote_update_set: RUS_ID,
      name: updateName,
      target_name: targetName,
      table: tableM ? tableM[1] : '',
      action: actionM ? actionM[1] : 'INSERT_OR_UPDATE',
      payload,
      category: 'customer',
    });

    if (!r.ok) {
      console.error(`  FAIL [${file}]: ${JSON.stringify(r.data).substring(0, 180)}`);
      errors++;
    } else {
      count++;
      if (count % 20 === 0) console.log(`  ...${count} records imported`);
    }
  }
}
console.log(`\nImported ${count} records | ${errors} errors`);
if (errors > 0) { console.error('Aborting due to import errors.'); process.exit(1); }

// 3. Commit the remote update set
console.log('\nCommitting remote update set...');
const commitRes = await sn('POST', `/api/now/table/sys_remote_update_set/${RUS_ID}`, {
  state: 'committed',
});
console.log('Commit status:', commitRes.status);
const resultState = commitRes.data?.result?.state;
if (resultState === 'committed' || commitRes.ok) {
  console.log('\nDeployment complete! App is live on the instance.');
  console.log(`App URL: ${INSTANCE}/nav_to.do?uri=sys_app.do?sys_id=${SCOPE_SYS_ID}`);
} else {
  console.log('Response:', JSON.stringify(commitRes.data).substring(0, 400));
}
