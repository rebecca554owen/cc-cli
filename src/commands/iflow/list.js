import chalk from 'chalk';
import { ListCommandBase } from '../../utils/base-command.js';
import { formatIflowConfigList } from '../../utils/formatter.js';

/**
 * iFlow API配置列表显示命令
 */
class IflowListCommand extends ListCommandBase {
  constructor() {
    super({
      commandType: 'iflow',
      configField: 'iflow',
      displayName: 'iFlow',
      commandName: 'apii',
      validateMethod: 'validateIflowConfig',
      formatMethod: formatIflowConfigList
    });
  }
}

export default new IflowListCommand();