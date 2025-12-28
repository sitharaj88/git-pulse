import * as vscode from 'vscode';
import { GitService } from '../core/gitService';
import { RepositoryManager } from '../core/repositoryManager';
import { EventBus, EventType } from '../core/eventBus';
import { DiffCommands } from '../constants/commands';
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
 * Register all diff-related commands
 */
export function registerDiffCommands(
  context: vscode.ExtensionContext,
  gitService: GitService,
  repositoryManager: RepositoryManager,
  eventBus: EventBus
): void {
  // ==================== View File Diff ====================
  const viewFileDiffCommand = vscode.commands.registerCommand(
    DiffCommands.ViewFileDiff,
    async (filePath?: string) => {
      try {
        const file =
          filePath ||
          (await vscode.window.showInputBox({
            prompt: 'Enter file path',
            placeHolder: 'path/to/file.ts',
          }));

        if (!file) {
          return;
        }

        await executeWithProgress('Loading file diff...', async progress => {
          progress.report({ message: `Loading diff for ${file}...` });
          const diff = await gitService.getFileDiff(file);
          showFileDiff(file, diff);
          showInfoNotification(`Diff for ${file} loaded`);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to view file diff: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(viewFileDiffCommand);

  // ==================== View Staged Diffs ====================
  const viewStagedCommand = vscode.commands.registerCommand(DiffCommands.ViewStaged, async () => {
    try {
      await executeWithProgress('Loading staged diffs...', async progress => {
        progress.report({ message: 'Fetching staged changes...' });
        const diffs = await gitService.getStagedDiffs();
        showDiffs('Staged Changes', diffs);
        showInfoNotification(`Found ${diffs.length} staged changes`);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showErrorNotification(`Failed to view staged diffs: ${errorMessage}`);
    }
  });
  context.subscriptions.push(viewStagedCommand);

  // ==================== View Unstaged Diffs ====================
  const viewUnstagedCommand = vscode.commands.registerCommand(
    DiffCommands.ViewUnstaged,
    async () => {
      try {
        await executeWithProgress('Loading unstaged diffs...', async progress => {
          progress.report({ message: 'Fetching unstaged changes...' });
          const diffs = await gitService.getUnstagedDiffs();
          showDiffs('Unstaged Changes', diffs);
          showInfoNotification(`Found ${diffs.length} unstaged changes`);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to view unstaged diffs: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(viewUnstagedCommand);

  // ==================== Compare Commits ====================
  const compareCommitsCommand = vscode.commands.registerCommand(
    DiffCommands.CompareCommits,
    async () => {
      try {
        const commit1 = await vscode.window.showInputBox({
          prompt: 'Enter first commit hash',
          placeHolder: 'abc1234',
        });

        if (!commit1) {
          return;
        }

        const commit2 = await vscode.window.showInputBox({
          prompt: 'Enter second commit hash',
          placeHolder: 'def5678',
        });

        if (!commit2) {
          return;
        }

        await executeWithProgress('Comparing commits...', async progress => {
          progress.report({ message: `Comparing ${commit1} with ${commit2}...` });
          const diff = await gitService.getFileDiff('.', `${commit1}..${commit2}`);
          showFileDiff(`${commit1}..${commit2}`, diff);
          showInfoNotification(`Compared commits ${commit1} and ${commit2}`);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to compare commits: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(compareCommitsCommand);

  // ==================== Compare Branches ====================
  const compareBranchesCommand = vscode.commands.registerCommand(
    DiffCommands.CompareBranches,
    async () => {
      try {
        const branches = await gitService.getLocalBranches();

        const branch1 = await vscode.window.showQuickPick(
          branches.map(b => ({
            label: b.name,
            description: b.isCurrent ? '(current)' : '',
            branch: b,
          })),
          {
            placeHolder: 'Select first branch',
          }
        );

        if (!branch1) {
          return;
        }

        const branch2 = await vscode.window.showQuickPick(
          branches
            .filter(b => b.name !== branch1.label)
            .map(b => ({
              label: b.name,
              description: b.isCurrent ? '(current)' : '',
              branch: b,
            })),
          {
            placeHolder: 'Select second branch',
          }
        );

        if (!branch2) {
          return;
        }

        await executeWithProgress('Comparing branches...', async progress => {
          progress.report({ message: `Comparing ${branch1.label} with ${branch2.label}...` });
          const diff = await gitService.compareBranches(branch1.label, branch2.label);
          showBranchComparison(branch1.label, branch2.label, diff);
          showInfoNotification(`Compared branches ${branch1.label} and ${branch2.label}`);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to compare branches: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(compareBranchesCommand);

  // ==================== Discard Changes ====================
  const discardChangesCommand = vscode.commands.registerCommand(
    DiffCommands.DiscardChanges,
    async (filePath?: string) => {
      try {
        const status = await gitService.getWorkingTreeStatus();
        const files = status.unstaged.concat(status.conflicted);

        if (files.length === 0) {
          showInfoNotification('No unstaged changes to discard');
          return;
        }

        const fileToDiscard =
          filePath ||
          (
            await vscode.window.showQuickPick(
              files.map(f => ({
                label: f.path,
                description: `${f.worktreeStatus}`,
                file: f,
              })),
              {
                placeHolder: 'Select file to discard changes',
              }
            )
          )?.label;

        if (!fileToDiscard) {
          return;
        }

        const confirm = await vscode.window.showWarningMessage(
          `Are you sure you want to discard changes to ${fileToDiscard}?`,
          'Discard',
          'Cancel'
        );

        if (confirm !== 'Discard') {
          return;
        }

        await executeWithProgress('Discarding changes...', async progress => {
          progress.report({ message: `Discarding changes to ${fileToDiscard}...` });
          await gitService.discardChanges([fileToDiscard]);
          showInfoNotification(`Changes to ${fileToDiscard} discarded`);
          eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to discard changes: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(discardChangesCommand);

  // ==================== Stage File ====================
  const stageFileCommand = vscode.commands.registerCommand(
    DiffCommands.StageFile,
    async (filePath?: string) => {
      try {
        const status = await gitService.getWorkingTreeStatus();
        const files = status.unstaged.concat(status.untracked);

        if (files.length === 0) {
          showInfoNotification('No unstaged files to stage');
          return;
        }

        const fileToStage =
          filePath ||
          (
            await vscode.window.showQuickPick(
              files.map(f => ({
                label: f.path,
                description: `${f.worktreeStatus}`,
                file: f,
              })),
              {
                placeHolder: 'Select file to stage',
              }
            )
          )?.label;

        if (!fileToStage) {
          return;
        }

        await executeWithProgress('Staging file...', async progress => {
          progress.report({ message: `Staging ${fileToStage}...` });
          await gitService.stageFiles([fileToStage]);
          showInfoNotification(`${fileToStage} staged`);
          eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to stage file: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(stageFileCommand);

  // ==================== Unstage File ====================
  const unstageFileCommand = vscode.commands.registerCommand(
    DiffCommands.UnstageFile,
    async (filePath?: string) => {
      try {
        const status = await gitService.getWorkingTreeStatus();
        const files = status.staged;

        if (files.length === 0) {
          showInfoNotification('No staged files to unstage');
          return;
        }

        const fileToUnstage =
          filePath ||
          (
            await vscode.window.showQuickPick(
              files.map(f => ({
                label: f.path,
                description: `${f.indexStatus}`,
                file: f,
              })),
              {
                placeHolder: 'Select file to unstage',
              }
            )
          )?.label;

        if (!fileToUnstage) {
          return;
        }

        await executeWithProgress('Unstaging file...', async progress => {
          progress.report({ message: `Unstaging ${fileToUnstage}...` });
          await gitService.unstageFiles([fileToUnstage]);
          showInfoNotification(`${fileToUnstage} unstaged`);
          eventBus.emit(EventType.RepositoryChanged, repositoryManager.getActiveRepository());
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showErrorNotification(`Failed to unstage file: ${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(unstageFileCommand);

  logger.info('Diff commands registered successfully');
}

/**
 * Show file diff in a new document
 */
function showFileDiff(filePath: string, diff: any): void {
  const content = [
    `Diff for: ${filePath}`,
    '',
    'Hunks:',
    ...diff.hunks.map((hunk: any, index: number) =>
      [
        `Hunk ${index + 1}:`,
        `  Old: ${hunk.oldStart}, ${hunk.oldLines} lines`,
        `  New: ${hunk.newStart}, ${hunk.newLines} lines`,
        ...hunk.lines.map((line: any) => `  ${line.content}`),
      ].flat()
    ),
  ].join('\n');

  vscode.workspace
    .openTextDocument({
      content,
      language: 'diff',
    })
    .then((doc: vscode.TextDocument) => vscode.window.showTextDocument(doc));
}

/**
 * Show diffs in a new document
 */
function showDiffs(title: string, diffs: any[]): void {
  if (diffs.length === 0) {
    vscode.window.showInformationMessage(`No ${title.toLowerCase()}`);
    return;
  }

  const content = [
    title,
    `Total: ${diffs.length} files`,
    '',
    ...diffs.map((diff, index) =>
      [
        `${index + 1}. ${diff.filePath}`,
        `   Hunks: ${diff.hunks.length}`,
        `   Binary: ${diff.isBinary ? 'Yes' : 'No'}`,
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

/**
 * Show branch comparison in a new document
 */
function showBranchComparison(branch1: string, branch2: string, diff: any): void {
  const content = [
    `Branch Comparison: ${branch1} vs ${branch2}`,
    '',
    `Files changed: ${diff.filePath}`,
    `Additions: ${diff.additions}`,
    `Deletions: ${diff.deletions}`,
    `Staged: ${diff.isStaged ? 'Yes' : 'No'}`,
  ].join('\n');

  vscode.workspace
    .openTextDocument({
      content,
      language: 'plaintext',
    })
    .then((doc: vscode.TextDocument) => vscode.window.showTextDocument(doc));
}
