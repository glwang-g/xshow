export function useSafeLocalStorage() {
  function read(key: string) {
    if (typeof window === "undefined") return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  }

  function write(key: string, value: string) {
    if (typeof window === "undefined") return false;
    try { window.localStorage.setItem(key, value); return true; } catch { return false; }
  }

  function remove(key: string) {
    if (typeof window === "undefined") return;
    try { window.localStorage.removeItem(key); } catch { /* stale storage is best-effort */ }
  }

  return { read, remove, write };
}
