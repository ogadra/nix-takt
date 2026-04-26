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
  if (!res.ok) throw new Error(`npm registry returned ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  if (typeof json['version'] !== 'string')
    throw new Error('Unexpected registry response: missing version');
  return json['version'];
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

// Parses a semver string into [major, minor, patch, prerelease] for comparison.
// prerelease is null for stable releases (sorts higher than any pre-release).
const parseSemver = (v: string): [number, number, number, string | null] => {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!m) throw new Error(`Cannot parse version: ${v}`);
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] ?? null];
};

const compareVersions = (a: string, b: string): number => {
  const [aMaj, aMin, aPat, aPre] = parseSemver(a);
  const [bMaj, bMin, bPat, bPre] = parseSemver(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  if (aPat !== bPat) return aPat - bPat;
  // null (stable) > any pre-release string
  if (aPre === null && bPre !== null) return 1;
  if (aPre !== null && bPre === null) return -1;
  if (aPre !== null && bPre !== null) return aPre < bPre ? -1 : aPre > bPre ? 1 : 0;
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
