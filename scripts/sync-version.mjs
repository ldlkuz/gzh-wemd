import fs from "fs";
import path from "path";

const rootDir = path.resolve(import.meta.dirname, "..");
const rootPackagePath = path.join(rootDir, "package.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

function updateVersion(filePath, version) {
  const json = readJson(filePath);
  if (json.version === version) return false;
  json.version = version;
  writeJson(filePath, json);
  return true;
}

const explicitVersion = process.argv[2]?.trim();
const rootPackage = readJson(rootPackagePath);
const version = explicitVersion || rootPackage.version;

if (!version) {
  console.error("[sync-version] Root package.json is missing version");
  process.exit(1);
}

if (explicitVersion && rootPackage.version !== version) {
  rootPackage.version = version;
  writeJson(rootPackagePath, rootPackage);
}

const targets = [
  path.join(rootDir, "apps", "web", "package.json"),
  path.join(rootDir, "apps", "electron", "package.json"),
  path.join(rootDir, "packages", "core", "package.json"),
];

const changed = [];

for (const target of targets) {
  if (updateVersion(target, version)) {
    changed.push(path.relative(rootDir, target));
  }
}

if (explicitVersion) {
  console.log(`[sync-version] Root version set to ${version}`);
}

if (changed.length === 0) {
  console.log(`[sync-version] All target versions already match ${version}`);
} else {
  console.log(`[sync-version] Synced version ${version} to:`);
  for (const item of changed) {
    console.log(`- ${item}`);
  }
}
