import chalk from 'chalk';
import { waitForBackConfirm } from '../utils/ui.js';

/**
 * 自动模式管理器基类
 * 提供通用的自动模式管理逻辑
 * 子类只需实现具体的配置文件操作
 */
class BaseAutoManager {
  /**
   * 构造函数
   * @param {Object} config 配置对象
   * @param {string} config.configFile 配置文件路径
   * @param {string} config.configDir 配置目录路径
   * @param {string} config.displayName 显示名称 (如 "Claude Code", "Codex")
   */
  constructor(config) {
    this.configFile = config.configFile;
    this.configDir = config.configDir;
    this.displayName = config.displayName;
  }

  /**
   * 检查自动模式状态
   * 需要子类实现具体的检查逻辑
   * @returns {Promise<boolean>} true 表示已开启，false 表示未开启
   */
  async checkAutoModeStatus() {
    throw new Error('子类必须实现 checkAutoModeStatus() 方法');
  }

  /**
   * 开启自动模式
   * 需要子类实现具体的开启逻辑
   * @protected
   */
  async enableAutoMode() {
    throw new Error('子类必须实现 enableAutoMode() 方法');
  }

  /**
   * 关闭自动模式
   * 需要子类实现具体的关闭逻辑
   * @protected
   */
  async disableAutoMode() {
    throw new Error('子类必须实现 disableAutoMode() 方法');
  }

  /**
   * 获取自动模式的配置说明
   * 子类可以覆盖此方法提供自定义说明
   * @protected
   * @returns {Array<string>} 配置说明数组
   */
  getAutoConfigDescription() {
    return ['最宽松配置模式'];
  }

  /**
   * 切换自动模式（开启或关闭）
   * 统一的切换逻辑，由基类实现
   * @param {Object} options 选项
   * @param {boolean} [options.waitForConfirm=true] 是否等待用户确认
   * @returns {Promise<boolean>} 返回新的状态
   */
  async toggleAutoMode(options = { waitForConfirm: true }) {
    try {
      // 检查当前状态
      const currentStatus = await this.checkAutoModeStatus();

      if (currentStatus) {
        // 当前已开启，关闭自动模式
        await this.performDisable();
      } else {
        // 当前未开启，开启自动模式
        await this.performEnable();
      }

      console.log(chalk.gray(`配置文件: ${this.configFile}`));

      // 可选的用户确认
      if (options.waitForConfirm) {
        await waitForBackConfirm('自动模式操作完成');
      }

      return !currentStatus; // 返回新状态

    } catch (error) {
      console.error(chalk.red('❌ 操作自动模式失败:'), error.message);

      // 错误情况下也可选确认
      if (options.waitForConfirm) {
        await waitForBackConfirm('操作完成');
      }

      throw error;
    }
  }

  /**
   * 执行关闭操作（带提示信息）
   * @private
   */
  async performDisable() {
    console.log(chalk.yellow('\n🛑 关闭自动模式...'));

    const descriptions = this.getAutoConfigDescription();
    if (descriptions.length > 0) {
      console.log(chalk.gray('将移除以下配置：'));
      descriptions.forEach(desc => {
        console.log(chalk.gray(`  - ${desc}`));
      });
    }

    await this.disableAutoMode();

    console.log(chalk.green('✅ 自动模式已关闭！'));
    console.log(chalk.blue('ℹ️  已恢复为安全模式'));
  }

  /**
   * 执行开启操作（带提示信息）
   * @private
   */
  async performEnable() {
    console.log(chalk.yellow('\n🚀 开启自动模式...'));

    const descriptions = this.getAutoConfigDescription();
    if (descriptions.length > 0) {
      console.log(chalk.gray('将设置以下配置：'));
      descriptions.forEach(desc => {
        console.log(chalk.gray(`  - ${desc}`));
      });
    }

    await this.enableAutoMode();

    console.log(chalk.green('✅ 自动模式已开启！'));
    console.log(chalk.yellow('⚠️  警告：当前为最宽松模式，请谨慎使用'));
  }

  /**
   * 获取配置文件路径信息
   * @returns {Object} 配置文件路径信息
   */
  getConfigPaths() {
    return {
      configDir: this.configDir,
      configFile: this.configFile,
      displayName: this.displayName
    };
  }
}

export default BaseAutoManager;
