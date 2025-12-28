import * as vscode from 'vscode';
import { GitService } from '../core/gitService';
import { EventBus } from '../core/eventBus';
import { DiffViewManager } from './diffViewManager';
import { CommitHistoryManager } from './commitHistoryManager';
import { logger } from '../utils/logger';

export function registerWebviews(
  context: vscode.ExtensionContext,
  gitService: GitService,
  eventBus: EventBus
): void {
  // Create webview manager instances
  const diffViewManager = new DiffViewManager(context, gitService, eventBus);
  const commitHistoryManager = new CommitHistoryManager(context, gitService, eventBus);

  // Expose managers for use in commands
  (globalThis as any).diffViewManager = diffViewManager;
  (globalThis as any).commitHistoryManager = commitHistoryManager;

  logger.info('Webviews registered successfully');
}
