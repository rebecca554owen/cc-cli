import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import fs from "fs-extra";

import { DeleteCommandBase } from "../../utils/base-command.js";
import { createBackChoice, showInfo, showWarning, showSuccess } from "../../utils/ui.js";
import { getSiteIcon } from "../../utils/formatter.js";

/**
 * Codex配置删除命令
 */
class CodexDeleteCommand extends DeleteCommandBase {
  constructor() {
    super({
      commandType: 'codex',
      configField: 'codex',
      tokenField: 'OPENAI_API_KEY',
      displayName: 'API Key'
    });
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
        name: "🔑 删除站点中的API Key",
        value: "delete_key",
        short: "删除API Key",
      },
      {
        name: "🌐 删除站点中的服务提供商",
        value: "delete_provider",
        short: "删除服务提供商",
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
      case "delete_key":
        await this.deleteCredential(allConfigs);
        break;
      case "delete_provider":
        await this.deleteProvider(allConfigs);
        break;
      case "back":
        // 返回上级菜单
        break;
    }
  }

  /**
   * 删除站点中的服务提供商
   */
  async deleteProvider(allConfigs) {
    console.log(chalk.yellow.bold("\n🌐 删除服务提供商"));

    // 筛选出有codex配置且包含服务提供商的站点
    const providerSites = Object.entries(allConfigs.sites).filter(
      ([, config]) => config.codex && config.codex.model_providers
    );

    if (providerSites.length === 0) {
      showWarning("没有找到包含服务提供商的站点");
      return;
    }

    // 选择站点
    const siteChoices = providerSites.map(
      ([key, config]) => {
        const icon = getSiteIcon(key, config);
        const providerCount = Object.keys(
          config.codex.model_providers
        ).length;
        return {
          name: `${icon} ${key} (${providerCount}个提供商)`,
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
    const providers = siteConfig.codex.model_providers || {};

    // 检查提供商数量
    if (Object.keys(providers).length === 0) {
      showWarning("该站点没有服务提供商可删除");
      return;
    }

    // 选择要删除的提供商
    const providerChoices = Object.entries(providers).map(([key, provider]) => ({
      name: `🌐 ${provider.name || key} (${provider.base_url})`,
      value: key,
      short: provider.name || key,
    }));

    const { selectedProvider } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedProvider",
        message: "选择要删除的服务提供商：",
        choices: providerChoices,
        pageSize: 10,
      },
    ]);

    const provider = providers[selectedProvider];

    // 显示提供商信息
    console.log(chalk.white("\n📋 即将删除的服务提供商信息："));
    console.log(chalk.gray(`站点: ${selectedSite}`));
    console.log(chalk.gray(`提供商标识: ${selectedProvider}`));
    console.log(chalk.gray(`提供商名称: ${provider.name}`));
    console.log(chalk.gray(`API地址: ${provider.base_url}`));

    // 确认删除
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: chalk.yellow("确认删除此服务提供商?"),
        default: false,
      },
    ]);

    if (!confirmDelete) {
      showInfo("取消删除操作");
      return;
    }

    // 执行删除
    const spinner = ora("正在删除服务提供商...").start();

    try {
      // 删除服务提供商
      delete allConfigs.sites[selectedSite].codex.model_providers[selectedProvider];

      // 如果所有的服务提供商都被删除了，删除整个model_providers字段
      if (Object.keys(allConfigs.sites[selectedSite].codex.model_providers).length === 0) {
        delete allConfigs.sites[selectedSite].codex.model_providers;
      }

      // 保存配置文件
      await fs.writeFile(
        this.configManager.configPath,
        JSON.stringify(allConfigs, null, 2),
        "utf8"
      );

      spinner.succeed("服务提供商删除成功");
      showSuccess(`🎉 服务提供商 "${provider.name}" 已成功删除！`);
      showInfo(`使用 ${chalk.cyan("cc apix --list")} 查看剩余配置`);
    } catch (error) {
      spinner.fail();
      throw new Error(`删除服务提供商失败: ${error.message}`);
    }
  }
}

export default new CodexDeleteCommand();
