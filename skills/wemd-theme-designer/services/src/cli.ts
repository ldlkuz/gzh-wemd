// ============================================================
// WeMD 设计管道 · Service 层 CLI
// ============================================================
// 独立可运行的程序，用于调试 Service 层逻辑。
// 使用方法：node --experimental-strip-types src/cli.ts

import { initWorkspace, readJSON, writeJSON, getProjectFilePath, listMaterials } from "./file-service.ts";
import {
  createProject,
  getProject,
  listAllProjects,
  deleteProject,
  updateProjectStatus,
  saveBlueprint,
  submitForReview,
  approveReview,
  rejectReview,
  getProjectStatus,
} from "./project-service.ts";
import {
  createTask,
  getNextTask,
  startProcessing,
  completeTask,
  failTask,
  getQueueStats,
  listPendingTasks,
} from "./task-queue.ts";
import { join } from "node:path";
import { ulid, formatTime, colors } from "./utils.ts";
import {
  createComponentVersion,
  getComponentVersions,
  listAllComponentVersions,
  updateComponentVersionStatus,
  rollbackComponent,
} from "./project-service.ts";

// ── 命令映射 ──
const COMMANDS: Record<string, { desc: string; run: (args: string[]) => Promise<void> }> = {
  init: {
    desc: "初始化工作区目录结构",
    run: async () => {
      await initWorkspace();
      console.log(colors.green("\n✓ 工作区初始化完成!"));
      console.log("  目录结构:");
      console.log("    workspace/");
      console.log("    ├── inbox/");
      console.log("    ├── processing/");
      console.log("    ├── done/");
      console.log("    ├── failed/");
      console.log("    └── logs/");
      console.log("    projects/");
    },
  },

  create: {
    desc: "创建新项目  create <name> <brand|creator>",
    run: async (args) => {
      const [name, type] = args;
      if (!name || !type) {
        console.log(colors.red("用法: create <项目名称> <brand|creator>"));
        return;
      }
      const profile = {
        name,
        profileType: type,
        createdAt: new Date().toISOString(),
      };
      await createProject(name, type as "brand" | "creator", profile);
      console.log(colors.green(`\n  ✓ 项目 "${name}" 创建成功`));
    },
  },

  list: {
    desc: "列出所有项目",
    run: async () => {
      const ids = await listAllProjects();
      if (ids.length === 0) {
        console.log(colors.yellow("  (暂无项目)"));
        return;
      }
      console.log(colors.bold(`\n项目列表 (${ids.length}):`));
      for (const id of ids) {
        const status = await getProjectStatus(id);
        if (status.project) {
          const p = status.project;
          const statusColor =
            p.status === "APPROVED" || p.status === "EXPORTED"
              ? colors.green
              : p.status === "GENERATING" || p.status === "PREVIEW"
              ? colors.yellow
              : colors.cyan;
          console.log(
            `  ${colors.bold(id)}  |  ${statusColor(p.status)}  |  ${p.profileType}  |  ${formatTime(p.createdAt)}`
          );
        }
      }
    },
  },

  status: {
    desc: "查看项目状态  status <id>",
    run: async (args) => {
      const [id] = args;
      if (!id) {
        console.log(colors.red("用法: status <项目ID>"));
        return;
      }
      const status = await getProjectStatus(id);
      if (!status.exists) {
        console.log(colors.yellow(`  项目 "${id}" 不存在`));
        return;
      }
      const p = status.project!;
      console.log(colors.bold(`\n项目: ${p.name} (${p.id})`));
      console.log(`  状态:     ${p.status}`);
      console.log(`  类型:     ${p.profileType}`);
      console.log(`  创建时间: ${formatTime(p.createdAt)}`);
      console.log(`  更新时间: ${formatTime(p.updatedAt)}`);
      console.log(`  Blueprint: ${p.designBlueprint ? "✓ 已生成" : "— 未生成"}`);
      console.log(`  Theme:     ${p.themePackage ? "✓ 已编译" : "— 未编译"}`);
      console.log(`  审核记录:  ${p.reviewRecords.length} 条`);
      console.log(`  决策日志:  ${p.decisionLog.length} 条`);

      // 显示 Design Memory
      const dm = p.designMemory;
      const styleCount = Object.keys(dm?.componentStyles || {}).length;
      const rejectedCount = dm?.rejectedApproaches?.length || 0;
      if (styleCount > 0 || rejectedCount > 0) {
        console.log(`  Design Memory: ${styleCount} 个已确认风格, ${rejectedCount} 个被拒绝方案`);
      }

      // 显示素材
      const materials = await listMaterials(id);
      if (materials.length > 0) {
        console.log(`  素材文件:  ${materials.length} 个`);
        for (const m of materials) {
          console.log(`    · ${m.element}-${m.usage}.svg`);
        }
      }

      // 显示组件版本
      const allVersions = await listAllComponentVersions(id);
      if (allVersions.length > 0) {
        console.log(`  组件版本: ${allVersions.length} 个组件有版本记录`);
        for (const { component, versions } of allVersions) {
          const latest = versions[0];
          const statusIcon = latest.status === "locked" ? "🔒" : latest.status === "approved" ? "✓" : "·";
          console.log(`    ${statusIcon} ${component}: v${latest.version} (${latest.status}), 共 ${versions.length} 个版本`);
        }
      }
    },
  },

  delete: {
    desc: "删除项目  delete <id>",
    run: async (args) => {
      const [id] = args;
      if (!id) {
        console.log(colors.red("用法: delete <项目ID>"));
        return;
      }
      await deleteProject(id);
    },
  },

  "blueprint": {
    desc: "保存 Blueprint  blueprint <id>",
    run: async (args) => {
      const [id] = args;
      if (!id) {
        console.log(colors.red("用法: blueprint <项目ID>"));
        return;
      }
      const sample = {
        readingExperience: {
          rhythm: "medium",
          density: "medium",
          emotion: "专业可信",
          visualWeight: "平衡",
          narrative: "数据驱动叙事",
          whitespace: "充足",
        },
        expression: {
          type: "brand",
          logoUsage: "header-only",
          sloganPlacement: "hero",
          patternStyle: "geometric",
          decorationLevel: "moderate",
          colorStrategy: "complementary",
        },
        generatedAt: new Date().toISOString(),
      };
      await saveBlueprint(id, sample);
      console.log(colors.green(`  ✓ Blueprint 已保存`));
    },
  },

  review: {
    desc: "审核操作  review <id> <blueprint|theme> <approve|reject> [score]",
    run: async (args) => {
      const [id, stage, action, scoreStr] = args;
      if (!id || !stage || !action) {
        console.log(colors.red("用法: review <项目ID> <blueprint|theme> <approve|reject> [评分]"));
        return;
      }

      if (action === "submit") {
        await submitForReview(id, stage as "blueprint" | "theme");
        return;
      }

      if (action === "approve") {
        const score = scoreStr ? parseInt(scoreStr) : undefined;
        await approveReview(id, stage as "blueprint" | "theme", score);
        return;
      }

      if (action === "reject") {
        const feedback = scoreStr || "需要调整设计方向";
        await rejectReview(id, stage as "blueprint" | "theme", feedback);
        return;
      }

      console.log(colors.red(`  未知操作: ${action} (可用: submit|approve|reject)`));
    },
  },

  task: {
    desc: "任务队列操作  task <create|list|next|process|done|fail> [...]",
    run: async (args) => {
      const [action, ...rest] = args;

      if (action === "create") {
        const [projectId, type] = rest;
        if (!projectId || !type) {
          console.log(colors.red("用法: task create <项目ID> <generate-theme|regenerate|compile>"));
          return;
        }
        await createTask(projectId, type as any);
        return;
      }

      if (action === "list") {
        const tasks = await listPendingTasks();
        if (tasks.length === 0) {
          console.log(colors.yellow("  (队列为空)"));
          return;
        }
        console.log(colors.bold(`\n待处理任务 (${tasks.length}):`));
        for (const t of tasks) {
          console.log(`  [${t.type}] ${t.taskId.slice(0, 12)}... 项目: ${t.projectId}`);
        }
        return;
      }

      if (action === "next") {
        const next = await getNextTask();
        if (!next) {
          console.log(colors.yellow("  (队列为空)"));
          return;
        }
        console.log(colors.bold("\n下一个任务:"));
        console.log(`  ID:       ${next.task.taskId}`);
        console.log(`  类型:     ${next.task.type}`);
        console.log(`  项目:     ${next.task.projectId}`);
        console.log(`  创建时间: ${formatTime(next.task.createdAt)}`);
        return;
      }

      if (action === "process") {
        const next = await getNextTask();
        if (!next) {
          console.log(colors.yellow("  (队列为空)"));
          return;
        }
        await startProcessing(next.task.taskId);
        console.log(colors.cyan(`  → 开始处理: ${next.task.taskId.slice(0, 12)}...`));
        return;
      }

      if (action === "done") {
        const [taskId] = rest;
        if (!taskId) {
          console.log(colors.red("用法: task done <taskId>"));
          return;
        }
        await completeTask(taskId);
        console.log(colors.green(`  ✓ 任务完成: ${taskId.slice(0, 12)}...`));
        return;
      }

      if (action === "fail") {
        const [taskId, ...errorParts] = rest;
        if (!taskId) {
          console.log(colors.red("用法: task fail <taskId> <错误信息>"));
          return;
        }
        await failTask(taskId, errorParts.join(" ") || "执行失败");
        return;
      }

      if (action === "stats") {
        const stats = await getQueueStats();
        console.log(colors.bold("\n队列统计:"));
        console.log(`  inbox:      ${stats.inbox}`);
        console.log(`  processing: ${stats.processing}`);
        console.log(`  done:       ${stats.done}`);
        console.log(`  failed:     ${stats.failed}`);
        return;
      }

      console.log(colors.red(`  未知操作: ${action}`));
    },
  },

  version: {
    desc: "组件版本管理  version <id> <list|create|status|rollback> [...]",
    run: async (args) => {
      const [projectId, action, ...rest] = args;
      if (!projectId || !action) {
        console.log(colors.red("用法: version <项目ID> <list|create|status|rollback> [...]"));
        console.log(colors.dim("  list:                             列出所有组件版本"));
        console.log(colors.dim("  create <组件> <变体> <日志>:        创建新版本"));
        console.log(colors.dim("  status <组件> <v> <状态>:          更新版本状态 (draft|reviewing|approved|locked)"));
        console.log(colors.dim("  rollback <组件> <v> <原因>:        回退到指定版本"));
        return;
      }

      if (action === "list") {
        const all = await listAllComponentVersions(projectId);
        if (all.length === 0) {
          console.log(colors.yellow("  (暂无版本记录)"));
          return;
        }
        for (const { component, versions } of all) {
          const latest = versions[0];
          const statusColor =
            latest.status === "locked" ? colors.red
            : latest.status === "approved" ? colors.green
            : latest.status === "reviewing" ? colors.yellow
            : colors.dim;
          console.log(`  ${colors.bold(component)} | ${statusColor(latest.status)} | ${versions.length} 个版本 | 最新: v${latest.version}`);
          for (const v of versions) {
            const dot = v.status === "locked" ? "🔒" : v.status === "approved" ? "✓" : v.status === "reviewing" ? "△" : "·";
            console.log(`    ${dot} v${v.version} ${v.changeLog} (${formatTime(v.createdAt)})`);
          }
        }
        return;
      }

      if (action === "create") {
        const [component, variant, ...logParts] = rest;
        if (!component || !variant) {
          console.log(colors.red("用法: version <项目ID> create <组件> <变体> <修改日志>"));
          return;
        }
        const changeLog = logParts.join(" ") || "新建版本";
        const result = await createComponentVersion(projectId, component, {
          variant,
          variantCss: "",
          changeLog,
        });
        if (result) console.log(colors.green(`  ✓ v${result.version} 已创建`));
        return;
      }

      if (action === "status") {
        const [component, vStr, status] = rest;
        if (!component || !vStr || !status) {
          console.log(colors.red("用法: version <项目ID> status <组件> <版本号> <draft|reviewing|approved|locked>"));
          return;
        }
        const version = parseInt(vStr);
        if (isNaN(version)) {
          console.log(colors.red("版本号必须是数字"));
          return;
        }
        const validStatuses = ["draft", "reviewing", "approved", "locked"] as const;
        if (!validStatuses.includes(status as any)) {
          console.log(colors.red("状态必须是: draft|reviewing|approved|locked"));
          return;
        }
        await updateComponentVersionStatus(projectId, component, version, status as any);
        return;
      }

      if (action === "rollback") {
        const [component, vStr, ...reasonParts] = rest;
        if (!component || !vStr) {
          console.log(colors.red("用法: version <项目ID> rollback <组件> <版本号> <原因>"));
          return;
        }
        const version = parseInt(vStr);
        if (isNaN(version)) {
          console.log(colors.red("版本号必须是数字"));
          return;
        }
        const reason = reasonParts.join(" ") || "用户回退";
        const result = await rollbackComponent(projectId, component, version, reason);
        if (result) console.log(colors.green(`  ✓ 已回退到 v${version}, 新版本 v${result.version}`));
        return;
      }

      console.log(colors.red(`  未知操作: ${action}`));
    },
  },

  demo: {
    desc: "运行完整演示流程",
    run: async () => {
      console.log(colors.bold("\n╔══════════════════════════════════════╗"));
      console.log(colors.bold("║   WeMD Service 层 · 完整演示流程      ║"));
      console.log(colors.bold("╚══════════════════════════════════════╝\n"));

      // 1. 初始化
      console.log(colors.cyan("步骤 1/8: 初始化工作区"));
      await initWorkspace();
      console.log();

      // 2. 创建项目
      console.log(colors.cyan("步骤 2/8: 创建品牌项目"));
      await createProject("云帆科技", "brand", {
        name: "云帆科技",
        profileType: "brand",
        brandName: "云帆科技",
        description: "一家专注于企业级 AI 解决方案的科技公司",
        keywords: ["科技", "创新", "专业", "AI"],
        primaryColor: "#2563EB",
      });
      console.log();

      // 3. 创建创作者项目
      console.log(colors.cyan("步骤 3/8: 创建创作者项目"));
      await createProject("小林的AI笔记", "creator", {
        name: "小林的AI笔记",
        profileType: "creator",
        contentDirection: "AI 技术科普",
        keywords: ["AI", "技术", "科普", "前沿"],
      });
      console.log();

      // 4. 查看项目列表
      console.log(colors.cyan("步骤 4/8: 查看项目列表"));
      const ids = await listAllProjects();
      for (const id of ids) {
        const status = await getProjectStatus(id);
        console.log(`  · ${id} [${status.project?.status}]`);
      }
      console.log();

      // 5. 保存 Blueprint
      console.log(colors.cyan("步骤 5/8: 生成 Design Blueprint"));
      await saveBlueprint("云帆科技", {
        readingExperience: {
          rhythm: "medium",
          density: "medium",
          emotion: "专业可信",
          visualWeight: "平衡",
          narrative: "数据驱动叙事",
          whitespace: "充足",
        },
        expression: {
          type: "brand",
          logoUsage: "header-only",
          sloganPlacement: "hero",
          patternStyle: "geometric",
          decorationLevel: "moderate",
          colorStrategy: "complementary",
        },
        generatedAt: new Date().toISOString(),
      });
      console.log();

      // 6. 审核 Blueprint
      console.log(colors.cyan("步骤 6/8: 审核流水线"));
      await submitForReview("云帆科技", "blueprint");
      await approveReview("云帆科技", "blueprint", 88);
      console.log();

      // 7. 创建任务
      console.log(colors.cyan("步骤 7/8: 任务队列"));
      await createTask("云帆科技", "compile", {});
      await createTask("小林的AI笔记", "generate-theme", {});
      console.log();

      // 8. 处理任务
      console.log(colors.cyan("步骤 8/8: 处理任务队列"));
      const next = await getNextTask();
      if (next) {
        console.log(`  取到任务: [${next.task.type}] ${next.task.taskId.slice(0, 12)}...`);
        await startProcessing(next.task.taskId);
        await completeTask(next.task.taskId);
        console.log(colors.green("  任务完成 ✓"));
      }

      // 查看队列统计
      const stats = await getQueueStats();
      console.log(
        colors.dim(
          `\n  队列状态: inbox=${stats.inbox} processing=${stats.processing} done=${stats.done} failed=${stats.failed}`
        )
      );

      console.log(colors.green("\n╔══════════════════════════════════════╗"));
      console.log(colors.green("║   演示完成!                           ║"));
      console.log(colors.green("║   试试: node src/cli.ts list           ║"));
      console.log(colors.green("╚══════════════════════════════════════╝\n"));
    },
  },

  server: {
    desc: "启动 HTTP 工作台 (端口 3456)",
    run: async () => {
      const { startServer } = await import("./server.ts");
      startServer();
      console.log(colors.green("\n  ✓ 工作台已启动"));
      console.log(colors.dim("    按 Ctrl+C 停止服务"));

      // 自动打开浏览器
      const url = "http://127.0.0.1:3456";
      try {
        const { exec } = await import("node:child_process");
        if (process.platform === "win32") {
          exec(`start ${url}`);
        } else if (process.platform === "darwin") {
          exec(`open ${url}`);
        } else {
          exec(`xdg-open ${url}`);
        }
        console.log(colors.cyan(`  ✓ 浏览器已打开: ${url}`));
      } catch {
        console.log(colors.dim(`  请手动打开浏览器访问: ${url}`));
      }

      // 保持进程存活
      await new Promise(() => {});
    },
  },

  help: {
    desc: "显示帮助信息",
    run: async () => {
      console.log(colors.bold("\nWeMD Service 层 · 命令行工具\n"));
      console.log(colors.dim("用法:") + ` node --experimental-strip-types src/cli.ts <命令> [参数]\n`);
      console.log(colors.bold("命令:\n"));
      for (const [name, cmd] of Object.entries(COMMANDS)) {
        console.log(`  ${colors.cyan(name.padEnd(12))} ${cmd.desc}`);
      }
      console.log();
    },
  },
};

// ── 主入口 ──
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "help";

  if (command === "test") {
    // 运行测试模式
    await COMMANDS.demo.run([]);
    return;
  }

  const cmd = COMMANDS[command];
  if (!cmd) {
    console.log(colors.red(`未知命令: ${command}\n`));
    await COMMANDS.help.run([]);
    process.exit(1);
  }

  try {
    await cmd.run(args.slice(1));
  } catch (err) {
    console.error(colors.red(`\n✗ 执行失败:`), err);
    process.exit(1);
  }
}

main();