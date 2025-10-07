import chalk from 'chalk';
import inquirer from 'inquirer';
import { createBackChoice } from './ui.js';

/**
 * 通用选择器类 - 统一处理所有选择逻辑
 * 功能:
 * - 自动添加返回选项
 * - 单项自动选择
 * - 统一的 inquirer prompt 接口
 */
class GenericSelector {
  /**
   * 通用选择方法
   * @param {Object} options 选择器选项
   * @param {Object|Array} options.items 数据源 (对象或数组)
   * @param {string} options.message 提示信息
   * @param {Function} options.formatChoice 格式化单个选项的函数 (key, value) => { name, value, short }
   * @param {boolean} [options.autoSelect=true] 是否在只有一个选项时自动选择
   * @param {boolean} [options.includeBack=true] 是否包含返回选项
   * @param {string} [options.backValue='__back__'] 返回选项的值
   * @param {number} [options.pageSize=10] 每页显示数量
   * @param {string} [options.autoSelectMessage] 自动选择时的提示信息
   * @returns {Promise<any>} 选择的值 (可能是 __back__)
   */
  static async select(options) {
    const {
      items,
      message,
      formatChoice,
      autoSelect = true,
      includeBack = true,
      backValue = '__back__',
      pageSize = 10,
      autoSelectMessage = null
    } = options;

    // 将数据源转换为数组
    const entries = Array.isArray(items)
      ? items.map((item, index) => [index, item])
      : Object.entries(items);

    // 格式化选项
    const choices = entries.map(([key, value]) => formatChoice(key, value));

    // 添加返回选项
    if (includeBack) {
      choices.push(createBackChoice(backValue));
    }

    // 自动选择逻辑: 只有一个选项(不包括返回选项)时
    if (autoSelect && choices.length === (includeBack ? 2 : 1)) {
      const selectedChoice = choices[0];

      // 不自动选择返回选项
      if (selectedChoice.value !== backValue) {
        const displayMessage = autoSelectMessage ||
          `自动选择: ${chalk.cyan(selectedChoice.short || selectedChoice.value)}`;
        console.log(chalk.gray(`✓ ${displayMessage}`));
        return selectedChoice.value;
      }
    }

    // 显示选择界面
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message,
        choices,
        pageSize
      }
    ]);

    return choice;
  }

  /**
   * 选择站点 - 预设的站点选择器
   * @param {Object} sites 站点配置对象
   * @param {Function} [iconGetter] 获取站点图标的函数
   * @returns {Promise<string>} 选择的站点key或 '__back__'
   */
  static async selectSite(sites, iconGetter = null) {
    return await this.select({
      items: sites,
      message: '选择站点：',
      formatChoice: (key, config) => {
        const icon = iconGetter ? iconGetter(key, config) : '🌐';
        const description = config.description ? ` [${config.description}]` : '';
        return {
          name: `${icon} ${key}${description}`,
          value: key,
          short: key
        };
      },
      autoSelectMessage: `站点: ${chalk.cyan(Object.keys(sites)[0])}`
    });
  }

  /**
   * 选择服务提供商 - 预设的提供商选择器
   * @param {Object} providers 服务提供商配置
   * @returns {Promise<string>} 选择的提供商key或 '__back__'
   */
  static async selectProvider(providers) {
    return await this.select({
      items: providers,
      message: '选择服务提供商：',
      formatChoice: (key, provider) => {
        const providerName = provider.name || key;
        return {
          name: `💻 ${providerName} (${provider.base_url})`,
          value: key,
          short: providerName
        };
      },
      autoSelectMessage: `服务商: ${chalk.cyan(providers[Object.keys(providers)[0]].name || Object.keys(providers)[0])}`
    });
  }

  /**
   * 选择 Token/API Key - 预设的凭证选择器
   * @param {Object|string} credentials Token/API Key配置 (支持字符串或对象)
   * @param {string} [displayName='Token'] 显示名称
   * @returns {Promise<string>} 选择的凭证值或 '__back__'
   */
  static async selectCredential(credentials, displayName = 'Token') {
    // 转换为统一的对象格式
    const credentialObj = typeof credentials === 'string'
      ? { [`默认${displayName}`]: credentials }
      : credentials;

    return await this.select({
      items: credentialObj,
      message: `选择${displayName}：`,
      formatChoice: (name, value) => ({
        name: `🔑 ${name} (${value.substring(0, 15)}...)`,
        value: value,
        short: name
      }),
      autoSelectMessage: `${displayName}: ${Object.keys(credentialObj)[0]} (${Object.values(credentialObj)[0].substring(0, 10)}...)`
    });
  }
}

export default GenericSelector;
