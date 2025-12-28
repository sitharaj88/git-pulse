import { Commit } from './commit';

/**
 * Represents a git branch
 */
export interface Branch {
  /** Checksum of the branch head commit */
  readonly name: string;
  /** Whether this is the currently checked out branch */
  readonly isCurrent: boolean;
  /** Whether it is a remote branch */
  readonly isRemote: boolean;
  /** Name of the remote if strictly a remote branch */
  readonly remoteName?: string;
  /** The commit the branch points to */
  readonly commit: Commit;
  /** The upstream tracking branch */
  readonly trackingBranch?: Branch;
  /** Number of commits ahead of tracking branch */
  readonly ahead: number;
  /** Number of commits behind tracking branch */
  readonly behind: number;
  /** Date of the last commit */
  readonly lastCommitDate: Date;
}
