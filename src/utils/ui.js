import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import figlet from 'figlet';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getSiteIcon } from './formatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

// 显示启动Banner
function showBanner(updateInfo = null) {

  const banner = figlet.textSync('CC CLI', {
    font: 'Small',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  let versionText = chalk.gray(`v${packageJson.version}`);

  // 根据更新状态调整版本显示
  if (updateInfo) {
    // 有新版本可用
    versionText += chalk.yellow(' (有更新)');
  } else {
    // 已是最新版本
    versionText += chalk.green(' (最新)');
  }

  let content = chalk.cyan.bold(banner) + '\n' +
    chalk.white('Claude Code配置管理CLI工具') + '\n' +
    versionText;

  // 如果有更新信息，添加到 banner 中
  if (updateInfo) {
    content += '\n\n' +
      chalk.yellow('🚀 新版本可用! ') +
      chalk.dim(updateInfo.current) + ' → ' + chalk.green(updateInfo.latest) + '\n' +
      chalk.gray('运行 ') + chalk.cyan('npm install -g @rebecca554owen/cc-cli') + chalk.gray(' 更新');
  }

  const boxedBanner = boxen(
    content,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      align: 'center'
    }
  );

  console.log(boxedBanner);
}

// 显示主菜单
async function showMainMenu() {
  const choices = [
    {
      name: '📡 Claude 配置管理 - Claude Code API',
      value: 'api',
      short: 'Claude Code API'
    },
    {
      name: '💻 Codex  配置管理 - OpenAI Codex API',
      value: 'apix',
      short: 'OpenAI Codex API'
    },
    {
      name: '🌊 iFlow  配置管理 - iFlow API',
      value: 'apii',
      short: 'iFlow API'
    },

    {
      name: '📊 查看当前API状态 - Status',
      value: 'status',
      short: 'Status'
    },
    {
      name: '📦 备份与恢复配置 - Backup & Restore',
      value: 'backup',
      short: 'Backup'
    },
    {
      name: '❓ 查看命令帮助文档 - Help',
      value: 'help',
      short: 'Help'
    },
    new inquirer.Separator(),
    {
      name: '🚪 Exit - 退出',
      value: 'exit',
      short: 'Exit'
    }
  ];

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: '请选择功能模块：',
      choices,
      pageSize: 10
    }
  ]);

  return choice;
}

// 显示API菜单
async function showApiMenu(options = {}) {
  console.log(chalk.cyan.bold('\n📡 Claude配置管理'));
  console.log(chalk.gray('═'.repeat(40)));

  // 构建自动模式菜单项
  const autoActionText = options.autoStatus ?
    '🛑 自动模式 - 禁用自动批准功能' :
    '🚀 自动模式 - 启用自动批准功能';
  const autoStatusText = options.autoStatus ?
    chalk.green('[已开启]') :
    chalk.gray('[已关闭]');

  const choices = [
    {
      name: '🔄 切换配置 - 切换API配置',
      value: 'switch',
      short: '切换配置'
    },
    {
      name: '📋 查看配置 - 列出所有配置',
      value: 'list',
      short: '查看配置'
    },
    {
      name: '➕ 添加配置 - 添加新的API配置',
      value: 'add',
      short: '添加配置'
    },
    {
      name: '✏️ 编辑配置 - 修改现有配置',
      value: 'edit',
      short: '编辑配置'
    },
    {
      name: '🗑️ 删除配置 - 删除API配置',
      value: 'delete',
      short: '删除配置'
    },
    {
      name: `${autoActionText} ${autoStatusText}`,
      value: 'auto',
      short: '自动模式'
    },
    new inquirer.Separator(),
    createBackChoice('back')
  ];

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: '请选择操作：',
      choices,
      pageSize: 10
    }
  ]);

  return choice;
}

// 选择站点
async function selectSite(sites) {
  const choices = Object.entries(sites).map(([key, config]) => {
    const icon = getSiteIcon(key, config);
    // 新格式中站点名称就是key本身
    return {
      name: `${icon} ${key}`,
      value: key,
      short: key
    };
  });

  // 添加返回选项
  choices.push(createBackChoice('__back__'));

  const { site } = await inquirer.prompt([
    {
      type: 'list',
      name: 'site',
      message: '选择站点：',
      choices,
      pageSize: 10
    }
  ]);

  return site;
}

// 选择URL
async function selectUrl(urls) {
  const choices = Object.entries(urls).map(([name, url]) => ({
    name: `${getRegionIcon(name)} ${name} (${url})`,
    value: url,
    short: name
  }));

  const { url } = await inquirer.prompt([
    {
      type: 'list',
      name: 'url',
      message: '选择URL线路：',
      choices,
      pageSize: 10
    }
  ]);

  return url;
}

// 选择Token
async function selectToken(tokens) {
  const choices = Object.entries(tokens).map(([name, token]) => ({
    name: `${getTokenIcon(name)} ${name} (${token.substring(0, 10)}...)`,
    value: token,
    short: name
  }));

  // 添加返回选项
  choices.push(createBackChoice('__back__'));

  const { token } = await inquirer.prompt([
    {
      type: 'list',
      name: 'token',
      message: '选择Token：',
      choices,
      pageSize: 10
    }
  ]);

  return token;
}

// 确认配置切换
async function confirmSwitch(config) {
  console.log(chalk.white('\n📋 即将切换到以下配置：'));
  
  const configBox = boxen(
    `${chalk.white('站点：')} ${chalk.cyan(config.siteName)}\n` +
    `${chalk.white('ANTHROPIC_BASE_URL：')} ${chalk.cyan(config.ANTHROPIC_BASE_URL)}\n` +
    `${chalk.white('Token：')} ${chalk.cyan(config.token.substring(0, 20) + '...')}`,
    {
      padding: 1,
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'yellow'
    }
  );

  console.log(configBox);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确认切换配置？',
      default: true
    }
  ]);

  return confirm;
}

