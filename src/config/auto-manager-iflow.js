import fs from 'fs-extra';
import BaseAutoManager from './base-auto-manager.js';
import configPaths from './paths-config.js';

/**
 * iFlow 自动模式管理器
 * 负责 iFlow 的自动模式开启和关闭
 * 通过修改 ~/.iflow/settings.json 文件实现
 */
class IflowAutoManager extends BaseAutoManager {
  constructor() {
    super({
      configDir: configPaths.iflowDir,
      configFile: configPaths.iflowConfig,
      displayName: 'iFlow'
    });

    this.autoCommand = 'cc iflow-auto'; // 自动模式使用的命令
  }

  /**
   * 检查自动模式状态
   * @returns {Promise<boolean>} true表示已开启，false表示未开启
   */
  async checkAutoModeStatus() {
    try {
      // 如果配置文件不存在，认为未开启
      if (!await fs.pathExists(this.configFile)) {
        return false;
      }

      // 读取配置文件内容
      const configContent = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(configContent);

      // 检查是否包含自动模式配置
      return config.autoMode === true || config.autoApproval === true;

    } catch (error) {
      // 发生错误时认为未开启
      return false;
    }
  }

  /**
   * 获取自动模式的配置说明
   * @returns {Array<string>} 配置说明数组
   */
  getAutoConfigDescription() {
    return [
      'iFlow 自动模式配置',
      `命令: ${this.autoCommand}`,
      '自动批准所有操作'
    ];
  }

  /**
   * 开启自动模式
   */
  async enableAutoMode() {
    // 确保iFlow配置目录存在
    await fs.ensureDir(this.configDir);

    // 添加自动模式配置
    await this.addAutoConfig();
  }

  /**
   * 关闭自动模式
   */
  async disableAutoMode() {
    // 移除自动模式配置
    await this.removeAutoConfig();
  }

  /**
   * 添加自动模式配置
   * @private
   */
  async addAutoConfig() {
    let config = {};

    // 读取现有配置
    if (await fs.pathExists(this.configFile)) {
      const configContent = await fs.readFile(this.configFile, 'utf8');
      config = JSON.parse(configContent);
    }

    // 添加自动模式配置
    config.autoMode = true;
    config.autoApproval = true;

    // 写入配置文件
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * 移除自动模式配置
   * @private
   */
  async removeAutoConfig() {
    if (!await fs.pathExists(this.configFile)) {
      return;
    }

    // 读取现有配置
    const configContent = await fs.readFile(this.configFile, 'utf8');
    const config = JSON.parse(configContent);

    // 移除自动模式配置
    delete config.autoMode;
    delete config.autoApproval;

    // 写入配置文件
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2), 'utf8');
  }
}

// 导出单例实例
export default new IflowAutoManager();