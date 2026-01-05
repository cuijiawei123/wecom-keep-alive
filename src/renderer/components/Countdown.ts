/**
 * Countdown 倒计时显示组件
 * 显示距离下次鼠标移动的剩余时间
 */

export interface CountdownOptions {
  /** 容器元素 */
  container: HTMLElement;
  /** 标签文本 */
  label?: string;
  /** 单位文本 */
  unit?: string;
  /** 初始值（秒） */
  value?: number;
}

/**
 * Countdown 组件类
 */
export class Countdown {
  private container: HTMLElement;
  private valueElement: HTMLSpanElement;
  private currentValue: number = 0;

  constructor(options: CountdownOptions) {
    this.container = options.container;
    this.currentValue = options.value ?? 0;

    // 创建 DOM 结构
    const wrapper = document.createElement('div');
    wrapper.className = 'countdown-display';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'countdown-label';
    labelSpan.textContent = options.label ?? '距离下次活跃';

    this.valueElement = document.createElement('span');
    this.valueElement.className = 'countdown-value';
    this.valueElement.textContent = this.formatValue(this.currentValue);

    const unitSpan = document.createElement('span');
    unitSpan.className = 'countdown-unit';
    unitSpan.textContent = options.unit ?? '秒';

    wrapper.appendChild(labelSpan);
    wrapper.appendChild(this.valueElement);
    wrapper.appendChild(unitSpan);

    this.container.appendChild(wrapper);
  }

  /**
   * 格式化显示值
   */
  private formatValue(seconds: number): string {
    if (seconds <= 0) {
      return '--';
    }
    return String(seconds);
  }

  /**
   * 获取当前值
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * 设置值
   */
  setValue(seconds: number): void {
    this.currentValue = Math.max(0, Math.floor(seconds));
    this.valueElement.textContent = this.formatValue(this.currentValue);
  }

  /**
   * 递减值
   */
  decrement(): void {
    if (this.currentValue > 0) {
      this.currentValue--;
      this.valueElement.textContent = this.formatValue(this.currentValue);
    }
  }

  /**
   * 重置为初始状态
   */
  reset(): void {
    this.currentValue = 0;
    this.valueElement.textContent = '--';
  }

  /**
   * 设置高亮状态
   */
  setHighlight(highlight: boolean): void {
    if (highlight) {
      this.valueElement.style.color = 'var(--color-success)';
    } else {
      this.valueElement.style.color = '';
    }
  }

  /**
   * 格式化为 MM:SS 格式
   */
  static formatAsMinutesSeconds(seconds: number): string {
    if (seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}

/**
 * 创建 Countdown 组件的工厂函数
 */
export function createCountdown(options: CountdownOptions): Countdown {
  return new Countdown(options);
}
