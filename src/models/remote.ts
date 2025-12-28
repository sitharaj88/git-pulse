import { Commit } from './commit';

/**
 * Represents a configured git remote
 */
export interface Remote {
  /** Remote name (e.g. 'origin') */
  readonly name: string;
  /** Fetch URL */
  readonly fetchUrl: string;
  /** Push URL */
  readonly pushUrl: string;
  /** List of branches on this remote */
  readonly branches: RemoteBranch[];
}

/**
 * Represents a branch on a remote
 */
export interface RemoteBranch {
  /** Branch name (without remote prefix) */
  readonly name: string;
  /** Name of the remote this branch belongs to */
  readonly remote: string;
  /** The commit the branch points to */
  readonly commit: Commit;
  /** Date of the last commit */
  readonly lastCommitDate: Date;
}
