// ==UserScript==
// @name         微信公众号HTML插入器-真实剪贴板版
// @namespace    https://mp.weixin.qq.com/
// @version      3.3.0
// @description  支持 ProseMirror 编辑器的 HTML 插入 (直接 DOM 追加，绕过 paste 过滤，保留 grid/flex 排版)
// @author       AI Assistant
// @match        https://mp.weixin.qq.com/cgi-bin/appmsg*
// @match        https://mp.weixin.qq.com/appmsg/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================
    //  日志系统
    // =========================================================
    const TAG = '[微信HTML插入器]';
    const log = {
        info: (m, ...a) => console.log(`${TAG} ℹ️ ${m}`, ...a),
        ok: (m, ...a) => console.log(`${TAG} ✅ ${m}`, ...a),
        warn: (m, ...a) => console.warn(`${TAG} ⚠️ ${m}`, ...a),
        error: (m, ...a) => console.error(`${TAG} ❌ ${m}`, ...a),
    };

    log.info('脚本启动 v3.3.0 — 直接 DOM 追加版（绕过 paste 过滤）');

    // =========================================================
    //  注入全局样式 — 动画、过渡、主题变量
    // =========================================================
    const STYLE_ID = 'wh-injector-styles';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            /* -------- 主题变量 -------- */
            :root {
                --wh-primary: #635bff;
                --wh-primary-dark: #4b45c7;
                --wh-accent: #90a7ff;
                --wh-surface: #ffffff;
                --wh-surface-dim: #f5f7ff;
                --wh-surface-soft: #eef2ff;
                --wh-border: rgba(99, 91, 255, 0.14);
                --wh-border-strong: rgba(99, 91, 255, 0.22);
                --wh-text: #182033;
                --wh-text-dim: #6d7892;
                --wh-success: #22c55e;
                --wh-error: #ef4444;
                --wh-warning: #f59e0b;
                --wh-radius: 18px;
                --wh-shadow: 0 26px 70px rgba(19, 30, 73, 0.18), 0 4px 20px rgba(95, 94, 255, 0.12);
                --wh-font: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
                --wh-mono: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
            }

            /* -------- FAB 浮动按钮 -------- */
            #wh-fab {
                position: fixed; right: 22px; top: 50%;
                transform: translateY(-50%);
                min-width: 64px; min-height: 64px;
                padding: 10px 12px 10px 10px;
                border-radius: 22px;
                background:
                    radial-gradient(circle at top left, rgba(255,255,255,0.38), transparent 42%),
                    linear-gradient(145deg, #6d63ff 0%, #564ef4 58%, #443dc6 100%);
                color: white; cursor: pointer; z-index: 999980;
                display: inline-flex; align-items: center; gap: 10px; justify-content: center;
                box-shadow: 0 18px 40px rgba(67, 61, 198, 0.34), inset 0 1px 0 rgba(255,255,255,0.28);
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                user-select: none; border: 1px solid rgba(255,255,255,0.2); outline: none;
                backdrop-filter: blur(10px);
            }
            #wh-fab:hover {
                transform: translateY(-50%) translateX(-2px);
                box-shadow: 0 22px 48px rgba(67, 61, 198, 0.42), inset 0 1px 0 rgba(255,255,255,0.32);
            }
            #wh-fab:active { transform: translateY(-50%) scale(0.97); }

            .wh-fab-mark {
                width: 42px; height: 42px; border-radius: 14px;
                display: inline-flex; align-items: center; justify-content: center;
                background: rgba(255,255,255,0.16);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
                flex-shrink: 0;
            }

            #wh-fab svg {
                width: 22px; height: 22px;
                fill: none; stroke: currentColor; stroke-width: 2;
                stroke-linecap: round; stroke-linejoin: round;
            }

            .wh-fab-text {
                display: flex; flex-direction: column; align-items: flex-start;
                line-height: 1.05;
            }
            .wh-fab-text strong {
                font-size: 13px; font-weight: 700; letter-spacing: 0.02em;
            }
            .wh-fab-text span {
                margin-top: 3px;
                font-size: 10px; opacity: 0.82; letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            /* -------- 遮罩层 -------- */
            #wh-overlay {
                position: fixed; inset: 0;
                background:
                    radial-gradient(circle at top, rgba(99, 91, 255, 0.14), transparent 34%),
                    rgba(9, 14, 31, 0.42);
                backdrop-filter: blur(8px);
                z-index: 999988;
                display: flex; align-items: center; justify-content: center;
                animation: wh-fadeIn 0.2s ease;
            }

            /* -------- 主对话框 -------- */
            #wh-dialog {
                background:
                    linear-gradient(180deg, rgba(244,246,255,0.9), rgba(255,255,255,0.98) 20%),
                    var(--wh-surface);
                border-radius: 28px;
                width: min(720px, calc(100vw - 32px)); max-height: 84vh;
                box-shadow: var(--wh-shadow);
                display: flex; flex-direction: column;
                overflow: hidden;
                animation: wh-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: var(--wh-font);
                border: 1px solid rgba(255,255,255,0.72);
            }

            /* -------- 顶栏 -------- */
            .wh-header {
                padding: 24px 26px 18px;
                background:
                    radial-gradient(circle at top left, rgba(255,255,255,0.55), transparent 26%),
                    linear-gradient(145deg, rgba(109, 99, 255, 0.16), rgba(144, 167, 255, 0.1));
                color: var(--wh-text);
                display: flex; justify-content: space-between; align-items: center;
                border-bottom: 1px solid rgba(99, 91, 255, 0.08);
            }
            .wh-header-main {
                display: flex; align-items: center; gap: 14px;
            }
            .wh-header-badge {
                width: 44px; height: 44px; border-radius: 15px;
                background: linear-gradient(145deg, #6d63ff 0%, #4b45c7 100%);
                color: white;
                display: inline-flex; align-items: center; justify-content: center;
                box-shadow: 0 12px 28px rgba(75, 69, 199, 0.25);
                flex-shrink: 0;
            }
            .wh-header-badge svg {
                width: 22px; height: 22px;
                fill: none; stroke: currentColor; stroke-width: 2;
                stroke-linecap: round; stroke-linejoin: round;
            }
            .wh-header-meta { display: flex; flex-direction: column; gap: 6px; }
            .wh-header-kicker {
                display: inline-flex; align-items: center; gap: 6px;
                font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
                text-transform: uppercase; color: var(--wh-primary-dark);
            }
            .wh-header-kicker::before {
                content: '';
                width: 6px; height: 6px; border-radius: 999px;
                background: var(--wh-primary);
                box-shadow: 0 0 0 4px rgba(99, 91, 255, 0.14);
            }
            .wh-header h2 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.04em; }
            .wh-header p { margin: 0; font-size: 13px; color: var(--wh-text-dim); }

            .wh-close-btn {
                width: 38px; height: 38px; border-radius: 14px;
                background: rgba(255,255,255,0.72);
                border: 1px solid rgba(99, 91, 255, 0.1);
                color: var(--wh-text); font-size: 14px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.15s;
            }
            .wh-close-btn:hover {
                background: white;
                transform: translateY(-1px);
                box-shadow: 0 10px 20px rgba(99, 91, 255, 0.12);
            }

            .wh-helper {
                margin: 18px 26px 0;
                padding: 14px 16px;
                border-radius: 18px;
                background: linear-gradient(180deg, rgba(238,242,255,0.92), rgba(245,247,255,0.92));
                border: 1px solid rgba(99, 91, 255, 0.1);
                color: var(--wh-text);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
            }
            .wh-helper strong {
                display: block;
                font-size: 13px;
                font-weight: 700;
            }
            .wh-helper span {
                display: block;
                margin-top: 4px;
                font-size: 12px;
                line-height: 1.55;
                color: var(--wh-text-dim);
            }

            .wh-meta-grid {
                margin: 18px 26px 0;
                display: grid;
                grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.8fr);
                gap: 12px;
            }
            .wh-field {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }
            .wh-field label {
                font-size: 12px;
                font-weight: 700;
                color: var(--wh-text);
                letter-spacing: 0.02em;
            }
            .wh-input {
                height: 42px;
                border: 1px solid rgba(99, 91, 255, 0.12);
                border-radius: 14px;
                padding: 0 14px;
                outline: none;
                font-family: var(--wh-font);
                font-size: 13px;
                color: var(--wh-text);
                background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,247,255,0.98));
                box-shadow: inset 0 1px 2px rgba(82, 94, 163, 0.06);
                transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
            }
            .wh-input:focus {
                border-color: var(--wh-border-strong);
                box-shadow: 0 0 0 4px rgba(99, 91, 255, 0.12), inset 0 1px 2px rgba(82, 94, 163, 0.06);
                background: white;
                transform: translateY(-1px);
            }
            .wh-input::placeholder {
                color: #9aa4bd;
            }

            /* -------- 代码编辑区 -------- */
            .wh-editor-area {
                flex: 1; overflow: hidden;
                display: flex; flex-direction: column;
                padding: 18px 26px 20px;
            }

            .wh-textarea {
                flex: 1; min-height: 280px;
                border: 1px solid rgba(99, 91, 255, 0.12);
                border-radius: 22px;
                padding: 18px 18px 20px; resize: none; outline: none;
                font-family: var(--wh-mono);
                font-size: 13px; line-height: 1.8;
                color: var(--wh-text);
                background:
                    linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,247,255,0.96)),
                    var(--wh-surface-dim);
                box-shadow: inset 0 1px 3px rgba(82, 94, 163, 0.08);
                transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
            }
            .wh-textarea:focus {
                border-color: var(--wh-border-strong);
                box-shadow: 0 0 0 4px rgba(99, 91, 255, 0.12), inset 0 1px 3px rgba(82, 94, 163, 0.08);
                background: white;
                transform: translateY(-1px);
            }
            .wh-textarea::placeholder { color: #94a3b8; }

            /* -------- 底部操作栏 -------- */
            .wh-actions {
                padding: 18px 26px 22px;
                border-top: 1px solid rgba(99, 91, 255, 0.08);
                display: flex; gap: 14px; justify-content: space-between; align-items: center;
                background: linear-gradient(180deg, rgba(248,249,255,0.9), rgba(255,255,255,1));
            }
            .wh-actions-copy {
                display: flex; flex-direction: column;
                gap: 4px;
            }
            .wh-actions-copy strong {
                font-size: 13px; font-weight: 700; color: var(--wh-text);
            }
            .wh-actions-copy span {
                font-size: 12px; color: var(--wh-text-dim);
            }

            .wh-btn {
                padding: 11px 22px; border-radius: 14px;
                font-size: 13px; font-weight: 700;
                cursor: pointer; transition: all 0.15s;
                border: 1px solid transparent;
                font-family: var(--wh-font);
                display: inline-flex; align-items: center; gap: 6px;
            }

            .wh-btn-primary {
                background: linear-gradient(145deg, #6d63ff 0%, #4b45c7 100%);
                color: white;
                box-shadow: 0 14px 24px rgba(75, 69, 199, 0.24), inset 0 1px 0 rgba(255,255,255,0.18);
            }
            .wh-btn-primary:hover {
                box-shadow: 0 18px 30px rgba(75, 69, 199, 0.32), inset 0 1px 0 rgba(255,255,255,0.22);
                transform: translateY(-1px) scale(1.01);
            }
            @media (max-width: 760px) {
                #wh-fab {
                    right: 14px;
                    padding-right: 10px;
                }
                .wh-fab-text { display: none; }
                #wh-dialog {
                    width: calc(100vw - 20px);
                    border-radius: 22px;
                }
                .wh-header,
                .wh-helper,
                .wh-meta-grid,
                .wh-editor-area,
                .wh-actions {
                    padding-left: 18px;
                    padding-right: 18px;
                    margin-left: 0;
                    margin-right: 0;
                }
                .wh-meta-grid {
                    grid-template-columns: 1fr;
                }
                .wh-actions {
                    flex-direction: column;
                    align-items: stretch;
                }
                .wh-btn-primary {
                    width: 100%;
                    justify-content: center;
                }
            }

            /* -------- Toast -------- */
            .wh-toast {
                position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
                padding: 12px 24px; border-radius: 12px;
                font-size: 14px; font-weight: 600;
                z-index: 999999;
                box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                animation: wh-slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: var(--wh-font);
                display: flex; align-items: center; gap: 8px;
                cursor: pointer;
            }
            .wh-toast-success { background: var(--wh-success); color: white; }
            .wh-toast-error   { background: var(--wh-error);   color: white; }
            .wh-toast-warning { background: var(--wh-warning); color: white; }

            /* -------- 动画 -------- */
            @keyframes wh-fadeIn {
                from { opacity: 0; } to { opacity: 1; }
            }
            @keyframes wh-slideUp {
                from { opacity: 0; transform: translateY(24px) scale(0.96); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes wh-slideDown {
                from { opacity: 0; transform: translate(-50%, -12px); }
                to   { opacity: 1; transform: translate(-50%, 0); }
            }
            @keyframes wh-fadeOut {
                to { opacity: 0; transform: translate(-50%, -8px); }
            }
        `;
        document.head.appendChild(style);
    }

    // =========================================================
    //  配置持久化
    // =========================================================
    const STORAGE_KEY = 'wechat-html-injector-v3';
    const Config = {
        _cache: null,
        _read() {
            if (!this._cache) {
                try { this._cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
                catch { this._cache = {}; }
            }
            return this._cache;
        },
        get(k) { return this._read()[k]; },
        set(k, v) { const d = this._read(); d[k] = v; localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); },
        remove(k) {
            const d = this._read();
            delete d[k];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
        },
    };

    // 弹窗改为无记忆模式，清掉旧版遗留的最近一次内容缓存
    Config.remove('lastCode');
    Config.remove('lastTitle');
    Config.remove('lastAuthor');

    // =========================================================
    //  模板
    // =========================================================
    const PRESETS = [
        {
            id: 'preset-card', name: '信息卡片', icon: '🃏',
            code: `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 32px; margin: 20px 0; color: white;">
  <h3 style="margin: 0 0 12px; font-size: 22px;">📌 标题</h3>
  <p style="margin: 0; font-size: 16px; line-height: 1.8; opacity: 0.95;">在这里写内容</p>
</div>`
        },
        {
            id: 'preset-quote', name: '引用块', icon: '💬',
            code: `<blockquote style="border-left: 4px solid #667eea; margin: 20px 0; padding: 16px 24px; background: #f8f9ff; border-radius: 0 12px 12px 0;">
  <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #2d3748;">引用内容写在这里</p>
  <footer style="margin-top: 8px; font-size: 14px; color: #718096; text-align: right;">— 来源</footer>
</blockquote>`
        },
        {
            id: 'preset-cta', name: 'CTA按钮', icon: '🚀',
            code: `<div style="text-align: center; margin: 30px 0;">
  <a style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 36px; border-radius: 50px; font-size: 17px; font-weight: bold; text-decoration: none;">🚀 立即行动</a>
</div>`
        },
        {
            id: 'preset-divider', name: '分割线', icon: '✂️',
            code: `<div style="text-align: center; margin: 32px 0; color: #a0aec0; font-size: 20px; letter-spacing: 12px;">· · ·</div>`
        },
    ];

    function getUserTemplates() { return Config.get('templates') || []; }
    function saveUserTemplate(name, code) {
        const list = getUserTemplates();
        list.push({ id: 'user-' + Date.now(), name, icon: '📄', code });
        Config.set('templates', list);
    }
    function deleteUserTemplate(id) {
        Config.set('templates', getUserTemplates().filter(t => t.id !== id));
    }

    // =========================================================
    //  编辑器探测
    // =========================================================
    function isVisibleEditorCandidate(node) {
        if (!(node instanceof HTMLElement) || !node.isContentEditable) return false;
        if (node.closest('#wh-overlay') || node.closest('#wh-fab')) return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 180 && rect.height > 40;
    }

    function scoreEditorCandidate(node) {
        const rect = node.getBoundingClientRect();
        let score = rect.width * rect.height;
        const attrs = [
            node.getAttribute('data-placeholder'),
            node.getAttribute('aria-label'),
            node.getAttribute('name'),
            node.getAttribute('id'),
            node.className,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        if (attrs.includes('标题') || attrs.includes('title') || node.closest('.title-editor__input') || node.closest('#js_title_main')) {
            score -= 500000;
        }
        if (node.closest('.rich_media_content') || node.closest('.preview_media_add_word') || node.closest('.editable-area')) {
            score += 120000;
        }
        if (rect.top > 140) {
            score += 60000;
        }
        return score;
    }

    function findWechatBodyEditor(doc = document) {
        const selectors = [
            '.editable-area .ProseMirror[contenteditable="true"]',
            '.preview_media_add_word .ProseMirror[contenteditable="true"]',
            '.rich_media_content .ProseMirror[contenteditable="true"]',
            '.appmsg_editor .ProseMirror[contenteditable="true"]',
        ];

        for (const selector of selectors) {
            const node = doc.querySelector(selector);
            if (node instanceof HTMLElement && isVisibleEditorCandidate(node)) {
                log.ok('命中正文专用选择器', selector);
                return { editor: node, doc, type: 'prosemirror' };
            }
        }
        return null;
    }

    function findEditor() {
        const directBodyEditor = findWechatBodyEditor(document);
        if (directBodyEditor) {
            return directBodyEditor;
        }

        // ProseMirror 优先，按面积和位置选正文区，不再拿到顶部标题编辑框
        let bestPm = null;
        let bestScore = -Infinity;
        document.querySelectorAll('.ProseMirror').forEach((pm) => {
            if (!isVisibleEditorCandidate(pm)) return;
            const score = scoreEditorCandidate(pm);
            if (score > bestScore) {
                bestScore = score;
                bestPm = pm;
            }
        });
        if (bestPm) {
            const r = bestPm.getBoundingClientRect();
            log.ok('ProseMirror', `${Math.round(r.width)}x${Math.round(r.height)}`);
            return { editor: bestPm, doc: document, type: 'prosemirror' };
        }

        // iframe 内的 ProseMirror
        for (const f of document.querySelectorAll('iframe')) {
            try {
                const d = f.contentDocument;
                if (!d) continue;
                const ipm = d.querySelector('.ProseMirror');
                if (ipm && ipm.isContentEditable) {
                    log.ok('ProseMirror (iframe)');
                    return { editor: ipm, doc: d, type: 'prosemirror-iframe' };
                }
            } catch { }
        }

        // 回退: 最大 contenteditable
        let best = null, bestArea = 0;
        document.querySelectorAll('[contenteditable="true"]').forEach(el => {
            const r = el.getBoundingClientRect();
            const a = r.width * r.height;
            if (r.width > 200 && r.height > 50 && a > bestArea) {
                bestArea = a; best = { editor: el, doc: document, type: 'contenteditable' };
            }
        });
        if (best) { log.ok('Contenteditable fallback'); return best; }

        log.error('未找到编辑器'); return null;
    }

    // =========================================================
    //  HTML 清理
    // =========================================================
    function removeCommentNodes(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
        const comments = [];
        let current = walker.nextNode();
        while (current) {
            comments.push(current);
            current = walker.nextNode();
        }
        comments.forEach(node => node.parentNode && node.parentNode.removeChild(node));
    }

    function isVisuallyEmpty(node) {
        if (!(node instanceof HTMLElement)) return false;
        const text = (node.textContent || '').replace(/\u00a0/g, '').trim();
        if (text) return false;
        return Array.from(node.children).every((child) => {
            if (!(child instanceof HTMLElement)) return true;
            return child.tagName === 'BR';
        });
    }

    function stripEditorMetadata(root) {
        root.querySelectorAll('*').forEach((node) => {
            if (!(node instanceof HTMLElement)) return;

            Array.from(node.attributes).forEach((attr) => {
                const name = attr.name.toLowerCase();
                if (name.startsWith('on')) {
                    node.removeAttribute(attr.name);
                    return;
                }
                if (
                    name === 'data-tool' ||
                    name === 'data-wemd-counter-generated' ||
                    name === 'data-wemd-publish-meta' ||
                    name.startsWith('data-wemd-source-')
                ) {
                    node.removeAttribute(attr.name);
                }
            });

            if (node.id === 'wemd') {
                node.removeAttribute('id');
            }

            if (node.hasAttribute('class') && !node.className.trim()) {
                node.removeAttribute('class');
            }
            if (node.getAttribute('style') === '') {
                node.removeAttribute('style');
            }
        });
    }

    function trimEmptyEdgeBlocks(root) {
        while (root.firstElementChild && isVisuallyEmpty(root.firstElementChild)) {
            root.firstElementChild.remove();
        }
        while (root.lastElementChild && isVisuallyEmpty(root.lastElementChild)) {
            root.lastElementChild.remove();
        }
    }

    function unwrapRedundantRoot(root) {
        if (root.childElementCount !== 1) return;
        const wrapper = root.firstElementChild;
        if (!(wrapper instanceof HTMLElement)) return;
        if (!['DIV', 'SECTION'].includes(wrapper.tagName)) return;
        if (wrapper.attributes.length > 0) return;

        const fragment = document.createDocumentFragment();
        while (wrapper.firstChild) {
            fragment.appendChild(wrapper.firstChild);
        }
        root.replaceChildren(fragment);
    }

    function cleanHTML(html) {
        const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
        const body = doc.body;

        removeCommentNodes(body);
        body.querySelectorAll('[data-wemd-publish-meta]').forEach(node => node.remove());
        body.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => node.remove());
        stripEditorMetadata(body);
        trimEmptyEdgeBlocks(body);
        unwrapRedundantRoot(body);

        return body.innerHTML
            .replace(/>\s+</g, '><')
            .trim();
    }

    function extractText(node) {
        return (node?.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function inferMetaFromHtml(html) {
        try {
            let explicitMeta = {
                title: '',
                author: '',
                hasExplicitTitle: false,
                hasExplicitAuthor: false,
                useTitle: true,
                useAuthor: true,
            };
            const commentMatch = html.match(/<!--\s*wemd-meta:([\s\S]*?)\s*-->/i);
            if (commentMatch?.[1]) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(commentMatch[1]));
                    explicitMeta = {
                        title: extractText({ textContent: parsed?.title || '' }),
                        author: extractText({ textContent: parsed?.author || '' }),
                        hasExplicitTitle: Boolean(parsed?.title),
                        hasExplicitAuthor: Boolean(parsed?.author),
                        useTitle: parsed?.useTitle !== false,
                        useAuthor: parsed?.useAuthor !== false,
                    };
                } catch (error) {
                    log.warn('解析 WeMD 元数据失败:', error?.message || error);
                }
            }

            const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
            const body = doc.body;
            if (!explicitMeta.hasExplicitTitle || !explicitMeta.hasExplicitAuthor) {
                const metaNode = body.querySelector('[data-wemd-publish-meta]');
                const encodedMeta = metaNode?.getAttribute('data-wemd-publish-meta');
                if (encodedMeta) {
                    try {
                        const parsed = JSON.parse(decodeURIComponent(encodedMeta));
                        if (!explicitMeta.hasExplicitTitle && parsed?.title) {
                            explicitMeta.title = extractText({ textContent: parsed.title });
                            explicitMeta.hasExplicitTitle = Boolean(explicitMeta.title);
                        }
                        if (!explicitMeta.hasExplicitAuthor && parsed?.author) {
                            explicitMeta.author = extractText({ textContent: parsed.author });
                            explicitMeta.hasExplicitAuthor = Boolean(explicitMeta.author);
                        }
                        explicitMeta.useTitle = parsed?.useTitle !== false;
                        explicitMeta.useAuthor = parsed?.useAuthor !== false;
                    } catch (error) {
                        log.warn('解析 WeMD data 元数据失败:', error?.message || error);
                    }
                }
            }
            const bodyTitle = extractText(body.querySelector('h1')) || '';
            let bodyAuthor = '';
            const paragraphTexts = Array.from(body.querySelectorAll('p'))
                .map((node) => extractText(node))
                .filter(Boolean);

            for (const text of paragraphTexts) {
                const match = text.match(/来源[:：]\s*([^|｜]+?)(?:\s*[|｜]|$)/);
                if (match?.[1]) {
                    bodyAuthor = match[1].trim();
                    break;
                }
            }

            return {
                title: explicitMeta.useTitle
                    ? (explicitMeta.title || bodyTitle)
                    : '',
                author: explicitMeta.useAuthor
                    ? (explicitMeta.author || bodyAuthor)
                    : '',
                hasExplicitTitle: explicitMeta.hasExplicitTitle,
                hasExplicitAuthor: explicitMeta.hasExplicitAuthor,
                useTitle: explicitMeta.useTitle,
                useAuthor: explicitMeta.useAuthor,
            };
        } catch (error) {
            log.warn('提取标题作者失败:', error?.message || error);
            return {
                title: '',
                author: '',
                hasExplicitTitle: false,
                hasExplicitAuthor: false,
                useTitle: true,
                useAuthor: true,
            };
        }
    }

    function getFieldSearchSpace() {
        const docs = [document];
        document.querySelectorAll('iframe').forEach((frame) => {
            try {
                if (frame.contentDocument) docs.push(frame.contentDocument);
            } catch { }
        });
        return docs;
    }

    function isVisibleEditable(node) {
        if (!(node instanceof HTMLElement)) return false;
        if (node.closest('#wh-overlay') || node.closest('#wh-fab')) return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 80 && rect.height > 18;
    }

    function isWechatTitleField(node) {
        return node instanceof HTMLElement && (
            node.closest('.title-editor__input') ||
            node.closest('#js_title_main') ||
            node.matches('textarea[name="title"]') ||
            node.matches('input[name="title"]')
        );
    }

    function scoreFieldCandidate(node, keywords, kind) {
        if (!(node instanceof HTMLElement)) return -1;
        const directText = extractText(node).slice(0, 80);
        const parentText = extractText(node.parentElement).slice(0, 80);
        const attrs = [
            node.getAttribute('placeholder'),
            node.getAttribute('data-placeholder'),
            node.getAttribute('aria-label'),
            node.getAttribute('title'),
            node.getAttribute('name'),
            node.getAttribute('id'),
            node.className,
            directText,
            parentText,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        if (!attrs) return -1;

        let score = 0;
        keywords.forEach((keyword, index) => {
            const lower = keyword.toLowerCase();
            if (attrs.includes(lower)) {
                score += index === 0 ? 140 : 60;
            }
        });

        const rect = node.getBoundingClientRect();
        score += Math.max(0, 600 - rect.top) / 10;

        if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
            score += 18;
        }
        if (node.getAttribute('contenteditable') === 'true') {
            score += 12;
        }
        if (node.getAttribute('role') === 'textbox') {
            score += 10;
        }
        if (node.tagName === 'TEXTAREA') {
            score -= 8;
        }
        if (kind === 'title') {
            if (rect.top < 260) score += 18;
            if (rect.width > 260) score += 12;
            if (rect.height > 32) score += 10;
        }
        return score;
    }

    function findTopField(kind) {
        const keywords = kind === 'title'
            ? ['请在这里输入标题', '标题', 'title', 'appmsg_title']
            : ['请输入作者', '作者', 'author', 'appmsg_author'];
        let best = null;

        if (kind === 'title') {
            const directSelectors = [
                '.title-editor__input .ProseMirror[contenteditable="true"]',
                '#js_title_main .ProseMirror[contenteditable="true"]',
                'textarea[name="title"]',
                'input[name="title"]',
            ];
            for (const selector of directSelectors) {
                const node = document.querySelector(selector);
                if (node instanceof HTMLElement && isVisibleEditable(node)) {
                    log.ok('命中标题专用选择器', selector);
                    return node;
                }
            }
        }

        getFieldSearchSpace().forEach((doc) => {
            const candidates = doc.querySelectorAll('input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"]');
            candidates.forEach((candidate) => {
                if (!isVisibleEditable(candidate)) return;
                const score = scoreFieldCandidate(candidate, keywords, kind);
                if (score < 0) return;
                if (!best || score > best.score) {
                    best = { node: candidate, score };
                }
            });
        });

        if (best) {
            log.ok(`找到${kind === 'title' ? '标题' : '作者'}字段`, best.node);
        } else {
            log.warn(`未找到${kind === 'title' ? '标题' : '作者'}字段`);
        }
        return best?.node || null;
    }

    function dispatchEditableEvents(node) {
        ['focus', 'input', 'change', 'blur'].forEach((eventName) => {
            node.dispatchEvent(new Event(eventName, { bubbles: true }));
        });
    }

    function syncWechatTitleCompanions(node, value) {
        if (!isWechatTitleField(node)) return;
        const titleRoot = node.closest('#js_title_main') || node.closest('.js_title_main') || document.querySelector('#js_title_main');
        if (!(titleRoot instanceof HTMLElement)) return;

        titleRoot.querySelectorAll('textarea[name="title"], input[name="title"]').forEach((field) => {
            if (field === node) return;
            if (field instanceof HTMLInputElement) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
                setter ? setter.call(field, value) : field.value = value;
                dispatchEditableEvents(field);
            } else if (field instanceof HTMLTextAreaElement) {
                const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
                setter ? setter.call(field, value) : field.value = value;
                dispatchEditableEvents(field);
            }
        });
    }

    function writeContenteditableText(node, value) {
        node.focus();
        const doc = node.ownerDocument || document;
        const win = doc.defaultView || window;

        try {
            const selection = win.getSelection ? win.getSelection() : doc.getSelection();
            if (selection) {
                const range = doc.createRange();
                range.selectNodeContents(node);
                range.deleteContents();
                selection.removeAllRanges();
                selection.addRange(range);
            }
            if (doc.execCommand && doc.execCommand('insertText', false, value)) {
                dispatchEditableEvents(node);
                return true;
            }
        } catch (error) {
            log.warn('execCommand 写入失败:', error?.message || error);
        }

        node.textContent = value;
        node.dispatchEvent(new InputEvent('beforeinput', {
            bubbles: true,
            cancelable: true,
            data: value,
            inputType: 'insertText',
        }));
        node.dispatchEvent(new InputEvent('input', {
            bubbles: true,
            data: value,
            inputType: 'insertText',
        }));
        node.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'End' }));
        dispatchEditableEvents(node);
        return true;
    }

    function setEditableValue(node, value) {
        if (!value || !(node instanceof HTMLElement)) return false;
        try {
            if (node instanceof HTMLInputElement) {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
                setter ? setter.call(node, value) : node.value = value;
                dispatchEditableEvents(node);
                syncWechatTitleCompanions(node, value);
                return true;
            }
            if (node instanceof HTMLTextAreaElement) {
                const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
                setter ? setter.call(node, value) : node.value = value;
                dispatchEditableEvents(node);
                syncWechatTitleCompanions(node, value);
                return true;
            }
            if (node.getAttribute('contenteditable') === 'true' || node.getAttribute('contenteditable') === 'plaintext-only') {
                writeContenteditableText(node, value);
                syncWechatTitleCompanions(node, value);
                return true;
            }
            if (node.getAttribute('role') === 'textbox') {
                writeContenteditableText(node, value);
                syncWechatTitleCompanions(node, value);
                return true;
            }
        } catch (error) {
            log.warn('写入字段失败:', error?.message || error);
        }
        return false;
    }

    function fillTopMetaFields(meta) {
        const results = [];

        if (meta.title) {
            const titleField = findTopField('title');
            if (titleField && setEditableValue(titleField, meta.title)) {
                results.push('标题');
            }
        }

        if (meta.author) {
            const authorField = findTopField('author');
            if (authorField && setEditableValue(authorField, meta.author)) {
                results.push('作者');
            }
        }

        return results;
    }

    function refillTopMetaFieldsLater(meta) {
        [0, 180, 420].forEach((delay) => {
            setTimeout(() => {
                const fields = fillTopMetaFields(meta);
                if (fields.length) {
                    log.ok(`延迟补填成功: ${fields.join('/')}`);
                }
            }, delay);
        });
    }

    function notifyInsertSuccess(filledFields) {
        toast(
            filledFields.length
                ? `已填${filledFields.join(' / ')}，正文已插入`
                : '插入成功 ✓',
        );
    }

    // =========================================================
    //  插入引擎
    // =========================================================

    // -------------------------------------------------------------------------
    // 策略 A: 渲染后复制（renderCopy）
    //   原理：把 HTML 渲染进一个屏幕外的 contenteditable div，
    //         用 execCommand('copy') 写入"真实"剪贴板，
    //         再对编辑器执行 execCommand('paste')。
    //   这条路绕过了 ProseMirror 的合成事件过滤，保留 grid/flex 等样式。
    // -------------------------------------------------------------------------
    function insertViaRenderCopy(editor, doc, html) {
        try {
            // 1. 创建屏幕外可渲染暂存区（不能用 display:none，那样无法被选中复制）
            const staging = doc.createElement('div');
            staging.contentEditable = 'true';
            staging.style.cssText = [
                'position:fixed', 'left:-9999px', 'top:100px',
                'width:680px', 'min-height:10px',
                'overflow:visible', 'z-index:-9999',
                'opacity:0.01', 'pointer-events:none'
            ].join(';');
            staging.innerHTML = html;
            doc.body.appendChild(staging);

            // 2. 全选并复制
            staging.focus();
            const r = doc.createRange();
            r.selectNodeContents(staging);
            const sel = doc.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
            const copied = doc.execCommand('copy');
            doc.body.removeChild(staging);

            if (!copied) { log.warn('renderCopy: execCommand copy failed'); return false; }

            // 3. 聚焦编辑器并粘贴
            editor.focus();
            const edSel = doc.getSelection();
            if (!edSel.rangeCount) {
                const er = doc.createRange();
                er.selectNodeContents(editor); er.collapse(false);
                edSel.removeAllRanges(); edSel.addRange(er);
            }
            if (doc.execCommand('paste')) {
                log.ok('renderCopy + execCommand paste');
                return true;
            }
            log.warn('renderCopy: execCommand paste failed');
            return false;
        } catch (e) {
            log.warn('renderCopy failed:', e.message);
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // 策略 B: 合成 ClipboardEvent（原策略 1，保留作降级）
    // -------------------------------------------------------------------------
    function insertViaPaste(editor, doc, html) {
        try {
            editor.focus();
            const sel = doc.getSelection();
            if (!sel.rangeCount) {
                const r = doc.createRange();
                r.selectNodeContents(editor); r.collapse(false);
                sel.removeAllRanges(); sel.addRange(r);
            }
            const dt = new DataTransfer();
            dt.setData('text/html', html);
            dt.setData('text/plain', html.replace(/<[^>]*>/g, ''));
            const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
            editor.dispatchEvent(ev);
            log.ok('Synthetic ClipboardEvent paste');
            return true;
        } catch (e) { log.warn('Paste failed:', e.message); return false; }
    }

    // -------------------------------------------------------------------------
    // 策略 C: execCommand insertHTML（原策略 2）
    // -------------------------------------------------------------------------
    function insertViaExec(editor, doc, html) {
        try {
            editor.focus();
            const sel = doc.getSelection();
            if (!sel.rangeCount) {
                const r = doc.createRange();
                r.selectNodeContents(editor); r.collapse(false);
                sel.removeAllRanges(); sel.addRange(r);
            }
            if (doc.execCommand('insertHTML', false, html)) { log.ok('execCommand insertHTML'); return true; }
        } catch (e) { log.warn('execCommand failed:', e.message); }
        return false;
    }

    // -------------------------------------------------------------------------
    // 策略 D: Range insertNode（原策略 3）
    // -------------------------------------------------------------------------
    function insertViaRange(editor, doc, html) {
        try {
            editor.focus();
            const sel = doc.getSelection();
            const tmp = doc.createElement('div');
            tmp.innerHTML = html;
            const frag = doc.createDocumentFragment();
            while (tmp.firstChild) frag.appendChild(tmp.firstChild);
            if (sel.rangeCount) {
                const r = sel.getRangeAt(0);
                r.deleteContents(); r.insertNode(frag); r.collapse(false);
            } else { editor.appendChild(frag); }
            editor.dispatchEvent(new Event('input', { bubbles: true }));
            log.ok('Range insertNode');
            return true;
        } catch (e) { log.warn('Range failed:', e.message); return false; }
    }

    // -------------------------------------------------------------------------
    // 策略 E: innerHTML（原策略 4，最后兜底）
    // -------------------------------------------------------------------------
    function insertViaDOM(editor, html, mode) {
        try {
            if (mode === 'replace') editor.innerHTML = html;
            else editor.innerHTML += html;
            editor.dispatchEvent(new Event('input', { bubbles: true }));
            log.ok('innerHTML ' + mode);
            return true;
        } catch (e) { log.warn('innerHTML failed:', e.message); return false; }
    }

    function smartInsertFallback(code, meta = {}) {
        const html = cleanHTML(code);
        const r = findEditor();
        if (!r) { toast('未找到编辑器，请先点击编辑区域', 'error'); return false; }
        const { editor, doc, type } = r;
        const isProseMirror = String(type || '').startsWith('prosemirror');
        const filledFields = fillTopMetaFields(meta);

        const domReplace = () => {
            try {
                editor.innerHTML = html;
                editor.dispatchEvent(new Event('input', { bubbles: true }));
                // ProseMirror 规范化后可能在内容前自动插入一个空 <p>，延迟清理
                setTimeout(() => {
                    const first = editor.firstElementChild;
                    if (first && first.tagName === 'P' &&
                        (first.innerHTML === '' || first.innerHTML === '<br>' || !first.textContent.trim())) {
                        first.remove();
                        editor.dispatchEvent(new Event('input', { bubbles: true }));
                        log.ok('已移除 ProseMirror 自动插入的空首行');
                    }
                }, 80);
                log.ok('innerHTML replace');
                return true;
            } catch (e) {
                log.warn('DOM replace failed:', e.message);
                return false;
            }
        };

        const strategyList = isProseMirror
            ? [
                () => domReplace(),
                () => insertViaRange(editor, doc, html),
                () => insertViaRenderCopy(editor, doc, html),
                () => insertViaExec(editor, doc, html),
                () => insertViaPaste(editor, doc, html),
                () => insertViaDOM(editor, html, 'append'),
            ]
            : [
                () => domReplace(),
                () => insertViaDOM(editor, html, 'append'),
                () => insertViaRange(editor, doc, html),
                () => insertViaRenderCopy(editor, doc, html),
                () => insertViaPaste(editor, doc, html),
                () => insertViaExec(editor, doc, html),
            ];

        for (const strategy of strategyList) {
            if (strategy()) {
                refillTopMetaFieldsLater(meta);
                notifyInsertSuccess(filledFields);
                return true;
            }
        }
        toast('所有策略均失败', 'error'); return false;
    }

    function replaceAll(code) {
        const html = cleanHTML(code);
        const r = findEditor();
        if (!r) { toast('未找到编辑器', 'error'); return false; }
        insertViaDOM(r.editor, html, 'replace');
        toast('内容已替换');
        return true;
    }

    // =========================================================
    //  UI: Toast
    // =========================================================
    function toast(msg, type = 'success') {
        document.querySelectorAll('.wh-toast').forEach(el => el.remove());
        const el = document.createElement('div');
        el.className = `wh-toast wh-toast-${type}`;
        const icons = { success: '✓', error: '✕', warning: '!' };
        el.innerHTML = `<span style="font-size: 16px;">${icons[type] || '✓'}</span> ${msg}`;
        el.onclick = () => el.remove();
        document.body.appendChild(el);
        setTimeout(() => {
            el.style.animation = 'wh-fadeOut 0.3s forwards';
            setTimeout(() => el.remove(), 300);
        }, 3500);
    }

    // =========================================================
    //  UI: 主对话框
    // =========================================================
    function showDialog() {
        document.getElementById('wh-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'wh-overlay';
        overlay.innerHTML = `
        <div id="wh-dialog">
            <div class="wh-header">
                <div class="wh-header-main">
                    <div class="wh-header-badge">
                        <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </div>
                    <div class="wh-header-meta">
                        <div class="wh-header-kicker">WeMD Companion</div>
                        <h2>HTML 插入器</h2>
                        <p>把 WeMD 复制出来的 HTML 直接投递到公众号编辑器</p>
                    </div>
                </div>
                <button class="wh-close-btn" id="wh-close">✕</button>
            </div>

            <div class="wh-helper">
                <strong>推荐用法</strong>
                <span>在 WeMD 中点击“复制 HTML”，然后把源码粘贴到这里。插件会先尝试填写顶部标题/作者，再插入正文。</span>
            </div>

            <div class="wh-meta-grid">
                <div class="wh-field">
                    <label for="wh-title">标题</label>
                    <input class="wh-input" id="wh-title" type="text" placeholder="不填时将尝试从 HTML 里的 H1 提取" value="">
                </div>
                <div class="wh-field">
                    <label for="wh-author">作者</label>
                    <input class="wh-input" id="wh-author" type="text" placeholder="不填时尝试从“来源”行提取" value="">
                </div>
            </div>

            <div class="wh-editor-area">
                <textarea class="wh-textarea" id="wh-code" placeholder="在这里粘贴 HTML 代码..."></textarea>
            </div>

            <div class="wh-actions">
                <div class="wh-actions-copy">
                    <strong>当前模式</strong>
                    <span>插入源码，不改动你已经在公众号编辑器里的其它内容</span>
                </div>
                <button class="wh-btn wh-btn-primary" id="wh-insert">插入</button>
            </div>
        </div>`;

        document.body.appendChild(overlay);

        // --- 事件 ---
        const code = document.getElementById('wh-code');
        const titleInput = document.getElementById('wh-title');
        const authorInput = document.getElementById('wh-author');
        let lastAutoMeta = { title: '', author: '' };

        const syncMetaInputsFromCode = (options = {}) => {
            const { overwriteExplicit = true } = options;
            const raw = code.value.trim();
            if (!raw) return;
            const inferred = inferMetaFromHtml(raw);

            if (inferred.useTitle === false) {
                titleInput.value = '';
                lastAutoMeta.title = '';
            }

            if (
                inferred.useTitle !== false &&
                inferred.hasExplicitTitle &&
                overwriteExplicit &&
                titleInput.value.trim() !== inferred.title
            ) {
                titleInput.value = inferred.title;
                lastAutoMeta.title = inferred.title;
            } else if (
                inferred.useTitle !== false &&
                (!titleInput.value.trim() || titleInput.value.trim() === lastAutoMeta.title)
            ) {
                titleInput.value = inferred.title || '';
                lastAutoMeta.title = inferred.title || '';
            }

            if (inferred.useAuthor === false) {
                authorInput.value = '';
                lastAutoMeta.author = '';
            }

            if (
                inferred.useAuthor !== false &&
                inferred.hasExplicitAuthor &&
                overwriteExplicit &&
                authorInput.value.trim() !== inferred.author
            ) {
                authorInput.value = inferred.author;
                lastAutoMeta.author = inferred.author;
            } else if (
                inferred.useAuthor !== false &&
                (!authorInput.value.trim() || authorInput.value.trim() === lastAutoMeta.author)
            ) {
                authorInput.value = inferred.author || '';
                lastAutoMeta.author = inferred.author || '';
            }
        };

        document.getElementById('wh-close').onclick = () => overlay.remove();
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
        code.addEventListener('input', () => syncMetaInputsFromCode({ overwriteExplicit: true }));
        code.addEventListener('paste', () => setTimeout(() => syncMetaInputsFromCode({ overwriteExplicit: true }), 0));
        syncMetaInputsFromCode({ overwriteExplicit: false });

        // 插入
        document.getElementById('wh-insert').onclick = async () => {
            const c = code.value.trim();
            if (!c) { toast('请输入 HTML 代码', 'warning'); return; }
            const inferred = inferMetaFromHtml(c);
            const title = titleInput.value.trim() || inferred.title;
            const author = authorInput.value.trim() || inferred.author;
            overlay.remove();
            setTimeout(() => smartInsertFallback(c, { title, author }), 150);
        };

        // ESC 关闭
        const onKey = e => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); } };
        document.addEventListener('keydown', onKey);
    }

    // =========================================================
    //  UI: 浮动按钮 (FAB)
    // =========================================================
    function createFAB() {
        if (document.getElementById('wh-fab')) return;
        const fab = document.createElement('button');
        fab.id = 'wh-fab';
        fab.title = 'HTML 插入器';
        fab.innerHTML = `
            <span class="wh-fab-mark">
                <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </span>
            <span class="wh-fab-text">
                <strong>WeMD</strong>
                <span>插入 HTML</span>
            </span>`;
        fab.onclick = showDialog;
        document.body.appendChild(fab);
        log.ok('FAB 已就绪');
    }

    // =========================================================
    //  初始化 — 轮询等待编辑器出现
    // =========================================================
    function init() {
        log.info('等待编辑器...');
        let n = 0;
        const timer = setInterval(() => {
            n++;
            if (document.querySelector('.ProseMirror') || document.querySelectorAll('[contenteditable="true"]').length) {
                clearInterval(timer);
                log.ok(`编辑器就绪 (${n}次轮询)`);
                createFAB();
                return;
            }
            if (n >= 60) { clearInterval(timer); log.warn('超时, 强制创建'); createFAB(); }
        }, 500);
    }

    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', init)
        : init();

    log.info('加载完毕, 等待编辑器...');
})();
