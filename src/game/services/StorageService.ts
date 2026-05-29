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
      return value === null ? fallback : (JSON.parse(value) as T);
    } catch {
      return fallback;
    }
  }

  static setJson<T>(key: string, value: T) {
    StorageService.setString(key, JSON.stringify(value));
  }
}
