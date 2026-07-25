import { useEffect, useState } from "react";
import { useFileStore } from "../../store/fileStore";
import { useEditorStore } from "../../store/editorStore";

/**
 * 格式化相对时间
 */
function formatRelativeTime(date: Date | null): string {
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 10) return "刚刚保存";
  if (diffSec < 60) return `${diffSec} 秒前保存`;
  if (diffMin < 60) return `${diffMin} 分钟前保存`;
  if (diffHour < 24) return `${diffHour} 小时前保存`;

  // 超过 24 小时显示具体时间
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} 保存`;
}

export function SaveIndicator() {
  // 文件系统模式的状态
  const fileSavedAt = useFileStore((state) => state.lastSavedAt);
  const fileIsDirty = useFileStore((state) => state.isDirty);
  const fileIsSaving = useFileStore((state) => state.isSaving);
  const currentFile = useFileStore((state) => state.currentFile);

  // 通用编辑器状态（用于非文件模式）
  const editorSavedAt = useEditorStore((state) => state.lastAutoSavedAt);
  const editorIsEditing = useEditorStore((state) => state.isEditing);
  const setLastAutoSavedAt = useEditorStore(
    (state) => state.setLastAutoSavedAt,
  );
  const markdown = useEditorStore((state) => state.markdown);

  const [displayText, setDisplayText] = useState("");

  // 判断是否处于文件系统模式
  const isFileMode = !!currentFile;

  // 选择使用哪个时间戳
  const lastSavedAt = isFileMode ? fileSavedAt : editorSavedAt;
  const isDirty = isFileMode ? fileIsDirty : editorIsEditing;
  const isSaving = isFileMode ? fileIsSaving : false;

  // 非文件模式：内容变化后 2 秒标记为"已保存"
  useEffect(() => {
    if (isFileMode) return;
    if (!editorIsEditing) return;

    const timer = setTimeout(() => {
      setLastAutoSavedAt(new Date());
    }, 2000);

    return () => clearTimeout(timer);
  }, [markdown, isFileMode, editorIsEditing, setLastAutoSavedAt]);

  // 定时刷新相对时间显示
  useEffect(() => {
    if (!lastSavedAt) {
      setDisplayText("");
      return;
    }

    const update = () => setDisplayText(formatRelativeTime(lastSavedAt));
    update();

    // 每 10 秒更新一次
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, [lastSavedAt]);

  // 状态优先级：保存中 > 编辑中 > 已保存时间 > 就绪
  if (isSaving) {
    return <span className="save-indicator saving">保存中...</span>;
  }

  if (isDirty) {
    return <span className="save-indicator unsaved">编辑中</span>;
  }

  if (displayText) {
    return <span className="save-indicator saved">{displayText}</span>;
  }

  // 初始状态：无编辑活动
  return <span className="save-indicator ready">就绪</span>;
}
