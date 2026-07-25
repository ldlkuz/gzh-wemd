/**
 * 获取代码主题 CSS
 */
export function getCodeThemeCSS(themeId: string): string {
  const themes: Record<string, string> = {
    github: `
            #wemd .hljs-comment, #wemd .hljs-quote { color: #998; font-style: italic; }
            #wemd .hljs-keyword, #wemd .hljs-selector-tag, #wemd .hljs-subst { color: #333; font-weight: bold; }
            #wemd .hljs-string, #wemd .hljs-doctag { color: #d14; }
            #wemd .hljs-title, #wemd .hljs-section, #wemd .hljs-selector-id { color: #900; font-weight: bold; }
            #wemd .hljs-type, #wemd .hljs-class .hljs-title { color: #458; font-weight: bold; }
            #wemd .hljs-variable, #wemd .hljs-template-variable { color: #008080; }
            #wemd .hljs-attr { color: #000080; }
        `,
    monokai: `
            #wemd .hljs { color: #f8f8f2; }
            #wemd .hljs-comment, #wemd .hljs-quote { color: #75715e; }
            #wemd .hljs-keyword, #wemd .hljs-selector-tag, #wemd .hljs-literal { color: #f92672; }
            #wemd .hljs-string, #wemd .hljs-attr { color: #e6db74; }
            #wemd .hljs-title, #wemd .hljs-section { color: #a6e22e; }
            #wemd .hljs-type, #wemd .hljs-class .hljs-title { color: #66d9ef; font-style: italic; }
            #wemd .hljs-built_in, #wemd .hljs-selector-attr { color: #ae81ff; }
        `,
    vscode: `
            #wemd .hljs { color: #d4d4d4; }
            #wemd .hljs-comment { color: #6a9955; }
            #wemd .hljs-keyword { color: #569cd6; }
            #wemd .hljs-string { color: #ce9178; }
            #wemd .hljs-literal { color: #569cd6; }
            #wemd .hljs-number { color: #b5cea8; }
            #wemd .hljs-function { color: #dcdcaa; }
            #wemd .hljs-class { color: #4ec9b0; }
            #wemd .hljs-attr { color: #9cdcfe; }
        `,
    "night-owl": `
            #wemd .hljs { color: #d6deeb; }
            #wemd .hljs-comment { color: #637777; font-style: italic; }
            #wemd .hljs-keyword { color: #c792ea; }
            #wemd .hljs-selector-tag { color: #ff5874; }
            #wemd .hljs-string { color: #ecc48d; }
            #wemd .hljs-variable { color: #addb67; }
            #wemd .hljs-number { color: #f78c6c; }
            #wemd .hljs-function { color: #82aaff; }
            #wemd .hljs-attr { color: #7fdbca; }
        `,
    dracula: `
            #wemd .hljs { color: #f8f8f2; }
            #wemd .hljs-comment { color: #6272a4; }
            #wemd .hljs-keyword { color: #ff79c6; }
            #wemd .hljs-selector-tag { color: #ff79c6; }
            #wemd .hljs-literal { color: #bd93f9; }
            #wemd .hljs-string { color: #f1fa8c; }
            #wemd .hljs-variable { color: #50fa7b; }
            #wemd .hljs-number { color: #bd93f9; }
            #wemd .hljs-function { color: #50fa7b; }
            #wemd .hljs-class { color: #8be9fd; }
            #wemd .hljs-attr { color: #50fa7b; }
        `,
    "solarized-dark": `
            #wemd .hljs { color: #839496; }
            #wemd .hljs-comment { color: #586e75; font-style: italic; }
            #wemd .hljs-keyword { color: #859900; }
            #wemd .hljs-selector-tag { color: #859900; }
            #wemd .hljs-string { color: #2aa198; }
            #wemd .hljs-variable { color: #b58900; }
            #wemd .hljs-number { color: #d33682; }
            #wemd .hljs-function { color: #268bd2; }
            #wemd .hljs-attr { color: #b58900; }
        `,
    "solarized-light": `
            #wemd .hljs { color: #657b83; }
            #wemd .hljs-comment { color: #93a1a1; font-style: italic; }
            #wemd .hljs-keyword { color: #859900; }
            #wemd .hljs-selector-tag { color: #859900; }
            #wemd .hljs-string { color: #2aa198; }
            #wemd .hljs-variable { color: #b58900; }
            #wemd .hljs-number { color: #d33682; }
            #wemd .hljs-function { color: #268bd2; }
            #wemd .hljs-attr { color: #b58900; }
        `,
    xcode: `
            #wemd .hljs { color: #000000; }
            #wemd .hljs-comment { color: #007400; }
            #wemd .hljs-quote { color: #007400; }
            #wemd .hljs-keyword { color: #aa0d91; }
            #wemd .hljs-selector-tag { color: #aa0d91; }
            #wemd .hljs-literal { color: #aa0d91; }
            #wemd .hljs-string { color: #c41a16; }
            #wemd .hljs-attr { color: #836C28; }
            #wemd .hljs-title { color: #1c00cf; }
            #wemd .hljs-section { color: #1c00cf; }
            #wemd .hljs-type { color: #5c2699; }
            #wemd .hljs-class .hljs-title { color: #5c2699; }
            #wemd .hljs-variable { color: #3f6e74; }
            #wemd .hljs-built_in { color: #5c2699; }
            #wemd .hljs-number { color: #1c00cf; }
        `,
    "atom-one-light": `
            #wemd .hljs { color: #383a42; }
            #wemd .hljs-comment { color: #a0a1a7; font-style: italic; }
            #wemd .hljs-keyword { color: #a626a4; }
            #wemd .hljs-selector-tag { color: #e45649; }
            #wemd .hljs-string { color: #50a14f; }
            #wemd .hljs-variable { color: #986801; }
            #wemd .hljs-number { color: #986801; }
            #wemd .hljs-function { color: #4078f2; }
            #wemd .hljs-attr { color: #986801; }
            #wemd .hljs-class .hljs-title { color: #c18401; }
            #wemd .hljs-type { color: #986801; }
            #wemd .hljs-built_in { color: #c18401; }
        `,
  };
  return themes[themeId] || "";
}
