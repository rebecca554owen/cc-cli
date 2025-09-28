import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import chalk from 'chalk';

/**
 * 配置管理器
 * 负责读取、写入和管理Claude API配置
 */
class ConfigManager {
  constructor() {
    this.homeDir = os.homedir();
    this.claudeDir = path.join(this.homeDir, '.claude');
    this.ccCliDir = path.join(this.homeDir, '.cc-cli');
    this.settingsPath = path.join(this.claudeDir, 'settings.json');

    // 查找配置文件路径，优先使用 .cc-cli，兼容 .claude
    this.configPath = this.findConfigPath();
  }

  /**
   * 查找API配置文件路径
   * @returns {string} 配置文件路径
   */
  findConfigPath() {
    const possiblePaths = [
      path.join(this.ccCliDir, 'api_configs.json'),     // 首选：.cc-cli目录
      path.join(this.claudeDir, 'api_configs.json'),    // 兼容：.claude目录
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    // 如果都不存在，返回默认路径（.cc-cli目录）
    return path.join(this.ccCliDir, 'api_configs.json');
  }

  /**
   * 确保配置目录存在
   */
  async ensureConfigDir() {
    try {
      await fs.ensureDir(this.claudeDir);
      await fs.ensureDir(this.ccCliDir);
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
      const config = JSON.parse(configContent);

      // 支持claude别名：自动将claude字段映射为config字段
      if (config.sites) {
        for (const siteKey in config.sites) {
          const site = config.sites[siteKey];
          if (site.claude && !site.config) {
            site.config = site.claude;
          }
        }
      }

      return config;
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

    } catch (error) {
      throw new Error(`保存当前配置失败: ${error.message}`);
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
      const rawTokens = siteConfig.config.env.ANTHROPIC_AUTH_TOKEN;
      const tokens = typeof rawTokens === 'string' ? { '默认Token': rawTokens } : rawTokens;
      const tokenName = Object.keys(tokens).find(key => tokens[key] === token);

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
      if (!siteConfig.url || (!siteConfig.config && !siteConfig.claude)) {
        return false;
      }

      // 获取实际的配置对象（支持claude别名）
      const actualConfig = siteConfig.config || siteConfig.claude;

      if (!actualConfig.env || !actualConfig.env.ANTHROPIC_BASE_URL || !actualConfig.env.ANTHROPIC_AUTH_TOKEN) {
        return false;
      }

      if (typeof actualConfig.env.ANTHROPIC_BASE_URL !== 'string') {
        return false;
      }

      const authToken = actualConfig.env.ANTHROPIC_AUTH_TOKEN;
      if (typeof authToken === 'string') {
        if (!authToken.trim()) return false;
      } else if (typeof authToken === 'object' && authToken !== null) {
        if (Object.keys(authToken).length === 0) return false;
      } else {
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

export default ConfigManager;