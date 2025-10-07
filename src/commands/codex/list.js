import { ListCommandBase } from '../../utils/base-command.js';
import { formatCodexConfigList } from '../../utils/formatter.js';

/**
 * Codex配置列表显示命令
 */
class CodexListCommand extends ListCommandBase {
  constructor() {
    super({
      commandType: 'codex',
      configField: 'codex',
      displayName: 'Codex',
      commandName: 'apix',
      validateMethod: 'validateCodexConfig',
      getCurrentMethod: 'getCurrentCodexConfig',
      formatMethod: formatCodexConfigList
    });
  }
}

export default new CodexListCommand();
