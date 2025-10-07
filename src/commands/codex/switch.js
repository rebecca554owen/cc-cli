import chalk from 'chalk';
import fs from 'fs-extra';

import ManagerConfig from '../../core/manager-config.js';
import GenericSelector from '../../utils/selectors.js';
import CodexConfigBuilder from '../../config/builder-codex-config.js';
import configPaths from '../../config/paths-config.js';
import { showSuccess, showError, showInfo, showWarning } from '../../utils/ui.js';
import { formatCodexSwitchSuccess } from '../../utils/formatter.js';

/**
 * Codex配置切换命令
 */
class CodexSwitchCommand {
  constructor() {
    this.configManager = new ManagerConfig();
    // 使用统一的路径管理器
    this.codexConfigDir = configPaths.codexDir;
    this.codexConfigFile = configPaths.codexConfig;
    this.codexAuthFile = configPaths.codexAuth;
  }

  /**
   * 执行切换命令
   * @param {Array} args 参数
   */
  async execute(args = []) {
    try {
      showInfo('🔄 开始切换Codex配置...');

      // 1. 读取配置，过滤支持codex的站点
      const codexSites = await this.getCodexSites();

      if (Object.keys(codexSites).length === 0) {
        showWarning('没有找到支持Codex的站点配置');
        showInfo('请在api_configs.json中添加带有"codex"字段的站点配置');
        return false; // 没有可用配置，操作未完成
      }

      // 2. 选择站点
      const selectedSite = await this.selectSite(codexSites);

      // 检查是否选择返回
      if (selectedSite === '__back__') {
        return false; // 操作被取消
      }

      const siteConfig = codexSites[selectedSite];

      // 3. 获取站点的codex配置
      const codexConfig = this.getCodexConfig(siteConfig);

      // 4. 选择服务提供商
      const selectedProvider = await this.selectProvider(codexConfig.model_providers);

      // 检查是否选择返回
      if (selectedProvider === '__back__') {
        return false; // 操作被取消
      }

      // 5. 选择API Key
      const selectedApiKey = await this.selectApiKey(codexConfig.OPENAI_API_KEY);

      // 检查是否选择返回
      if (selectedApiKey === '__back__') {
        return false; // 操作被取消
      }

      // 6. 生成并写入配置文件
      await this.writeCodexConfig(selectedSite, codexConfig, selectedProvider);

      // 使用选择的API Key
      await this.writeAuthConfig(selectedApiKey);

      // 7. 保存当前Codex配置到api_configs.json
      const selectedProviderConfig = codexConfig.model_providers[selectedProvider];
      const apiKeyName = typeof codexConfig.OPENAI_API_KEY === 'object'
        ? Object.keys(codexConfig.OPENAI_API_KEY).find(key => codexConfig.OPENAI_API_KEY[key] === selectedApiKey)
        : selectedSite;

      const currentCodexConfig = {
        site: selectedSite,
        siteName: selectedSite,
        model: codexConfig.model || 'gpt-5',
        apiKey: selectedApiKey,
        apiKeyName: apiKeyName,
        provider: selectedProvider,
        providerName: selectedProviderConfig.name || selectedProvider,
        baseUrl: selectedProviderConfig.base_url
      };

      await this.configManager.saveCurrentCodexConfig(currentCodexConfig);

      // 输出美化的配置切换成功信息
      console.log(formatCodexSwitchSuccess(currentCodexConfig));
      showSuccess('配置切换完成！');

      // 退出程序
      process.exit(0);

    } catch (error) {
      showError(`切换Codex配置失败: ${error.message}`);
      return false; // 操作失败
    }
  }

  /**
   * 获取支持Codex的站点配置
   * @returns {Object} 支持Codex的站点配置
   */
  async getCodexSites() {
    try {
      const allConfigs = await this.configManager.getAllConfigs();
      const codexSites = {};

      for (const [siteKey, siteConfig] of Object.entries(allConfigs.sites)) {
        // 检查是否有codex字段
        if (siteConfig.codex) {
          codexSites[siteKey] = siteConfig;
        }
      }

      return codexSites;
    } catch (error) {
      throw new Error(`读取配置失败: ${error.message}`);
    }
  }

  /**
   * 获取站点的Codex配置
   * @param {Object} siteConfig 站点配置
   * @returns {Object} Codex配置
   */
  getCodexConfig(siteConfig) {
    // 返回codex配置
    if (siteConfig.codex) {
      return siteConfig.codex;
    }

    throw new Error('站点不支持Codex配置');
  }

  /**
   * 选择站点
   * @param {Object} codexSites 支持Codex的站点
   * @returns {string} 选择的站点key
   */
  async selectSite(codexSites) {
    return await GenericSelector.selectSite(codexSites);
  }

  /**
   * 选择服务提供商
   * @param {Object} modelProviders 服务提供商配置
   * @returns {string} 选择的提供商key
   */
  async selectProvider(modelProviders) {
    if (!modelProviders || Object.keys(modelProviders).length === 0) {
      throw new Error('站点没有配置服务提供商');
    }

    return await GenericSelector.selectProvider(modelProviders);
  }

  /**
   * 写入Codex配置文件（TOML格式）
   * @param {string} siteName 站点名称
   * @param {Object} codexConfig Codex配置
   * @param {string} selectedProvider 选择的提供商
   */
  async writeCodexConfig(siteName, codexConfig, selectedProvider) {
    try {
      // 确保目录存在
      await fs.ensureDir(this.codexConfigDir);

      // 读取现有配置以保留其他设置
      let existingConfig = '';
      if (await fs.pathExists(this.codexConfigFile)) {
        existingConfig = await fs.readFile(this.codexConfigFile, 'utf8');
      }

      // 获取选中的服务提供商配置
      const selectedProviderConfig = codexConfig.model_providers[selectedProvider];

      // 生成新的TOML配置
      const newTomlConfig = this.generateTomlConfig(codexConfig, selectedProvider, selectedProviderConfig, existingConfig);

      // 写入配置文件
      await fs.writeFile(this.codexConfigFile, newTomlConfig, 'utf8');

    } catch (error) {
      throw new Error(`写入Codex配置失败: ${error.message}`);
    }
  }

  /**
   * 生成TOML配置内容
   * @param {Object} codexConfig Codex配置
   * @param {string} providerKey 提供商key
   * @param {Object} providerConfig 提供商配置
   * @param {string} existingConfig 现有配置
   * @returns {string} TOML配置内容
   */
  generateTomlConfig(codexConfig, providerKey, providerConfig, existingConfig) {
    const builder = new CodexConfigBuilder(existingConfig);
    return builder.generate(codexConfig, providerKey, providerConfig);
  }

  /**
   * 写入认证配置文件
   * @param {string} token API token
   */
  async writeAuthConfig(token) {
    try {
      // 确保目录存在
      await fs.ensureDir(this.codexConfigDir);

      const authConfig = {
        OPENAI_API_KEY: token
      };

      // 写入认证文件
      await fs.writeFile(this.codexAuthFile, JSON.stringify(authConfig, null, 2), 'utf8');

    } catch (error) {
      throw new Error(`写入认证配置失败: ${error.message}`);
    }
  }

  /**
   * 选择API Key（支持字符串和对象格式）
   * @param {string|object} apiKey API Key配置
   * @returns {string} 选择的API Key
   */
  async selectApiKey(apiKey) {
    console.log(chalk.white('\n🔑 请选择 API Key:'));
    return await GenericSelector.selectCredential(apiKey, 'API Key');
  }
}

export default new CodexSwitchCommand();
