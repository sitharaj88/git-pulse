import * as vscode from 'vscode';
import { GitService } from '../core/gitService';
import { RepositoryManager } from '../core/repositoryManager';
import { EventBus, EventType } from '../core/eventBus';
import { StashCommands } from '../constants/commands';
import { Stash } from '../models/stash';
import { logger } from '../utils/logger';

/**
 * Show error notification to user
 */
function showErrorNotification(message: string): void {
  logger.error(message);
  vscode.window.showErrorMessage(message);
}

/**
 * Show info notification to user
 */
function showInfoNotification(message: string): void {
  logger.info(message);
  vscode.window.showInformationMessage(message);
}

/**
 * Execute command with progress indicator
 */
async function executeWithProgress<T>(
  title: string,
  operation: (progress: vscode.Progress<{ message?: string }>) => Promise<T>
): Promise<T> {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: title,
      cancellable: false,
    },
    operation
  );
}

function invalidateStashCache(repositoryManager: RepositoryManager): void {
  repositoryManager.invalidateCache('stashes');
}

async function resolveStashSelection(
  gitService: GitService,
  target?: number | Stash | { ref?: string }
): Promise<{ stash: Stash; index: number } | null> {
  const stashes = await gitService.getStashes();

  const findByIndex = (index: number): { stash: Stash; index: number } | null => {
    const ref = `stash@{${index}}`;
    const stash = stashes.find(s => s.ref === ref);
    return stash ? { stash, index } : null;
  };

  if (typeof target === 'number') {
    const match = findByIndex(target);
    if (match) {
      return match;
    }
  }

  if (target && typeof target === 'object' && 'ref' in target && target.ref) {
    const indexMatch = target.ref.match(/\{(\d+)\}/);
    if (indexMatch) {
      const idx = parseInt(indexMatch[1], 10);
      const match = findByIndex(idx);
      if (match) {
        return match;
      }
    }
  }

  if (stashes.length === 0) {
    showInfoNotification('No stashes available');
    return null;
  }

  const picked = await vscode.window.showQuickPick(
    stashes.map(s => ({
      label: `${s.ref}: ${s.message}`,
      description: `${s.branch} - ${s.date.toLocaleDateString()}`,
      stash: s,
    })),
    {
      placeHolder: 'Select stash',
    }
  );

  if (!picked) {
    return null;
  }

  const index = parseInt(picked.stash.ref.match(/\{(\d+)\}/)?.[1] || '0', 10);
  return { stash: picked.stash, index };
}

/**
 * Register all stash-related commands
 */
