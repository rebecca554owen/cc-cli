import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import fs from "fs-extra";

import ConfigManager from "../../core/ConfigManager.js";
import {
  showError,
  showSuccess,
  showInfo,
  showWarning,
  createBackChoice,
} from "../../utils/ui.js";
import { formatError, getSiteIcon } from "../../utils/formatter.js";

/**
 * API配置删除命令
 */
class DeleteCommand {
  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * 执行删除配置
   * @param {Array} args 参数
   */
  async execute(args = []) {
    try {
      showInfo("🗑️  删除API配置");

      // 检查配置文件是否存在
      if (!(await this.configManager.configExists())) {
        showError("配置文件不存在");
        showInfo("请先使用 cc api --add 添加配置");
        return;
      }

      // 读取所有配置
      const allConfigs = await this.configManager.getAllConfigs();

      if (!this.configManager.validateConfig(allConfigs)) {
        showError("配置文件格式无效");
        return;
      }

      // 检查是否有配置可删除
      if (!allConfigs.sites || Object.keys(allConfigs.sites).length === 0) {
        showWarning("没有可删除的配置");
        return;
      }

      // 显示删除选项
      await this.showDeleteMenu(allConfigs);
    } catch (error) {
      showError(`删除配置操作失败: ${error.message}`);
    }
  }

