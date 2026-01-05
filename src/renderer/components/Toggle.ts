/**
 * Toggle 开关组件
 * 可复用的开关切换组件
 */

export interface ToggleOptions {
  /** 容器元素 */
  container: HTMLElement;
  /** 标签文本 */
  label: string;
  /** 初始值 */
  checked?: boolean;
  /** 是否使用小尺寸 */
  small?: boolean;
  /** 值变化回调 */
  onChange?: (checked: boolean) => void;
}

/**
 * Toggle 组件类
 */
export class Toggle {
  private container: HTMLElement;
  private input: HTMLInputElement;
  private onChange?: (checked: boolean) => void;

  constructor(options: ToggleOptions) {
    this.container = options.container;
    this.onChange = options.onChange;

    // 创建 DOM 结构
    const wrapper = document.createElement('div');
    wrapper.className = 'toggle-container';

    const labelSpan = document.createElement('span');
    labelSpan.className = 'toggle-label';
    labelSpan.textContent = options.label;

    const label = document.createElement('label');
    label.className = options.small ? 'toggle toggle-small' : 'toggle';

    this.input = document.createElement('input');
    this.input.type = 'checkbox';
    this.input.checked = options.checked ?? false;

    const slider = document.createElement('span');
    slider.className = 'toggle-slider';

    label.appendChild(this.input);
    label.appendChild(slider);

    wrapper.appendChild(labelSpan);
    wrapper.appendChild(label);

    this.container.appendChild(wrapper);

    // 绑定事件
    this.input.addEventListener('change', () => {
      this.onChange?.(this.input.checked);
    });
  }

  /**
   * 获取当前值
   */
  getValue(): boolean {
    return this.input.checked;
  }

  /**
   * 设置值
   */
  setValue(checked: boolean): void {
    this.input.checked = checked;
  }

  /**
   * 设置禁用状态
   */
  setDisabled(disabled: boolean): void {
    this.input.disabled = disabled;
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}

/**
 * 创建 Toggle 组件的工厂函数
 */
export function createToggle(options: ToggleOptions): Toggle {
  return new Toggle(options);
}
