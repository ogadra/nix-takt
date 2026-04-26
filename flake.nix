{
  description = "Nix flake for takt";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
    }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;

      versionFiles = builtins.readDir ./versions;
      versionNames = builtins.map (f: nixpkgs.lib.removeSuffix ".json" f) (
        builtins.filter (f: nixpkgs.lib.hasSuffix ".json" f) (builtins.attrNames versionFiles)
      );
      latestVersion = builtins.head (builtins.sort (a: b: builtins.compareVersions a b > 0) versionNames);
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
          mkTakt = sourcesFile: pkgs.callPackage ./package.nix { inherit sourcesFile; };
          latestSourcesFile = ./versions/${latestVersion + ".json"};
        in
        {
          takt = mkTakt latestSourcesFile;
          default = self.packages.${system}.takt;
        }
      );

      overlays.default = _final: prev: {
        nix-takt = self.packages.${prev.stdenv.hostPlatform.system}.takt;
      };
    };
}
