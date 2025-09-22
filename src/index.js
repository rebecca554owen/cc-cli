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
    // 检查版本更新（异步，不阻塞主流程）
    checkForUpdates();

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
  // 显示banner
  showBanner();

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
 */
function checkForUpdates() {
  try {
    const notifier = updateNotifier({
      pkg,
      updateCheckInterval: 1000 * 60 * 60 * 24, // 每天检查一次
      shouldNotifyInNpmScript: false
    });

    if (notifier.update) {
      const updateMessage = boxen(
        `🚀 ${chalk.cyan('新版本可用!')} ${chalk.dim(notifier.update.current)} → ${chalk.green(notifier.update.latest)}\n\n` +
        `运行 ${chalk.cyan('npm install -g @cjh0/cc-cli')} 更新到最新版本\n\n` +
        `更新日志: ${chalk.dim('https://github.com/cjh-store/cc/releases')}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'yellow',
          align: 'center'
        }
      );

      console.log(updateMessage);
    }
  } catch (error) {
    // 静默处理更新检查错误，不影响主功能
  }
}

module.exports = main;
