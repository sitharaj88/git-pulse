import * as vscode from 'vscode';
import { logger } from '../utils/logger';

/**
 * Event types for the extension
 */
export enum EventType {
  // Repository events
  RepositoryChanged = 'repository.changed',
  RepositoryDetected = 'repository.detected',

  // Branch events
  BranchCreated = 'branch.created',
  BranchDeleted = 'branch.deleted',
  BranchSwitched = 'branch.switched',

  // Commit events
  CommitCreated = 'commit.created',
  CommitAmended = 'commit.amended',

  // Stash events
  StashCreated = 'stash.created',
  StashApplied = 'stash.applied',
  StashDropped = 'stash.dropped',

  // Diff events
  DiffChanged = 'diff.changed',

  // Rebase events
  RebaseStarted = 'rebase.started',
  RebaseCompleted = 'rebase.completed',
  RebaseAborted = 'rebase.aborted',

  // Merge events
  MergeStarted = 'merge.started',
  MergeCompleted = 'merge.completed',
  MergeConflict = 'merge.conflict',

  // Remote events
  RemoteUpdated = 'remote.updated',
  PushCompleted = 'push.completed',
  PullCompleted = 'pull.completed',

  // Error events
  ErrorOccurred = 'error.occurred',
}

/**
 * Event handler type
 */
export type EventHandler<T> = (data: T) => void;

/**
 * Wrapped handler with metadata
 */
interface WrappedHandler<T> {
  handler: EventHandler<T>;
  once: boolean;
}

/**
 * EventBus - Event system for inter-component communication
 * Provides subscribe/unsubscribe methods with proper cleanup
 */
export class EventBus {
  private listeners: Map<EventType, Set<WrappedHandler<any>>> = new Map();

  /**
   * Subscribe to an event
   * @param event - Event type to subscribe to
   * @param handler - Event handler function
   * @returns Disposable for cleanup
   */
  on<T>(event: EventType, handler: EventHandler<T>): vscode.Disposable {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const wrappedHandler: WrappedHandler<T> = {
      handler,
      once: false,
    };

    this.listeners.get(event)!.add(wrappedHandler);
    logger.debug(`Subscribed to event: ${event}`);

    return new vscode.Disposable(() => {
      this.off(event, handler);
    });
  }

  /**
   * Subscribe to an event once (handler will be removed after first call)
   * @param event - Event type to subscribe to
   * @param handler - Event handler function
   * @returns Disposable for cleanup
   */
  once<T>(event: EventType, handler: EventHandler<T>): vscode.Disposable {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const wrappedHandler: WrappedHandler<T> = {
      handler,
      once: true,
    };

    this.listeners.get(event)!.add(wrappedHandler);
    logger.debug(`Subscribed once to event: ${event}`);

    return new vscode.Disposable(() => {
      this.off(event, handler);
    });
  }

  /**
   * Emit an event
   * @param event - Event type to emit
   * @param data - Event data
   */
  emit<T>(event: EventType, data: T): void {
    const handlers = this.listeners.get(event);

    if (!handlers || handlers.size === 0) {
      logger.debug(`No handlers for event: ${event}`);
      return;
    }

    logger.debug(`Emitting event: ${event}`);

    // Create a copy of handlers to avoid issues with removal during iteration
    const handlersArray = Array.from(handlers);

    for (const wrappedHandler of handlersArray) {
      try {
        wrappedHandler.handler(data);

        // Remove once handlers after execution
        if (wrappedHandler.once) {
          handlers.delete(wrappedHandler);
        }
      } catch (error) {
        logger.error(`Error in event handler for ${event}:`, error);
      }
    }
  }

  /**
   * Unsubscribe from an event
   * @param event - Event type to unsubscribe from
   * @param handler - Event handler function to remove
   */
  off(event: EventType, handler: EventHandler<any>): void {
    const handlers = this.listeners.get(event);

    if (!handlers) {
      return;
    }

    // Find and remove the handler
    for (const wrappedHandler of handlers) {
      if (wrappedHandler.handler === handler) {
        handlers.delete(wrappedHandler);
        logger.debug(`Unsubscribed from event: ${event}`);
        break;
      }
    }

    // Clean up empty event sets
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event
   * @param event - Event type to clear
   */
  clear(event: EventType): void {
    const handlers = this.listeners.get(event);

    if (handlers) {
      const count = handlers.size;
      handlers.clear();
      this.listeners.delete(event);
      logger.debug(`Cleared ${count} listeners for event: ${event}`);
    }
  }

  /**
   * Remove all listeners for all events
   */
  clearAll(): void {
    const totalListeners = Array.from(this.listeners.values()).reduce(
      (sum, handlers) => sum + handlers.size,
      0
    );

    this.listeners.clear();
    logger.debug(`Cleared all ${totalListeners} listeners`);
  }

  /**
   * Get the number of listeners for an event
   * @param event - Event type
   * @returns Number of listeners
   */
  listenerCount(event: EventType): number {
    const handlers = this.listeners.get(event);
    return handlers ? handlers.size : 0;
  }

  /**
   * Get all event types with listeners
   * @returns Array of event types
   */
  getEventTypes(): EventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Check if there are any listeners for an event
   * @param event - Event type
   * @returns True if there are listeners
   */
  hasListeners(event: EventType): boolean {
    const handlers = this.listeners.get(event);
    return handlers ? handlers.size > 0 : false;
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    logger.info('EventBus disposing');
    this.clearAll();
  }
}
