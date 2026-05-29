#!/usr/bin/env node

const fs = require('fs');
const { execFileSync, execSync } = require('child_process');
const { existsSync, readdirSync, symlinkSync, chmodSync } = require('fs');
const { homedir, platform } = require('os');
const path = require('path');

// ── 1. 確保 mise binary 可用 ─────────────────────────────────

const isWin = platform() === 'win32';
const cacheDir = path.join(homedir(), '.cache', 'gg', 'mise', 'mise_star_');
const miseBin  = path.join(cacheDir, isWin ? 'mise.exe' : 'mise');
const ggCmd    = path.join(process.cwd(), isWin ? 'gg.cmd' : './gg.cmd');

function findMiseBinary() {
  if (!existsSync(cacheDir)) return null;
  return readdirSync(cacheDir).find(f => f.startsWith('mise-v'));
}

if (!findMiseBinary()) {
  console.error('[setup] Downloading mise via gg...');
  try {
    execSync(`"${ggCmd}" gh/jdx/mise --version`, { stdio: 'ignore' });
  } catch (_) {
    // 下載過程 gg 可能 fallback 失敗，只要檔案存在就好
  }
}

if (!existsSync(miseBin)) {
  const bin = findMiseBinary();
  if (!bin) {
    console.error('[setup] Failed to download mise binary.');
    process.exit(1);
  }
  const fullBinPath = path.join(cacheDir, bin);
  symlinkSync(fullBinPath, miseBin);
  if (!isWin) chmodSync(miseBin, 0o755);
  console.error(`[setup] Symlink created: ${miseBin} -> ${fullBinPath}`);
}

// ── 2. 安裝程序 ──────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
}

const modeName = getArg('mode') || 'default';
const appName  = getArg('name') || 'my-app';

let appCmd;
let miseExtra;
if (modeName === 'pm2') {
  appCmd = getArg('cmd') || 'uv run uvicorn main:app --host 0.0.0.0 --port 8080';
  miseExtra = `
[tasks.pm2-start]
run = "pm2 start '{{env.APP_CMD}}' --name {{env.APP_NAME}}"
[tasks.pm2-save]
depends = ["pm2-start"]
run = "pm2 save"
[tasks.deploy]
depends = ["pm2-save"]
[tasks.undeploy]
run = "pm2 delete {{env.APP_NAME}}"
[tasks.restart]
run = "pm2 restart {{env.APP_NAME}}"
[tasks.stop]
run = "pm2 stop {{env.APP_NAME}}"
[tasks.logs]
run = "pm2 logs {{env.APP_NAME}}"
`;
} else {
  appCmd = getArg('cmd') || 'uv run main.py';
  miseExtra = '';
}

console.log(`mode: ${modeName}`);
console.log(`appName: ${appName}`);
console.log(`appCmd: ${appCmd}`);

const ggToml = `[aliases]
mise = "gh/jdx/mise"
node = "gh/jdx/mise exec node@latest -- node"
uv   = "gh/jdx/mise exec uv@latest -- uv"
`;

const miseToml = `[env]
APP_NAME = "${appName}"
APP_CMD  = "${appCmd}"
[tools]
uv = "latest"
[tasks.start]
run = "{{env.APP_CMD}}"
${miseExtra}`;

for (const [file, content] of [['gg.toml', ggToml], ['mise.toml', miseToml]]) {
  if (fs.existsSync(file)) {
    console.log(`${file} already exists, skipping`);
  } else {
    fs.writeFileSync(file, content);
    console.log(`${file} created`);
  }
}

console.log('[setup] Done. You can now run: ./gg.cmd mise run ${command}');
