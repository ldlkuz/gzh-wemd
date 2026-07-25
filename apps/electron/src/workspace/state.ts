import * as path from "path";

let workspaceDir: string | null = null;

export function getWorkspaceDir(): string | null {
  return workspaceDir;
}

export function setWorkspaceDir(dir: string | null): void {
  workspaceDir = dir;
}

export function isPathInsideWorkspace(targetPath: string): boolean {
  if (!workspaceDir) return false;
  const workspaceResolvedRaw = path.resolve(workspaceDir);
  const workspaceRoot = path.parse(workspaceResolvedRaw).root;
  const workspaceResolved =
    workspaceResolvedRaw === workspaceRoot
      ? workspaceResolvedRaw
      : workspaceResolvedRaw.replace(/[\\/]+$/, "");
  const targetResolved = path.resolve(targetPath);

  const normalizedWorkspace =
    process.platform === "win32"
      ? workspaceResolved.toLowerCase()
      : workspaceResolved;
  const normalizedTarget =
    process.platform === "win32"
      ? targetResolved.toLowerCase()
      : targetResolved;

  const workspacePrefix = normalizedWorkspace.endsWith(path.sep)
    ? normalizedWorkspace
    : normalizedWorkspace + path.sep;

  return (
    normalizedTarget === normalizedWorkspace ||
    normalizedTarget.startsWith(workspacePrefix)
  );
}
