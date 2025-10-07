import { EditCommandBase } from '../../utils/base-command.js';

/**
 * Claude API配置编辑命令
 */
class ClaudeEditCommand extends EditCommandBase {
  constructor() {
    super({
      commandType: 'claude',
      commandName: 'api'
    });
  }
}

export default new ClaudeEditCommand();