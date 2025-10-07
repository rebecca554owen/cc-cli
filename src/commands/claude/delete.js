import inquirer from "inquirer";
import { DeleteCommandBase } from "../../utils/base-command.js";
import { createBackChoice } from "../../utils/ui.js";

/**
 * Claude API配置删除命令
 */
class ClaudeDeleteCommand extends DeleteCommandBase {
  constructor() {
    super({
      commandType: 'claude',
      configField: 'claude',
      tokenField: 'ANTHROPIC_AUTH_TOKEN',
      displayName: 'Token'
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
        await this.deleteCredential(allConfigs);
        break;
      case "back":
        // 返回上级菜单
        break;
    }
  }
}

export default new ClaudeDeleteCommand();
