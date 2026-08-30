// lib/offline-cache.ts — Offline cache for conversations using IndexedDB
// Allows users to access recent conversations even without internet

const DB_NAME = "nyari_ide_offline";
const DB_VERSION = 1;
const STORE_NAME = "conversations";
const MAX_CACHED_CONVERSATIONS = 20;
const MAX_CACHED_MESSAGES_PER_CONVERSATION = 50;

interface CachedConversation {
  id: string;
  title: string;
  created_at: string;
  messages: Array<{
    id?: string;
    role: "user" | "assistant";
    content: string;
    image_url?: string | null;
    generated_image_url?: string | null;
    reaction?: "like" | "dislike" | null;
    created_at?: string;
  }>;
  cached_at: number;
}

/**
 * Open IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("cached_at", "cached_at", { unique: false });
      }
    };
  });
}

/**
 * Cache a conversation with its messages
 */
export async function cacheConversation(
  conversation: { id: string; title: string; created_at: string },
  messages: CachedConversation["messages"]
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const cached: CachedConversation = {
      id: conversation.id,
      title: conversation.title,
      created_at: conversation.created_at,
      messages: messages.slice(-MAX_CACHED_MESSAGES_PER_CONVERSATION),
      cached_at: Date.now(),
    };

    store.put(cached);

    // Limit total cached conversations
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > MAX_CACHED_CONVERSATIONS) {
        // Delete oldest cached conversations
        const index = store.index("cached_at");
        const cursorReq = index.openCursor();
        let deleteCount = countReq.result - MAX_CACHED_CONVERSATIONS;

        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor && deleteCount > 0) {
            cursor.delete();
            deleteCount--;
            cursor.continue();
          }
        };
      }
    };

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  } catch (err) {
    // Offline cache failed silently — non-critical
    console.error("Failed to cache conversation:", err);
  }
}

/**
 * Get a cached conversation by ID
 */
export async function getCachedConversation(
  conversationId: string
): Promise<CachedConversation | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(conversationId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Get all cached conversations (sorted by cached_at descending)
 */
export async function getAllCachedConversations(): Promise<CachedConversation[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("cached_at");

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, "prev");
      const results: CachedConversation[] = [];

      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Delete a cached conversation
 */
export async function deleteCachedConversation(
  conversationId: string
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(conversationId);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  } catch {
    // ignore
  }
}

/**
 * Clear all cached conversations
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  } catch {
    // ignore
  }
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Auto-cache current conversation when messages change
 */
export async function autoCacheConversation(
  conversation: { id: string; title: string; created_at: string } | null,
  messages: CachedConversation["messages"]
): Promise<void> {
  if (!conversation || messages.length === 0) return;
  if (!isOnline()) return; // Only cache when online

  await cacheConversation(conversation, messages);
}
