{
  description = "Development environment for nix-takt";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    hk.url = "github:jdx/hk/3cb88fb883b29281fff68c4edfc57a5fb97758fd"; # v1.44.2
  };

  outputs =
    { nixpkgs, hk, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShellNoCC {
            packages = with pkgs; [
              nodejs_24
              typescript
              gitleaks
              hk.packages.${system}.default
              pkl
              nixfmt-rfc-style
              deadnix
              statix
              oxfmt
            ];
            shellHook = ''
              hk install
            '';
          };
        }
      );
    };
}
