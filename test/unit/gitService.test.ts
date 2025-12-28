import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { GitService } from '../../src/core/gitService';

describe('GitService Unit Tests', () => {
  let gitService: GitService;
  let mockGit: any;
  let simpleGitStub: sinon.SinonStub;

  beforeEach(() => {
    // Create mock git instance with all methods
    mockGit = {
      branch: sinon.stub(),
      branches: sinon.stub(),
      checkout: sinon.stub(),
      checkoutLocalBranch: sinon.stub(),
      checkoutBranch: sinon.stub(),
      merge: sinon.stub(),
      mergeFromTo: sinon.stub(),
      deleteLocalBranch: sinon.stub(),
      deleteLocalBranches: sinon.stub(),
      add: sinon.stub(),
      commit: sinon.stub(),
      log: sinon.stub(),
      show: sinon.stub(),
      diff: sinon.stub(),
      diffSummary: sinon.stub(),
      status: sinon.stub(),
      fetch: sinon.stub(),
      pull: sinon.stub(),
      push: sinon.stub(),
      remote: sinon.stub(),
      addRemote: sinon.stub(),
      removeRemote: sinon.stub(),
      getRemotes: sinon.stub(),
      stash: sinon.stub(),
      stashList: sinon.stub(),
      rebase: sinon.stub(),
      init: sinon.stub(),
      clean: sinon.stub(),
      reset: sinon.stub(),
      revparse: sinon.stub(),
      raw: sinon.stub(),
      cwd: sinon.stub().returnsThis()
    };

    // Stub simple-git module
    const simpleGitModule = require('simple-git');
    simpleGitStub = sinon.stub(simpleGitModule, 'simpleGit').returns(mockGit);
    
    gitService = new GitService('/mock/workspace');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Initialization', () => {
    it('should initialize with repository path', () => {
      assert.strictEqual(gitService.getRepositoryPath(), '/mock/workspace');
    });

    it('should initialize without repository path', () => {
      const service = new GitService();
      assert.strictEqual(service.getRepositoryPath(), null);
    });
  });

  describe('Branch Operations', () => {
    it('should get current branch', async () => {
      mockGit.branch.resolves({ current: 'main', all: ['main', 'feature'] });

      const branch = await gitService.getCurrentBranch();

      assert.ok(mockGit.branch.called);
      assert.strictEqual(branch.name, 'main');
      assert.strictEqual(branch.isCurrent, true);
    });

    it('should get local branches', async () => {
      const mockBranches = {
        current: 'main',
        all: ['main', 'feature', 'develop'],
        branches: {
          main: { name: 'main', commit: 'abc123' },
          feature: { name: 'feature', commit: 'def456' }
        }
      };
      mockGit.branch.resolves(mockBranches);

      const branches = await gitService.getLocalBranches();

      assert.ok(mockGit.branch.called);
      assert.strictEqual(branches.length, 3);
      assert.strictEqual(branches[0].name, 'main');
      assert.strictEqual(branches[0].isCurrent, true);
    });

    it('should get remote branches', async () => {
      const mockBranches = {
        current: 'main',
        all: ['remotes/origin/main', 'remotes/origin/feature'],
        branches: {
          'remotes/origin/main': { name: 'main', commit: 'abc123' }
        }
      };
      mockGit.branch.withArgs(['-r']).resolves(mockBranches);

      const branches = await gitService.getRemoteBranches();

      assert.ok(mockGit.branch.calledWith(['-r']));
      assert.strictEqual(branches.length, 1);
      assert.strictEqual(branches[0].name, 'main');
      assert.strictEqual(branches[0].isRemote, true);
    });

    it('should create a new branch', async () => {
      mockGit.branch.resolves();

      const branch = await gitService.createBranch('feature-branch');

      assert.ok(mockGit.branch.calledWith(['feature-branch']));
      assert.strictEqual(branch.name, 'feature-branch');
    });

    it('should delete a branch', async () => {
      mockGit.branch.resolves();

      await gitService.deleteBranch('feature-branch');

      assert.ok(mockGit.branch.calledWith(['-d', 'feature-branch']));
    });

    it('should force delete a branch', async () => {
      mockGit.branch.resolves();

      await gitService.deleteBranch('feature-branch', true);

      assert.ok(mockGit.branch.calledWith(['-D', 'feature-branch']));
    });

    it('should switch to a branch', async () => {
      mockGit.checkout.resolves();

      await gitService.switchBranch('main');

      assert.ok(mockGit.checkout.calledWith('main'));
    });

    it('should rename a branch', async () => {
      mockGit.branch.resolves();

      await gitService.renameBranch('old-name', 'new-name');

      assert.ok(mockGit.branch.calledWith(['-m', 'old-name', 'new-name']));
    });
  });

  describe('Commit Operations', () => {
    it('should create a commit', async () => {
      mockGit.add.resolves();
      mockGit.commit.resolves({ commit: 'abc123', author: { name: 'Test', email: 'test@example.com' }, date: '2024-01-01' });

      const result = await gitService.commit('test commit', ['file1.ts']);

      assert.ok(mockGit.add.calledWith(['file1.ts']));
      assert.ok(mockGit.commit.calledWith('test commit'));
      assert.strictEqual(result.hash, 'abc123');
    });

    it('should amend a commit', async () => {
      mockGit.commit.resolves({ commit: 'def456', author: { name: 'Test', email: 'test@example.com' }, date: '2024-01-01' });

      const result = await gitService.amend('new message');

      assert.ok(mockGit.commit.calledWith(['--amend', '-m', 'new message']));
      assert.strictEqual(result.hash, 'def456');
    });

    it('should get commit history', async () => {
      const mockLog = `abc123|abc1234|Test User|test@example.com|2024-01-01 12:00:00|First commit
def456|def4567|Test User|test@example.com|2024-01-02 12:00:00|Second commit`;
      mockGit.raw.resolves(mockLog);

      const commits = await gitService.getCommits({ maxCount: 10 });

      assert.ok(mockGit.raw.called);
      assert.strictEqual(commits.length, 2);
      assert.strictEqual(commits[0].hash, 'abc123');
      assert.strictEqual(commits[0].message, 'First commit');
    });

    it('should get commit details', async () => {
      const mockShow = `abc123|abc1234|Test User|test@example.com|2024-01-01 12:00:00|Test commit|Commit body
 1 file changed, 2 insertions(+), 1 deletion(-)
 file.ts | 2 +-
`;
      mockGit.show.resolves(mockShow);

      const commit = await gitService.getCommit('abc123');

      assert.ok(mockGit.show.called);
      assert.strictEqual(commit.hash, 'abc123');
      assert.strictEqual(commit.message, 'Test commit');
      assert.strictEqual(commit.body, 'Commit body');
    });

    it('should cherry-pick a commit', async () => {
      mockGit.raw.resolves();

      await gitService.cherryPick('abc123');

      assert.ok(mockGit.raw.calledWith(['cherry-pick', 'abc123']));
    });

    it('should revert a commit', async () => {
      mockGit.revert.resolves();

      await gitService.revert('abc123');

      assert.ok(mockGit.revert.calledWith('abc123'));
    });

    it('should reset to a commit', async () => {
      mockGit.reset.resolves();

      await gitService.reset('abc123', 'soft');

      assert.ok(mockGit.reset.calledWith(['--soft', 'abc123']));
    });

    it('should search commits', async () => {
      const mockLog = `abc123|abc1234|Test User|test@example.com|2024-01-01 12:00:00|Feature: test commit`;
      mockGit.raw.resolves(mockLog);

      const commits = await gitService.searchCommits('Feature');

      assert.strictEqual(commits.length, 1);
      assert.ok(commits[0].message.includes('Feature'));
    });
  });

  describe('Status Operations', () => {
    it('should get working tree status', async () => {
      const mockStatus = {
        files: [
          { path: 'file1.ts', working_dir: 'M', index: 'M' },
          { path: 'file2.ts', working_dir: 'A', index: 'A' }
        ],
        current: 'main'
      };
      mockGit.status.resolves(mockStatus);

      const status = await gitService.getWorkingTreeStatus();

      assert.ok(mockGit.status.called);
      assert.strictEqual(status.files.length, 2);
      assert.strictEqual(status.staged.length, 2);
      assert.strictEqual(status.unstaged.length, 2);
    });

    it('should get staged files', async () => {
      const mockStatus = {
        files: [
          { path: 'file1.ts', working_dir: 'M', index: 'M' },
          { path: 'file2.ts', working_dir: 'A', index: 'A' }
        ],
        current: 'main'
      };
      mockGit.status.resolves(mockStatus);

      const staged = await gitService.getStagedFiles();

      assert.ok(mockGit.status.called);
      assert.strictEqual(staged.length, 2);
    });

    it('should get unstaged files', async () => {
      const mockStatus = {
        files: [
          { path: 'file1.ts', working_dir: 'M', index: 'M' },
          { path: 'file2.ts', working_dir: 'A', index: 'A' }
        ],
        current: 'main'
      };
      mockGit.status.resolves(mockStatus);

      const unstaged = await gitService.getUnstagedFiles();

      assert.ok(mockGit.status.called);
      assert.strictEqual(unstaged.length, 2);
    });
  });

  describe('Stage/Unstage Operations', () => {
    it('should stage files', async () => {
      mockGit.add.resolves();

      await gitService.stageFiles(['file1.ts', 'file2.ts']);

      assert.ok(mockGit.add.calledWith(['file1.ts', 'file2.ts']));
    });

    it('should unstage files', async () => {
      mockGit.reset.resolves();

      await gitService.unstageFiles(['file1.ts']);

      assert.ok(mockGit.reset.calledWith(['file1.ts']));
    });

    it('should discard changes', async () => {
      mockGit.checkout.resolves();

      await gitService.discardChanges(['file1.ts']);

      assert.ok(mockGit.checkout.calledWith(['file1.ts']));
    });
  });

  describe('Diff Operations', () => {
    it('should get file diff', async () => {
      const mockDiff = `diff --git a/file.ts b/file.ts
index abc123..def456 100644
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
 line1
-line2
+line2-modified
 line3
+line4`;
      mockGit.diff.resolves(mockDiff);

      const diff = await gitService.getFileDiff('file.ts');

      assert.ok(mockGit.diff.calledWith(['--', 'file.ts']));
      assert.strictEqual(diff.filePath, 'file.ts');
      assert.ok(diff.hunks.length > 0);
    });

    it('should get all diffs', async () => {
      const mockDiff = `diff --git a/file.ts b/file.ts
index abc123..def456 100644
--- a/file.ts
+++ b/file.ts`;
      mockGit.diff.resolves(mockDiff);

      const diffs = await gitService.getDiffs();

      assert.ok(mockGit.diff.called);
      assert.ok(diffs.length > 0);
    });

    it('should get staged diffs', async () => {
      const mockDiff = `diff --git a/file.ts b/file.ts
index abc123..def456 100644
--- a/file.ts
+++ b/file.ts`;
      mockGit.diff.resolves(mockDiff);

      const diffs = await gitService.getStagedDiffs();

      assert.ok(mockGit.diff.calledWith(['--staged']));
      assert.ok(diffs.length > 0);
    });

    it('should get unstaged diffs', async () => {
      const mockDiff = `diff --git a/file.ts b/file.ts
index abc123..def456 100644
--- a/file.ts
+++ b/file.ts`;
      mockGit.diff.resolves(mockDiff);

      const diffs = await gitService.getUnstagedDiffs();

      assert.ok(mockGit.diff.calledWith([]));
      assert.ok(diffs.length > 0);
    });

    it('should compare branches', async () => {
      const mockDiff = ` 2 files changed, 10 insertions(+), 5 deletions(-)`;
      mockGit.diff.resolves(mockDiff);

      const diff = await gitService.compareBranches('main', 'feature');

      assert.ok(mockGit.diff.calledWith(['main...feature', '--stat']));
      assert.strictEqual(diff.filePath, 'main...feature');
      assert.strictEqual(diff.additions, 10);
      assert.strictEqual(diff.deletions, 5);
    });
  });

  describe('Stash Operations', () => {
    it('should create stash', async () => {
      mockGit.raw.resolves();
      mockGit.stashList.resolves({ all: [{ message: 'stash@{0}: On main: test stash', hash: 'abc123', date: '2024-01-01' }] });

      const stash = await gitService.createStash('test stash');

      assert.ok(mockGit.raw.called);
      assert.strictEqual(stash.message, 'test stash');
    });

    it('should get stashes', async () => {
      const mockStashList = {
        all: [
          { message: 'stash@{0}: On main: test stash 1', hash: 'abc123', date: '2024-01-01' },
          { message: 'stash@{1}: On main: test stash 2', hash: 'def456', date: '2024-01-02' }
        ]
      };
      mockGit.stashList.resolves(mockStashList);

      const stashes = await gitService.getStashes();

      assert.ok(mockGit.stashList.called);
      assert.strictEqual(stashes.length, 2);
    });

    it('should apply stash', async () => {
      mockGit.stash.resolves();

      await gitService.applyStash(0);

      assert.ok(mockGit.stash.calledWith(['apply', 'stash@{0}']));
    });

    it('should pop stash', async () => {
      mockGit.stash.resolves();

      await gitService.popStash(0);

      assert.ok(mockGit.stash.calledWith(['pop', 'stash@{0}']));
    });

    it('should drop stash', async () => {
      mockGit.stash.resolves();

      await gitService.dropStash(0);

      assert.ok(mockGit.stash.calledWith(['drop', 'stash@{0}']));
    });

    it('should clear all stashes', async () => {
      mockGit.stash.resolves();

      await gitService.clearStashes();

      assert.ok(mockGit.stash.calledWith(['clear']));
    });
  });

  describe('Rebase Operations', () => {
    it('should start rebase', async () => {
      mockGit.rebase.resolves();

      await gitService.startRebase('main');

      assert.ok(mockGit.rebase.calledWith(['main']));
    });

    it('should start rebase with branch', async () => {
      mockGit.rebase.resolves();

      await gitService.startRebase('main', 'feature');

      assert.ok(mockGit.rebase.calledWith(['main', '--onto', 'feature']));
    });

    it('should continue rebase', async () => {
      mockGit.rebase.resolves();

      await gitService.continueRebase();

      assert.ok(mockGit.rebase.calledWith(['--continue']));
    });

    it('should abort rebase', async () => {
      mockGit.rebase.resolves();

      await gitService.abortRebase();

      assert.ok(mockGit.rebase.calledWith(['--abort']));
    });

    it('should skip rebase commit', async () => {
      mockGit.rebase.resolves();

      await gitService.skipRebaseCommit();

      assert.ok(mockGit.rebase.calledWith(['--skip']));
    });

    it('should edit rebase commit', async () => {
      mockGit.rebase.resolves();

      await gitService.editRebaseCommit();

      assert.ok(mockGit.rebase.calledWith(['--edit-todo']));
    });

    it('should get rebase status', async () => {
      mockGit.status.resolves({ files: [], current: 'main' });

      const status = await gitService.getRebaseStatus();

      assert.ok(mockGit.status.called);
      assert.strictEqual(status.inProgress, false);
    });
  });

  describe('Merge Operations', () => {
    it('should merge branch', async () => {
      mockGit.merge.resolves();

      await gitService.merge('feature');

      assert.ok(mockGit.merge.calledWith(['feature']));
    });

    it('should merge with options', async () => {
      mockGit.merge.resolves();

      await gitService.merge('feature', { noFastForward: true, squash: true });

      assert.ok(mockGit.merge.calledWith(['feature', '--no-ff', '--squash']));
    });

    it('should abort merge', async () => {
      mockGit.merge.resolves();

      await gitService.abortMerge();

      assert.ok(mockGit.merge.calledWith(['--abort']));
    });

    it('should continue merge', async () => {
      mockGit.commit.resolves();

      await gitService.continueMerge();

      assert.ok(mockGit.commit.calledWith(['--no-edit']));
    });

    it('should get merge conflicts', async () => {
      const mockStatus = {
        files: [
          { path: 'file.ts', working_dir: 'U', index: 'U' }
        ],
        current: 'main'
      };
      mockGit.status.resolves(mockStatus);

      const conflicts = await gitService.getMergeConflicts();

      assert.ok(mockGit.status.called);
      assert.strictEqual(conflicts.length, 1);
      assert.strictEqual(conflicts[0], 'file.ts');
    });

    it('should accept ours in merge conflict', async () => {
      mockGit.raw.resolves();
      mockGit.add.resolves();

      await gitService.acceptOurs('file.ts');

      assert.ok(mockGit.raw.calledWith(['checkout', '--ours', '--', 'file.ts']));
      assert.ok(mockGit.add.calledWith('file.ts'));
    });

    it('should accept theirs in merge conflict', async () => {
      mockGit.raw.resolves();
      mockGit.add.resolves();

      await gitService.acceptTheirs('file.ts');

      assert.ok(mockGit.raw.calledWith(['checkout', '--theirs', '--', 'file.ts']));
      assert.ok(mockGit.add.calledWith('file.ts'));
    });
  });

  describe('Remote Operations', () => {
    it('should get remotes', async () => {
      const mockRemotes = [
        { name: 'origin', refs: { fetch: 'https://github.com/repo.git', push: 'https://github.com/repo.git' } }
      ];
      mockGit.getRemotes.resolves(mockRemotes);

      const remotes = await gitService.getRemotes();

      assert.ok(mockGit.getRemotes.calledWith(true));
      assert.strictEqual(remotes.length, 1);
      assert.strictEqual(remotes[0].name, 'origin');
      assert.strictEqual(remotes[0].url, 'https://github.com/repo.git');
    });

    it('should add remote', async () => {
      mockGit.remote.resolves();

      await gitService.addRemote('upstream', 'https://github.com/upstream/repo.git');

      assert.ok(mockGit.remote.calledWith(['add', 'upstream', 'https://github.com/upstream/repo.git']));
    });

    it('should remove remote', async () => {
      mockGit.remote.resolves();

      await gitService.removeRemote('upstream');

      assert.ok(mockGit.remote.calledWith(['remove', 'upstream']));
    });

    it('should set remote URL', async () => {
      mockGit.remote.resolves();

      await gitService.setRemoteUrl('origin', 'https://github.com/new/repo.git');

      assert.ok(mockGit.remote.calledWith(['set-url', 'origin', 'https://github.com/new/repo.git']));
    });

    it('should prune remote', async () => {
      mockGit.remote.resolves();

      await gitService.pruneRemote('origin');

      assert.ok(mockGit.remote.calledWith(['prune', 'origin']));
    });

    it('should fetch from remote', async () => {
      mockGit.fetch.resolves();

      await gitService.fetch('origin', 'main');

      assert.ok(mockGit.fetch.calledWith('origin', 'main'));
    });

    it('should push to remote', async () => {
      mockGit.push.resolves();

      await gitService.push('origin', 'main');

      assert.ok(mockGit.push.calledWith(['origin', 'main']));
    });

    it('should force push', async () => {
      mockGit.push.resolves();

      await gitService.push('origin', 'main', true);

      assert.ok(mockGit.push.calledWith(['--force', 'origin', 'main']));
    });

    it('should pull from remote', async () => {
      mockGit.pull.resolves();

      await gitService.pull('origin', 'main');

      assert.ok(mockGit.pull.calledWith('origin', 'main'));
    });
  });

  describe('Push/Pull/Fetch Operations', () => {
    it('should fetch without arguments', async () => {
      mockGit.fetch.resolves();

      await gitService.fetch();

      assert.ok(mockGit.fetch.calledWith());
    });

    it('should fetch with remote only', async () => {
      mockGit.fetch.resolves();

      await gitService.fetch('origin');

      assert.ok(mockGit.fetch.calledWith('origin'));
    });

    it('should pull without arguments', async () => {
      mockGit.pull.resolves();

      await gitService.pull();

      assert.ok(mockGit.pull.calledWith());
    });

    it('should push without arguments', async () => {
      mockGit.push.resolves();

      await gitService.push();

      assert.ok(mockGit.push.calledWith());
    });
  });

  describe('Repository Operations', () => {
    it('should initialize repository', async () => {
      mockGit.init.resolves();

      await gitService.init('/new/repo');

      assert.ok(mockGit.cwd.calledWith('/new/repo'));
      assert.ok(mockGit.init.called);
    });

    it('should set repository path', async () => {
      await gitService.setRepositoryPath('/new/path');

      assert.strictEqual(gitService.getRepositoryPath(), '/new/path');
    });

    it('should dispose resources', () => {
      gitService.dispose();

      assert.strictEqual(gitService.getRepositoryPath(), null);
    });
  });
});
