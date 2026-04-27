[日本語](./README.ja.md)

# nix-takt

A Nix flake that provides [takt](https://github.com/nrslib/takt) — an AI agent orchestration tool — built from source via `buildNpmPackage`.

## Getting Started

```bash
# Run the latest version
nix run github:ogadra/nix-takt

# Enter a shell with takt available
nix shell github:ogadra/nix-takt
takt --version
```

## Features

- Automatic updates via GitHub Actions (hourly checks)
- Multi-platform support: Linux (x86_64, aarch64) and macOS (x86_64, aarch64)
- Built from source using `buildNpmPackage`

## How It Works

1. `update.ts` fetches the latest version from the npm registry
2. `nix-prefetch-github` computes the source hash
3. `prefetch-npm-deps` computes the npm dependencies hash
4. GitHub Actions runs the update script hourly and commits any changes
5. The flake builds takt from source using `buildNpmPackage` with Node.js 24

## Supported Platforms

- `x86_64-linux`
- `aarch64-linux`
- `x86_64-darwin`
- `aarch64-darwin`

### Test the build

```bash
nix build
./result/bin/takt --version
```

## Credits

- [takt](https://github.com/nrslib/takt) by [nrslib](https://github.com/nrslib)
- Inspired by [nix-claude-code](https://github.com/ryoppippi/nix-claude-code) by [ryoppippi](https://github.com/ryoppippi)

## License

MIT
