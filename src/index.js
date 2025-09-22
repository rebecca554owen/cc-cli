const chalk = require("chalk");
const figlet = require("figlet");
const inquirer = require("inquirer");
const boxen = require("boxen");
const updateNotifier = require("update-notifier");

const CommandRegistry = require("./commands");
const { showBanner, showMainMenu } = require("./utils/ui");
const pkg = require("../package.json");

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
  // 检查更新信息
  const updateInfo = checkForUpdates();

  // 显示banner（如果有更新会一起显示）
  showBanner(updateInfo);

  while (true) {
    try {
      const choice = await showMainMenu();

      if (choice === "exit") {
        console.log(chalk.green("👋 再见!!!"));
        process.exit(0);
      }

      if (choice === "api") {
        await commandRegistry.executeCommand("api", []);
      } else if (choice === "status") {
        await commandRegistry.executeCommand("status", []);
      } else if (choice === "help") {
        await commandRegistry.executeCommand("help", []);
      }

      // 询问是否继续
      const { continueChoice } = await inquirer.prompt([
        {
          type: "confirm",
          name: "continueChoice",
          message: "是否继续使用？",
          default: true,
        },
      ]);

      if (!continueChoice) {
        console.log(chalk.green("👋 再见！"));
        process.exit(0);
      }
    } catch (error) {
      console.error(chalk.red("❌ 操作失败:"), error.message);

      const { continueOnError } = await inquirer.prompt([
        {
          type: "confirm",
          name: "continueOnError",
          message: "发生错误，是否继续？",
          default: true,
        },
      ]);

      if (!continueOnError) {
        process.exit(1);
      }
    }
  }
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

module.exports = main;
