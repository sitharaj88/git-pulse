/**
 * Commands for branch operations
 */
export namespace BranchCommands {
  export const Create = 'gitNova.branch.create';
  export const Delete = 'gitNova.branch.delete';
  export const Switch = 'gitNova.branch.switch';
  export const Rename = 'gitNova.branch.rename';
  export const Compare = 'gitNova.branch.compare';
  export const CheckoutNew = 'gitNova.branch.checkoutNew';
  export const Checkout = 'gitNova.branch.checkout';
  export const Merge = 'gitNova.branch.merge';
  export const Fetch = 'gitNova.branch.fetch';
  export const Push = 'gitNova.branch.push';
  export const Pull = 'gitNova.branch.pull';
  export const Track = 'gitNova.branch.track';
  export const Untrack = 'gitNova.branch.untrack';
}

/**
 * Commands for commit operations
 */
export namespace CommitCommands {
  export const Create = 'gitNova.commit.create';
  export const Amend = 'gitNova.commit.amend';
  export const ViewHistory = 'gitNova.commit.viewHistory';
  export const Show = 'gitNova.commit.show';
  export const Log = 'gitNova.commit.log';
  export const Search = 'gitNova.commit.search';
  export const CherryPick = 'gitNova.commit.cherryPick';
  export const Revert = 'gitNova.commit.revert';
  export const Reset = 'gitNova.commit.reset';
  export const Squash = 'gitNova.commit.squash';
  export const Fixup = 'gitNova.commit.fixup';
  export const EditMessage = 'gitNova.commit.editMessage';
  export const Filter = 'gitNova.commit.filter';
}

/**
 * Commands for diff operations
 */
export namespace DiffCommands {
  export const ViewFileDiff = 'gitNova.diff.viewFile';
  export const ViewStaged = 'gitNova.diff.viewStaged';
  export const ViewUnstaged = 'gitNova.diff.viewUnstaged';
  export const CompareCommits = 'gitNova.diff.compareCommits';
  export const CompareBranches = 'gitNova.diff.compareBranches';
  export const DiscardChanges = 'gitNova.diff.discardChanges';
  export const StageFile = 'gitNova.diff.stageFile';
  export const UnstageFile = 'gitNova.diff.unstageFile';
}

/**
 * Commands for stash operations
 */
export namespace StashCommands {
  export const Create = 'gitNova.stash.create';
  export const Pop = 'gitNova.stash.pop';
  export const Apply = 'gitNova.stash.apply';
  export const Drop = 'gitNova.stash.drop';
  export const List = 'gitNova.stash.list';
  export const Clear = 'gitNova.stash.clear';
}

/**
 * Commands for rebase operations
 */
export namespace RebaseCommands {
  export const Start = 'gitNova.rebase.start';
  export const Interactive = 'gitNova.rebase.interactive';
  export const Continue = 'gitNova.rebase.continue';
  export const Abort = 'gitNova.rebase.abort';
  export const Skip = 'gitNova.rebase.skip';
  export const EditTodo = 'gitNova.rebase.editTodo';
}

/**
 * Commands for merge operations
 */
export namespace MergeCommands {
  export const Start = 'gitNova.merge.start';
  export const Continue = 'gitNova.merge.continue';
  export const Abort = 'gitNova.merge.abort';
  export const ResolveConflict = 'gitNova.merge.resolveConflict';
  export const AcceptOurs = 'gitNova.merge.acceptOurs';
  export const AcceptTheirs = 'gitNova.merge.acceptTheirs';
}

/**
 * Commands for remote operations
 */
export namespace RemoteCommands {
  export const Fetch = 'gitNova.remote.fetch';
  export const Pull = 'gitNova.remote.pull';
  export const Push = 'gitNova.remote.push';
  export const Add = 'gitNova.remote.add';
  export const Remove = 'gitNova.remote.remove';
  export const SetUrl = 'gitNova.remote.setUrl';
  export const Prune = 'gitNova.remote.prune';
}
