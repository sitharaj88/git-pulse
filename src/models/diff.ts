import { FileStatus } from './commit';

/**
 * Represents the status of a file in the working tree
 */
export interface StatusFile {
  /** File path relative to repository root */
  readonly path: string;
  /** Status in the working tree */
  readonly worktreeStatus: FileStatus;
  /** Status in the index (staging area) */
  readonly indexStatus: FileStatus;
}

/**
 * Represents the overall status of the repository
 */
export interface GitStatus {
  /** All changed files */
  readonly files: StatusFile[];
  /** Files staged for commit */
  readonly staged: StatusFile[];
  /** Modified files not yet staged */
  readonly unstaged: StatusFile[];
  /** Untracked files */
  readonly untracked: StatusFile[];
  /** Files with merge conflicts */
  readonly conflicted: StatusFile[];
}

/**
 * Represents a simple file diff summary
 */
export interface Diff {
  /** Path of the file */
  readonly filePath: string;
  /** Previous path if renamed */
  readonly oldPath?: string;
  /** File status */
  readonly status: FileStatus;
  /** Lines added */
  readonly additions: number;
  /** Lines deleted */
  readonly deletions: number;
  /** Whether changes are staged */
  readonly isStaged: boolean;
}

/**
 * Represents detailed file diff with hunks
 */
export interface FileDiff {
  /** Path of the file */
  readonly filePath: string;
  /** Previous path if renamed */
  readonly oldPath?: string;
  /** List of diff hunks */
  readonly hunks: DiffHunk[];
  /** Whether file is binary */
  readonly isBinary: boolean;
  /** Rename similarity percentage */
  readonly renamePercentage?: number;
}

/**
 * Represents a hunk in a diff
 */
export interface DiffHunk {
  /** Starting line in original file */
  readonly oldStart: number;
  /** Number of lines in original file */
  readonly oldLines: number;
  /** Starting line in new file */
  readonly newStart: number;
  /** Number of lines in new file */
  readonly newLines: number;
  /** Lines in this hunk */
  readonly lines: DiffLine[];
}

/**
 * Represents a single line in a diff
 */
export interface DiffLine {
  /** Type of change */
  readonly type: DiffLineType;
  /** Content of the line */
  readonly content: string;
  /** Line number in original file */
  readonly oldLineNumber?: number;
  /** Line number in new file */
  readonly newLineNumber?: number;
}

/**
 * Type of a line in a diff
 */
export enum DiffLineType {
  Context = 'context',
  Added = 'added',
  Removed = 'removed',
  Header = 'header',
}
