export type PublishingPreferenceKey = "linkToFootnote" | "tableWrap";

type PreferenceListener = (enabled: boolean) => void;

export const LINK_TO_FOOTNOTE_EVENT = "wemd-link-to-footnote-change";
export const TABLE_WRAP_EVENT = "wemd-table-wrap-change";

const PREFERENCES = {
  linkToFootnote: {
    storageKey: "wemd-link-to-footnote",
    eventName: LINK_TO_FOOTNOTE_EVENT,
    persistBeforeNotify: false,
  },
  tableWrap: {
    storageKey: "wemd-table-wrap",
    eventName: TABLE_WRAP_EVENT,
    persistBeforeNotify: true,
  },
} satisfies Record<
  PublishingPreferenceKey,
  {
    storageKey: string;
    eventName: string;
    persistBeforeNotify: boolean;
  }
>;

const currentValues: Record<PublishingPreferenceKey, boolean> = {
  linkToFootnote: false,
  tableWrap: false,
};

const serverListeners: Record<
  PublishingPreferenceKey,
  Set<PreferenceListener>
> = {
  linkToFootnote: new Set(),
  tableWrap: new Set(),
};

export function getPublishingPreference(
  preference: PublishingPreferenceKey,
): boolean {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(
      PREFERENCES[preference].storageKey,
    );
    if (saved === "true" || saved === "false") {
      currentValues[preference] = saved === "true";
    }
  }
  return currentValues[preference];
}

export function setPublishingPreference(
  preference: PublishingPreferenceKey,
  enabled: boolean,
): void {
  const config = PREFERENCES[preference];
  currentValues[preference] = enabled;

  if (typeof window === "undefined") {
    serverListeners[preference].forEach((listener) => listener(enabled));
    return;
  }

  const persist = () =>
    window.localStorage.setItem(config.storageKey, String(enabled));
  const notify = () =>
    window.dispatchEvent(
      new CustomEvent<boolean>(config.eventName, { detail: enabled }),
    );

  if (config.persistBeforeNotify) {
    persist();
    notify();
  } else {
    notify();
    persist();
  }
}

export function subscribePublishingPreference(
  preference: PublishingPreferenceKey,
  listener: PreferenceListener,
): () => void {
  if (typeof window === "undefined") {
    serverListeners[preference].add(listener);
    return () => serverListeners[preference].delete(listener);
  }

  const handlePreferenceChange = (event: Event) => {
    listener((event as CustomEvent<boolean>).detail);
  };
  const eventName = PREFERENCES[preference].eventName;
  window.addEventListener(eventName, handlePreferenceChange);
  return () => window.removeEventListener(eventName, handlePreferenceChange);
}
