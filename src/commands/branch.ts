import * as vscode from 'vscode';
import { GitService } from '../core/gitService';
import { RepositoryManager } from '../core/repositoryManager';
import { EventBus, EventType } from '../core/eventBus';
import { BranchCommands } from '../constants/commands';
import { logger } from '../utils/logger';

/**
 * Validate branch name according to git rules
 * @param name - Branch name to validate
 * @returns Error message if invalid, null if valid
 */
function validateBranchName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Branch name cannot be empty';
  }

  const trimmedName = name.trim();

  // Git branch name rules
  const invalidPattern = /[^\w\-./]/;
  const startsWithDot = trimmedName.startsWith('.');
  const endsWithSlash = trimmedName.endsWith('/');
  const consecutiveDots = /\.\./;
  const startsWithDash = trimmedName.startsWith('-');
  const containsSpace = /\s/;

  if (containsSpace.test(trimmedName)) {
    return 'Branch name cannot contain spaces';
  }
  if (invalidPattern.test(trimmedName)) {
    return 'Branch name contains invalid characters';
  }
  if (startsWithDot) {
    return 'Branch name cannot start with a dot';
  }
  if (endsWithSlash) {
    return 'Branch name cannot end with a slash';
  }
  if (consecutiveDots.test(trimmedName)) {
    return 'Branch name cannot contain consecutive dots';
  }
  if (startsWithDash) {
    return 'Branch name cannot start with a dash';
  }

  // Cannot have HEAD or .lock in name
  if (trimmedName === 'HEAD' || trimmedName.includes('.lock')) {
    return 'Branch name cannot be HEAD or contain .lock';
  }

  return null;
}

/**
 * Show error notification to user
 * @param message - Error message
 * @param actions - Optional actions to display
 */
function showErrorNotification(
  message: string,
  actions?: { title: string; action: () => void }[]
): void {
  logger.error(message);
  if (actions && actions.length > 0) {
    vscode.window
      .showErrorMessage(message, ...actions.map(a => a.title))
      .then((selection: string | undefined) => {
        const action = actions.find(a => a.title === selection);
        if (action) {
          action.action();
        }
      });
  } else {
    vscode.window.showErrorMessage(message);
  }
}

/**
 * Show info notification to user
 * @param message - Info message
 */
function showInfoNotification(message: string): void {
  logger.info(message);
  vscode.window.showInformationMessage(message);
}

/**
 * Execute command with progress indicator
 * @param title - Progress title
 * @param operation - Async operation to execute
 * @returns Result of the operation
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
 * Register all branch-related commands
 * @param context - VSCode extension context
 * @param gitService - Git service instance
 * @param repositoryManager - Repository manager instance
 * @param eventBus - Event bus instance
 */
