# nix-takt: Nix flake overlay for takt

## 目的

https://github.com/nrslib/takt を Nix flake overlay として提供する。
dotfiles（NixOS Flakes + home-manager）から `npm install -g` なしで takt を利用できるようにする。

参考実装: https://github.com/ryoppippi/nix-claude-code

---

## アーキテクチャ

### ryoppippi/nix-claude-code との違い

| | nix-claude-code | nix-takt |
|---|---|---|
| パッケージ形式 | プリビルドバイナリ（fetchurl） | npm ソースビルド（buildNpmPackage） |
| 自動更新に必要なもの | manifest.json の URL + checksum | src hash + npmDepsHash |
| Node.js | 不要（バイナリ） | pkgs.nodejs_24 を使用 |

### 自動更新の仕組み

GitHub Actions（毎時）:
1. npm registry から最新バージョンを取得
2. `nix-prefetch-github` で src hash を計算
3. `prefetch-npm-deps` で npmDepsHash を計算
4. `versions/<version>.json` を生成してコミット・プッシュ

---

## リポジトリ構成

```
nix-takt/
├── flake.nix              # overlay を提供する flake
├── package.nix            # buildNpmPackage によるパッケージ定義
├── update.ts              # 自動更新スクリプト
├── versions/
│   └── 0.38.0.json        # バージョンごとのハッシュ情報
└── .github/
    └── workflows/
        └── update.yaml    # 毎時自動更新 Actions
```

---

## 各ファイルの実装方針

### versions/0.38.0.json

```json
{
  "version": "0.38.0",
  "rev": "v0.38.0",
  "hash": "sha256-kFj75/sb0XUBQT1qUScYZaWF3HWY6QYiq2EA6EdT1Ko=",
  "npmDepsHash": "sha256-Hd/Cm/qv2aMn7CzfXiaYbxN3vsRJuvnKkQXYbX98+C0="
}
```

### package.nix

```nix
{ lib, pkgs, sourcesFile }:
let
  sources = lib.importJSON sourcesFile;
in
pkgs.buildNpmPackage {
  pname = "takt";
  inherit (sources) version;

  src = pkgs.fetchFromGitHub {
    owner = "nrslib";
    repo = "takt";
    inherit (sources) rev hash;
  };

  nodejs = pkgs.nodejs_24;
  npmDepsHash = sources.npmDepsHash;

  buildPhase = ''
    npm run build
  '';

  meta = with lib; {
    description = "AI agent orchestration tool";
    homepage = "https://github.com/nrslib/takt";
    license = licenses.mit;
    mainProgram = "takt";
  };
}
```

### flake.nix

```nix
{
  description = "Nix flake for takt";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
      latestVersion = "0.38.0";  # update.ts が更新する
    in {
      packages = forAllSystems (pkgs: {
        default = import ./package.nix {
          inherit (nixpkgs) lib;
          inherit pkgs;
          sourcesFile = ./versions/${latestVersion}.json;
        };
      });
    };
}
```

### update.ts

```typescript
// npm registry から最新バージョンを取得
// nix-prefetch-github で src hash を計算
// prefetch-npm-deps で npmDepsHash を計算
// versions/<version>.json を生成
// flake.nix の latestVersion を更新
```

### .github/workflows/update.yaml

```yaml
on:
  schedule:
    - cron: '0 * * * *'  # 毎時
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: cachix/install-nix-action@v27
      - uses: cachix/cachix-action@v17
        with:
          name: <cachix-cache-name>   # 要設定
          authToken: "${{ secrets.CACHIX_AUTH_TOKEN }}"
      - run: nix run nixpkgs#bun -- update.ts
      - run: git config user.email "github-actions[bot]@..."
      - run: git config user.name "github-actions[bot]"
      - run: git add -A
      - run: git diff --staged --quiet || git commit -m "chore: update takt to $VERSION"
      - run: git push
```

---

## dotfiles への組み込み方

### flake.nix に input 追加

```nix
inputs = {
  ...
  nix-takt = {
    url = "github:ogadra/nix-takt";
  };
};
```

### home-manager/common/cli/takt/default.nix

```nix
{ inputs, pkgs, ... }:
{
  home.packages = [ inputs.nix-takt.packages.${pkgs.system}.default ];
}
```

### home-manager/profiles/bisharp/default.nix

```nix
commonConfigs = [
  ...
  ../../common/cli/claude-code
  ../../common/cli/takt        # 追加
  ...
];
```

---

## Cachix セットアップ

GitHub Secrets に以下を登録:
- `CACHIX_AUTH_TOKEN`: https://app.cachix.org/personal-auth-tokens で生成

---

## 初期ハッシュ値（v0.38.0）

- src hash: `sha256-kFj75/sb0XUBQT1qUScYZaWF3HWY6QYiq2EA6EdT1Ko=`
- npmDepsHash: `sha256-Hd/Cm/qv2aMn7CzfXiaYbxN3vsRJuvnKkQXYbX98+C0=`
- rev: `v0.38.0`