// 显示成功消息
function showSuccess(message) {
  console.log(chalk.green('✨ ' + message));
}

// 显示警告消息
function showWarning(message) {
  console.log(chalk.yellow('⚠️  ' + message));
}

// 显示错误消息
function showError(message) {
  console.log(chalk.red('❌ ' + message));
}

// 显示信息消息
function showInfo(message) {
  console.log(chalk.blue('ℹ️  ' + message));
}

// 获取地区图标
function getRegionIcon(regionName) {
  const lowerName = regionName.toLowerCase();
  if (lowerName.includes('日本') || lowerName.includes('japan')) return '🇯🇵';
  if (lowerName.includes('新加坡') || lowerName.includes('singapore')) return '🇸🇬';
  if (lowerName.includes('美国') || lowerName.includes('usa')) return '🇺🇸';
  if (lowerName.includes('香港') || lowerName.includes('hongkong')) return '🇭🇰';
  if (lowerName.includes('大陆') || lowerName.includes('china')) return '🇨🇳';
  return '🌍';
}

// 获取Token图标
function getTokenIcon(tokenName) {
  return '🔑'; // 固定Token图标
}

// 通用返回确认
async function waitForBackConfirm(message = '操作完成') {
  await inquirer.prompt([
    {
      type: 'list',
      name: 'back',
      message: `${message}：`,
      choices: [
        createBackChoice('back')
      ]
    }
  ]);
}

// 创建标准返回按钮选项
function createBackChoice(value = 'back') {
  return {
    name: '⬅️  返回上一级菜单',
    value: value,
    short: '返回'
  };
}

export {
  showBanner,
  showMainMenu,
  showApiMenu,
  selectSite,
  selectUrl,
  selectToken,
  confirmSwitch,
  showSuccess,
  showWarning,
  showError,
  showInfo,
  getSiteIcon,
  getRegionIcon,
  getTokenIcon,
  waitForBackConfirm,
  createBackChoice
};

// ===============================
// 新增：通用菜单和选择器组件
// ===============================

// 创建通用管理菜单
function createGenericMenu(options) {
  return async () => {
    const inquirer = (await import('inquirer')).default;

    while (true) {
      try {
        console.log(chalk.cyan.bold(`\n${options.title}`));
        console.log(chalk.gray('═'.repeat(40)));

        // 获取自动模式状态（如果配置了）
        let autoStatus = false;
        if (options.getAutoStatus) {
          autoStatus = await options.getAutoStatus();
        }

        // 构建菜单项
        const choices = [...options.menuItems];

        // 添加自动模式选项（如果配置了自动管理器）
        if (options.autoManager) {
          const autoActionText = autoStatus ?
            '🛑 自动模式 - 禁用自动批准功能' :
            '🚀 自动模式 - 启用自动批准功能';
          const autoStatusText = autoStatus ?
            chalk.green('[已开启]') :
            chalk.gray('[已关闭]');

          choices.push({
            name: `${autoActionText} ${autoStatusText}`,
            value: 'auto',
            short: '自动模式'
          });
        }

        // 添加返回选项
        choices.push(createBackChoice('back'));

        const { choice } = await inquirer.prompt([{
          type: 'list',
          name: 'choice',
          message: '请选择操作：',
          choices,
          pageSize: 10
        }]);

        if (choice === 'back') {
          return; // 返回主菜单
        }

        // 处理自动模式
        if (choice === 'auto' && options.autoManager) {
          await options.autoManager.toggleAutoMode();
          continue;
        }

        // 处理其他菜单项
        const menuItem = options.menuItems.find(item => item.value === choice);
        if (menuItem && menuItem.handler) {
          await menuItem.handler();
          continue;
        }

        // 如果菜单项是命令对象，执行其execute方法
        if (menuItem && menuItem.command) {
          await menuItem.command.execute([]);
          continue;
        }

        console.log(chalk.red('❌ 无效选择'));

      } catch (error) {
        console.error(chalk.red('❌ 菜单操作失败:'), error.message);
      }
    }
  };
}

// 智能选择器
async function smartSelector(options) {
  const inquirer = (await import('inquirer')).default;

  let displayChoices = [...options.choices];

  // 添加返回选项
  if (options.includeBackOption !== false) {
    displayChoices.push({
      name: '↩️  返回',
      value: options.backValue || '__back__',
      short: '返回'
    });
  }

  // 智能选择逻辑
  if (options.autoSelectWhenSingle !== false &&
      displayChoices.length === (options.includeBackOption !== false ? 2 : 1)) {
    const selected = displayChoices[0].value;
    if (selected !== (options.backValue || '__back__')) {
      console.log(chalk.gray(`✓ 自动选择: ${displayChoices[0].short || selected}`));
      return selected;
    }
  }

  // 显示选择界面
  const { choice } = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: options.title,
    choices: displayChoices,
    pageSize: 10
  }]);

  return choice;
}

// 创建选择器配置
function createSelectorConfig(items, nameFormatter = null, iconGetter = null, shortFormatter = null) {
  return Object.entries(items).map(([key, item]) => ({
    name: nameFormatter ? nameFormatter(key, item) : key,
    value: key,
    short: shortFormatter ? shortFormatter(key, item) : key
  }));
}

// 导出新增的函数
export {
  createGenericMenu,
  smartSelector,
  createSelectorConfig
};
