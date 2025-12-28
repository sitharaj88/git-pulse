import * as vscode from 'vscode';
import { RepositoryManager } from '../core/repositoryManager';
import { EventBus } from '../core/eventBus';

/**
 * Register status bar items
 * @param context - Extension context
 * @param repositoryManager - Repository manager instance
 * @param eventBus - Event bus instance
 */
export function registerStatusBarItems(
  context: vscode.ExtensionContext,
  repositoryManager: RepositoryManager,
  eventBus: EventBus
): void {
  // Branch status bar item
  const branchStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  branchStatusBarItem.command = 'gitNova.branch.switch';
  branchStatusBarItem.text = '$(git-branch) main';
  branchStatusBarItem.show();
  context.subscriptions.push(branchStatusBarItem);

  // Repository status status bar item
  const statusStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  statusStatusBarItem.text = '$(check) Clean';
  statusStatusBarItem.show();
  context.subscriptions.push(statusStatusBarItem);

  // Sync status status bar item
  const syncStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  syncStatusBarItem.command = 'gitNova.remote.fetch';
  syncStatusBarItem.text = '$(sync) Sync';
  syncStatusBarItem.show();
  context.subscriptions.push(syncStatusBarItem);

  console.log('Status bar items registered');
}
