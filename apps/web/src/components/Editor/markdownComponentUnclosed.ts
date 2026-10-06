/**
 * markdownComponentUnclosed
 *
 * 给「有 ::: 开头、却没有配对 ::: 收尾」的组件起始标记加波浪线提示，
 * 让"组件没生效"这件事在编辑器里直接可见，而不是只能靠猜。
 *
 * 判定复用 core 的 findUnclosedComponents（与真实渲染同一套规则），
 * 只做渲染层装饰，不改动文档内容。
 */
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  ViewPlugin,
  type DecorationSet,
  type EditorView,
  type ViewUpdate,
} from "@codemirror/view";
import { findUnclosedComponents } from "@wemd/core";

const unclosedDecoration = Decoration.mark({
  attributes: {
    class: "cm-comp-unclosed",
    title: "这个组件缺少配对的 ::: 收尾，补上之后才会生效",
  },
});

/** 起始标记 `::: 组件名`（用于确定波浪线的位置） */
const OPEN_MARK_RE = /:::[ \t]*[A-Za-z][A-Za-z0-9-]*/;

const unclosedPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      // 返回顺序为行号升序，满足 RangeSetBuilder 要求
      for (const { line } of findUnclosedComponents(
        view.state.doc.toString(),
      )) {
        const docLine = view.state.doc.line(line + 1); // 行号 0 基 → CodeMirror 1 基
        const match = docLine.text.match(OPEN_MARK_RE);
        if (!match || match.index === undefined) continue;
        builder.add(
          docLine.from + match.index,
          docLine.from + match.index + match[0].length,
          unclosedDecoration,
        );
      }
      return builder.finish();
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

export const markdownComponentUnclosed = () => unclosedPlugin;
