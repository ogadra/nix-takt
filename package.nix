{
  lib,
  pkgs,
  sourcesFile,
}:
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
  inherit (sources) npmDepsHash;

  buildPhase = ''
    npm run build
  '';

  meta = {
    description = "AI agent orchestration tool";
    homepage = "https://github.com/nrslib/takt";
    license = lib.licenses.mit;
    mainProgram = "takt";
  };
}
