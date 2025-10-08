import chalk from "chalk";
import figlet from "figlet";
import inquirer from "inquirer";
import boxen from "boxen";
import updateNotifier from "update-notifier";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import CommandRegistry from "./commands/index.js";
import { showBanner, showMainMenu } from "./utils/ui.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

/**
 * 主程序入口
 * @param {Object} program commander实例
 */
async function main(program) {
  try {
    // 注册所有命令
    const commandRegistry = new CommandRegistry();
    await commandRegistry.registerCommands(program);

    // 如果没有参数，显示交互式主菜单
    if (process.argv.length === 2) {
      await showInteractiveMenu(commandRegistry);
    } else {
      // 有参数时交给commander处理
      await program.parseAsync(process.argv);
    }
  } catch (error) {
    console.error(chalk.red("❌ 启动失败:"), error.message);
    process.exit(1);
  }
}

/**
 * 显示交互式主菜单
 * @param {CommandRegistry} commandRegistry 命令注册器
 */
async function showInteractiveMenu(commandRegistry) {
  // 清屏
  console.clear();

  // 检查更新信息
  const updateInfo = checkForUpdates();

  // 检查是否为首次使用，如果是则自动初始化配置
  const { default: ManagerConfig } = await import('./core/manager-config.js');
  const configManager = new ManagerConfig();
  
  if (await configManager.isFirstUse()) {
    await configManager.autoInitializeConfig();
    console.log(''); // 添加空行
  } else {
    // 如果不是首次使用，检查并同步所有服务配置
    const synced = await configManager.syncAllServiceConfigs();
    if (synced) {
      console.log(''); // 添加空行
    }
  }

  // 显示整合后的状态（包含banner信息）
  await commandRegistry.showStatus();
  console.log(''); // 添加空行

  while (true) {
    try {
      const choice = await showMainMenu();

      if (choice === "exit") {
        console.log(chalk.green("👋 再见!!!"));
        process.exit(0);
      }

      if (choice === "api") {
        // 进入API子菜单（子菜单自己处理循环）
        await commandRegistry.executeCommand("api", []);
      } else if (choice === "apix") {
        // 进入Codex子菜单（子菜单自己处理循环）
        await commandRegistry.executeCommand("apix", []);
      } else if (choice === "apii") {
        // 进入iFlow子菜单（子菜单自己处理循环）
        await commandRegistry.executeCommand("apii", []);

      } else if (choice === "backup") {
        // 进入备份子菜单（子菜单自己处理循环）
        await commandRegistry.executeCommand("backup", []);
      } else if (choice === "status") {
        await commandRegistry.executeCommand("status", []);

        // 对于单次操作，询问是否继续
        if (!await askContinue()) {
          console.log(chalk.green("👋 再见！"));
          process.exit(0);
        }
      } else if (choice === "help") {
        await commandRegistry.executeCommand("help", []);

        // 对于单次操作，询问是否继续
        if (!await askContinue()) {
          console.log(chalk.green("👋 再见！"));
          process.exit(0);
        }
      }
    } catch (error) {
      console.error(chalk.red("❌ 操作失败:"), error.message);

      const { continueOnError } = await inquirer.prompt([
        {
          type: "list",
          name: "continueOnError",
          message: "发生错误，请选择下一步操作：",
          choices: [
            {
              name: "🔄 继续使用",
              value: true,
              short: "继续"
            },
            {
              name: "🚪 退出程序",
              value: false,
              short: "退出"
            }
          ],
          default: 0
        },
      ]);

      if (!continueOnError) {
        process.exit(1);
      }
    }
  }
}

/**
 * 询问用户是否继续
 * @param {string} message 询问消息
 * @returns {boolean} 是否继续
 */
async function askContinue(message = "请选择下一步操作：") {
  const { continueChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "continueChoice",
      message,
      choices: [
        {
          name: "🔄 继续使用",
          value: true,
          short: "继续"
        },
        {
          name: "🚪 退出程序",
          value: false,
          short: "退出"
        }
      ],
      default: 0
    },
  ]);

  return continueChoice;
}

/**
 * 检查版本更新
 * @returns {Object|null} 更新信息，如果没有更新返回null
 */
function checkForUpdates() {
  try {
    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 0, // 每次执行都检查
      shouldNotifyInNpmScript: false
    });

    if (notifier.update) {
      // 如果版本号相同，不返回更新信息
      if (notifier.update.current === notifier.update.latest) {
        return null;
      }

      return {
        current: notifier.update.current,
        latest: notifier.update.latest,
        type: notifier.update.type
      };
    }

    return null;
  } catch (error) {
    // 静默处理更新检查错误，不影响主功能
    return null;
  }
}

export default main;
