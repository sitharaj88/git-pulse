import * as vscode from 'vscode';
import { RepositoryManager } from '../core/repositoryManager';
import { EventBus, EventType } from '../core/eventBus';

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

  const updateFromRepository = (): void => {
    const repo = repositoryManager.getActiveRepository();

    if (!repo) {
      branchStatusBarItem.text = '$(git-branch) No repo';
      statusStatusBarItem.text = '$(dash) No repository';
      return;
    }

    const branchName = repo.currentBranch?.name || 'detached';
    branchStatusBarItem.text = `$(git-branch) ${branchName}`;

    const hasChanges = (repo.status?.files?.length || 0) > 0;
    statusStatusBarItem.text = hasChanges ? '$(alert) Changes' : '$(check) Clean';
  };

  // Initial paint
  updateFromRepository();

  // Update on branch and repository changes
  const disposables = [
    eventBus.on(EventType.RepositoryDetected, updateFromRepository),
    eventBus.on(EventType.RepositoryChanged, updateFromRepository),
    eventBus.on(EventType.BranchSwitched, (data: { branchName: string }) => {
      branchStatusBarItem.text = `$(git-branch) ${data.branchName}`;
      updateFromRepository();
    }),
  ];

  context.subscriptions.push(...disposables);
}
