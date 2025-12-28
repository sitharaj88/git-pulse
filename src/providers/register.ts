import * as vscode from 'vscode';
import { GitService } from '../core/gitService';
import { RepositoryManager } from '../core/repositoryManager';
import { EventBus } from '../core/eventBus';
import { registerBranchProvider } from './branchProvider';
import { registerCommitProvider } from './commitProvider';
import { registerStashProvider } from './stashProvider';
import { registerRemoteProvider } from './remoteProvider';
import { registerSourceControlProvider } from './sourceControlProvider';
import { registerChangesProvider } from './changesProvider';
import { registerTagsProvider } from './tagsProvider';
import { logger } from '../utils/logger';

/**
 * Register all tree view providers
 * @param context - VSCode extension context
 * @param gitService - Git service instance
 * @param repositoryManager - Repository manager instance
 * @param eventBus - Event bus instance
 */
export function registerTreeViews(
  context: vscode.ExtensionContext,
  gitService: GitService,
  repositoryManager: RepositoryManager,
  eventBus: EventBus
): void {
  logger.info('Registering tree view providers...');

  // Register source control overview provider
  registerSourceControlProvider(context, gitService, repositoryManager, eventBus);

  // Register changes provider
  registerChangesProvider(context, gitService, repositoryManager, eventBus);

  // Register branch provider
  registerBranchProvider(context, gitService, repositoryManager, eventBus);

  // Register commit provider
  registerCommitProvider(context, gitService, repositoryManager, eventBus);

  // Register stash provider
  registerStashProvider(context, gitService, repositoryManager, eventBus);

  // Register remote provider
  registerRemoteProvider(context, gitService, repositoryManager, eventBus);

  // Register tags provider
  registerTagsProvider(context, gitService, repositoryManager, eventBus);

  logger.info('Tree view providers registered successfully');
}
