export interface HistorySnapshot {
  id: string;
  markdown: string;
  title: string;
  theme: string;
  themeName: string;
  customCSS: string;
  filePath?: string;
  createdAt: string;
  savedAt: string;
}

export type HistorySnapshotInput = Omit<HistorySnapshot, 'id' | 'savedAt' | 'createdAt'>;
