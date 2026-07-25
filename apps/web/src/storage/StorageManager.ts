import type { StorageAdapter } from './StorageAdapter';
import type { StorageAdapterContext, StorageInitResult, StorageType } from './types';

type AdapterFactory = () => Promise<StorageAdapter>;

const STORAGE_KEY = 'wemd-storage-adapter';
const uniqueId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export class StorageManager {
  private adapter: StorageAdapter | null = null;
  private factories: Partial<Record<StorageType, AdapterFactory>> = {};

  constructor() {
    this.factories.indexeddb = async () => {
      const module = await import('./adapters/IndexedDBAdapter');
      return new module.IndexedDBAdapter();
    };
    this.factories.filesystem = async () => {
      const module = await import('./adapters/FileSystemAdapter');
      return new module.FileSystemAdapter();
    };
  }

  static isFileSystemSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  get currentAdapter() {
    return this.adapter;
  }

  async setAdapter(type: StorageType, context?: StorageAdapterContext): Promise<StorageInitResult> {
    const factory = this.factories[type];
    if (!factory) throw new Error(`Adapter ${type} not registered`);
    if (this.adapter?.teardown) {
      await this.adapter.teardown();
    }
    this.adapter = await factory();
    let adapterContext = context;
    if (type === 'filesystem') {
      const identifier = adapterContext?.identifier ?? uniqueId();
      adapterContext = { ...(adapterContext ?? {}), identifier };
    }
    const result = await this.adapter.init(adapterContext);
    if (result.ready) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ type, identifier: adapterContext?.identifier, ts: Date.now() }),
        );
      } catch {
        /* ignore */
      }
    }
    return result;
  }

  async restoreLastAdapter(): Promise<StorageAdapter | null> {
    if (this.adapter) return this.adapter;
    let persisted: { type: StorageType; identifier?: string } | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) persisted = JSON.parse(raw);
    } catch {
      persisted = null;
    }
    const type = persisted?.type ?? 'indexeddb';
    const context: StorageAdapterContext | undefined =
      type === 'filesystem' ? { identifier: persisted?.identifier ?? uniqueId() } : undefined;
    const result = await this.setAdapter(type, context);
    return result.ready ? this.adapter : null;
  }
}
