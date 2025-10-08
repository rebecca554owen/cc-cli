import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import toml from 'toml';
import configPaths from "../config/paths-config.js";

// 配置管理器
class ManagerConfig {
  constructor() {
    // 使用统一的路径管理器
    this.claudeDir = configPaths.claudeDir;
    this.ccCliDir = configPaths.ccCliDir;
    this.settingsPath = configPaths.claudeSettings;
    this.configPath = configPaths.apiConfigs;
    this.codexConfigPath = configPaths.codexConfig;
    this.codexAuthPath = configPaths.codexAuth;
    this.iflowDir = configPaths.iflowDir;
    this.iflowConfigPath = configPaths.iflowConfig;
    this.iflowAuthPath = configPaths.iflowAuth;
    this.backupsDir = configPaths.backupsDir;
  }

  /**
   * 确保配置目录存在
   */
  async ensureConfigDir() {
    try {
      await fs.ensureDir(this.claudeDir);
      await fs.ensureDir(this.ccCliDir);
      await fs.ensureDir(path.dirname(this.iflowConfigPath));
    } catch (error) {
      throw new Error(`创建配置目录失败: ${error.message}`);
    }
  }

  /**
   * 检测是否为首次使用
   * @returns {boolean} 是否为首次使用
   */
  async isFirstUse() {
    try {
      // 检查配置文件是否存在
      if (!await fs.pathExists(this.configPath)) {
        return true;
      }
      
      // 检查配置文件是否为空或无效
      const configContent = await fs.readFile(this.configPath, 'utf8');
      if (!configContent.trim()) {
        return true;
      }
      
      const config = JSON.parse(configContent);
      // 检查是否有有效的配置
      if (!config.sites || Object.keys(config.sites).length === 0) {
        return true;
      }
      
      return false;
    } catch (error) {
      // 如果配置文件解析失败，也认为是首次使用
      return true;
    }
  }

  /**
   * 自动读取并创建初始配置
   */
  async autoInitializeConfig() {
    try {
      console.log(chalk.cyan('🔍 检测到首次使用，正在自动读取现有配置...'));
      
      // 确保配置目录存在
      await this.ensureConfigDir();
      
      const initialConfig = {
        sites: {}
      };

      // 1. 尝试读取Claude配置
      if (await fs.pathExists(this.settingsPath)) {
        try {
          const claudeConfigContent = await fs.readFile(this.settingsPath, 'utf8');
          const claudeConfig = JSON.parse(claudeConfigContent);
          
          if (claudeConfig.env && claudeConfig.env.ANTHROPIC_BASE_URL) {
            initialConfig.sites['claude-auto'] = {
              description: '自动检测的Claude配置',
              baseUrl: claudeConfig.env.ANTHROPIC_BASE_URL,
              token: claudeConfig.env.ANTHROPIC_AUTH_TOKEN || '未设置',
              model: claudeConfig.env.ANTHROPIC_MODEL || '未设置',
              siteName: '自动检测的Claude配置',
              site: 'claude-auto'
            };
            console.log(chalk.green('✅ 已读取Claude配置'));
          }
        } catch (error) {
          console.warn(chalk.yellow('⚠️  读取Claude配置失败:'), error.message);
        }
      }

      // 2. 尝试读取Codex配置
      if (await fs.pathExists(this.codexConfigPath)) {
        try {
          const codexConfigContent = await fs.readFile(this.codexConfigPath, 'utf8');
          
          // 简单解析TOML格式
          const lines = codexConfigContent.split('\n');
          let model = '未设置';
          let baseUrl = '未设置';
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('model = ')) {
              model = trimmedLine.replace('model = ', '').replace(/"/g, '');
            } else if (trimmedLine.startsWith('base_url = ')) {
              baseUrl = trimmedLine.replace('base_url = ', '').replace(/"/g, '');
            }
          }
          
          if (baseUrl !== '未设置') {
            initialConfig.sites['codex-auto'] = {
              description: '自动检测的Codex配置',
              baseUrl: baseUrl,
              model: model,
              token: '从认证文件中读取',
              siteName: '自动检测的Codex配置',
              site: 'codex-auto'
            };
            console.log(chalk.green('✅ 已读取Codex配置'));
          }
        } catch (error) {
          console.warn(chalk.yellow('⚠️  读取Codex配置失败:'), error.message);
        }
      }

      // 3. 尝试读取iFlow配置
      const iflowSettingsPath = path.join(this.iflowDir, 'settings.json');
      if (await fs.pathExists(iflowSettingsPath)) {
        try {
          const iflowConfigContent = await fs.readFile(iflowSettingsPath, 'utf8');
          const iflowConfig = JSON.parse(iflowConfigContent);
          
          if (iflowConfig.baseUrl) {
            initialConfig.sites['iflow-auto'] = {
              description: '自动检测的iFlow配置',
              baseUrl: iflowConfig.baseUrl,
              model: iflowConfig.modelName || '自动从默认配置获取',
              token: iflowConfig.apiKey,
              siteName: '自动检测的iFlow配置',
              site: 'iflow-auto'
            };
            console.log(chalk.green('✅ 已读取iFlow配置'));
          }
        } catch (error) {
          console.warn(chalk.yellow('⚠️  读取iFlow配置失败:'), error.message);
        }
      }

      // 如果没有检测到任何配置，创建示例配置
      if (Object.keys(initialConfig.sites).length === 0) {
        console.log(chalk.yellow('⚠️  未检测到现有配置，创建示例配置'));
        
        // 创建完整的示例配置，包含所有三种服务
        initialConfig.sites['claude-example'] = {
          description: 'Claude示例配置',
          site: 'claude-example',
          siteName: 'Claude示例配置',
          baseUrl: 'https://api.anthropic.com',
          token: 'your-claude-token-here',
          model: 'claude-3-sonnet-20240229'
        };
        
        initialConfig.sites['codex-example'] = {
          description: 'Codex示例配置',
          site: 'codex-example',
          siteName: 'Codex示例配置',
          baseUrl: 'https://api.openai.com',
          token: 'your-codex-token-here',
          model: 'gpt-4'
        };
        
        initialConfig.sites['iflow-example'] = {
          description: 'iFlow示例配置',
          site: 'iflow-example',
          siteName: 'iFlow示例配置',
          baseUrl: 'https://api.iflow.com',
          token: 'your-iflow-token-here',
          model: 'gpt-3.5-turbo'
        };
      }

      // 保存配置
      await fs.writeFile(
        this.configPath,
        JSON.stringify(initialConfig, null, 2),
        'utf8'
      );

      console.log(chalk.green('🎉 初始配置已创建！'));
      console.log(chalk.cyan(`📁 配置文件位置: ${this.configPath}`));
      console.log(chalk.gray('💡 使用 cc api --list 查看所有配置'));
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 自动初始化配置失败:'), error.message);
      return false;
    }
  }

