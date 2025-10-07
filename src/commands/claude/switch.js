import chalk from 'chalk';
import ora from 'ora';

import ManagerConfig from '../../core/manager-config.js';
import GenericSelector from '../../utils/selectors.js';
import { confirmSwitch, showSuccess, showError, showInfo } from '../../utils/ui.js';
import { formatSwitchSuccess } from '../../utils/formatter.js';

/**
 * API配置切换命令
 */
class SwitchCommand {
  constructor() {
    this.configManager = new ManagerConfig();
  }

  /**
   * 执行配置切换
   * @param {Array} args 参数
   */
  async execute(args = []) {
    const spinner = ora('正在加载配置...').start();
    
    try {
      // 检查配置文件是否存在
      if (!await this.configManager.configExists()) {
        spinner.fail();
        showError('配置文件不存在');
        showInfo('请确保 ~/.cc-cli/api_configs.json 文件存在');
        return false; // 配置文件不存在，操作未完成
      }

      // 读取所有配置
      const allConfigs = await this.configManager.getAllConfigs();
      
      if (!this.configManager.validateConfigStructure(allConfigs)) {
        spinner.fail();
        showError('配置文件格式无效');
        return false; // 配置格式无效，操作未完成
      }

      spinner.succeed('配置加载完成');

      // 1. 过滤出有Claude配置的站点
      const claudeSites = {};
      for (const [siteKey, siteConfig] of Object.entries(allConfigs.sites)) {
        // 只检查claude字段
        if (siteConfig.claude) {
          claudeSites[siteKey] = siteConfig;
        }
      }

      // 检查是否有可用的Claude配置
      if (Object.keys(claudeSites).length === 0) {
        showError('没有找到Claude配置');
        showInfo('请在api_configs.json中添加带有"claude"字段的站点配置');
        return false;
      }

      // 2. 选择站点
      const selectedSite = await GenericSelector.selectSite(claudeSites);

      // 检查是否选择返回
      if (selectedSite === '__back__') {
        return false; // 用户选择返回，操作被取消
      }

      const siteConfig = claudeSites[selectedSite];

      // 获取Claude配置
      const claudeConfig = siteConfig.claude;

      console.log(chalk.gray(`✓ 选择站点: ${selectedSite}`));
      console.log(chalk.gray(`✓ URL: ${claudeConfig.env.ANTHROPIC_BASE_URL}`));

      // 2. 智能选择Token
      let selectedToken;
      const rawTokens = claudeConfig.env.ANTHROPIC_AUTH_TOKEN;
      const tokens = typeof rawTokens === 'string' ? { '默认Token': rawTokens } : rawTokens;

      selectedToken = await GenericSelector.selectCredential(tokens, 'Token');

      // 检查是否选择返回
      if (selectedToken === '__back__') {
        return false; // 用户选择返回，操作被取消
      }

      // 3. 确认切换
      const config = {
        site: selectedSite,
        siteName: selectedSite,
        ANTHROPIC_BASE_URL: claudeConfig.env.ANTHROPIC_BASE_URL,
        token: selectedToken,
        tokenName: Object.keys(tokens).find(key => tokens[key] === selectedToken)
      };

      const confirmed = await confirmSwitch(config);
      
      if (!confirmed) {
        showInfo('取消切换配置');
        return false; // 用户取消确认，操作被取消
      }

      // 4. 保存配置
      const saveSpinner = ora('正在保存配置...').start();
      
      try {
        await this.configManager.switchConfig(selectedSite, selectedToken, siteConfig);
        saveSpinner.succeed('配置保存成功');

        // 显示成功信息
        console.log(formatSwitchSuccess(config));
        showSuccess('配置切换完成！');

        // 退出程序
        process.exit(0);

      } catch (error) {
        saveSpinner.fail();
        showError(`保存配置失败: ${error.message}`);
        return false; // 保存配置失败
      }

    } catch (error) {
      spinner.fail();
      showError(`配置切换失败: ${error.message}`);

      if (error.message.includes('配置文件不存在')) {
        showInfo('请确保以下文件存在：');
        console.log(chalk.gray('  ~/.cc-cli/api_configs.json'));
      }

      return false; // 操作失败
    }
  }
}

export default new SwitchCommand();