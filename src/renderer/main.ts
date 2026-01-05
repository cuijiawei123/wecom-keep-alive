/**
 * 渲染进程入口
 * 负责 UI 交互和状态同步
 */

import type { ElectronAPI } from '../preload/index';
import type { AppConfig, RuntimeState } from '../shared/types';

// 获取 Electron API
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const { electronAPI } = window;

// DOM 元素
const elements = {
  permissionWarning: document.getElementById('permission-warning') as HTMLDivElement,
  btnOpenSettings: document.getElementById('btn-open-settings') as HTMLButtonElement,
  toggleEnabled: document.getElementById('toggle-enabled') as HTMLInputElement,
  statusText: document.getElementById('status-text') as HTMLSpanElement,
  statusDot: document.getElementById('status-dot') as HTMLSpanElement,
  timeSection: document.getElementById('time-section') as HTMLElement,
  idleDisplay: document.getElementById('idle-display') as HTMLElement,
  remainingTime: document.getElementById('remaining-time') as HTMLSpanElement,
  countdownValue: document.getElementById('countdown-value') as HTMLSpanElement,
  durationSelector: document.getElementById('duration-selector') as HTMLDivElement,
  version: document.getElementById('version') as HTMLSpanElement,
};

// 倒计时更新定时器
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let currentState: RuntimeState | null = null;
let currentConfig: AppConfig | null = null;

/**
 * 初始化应用
 */
async function init(): Promise<void> {
  // 加载配置
  const config = await electronAPI.config.get();
  currentConfig = config;
  updateConfigUI(config);

  // 加载状态
  const state = await electronAPI.state.get();
  updateStateUI(state);

  // 加载版本号
  const version = await electronAPI.app.getVersion();
  elements.version.textContent = `v${version}`;

  // 检查权限
  const hasPermission = await electronAPI.permission.check();
  updatePermissionUI(hasPermission);

  // 注册事件监听
  registerEventListeners();

  // 启动倒计时更新
  startCountdownTimer();
}

/**
 * 更新配置 UI
 */
function updateConfigUI(config: AppConfig): void {
  elements.toggleEnabled.checked = config.enabled;

  // 更新时长选择按钮状态
  const buttons = elements.durationSelector.querySelectorAll('.chip');
  buttons.forEach((btn) => {
    const value = parseInt(btn.getAttribute('data-value') || '0', 10);
    if (value === config.duration) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * 更新状态 UI
 */
function updateStateUI(state: RuntimeState): void {
  currentState = state;

  // 更新开关状态
  elements.toggleEnabled.checked = state.isActive;

  // 更新状态文本和样式
  if (state.isActive) {
    elements.statusText.textContent = '保活运行中';
    elements.statusDot.classList.add('active');
    elements.timeSection.classList.remove('hidden');
    elements.idleDisplay.classList.add('hidden');
  } else {
    elements.statusText.textContent = '保活已停止';
    elements.statusDot.classList.remove('active');
    elements.timeSection.classList.add('hidden');
    elements.idleDisplay.classList.remove('hidden');
  }

  // 更新剩余时间
  updateRemainingTime(state.remainingTime);

  // 更新倒计时
  updateCountdown(state.countdown);

  // 更新权限状态
  updatePermissionUI(state.hasPermission);
}

/**
 * 更新权限 UI
 */
function updatePermissionUI(hasPermission: boolean): void {
  if (hasPermission) {
    elements.permissionWarning.classList.add('hidden');
  } else {
    elements.permissionWarning.classList.remove('hidden');
  }
}

/**
 * 格式化剩余时间
 */
function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '∞ Forever';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * 更新剩余时间显示
 */
function updateRemainingTime(seconds: number): void {
  elements.remainingTime.textContent = formatRemainingTime(seconds);
}

/**
 * 更新倒计时显示
 */
function updateCountdown(seconds: number): void {
  if (seconds > 0) {
    elements.countdownValue.textContent = String(seconds);
  } else {
    elements.countdownValue.textContent = '--';
  }
}

/**
 * 启动倒计时更新定时器
 */
function startCountdownTimer(): void {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  countdownTimer = setInterval(() => {
    if (currentState && currentState.isActive) {
      // 更新下次移动倒计时
      if (currentState.nextMoveAt > 0) {
        const remaining = Math.max(0, currentState.nextMoveAt - Date.now());
        const seconds = Math.ceil(remaining / 1000);
        updateCountdown(seconds);
      }

      // 更新剩余保活时间
      if (currentState.endAt > 0) {
        const remaining = Math.max(0, currentState.endAt - Date.now());
        const seconds = Math.ceil(remaining / 1000);
        updateRemainingTime(seconds);

        // 如果时间到了，更新状态
        if (seconds <= 0) {
          elements.toggleEnabled.checked = false;
          elements.statusText.textContent = '已停止';
          elements.statusText.classList.remove('active');
          elements.timeSection.classList.add('hidden');
        }
      } else {
        // 永久模式
        updateRemainingTime(0);
      }
    }
  }, 1000);
}

/**
 * 注册事件监听
 */
function registerEventListeners(): void {
  // 主开关
  elements.toggleEnabled.addEventListener('change', async () => {
    if (elements.toggleEnabled.checked) {
      await electronAPI.control.start();
    } else {
      await electronAPI.control.stop();
    }
  });

  // 打开系统设置
  elements.btnOpenSettings.addEventListener('click', async () => {
    await electronAPI.permission.openSettings();
  });

  // 时长选择按钮
  const durationButtons = elements.durationSelector.querySelectorAll('.chip');
  durationButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = parseInt(btn.getAttribute('data-value') || '60', 10);
      await electronAPI.config.set({ duration: value });

      // 更新按钮状态
      durationButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // 如果正在运行，重新启动以应用新时长
      if (currentState?.isActive) {
        await electronAPI.control.stop();
        await electronAPI.control.start();
      }
    });
  });

  // 监听配置变化
  electronAPI.config.onChange((config) => {
    currentConfig = config;
    updateConfigUI(config);
  });

  // 监听状态变化
  electronAPI.state.onChange((state) => {
    updateStateUI(state);
  });
}

// 启动应用
void init();
