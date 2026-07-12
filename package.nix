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

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
    ONNXRUNTIME_NODE_INSTALL = "skip";
  };

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
