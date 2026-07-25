/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import type { StorageAdapter } from "./StorageAdapter";
import type { StorageType, StorageInitResult } from "./types";
import { useStorage } from "../hooks/useStorage";

export interface StorageContextValue {
  adapter: StorageAdapter | null;
  type: StorageType;
  ready: boolean;
  message: string;
  select: (type: StorageType) => Promise<StorageInitResult>;
  isFileSystemSupported: boolean;
}

const StorageContext = createContext<StorageContextValue | undefined>(
  undefined,
);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const storage = useStorage();
  return (
    <StorageContext.Provider value={storage}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorageContext() {
  const ctx = useContext(StorageContext);
  if (!ctx)
    throw new Error("useStorageContext must be used within StorageProvider");
  return ctx;
}
