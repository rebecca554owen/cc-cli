import chalk from 'chalk';
import ora from 'ora';

import { QuickUseCommandBase } from '../../utils/base-command.js';
import { selectSite, selectToken, showSuccess, showError, showInfo } from '../../utils/ui.js';
import { formatCodexSwitchSuccess } from '../../utils/formatter.js';
import CodexSwitchCommand from './switch.js';

/**
 * Codex API快速使用命令
 * 基于 QuickUseCommandBase，提供统一的快速切换功能
 */
class CodexApiUseCommand extends QuickUseCommandBase {
  constructor() {
    super({
      commandName: 'usex',
      description: '快速切换 Codex API 配置',
      commandType: 'codex',
      configField: 'codex',
      tokenField: 'OPENAI_API_KEY',
      displayName: 'Codex'
    });
    this.switchCommand = CodexSwitchCommand;
  }

  /**
   * 实现快速切换逻辑
   * @param {Object} filteredSites 过滤后的站点配置
   */
  async executeQuickSwitch(filteredSites) {
    // 1. 直接选择站点
    console.log(chalk.white('\n🌐 请选择 Codex 站点:'));
    const selectedSite = await selectSite(filteredSites);

    // 检查是否选择返回
    if (selectedSite === '__back__') {
      showInfo('操作已取消');
      return false;
    }

    const siteConfig = filteredSites[selectedSite];

    // 2. 获取站点的codex配置
    const codexConfig = this.switchCommand.getCodexConfig(siteConfig);

    console.log(chalk.gray(`✓ 选择站点: ${selectedSite}`));

    // 3. 智能选择服务提供商
    let selectedProvider;
    const providers = codexConfig.model_providers;

    if (Object.keys(providers).length === 1) {
      selectedProvider = Object.keys(providers)[0];
      const providerName = providers[selectedProvider].name || selectedProvider;
      console.log(chalk.gray(`✓ 服务商自动选择: ${providerName} (${providers[selectedProvider].base_url})`));
    } else {
      console.log(chalk.white('\n💻 请选择服务提供商:'));
      selectedProvider = await this.switchCommand.selectProvider(providers);

      // 检查是否选择返回
      if (selectedProvider === '__back__') {
        showInfo('操作已取消');
        return false;
      }

      const providerName = providers[selectedProvider].name || selectedProvider;
      console.log(chalk.gray(`✓ 选择服务商: ${providerName}`));
    }

    // 4. 智能选择API Key
    let selectedApiKey;
    const rawApiKey = codexConfig.OPENAI_API_KEY;
    const apiKeys = typeof rawApiKey === 'string' ? { '默认API Key': rawApiKey } : rawApiKey;

    if (Object.keys(apiKeys).length === 1) {
      selectedApiKey = Object.values(apiKeys)[0];
      const keyName = Object.keys(apiKeys)[0];
      console.log(chalk.gray(`✓ API Key自动选择: ${keyName} (${selectedApiKey.substring(0, 10)}...)`));
    } else {
      console.log(chalk.white('\n🔑 请选择 API Key:'));
      selectedApiKey = await selectToken(apiKeys);

      // 检查是否选择返回
      if (selectedApiKey === '__back__') {
        showInfo('操作已取消');
        return false;
      }

      const keyName = Object.keys(apiKeys).find(key => apiKeys[key] === selectedApiKey);
      console.log(chalk.gray(`✓ 选择API Key: ${keyName}`));
    }

    // 5. 保存配置
    const saveSpinner = ora('正在保存配置...').start();

    try {
      // 写入配置文件
      await this.switchCommand.writeCodexConfig(selectedSite, codexConfig, selectedProvider);
      await this.switchCommand.writeAuthConfig(selectedApiKey);

      // 保存当前Codex配置到api_configs.json
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

      saveSpinner.succeed('配置保存成功');

      // 显示成功信息
      console.log(formatCodexSwitchSuccess(currentCodexConfig));
      showSuccess('🎉 Codex API 配置切换完成！');
      showInfo('您现在可以在 Codex 中使用新的配置');

      return true;

    } catch (error) {
      saveSpinner.fail();
      showError(`保存配置失败: ${error.message}`);
      return false;
    }
  }
}

export default new CodexApiUseCommand();
