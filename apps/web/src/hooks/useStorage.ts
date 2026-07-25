import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { StorageManager } from '../storage/StorageManager';
import type { StorageType } from '../storage/types';

export function useStorage() {
  const [manager] = useState(() => new StorageManager());
  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);
  const [type, setType] = useState<StorageType>('indexeddb');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    manager
      .restoreLastAdapter()
      .then((instance) => {
        if (instance) {
          setAdapter(instance);
          setType(instance.type);
          setReady(true);
          setMessage(instance.type === 'filesystem' ? '已启用本地文件夹模式' : '已启用浏览器存储模式');
        }
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }, [manager]);

  const select = useCallback(
    async (nextType: StorageType) => {
      const result = await manager.setAdapter(nextType);
      setAdapter(manager.currentAdapter);
      setType(nextType);
      setReady(result.ready);
      if (result.ready) {
        setMessage(nextType === 'filesystem' ? '已切换到本地文件夹模式' : '已切换到浏览器存储模式');
      } else {
        setMessage(result.message ?? '初始化失败，请重试');
      }
      return result;
    },
    [manager],
  );

  return useMemo(
    () => ({
      adapter,
      type,
      ready,
      message,
      select,
      isFileSystemSupported: StorageManager.isFileSystemSupported(),
    }),
    [adapter, message, ready, select, type],
  );
}
