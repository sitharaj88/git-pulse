import * as vscode from 'vscode';
import { ConfigManager } from '../core/configManager';

/**
 * Set up configuration listeners
 * @param context - Extension context
 * @param configManager - Configuration manager instance
 */
export function setupConfigListeners(
  context: vscode.ExtensionContext,
  configManager: ConfigManager
): void {
  const configWatcher = vscode.workspace.onDidChangeConfiguration(async event => {
    if (event.affectsConfiguration('gitNova')) {
      await configManager.reload();
      // TODO: Apply configuration changes
    }
  });
  context.subscriptions.push(configWatcher);

  console.log('Config listeners set up');
}
