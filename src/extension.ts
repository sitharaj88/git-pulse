import * as vscode from 'vscode';
import { GitService } from './core/gitService';
import { RepositoryManager } from './core/repositoryManager';
import { EventBus, EventType } from './core/eventBus';
import { ConfigManager } from './core/configManager';
import { registerBranchCommands } from './commands/branch';
import { registerCommitCommands } from './commands/commit';
import { registerDiffCommands } from './commands/diff';
import { registerStashCommands } from './commands/stash';
import { registerRebaseCommands } from './commands/rebase';
import { registerMergeCommands } from './commands/merge';
import { registerRemoteCommands } from './commands/remote';
import { registerTreeViews } from './providers';
import { registerWebviews } from './views';
import { registerStatusBarItems } from './utils/statusBar';
import { setupWorkspaceListeners } from './utils/workspaceListeners';
import { setupConfigListeners } from './utils/configListeners';
import { logger } from './utils/logger';

/**
 * Global service instances
 */
let gitService: GitService;
let repositoryManager: RepositoryManager;
let eventBus: EventBus;
let configManager: ConfigManager;

/**
 * Extension activation function
 * @param context - VSCode extension context
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logger.info('GitNova is activating...');

  try {
    // Initialize core services
    gitService = new GitService();
    repositoryManager = new RepositoryManager(gitService);
    eventBus = new EventBus();
    configManager = new ConfigManager();

    // Connect RepositoryManager with EventBus
    repositoryManager.setEventBus(eventBus);

    // Detect and set active repository
    await detectAndSetActiveRepository(repositoryManager);

    // Register commands
    registerBranchCommands(context, gitService, repositoryManager, eventBus);
    registerCommitCommands(context, gitService, repositoryManager, eventBus);
    registerDiffCommands(context, gitService, repositoryManager, eventBus);
    registerStashCommands(context, gitService, repositoryManager, eventBus);
    registerRebaseCommands(context, gitService, repositoryManager, eventBus);
    registerMergeCommands(context, gitService, repositoryManager, eventBus);
    registerRemoteCommands(context, gitService, repositoryManager, eventBus);

    // Register global commands (refresh, init, clone)
    registerGlobalCommands(context, gitService, repositoryManager, eventBus);

    // Register tree views
    registerTreeViews(context, gitService, repositoryManager, eventBus);

    // Register webview providers
    registerWebviews(context, gitService, eventBus);

    // Register status bar items
    registerStatusBarItems(context, repositoryManager, eventBus);

    // Set up workspace event listeners
    setupWorkspaceListeners(context, repositoryManager, eventBus);

    // Set up configuration change listeners
    setupConfigListeners(context, configManager);

    // Subscribe to configuration changes for auto-refresh
    if (configManager.get('autoRefresh')) {
      setupAutoRefresh();
    }

    // Log activation success
    const activeRepo = repositoryManager.getActiveRepository();
    logger.info(
      `GitNova activated successfully${activeRepo ? ` for repository: ${activeRepo.name}` : ''}`
    );
  } catch (error) {
    logger.error('Failed to activate GitNova', error);
    vscode.window.showErrorMessage(`Failed to activate GitNova: ${error}`);
    throw error;
  }
}

/**
 * Register global commands (refresh, init, clone)
 */
function registerGlobalCommands(
  context: vscode.ExtensionContext,
  gitService: GitService,
  repositoryManager: RepositoryManager,
  eventBus: EventBus
): void {
  // Refresh command - refreshes all views
  const refreshCommand = vscode.commands.registerCommand('gitNova.refresh', async () => {
    logger.info('Refreshing all views...');
    try {
      // Trigger repository refresh
      const activeRepo = repositoryManager.getActiveRepository();
      if (activeRepo) {
        await repositoryManager.refreshCache();
      }
      // Emit event to refresh all tree views
      eventBus.emit(EventType.DiffChanged, { key: 'refresh' });
      vscode.window.showInformationMessage('GitNova: Refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing', error);
      vscode.window.showErrorMessage(`Failed to refresh: ${error}`);
    }
  });
  context.subscriptions.push(refreshCommand);

  // Init command - initialize a git repository
  const initCommand = vscode.commands.registerCommand('gitNova.init', async () => {
    logger.info('Initializing git repository...');
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showWarningMessage('No workspace folder found.');
        return;
      }
      const workspacePath = workspaceFolders[0].uri.fsPath;
      await gitService.init(workspacePath);
      await repositoryManager.setActiveRepository(workspacePath);
      vscode.window.showInformationMessage('Git repository initialized successfully!');
    } catch (error) {
      logger.error('Error initializing repository', error);
      vscode.window.showErrorMessage(`Failed to initialize git repository: ${error}`);
    }
  });
  context.subscriptions.push(initCommand);

  // Clone command - clone a git repository
  const cloneCommand = vscode.commands.registerCommand('gitNova.clone', async () => {
    logger.info('Cloning git repository...');
    try {
      const url = await vscode.window.showInputBox({
        prompt: 'Enter the repository URL to clone',
        placeHolder: 'https://github.com/user/repo.git',
      });
      if (!url) return;

      const targetFolder = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select folder to clone into',
      });
      if (!targetFolder || targetFolder.length === 0) return;

      const targetPath = targetFolder[0].fsPath;
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Cloning repository...' },
        async () => {
          // Use git command via terminal as clone method may not exist
          const terminal = vscode.window.createTerminal('Git Clone');
          terminal.sendText(`git clone "${url}" "${targetPath}"`);
          terminal.show();
        }
      );
    } catch (error) {
      logger.error('Error cloning repository', error);
      vscode.window.showErrorMessage(`Failed to clone repository: ${error}`);
    }
  });
  context.subscriptions.push(cloneCommand);

  // Sync command - pull then push
  const syncCommand = vscode.commands.registerCommand('gitNova.sourceControl.sync', async () => {
    logger.info('Syncing with remote...');
    try {
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Syncing with remote...' },
        async () => {
          await gitService.pull();
          await gitService.push();
          await repositoryManager.refreshCache();
          eventBus.emit(EventType.RepositoryChanged, { type: 'sync' });
        }
      );
      vscode.window.showInformationMessage('Synced with remote successfully!');
    } catch (error) {
      logger.error('Error syncing', error);
      vscode.window.showErrorMessage(`Failed to sync: ${error}`);
    }
  });
  context.subscriptions.push(syncCommand);

  // Open Git Graph command
  const openGitGraphCommand = vscode.commands.registerCommand('gitNova.openGitGraph', async () => {
    logger.info('Opening Git Graph...');
    try {
      // Try to use the external Git Graph extension if available
      const gitGraphExtension = vscode.extensions.getExtension('mhutchie.git-graph');
      if (gitGraphExtension) {
        await vscode.commands.executeCommand('git-graph.view');
      } else {
        // Fallback: show commit history in a simple format
        const commits = await gitService.getCommits({ maxCount: 100 });
        const content = commits.map(c => 
          `${c.shortHash} | ${c.author.name} | ${c.date.toLocaleDateString()} | ${c.message}`
        ).join('\n');
        
        const doc = await vscode.workspace.openTextDocument({
          content: `Git Log\n${'='.repeat(80)}\n\n${content}`,
          language: 'plaintext',
        });
        await vscode.window.showTextDocument(doc);
      }
    } catch (error) {
      logger.error('Error opening Git Graph', error);
      vscode.window.showErrorMessage(`Failed to open Git Graph: ${error}`);
    }
  });
  context.subscriptions.push(openGitGraphCommand);
}

