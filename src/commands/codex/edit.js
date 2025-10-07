import { EditCommandBase } from '../../utils/base-command.js';

/**
 * Codex配置编辑命令
 */
class CodexEditCommand extends EditCommandBase {
  constructor() {
    super({
      commandType: 'codex',
      commandName: 'apix'
    });
  }
}

export default new CodexEditCommand();