import * as vscode from 'vscode';
import { RepositoryManager } from '../core/repositoryManager';
import { EventBus } from '../core/eventBus';

/**
 * Set up workspace listeners for file system and folder changes
 * @param context - Extension context
 * @param repositoryManager - Repository manager instance
 * @param eventBus - Event bus instance
 */
export function setupWorkspaceListeners(
  context: vscode.ExtensionContext,
  repositoryManager: RepositoryManager,
  eventBus: EventBus
): void {
  // Workspace folder changes
  const workspaceFoldersWatcher = vscode.workspace.onDidChangeWorkspaceFolders(async () => {
    await repositoryManager.refreshCache();
  });
  context.subscriptions.push(workspaceFoldersWatcher);

  // File system changes (git directory)
  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
    '**/.git/**',
    false,
    false,
    false
  );

  fileSystemWatcher.onDidChange(async () => {
    await repositoryManager.refreshCache();
    eventBus.emit('repository.changed' as any, repositoryManager.getActiveRepository());
  });

  context.subscriptions.push(fileSystemWatcher);

  // Text document changes
  const textDocumentWatcher = vscode.workspace.onDidChangeTextDocument(async () => {
    await repositoryManager.refreshCache('status');
  });
  context.subscriptions.push(textDocumentWatcher);

  // Text document save
  const documentSaveWatcher = vscode.workspace.onDidSaveTextDocument(async () => {
    await repositoryManager.refreshCache('status');
  });
  context.subscriptions.push(documentSaveWatcher);

  console.log('Workspace listeners set up');
}
