import fs from 'fs-extra';
import BaseAutoManager from './base-auto-manager.js';
import configPaths from './paths-config.js';

/**
 * Codex 自动模式管理器
 * 负责 Codex 的自动模式开启和关闭
 * 通过修改 ~/.codex/config.toml 文件实现
 */
class CodexAutoManager extends BaseAutoManager {
  constructor() {
    super({
      configDir: configPaths.codexDir,
      configFile: configPaths.codexConfig,
      displayName: 'Codex'
    });
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
      const lines = configContent.split('\n');

      let hasApprovalPolicy = false;
      let hasSandboxMode = false;

      // 检查是否包含自动模式的两个配置
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === 'approval_policy = "never"') {
          hasApprovalPolicy = true;
        }
        if (trimmedLine === 'sandbox_mode = "danger-full-access"') {
          hasSandboxMode = true;
        }
      }

      // 两个配置都存在才认为自动模式已开启
      return hasApprovalPolicy && hasSandboxMode;

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
      'approval_policy = "never"',
      'sandbox_mode = "danger-full-access"'
    ];
  }

  /**
   * 开启自动模式
   */
  async enableAutoMode() {
    // 确保目录存在
    await fs.ensureDir(this.configDir);

    // 读取现有配置
    let existingConfig = '';
    if (await fs.pathExists(this.configFile)) {
      existingConfig = await fs.readFile(this.configFile, 'utf8');
    }

    // 生成新配置
    const newConfig = this.generateAutoConfig(existingConfig);

    // 写入配置文件
    await fs.writeFile(this.configFile, newConfig, 'utf8');
  }

  /**
   * 关闭自动模式
   */
  async disableAutoMode() {
    if (!await fs.pathExists(this.configFile)) {
      return;
    }

    // 读取现有配置
    const existingConfig = await fs.readFile(this.configFile, 'utf8');

    // 移除自动模式配置
    const newConfig = this.removeAutoConfig(existingConfig);

    // 写入配置文件
    await fs.writeFile(this.configFile, newConfig, 'utf8');
  }

  /**
   * 移除自动模式配置
   * @param {string} existingConfig 现有配置内容
   * @returns {string} 移除自动模式配置后的内容
   * @private
   */
  removeAutoConfig(existingConfig) {
    const lines = existingConfig.split('\n');
    const newConfig = [];

    // 过滤掉自动模式配置行
    for (const line of lines) {
      const trimmedLine = line.trim();

      // 跳过自动模式配置
      if (trimmedLine === 'approval_policy = "never"' ||
          trimmedLine === 'sandbox_mode = "danger-full-access"') {
        continue;
      }

      newConfig.push(line);
    }

    // 移除开头的空行
    while (newConfig.length > 0 && newConfig[0].trim() === '') {
      newConfig.shift();
    }

    return newConfig.join('\n').trim() + '\n';
  }

  /**
   * 生成自动模式配置
   * @param {string} existingConfig 现有配置内容
   * @returns {string} 新的配置内容
   * @private
   */
  generateAutoConfig(existingConfig) {
    const lines = existingConfig.split('\n');
    const newConfig = [];

    // 首先添加自动模式配置到最上方
    newConfig.push('approval_policy = "never"');
    newConfig.push('sandbox_mode = "danger-full-access"');
    newConfig.push('');

    // 处理现有配置，跳过重复的自动模式配置
    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('approval_policy =')) {
        continue; // 跳过，已在上方添加
      }

      if (trimmedLine.startsWith('sandbox_mode =')) {
        continue; // 跳过，已在上方添加
      }

      // 保留其他配置
      newConfig.push(line);
    }

    return newConfig.join('\n').trim() + '\n';
  }
}

// 导出单例实例
export default new CodexAutoManager();

