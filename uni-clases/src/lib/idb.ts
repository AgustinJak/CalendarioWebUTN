import type { NoteRecord } from "./types";

const DB_NAME = "uni-clases";
const DB_VERSION = 1;
const STORE_NOTES = "notes";

type NotesDb = IDBDatabase;

function openDb(): Promise<NotesDb> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB no esta disponible en este navegador."));
  }

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("No se pudo abrir IndexedDB."));
  });
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaccion abortada."));
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB error."));
  });
}

export async function listNotes() {
  const db = await openDb();
  const tx = db.transaction(STORE_NOTES, "readonly");
  const store = tx.objectStore(STORE_NOTES);

  const req = store.getAll();
  const notes = await new Promise<NoteRecord[]>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as NoteRecord[]);
    req.onerror = () => reject(req.error ?? new Error("No se pudieron leer los apuntes."));
  });

  await txDone(tx);
  db.close();
  notes.sort((a, b) => b.createdAt - a.createdAt);
  return notes;
}

export async function putNote(note: NoteRecord) {
  const db = await openDb();
  const tx = db.transaction(STORE_NOTES, "readwrite");
  tx.objectStore(STORE_NOTES).put(note);
  await txDone(tx);
  db.close();
}

export async function deleteNote(noteId: string) {
  const db = await openDb();
  const tx = db.transaction(STORE_NOTES, "readwrite");
  tx.objectStore(STORE_NOTES).delete(noteId);
  await txDone(tx);
  db.close();
}

