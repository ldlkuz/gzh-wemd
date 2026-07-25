// 处理部署更新后旧 index.html 引用已下线 chunk 的崩溃
// 参考：https://vite.dev/guide/build.html#load-error-handling
//
// 用时间窗口 guard：刚刷新过的冷却期内再次失败，则不拦截，
// 让错误按 Vite 默认行为抛出，避免死循环也便于上报。

export const PRELOAD_RELOAD_AT_KEY = "wemd:preload-reloaded-at";
export const PRELOAD_RELOAD_COOLDOWN_MS = 10_000;

export interface PreloadErrorHandlerDeps {
  target: Pick<EventTarget, "addEventListener">;
  storage: Pick<Storage, "getItem" | "setItem">;
  now: () => number;
  reload: () => void;
}

const NOOP_STORAGE: Pick<Storage, "getItem" | "setItem"> = {
  getItem: () => null,
  setItem: () => {},
};

// 受限环境（部分隐私模式 / iframe cookie 策略）下，光访问 window.sessionStorage
// 这个属性就会抛 SecurityError，需要在取值时兜住。
export function getSafeSessionStorage(
  win: Window = window,
): Pick<Storage, "getItem" | "setItem"> {
  try {
    return win.sessionStorage ?? NOOP_STORAGE;
  } catch {
    return NOOP_STORAGE;
  }
}

export function installPreloadErrorHandler(deps: PreloadErrorHandlerDeps) {
  const { target, storage, now, reload } = deps;
  target.addEventListener("vite:preloadError", (event) => {
    let lastReloadAt = 0;
    try {
      lastReloadAt = Number(storage.getItem(PRELOAD_RELOAD_AT_KEY) ?? 0);
    } catch {
      // sessionStorage 不可用（隐私模式等）→ 按未刷新处理，尝试一次 reload
    }
    if (lastReloadAt > 0 && now() - lastReloadAt < PRELOAD_RELOAD_COOLDOWN_MS) {
      return;
    }
    (event as Event).preventDefault();
    try {
      storage.setItem(PRELOAD_RELOAD_AT_KEY, String(now()));
    } catch {
      // 写入失败也继续 reload——最多下次还会再刷一次，不会死循环（浏览器通常会拦）
    }
    reload();
  });
}
