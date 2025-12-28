import { Commit } from './commit';

/**
 * Represents a git stash entry
 */
export interface Stash {
  /** Stash reference (e.g. 'stash@{0}') */
  readonly ref: string;
  /** Stash message */
  readonly message: string;
  /** Branch where stash was created */
  readonly branch: string;
  /** Commit where stash was created */
  readonly commit: Commit;
  /** Creation date */
  readonly date: Date;
}
