/*! PasteEditor v1.0.0 · node-package: import/require · 基于逆向公众号编辑器思路 */
/*
 * PasteEditor 核心引擎（框架无关）
 * -------------------------------------------------
 * 职责：把一个 contenteditable 元素包装成稳定可用的富文本编辑器核心，
 *       只负责"数据进出 + Sanitize + 命令执行 + 变化通知"。
 * 它不负责具体 UI（工具栏/样式），UI 由壳层(Web Component / 宿主)来接。
 * 用法：
 *   var engine = new PasteEditorEngine(containerEl, {
 *       value,       // 初始 HTML
 *       readonly,    // 是否只读
 *       placeholder, // 空态提示文案
 *       onChange     // function(html, text, event) 内容变化回调
 *   });
 *   engine.insertHTML('<p><strong>你好</strong></p>');
 *   engine.getHTML();  engine.setHTML('...');  engine.destroy();
 *
 * 说明：本核心采用 document.execCommand + Range(Selection)，
 *       思路对齐可逆析出的公众号编辑器（contenteditable 内核）。
 *       输入输出均经过 sanitize 清洗，保证安全性。
 */
(function (global) {
    "use strict";

    /* ---------------- 工具函数 ---------------- */

    /* ---------------- 语法 / 危险成分 / 清洗校验 ---------------- */

    // 轻量标签配对检查（启发式，给"语法损坏"反馈）
    var _VOID = { br: 1, img: 1, hr: 1, input: 1, meta: 1, link: 1, source: 1, wbr: 1 };
    function checkSyntax(html) {
        var warnings = [],
            stack = [],
            all = (html || "").replace(/<!--[\s\S]*?-->/g, ""),
            re = /<\/?([a-z][a-z0-9\-]*)([^>]*?)>/gi,
            mt;
        while ((mt = re.exec(all))) {
            var raw = mt[0],
                tag = mt[1].toLowerCase();
            if (raw[1] === "/") { // 闭合标签
                var idx = stack.lastIndexOf(tag);
                if (idx === -1) {
                    warnings.push("存在闭合未配对的 </" + tag + ">");
                } else {
                    if (idx !== stack.length - 1) {
                        warnings.push("标签嵌套顺序错乱（</" + tag + ">）");
                    }
                    stack.length = idx; // 弹出该标签及其后全部
                }
            } else if (!_VOID[tag] && raw.slice(-2) !== "/>") {
                stack.push(tag);
            }
        }
        if (stack.length) {
            warnings.push("存在未闭合标签：" + stack.slice(-5).join(", ") + "（已被浏览器自动纠正）");
        }
        return warnings;
    }

    // 文本级危险成分扫描
    function scanDanger(src) {
        return {
            script: (src.match(/<\s*script[\s>]/gi) || []).length,
            events: (src.match(/\son[a-z]+\s*=/gi) || []).length,
            jsLink: (src.match(/href\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)\s*javascript:/gi) || []).length
        };
    }

    /*
     * 清洗 + 校验，返回 { html, report }
     * report = { ok, issues: [{ type:'syntax'|'danger'|'removed', level:'error'|'warn', msg }] }
     * 只有出现不合法内容才会产生 issue。
     */
    function analyze(html) {
        var report = { ok: true, issues: [] };
        function add(type, level, msg) {
            report.ok = false;
            report.issues.push({ type: type, level: level, msg: msg });
        }

        var src = typeof html === "string" ? html : "";
        if (src === "") return { html: "<p><br></p>", report: report };

        // 1) 语法检查（启发式）
        checkSyntax(src).forEach(function (w) { add("syntax", "warn", w); });

        // 2) 危险成分
        var d = scanDanger(src);
        if (d.script > 0) add("danger", "error", "移除了 " + d.script + " 个 <script>（危险代码）");
        if (d.events > 0) add("danger", "error", "移除了 " + d.events + " 个 on* 事件属性");
        if (d.jsLink > 0) add("danger", "error", "移除了 " + d.jsLink + " 个 javascript: 链接");

        // 3) 文档级清洗 + 统计被移除的非富文本元素
        var doc = new DOMParser().parseFromString(src, "text/html");
        var removed = {};
        ["script", "style", "link", "meta", "iframe", "object", "embed"].forEach(function (tag) {
            var list = doc.querySelectorAll(tag);
            if (list.length) removed[tag] = list.length;
            list.forEach(function (n) { n.remove(); });
        });
        Object.keys(removed).forEach(function (tag) {
            add("removed", "warn", "已移除 " + removed[tag] + " 个 <" + tag + ">（非富文本元素）");
        });
        doc.querySelectorAll("*").forEach(function (n) {
            Array.prototype.slice.call(n.attributes).forEach(function (a) {
                var name = a.name.toLowerCase();
                if (name.indexOf("on") === 0 || (name === "href" && /^\s*javascript:/i.test(a.value))) {
                    a.ownerElement.removeAttribute(name);
                }
            });
        });

        var out = doc.body.innerHTML;
        return { html: out && out.trim() ? out : "<p><br></p>", report: report };
    }

    // 兼容旧用法：只返回清洗后的 HTML
    function sanitize(html) {
        return analyze(html).html;
    }

    // 在光标处插入 HTML：优先 execCommand，回退到 Range 手动插入
    function insertHtmlAtCaret(ed, html) {
        ed.focus();
        var ok = false;
        try {
            ok = document.execCommand("insertHTML", false, html);
        } catch (e) {
            ok = false;
        }
        if (ok) return;
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        var range = sel.getRangeAt(0);
        var frag = range.createContextualFragment(html);
        range.deleteContents();
        var last = frag.lastChild;
        range.insertNode(frag);
        if (last) {
            range.setStartAfter(last);
            range.collapse(true);
        }
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // 新段落用 <p>（感知公众号默认段落样式）
    function ensureDefaultParagraph() {
        try {
            document.execCommand("defaultParagraphSeparator", false, "p");
        } catch (e) {}
    }

    /* ---------------- 核心类 ---------------- */

    function PasteEditorEngine(container, options) {
        if (!container || !container.appendChild) {
            throw new Error("PasteEditorEngine 需要一个有效的容器元素");
        }
        this.opts = options || {};
        this.container = container;
        this.lastReport = null; // 最近一次写入/粘贴的校验报告

        // 编辑区
        this.ed = document.createElement("div");
        this.ed.className = "pe_editor";
        this.ed.setAttribute("contenteditable", this.opts.readonly ? "false" : "true");
        this.ed.setAttribute("role", "textbox");
        this.ed.setAttribute("aria-multiline", "true");
        if (this.opts.placeholder) {
            this.ed.dataset.placeholder = this.opts.placeholder;
        }
        container.appendChild(this.ed);

        ensureDefaultParagraph();

        // 事件：内容变化
        this._onInput = this._emit.bind(this);
        this.ed.addEventListener("input", this._onInput);

        // 事件：粘贴 — 保留 HTML 富文本，清洗后插入
        this._onPaste = this._handlePaste.bind(this);
        this.ed.addEventListener("paste", this._onPaste);

        // 初始内容
        if (this.opts.value) {
            this.setHTML(this.opts.value);
        } else if (!this.ed.textContent) {
            // 预置一个空段落，Focus 时光标好停靠
            this.ed.innerHTML = "<p><br></p>";
            this.ed.classList.add("pe_empty");
        }
    }

    PasteEditorEngine.prototype = {
        /** 设置内容（清洗后写入） */
        setHTML: function (html) {
            var r = analyze(html);
            this.ed.innerHTML = r.html;
            this.lastReport = r.report;
            this._notify(r.report);
            this._emit();
            return r.report;
        },

        /** 读取内容 HTML */
        getHTML: function () {
            return this.ed.innerHTML;
        },

        /** 在光标处插入一段 HTML（清洗后插入） */
        insertHTML: function (html) {
            var r = analyze(html);
            insertHtmlAtCaret(this.ed, r.html);
            this.lastReport = r.report;
            this._notify(r.report);
            this._emit();
            return r.report;
        },

        /** 在光标处插入纯文本 */
        insertText: function (text) {
            this.ed.focus();
            document.execCommand("insertText", false, String(text));
            this._emit();
        },

        /** 执行一条富文本命令（配合外部工具栏按钮用） */
        execCommand: function (cmd, value) {
            this.ed.focus();
            var v = value === undefined ? null : value;
            if (cmd === "createLink") {
                v = value || "http://";
            }
            document.execCommand(cmd, false, v);
            this._emit();
        },

        /** 当前是否某格式生效（供工具栏做激活态高亮） */
        queryCommandState: function (cmd) {
            try {
                return !!document.queryCommandState(cmd);
            } catch (e) {
                return false;
            }
        },

        /** 聚焦 */
        focus: function () {
            this.ed.focus();
        },

        /** 切换只读 */
        setReadonly: function (ro) {
            this.opts.readonly = !!ro;
            this.ed.setAttribute("contenteditable", this.opts.readonly ? "false" : "true");
        },
        isReadonly: function () {
            return !!this.opts.readonly;
        },

        /** 拿到底层编辑元素，供宿主做更细的定制 */
        getEditor: function () {
            return this.ed;
        },

        /** 卸载：移除 DOM 和事件，防内存泄漏 */
        destroy: function () {
            this.ed.removeEventListener("input", this._onInput);
            this.ed.removeEventListener("paste", this._onPaste);
            if (this.ed.parentNode) this.ed.parentNode.removeChild(this.ed);
            this._onInput = null;
            this._onPaste = null;
        },

        /* ------- 内部 ------- */
        _emit: function () {
            if (this.opts.onChange) {
                this.opts.onChange(this.ed.innerHTML, this.ed.innerText || "", { target: this.ed });
            }
        },

        // 只有出现不合法内容时才通知宿主（合法则保持安静）
        _notify: function (report) {
            if (report && !report.ok && this.opts.onReport) {
                this.opts.onReport(report);
            }
        },

        _handlePaste: function (e) {
            var cb = e.clipboardData || window.clipboardData;
            if (!cb) return;
            e.preventDefault();
            var html = cb.getData("text/html");
            var plain = cb.getData("text/plain");
            if (html) {
                var r = analyze(html);
                insertHtmlAtCaret(this.ed, r.html);
                this.lastReport = r.report;
                this._notify(r.report);
            } else if (plain) {
                document.execCommand("insertText", false, plain);
            }
            this._emit();
        }
    };

    // 暴露静态方法，方便壳层复用
    PasteEditorEngine.sanitize = sanitize;
    PasteEditorEngine.analyze = analyze;
    PasteEditorEngine.insertHtmlAtCaret = insertHtmlAtCaret;

    global.PasteEditorEngine = PasteEditorEngine;
})(typeof window !== "undefined" ? window : this);
/*
 * <paste-editor> Web Component 壳（基于 PasteEditorEngine）
 * -------------------------------------------------
 * 框架无关的标准自定义元素，样式用 Shadow DOM 隔离，可被原生 HTML / Electron / React / Vue 直接引入。
 * 用法：
 *   <paste-editor value="<p>初始内容</p>" readonly></paste-editor>
 *   var el = document.querySelector('paste-editor');
 *   el.value = '<p>新内容</p>';
 *   var html = el.value;                 // 读 HTML
 *   el.insertHTML('<p>插入</p>');        // 程序插入 HTML
 *   el.addEventListener('change', e => e.detail.html);   // 内容变化
 *   el.destroy();
 * 依赖：window.PasteEditorEngine（先加载 engine.js）。
 */
