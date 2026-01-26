import { isDesktop } from './platform';

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

class BrowserStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}

interface TauriAPI {
  core: {
    invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
  };
}

function getTauriAPI(): TauriAPI | null {
  if (typeof window !== 'undefined' && window.__TAURI__ !== undefined) {
    const tauri = window.__TAURI__ as TauriAPI;
    if (tauri?.core?.invoke) {
      return tauri;
    }
  }
  return null;
}

class SecureStorageAdapter implements StorageAdapter {
  private async tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
    const tauri = getTauriAPI();
    if (tauri) {
      try {
        return await tauri.core.invoke<T>(cmd, args);
      } catch {
        return null;
      }
    }
    return null;
  }

  async get(key: string): Promise<string | null> {
    const result = await this.tauriInvoke<string>('get_secure_value', { key });
    if (result !== null) return result;
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    const result = await this.tauriInvoke<void>('set_secure_value', { key, value });
    if (result === undefined && typeof window !== 'undefined' && window.__TAURI__) return;
    localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    const result = await this.tauriInvoke<void>('remove_secure_value', { key });
    if (result === undefined && typeof window !== 'undefined' && window.__TAURI__) return;
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}

function createStorageAdapter(): StorageAdapter {
  if (isDesktop()) {
    return new SecureStorageAdapter();
  }
  return new BrowserStorageAdapter();
}

export const storage = createStorageAdapter();

export function useStorage() {
  return storage;
}
