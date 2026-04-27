[English](./README.md)

# nix-takt

[takt](https://github.com/nrslib/takt)（AIエージェント オーケストレーションツール）を Nix flake として提供する。`buildNpmPackage` を使ってソースからビルドする。

## はじめに

```bash
# 最新バージョンを実行
nix run github:ogadra/nix-takt

# takt が使えるシェルに入る
nix shell github:ogadra/nix-takt
takt --version
```

## 機能

- GitHub Actions による自動更新（毎時チェック）
- マルチプラットフォーム対応: Linux (x86_64, aarch64) と macOS (x86_64, aarch64)
- `buildNpmPackage` によるソースビルド

## 仕組み

1. `update.ts` が npm registry から最新バージョンを取得
2. `nix-prefetch-github` でソースの hash を計算
3. `prefetch-npm-deps` で npm 依存関係の hash を計算
4. GitHub Actions が毎時スクリプトを実行し、変更があれば自動コミット
5. `buildNpmPackage` + Node.js 24 でソースからビルド

## 対応プラットフォーム

- `x86_64-linux`
- `aarch64-linux`
- `x86_64-darwin`
- `aarch64-darwin`

### ビルドのテスト

```bash
nix build
./result/bin/takt --version
```

## Credits

- [takt](https://github.com/nrslib/takt) by [nrslib](https://github.com/nrslib)
- Inspired by [nix-claude-code](https://github.com/ryoppippi/nix-claude-code) by [ryoppippi](https://github.com/ryoppippi)

## License

MIT