(function () {
    "use strict";
    if (!window.PasteEditorEngine) {
        // 抛错让调用方知道没先载核心
        setTimeout(function () {
            console.error("[paste-editor] 缺少依赖 PasteEditorEngine，请先引入 src/engine.js");
        }, 0);
    }

    var STYLE = [
        ":host{display:block;--pe-accent:#4f9cf9;--pe-ink:#2f3542;--pe-soft:#6b7280;--pe-line:#e6ebf2;--pe-bg:#ffffff;--pe-radius:12px;--pe-font:'PingFang SC','Microsoft YaHei',system-ui,sans-serif;--pe-mono:'SFMono-Regular',Consolas,Menlo,monospace;font-family:var(--pe-font);color:var(--pe-ink);background:var(--pe-bg);border:1px solid var(--pe-line);border-radius:var(--pe-radius);overflow:hidden}",
        ".wrap{display:flex;flex-direction:column;min-height:200px}",
        ".toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:2px;padding:8px 10px;border-bottom:1px solid var(--pe-line);background:#fbfdff}",
        ".tb-group+.tb-group{margin-left:6px}",
        ".tb-btn{border:1px solid transparent;background:transparent;border-radius:6px;min-width:28px;height:28px;padding:0 7px;cursor:pointer;font-size:14px;color:var(--pe-ink);line-height:1}",
        ".tb-btn:hover{background:#eef2f9}",
        ".tb-btn.on{background:var(--pe-accent);color:#fff}",
        ".b{font-weight:700}.i{font-style:italic}.u{text-decoration:underline}.s{text-decoration:line-through}",
        ".editor{flex:1;min-height:220px;overflow:auto}",
        ".editor .pe_editor{min-height:220px;padding:18px 22px;outline:none;line-height:1.7;color:var(--pe-ink)}",
        ".editor .pe_editor:empty::before{content:attr(data-placeholder);color:#b7c2d0;pointer-events:none}",
        ".editor blockquote{border-left:3px solid var(--pe-accent);margin:.6em 0;padding:.1em 1em;color:#4a5568;background:#f6f9ff}",
        ".editor pre{border-radius:6px;background:#2f3542;color:#e6f2ff;padding:10px 12px;font-family:var(--pe-mono);font-size:13px;overflow:auto}",
        ".editor a{color:var(--pe-accent)}",
        ".editor img{max-width:100%;border-radius:6px}",
        "[readonly] .editor{cursor:default}",
        "[readonly] .toolbar{display:none}"
    ].join("\n");

    // 工具栏定义：命令 → 按钮
    var GROUPS = [
        [
            { cmd: "undo", label: "↶", title: "撤销" },
            { cmd: "redo", label: "↷", title: "重做" }
        ],
        [
            { cmd: "bold", label: "B", cls: "b", title: "加粗", query: true },
            { cmd: "italic", label: "I", cls: "i", title: "斜体", query: true },
            { cmd: "underline", label: "U", cls: "u", title: "下划线", query: true },
            { cmd: "strikeThrough", label: "S", cls: "s", title: "删除线", query: true }
        ],
        [
            { cmd: "blockquote", label: "❝", title: "引用", query: true },
            { cmd: "insertUnorderedList", label: "•≡", title: "无序列表", query: true },
            { cmd: "__code", label: "〈/〉", title: "代码块" }
        ],
        [
            { cmd: "createLink", label: "🔗", title: "加链接" },
            { cmd: "unlink", label: "⊘", title: "取消链接" }
        ],
        [
            { cmd: "__insertHtml", label: "插入HTML", title: "插入一段 HTML" },
            { cmd: "__source", label: "源码", title: "查看/编辑源码" }
        ]
    ];

    var opts = { template: "base" }; // 预留扩展位

    var Tmpl = document.createElement("template");
    Tmpl.innerHTML =
        "<style>" + STYLE + "</style>" +
        "<div class='wrap'>" +
            "<div class='toolbar' part='toolbar' hidden></div>" +
            "<div class='editor' part='editor'></div>" +
            "</div>";

    class PasteEditorElement extends HTMLElement {
        static get observedAttributes() {
            return ["value", "readonly", "placeholder"];
        }

        constructor() {
            super();
            this._ready = false;
            this._changingAttr = false;
        }

        connectedCallback() {
            if (this._ready) return;
            this._ready = true;

            var root = this.attachShadow({ mode: "open" });
            root.appendChild(Tmpl.content.cloneNode(true));
            this._edEl = root.querySelector(".editor");
            this._toolEl = root.querySelector(".toolbar");

            // 核心引擎
            var self = this;
            var placeholder = this.getAttribute("placeholder") || "在这里粘贴（Ctrl+V）或继续输入…";
            this.engine = new window.PasteEditorEngine(this._edEl, {
                readonly: this.hasAttribute("readonly"),
                placeholder: placeholder,
                onChange: function (html, text) {
                    self.dispatchEvent(new CustomEvent("change", {
                        detail: { html: html, text: text }
                    }));
                },
                // 宿主想要"遇到不合法 HTML 的报告"，监听 <paste-editor> 上的 report 事件
                onReport: function (report) {
                    self.dispatchEvent(new CustomEvent("report", {
                        detail: report
                    }));
                }
            });
            // engine 会在 _edEl 内再包一层 .pe_editor，取真正可编辑元素
            this._edInner = this.engine.getEditor();
            this._edInner.dataset.placeholder = placeholder;
            this._edInner.style.cssText = "";

            // 初始内容（优先属性 value）
            if (this.hasAttribute("value")) {
                this.engine.setHTML(this.getAttribute("value"));
            }

            this._buildToolbar(root);

            // 只读时隐藏工具栏
            if (this.hasAttribute("readonly")) {
                this._toolEl.hidden = true;
            }
        }

        attributeChangedCallback(name, oldV, newV) {
            if (!this._ready || this._changingAttr) return;
            if (name === "value" && newV !== null) {
                this._setValue(newV, true);
            } else if (name === "readonly") {
                this.engine && this.engine.setReadonly(newV !== null);
                if (this._toolEl) this._toolEl.hidden = newV !== null;
            } else if (name === "placeholder") {
                if (this._edInner) this._edInner.dataset.placeholder = newV || "";
            }
        }

        /* ------- 公共 API ------- */

        /** 读取 HTML */
        get value() {
            if (this.engine) return this.engine.getHTML();
            return this.getAttribute("value") || "";
        }
        /** 设置 HTML */
        set value(html) {
            this._setValue(html, true);
        }

        /** 读取/设置只读 */
        get readonly() { return this.hasAttribute("readonly"); }
        set readonly(v) {
            if (v) this.setAttribute("readonly", "");
            else this.removeAttribute("readonly");
        }

        /** 程序往光标处插入 HTML */
        insertHTML(html) {
            if (this.engine) this.engine.insertHTML(html);
        }

        destroy() {
            if (this.engine) this.engine.destroy();
            this._ready = false;
        }

        /* ------- 内部 ------- */
        _setValue(html, reflect) {
            if (this.engine) this.engine.setHTML(html);
            if (reflect) {
                this._changingAttr = true;
                var s = String(html);
                if (s) this.setAttribute("value", s);
                else this.removeAttribute("value");
                this._changingAttr = false;
            }
        }

        _buildToolbar(root) {
            var self = this;
            var engine = this.engine;
            var frag = document.createDocumentFragment();
            var queryCmds = [];
            GROUPS.forEach(function (group, gi) {
                if (gi > 0) frag.appendChild(sep());
                group.forEach(function (b) {
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "tb-btn" + (b.cls ? " " + b.cls : "");
                    btn.textContent = b.label;
                    btn.title = b.title || b.cmd;
                    btn.setAttribute("data-cmd", b.cmd);
                    if (b.query) queryCmds.push(b.cmd);
                    btn.addEventListener("click", function () {
                        self._runCmd(b.cmd);
                    });
                    frag.appendChild(btn);
                });
            });
            this._toolEl.appendChild(frag);
            this._toolEl.hidden = false;
            this._queryCmds = queryCmds;
            this._root = root;

            // 选区变化时刷新按钮激活态
            document.addEventListener("selectionchange", function () {
                refreshActive();
            });
            function refreshActive() {
                var sel = window.getSelection();
                var hostActive = sel && sel.type === "Range" && self._edEl.contains(sel.anchorNode);
                if (!hostActive) return;
                self._queryCmds.forEach(function (cmd) {
                    var b = self._toolEl.querySelector('[data-cmd="' + cmd + '"]');
                    if (b) b.classList.toggle("on", engine.queryCommandState(cmd.replace("__", "")));
                });
            }
        }

        _runCmd(cmd) {
            var engine = this.engine;
            if (cmd === "__code") {
                wrapSelection(this._edInner);
                return;
            }
            if (cmd === "__source") {
                this._openSource();
                return;
            }
            if (cmd === "__insertHtml") {
                this._openHtmlInsert();
                return;
            }
            engine.execCommand(cmd);
            if (cmd === "undo" || cmd === "redo") engine.focus();
        }

        _openHtmlInsert() {
            var v = prompt("粘贴或输入要插入的 HTML：", '<p style="color:#e74c3c"><strong>你好</strong></p>');
            if (v && v.trim()) this.engine.insertHTML(v);
        }

        _openSource() {
            // 极简源码查看：prompt 读取，确认后回填
            var opened = prompt("当前内容源码（可编辑，确定后回填）：", this.engine.getHTML());
            if (opened !== null) {
                this.engine.setHTML(opened);
                this.dispatchEvent(new CustomEvent("change", {
                    detail: { html: this.engine.getHTML(), text: this.engine.getEditor().innerText || "" }
                }));
            }
        }
    }

    function sep() {
        var s = document.createElement("span");
        s.style.cssText = "width:1px;height:18px;background:var(--pe-line);margin:0 3px";
        return s;
    }

    function wrapSelection(ed) {
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        var range = sel.getRangeAt(0);
        if (range.collapsed) return;
        var pre = document.createElement("pre");
        pre.textContent = range.toString();
        range.deleteContents();
        range.insertNode(pre);
        sel.removeAllRanges();
        var r = document.createRange();
        r.selectNodeContents(pre);
        sel.addRange(r);
    }

    if (!customElements.get("paste-editor")) {
        customElements.define("paste-editor", PasteEditorElement);
    }

    // 暴露元素类，供 ESM/CJS 包入口 `import { PasteEditorElement } from 'paste-editor'` 复用
    if (typeof globalThis !== "undefined") {
        globalThis.PasteEditorElement = PasteEditorElement;
    }
})();