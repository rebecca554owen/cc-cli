import { ListCommandBase } from '../../utils/base-command.js';
import { formatConfigList } from '../../utils/formatter.js';

/**
 * Claude API配置列表显示命令
 */
class ClaudeListCommand extends ListCommandBase {
  constructor() {
    super({
      commandType: 'claude',
      configField: 'claude',
      displayName: 'Claude',
      commandName: 'api',
      validateMethod: 'validateClaudeConfig',
      getCurrentMethod: 'getCurrentConfig',
      formatMethod: formatConfigList
    });
  }
}

export default new ClaudeListCommand();