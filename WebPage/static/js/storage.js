// storage.js
export const Storage = {
    get(key, def) {
      try {
        const v = JSON.parse(localStorage.getItem(key));
        return v !== null ? v : def;
      } catch {
        return def;
      }
    },
    set(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    },
    clearAll() {
      localStorage.clear();
    }
  };
  