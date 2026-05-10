#!/usr/bin/env node
const fs = require('fs');

// 解析參數
const args = process.argv.slice(2);
const modes = ['pm2']; // 之後新增模式加這裡就好
const options = {
  mode: args.find(a => modes.includes(a)) || null,
  appName: args.find(a => !modes.includes(a)) || 'my-app',
  appCmd: args.filter(a => !modes.includes(a))[1] || 'uv run uvicorn main:app --host 0.0.0.0 --port 8080',
};

console.log(`mode: ${options.mode || 'default'}`);
console.log(`appName: ${options.appName}`);
console.log(`appCmd: ${options.appCmd}`);

const ggToml = `[aliases]
mise = "gh/jdx/mise"
node = "gh/jdx/mise exec node@latest -- node"
uv   = "gh/jdx/mise exec uv@latest -- uv"
`;

const miseTomlBase = `[env]
APP_NAME = "${options.appName}"
APP_CMD  = "${options.appCmd}"

[tools]
uv = "latest"

[tasks.start]
run = "{{env.APP_CMD}}"
`;

const miseTomlPm2 = `
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

const miseToml = options.mode === 'pm2'
  ? miseTomlBase + miseTomlPm2
  : miseTomlBase;

for (const [file, content] of [['gg.toml', ggToml], ['mise.toml', miseToml]]) {
  if (fs.existsSync(file)) {
    console.log(`${file} already exists, skipping`);
  } else {
    fs.writeFileSync(file, content);
    console.log(`${file} created`);
  }
}