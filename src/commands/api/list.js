const chalk = require('chalk');
const ora = require('ora');

const ConfigManager = require('../../core/ConfigManager');
const { formatConfigList, formatError } = require('../../utils/formatter');
const { showError, showInfo } = require('../../utils/ui');

/**
 * API配置列表显示命令
 */
class ListCommand {
  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * 执行配置列表显示
   * @param {Array} args 参数
   */
  async execute(args = []) {
    const spinner = ora('正在加载配置...').start();
    
    try {
      // 检查配置文件是否存在
      if (!await this.configManager.configExists()) {
        spinner.fail();
        
        const errorMessage = formatError(
          '配置文件不存在',
          '无法找到 ~/.claude/api_configs.json 文件',
          '请确保Claude Code已正确安装并配置了API设置'
        );
        
        console.log(errorMessage);
        return;
      }

      // 读取所有配置
      const allConfigs = await this.configManager.getAllConfigs();
      
      if (!this.configManager.validateConfig(allConfigs)) {
        spinner.fail();
        showError('配置文件格式无效');
        showInfo('请检查配置文件格式是否正确');
        return;
      }

      // 读取当前配置
      const currentConfig = await this.configManager.getCurrentConfig();
      
      spinner.succeed('配置加载完成');

      // 显示配置列表
      const configList = formatConfigList(allConfigs, currentConfig);
      console.log(configList);

      // 显示统计信息
      const siteCount = Object.keys(allConfigs.sites).length;
      let totalUrls = 0;
      let totalTokens = 0;

      Object.values(allConfigs.sites).forEach(site => {
        totalUrls += 1; // 每个站点只有一个ANTHROPIC_BASE_URL
        const authTokens = site.config?.env?.ANTHROPIC_AUTH_TOKEN || site.ANTHROPIC_AUTH_TOKEN;
        if (authTokens) {
          totalTokens += Object.keys(authTokens).length;
        }
      });

      console.log(chalk.blue('📊 统计信息:'));
      console.log(chalk.gray(`  站点数量: ${siteCount}`));
      console.log(chalk.gray(`  URL总数: ${totalUrls}`));
      console.log(chalk.gray(`  Token总数: ${totalTokens}`));

      if (currentConfig) {
        console.log(chalk.gray(`  当前配置更新时间: ${new Date(currentConfig.updatedAt).toLocaleString()}`));
      }

    } catch (error) {
      spinner.fail();
      
      if (error.message.includes('配置文件不存在')) {
        const errorMessage = formatError(
          'API配置文件访问失败',
          error.message,
          '1. 确保Claude Code已正确安装\n2. 检查用户目录权限\n3. 尝试重新配置Claude Code'
        );
        console.log(errorMessage);
      } else {
        showError(`读取配置失败: ${error.message}`);
      }
    }
  }
}

module.exports = new ListCommand();