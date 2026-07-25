import { useStorageContext } from "../../storage/StorageContext";
import { IndexedHistoryPanel } from "./IndexedHistoryPanel";
import { FileSystemHistory } from "./FileSystemHistory";
import "./HistoryPanel.css";

export function HistoryPanel() {
  const { adapter, type } = useStorageContext();
  if (type === "filesystem" && adapter) {
    return <FileSystemHistory adapter={adapter} />;
  }
  return <IndexedHistoryPanel />;
}
