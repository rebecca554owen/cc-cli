const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const chalk = require('chalk');

/**
 * 配置管理器
 * 负责读取、写入和管理Claude API配置
 */
class ConfigManager {
  constructor() {
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.configPath = path.join(this.claudeDir, 'api_configs.json');
    this.settingsPath = path.join(this.claudeDir, 'settings.json');
    this.historyPath = path.join(os.homedir(), '.cc', 'history.json');
  }

  /**
   * 确保配置目录存在
   */
  async ensureConfigDir() {
    try {
      await fs.ensureDir(this.claudeDir);
      await fs.ensureDir(path.join(os.homedir(), '.cc'));
    } catch (error) {
      throw new Error(`创建配置目录失败: ${error.message}`);
    }
  }

  /**
   * 读取所有API配置
   * @returns {Object} 配置对象
   */
  async getAllConfigs() {
    try {
      await this.ensureConfigDir();
      
      if (!await fs.pathExists(this.configPath)) {
        throw new Error('API配置文件不存在，请检查 ~/.claude/api_configs.json');
      }

      const configContent = await fs.readFile(this.configPath, 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      if (error.message.includes('API配置文件不存在')) {
        throw error;
      }
      throw new Error(`读取配置文件失败: ${error.message}`);
    }
  }

  /**
   * 获取当前使用的配置
   * @returns {Object} 当前配置
   */
  async getCurrentConfig() {
    try {
      const allConfigs = await this.getAllConfigs();
      return allConfigs.currentConfig || null;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  读取当前配置失败:'), error.message);
      return null;
    }
  }

  /**
   * 保存当前配置
   * @param {Object} config 配置对象
   */
  async saveCurrentConfig(config) {
    try {
      await this.ensureConfigDir();

      const configToSave = {
        site: config.site,
        siteName: config.siteName,
        url: config.url,
        urlName: config.urlName,
        token: config.token,
        tokenName: config.tokenName,
        updatedAt: new Date().toISOString()
      };

      // 读取现有配置
      const allConfigs = await this.getAllConfigs();

      // 更新当前配置
      allConfigs.currentConfig = configToSave;

      // 保存到 api_configs.json
      await fs.writeFile(this.configPath, JSON.stringify(allConfigs, null, 2), 'utf8');

      // 保存到历史记录
      await this.saveToHistory(configToSave);

    } catch (error) {
      throw new Error(`保存当前配置失败: ${error.message}`);
    }
  }

  /**
   * 保存配置到历史记录
   * @param {Object} config 配置对象
   */
  async saveToHistory(config) {
    try {
      let history = [];
      
      if (await fs.pathExists(this.historyPath)) {
        const historyContent = await fs.readFile(this.historyPath, 'utf8');
        history = JSON.parse(historyContent);
      }

      // 添加到历史记录，保持最近10条
      history.unshift(config);
      history = history.slice(0, 10);

      await fs.writeFile(this.historyPath, JSON.stringify(history, null, 2), 'utf8');
    } catch (error) {
      console.warn(chalk.yellow('⚠️  保存历史记录失败:'), error.message);
    }
  }

  /**
   * 获取历史配置记录
   * @returns {Array} 历史配置数组
   */
  async getHistory() {
    try {
      if (!await fs.pathExists(this.historyPath)) {
        return [];
      }

      const historyContent = await fs.readFile(this.historyPath, 'utf8');
      return JSON.parse(historyContent);
    } catch (error) {
      console.warn(chalk.yellow('⚠️  读取历史记录失败:'), error.message);
      return [];
    }
  }

  /**
   * 读取settings.json配置
   * @returns {Object} settings配置对象
   */
  async getSettings() {
    try {
      if (!await fs.pathExists(this.settingsPath)) {
        return {};
      }
      const settingsContent = await fs.readFile(this.settingsPath, 'utf8');
      return JSON.parse(settingsContent);
    } catch (error) {
      console.warn(chalk.yellow('⚠️  读取settings.json失败:'), error.message);
      return {};
    }
  }

  /**
   * 保存settings.json配置
   * @param {Object} settings settings配置对象
   */
  async saveSettings(settings) {
    try {
      await this.ensureConfigDir();
      await fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`保存settings.json失败: ${error.message}`);
    }
  }

  /**
   * 深度合并对象
   * @param {Object} target 目标对象
   * @param {Object} source 源对象
   * @returns {Object} 合并后的对象
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * 切换API配置
   * @param {string} site 站点标识
   * @param {string} token Token值
   * @param {Object} siteConfig 站点配置对象
   */
  async switchConfig(site, token, siteConfig) {
    try {
      // 找到Token的名称
      const tokenName = Object.keys(siteConfig.config.env.ANTHROPIC_AUTH_TOKEN).find(key => siteConfig.config.env.ANTHROPIC_AUTH_TOKEN[key] === token);

      const config = {
        site,
        siteName: site,
        ANTHROPIC_BASE_URL: siteConfig.config.env.ANTHROPIC_BASE_URL,
        token,
        tokenName
      };

      await this.saveCurrentConfig(config);
      
      // 读取当前settings.json
      const currentSettings = await this.getSettings();
      
      // 准备合并的配置
      const configToMerge = { ...siteConfig.config };
      
      // 特殊处理：ANTHROPIC_AUTH_TOKEN使用选中的具体token值
      if (configToMerge.env && configToMerge.env.ANTHROPIC_AUTH_TOKEN) {
        configToMerge.env.ANTHROPIC_AUTH_TOKEN = token;
      }
      
      // 深度合并配置
      const mergedSettings = this.deepMerge(currentSettings, configToMerge);
      
      // 保存合并后的settings.json
      await this.saveSettings(mergedSettings);
      
      return config;
    } catch (error) {
      throw new Error(`切换配置失败: ${error.message}`);
    }
  }

  /**
   * 验证配置格式
   * @param {Object} config 配置对象
   * @returns {boolean} 是否有效
   */
  validateConfig(config) {
    if (!config || typeof config !== 'object') {
      return false;
    }

    if (!config.sites || typeof config.sites !== 'object') {
      return false;
    }

    for (const [siteKey, siteConfig] of Object.entries(config.sites)) {
      if (!siteConfig.url || !siteConfig.config) {
        return false;
      }

      if (!siteConfig.config.env || !siteConfig.config.env.ANTHROPIC_BASE_URL || !siteConfig.config.env.ANTHROPIC_AUTH_TOKEN) {
        return false;
      }

      if (typeof siteConfig.config.env.ANTHROPIC_BASE_URL !== 'string' || typeof siteConfig.config.env.ANTHROPIC_AUTH_TOKEN !== 'object') {
        return false;
      }

      if (Object.keys(siteConfig.config.env.ANTHROPIC_AUTH_TOKEN).length === 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查配置文件是否存在
   * @returns {boolean} 文件是否存在
   */
  async configExists() {
    return await fs.pathExists(this.configPath);
  }
}

module.exports = ConfigManager;