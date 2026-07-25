import { useCallback, useEffect, useRef } from "react";
import {
  createEditorPreviewScrollSync,
  type ScrollSyncAdapter,
  type ScrollSyncSource,
} from "./editorPreviewScrollSync";

export function useEditorPreviewScrollSync() {
  const coordinatorRef = useRef(
    null as ReturnType<typeof createEditorPreviewScrollSync> | null,
  );
  if (!coordinatorRef.current) {
    coordinatorRef.current = createEditorPreviewScrollSync();
  }

  useEffect(
    () => () => {
      coordinatorRef.current?.destroy();
    },
    [],
  );

  const registerAdapter = useCallback(
    (source: ScrollSyncSource, adapter: ScrollSyncAdapter | null) => {
      coordinatorRef.current?.setAdapter(source, adapter);
    },
    [],
  );

  const registerEditor = useCallback(
    (adapter: ScrollSyncAdapter | null) => registerAdapter("editor", adapter),
    [registerAdapter],
  );
  const registerPreview = useCallback(
    (adapter: ScrollSyncAdapter | null) => registerAdapter("preview", adapter),
    [registerAdapter],
  );

  return { registerEditor, registerPreview };
}