/**
 * Extension deactivation function
 */
export function deactivate(): void {
  logger.info('GitNova is deactivating...');

  try {
    // Cleanup resources in reverse order of initialization
    if (gitService) {
      gitService.dispose();
      logger.debug('GitService disposed');
    }

    if (repositoryManager) {
      repositoryManager.dispose();
      logger.debug('RepositoryManager disposed');
    }

    if (eventBus) {
      eventBus.dispose();
      logger.debug('EventBus disposed');
    }

    if (configManager) {
      configManager.dispose();
      logger.debug('ConfigManager disposed');
    }

    logger.info('GitNova deactivated successfully');
  } catch (error) {
    logger.error('Error during deactivation', error);
  }
}

/**
 * Detect and set active repository
 * @param repositoryManager - RepositoryManager instance
 */
async function detectAndSetActiveRepository(repositoryManager: RepositoryManager): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    logger.warn('No workspace folders found');
    vscode.window.showWarningMessage(
      'No workspace folder found. Git operations may not work correctly.'
    );
    return;
  }

  // Use the first workspace folder
  const workspacePath = workspaceFolders[0].uri.fsPath;
  logger.info(`Detected workspace: ${workspacePath}`);

  try {
    // First check if the workspace is a valid git repository
    const gitService = getGitService();
    if (gitService) {
      const isValid = await gitService.isValidRepository(workspacePath);
      
      if (!isValid) {
        logger.warn(`Workspace is not a git repository: ${workspacePath}`);
        
        // Provide actionable options to the user
        const message = 'This workspace is not a git repository. Some features may not work correctly.';
        const initializeAction = 'Initialize Git Repository';
        const selection = await vscode.window.showWarningMessage(
          message,
          initializeAction,
          'Close'
        );

        if (selection === initializeAction) {
          try {
            await gitService.init(workspacePath);
            await repositoryManager.setActiveRepository(workspacePath);
            vscode.window.showInformationMessage('Git repository initialized successfully!');
            return;
          } catch (initError) {
            logger.error('Failed to initialize git repository', initError);
            vscode.window.showErrorMessage(`Failed to initialize git repository: ${initError}`);
            return;
          }
        } else {
          return;
        }
      }
    }

    await repositoryManager.setActiveRepository(workspacePath);
    logger.info('Active repository set successfully');
  } catch (error) {
    logger.error('Failed to set active repository', error);
    vscode.window.showWarningMessage(
      'Failed to detect git repository. Some features may not work correctly.'
    );
  }
}

/**
 * Set up auto-refresh based on configuration
 */
function setupAutoRefresh(): void {
  const refreshInterval = configManager.get('refreshInterval');

  if (refreshInterval > 0) {
    logger.info(`Setting up auto-refresh with interval: ${refreshInterval}ms`);

    // Note: Auto-refresh will be implemented with workspace listeners
    // This is a placeholder for future implementation
    logger.debug('Auto-refresh will be handled by workspace listeners');
  }
}

/**
 * Get global service instances (for use in other modules)
 */
export function getGitService(): GitService {
  return gitService;
}

export function getRepositoryManager(): RepositoryManager {
  return repositoryManager;
}

export function getEventBus(): EventBus {
  return eventBus;
}

export function getConfigManager(): ConfigManager {
  return configManager;
}
