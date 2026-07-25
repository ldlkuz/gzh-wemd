interface HeadingPresetCss {
  content: string;
  extra?: string;
}

interface QuotePresetCss {
  base: string;
  extra?: string;
}

const headingPresetTemplates: Record<
  string,
  (tag: string) => HeadingPresetCss
> = {
  simple: () => ({ content: "" }),
  "left-border": () => ({
    content: `
            border-left: 4px solid var(--wemd-primary-color);
            padding-left: 10px;
        `,
  }),
  "bottom-border": () => ({
    content: `
            border-bottom: 2px solid var(--wemd-primary-color);
            padding-bottom: 8px;
        `,
  }),
  "double-line": () => ({
    content: `
            border-top: 2px solid var(--wemd-primary-color);
            border-bottom: 2px solid var(--wemd-primary-color);
            padding: 8px 0;
        `,
  }),
  boxed: () => ({
    content: `
            background: var(--wemd-primary-color-20);
            border-left: 4px solid var(--wemd-primary-color);
            padding: 8px 12px;
            border-radius: 4px;
        `,
  }),
  "bottom-highlight": () => ({
    content: `
            display: inline-block;
            background: linear-gradient(to bottom, transparent 60%, var(--wemd-primary-color-30) 60%);
            padding: 0 4px;
        `,
  }),
  pill: () => ({
    content: `
            background: var(--wemd-primary-color);
            color: #fff;
            padding: 4px 16px;
            border-radius: 20px;
            display: inline-block;
        `,
  }),
  bracket: (tag) => ({
    content: `
            display: inline-block;
            position: relative;
            padding: 0 10px;
        `,
    extra: `
        #wemd ${tag} .content::before {
            content: '[';
            margin-right: 5px;
            color: var(--wemd-primary-color);
            font-weight: bold;
        }
        #wemd ${tag} .content::after {
            content: ']';
            margin-left: 5px;
            color: var(--wemd-primary-color);
            font-weight: bold;
        }
        `,
  }),
};

const quotePresetTemplates: Record<string, () => QuotePresetCss> = {
  "left-border": () => ({
    base: `
            background: var(--wemd-quote-background);
            border-left-style: var(--wemd-quote-border-style);
            border-left-width: var(--wemd-quote-border-width);
            border-left-color: var(--wemd-quote-border-color);
        `,
  }),
  "top-bottom-border": () => ({
    base: `
            border-top: var(--wemd-quote-border-width) var(--wemd-quote-border-style) var(--wemd-quote-border-color);
            border-bottom: var(--wemd-quote-border-width) var(--wemd-quote-border-style) var(--wemd-quote-border-color);
            border-left: none;
            background: var(--wemd-quote-background);
            text-align: center;
        `,
    extra: `
        #wemd blockquote p { text-align: center; }
        `,
  }),
  "quotation-marks": () => ({
    base: `
            background: var(--wemd-quote-background);
            border-left: none;
            border-radius: 4px;
            padding-left: calc(var(--wemd-quote-padding-x) + 40px);
        `,
    extra: `
        #wemd blockquote::before {
            content: "“";
            display: block;
            height: 0;
            font-size: 60px;
            color: var(--wemd-quote-border-color);
            font-family: Georgia, serif;
            line-height: 1;
            margin-left: -40px;
            margin-top: -6px;
            opacity: 0.3;
            pointer-events: none;
        }
        #wemd blockquote p {
            position: relative;
            z-index: 1;
        }
        `,
  }),
  boxed: () => ({
    base: `
            border: var(--wemd-quote-border-width) var(--wemd-quote-border-style) var(--wemd-quote-border-color);
            background: var(--wemd-quote-background);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        `,
  }),
  "center-accent": () => ({
    base: `
            background: transparent;
            border-left: none;
            text-align: center;
            position: relative;
        `,
    extra: `
        #wemd blockquote p { text-align: center; }
        #wemd blockquote::before {
            content: "";
            display: block;
            width: 40px;
            height: var(--wemd-quote-border-width);
            background: var(--wemd-quote-border-color);
            margin: 0 auto 15px;
            opacity: 0.8;
        }
        #wemd blockquote::after {
            content: "";
            display: block;
            width: 40px;
            height: var(--wemd-quote-border-width);
            background: var(--wemd-quote-border-color);
            margin: 15px auto 0;
            opacity: 0.8;
        }
        `,
  }),
  "corner-frame": () => ({
    base: `
            background: var(--wemd-quote-background);
            border-left: none;
            position: relative;
        `,
    extra: `
        #wemd blockquote::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 20px;
            height: 20px;
            border-top: var(--wemd-quote-border-width) var(--wemd-quote-border-style) var(--wemd-quote-border-color);
            border-left: var(--wemd-quote-border-width) var(--wemd-quote-border-style) var(--wemd-quote-border-color);
        }
        #wemd blockquote::after {
            content: "";
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            border-bottom: var(--wemd-quote-border-width) var(--wemd-quote-border-style) var(--wemd-quote-border-color);
            border-right: var(--wemd-quote-border-width) var(--wemd-quote-border-style) var(--wemd-quote-border-color);
        }
        `,
  }),
};

/**
 * 获取标题预设 CSS 模板
 */
export function getHeadingPresetCSS(
  presetId: string,
  _color: string,
  tag: string,
): { content: string; extra: string } {
  const template =
    headingPresetTemplates[presetId] || headingPresetTemplates.simple;
  const css = template(tag);
  return { content: css.content || "", extra: css.extra || "" };
}

/**
 * 获取引用预设 CSS
 */
export function getQuotePresetCSS(
  presetId: string,
  _color: string,
  _bgColor: string,
  _textColor: string,
  _borderWidth: number,
  _borderStyle: string,
  _padding: number,
  _centered?: boolean,
): { base: string; extra: string } {
  const template =
    quotePresetTemplates[presetId] || quotePresetTemplates["left-border"];
  const css = template();
  return { base: css.base || "", extra: css.extra || "" };
}