export function registerStashCommands(
  context: vscode.ExtensionContext,
  gitService: GitService,
  repositoryManager: RepositoryManager,
  eventBus: EventBus
): void {
  // ==================== Create Stash ====================
  const createStashCommand = vscode.commands.registerCommand(StashCommands.Create, async () => {
    try {
      const message = await vscode.window.showInputBox({
        prompt: 'Enter stash message (optional)',
        placeHolder: 'WIP: Work in progress',
      });

      const includeUntracked = await vscode.window.showQuickPick(
        [
          { label: 'Include untracked files', description: 'Also stash untracked files' },
          { label: 'Only tracked files', description: 'Only stash tracked files', picked: true },
        ],
        {
          placeHolder: 'Select stash options',
        }
      );

      if (!includeUntracked) {
        return;
      }

      await executeWithProgress('Creating stash...', async progress => {
        progress.report({ message: 'Creating stash...' });
        const stash = await gitService.createStash(
          message,
          includeUntracked.label === 'Include untracked files'
        );
        logger.info(`Stash created: ${stash.ref}`);
        showInfoNotification(`Stash created successfully: ${stash.ref}`);

        // Emit event
        eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

        invalidateStashCache(repositoryManager);

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to create stash: ${errorMessage}`);
    }
  });
  context.subscriptions.push(createStashCommand);

  // ==================== List Stashes ====================
  const listStashesCommand = vscode.commands.registerCommand(StashCommands.List, async () => {
    try {
      await executeWithProgress('Loading stashes...', async progress => {
        progress.report({ message: 'Fetching stashes...' });
        const stashes = await gitService.getStashes();
        showStashes(stashes);
        showInfoNotification(`Found ${stashes.length} stashes`);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to list stashes: ${errorMessage}`);
    }
  });
  context.subscriptions.push(listStashesCommand);

  // ==================== Apply Stash ====================
  const applyStashCommand = vscode.commands.registerCommand(StashCommands.Apply, async target => {
    try {
      const selection = await resolveStashSelection(gitService, target);
      if (!selection) {
        return;
      }

      await executeWithProgress('Applying stash...', async progress => {
        progress.report({ message: `Applying ${selection.stash.ref}...` });
        await gitService.applyStash(selection.index);
        logger.info(`Stash applied: ${selection.stash.ref}`);
        showInfoNotification(`Stash ${selection.stash.ref} applied successfully`);

        // Emit event
        eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

        invalidateStashCache(repositoryManager);

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to apply stash: ${errorMessage}`);
    }
  });
  context.subscriptions.push(applyStashCommand);

  // ==================== Pop Stash ====================
  const popStashCommand = vscode.commands.registerCommand(StashCommands.Pop, async target => {
    try {
      const selection = await resolveStashSelection(gitService, target);
      if (!selection) {
        return;
      }

      await executeWithProgress('Popping stash...', async progress => {
        progress.report({ message: `Popping ${selection.stash.ref}...` });
        await gitService.popStash(selection.index);
        logger.info(`Stash popped: ${selection.stash.ref}`);
        showInfoNotification(`Stash ${selection.stash.ref} popped successfully`);

        // Emit event
        eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

        invalidateStashCache(repositoryManager);

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to pop stash: ${errorMessage}`);
    }
  });
  context.subscriptions.push(popStashCommand);

  // ==================== Drop Stash ====================
  const dropStashCommand = vscode.commands.registerCommand(StashCommands.Drop, async target => {
    try {
      const selection = await resolveStashSelection(gitService, target);
      if (!selection) {
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to drop stash ${selection.stash.ref}?`,
        'Drop',
        'Cancel'
      );

      if (confirm !== 'Drop') {
        return;
      }

      await executeWithProgress('Dropping stash...', async progress => {
        progress.report({ message: `Dropping ${selection.stash.ref}...` });
        await gitService.dropStash(selection.index);
        logger.info(`Stash dropped: ${selection.stash.ref}`);
        showInfoNotification(`Stash ${selection.stash.ref} dropped successfully`);

        // Emit event
        eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

        invalidateStashCache(repositoryManager);

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to drop stash: ${errorMessage}`);
    }
  });
  context.subscriptions.push(dropStashCommand);

  // ==================== Clear Stashes ====================
  const clearStashesCommand = vscode.commands.registerCommand(StashCommands.Clear, async () => {
    try {
      const stashes = await gitService.getStashes();

      if (stashes.length === 0) {
        showInfoNotification('No stashes to clear');
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to clear all ${stashes.length} stashes?`,
        'Clear All',
        'Cancel'
      );

      if (confirm !== 'Clear All') {
        return;
      }

      await executeWithProgress('Clearing stashes...', async progress => {
        progress.report({ message: 'Clearing all stashes...' });
        await gitService.clearStashes();
        logger.info('All stashes cleared');
        showInfoNotification('All stashes cleared successfully');

        // Emit event
        eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

        invalidateStashCache(repositoryManager);

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to clear stashes: ${errorMessage}`);
    }
  });
  context.subscriptions.push(clearStashesCommand);

  logger.info('Stash commands registered successfully');
}

/**
 * Show stashes in a new document
 */
function showStashes(stashes: any[]): void {
  if (stashes.length === 0) {
    vscode.window.showInformationMessage('No stashes found');
    return;
  }

  const content = [
    'Stashes',
    `Total: ${stashes.length}`,
    '',
    ...stashes.map((stash, index) =>
      [
        `${index + 1}. ${stash.ref}`,
        `   Message: ${stash.message}`,
        `   Branch: ${stash.branch}`,
        `   Date: ${stash.date.toLocaleString()}`,
        `   Commit: ${stash.commit.shortHash}`,
      ].flat()
    ),
  ].join('\n');

  vscode.workspace
    .openTextDocument({
      content,
      language: 'plaintext',
    })
    .then((doc: vscode.TextDocument) => vscode.window.showTextDocument(doc));
}