  /**
   * 读取所有API配置
   * @returns {Object} 配置对象
   */
  async getAllConfigs() {
    try {
      await this.ensureConfigDir();

      if (!(await fs.pathExists(this.configPath))) {
        throw new Error("API配置文件不存在，请检查 ~/.cc-cli/api_configs.json");
      }

      const configContent = await fs.readFile(this.configPath, "utf8");
      const config = JSON.parse(configContent);

      return config;
    } catch (error) {
      // 如果是文件不存在的错误，直接抛出
      if (error.message.includes("API配置文件不存在")) {
        throw error;
      }

      // 如果是JSON解析错误或其他读取错误，提示用户恢复备份
      console.error(chalk.red("\n❌ 配置文件读取失败！"));
      console.error(chalk.yellow(`错误信息: ${error.message}`));

      // 检查是否有可用的备份
      const backups = await this.getBackupsList();

      if (backups.length > 0) {
        console.log(chalk.cyan(`\n💡 检测到 ${backups.length} 个备份文件，您可以尝试恢复`));

        const inquirer = (await import('inquirer')).default;
        const { shouldRestore } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldRestore',
            message: '是否要从备份恢复配置文件？',
            default: true
          }
        ]);

        if (shouldRestore) {
          const restored = await this.interactiveRestoreBackup();
          if (restored) {
            // 恢复成功后重新读取配置
            const configContent = await fs.readFile(this.configPath, "utf8");
            const config = JSON.parse(configContent);
            return config;
          }
        }
      } else {
        console.log(chalk.yellow("\n⚠️  没有找到可用的备份文件"));
        console.log(chalk.gray("提示: 您可以手动修复配置文件或删除后重新创建"));
      }

      throw new Error(`读取配置文件失败: ${error.message}`);
    }
  }

  /**
   * 获取Claude配置
   * @returns {Object} Claude配置
   */
  async getClaudeConfig() {
    try {
      const claudeConfigPath = this.settingsPath;
      
      // 检查 Claude 配置文件是否存在
      if (!await fs.pathExists(claudeConfigPath)) {
        return null;
      }
      
      // 读取 Claude 配置文件
      const claudeConfigContent = await fs.readFile(claudeConfigPath, 'utf8');
      const claudeConfig = JSON.parse(claudeConfigContent);
      
      return claudeConfig;
    } catch (error) {
      console.warn(chalk.yellow("⚠️  读取Claude配置失败:"), error.message);
      return null;
    }
  }

  /**
   * 获取Codex配置
   * @returns {Object} Codex配置
   */
  async getCodexConfig() {
    try {
      const codexConfigPath = this.codexConfigPath;
      
      // 检查 Codex 配置文件是否存在
      if (!await fs.pathExists(codexConfigPath)) {
        return null;
      }
      
      // 读取 Codex 配置文件（TOML 格式）
      const codexConfigContent = await fs.readFile(codexConfigPath, 'utf8');
      
      return {
        content: codexConfigContent,
        path: codexConfigPath
      };
    } catch (error) {
      console.warn(chalk.yellow("⚠️  读取Codex配置失败:"), error.message);
      return null;
    }
  }

  /**
   * 获取iFlow配置
   * @returns {Object} iFlow配置
   */
  async getIflowConfig() {
    try {
      const iflowSettingsPath = path.join(this.iflowDir, 'settings.json');
      
      // 检查 iFlow 配置文件是否存在
      if (!await fs.pathExists(iflowSettingsPath)) {
        return null;
      }
      
      // 读取 iFlow 配置文件（JSON 格式）
      const iflowConfigContent = await fs.readFile(iflowSettingsPath, 'utf8');
      const iflowConfig = JSON.parse(iflowConfigContent);
      
      return iflowConfig;
    } catch (error) {
      console.warn(chalk.yellow("⚠️  读取iFlow配置失败:"), error.message);
      return null;
    }
  }

  /**
   * 同步所有服务配置到API配置文件中
   * 在每次启动时检查并读取各服务配置，确保三者都能正确同步
   * @returns {boolean} 是否成功同步
   */
  async syncAllServiceConfigs() {
    try {
      console.log(chalk.cyan('🔍 正在同步所有服务配置...'));
      
      // 确保配置目录存在
      await this.ensureConfigDir();

      // 读取当前的API配置
      let currentConfig = {
        sites: {},
        currentConfig: null,
        currentCodexConfig: null,
        currentIflowConfig: null
      };

      if (await fs.pathExists(this.configPath)) {
        try {
          const configContent = await fs.readFile(this.configPath, 'utf8');
          currentConfig = JSON.parse(configContent);
        } catch (error) {
          console.warn(chalk.yellow('⚠️  读取现有配置文件失败，将创建新配置:'), error.message);
        }
      }

      let updated = false;

      // 1. 同步Claude配置
      if (await this.syncClaudeConfig(currentConfig)) {
        updated = true;
      }

      // 2. 同步Codex配置
      if (await this.syncCodexConfig(currentConfig)) {
        updated = true;
      }

      // 3. 同步iFlow配置
      if (await this.syncIflowConfig(currentConfig)) {
        updated = true;
      }

      if (updated) {
        // 保存更新后的配置
        await fs.writeFile(
          this.configPath,
          JSON.stringify(currentConfig, null, 2),
          'utf8'
        );
        console.log(chalk.green('✅ 所有服务配置同步完成'));
      } else {
        console.log(chalk.gray('ℹ️  所有配置已是最新，无需同步'));
      }

      return updated;
    } catch (error) {
      console.error(chalk.red('❌ 同步服务配置失败:'), error.message);
      return false;
    }
  }

  /**
   * 同步Claude配置
   */
  async syncClaudeConfig(currentConfig) {
    try {
      if (!await fs.pathExists(this.settingsPath)) {
        console.log(chalk.gray('ℹ️  Claude配置文件不存在，跳过同步'));
        return false;
      }

      const claudeConfigContent = await fs.readFile(this.settingsPath, 'utf8');
      const claudeConfig = JSON.parse(claudeConfigContent);

      if (!claudeConfig.env || !claudeConfig.env.ANTHROPIC_BASE_URL) {
        console.warn(chalk.yellow('⚠️  Claude配置缺少必要字段，跳过同步'));
        return false;
      }

      // 查找是否已存在相同URL的Claude配置
      const existingClaudeConfig = Object.entries(currentConfig.sites).find(([_, siteConfig]) => 
        siteConfig.claude && siteConfig.claude.env?.ANTHROPIC_BASE_URL === claudeConfig.env.ANTHROPIC_BASE_URL
      );

      if (existingClaudeConfig) {
        console.log(chalk.gray(`ℹ️  已存在相同URL的Claude配置: ${existingClaudeConfig[0]}`));
        return false;
      }

      // 添加Claude配置
      currentConfig.sites['claude-auto'] = {
        description: '自动检测的Claude配置',
        url: claudeConfig.env.ANTHROPIC_BASE_URL,
        claude: {
          env: {
            ANTHROPIC_BASE_URL: claudeConfig.env.ANTHROPIC_BASE_URL,
            ANTHROPIC_AUTH_TOKEN: claudeConfig.env.ANTHROPIC_AUTH_TOKEN || '未设置',
            ANTHROPIC_MODEL: claudeConfig.env.ANTHROPIC_MODEL || '未设置'
          }
        }
      };

      console.log(chalk.green('✅ 已同步Claude配置'));
      return true;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  同步Claude配置失败:'), error.message);
      return false;
    }
  }

  /**
   * 同步Codex配置
   */
  async syncCodexConfig(currentConfig) {
    try {
      if (!await fs.pathExists(this.codexConfigPath)) {
        console.log(chalk.gray('ℹ️  Codex配置文件不存在，跳过同步'));
        return false;
      }

      const codexConfigContent = await fs.readFile(this.codexConfigPath, 'utf8');
      
      // 简单解析TOML格式
      const lines = codexConfigContent.split('\n');
      let model = '未设置';
      let baseUrl = '未设置';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('model = ')) {
          model = trimmedLine.replace('model = ', '').replace(/"/g, '');
        } else if (trimmedLine.startsWith('base_url = ')) {
          baseUrl = trimmedLine.replace('base_url = ', '').replace(/"/g, '');
        }
      }
      
      if (baseUrl === '未设置') {
        console.warn(chalk.yellow('⚠️  Codex配置缺少base_url，跳过同步'));
        return false;
      }

      // 查找是否已存在相同URL的Codex配置
      const existingCodexConfig = Object.entries(currentConfig.sites).find(([_, siteConfig]) => 
        siteConfig.codex && siteConfig.codex.baseUrl === baseUrl
      );

      if (existingCodexConfig) {
        console.log(chalk.gray(`ℹ️  已存在相同URL的Codex配置: ${existingCodexConfig[0]}`));
        return false;
      }

      // 添加Codex配置
      currentConfig.sites['codex-auto'] = {
        description: '自动检测的Codex配置',
        url: baseUrl,
        codex: {
          model: model,
          baseUrl: baseUrl,
          apiKey: '从认证文件中读取'
        }
      };

      console.log(chalk.green('✅ 已同步Codex配置'));
      return true;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  同步Codex配置失败:'), error.message);
      return false;
    }
  }

  /**
   * 同步iFlow配置（改进版）
   */
  async syncIflowConfig(currentConfig) {
    try {
      // 检查iFlow配置文件是否存在（使用settings.json）
      const iflowSettingsPath = path.join(this.iflowDir, 'settings.json');
      if (!await fs.pathExists(iflowSettingsPath)) {
        console.log(chalk.gray('ℹ️  iFlow配置文件不存在，跳过同步'));
        return false;
      }

      // 读取iFlow配置
      const iflowConfigContent = await fs.readFile(iflowSettingsPath, 'utf8');
      const iflowConfig = JSON.parse(iflowConfigContent);

      if (!iflowConfig.baseUrl) {
        console.warn(chalk.yellow('⚠️  iFlow配置缺少baseUrl，跳过同步'));
        return false;
      }

      // 查找是否已存在相同URL的iFlow配置
      const existingIflowConfig = Object.entries(currentConfig.sites).find(([_, siteConfig]) => 
        siteConfig.iflow && siteConfig.iflow.baseUrl === iflowConfig.baseUrl
      );

      if (existingIflowConfig) {
        console.log(chalk.gray(`ℹ️  已存在相同URL的iFlow配置: ${existingIflowConfig[0]}`));
        return false;
      }

      // 添加iFlow配置
      currentConfig.sites['iflow-auto'] = {
        description: '自动检测的iFlow配置',
        url: iflowConfig.baseUrl,
        iflow: {
          providerName: '自动从默认配置获取',
          baseUrl: iflowConfig.baseUrl,
          model: iflowConfig.modelName || iflowConfig.model || '自动从默认配置获取',
          apiKey: iflowConfig.apiKey || '自动从默认配置获取'
        }
      };

      console.log(chalk.green('✅ 已同步iFlow配置'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 同步iFlow配置失败:'), error.message);
      return false;
    }
  }

  /**
   * 保存当前配置
   * @param {Object} config 配置对象
   */
  async saveCurrentConfig(config) {
    try {
      await this.ensureConfigDir();

      // 统一配置字段结构，移除无用字段
      const configToSave = {
        site: config.site,
        siteName: config.siteName,
        token: config.token,
        updatedAt: new Date().toISOString(),
      };

      // 读取现有配置
      const allConfigs = await this.getAllConfigs();

      // 更新当前配置
      allConfigs.currentConfig = configToSave;

      // 保存到 api_configs.json
      await fs.writeFile(
        this.configPath,
        JSON.stringify(allConfigs, null, 2),
        "utf8"
      );
    } catch (error) {
      throw new Error(`保存当前配置失败: ${error.message}`);
    }
  }

  /**
   * 保存当前Codex配置
   * @param {Object} config Codex配置对象
   */
  async saveCurrentCodexConfig(config) {
    try {
      await this.ensureConfigDir();

      // 统一配置字段结构，移除冗余字段
      const configToSave = {
        site: config.site,
        siteName: config.siteName,
        model: config.model,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        updatedAt: new Date().toISOString(),
      };

      // 读取现有配置
      const allConfigs = await this.getAllConfigs();

      // 更新当前Codex配置
      allConfigs.currentCodexConfig = configToSave;

      // 保存到 api_configs.json
      await fs.writeFile(
        this.configPath,
        JSON.stringify(allConfigs, null, 2),
        "utf8"
      );
    } catch (error) {
      throw new Error(`保存当前Codex配置失败: ${error.message}`);
    }
  }



  /**
   * 保存当前iFlow配置
   * @param {Object} config iFlow配置对象
   */
  async saveCurrentIflowConfig(config) {
    try {
      await this.ensureConfigDir();

      // 统一配置字段结构，移除冗余字段
      const configToSave = {
        site: config.site,
        siteName: config.siteName,
        model: config.model,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        updatedAt: new Date().toISOString(),
      };

      // 读取现有配置
      const allConfigs = await this.getAllConfigs();

      // 更新当前iFlow配置
      allConfigs.currentIflowConfig = configToSave;

      // 保存到 api_configs.json
      await fs.writeFile(
        this.configPath,
        JSON.stringify(allConfigs, null, 2),
        "utf8"
      );
    } catch (error) {
      throw new Error(`保存当前iFlow配置失败: ${error.message}`);
    }
  }

  /**
   * 读取settings.json配置
   * @returns {Object} settings配置对象
   */
  async getSettings() {
    try {
      if (!(await fs.pathExists(this.settingsPath))) {
        return {};
      }
      const settingsContent = await fs.readFile(this.settingsPath, "utf8");
      return JSON.parse(settingsContent);
    } catch (error) {
      console.warn(chalk.yellow("⚠️  读取settings.json失败:"), error.message);
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
      await fs.writeFile(
        this.settingsPath,
        JSON.stringify(settings, null, 2),
        "utf8"
      );
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
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
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
      // 获取Claude配置
      const claudeConfig = siteConfig.claude;

      // 找到Token的名称
      const rawTokens = claudeConfig.env.ANTHROPIC_AUTH_TOKEN;
      const tokens =
        typeof rawTokens === "string" ? { 默认Token: rawTokens } : rawTokens;
      const tokenName = Object.keys(tokens).find(
        (key) => tokens[key] === token
      );

      const config = {
        site,
        siteName: site,
        ANTHROPIC_BASE_URL: claudeConfig.env.ANTHROPIC_BASE_URL,
        token,
        tokenName,
      };

      await this.saveCurrentConfig(config);

      // 读取当前settings.json
      const currentSettings = await this.getSettings();

      // 需要删除重置的配置项
      if (currentSettings.env) {
        delete currentSettings.env.ANTHROPIC_AUTH_TOKEN;
        delete currentSettings.env.ANTHROPIC_AUTH_KEY;
        delete currentSettings.env.ANTHROPIC_API_KEY;
      }
      // 重置模型配置
      delete currentSettings.model;

      // 准备合并的配置
      const configToMerge = { ...claudeConfig };

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
  validateConfigStructure(config) {
    if (!config || typeof config !== "object") {
      return false;
    }

    if (!config.sites || typeof config.sites !== "object") {
      return false;
    }

    for (const [siteKey, siteConfig] of Object.entries(config.sites)) {
      // siteKey是必要的标识符，但siteConfig.url对于Claude配置可能是可选的
      // 因为ANTHROPIC_BASE_URL可以直接在claude配置中指定

      // 检查是否有Claude配置
      if (!siteConfig.claude) {
        return false;
      }

      const actualConfig = siteConfig.claude;

      if (
        !actualConfig.env ||
        !actualConfig.env.ANTHROPIC_BASE_URL ||
        !actualConfig.env.ANTHROPIC_AUTH_TOKEN
      ) {
        return false;
      }

      if (typeof actualConfig.env.ANTHROPIC_BASE_URL !== "string") {
        return false;
      }

      const authToken = actualConfig.env.ANTHROPIC_AUTH_TOKEN;
      if (typeof authToken === "string") {
        if (!authToken.trim()) return false;
      } else if (typeof authToken === "object" && authToken !== null) {
        if (Object.keys(authToken).length === 0) return false;
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证包含Claude配置的所有站点
   * @param {Object} config 配置对象
   * @returns {boolean} 是否至少有一个有效的Claude配置
   */
  validateClaudeConfig(config) {
    if (!config || typeof config !== "object") {
      return false;
    }

    if (!config.sites || typeof config.sites !== "object") {
      return false;
    }

    // 检查是否至少有一个站点包含有效的Claude配置
    for (const [siteKey, siteConfig] of Object.entries(config.sites)) {
      if (siteConfig.claude) {
        const claudeConfig = siteConfig.claude;
        if (
          claudeConfig.env &&
          claudeConfig.env.ANTHROPIC_BASE_URL &&
          claudeConfig.env.ANTHROPIC_AUTH_TOKEN
        ) {
          return true; // 至少有一个有效的Claude配置
        }
      }
    }

    return false; // 没有找到有效的Claude配置
  }

  /**
   * 验证包含Codex配置的所有站点
   * @param {Object} config 配置对象
   * @returns {boolean} 是否至少有一个有效的Codex配置
   */
  validateCodexConfig(config) {
    if (!config || typeof config !== "object") {
      return false;
    }

    if (!config.sites || typeof config.sites !== "object") {
      return false;
    }

    // 检查是否至少有一个站点包含有效的Codex配置
    for (const [siteKey, siteConfig] of Object.entries(config.sites)) {
      if (siteConfig.codex) {
        // Codex配置至少需要模型和API Key，siteKey是必要的标识符
        const codexConfig = siteConfig.codex;
        if (
          codexConfig.model &&
          codexConfig.OPENAI_API_KEY
        ) {
          // site字段始终是必需的，因为它是配置的键名
          // url字段对于Codex配置不是必需的，因为可能有独立的base_url
          return true; // 至少有一个有效的Codex配置
        }
      }
    }

    return false; // 没有找到有效的Codex配置
  }

  /**
   * 验证包含iFlow配置的所有站点
   * @param {Object} config 配置对象
   * @returns {boolean} 是否至少有一个有效的iFlow配置
   */
  validateIflowConfig(config) {
    if (!config || typeof config !== "object") {
      return false;
    }

    if (!config.sites || typeof config.sites !== "object") {
      return false;
    }

    // 检查是否至少有一个站点包含有效的iFlow配置
    for (const [siteKey, siteConfig] of Object.entries(config.sites)) {
      if (siteConfig.iflow) {
        // iFlow配置至少需要baseUrl，apiKey和model可选
        const iflowConfig = siteConfig.iflow;
        if (
          iflowConfig.baseUrl
        ) {
          // site字段始终是必需的，因为它是配置的键名
          // baseUrl字段对于iFlow配置是必需的
          return true; // 至少有一个有效的iFlow配置
        }
      }
    }

    return false; // 没有找到有效的iFlow配置
  }



  /**
   * 检查配置文件是否存在
   * @returns {boolean} 文件是否存在
   */
  async configExists() {
    return await fs.pathExists(this.configPath);
  }

  /**
   * 从站点配置中获取Claude配置
   * @param {Object} siteConfig 站点配置对象
   * @returns {Object} Claude配置对象
   */
  getSiteClaudeConfig(siteConfig) {
    if (siteConfig.claude) {
      return siteConfig.claude;
    }

    throw new Error("站点配置缺少claude字段");
  }

  /**
   * 创建配置文件备份
   * @returns {string} 备份文件路径
   */
  async createBackup() {
    try {
      // 确保备份目录存在
      await fs.ensureDir(this.backupsDir);

      // 检查配置文件是否存在
      if (!(await fs.pathExists(this.configPath))) {
        throw new Error("配置文件不存在，无法创建备份");
      }

      // 生成备份文件名（使用时间戳）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
      const backupFileName = `api_configs_${timestamp}.json`;
      const backupPath = path.join(this.backupsDir, backupFileName);

      // 复制配置文件到备份目录
      await fs.copy(this.configPath, backupPath);

      // 清理旧备份（只保留最新的5个）
      await this.cleanOldBackups();

      return backupPath;
    } catch (error) {
      throw new Error(`创建备份失败: ${error.message}`);
    }
  }

  /**
   * 创建完整备份（包括所有配置文件和目录）
   * @param {Object} options 备份选项
   * @returns {Object} 备份结果信息
   */
  async createFullBackup(options = {}) {
    const {
      includeCcCli = true,
      includeClaudeCode = true,
      includeCodex = true
    } = options;

    try {
      // 确保备份目录存在
      await fs.ensureDir(this.backupsDir);

      // 生成时间戳
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
      const backupDir = path.join(this.backupsDir, `full_backup_${timestamp}`);
      await fs.ensureDir(backupDir);

      const backupResults = {
        timestamp,
        backupDir,
        files: []
      };

      // 备份 CC-CLI 配置
      if (includeCcCli && await fs.pathExists(this.configPath)) {
        const ccCliBackupDir = path.join(backupDir, 'cc-cli');
        await fs.ensureDir(ccCliBackupDir);
        await fs.copy(this.configPath, path.join(ccCliBackupDir, 'api_configs.json'));
        backupResults.files.push('CC-CLI: api_configs.json');
      }

      // 备份 Claude Code 配置
      if (includeClaudeCode) {
        const claudeBackupDir = path.join(backupDir, 'claude');
        await fs.ensureDir(claudeBackupDir);

        // settings.json
        if (await fs.pathExists(this.settingsPath)) {
          await fs.copy(this.settingsPath, path.join(claudeBackupDir, 'settings.json'));
          backupResults.files.push('Claude: settings.json');
        }

        // CLAUDE.md
        const claudeMdPath = path.join(this.claudeDir, 'CLAUDE.md');
        if (await fs.pathExists(claudeMdPath)) {
          await fs.copy(claudeMdPath, path.join(claudeBackupDir, 'CLAUDE.md'));
          backupResults.files.push('Claude: CLAUDE.md');
        }

        // agents/ 目录
        const agentsDir = path.join(this.claudeDir, 'agents');
        if (await fs.pathExists(agentsDir)) {
          await fs.copy(agentsDir, path.join(claudeBackupDir, 'agents'));
          backupResults.files.push('Claude: agents/');
        }

        // commands/ 目录
        const commandsDir = path.join(this.claudeDir, 'commands');
        if (await fs.pathExists(commandsDir)) {
          await fs.copy(commandsDir, path.join(claudeBackupDir, 'commands'));
          backupResults.files.push('Claude: commands/');
        }
      }

      // 备份 Codex 配置
      if (includeCodex) {
        const codexBackupDir = path.join(backupDir, 'codex');
        await fs.ensureDir(codexBackupDir);

        // config.toml
        const codexConfigPath = path.join(this.homeDir, '.codex', 'config.toml');
        if (await fs.pathExists(codexConfigPath)) {
          await fs.copy(codexConfigPath, path.join(codexBackupDir, 'config.toml'));
          backupResults.files.push('Codex: config.toml');
        }

        // auth.json
        const codexAuthPath = path.join(this.homeDir, '.codex', 'auth.json');
        if (await fs.pathExists(codexAuthPath)) {
          await fs.copy(codexAuthPath, path.join(codexBackupDir, 'auth.json'));
          backupResults.files.push('Codex: auth.json');
        }

        // AGENTS.md
        const agentsMdPath = path.join(this.homeDir, '.codex', 'AGENTS.md');
        if (await fs.pathExists(agentsMdPath)) {
          await fs.copy(agentsMdPath, path.join(codexBackupDir, 'AGENTS.md'));
          backupResults.files.push('Codex: AGENTS.md');
        }
      }

      // 清理旧的完整备份（只保留最新的3个）
      await this.cleanOldFullBackups();

      return backupResults;
    } catch (error) {
      throw new Error(`创建完整备份失败: ${error.message}`);
    }
  }

  /**
   * 获取用户主目录
   */
  get homeDir() {
    return configPaths.homeDir;
  }

  /**
   * 清理旧备份文件，只保留最新的5个
   */
  async cleanOldBackups() {
    try {
      // 确保备份目录存在
      if (!(await fs.pathExists(this.backupsDir))) {
        return;
      }

      // 读取备份目录中的所有文件
      const files = await fs.readdir(this.backupsDir);

      // 过滤出备份文件（以api_configs_开头，.json结尾）
      const backupFiles = files.filter(file =>
        file.startsWith('api_configs_') && file.endsWith('.json')
      );

      // 如果备份文件数量小于等于5，不需要清理
      if (backupFiles.length <= 5) {
        return;
      }

      // 获取文件的完整路径和修改时间
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.backupsDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            mtime: stats.mtime
          };
        })
      );

      // 按修改时间降序排序（最新的在前面）
      filesWithStats.sort((a, b) => b.mtime - a.mtime);

      // 删除最新5个之外的所有备份
      const filesToDelete = filesWithStats.slice(5);
      for (const file of filesToDelete) {
        await fs.remove(file.path);
      }

    } catch (error) {
      console.warn(chalk.yellow("⚠️  清理旧备份失败:"), error.message);
    }
  }

  /**
   * 清理旧的完整备份，只保留最新的3个
   */
  async cleanOldFullBackups() {
    try {
      // 确保备份目录存在
      if (!(await fs.pathExists(this.backupsDir))) {
        return;
      }

      // 读取备份目录中的所有条目
      const entries = await fs.readdir(this.backupsDir, { withFileTypes: true });

      // 过滤出完整备份目录
      const fullBackupDirs = entries.filter(entry =>
        entry.isDirectory() && entry.name.startsWith('full_backup_')
      );

      // 如果备份目录数量小于等于3，不需要清理
      if (fullBackupDirs.length <= 3) {
        return;
      }

      // 获取目录的完整路径和修改时间
      const dirsWithStats = await Promise.all(
        fullBackupDirs.map(async (dir) => {
          const dirPath = path.join(this.backupsDir, dir.name);
          const stats = await fs.stat(dirPath);
          return {
            name: dir.name,
            path: dirPath,
            mtime: stats.mtime
          };
        })
      );

      // 按修改时间降序排序（最新的在前面）
      dirsWithStats.sort((a, b) => b.mtime - a.mtime);

      // 删除最新3个之外的所有备份
      const dirsToDelete = dirsWithStats.slice(3);
      for (const dir of dirsToDelete) {
        await fs.remove(dir.path);
      }

    } catch (error) {
      console.warn(chalk.yellow("⚠️  清理旧完整备份失败:"), error.message);
    }
  }

  /**
   * 获取所有备份文件列表
   * @returns {Array<Object>} 备份文件列表
   */
  async getBackupsList() {
    try {
      // 确保备份目录存在
      if (!(await fs.pathExists(this.backupsDir))) {
        return [];
      }

      // 读取备份目录中的所有文件
      const files = await fs.readdir(this.backupsDir);

      // 过滤出备份文件
      const backupFiles = files.filter(file =>
        file.startsWith('api_configs_') && file.endsWith('.json')
      );

      // 获取文件的完整信息
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => {
          const filePath = path.join(this.backupsDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            mtime: stats.mtime
          };
        })
      );

      // 按修改时间降序排序
      filesWithStats.sort((a, b) => b.mtime - a.mtime);

      return filesWithStats;
    } catch (error) {
      console.warn(chalk.yellow("⚠️  获取备份列表失败:"), error.message);
      return [];
    }
  }

  /**
   * 从备份恢复配置文件
   * @param {string} backupPath 备份文件路径
   */
  async restoreFromBackup(backupPath) {
    try {
      // 检查备份文件是否存在
      if (!(await fs.pathExists(backupPath))) {
        throw new Error("备份文件不存在");
      }

      // 读取备份文件内容并验证JSON格式
      const backupContent = await fs.readFile(backupPath, "utf8");
      JSON.parse(backupContent); // 验证是否是有效的JSON

      // 如果当前配置文件存在，先备份一下（以防万一）
      if (await fs.pathExists(this.configPath)) {
        const brokenBackupPath = path.join(
          this.backupsDir,
          `broken_config_${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0]}.json`
        );
        await fs.copy(this.configPath, brokenBackupPath);
      }

      // 恢复配置文件
      await fs.copy(backupPath, this.configPath);

      return true;
    } catch (error) {
      throw new Error(`恢复备份失败: ${error.message}`);
    }
  }

  /**
   * 获取完整备份列表
   * @returns {Array<Object>} 完整备份列表
   */
  async getFullBackupsList() {
    try {
      // 确保备份目录存在
      if (!(await fs.pathExists(this.backupsDir))) {
        return [];
      }

      // 读取备份目录中的所有条目
      const entries = await fs.readdir(this.backupsDir, { withFileTypes: true });

      // 过滤出完整备份目录
      const fullBackupDirs = entries.filter(entry =>
        entry.isDirectory() && entry.name.startsWith('full_backup_')
      );

      // 获取目录的完整信息
      const dirsWithStats = await Promise.all(
        fullBackupDirs.map(async (dir) => {
          const dirPath = path.join(this.backupsDir, dir.name);
          const stats = await fs.stat(dirPath);

          // 计算目录大小
          let totalSize = 0;
          const calculateSize = async (dirPath) => {
            const files = await fs.readdir(dirPath, { withFileTypes: true });
            for (const file of files) {
              const filePath = path.join(dirPath, file.name);
              if (file.isDirectory()) {
                await calculateSize(filePath);
              } else {
                const fileStats = await fs.stat(filePath);
                totalSize += fileStats.size;
              }
            }
          };
          await calculateSize(dirPath);

          return {
            name: dir.name,
            path: dirPath,
            size: totalSize,
            mtime: stats.mtime
          };
        })
      );

      // 按修改时间降序排序
      dirsWithStats.sort((a, b) => b.mtime - a.mtime);

      return dirsWithStats;
    } catch (error) {
      console.warn(chalk.yellow("⚠️  获取完整备份列表失败:"), error.message);
      return [];
    }
  }

  /**
   * 从完整备份恢复配置文件
   * @param {string} backupDirPath 完整备份目录路径
   * @param {Object} options 恢复选项
   */
  async restoreFromFullBackup(backupDirPath, options = {}) {
    const {
      restoreCcCli = true,
      restoreClaudeCode = true,
      restoreCodex = true
    } = options;

    try {
      const restoredFiles = [];

      // 恢复 CC-CLI 配置
      if (restoreCcCli) {
        const ccCliBackupFile = path.join(backupDirPath, 'cc-cli', 'api_configs.json');
        if (await fs.pathExists(ccCliBackupFile)) {
          await fs.copy(ccCliBackupFile, this.configPath);
          restoredFiles.push('CC-CLI: api_configs.json');
        }
      }

      // 恢复 Claude Code 配置
      if (restoreClaudeCode) {
        const claudeBackupDir = path.join(backupDirPath, 'claude');

        // settings.json
        const settingsBackup = path.join(claudeBackupDir, 'settings.json');
        if (await fs.pathExists(settingsBackup)) {
          await fs.copy(settingsBackup, this.settingsPath);
          restoredFiles.push('Claude: settings.json');
        }

        // CLAUDE.md
        const claudeMdBackup = path.join(claudeBackupDir, 'CLAUDE.md');
        const claudeMdPath = path.join(this.claudeDir, 'CLAUDE.md');
        if (await fs.pathExists(claudeMdBackup)) {
          await fs.copy(claudeMdBackup, claudeMdPath);
          restoredFiles.push('Claude: CLAUDE.md');
        }

        // agents/ 目录
        const agentsBackup = path.join(claudeBackupDir, 'agents');
        const agentsDir = path.join(this.claudeDir, 'agents');
        if (await fs.pathExists(agentsBackup)) {
          await fs.copy(agentsBackup, agentsDir);
          restoredFiles.push('Claude: agents/');
        }

        // commands/ 目录
        const commandsBackup = path.join(claudeBackupDir, 'commands');
        const commandsDir = path.join(this.claudeDir, 'commands');
        if (await fs.pathExists(commandsBackup)) {
          await fs.copy(commandsBackup, commandsDir);
          restoredFiles.push('Claude: commands/');
        }
      }

      // 恢复 Codex 配置
      if (restoreCodex) {
        const codexBackupDir = path.join(backupDirPath, 'codex');

        // config.toml
        const configBackup = path.join(codexBackupDir, 'config.toml');
        const configPath = path.join(this.homeDir, '.codex', 'config.toml');
        if (await fs.pathExists(configBackup)) {
          await fs.copy(configBackup, configPath);
          restoredFiles.push('Codex: config.toml');
        }

        // auth.json
        const authBackup = path.join(codexBackupDir, 'auth.json');
        const authPath = path.join(this.homeDir, '.codex', 'auth.json');
        if (await fs.pathExists(authBackup)) {
          await fs.copy(authBackup, authPath);
          restoredFiles.push('Codex: auth.json');
        }

        // AGENTS.md
        const agentsMdBackup = path.join(codexBackupDir, 'AGENTS.md');
        const agentsMdPath = path.join(this.homeDir, '.codex', 'AGENTS.md');
        if (await fs.pathExists(agentsMdBackup)) {
          await fs.copy(agentsMdBackup, agentsMdPath);
          restoredFiles.push('Codex: AGENTS.md');
        }
      }

      return restoredFiles;
    } catch (error) {
      throw new Error(`恢复完整备份失败: ${error.message}`);
    }
  }

  /**
   * 交互式恢复备份
   * @returns {boolean} 是否成功恢复
   */
  async interactiveRestoreBackup() {
    try {
      const inquirer = (await import('inquirer')).default;

      // 获取备份列表
      const backups = await this.getBackupsList();

      if (backups.length === 0) {
        console.log(chalk.yellow("⚠️  没有找到可用的备份文件"));
        return false;
      }

      console.log(chalk.cyan.bold("\n📦 可用的备份文件："));

      // 构建选择列表
      const choices = backups.map((backup, index) => {
        const timeStr = backup.mtime.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        const sizeKB = (backup.size / 1024).toFixed(2);
        return {
          name: `${index + 1}. ${timeStr} (${sizeKB} KB)`,
          value: backup.path,
          short: `备份 ${index + 1}`
        };
      });

      choices.push({
        name: '❌ 取消恢复',
        value: null,
        short: '取消'
      });

      const { selectedBackup } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedBackup',
          message: '选择要恢复的备份文件：',
          choices,
          pageSize: 10
        }
      ]);

      if (!selectedBackup) {
        console.log(chalk.gray("已取消恢复操作"));
        return false;
      }

      // 确认恢复
      const { confirmRestore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmRestore',
          message: chalk.yellow('确认要恢复此备份？当前配置文件将被覆盖！'),
          default: false
        }
      ]);

      if (!confirmRestore) {
        console.log(chalk.gray("已取消恢复操作"));
        return false;
      }

      // 执行恢复
      const ora = (await import('ora')).default;
      const spinner = ora('正在恢复备份...').start();

      try {
        await this.restoreFromBackup(selectedBackup);
        spinner.succeed('备份恢复成功！');
        console.log(chalk.green("✅ 配置文件已成功恢复"));
        console.log(chalk.gray(`💡 使用 cc api --list 或 cc apix --list 查看配置`));
        return true;
      } catch (error) {
        spinner.fail('备份恢复失败');
        console.log(chalk.red(`❌ ${error.message}`));
        return false;
      }

    } catch (error) {
      console.error(chalk.red("恢复备份时出错:"), error.message);
      return false;
    }
  }

  /**
   * 获取当前配置
   * @returns {Object|null} 当前配置对象，如果不存在则返回null
   */
  async getCurrentConfig() {
    try {
      const allConfigs = await this.getAllConfigs();
      return allConfigs.currentConfig || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取当前Codex配置
   * @returns {Object|null} 当前Codex配置对象，如果不存在则返回null
   */
  async getCurrentCodexConfig() {
    try {
      const allConfigs = await this.getAllConfigs();
      return allConfigs.currentCodexConfig || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取当前iFlow配置
   * @returns {Object|null} 当前iFlow配置对象，如果不存在则返回null
   */
  async getCurrentIflowConfig() {
    try {
      const allConfigs = await this.getAllConfigs();
      return allConfigs.currentIflowConfig || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取当前配置路径
   * @returns {string|null} 当前配置路径，如果不存在则返回null
   */
  get currentConfigPath() {
    return this.configPath;
  }

  /**
   * 通过比对配置找出匹配的 site
   * @param {string} configType 配置类型（'claude'、'codex'、'iflow'）
   * @param {Object} configData 配置数据对象
   * @returns {string|null} 匹配的 site 名称，如果没有匹配则返回 null
   */
  async findMatchingSite(configType, configData) {
    try {
      if (!configData) {
        return null;
      }

      // 获取所有配置
      const allConfigs = await this.getAllConfigs();
      
      // 根据配置类型提取关键字段 - 完全按照写入方式反向提取
      let baseUrl, apiKey, model;
      
      if (configType === 'claude') {
        // Claude: 从 settings.json 的 env 字段中提取
        baseUrl = configData.env?.ANTHROPIC_BASE_URL;
        // 处理 ANTHROPIC_AUTH_TOKEN 可能是对象的情况
        const authToken = configData.env?.ANTHROPIC_AUTH_TOKEN;
        if (typeof authToken === 'object' && authToken !== null) {
          // 取第一个 token 值
          apiKey = Object.values(authToken)[0];
        } else {
          apiKey = authToken;
        }
        model = configData.env?.ANTHROPIC_MODEL;
      } else if (configType === 'codex') {
        // Codex: 从 TOML 配置中提取，优先使用 model_providers 中的配置
        if (configData.content) {
          const lines = configData.content.split('\n');
          let currentProvider = null;
          let inModelProviders = false;
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 检测进入 model_providers 部分
            if (trimmedLine.startsWith('[model_providers.')) {
              inModelProviders = true;
              currentProvider = trimmedLine.match(/\[model_providers\.(\w+)\]/)?.[1];
              continue;
            }
            
            // 检测退出 model_providers 部分
            if (trimmedLine.startsWith('[') && !trimmedLine.startsWith('[model_providers.')) {
              inModelProviders = false;
              currentProvider = null;
              continue;
            }
            
            // 在 model_providers 中提取 base_url
            if (inModelProviders && trimmedLine.startsWith('base_url = ')) {
              baseUrl = trimmedLine.replace('base_url = ', '').replace(/"/g, '');
              // 找到第一个 provider 的 base_url 就停止
              break;
            }
          }
          
          // 如果在 model_providers 中没有找到，查找顶级 base_url
          if (!baseUrl) {
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('base_url = ')) {
                baseUrl = trimmedLine.replace('base_url = ', '').replace(/"/g, '');
                break;
              } else if (trimmedLine.startsWith('model = ')) {
                model = trimmedLine.replace('model = ', '').replace(/"/g, '');
              }
            }
          }
        }
        
        // API Key 从 auth.json 中获取（按照写入方式）
        if (configData.path) {
          try {
            const authPath = path.join(path.dirname(configData.path), 'auth.json');
            if (await fs.pathExists(authPath)) {
              const authContent = await fs.readFile(authPath, 'utf8');
              const authData = JSON.parse(authContent);
              if (authData.api_key) {
                apiKey = authData.api_key;
              }
            }
          } catch (error) {
            // 忽略读取 auth.json 的错误
          }
        }
      } else if (configType === 'iflow') {
        // iFlow: 直接从配置对象中提取
        baseUrl = configData.baseUrl;
        apiKey = configData.apiKey;
        model = configData.modelName || configData.model;
      }
      
      // 遍历所有站点，寻找匹配
      for (const [siteName, siteConfig] of Object.entries(allConfigs.sites)) {
        if (!siteConfig[configType]) {
          continue;
        }
        
        const siteConfigData = siteConfig[configType];
        let siteBaseUrl, siteApiKey, siteModel;
        
        // 统一的配置提取逻辑 - 完全按照写入方式反向提取
        if (configType === 'claude') {
          // Claude: 从站点配置的 env 字段提取
          siteBaseUrl = siteConfigData.env?.ANTHROPIC_BASE_URL;
          // 处理 ANTHROPIC_AUTH_TOKEN 可能是对象的情况
          const siteAuthToken = siteConfigData.env?.ANTHROPIC_AUTH_TOKEN;
          if (typeof siteAuthToken === 'object' && siteAuthToken !== null) {
            // 取第一个 token 值
            siteApiKey = Object.values(siteAuthToken)[0];
          } else {
            siteApiKey = siteAuthToken;
          }
          siteModel = siteConfigData.env?.ANTHROPIC_MODEL;
        } else if (configType === 'codex') {
          // Codex: 优先使用 model_providers 中的 base_url，然后使用站点 url
          if (siteConfigData.model_providers) {
            for (const providerName of Object.keys(siteConfigData.model_providers)) {
              const provider = siteConfigData.model_providers[providerName];
              if (provider.base_url) {
                siteBaseUrl = provider.base_url;
                break;
              }
            }
          }
          // 如果没有找到 model_providers 的 base_url，使用 siteConfig.url
          if (!siteBaseUrl && siteConfig.url) {
            siteBaseUrl = siteConfig.url;
          }
          siteModel = siteConfigData.model;
          siteApiKey = siteConfigData.OPENAI_API_KEY;
        } else if (configType === 'iflow') {
          // iFlow: 直接从站点配置中提取
          siteBaseUrl = siteConfigData.baseUrl;
          siteApiKey = siteConfigData.apiKey;
          siteModel = siteConfigData.model;
        }
        
        // 1. 首先正常匹配（完全匹配 BASEURL）
        if (baseUrl && siteBaseUrl && baseUrl === siteBaseUrl) {
          if (apiKey && siteApiKey) {
            // 对于 API Key，只比对前几个字符，因为可能显示的是...
            const apiKeyPrefix = typeof apiKey === 'string' ? 
              apiKey.substring(0, Math.min(10, apiKey.length)) : 
              apiKey;
            const siteApiKeyPrefix = typeof siteApiKey === 'string' ? 
              siteApiKey.substring(0, Math.min(10, siteApiKey.length)) : 
              siteApiKey;
            
            if (apiKeyPrefix === siteApiKeyPrefix) {
              return siteName;
            }
          } else if (model && siteModel && model === siteModel) {
            // 如果没有 API Key 或 API Key 不匹配，尝试比对模型
            return siteName;
          } else if (!apiKey && !model) {
            // 如果既没有 API Key 也没有模型，只比对 BASEURL
            return siteName;
          }
        }
      }
      
      // 如果都不符合，就直接用 URL 作为 site 名称
      if (baseUrl) {
        // 直接使用整个 URL 作为 site 名称，保持简单
        return baseUrl;
      }
      
      return null;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  查找匹配 site 失败:`), error.message);
      return null;
    }
  }
}

export default ManagerConfig;