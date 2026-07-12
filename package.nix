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
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
    ONNXRUNTIME_NODE_INSTALL = "skip";
  };

  postPatch = ''
    export PLAYWRIGHT_BROWSERS_PATH="$TMPDIR/playwright-browsers"
    mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"
    cp -rL ${pkgs.playwright-driver.browsers}/. "$PLAYWRIGHT_BROWSERS_PATH/"
    chmod -R u+w "$PLAYWRIGHT_BROWSERS_PATH"
    for d in "$PLAYWRIGHT_BROWSERS_PATH"/*/; do
      touch "$d/INSTALLATION_COMPLETE"
    done
  '';

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
