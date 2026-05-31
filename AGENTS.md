# ggscripts

CLI tool that scaffolds projects with `mise` and `gg` config files. Published as `@lendle1028/ggscripts`.

## Files

- `init.js` — Entry point (bin: `ggscripts`). Downloads mise binary, symlinks it, then generates `gg.toml` and `mise.toml` in cwd.
- `package.json` — Npm package definition.

## How it works

1. Runs `gg gh/jdx/mise --version` to download mise if not cached.
2. Symlinks the mise binary to `~/.cache/gg/mise/mise_star_/mise`.
3. Parses `--mode`, `--name`, `--cmd` CLI args:
   - `--mode pm2` — generates extra pm2 tasks (`pm2-start`, `deploy`, `undeploy`, `restart`, `stop`, `logs`), default cmd: `uv run uvicorn main:app --host 0.0.0.0 --port 8080`.
   - otherwise — generates basic start task, default cmd: `uv run main.py`.
4. Writes `gg.toml` (aliases: `mise`, `node`, `uv`) and `mise.toml` (env vars, tools, tasks). Skips if files already exist.

## Conventions

## Commands

```bash
# Run the CLI via npx (published as @lendle1028/ggscripts)
npx github:lendle1028/ggscripts

# Or locally:
node init.js
```
