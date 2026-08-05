// ============================================================
// 版本管理 — 组件版本控制和回退
// ============================================================
// 每次 AI 修改必须创建新版本，不能覆盖旧版本。
// 已 approved 的版本不可直接修改。
// 已 locked 的版本不可回退。

// ── 组件版本 ──
export interface ComponentVersion {
  version: number;
  component: string;
  variant: string;
  variantCss: string;
  createdAt: string;
  createdBy: "ai" | "user";
  status: "draft" | "reviewing" | "approved" | "locked";
  changeLog: string;
  parentVersion?: number;
}

// ── 版本仓库 ──
export interface VersionStore {
  projectId: string;
  components: Record<string, ComponentVersion[]>;
}

// ── 版本管理规则 ──
export const VERSION_RULES = {
  /** 已 approved 的版本不可直接修改 */
  CANNOT_MODIFY_APPROVED: true,
  /** 已 locked 的版本不可回退 */
  CANNOT_ROLLBACK_LOCKED: true,
  /** 每次修改必须创建新版本 */
  ALWAYS_CREATE_NEW_VERSION: true,
} as const;

// ── 版本管理接口 ──
export interface VersionManager {
  /** 创建新版本（不可覆盖旧版本） */
  createVersion(
    projectId: string,
    component: string,
    data: {
      variant: string;
      variantCss: string;
      changeLog: string;
      parentVersion?: number;
    }
  ): ComponentVersion;

  /** 获取组件所有版本 */
  getVersions(projectId: string, component: string): ComponentVersion[];

  /** 获取组件特定版本 */
  getVersion(
    projectId: string,
    component: string,
    version: number
  ): ComponentVersion | null;

  /** 回退到指定版本（会创建新版本指向旧内容） */
  rollback(
    projectId: string,
    component: string,
    targetVersion: number,
    reason: string
  ): ComponentVersion;

  /** 确认版本 */
  approve(projectId: string, component: string, version: number): void;

  /** 锁定版本 */
  lock(projectId: string, component: string, version: number): void;

  /** 获取组件最新已确认版本 */
  getLatestApproved(
    projectId: string,
    component: string
  ): ComponentVersion | null;
}