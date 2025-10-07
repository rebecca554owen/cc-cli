import chalk from 'chalk';
import ora from 'ora';

import { QuickUseCommandBase } from '../../utils/base-command.js';
import { selectSite, selectToken, confirmSwitch, showSuccess, showError, showInfo } from '../../utils/ui.js';
import { formatSwitchSuccess } from '../../utils/formatter.js';

/**
 * Claude API 快速使用命令
 * 基于 QuickUseCommandBase，提供统一的快速切换功能
 */
class ApiUseCommand extends QuickUseCommandBase {
  constructor() {
    super({
      commandName: 'use',
      description: '快速切换 Claude Code API 配置',
      commandType: 'claude',
      configField: 'claude',
      tokenField: 'ANTHROPIC_AUTH_TOKEN',
      displayName: 'Claude'
    });
  }

  /**
   * 实现快速切换逻辑
   * @param {Object} filteredSites 过滤后的站点配置
   */
  async executeQuickSwitch(filteredSites) {
    // 直接选择站点
    console.log(chalk.white('\n📡 请选择 Claude Code 站点:'));
    const selectedSite = await selectSite(filteredSites);

    // 检查是否选择返回
    if (selectedSite === '__back__') {
      showInfo('操作已取消');
      return false;
    }

    const siteConfig = filteredSites[selectedSite];

    // 获取Claude配置
    const claudeConfig = siteConfig.claude;

    console.log(chalk.gray(`✓ 选择站点: ${selectedSite}`));
    console.log(chalk.gray(`✓ URL: ${claudeConfig.env.ANTHROPIC_BASE_URL}`));

    // 智能选择Token
    let selectedToken;
    const rawTokens = claudeConfig.env.ANTHROPIC_AUTH_TOKEN;
    const tokens = typeof rawTokens === 'string' ? { '默认Token': rawTokens } : rawTokens;

    if (Object.keys(tokens).length === 1) {
      selectedToken = Object.values(tokens)[0];
      const tokenName = Object.keys(tokens)[0];
      console.log(chalk.gray(`✓ Token自动选择: ${tokenName} (${selectedToken.substring(0, 10)}...)`));
    } else {
      console.log(chalk.white('\n🔑 请选择 Token:'));
      selectedToken = await selectToken(tokens);

      // 检查是否选择返回
      if (selectedToken === '__back__') {
        showInfo('操作已取消');
        return false;
      }

      const tokenName = Object.keys(tokens).find(key => tokens[key] === selectedToken);
      console.log(chalk.gray(`✓ 选择Token: ${tokenName}`));
    }

    // 确认切换
    const config = {
      site: selectedSite,
      siteName: selectedSite,
      ANTHROPIC_BASE_URL: claudeConfig.env.ANTHROPIC_BASE_URL,
      token: selectedToken,
      tokenName: Object.keys(tokens).find(key => tokens[key] === selectedToken)
    };

    const confirmed = await confirmSwitch(config);

    if (!confirmed) {
      showInfo('操作已取消');
      return false;
    }

    // 保存配置
    const saveSpinner = ora('正在保存配置...').start();

    try {
      await this.configManager.switchConfig(selectedSite, selectedToken, siteConfig);
      saveSpinner.succeed('配置保存成功');

      // 显示成功信息
      console.log(formatSwitchSuccess(config));
      showSuccess('🎉 Claude Code API 配置切换完成！');
      showInfo('您现在可以在 Claude Code 中使用新的配置');

      return true;

    } catch (error) {
      saveSpinner.fail();
      showError(`保存配置失败: ${error.message}`);
      return false;
    }
  }
}

export default new ApiUseCommand();