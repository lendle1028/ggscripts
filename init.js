#!/usr/bin/env node
const fs = require('fs');

// 解析參數
const args = process.argv.slice(2);

function getArg(name) {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
}

const modeName = getArg('mode') || 'default';
const appName  = getArg('name') || 'my-app';

// 各 mode 個別設定
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
  appCmd = getArg('cmd') || 'uv run uvicorn main:app --host 0.0.0.0 --port 8080';
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