  /**
   * 显示删除菜单
   */
  async showDeleteMenu(allConfigs) {
    const choices = [
      {
        name: "🗑️  删除整个站点",
        value: "delete_site",
        short: "删除站点",
      },
      {
        name: "🔑 删除站点中的Token",
        value: "delete_token",
        short: "删除Token",
      },
      new inquirer.Separator(),
      createBackChoice("back"),
    ];

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "请选择删除操作：",
        choices,
        pageSize: 10,
      },
    ]);

    switch (action) {
      case "delete_site":
        await this.deleteSite(allConfigs);
        break;
      case "delete_token":
        await this.deleteToken(allConfigs);
        break;
      case "back":
        showInfo("返回上级菜单");
        break;
    }
  }

  /**
   * 删除整个站点
   */
  async deleteSite(allConfigs) {
    console.log(chalk.red.bold("\n🗑️  删除站点"));
    console.log(chalk.yellow("⚠️  此操作将删除站点及其所有Token配置"));

    // 选择要删除的站点
    const siteChoices = Object.entries(allConfigs.sites).map(
      ([key, config]) => {
        const icon = getSiteIcon(key, config);
        const tokenCount = Object.keys(
          config.config?.env?.ANTHROPIC_AUTH_TOKEN || {}
        ).length;
        return {
          name: `${icon} ${key} (${tokenCount}个Token)`,
          value: key,
          short: key,
        };
      }
    );

    const { selectedSite } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedSite",
        message: "选择要删除的站点：",
        choices: siteChoices,
        pageSize: 10,
      },
    ]);

    const siteConfig = allConfigs.sites[selectedSite];

    // 显示站点信息
    console.log(chalk.white("\n📋 即将删除的站点信息："));
    console.log(chalk.gray(`站点标识: ${selectedSite}`));
    console.log(
      chalk.gray(
        `ANTHROPIC_BASE_URL: ${siteConfig.config?.env?.ANTHROPIC_BASE_URL}`
      )
    );
    console.log(
      chalk.gray(
        `Token数量: ${
          Object.keys(siteConfig.config?.env?.ANTHROPIC_AUTH_TOKEN || {}).length
        }个`
      )
    );

    // 检查是否为当前使用的站点
    const currentConfig = await this.configManager.getCurrentConfig();
    const isCurrentSite = currentConfig && currentConfig.site === selectedSite;

    if (isCurrentSite) {
      console.log(chalk.yellow("\n⚠️  警告: 这是当前正在使用的站点！"));
      console.log(chalk.yellow("删除后需要重新选择其他站点配置"));
    }

    // 确认删除
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: chalk.red("确认删除此站点？此操作不可撤销！"),
        default: false,
      },
    ]);

    if (!confirmDelete) {
      showInfo("取消删除操作");
      return;
    }

    // 执行删除
    const spinner = ora("正在删除站点...").start();

    try {
      // 删除站点配置
      delete allConfigs.sites[selectedSite];

      // 保存配置文件
      await fs.writeFile(
        this.configManager.configPath,
        JSON.stringify(allConfigs, null, 2),
        "utf8"
      );

      // 如果删除的是当前站点，清空当前配置
      if (isCurrentSite) {
        await fs.remove(this.configManager.currentConfigPath);
      }

      spinner.succeed("站点删除成功");

      showSuccess(`🎉 站点 "${selectedSite}" 已成功删除！`);

      if (isCurrentSite) {
        showWarning("当前配置已清空，请使用 cc api 重新选择配置");
      }

      showInfo(`使用 ${chalk.cyan("cc api --list")} 查看剩余配置`);
    } catch (error) {
      spinner.fail();
      throw new Error(`删除站点失败: ${error.message}`);
    }
  }

  /**
   * 删除站点中的Token
   */
  async deleteToken(allConfigs) {
    console.log(chalk.yellow.bold("\n🔑 删除Token"));

    // 选择站点
    const siteChoices = Object.entries(allConfigs.sites).map(
      ([key, config]) => {
        const icon = getSiteIcon(key, config);
        const tokenCount = Object.keys(
          config.config?.env?.ANTHROPIC_AUTH_TOKEN || {}
        ).length;
        return {
          name: `${icon} ${key} (${tokenCount}个Token)`,
          value: key,
          short: key,
        };
      }
    );

    const { selectedSite } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedSite",
        message: "选择站点：",
        choices: siteChoices,
        pageSize: 10,
      },
    ]);

    const siteConfig = allConfigs.sites[selectedSite];
    const tokens = siteConfig.config?.env?.ANTHROPIC_AUTH_TOKEN || {};

    // 检查Token数量
    if (Object.keys(tokens).length === 0) {
      showWarning("该站点没有Token可删除");
      return;
    }

    if (Object.keys(tokens).length === 1) {
      showWarning("该站点只有1个Token，删除后站点将无法使用");
      console.log(chalk.gray('建议使用"删除站点"功能删除整个站点'));

      const { confirmDeleteLast } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmDeleteLast",
          message: "确认删除最后一个Token？",
          default: false,
        },
      ]);

      if (!confirmDeleteLast) {
        showInfo("取消删除操作");
        return;
      }
    }

    // 选择要删除的Token
    const tokenChoices = Object.entries(tokens).map(([name, token]) => ({
      name: `🔑 ${name} (${token.substring(0, 15)}...)`,
      value: name,
      short: name,
    }));

    const { selectedToken } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedToken",
        message: "选择要删除的Token：",
        choices: tokenChoices,
        pageSize: 10,
      },
    ]);

    // 显示Token信息
    console.log(chalk.white("\n📋 即将删除的Token信息："));
    console.log(chalk.gray(`站点: ${selectedSite}`));
    console.log(chalk.gray(`Token名称: ${selectedToken}`));
    console.log(
      chalk.gray(`Token值: ${tokens[selectedToken].substring(0, 20)}...`)
    );

    // 检查是否为当前使用的Token
    const currentConfig = await this.configManager.getCurrentConfig();
    const isCurrentToken =
      currentConfig &&
      currentConfig.site === selectedSite &&
      currentConfig.token === tokens[selectedToken];

    if (isCurrentToken) {
      console.log(chalk.yellow("\n⚠️  警告: 这是当前正在使用的Token!!!"));
      console.log(chalk.yellow("删除后需要重新选择其他Token"));
    }

    // 确认删除
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: chalk.yellow("确认删除此Token?"),
        default: false,
      },
    ]);

    if (!confirmDelete) {
      showInfo("取消删除操作");
      return;
    }

    // 执行删除
    const spinner = ora("正在删除Token...").start();

    try {
      // 删除Token
      delete allConfigs.sites[selectedSite].config.env.ANTHROPIC_AUTH_TOKEN[
        selectedToken
      ];

      // 保存配置文件
      await fs.writeFile(
        this.configManager.configPath,
        JSON.stringify(allConfigs, null, 2),
        "utf8"
      );

      // 如果删除的是当前Token，清空当前配置
      if (isCurrentToken) {
        await fs.remove(this.configManager.currentConfigPath);
      }

      spinner.succeed("Token删除成功");

      showSuccess(`🎉 Token "${selectedToken}" 已成功删除！`);

      if (isCurrentToken) {
        showWarning("当前配置已清空，请使用 cc api 重新选择配置");
      }

      showInfo(`使用 ${chalk.cyan("cc api --list")} 查看剩余配置`);
    } catch (error) {
      spinner.fail();
      throw new Error(`删除Token失败: ${error.message}`);
    }
  }
}

export default new DeleteCommand();
