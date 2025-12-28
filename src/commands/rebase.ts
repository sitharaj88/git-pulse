import * as vscode from 'vscode';
import { GitService } from '../core/gitService';
import { RepositoryManager } from '../core/repositoryManager';
import { EventBus, EventType } from '../core/eventBus';
import { RebaseCommands } from '../constants/commands';
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

/**
 * Register all rebase-related commands
 */
export function registerRebaseCommands(
  context: vscode.ExtensionContext,
  gitService: GitService,
  repositoryManager: RepositoryManager,
  eventBus: EventBus
): void {
  // ==================== Start Rebase ====================
  const startRebaseCommand = vscode.commands.registerCommand(RebaseCommands.Start, async () => {
    try {
      const branches = await gitService.getLocalBranches();
      const currentBranch = await gitService.getCurrentBranch();

      const upstream = await vscode.window.showQuickPick(
        branches
          .filter(b => b.name !== currentBranch.name)
          .map(b => ({
            label: b.name,
            description: '',
            branch: b,
          })),
        {
          placeHolder: 'Select upstream branch to rebase onto',
        }
      );

      if (!upstream) {
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        `Are you sure you want to rebase current branch onto ${upstream.label}?`,
        'Rebase',
        'Cancel'
      );

      if (confirm !== 'Rebase') {
        return;
      }

      await executeWithProgress('Starting rebase...', async progress => {
        progress.report({ message: `Rebasing onto ${upstream.label}...` });
        await gitService.startRebase(upstream.label);
        logger.info(`Rebase started onto ${upstream.label}`);
        showInfoNotification(`Rebase started onto ${upstream.label}`);

        // Emit event
        eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to start rebase: ${errorMessage}`);
    }
  });
  context.subscriptions.push(startRebaseCommand);

  // ==================== Interactive Rebase ====================
  const interactiveRebaseCommand = vscode.commands.registerCommand(
    RebaseCommands.Interactive,
    async () => {
      try {
        const branches = await gitService.getLocalBranches();
        const currentBranch = await gitService.getCurrentBranch();

        const upstream = await vscode.window.showQuickPick(
          branches
            .filter(b => b.name !== currentBranch.name)
            .map(b => ({
              label: b.name,
              description: '',
              branch: b,
            })),
          {
            placeHolder: 'Select upstream branch for interactive rebase',
          }
        );

        if (!upstream) {
          return;
        }

        const confirm = await vscode.window.showWarningMessage(
          `Are you sure you want to start interactive rebase onto ${upstream.label}?`,
          'Rebase',
          'Cancel'
        );

        if (confirm !== 'Rebase') {
          return;
        }

        await executeWithProgress('Starting interactive rebase...', async progress => {
          progress.report({ message: `Starting interactive rebase onto ${upstream.label}...` });
          await gitService.startRebase(upstream.label, '-i');
          logger.info(`Interactive rebase started onto ${upstream.label}`);
          showInfoNotification(`Interactive rebase started onto ${upstream.label}`);

          // Emit event
          eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

          // Refresh repository state
          await repositoryManager.refreshCache();
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to start interactive rebase: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(interactiveRebaseCommand);

  // ==================== Continue Rebase ====================
  const continueRebaseCommand = vscode.commands.registerCommand(
    RebaseCommands.Continue,
    async () => {
      try {
        const status = await gitService.getRebaseStatus();

        if (!status.inProgress) {
          showInfoNotification('No rebase in progress');
          return;
        }

        const confirm = await vscode.window.showWarningMessage(
          'Are you sure you want to continue the rebase?',
          'Continue',
          'Cancel'
        );

        if (confirm !== 'Continue') {
          return;
        }

        await executeWithProgress('Continuing rebase...', async progress => {
          progress.report({ message: 'Continuing rebase...' });
          await gitService.continueRebase();
          logger.info('Rebase continued');
          showInfoNotification('Rebase continued successfully');

          // Emit event
          eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

          // Refresh repository state
          await repositoryManager.refreshCache();
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to continue rebase: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(continueRebaseCommand);

  // ==================== Abort Rebase ====================
  const abortRebaseCommand = vscode.commands.registerCommand(RebaseCommands.Abort, async () => {
    try {
      const status = await gitService.getRebaseStatus();

      if (!status.inProgress) {
        showInfoNotification('No rebase in progress');
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        'Are you sure you want to abort the rebase? This will undo all rebase changes.',
        'Abort',
        'Cancel'
      );

      if (confirm !== 'Abort') {
        return;
      }

      await executeWithProgress('Aborting rebase...', async progress => {
        progress.report({ message: 'Aborting rebase...' });
        await gitService.abortRebase();
        logger.info('Rebase aborted');
        showInfoNotification('Rebase aborted successfully');

        // Emit event
        eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to abort rebase: ${errorMessage}`);
    }
  });
  context.subscriptions.push(abortRebaseCommand);

  // ==================== Skip Rebase Commit ====================
  const skipRebaseCommitCommand = vscode.commands.registerCommand(RebaseCommands.Skip, async () => {
    try {
      const status = await gitService.getRebaseStatus();

      if (!status.inProgress) {
        showInfoNotification('No rebase in progress');
        return;
      }

      const confirm = await vscode.window.showWarningMessage(
        'Are you sure you want to skip the current commit during rebase?',
        'Skip',
        'Cancel'
      );

      if (confirm !== 'Skip') {
        return;
      }

      await executeWithProgress('Skipping commit...', async progress => {
        progress.report({ message: 'Skipping current commit...' });
        await gitService.skipRebaseCommit();
        logger.info('Rebase commit skipped');
        showInfoNotification('Commit skipped successfully');

        // Emit event
        eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to skip rebase commit: ${errorMessage}`);
    }
  });
  context.subscriptions.push(skipRebaseCommitCommand);

  // ==================== Edit Rebase Todo ====================
  const editRebaseTodoCommand = vscode.commands.registerCommand(
    RebaseCommands.EditTodo,
    async () => {
      try {
        const status = await gitService.getRebaseStatus();

        if (!status.inProgress) {
          showInfoNotification('No rebase in progress');
          return;
        }

        await executeWithProgress('Editing rebase todo...', async progress => {
          progress.report({ message: 'Opening rebase todo file...' });
          await gitService.editRebaseCommit();
          logger.info('Rebase todo file opened');
          showInfoNotification('Rebase todo file opened for editing');

          // Emit event
          eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());

          // Refresh repository state
          await repositoryManager.refreshCache();
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to edit rebase todo: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(editRebaseTodoCommand);

  logger.info('Rebase commands registered successfully');
}
