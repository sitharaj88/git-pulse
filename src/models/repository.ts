import { Branch } from './branch';
import { Remote } from './remote';
import { GitStatus } from './diff';

/**
 * Interface representing a Git repository state
 */
export interface IGitRepository {
  /** Absolute path to the repository root */
  readonly path: string;
  /** Name of the repository (folder name) */
  readonly name: string;
  /** Currently checked out branch */
  readonly currentBranch: Branch;
  /** Configured remotes */
  readonly remotes: Remote[];
  /** Current working tree status */
  readonly status: GitStatus;
  /** Whether there are uncommitted changes */
  readonly isDirty: boolean;
  /** Whether a rebase is in progress */
  readonly isRebasing: boolean;
  /** Whether a merge is in progress */
  readonly isMerging: boolean;
}
