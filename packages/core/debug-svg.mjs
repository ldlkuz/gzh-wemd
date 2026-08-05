import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { zip, strFromU8 } = require('fflate');
// makeValidManifest 拷贝（和 test 一致）
const makeValidManifest = () => JSON.parse(JSON.stringify({
  sdkVersion: '1.0.0',
  meta: { id: 'test-theme', name: '测试主题', description: '用于单元测试的合法主题', keywords: ['测试', 'unit-test'], version: '1.0.0' },
  tokens: {
    color: { primary: '#3b82f6', primaryDark: '#2563eb', primaryLight: '#dbeafe', secondary: '#f59e0b', accent: '#ef4444', background: '#fff', bgSoft: '#f9fafb', bgCard: '#fff', bgMuted: '#e5e7eb', textStrong: '#111827', textNormal: '#374151', textSoft: '#9ca3af', border: '#d1d5db', borderSoft: '#e5e7eb' },
    typography: { fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '16px', lineHeight: '1.75', letterSpacing: 0.5, heading: { h1: { fontSize: 28, color: '#111827', marginTop: 24, marginBottom: 16, fontWeight: '700' }, h2: { fontSize: 24, color: '#111827', marginTop: 20, marginBottom: 12, fontWeight: '600' }, h3: { fontSize: 20, color: '#374151', marginTop: 16, marginBottom: 10, fontWeight: '600' }, h4: { fontSize: 18, color: '#374151', marginTop: 14, marginBottom: 8, fontWeight: '500' } }, codeFontFamily: 'Consolas, monospace' },
    spacing: { pagePadding: 16, paragraphMargin: 12 },
    border: { radius: 8 },
    shadow: { enabled: false, value: 'none' }
  },
  layout: { preferredComponents: ['share-card', 'quote-card'], density: 'medium', tone: ['modern', 'minimal'] }
}));

const manifestToJson = (m) => JSON.stringify(m, null, 2);

function createZip(files) {
  return new Promise((resolve, reject) => {
    const u8Files = {};
    for (const [name, content] of Object.entries(files)) {
      u8Files[name] = typeof content === 'string'
        ? new TextEncoder().encode(content)
        : content;
    }
    zip(u8Files, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// 模拟 CSS 中用 var(--wemd-asset-xxx) 引用，但 manifest 里未注册的场景
const manifest = makeValidManifest();
manifest.components = {
  'hero-banner': {
    enabled: true,
    variant: 'brand',
    variantCss:
      '.wemd-hero-banner[data-variant="brand"] { background: var(--wemd-asset-hero-deco-svg); }',
  },
};
const files = {
  'manifest.json': manifestToJson(manifest),
  'assets/images/hero-deco.svg': '<svg xmlns="http://www.w3.org/2000/svg"><path/></svg>',
};
// 动态 import ts-node 也行，但直接跑 loader 通过 vitest 更快；这里打印 errors
const { validateThemePackageManifest } = await import('./src/theme-registry/ThemeValidator.ts');
const r = validateThemePackageManifest(manifest);
console.log('manifest check ok=', r.ok);
const errs = r.ok ? r.errors ?? [] : r.errors;
for (const e of errs) console.log(' -', e.path, 'sev=', e.severity, e.message.slice(0, 150));

