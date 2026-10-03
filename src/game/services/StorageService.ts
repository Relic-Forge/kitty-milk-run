export class StorageService {
  static getString(key: string, fallback: string) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  static getOptionalString(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  static setString(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage is a convenience; callers keep in-memory state when persistence fails.
    }
  }

  static getNumber(key: string, fallback: number) {
    const value = Number.parseFloat(StorageService.getString(key, String(fallback)));
    return Number.isFinite(value) ? value : fallback;
  }

  static setNumber(key: string, value: number) {
    StorageService.setString(key, String(value));
  }

  static getJson<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return fallback;
      const parsed: unknown = JSON.parse(value);
      // Valid JSON can still have the wrong shape (for example null instead of
      // the shop's array). Reject it before callers enumerate or filter it.
      if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed as T : fallback;
      if (fallback !== null && typeof fallback === 'object') {
        return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as T : fallback;
      }
      return typeof parsed === typeof fallback ? parsed as T : fallback;
    } catch {
      return fallback;
    }
  }

  static setJson<T>(key: string, value: T) {
    StorageService.setString(key, JSON.stringify(value));
  }
}
