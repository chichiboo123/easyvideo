"use client";

// IndexedDB + OPFS hybrid storage for video files.
// Large files go to OPFS when available; metadata stays in IndexedDB.

const DB_NAME = "easyvideo-db";
const DB_VERSION = 1;
const STORE = "files";

interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: number;
  blob?: Blob;
  opfsPath?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getOPFSRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    // @ts-expect-error - OPFS is widely available in modern browsers but lacks types here.
    if (navigator.storage?.getDirectory) {
      // @ts-expect-error - see above
      return await navigator.storage.getDirectory();
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function saveFile(file: File): Promise<{ id: string; url: string }> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const opfs = await getOPFSRoot();

  let record: StoredFile = {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: Date.now(),
  };

  if (opfs) {
    try {
      const handle = await opfs.getFileHandle(`${id}-${file.name}`, { create: true });
      // @ts-expect-error createWritable types vary across TS lib versions.
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      record.opfsPath = `${id}-${file.name}`;
    } catch {
      record.blob = file;
    }
  } else {
    record.blob = file;
  }

  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  const url = URL.createObjectURL(file);
  return { id, url };
}

export async function loadFile(id: string): Promise<Blob | null> {
  const db = await openDB();
  const record = await new Promise<StoredFile | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as StoredFile | undefined);
    req.onerror = () => reject(req.error);
  });
  if (!record) return null;
  if (record.blob) return record.blob;
  if (record.opfsPath) {
    const opfs = await getOPFSRoot();
    if (!opfs) return null;
    const handle = await opfs.getFileHandle(record.opfsPath);
    return await handle.getFile();
  }
  return null;
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
