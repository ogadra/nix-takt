import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface VersionFile {
  version: string;
  rev: string;
  hash: string;
  npmDepsHash: string;
}

const run = (cmd: string, args: string[]): string => {
  return execFileSync(cmd, args, { encoding: 'utf8' }).trim();
};

const fetchLatestVersion = async (): Promise<string> => {
  const res = await fetch('https://registry.npmjs.org/takt/latest');
  const json = (await res.json()) as { version: string };
  return json.version;
};

const getExistingVersions = (): Set<string> => {
  const versionsDir = join(__dirname, 'versions');
  return new Set(
    readdirSync(versionsDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, '')),
  );
};

const fetchSrcHash = (version: string): { rev: string; hash: string } => {
  const rev = `v${version}`;
  const result = JSON.parse(
    run('nix-prefetch-github', ['--json', 'nrslib', 'takt', '--rev', rev]),
  ) as { hash: string };
  const hash = run('nix', ['hash', 'to-sri', '--type', 'sha256', result.hash]);
  return { rev, hash };
};

const fetchNpmDepsHash = (rev: string, srcHash: string): string => {
  const srcPath = run('nix-build', [
    '--no-out-link',
    '-E',
    `let pkgs = import <nixpkgs> {}; in pkgs.fetchFromGitHub { owner = "nrslib"; repo = "takt"; rev = "${rev}"; hash = "${srcHash}"; }`,
  ]);
  return run('prefetch-npm-deps', [`${srcPath}/package-lock.json`]);
};

const writeVersionFile = (data: VersionFile): void => {
  const path = join(__dirname, 'versions', `${data.version}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
};

const compareVersions = (a: string, b: string): number => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
};

const main = async (): Promise<void> => {
  const latestVersion = await fetchLatestVersion();
  const existing = getExistingVersions();

  const currentVersion = [...existing].sort(compareVersions).at(-1) ?? null;

  console.log(`Current version: ${currentVersion}`);
  console.log(`Latest version:  ${latestVersion}`);

  if (existing.has(latestVersion)) {
    console.log('Already up to date!');
  } else {
    console.log(`Updating to ${latestVersion}...`);
    const { rev, hash } = fetchSrcHash(latestVersion);
    const npmDepsHash = fetchNpmDepsHash(rev, hash);
    writeVersionFile({ version: latestVersion, rev, hash, npmDepsHash });
    console.log(`Written versions/${latestVersion}.json`);
  }

  console.log(latestVersion);
};

await main();
