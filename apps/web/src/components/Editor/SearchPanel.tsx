import { useState, useEffect, useRef, useCallback } from "react";
import { EditorView } from "@codemirror/view";
import { Compartment, EditorSelection, StateEffect } from "@codemirror/state";
import {
  X,
  ChevronUp,
  ChevronDown,
  Replace,
  CaseSensitive,
  Regex,
} from "lucide-react";
import { findMatches } from "../../utils/findMatches";
import "./SearchPanel.css";

interface SearchPanelProps {
  view: EditorView;
  onClose: () => void;
}

interface Match {
  from: number;
  to: number;
}

// 每个 EditorView 复用同一个 Compartment，避免 appendConfig 累积
const searchCompartments = new WeakMap<EditorView, Compartment>();

export function SearchPanel({ view, onClose }: SearchPanelProps) {
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegexp, setUseRegexp] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReplace, setShowReplace] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const onDocChangeRef = useRef<() => void>(() => {});
  const skipNextDocChangeRef = useRef(false);
  const doSearchRef = useRef<() => void>(() => {});
  const lastSearchedTextRef = useRef("");

  // 聚焦搜索输入框
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      clearTimeout(searchTimerRef.current);
    };
  }, []);

  // 用 Compartment 注入文档变化监听器，可在卸载时真正移除
  useEffect(() => {
    let compartment = searchCompartments.get(view);
    const listener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onDocChangeRef.current();
      }
    });

    if (!compartment) {
      compartment = new Compartment();
      searchCompartments.set(view, compartment);
      view.dispatch({
        effects: StateEffect.appendConfig.of(compartment.of(listener)),
      });
    } else {
      view.dispatch({
        effects: compartment.reconfigure(listener),
      });
    }

    return () => {
      const comp = searchCompartments.get(view);
      if (comp) {
        try {
          view.dispatch({ effects: comp.reconfigure([]) });
        } catch {
          // view 可能已被销毁
        }
      }
    };
  }, [view]);

  // 刷新匹配（保持光标位置）
  const refreshMatches = useCallback(
    (preservePosition?: number) => {
      if (!searchText) {
        setMatches([]);
        setCurrentIndex(0);
        return;
      }
      const doc = view.state.doc.toString();
      const foundMatches = findMatches(
        doc,
        searchText,
        caseSensitive,
        useRegexp,
      );
      setMatches(foundMatches);

      if (foundMatches.length === 0) {
        setCurrentIndex(0);
        return;
      }

      if (preservePosition !== undefined) {
        let idx = foundMatches.findIndex((m) => m.from >= preservePosition);
        if (idx === -1) idx = 0;
        setCurrentIndex(idx);
      }
    },
    [searchText, caseSensitive, useRegexp, view],
  );

  // 执行搜索（定位到光标附近的匹配）
  const doSearch = useCallback(() => {
    if (!searchText) {
      setMatches([]);
      setCurrentIndex(0);
      lastSearchedTextRef.current = "";
      return;
    }

    const doc = view.state.doc.toString();
    const foundMatches = findMatches(doc, searchText, caseSensitive, useRegexp);
    setMatches(foundMatches);
    lastSearchedTextRef.current = searchText;

    if (foundMatches.length === 0) {
      setCurrentIndex(0);
      return;
    }

    // 定位到光标附近的匹配
    const cursor = view.state.selection.main.from;
    let idx = foundMatches.findIndex((m) => m.from >= cursor);
    if (idx === -1) idx = 0;
    setCurrentIndex(idx);

    view.dispatch({
      selection: EditorSelection.single(
        foundMatches[idx].from,
        foundMatches[idx].to,
      ),
      scrollIntoView: true,
    });
  }, [searchText, caseSensitive, useRegexp, view]);

  // 保持 ref 始终指向最新的 doSearch
  doSearchRef.current = doSearch;

  // 文档变化时防抖刷新匹配
  useEffect(() => {
    onDocChangeRef.current = () => {
      if (skipNextDocChangeRef.current) {
        skipNextDocChangeRef.current = false;
        return;
      }
      if (!searchText) return;
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        refreshMatches(view.state.selection.main.from);
      }, 200);
    };
  }, [refreshMatches, searchText, view]);

  // 切换大小写/正则选项后立即重新搜索
  useEffect(() => {
    if (searchText) {
      doSearchRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseSensitive, useRegexp]);

  // 高亮当前匹配项并滚动到视图
  useEffect(() => {
    if (matches.length > 0) {
      const clampedIndex = Math.min(currentIndex, matches.length - 1);
      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
        return;
      }
      const match = matches[clampedIndex];
      view.dispatch({
        selection: EditorSelection.single(match.from, match.to),
        scrollIntoView: true,
      });
    }
  }, [currentIndex, matches, view]);

  const handleFindNext = () => {
    if (matches.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % matches.length);
  };

  const handleFindPrevious = () => {
    if (matches.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const handleReplace = () => {
    if (
      matches.length === 0 ||
      currentIndex < 0 ||
      currentIndex >= matches.length
    )
      return;
    const match = matches[currentIndex];
    const positionAfterReplace = match.from;

    skipNextDocChangeRef.current = true;
    view.dispatch({
      changes: { from: match.from, to: match.to, insert: replaceText },
    });

    clearTimeout(searchTimerRef.current);
    setTimeout(() => {
      refreshMatches(positionAfterReplace);
    }, 0);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0) return;

    const changes = [...matches].reverse().map((match) => ({
      from: match.from,
      to: match.to,
      insert: replaceText,
    }));

    skipNextDocChangeRef.current = true;
    view.dispatch({ changes });

    clearTimeout(searchTimerRef.current);
    setTimeout(() => {
      doSearchRef.current();
    }, 0);
  };

  const handleClose = () => {
    onClose();
    view.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(searchTimerRef.current);
      // 搜索文本变化后还没执行过搜索，先搜索
      if (searchText && searchText !== lastSearchedTextRef.current) {
        doSearchRef.current();
        return;
      }
      if (e.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    }
  };

  // 输入变化时立即清空旧结果，防抖后重新搜索
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setMatches([]);
    setCurrentIndex(0);

    clearTimeout(searchTimerRef.current);
    if (!value) {
      lastSearchedTextRef.current = "";
      return;
    }
    searchTimerRef.current = setTimeout(() => {
      doSearchRef.current();
    }, 150);
  };

  const matchCountText = () => {
    if (!searchText) return "";
    // 防抖窗口内（搜索文本已变但还没执行搜索）不显示"无匹配"
    if (searchText !== lastSearchedTextRef.current) return "";
    if (matches.length === 0) return "无匹配";
    return `${Math.min(currentIndex, matches.length - 1) + 1}/${matches.length}`;
  };

  return (
    <div className="search-panel" onKeyDown={handleKeyDown}>
      <div className="search-row">
        <div className="search-input-wrapper">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="查找..."
            value={searchText}
            onChange={handleInputChange}
          />
          {searchText && (
            <span className="match-count">{matchCountText()}</span>
          )}
        </div>

        <div className="search-buttons">
          <button
            className={`search-option-btn ${caseSensitive ? "active" : ""}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            data-tooltip="区分大小写"
          >
            <CaseSensitive size={16} />
          </button>
          <button
            className={`search-option-btn ${useRegexp ? "active" : ""}`}
            onClick={() => setUseRegexp(!useRegexp)}
            data-tooltip="使用正则表达式"
          >
            <Regex size={16} />
          </button>
          <div className="search-divider" />
          <button
            className="search-nav-btn"
            onClick={handleFindPrevious}
            data-tooltip="上一个 (Shift+Enter)"
          >
            <ChevronUp size={16} />
          </button>
          <button
            className="search-nav-btn"
            onClick={handleFindNext}
            data-tooltip="下一个 (Enter)"
          >
            <ChevronDown size={16} />
          </button>
          <div className="search-divider" />
          <button
            className={`search-option-btn ${showReplace ? "active" : ""}`}
            onClick={() => setShowReplace(!showReplace)}
            data-tooltip="显示替换"
          >
            <Replace size={16} />
          </button>
          <button
            className="search-close-btn"
            onClick={handleClose}
            data-tooltip="关闭 (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {showReplace && (
        <div className="replace-row">
          <input
            type="text"
            className="search-input replace-input"
            placeholder="替换为..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
          />
          <div className="search-buttons">
            <button
              className="replace-btn"
              onClick={handleReplace}
              disabled={matches.length === 0}
            >
              替换
            </button>
            <button
              className="replace-btn"
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
            >
              全部替换
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
