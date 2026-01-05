/**
 * 配置存储服务
 * 使用 electron-store 进行本地持久化存储
 */

import Store from 'electron-store';
import { AppConfig, DEFAULT_CONFIG } from '../shared/types';

/**
 * 存储 schema 定义
 */
const schema = {
  enabled: {
    type: 'boolean' as const,
    default: DEFAULT_CONFIG.enabled,
  },
  duration: {
    type: 'number' as const,
    default: DEFAULT_CONFIG.duration,
    minimum: 0,
  },
  lastModified: {
    type: 'number' as const,
    default: DEFAULT_CONFIG.lastModified,
  },
};

/**
 * 配置存储实例
 */
class ConfigStore {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'config',
      schema,
      defaults: DEFAULT_CONFIG,
    });
  }

  /**
   * 获取完整配置
   */
  getConfig(): AppConfig {
    return {
      enabled: this.store.get('enabled'),
      duration: this.store.get('duration'),
      lastModified: this.store.get('lastModified'),
    };
  }

  /**
   * 更新配置
   */
  setConfig(config: Partial<AppConfig>): void {
    const updates = {
      ...config,
      lastModified: Date.now(),
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        this.store.set(key as keyof AppConfig, value);
      }
    });
  }

  /**
   * 获取单个配置项
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.store.get(key);
  }

  /**
   * 设置单个配置项
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.store.set(key, value);
    this.store.set('lastModified', Date.now());
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.store.clear();
  }

  /**
   * 获取存储文件路径
   */
  getPath(): string {
    return this.store.path;
  }
}

/**
 * 导出单例实例
 */
export const configStore = new ConfigStore();
