export { };

declare global {
    interface FileSystemHandle {
        readonly kind: 'file' | 'directory';
        readonly name: string;
        isSameEntry(other: FileSystemHandle): Promise<boolean>;
    }

    interface FileSystemFileHandle extends FileSystemHandle {
        readonly kind: 'file';
        getFile(): Promise<File>;
        createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
    }

    interface FileSystemDirectoryHandle extends FileSystemHandle {
        readonly kind: 'directory';
        keys(): AsyncIterableIterator<string>;
        values(): AsyncIterableIterator<FileSystemHandle>;
        entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
        getDirectoryHandle(name: string, options?: FileSystemGetDirectoryHandleOptions): Promise<FileSystemDirectoryHandle>;
        getFileHandle(name: string, options?: FileSystemGetFileHandleOptions): Promise<FileSystemFileHandle>;
        removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
        resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
        requestPermission(descriptor: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
    }

    interface FileSystemCreateWritableOptions {
        keepExistingData?: boolean;
    }

    interface FileSystemGetDirectoryHandleOptions {
        create?: boolean;
    }

    interface FileSystemGetFileHandleOptions {
        create?: boolean;
    }

    interface FileSystemRemoveOptions {
        recursive?: boolean;
    }

    interface FileSystemHandlePermissionDescriptor {
        mode?: 'read' | 'readwrite';
    }

    interface FileSystemWritableFileStream extends WritableStream {
        write(data: BufferSource | Blob | string | WriteParams): Promise<void>;
        seek(position: number): Promise<void>;
        truncate(size: number): Promise<void>;
    }

    type WriteParams =
        | { type: 'write'; position?: number; data: BufferSource | Blob | string }
        | { type: 'seek'; position: number }
        | { type: 'truncate'; size: number };

    interface Window {
        showDirectoryPicker(options?: { id?: string; mode?: 'read' | 'readwrite'; startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' }): Promise<FileSystemDirectoryHandle>;
    }
}
