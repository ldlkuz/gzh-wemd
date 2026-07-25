import { useEffect, useState } from 'react';
import type { StorageType } from '../../storage/types';
import { useStorageContext } from '../../storage/StorageContext';
import './StorageModeSelector.css';

const OPTIONS: { type: StorageType; label: string; description: string; notice: string }[] = [
  {
    type: 'filesystem',
    label: '本地存储模式',
    description: '直接读写指定文件夹中的 .md 文件，体验接近桌面版。',
    notice: '⚠️ 注意：更换浏览器或清理站点权限后，需要重新授予该文件夹的访问权限。',
  },
  {
    type: 'indexeddb',
    label: '浏览器存储模式',
    description: '文章会保存在浏览器里，关掉网页文章依然存在，适用于所有浏览器。',
    notice: '⚠️ 注意：只有在“清除浏览数据”里勾选“Cookie 及其他网站数据”并清除时才会删除文章，单独清理历史记录或缓存不会影响文章。',
  },
];

export function StorageModeSelector() {
  const { type, message, select, isFileSystemSupported, ready } = useStorageContext();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready) setLoading(false);
  }, [ready]);

  const handleSelect = async (nextType: StorageType) => {
    setLoading(true);
    await select(nextType);
    setLoading(false);
  };

  return (
    <div className="storage-mode-selector">
      <p className="storage-mode-tip">选择文章保存的位置：默认保存在浏览器内，也可以授权一个本地文件夹。</p>
      <div className="storage-mode-options">
        {OPTIONS.map((option) => {
          const disabled = option.type === 'filesystem' && !isFileSystemSupported;
          return (
            <button
              key={option.type}
              className={`storage-mode-option ${type === option.type ? 'active' : ''}`}
              disabled={disabled || loading}
              onClick={() => handleSelect(option.type)}
            >
              <div className="storage-mode-option__label">
                <span>{option.label}</span>
                {type === option.type && <small>当前</small>}
              </div>
              <p>{disabled ? '当前浏览器不支持 File System Access API' : option.description}</p>
              <p className="storage-mode-notice">{option.notice}</p>
            </button>
          );
        })}
      </div>
      {message && <div className="storage-mode-status">{message}</div>}
    </div>
  );
}