export function registerBranchCommands(
  context: vscode.ExtensionContext,
  gitService: GitService,
  repositoryManager: RepositoryManager,
  eventBus: EventBus
): void {
  // ==================== Create Branch ====================
  const createBranchCommand = vscode.commands.registerCommand(
    BranchCommands.Create,
    async (name?: string) => {
      try {
        // Prompt for branch name if not provided
        const branchName =
          name ||
          (await vscode.window.showInputBox({
            prompt: 'Enter branch name',
            placeHolder: 'feature/new-feature',
            validateInput: validateBranchName,
          }));

        if (!branchName) {
          return;
        }

        // Prompt for starting point
        const startPoint = await vscode.window.showInputBox({
          prompt: 'Enter starting point (optional)',
          placeHolder: 'HEAD',
          value: 'HEAD',
        });

        await executeWithProgress('Creating branch...', async progress => {
          progress.report({ message: `Creating branch '${branchName}'...` });
          const branch = await gitService.createBranch(branchName, startPoint);
          logger.info(`Branch created: ${branchName}`);
          showInfoNotification(`Branch '${branchName}' created successfully`);

          // Emit event
          eventBus.emit(EventType.BranchCreated, { branch });

          // Refresh repository state
          await repositoryManager.refreshCache('branches');
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to create branch: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(createBranchCommand);

  // ==================== Delete Branch ====================
  const deleteBranchCommand = vscode.commands.registerCommand(
    BranchCommands.Delete,
    async (name?: string) => {
      try {
        // Get branches if name not provided
        const branches = await gitService.getLocalBranches();
        const branchName =
          name ||
          (
            await vscode.window.showQuickPick(
              branches
                .filter(b => !b.isCurrent)
                .map(b => ({
                  label: b.name,
                  description: b.isCurrent ? '(current)' : '',
                  branch: b,
                })),
              {
                placeHolder: 'Select branch to delete',
              }
            )
          )?.label;

        if (!branchName) {
          return;
        }

        // Confirm deletion
        const confirm = await vscode.window.showWarningMessage(
          `Are you sure you want to delete branch '${branchName}'?`,
          'Delete',
          'Cancel'
        );

        if (confirm !== 'Delete') {
          return;
        }

        // Ask if force delete
        const force = await vscode.window.showQuickPick(
          [
            { label: 'Safe delete', description: 'Delete only if merged', picked: true },
            { label: 'Force delete', description: 'Delete even if unmerged' },
          ],
          {
            placeHolder: 'Select delete mode',
          }
        );

        if (!force) {
          return;
        }

        await executeWithProgress('Deleting branch...', async progress => {
          progress.report({ message: `Deleting branch '${branchName}'...` });
          await gitService.deleteBranch(branchName, force.label === 'Force delete');
          logger.info(`Branch deleted: ${branchName}`);
          showInfoNotification(`Branch '${branchName}' deleted successfully`);

          // Emit event
          eventBus.emit(EventType.BranchDeleted, { branchName });

          // Refresh repository state
          await repositoryManager.refreshCache('branches');
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to delete branch: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(deleteBranchCommand);

  // ==================== Switch Branch ====================
  const switchBranchCommand = vscode.commands.registerCommand(
    BranchCommands.Switch,
    async (name?: string) => {
      try {
        // Get branches if name not provided
        const branches = await gitService.getLocalBranches();
        const branchName =
          name ||
          (
            await vscode.window.showQuickPick(
              branches.map(b => ({
                label: b.name,
                description: b.isCurrent ? '(current)' : '',
                branch: b,
              })),
              {
                placeHolder: 'Select branch to switch to',
              }
            )
          )?.label;

        if (!branchName) {
          return;
        }

        // Check if there are uncommitted changes
        const status = await gitService.getWorkingTreeStatus();
        if (status.files.length > 0) {
          const action = await vscode.window.showWarningMessage(
            'You have uncommitted changes. What would you like to do?',
            'Stash and switch',
            'Discard changes',
            'Cancel'
          );

          if (action === 'Stash and switch') {
            const stashMessage = await vscode.window.showInputBox({
              prompt: 'Enter stash message (optional)',
              placeHolder: `Auto-stash before switching to ${branchName}`,
            });

            const includeUntracked = await vscode.window.showQuickPick(
              [
                { label: 'Include untracked files', description: 'Also stash untracked files' },
                {
                  label: 'Only tracked files',
                  description: 'Only stash tracked files',
                  picked: true,
                },
              ],
              {
                placeHolder: 'Select stash options',
              }
            );

            if (!includeUntracked) {
              return;
            }

            await gitService.createStash(
              stashMessage,
              includeUntracked.label === 'Include untracked files'
            );
          } else if (action === 'Discard changes') {
            const discardConfirm = await vscode.window.showWarningMessage(
              'This will discard all uncommitted changes. Are you sure?',
              'Discard',
              'Cancel'
            );
            if (discardConfirm !== 'Discard') {
              return;
            }
            await gitService.discardChanges(status.files.map(f => f.path));
          } else {
            return;
          }
        }

        await executeWithProgress('Switching branch...', async progress => {
          progress.report({ message: `Switching to '${branchName}'...` });
          await gitService.switchBranch(branchName);
          logger.info(`Switched to branch: ${branchName}`);
          showInfoNotification(`Switched to branch '${branchName}'`);

          // Emit event
          eventBus.emit(EventType.BranchSwitched, { branchName });

          // Refresh repository state
          await repositoryManager.refreshCache();
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to switch branch: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(switchBranchCommand);

  // ==================== Rename Branch ====================
  const renameBranchCommand = vscode.commands.registerCommand(
    BranchCommands.Rename,
    async (oldName?: string) => {
      try {
        // Get current branch if oldName not provided
        const currentBranch = await gitService.getCurrentBranch();
        const branchToRename = oldName || currentBranch.name;

        // Prompt for new name
        const newName = await vscode.window.showInputBox({
          prompt: 'Enter new branch name',
          placeHolder: 'renamed-branch',
          validateInput: validateBranchName,
        });

        if (!newName || newName === branchToRename) {
          return;
        }

        await executeWithProgress('Renaming branch...', async progress => {
          progress.report({ message: `Renaming '${branchToRename}' to '${newName}'...` });
          await gitService.renameBranch(branchToRename, newName);
          logger.info(`Branch renamed: ${branchToRename} -> ${newName}`);
          showInfoNotification(`Branch renamed to '${newName}'`);

          // Refresh repository state
          await repositoryManager.refreshCache('branches');
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to rename branch: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(renameBranchCommand);

  // ==================== Checkout Branch/Commit ====================
  const checkoutCommand = vscode.commands.registerCommand(
    BranchCommands.Checkout,
    async (ref?: string) => {
      try {
        // Prompt for ref if not provided
        const refToCheckout =
          ref ||
          (await vscode.window.showInputBox({
            prompt: 'Enter branch name, tag, or commit hash',
            placeHolder: 'main',
          }));

        if (!refToCheckout) {
          return;
        }

        await executeWithProgress('Checking out...', async progress => {
          progress.report({ message: `Checking out '${refToCheckout}'...` });
          await gitService.switchBranch(refToCheckout);
          logger.info(`Checked out: ${refToCheckout}`);
          showInfoNotification(`Checked out '${refToCheckout}'`);

          // Refresh repository state
          await repositoryManager.refreshCache();
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to checkout: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(checkoutCommand);

  // ==================== Merge Branch ====================
  const mergeBranchCommand = vscode.commands.registerCommand(
    BranchCommands.Merge,
    async (name?: string) => {
      try {
        // Get branches if name not provided
        const currentBranch = await gitService.getCurrentBranch();
        const branches = await gitService.getLocalBranches();
        const branchName =
          name ||
          (
            await vscode.window.showQuickPick(
              branches
                .filter(b => b.name !== currentBranch.name)
                .map(b => ({
                  label: b.name,
                  description: '',
                  branch: b,
                })),
              {
                placeHolder: 'Select branch to merge into current',
              }
            )
          )?.label;

        if (!branchName) {
          return;
        }

        // Select merge strategy
        const strategy = await vscode.window.showQuickPick(
          [
            { label: 'Default merge', description: 'Use default merge strategy', picked: true },
            { label: 'Squash merge', description: 'Squash all commits into one' },
            { label: 'Fast-forward only', description: 'Only merge if fast-forward is possible' },
          ],
          {
            placeHolder: 'Select merge strategy',
          }
        );

        if (!strategy) {
          return;
        }

        await executeWithProgress('Merging branch...', async progress => {
          progress.report({ message: `Merging '${branchName}' into '${currentBranch.name}'...` });

          const mergeOptions =
            strategy.label === 'Squash merge'
              ? { squash: true }
              : strategy.label === 'Fast-forward only'
                ? { fastForwardOnly: true }
                : undefined;

          await gitService.merge(branchName, mergeOptions);

          logger.info(`Merged branch: ${branchName}`);
          showInfoNotification(`Merged branch '${branchName}' successfully`);

          // Emit event
          eventBus.emit(EventType.MergeCompleted, { branch: branchName });

          // Refresh repository state
          await repositoryManager.refreshCache();
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to merge branch: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(mergeBranchCommand);

  // ==================== Compare Branches ====================
  const compareBranchesCommand = vscode.commands.registerCommand(
    BranchCommands.Compare,
    async () => {
      try {
        const branches = await gitService.getLocalBranches();

        // Select source branch
        const sourceBranch = await vscode.window.showQuickPick(
          branches.map(b => ({
            label: b.name,
            description: b.isCurrent ? '(current)' : '',
            branch: b,
          })),
          {
            placeHolder: 'Select source branch',
          }
        );

        if (!sourceBranch) {
          return;
        }

        // Select target branch
        const targetBranch = await vscode.window.showQuickPick(
          branches
            .filter(b => b.name !== sourceBranch.label)
            .map(b => ({
              label: b.name,
              description: b.isCurrent ? '(current)' : '',
              branch: b,
            })),
          {
            placeHolder: 'Select target branch to compare with',
          }
        );

        if (!targetBranch) {
          return;
        }

        const diff = await gitService.compareBranches(sourceBranch.label, targetBranch.label);
        showInfoNotification(
          `Compared '${sourceBranch.label}' with '${targetBranch.label}': +${diff.additions}, -${diff.deletions}`
        );
        logger.info(
          `Compared branches: ${sourceBranch.label} vs ${targetBranch.label} (+${diff.additions}/-${diff.deletions})`
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to compare branches: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(compareBranchesCommand);

  // ==================== Fetch Remote Branches ====================
  const fetchBranchesCommand = vscode.commands.registerCommand(BranchCommands.Fetch, async () => {
    try {
      await executeWithProgress('Fetching remote branches...', async progress => {
        progress.report({ message: 'Fetching from remote...' });
        await gitService.fetch();
        logger.info('Remote branches fetched');
        showInfoNotification('Remote branches fetched successfully');

        // Emit event
        eventBus.emit(EventType.RemoteUpdated, {});

        // Refresh repository state
        await repositoryManager.refreshCache('branches');
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to fetch branches: ${errorMessage}`);
    }
  });
  context.subscriptions.push(fetchBranchesCommand);

  // ==================== Push Branch ====================
  const pushBranchCommand = vscode.commands.registerCommand(
    BranchCommands.Push,
    async (name?: string) => {
      try {
        const currentBranch = await gitService.getCurrentBranch();
        const branchName = name || currentBranch.name;

        // Ask for remote
        const remote = await vscode.window.showInputBox({
          prompt: 'Enter remote name',
          placeHolder: 'origin',
          value: 'origin',
        });

        if (!remote) {
          return;
        }

        // Ask if force push
        const force = await vscode.window.showQuickPick(
          [
            { label: 'Normal push', description: 'Push normally', picked: true },
            { label: 'Force push', description: 'Force push (use with caution)' },
          ],
          {
            placeHolder: 'Select push mode',
          }
        );

        if (!force) {
          return;
        }

        await executeWithProgress('Pushing branch...', async progress => {
          progress.report({ message: `Pushing '${branchName}' to '${remote}'...` });
          await gitService.push(remote, branchName, force.label === 'Force push');
          logger.info(`Branch pushed: ${branchName}`);
          showInfoNotification(`Branch '${branchName}' pushed successfully`);

          // Emit event
          eventBus.emit(EventType.PushCompleted, { branch: branchName, remote });

          // Refresh repository state
          await repositoryManager.refreshCache('branches');
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to push branch: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(pushBranchCommand);

  // ==================== Pull Branch ====================
  const pullBranchCommand = vscode.commands.registerCommand(BranchCommands.Pull, async () => {
    try {
      // Ask for remote
      const remote = await vscode.window.showInputBox({
        prompt: 'Enter remote name',
        placeHolder: 'origin',
        value: 'origin',
      });

      if (!remote) {
        return;
      }

      // Ask for branch
      const currentBranch = await gitService.getCurrentBranch();
      const branch = await vscode.window.showInputBox({
        prompt: 'Enter branch name',
        placeHolder: currentBranch.name,
        value: currentBranch.name,
      });

      if (!branch) {
        return;
      }

      await executeWithProgress('Pulling branch...', async progress => {
        progress.report({ message: `Pulling '${branch}' from '${remote}'...` });
        await gitService.pull(remote, branch);
        logger.info(`Branch pulled: ${branch}`);
        showInfoNotification(`Branch '${branch}' pulled successfully`);

        // Emit event
        eventBus.emit(EventType.PullCompleted, { branch, remote });

        // Refresh repository state
        await repositoryManager.refreshCache();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to pull branch: ${errorMessage}`);
    }
  });
  context.subscriptions.push(pullBranchCommand);

  // ==================== Track Branch ====================
  const trackBranchCommand = vscode.commands.registerCommand(
    BranchCommands.Track,
    async (name?: string) => {
      try {
        const currentBranch = await gitService.getCurrentBranch();
        const branchName = name || currentBranch.name;

        // Get remote branches
        const remoteBranches = await gitService.getRemoteBranches();

        // Select remote branch to track
        const selected = await vscode.window.showQuickPick(
          remoteBranches.map(b => ({
            label: `${b.remoteName}/${b.name}`,
            description: '',
            branch: b,
          })),
          {
            placeHolder: 'Select remote branch to track',
          }
        );

        if (!selected) {
          return;
        }

        await executeWithProgress('Setting tracking branch...', async progress => {
          progress.report({
            message: `Setting '${branchName}' to track '${selected.label}'...`,
          });

          await gitService.setTrackingBranch(branchName, selected.label);
          logger.info(`Tracking branch set: ${branchName} -> ${selected.label}`);
          showInfoNotification(`'${branchName}' now tracks '${selected.label}'`);

          // Refresh repository state
          await repositoryManager.refreshCache('branches');
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to set tracking branch: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(trackBranchCommand);

  // ==================== Untrack Branch ====================
  const untrackBranchCommand = vscode.commands.registerCommand(
    BranchCommands.Untrack,
    async (name?: string) => {
      try {
        const currentBranch = await gitService.getCurrentBranch();
        const branchName = name || currentBranch.name;

        // Confirm untracking
        const confirm = await vscode.window.showWarningMessage(
          `Are you sure you want to untrack branch '${branchName}'?`,
          'Untrack',
          'Cancel'
        );

        if (confirm !== 'Untrack') {
          return;
        }

        await executeWithProgress('Untracking branch...', async progress => {
          progress.report({ message: `Untracking '${branchName}'...` });

          await gitService.unsetTrackingBranch(branchName);
          logger.info(`Branch untracked: ${branchName}`);
          showInfoNotification(`Branch '${branchName}' untracked`);

          // Refresh repository state
          await repositoryManager.refreshCache('branches');
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to untrack branch: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(untrackBranchCommand);

  logger.info('Branch commands registered successfully');
}
