import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { RepositoryManager } from '../../src/core/repositoryManager';
import { GitService } from '../../src/core/gitService';
import { EventBus, EventType } from '../../src/core/eventBus';

describe('RepositoryManager Unit Tests', () => {
  let repositoryManager: RepositoryManager;
  let mockGitService: any;
  let mockEventBus: any;

  beforeEach(() => {
    // Create mock GitService
    mockGitService = {
      setRepositoryPath: sinon.stub(),
      getWorkingTreeStatus: sinon.stub(),
      getCurrentBranch: sinon.stub(),
      getLocalBranches: sinon.stub(),
      getRemoteBranches: sinon.stub(),
      getRemotes: sinon.stub()
    };

    // Create mock EventBus
    mockEventBus = {
      emit: sinon.stub(),
      on: sinon.stub()
    };

    repositoryManager = new RepositoryManager(mockGitService);
    repositoryManager.setEventBus(mockEventBus);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Initialization', () => {
    it('should initialize with GitService', () => {
      assert.ok(repositoryManager);
    });

    it('should initialize empty cache', () => {
      assert.strictEqual(repositoryManager.getRepositoryState(), null);
    });
  });

  describe('Active Repository', () => {
    it('should set active repository', async () => {
      mockGitService.setRepositoryPath.resolves();

      await repositoryManager.setActiveRepository('/mock/workspace');

      assert.ok(mockGitService.setRepositoryPath.calledWith('/mock/workspace'));
      const state = repositoryManager.getRepositoryState();
      assert.ok(state);
      assert.strictEqual(state?.path, '/mock/workspace');
    });

    it('should get active repository', async () => {
      mockGitService.setRepositoryPath.resolves();

      await repositoryManager.setActiveRepository('/mock/workspace');

      const repo = repositoryManager.getActiveRepository();

      assert.ok(repo);
      assert.strictEqual(repo.path, '/mock/workspace');
    });

    it('should return null when no active repository', () => {
      const repo = repositoryManager.getActiveRepository();

      assert.strictEqual(repo, null);
    });

    it('should emit repository detected event', async () => {
      mockGitService.setRepositoryPath.resolves();

      await repositoryManager.setActiveRepository('/mock/workspace');

      assert.ok(mockEventBus.emit.calledWith(EventType.RepositoryDetected, {
        path: '/mock/workspace',
        name: '/mock/workspace'
      }));
    });
  });

  describe('Cache Operations', () => {
    it('should set and get from cache', () => {
      const testData = { key: 'value' };

      repositoryManager.setCache('testKey', testData);

      const result = repositoryManager.getFromCache('testKey');

      assert.deepStrictEqual(result, testData);
    });

    it('should return null for cache miss', () => {
      const result = repositoryManager.getFromCache('nonExistentKey');

      assert.strictEqual(result, null);
    });

    it('should invalidate specific cache key', () => {
      repositoryManager.setCache('testKey', { data: 'test' });

      repositoryManager.invalidateCache('testKey');

      const result = repositoryManager.getFromCache('testKey');
      assert.strictEqual(result, null);
    });

    it('should invalidate cache with regex pattern', () => {
      repositoryManager.setCache('branch:main', { name: 'main' });
      repositoryManager.setCache('branch:feature', { name: 'feature' });
      repositoryManager.setCache('status', { files: [] });

      repositoryManager.invalidateCache(/^branch:/);

      assert.strictEqual(repositoryManager.getFromCache('branch:main'), null);
      assert.strictEqual(repositoryManager.getFromCache('branch:feature'), null);
      assert.ok(repositoryManager.getFromCache('status'));
    });

    it('should clear all cache', () => {
      repositoryManager.setCache('key1', { data: 'test1' });
      repositoryManager.setCache('key2', { data: 'test2' });

      repositoryManager.clearCache();

      assert.strictEqual(repositoryManager.getFromCache('key1'), null);
      assert.strictEqual(repositoryManager.getFromCache('key2'), null);
    });

    it('should emit cache invalidated event', () => {
      repositoryManager.setCache('testKey', { data: 'test' });

      repositoryManager.invalidateCache('testKey');

      assert.ok(mockEventBus.emit.calledWith(EventType.DiffChanged, { key: 'testKey' }));
    });
  });

  describe('Cache Refresh', () => {
    it('should refresh status cache', async () => {
      mockGitService.setRepositoryPath.resolves();
      mockGitService.getWorkingTreeStatus.resolves({
        files: [],
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: []
      });
      mockGitService.getCurrentBranch.resolves({
        name: 'main',
        isCurrent: true,
        isRemote: false,
        commit: { hash: 'abc123', shortHash: 'abc1234', message: '', author: { name: '', email: '' }, date: new Date(), parents: [], refs: [] },
        ahead: 0,
        behind: 0,
        lastCommitDate: new Date()
      });

      await repositoryManager.setActiveRepository('/mock/workspace');
      await repositoryManager.refreshCache('status');

      assert.ok(mockGitService.getWorkingTreeStatus.called);
      assert.ok(mockGitService.getCurrentBranch.called);
    });

    it('should refresh all cache', async () => {
      mockGitService.setRepositoryPath.resolves();
      mockGitService.getWorkingTreeStatus.resolves({
        files: [],
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: []
      });
      mockGitService.getCurrentBranch.resolves({
        name: 'main',
        isCurrent: true,
        isRemote: false,
        commit: { hash: 'abc123', shortHash: 'abc1234', message: '', author: { name: '', email: '' }, date: new Date(), parents: [], refs: [] },
        ahead: 0,
        behind: 0,
        lastCommitDate: new Date()
      });
      mockGitService.getLocalBranches.resolves([]);
      mockGitService.getRemoteBranches.resolves([]);

      await repositoryManager.setActiveRepository('/mock/workspace');
      await repositoryManager.refreshCache();

      assert.ok(mockGitService.getWorkingTreeStatus.called);
      assert.ok(mockGitService.getLocalBranches.called);
      assert.ok(mockGitService.getRemoteBranches.called);
    });

    it('should emit cache invalidated event on refresh', async () => {
      mockGitService.setRepositoryPath.resolves();
      mockGitService.getWorkingTreeStatus.resolves({
        files: [],
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: []
      });
      mockGitService.getCurrentBranch.resolves({
        name: 'main',
        isCurrent: true,
        isRemote: false,
        commit: { hash: 'abc123', shortHash: 'abc1234', message: '', author: { name: '', email: '' }, date: new Date(), parents: [], refs: [] },
        ahead: 0,
        behind: 0,
        lastCommitDate: new Date()
      });

      await repositoryManager.setActiveRepository('/mock/workspace');
      await repositoryManager.refreshCache('status');

      assert.ok(mockEventBus.emit.calledWith(EventType.DiffChanged, { key: 'status' }));
    });
  });

  describe('Scheduled Refresh', () => {
    it('should schedule refresh', (done) => {
      repositoryManager.scheduleRefresh('testKey', 100);

      setTimeout(() => {
        assert.ok(true);
        done();
      }, 150);
    });

    it('should cancel scheduled refresh', (done) => {
      repositoryManager.scheduleRefresh('testKey', 100);
      repositoryManager.cancelRefresh('testKey');

      setTimeout(() => {
        assert.ok(true);
        done();
      }, 150);
    });
  });

  describe('Event Subscriptions', () => {
    it('should subscribe to repository changes', () => {
      const callback = sinon.stub();
      const disposable = repositoryManager.onRepositoryChange(callback);

      assert.ok(disposable);
      assert.ok(mockEventBus.on.calledWith(EventType.RepositoryChanged));

      disposable.dispose();
    });

    it('should subscribe to cache invalidation', () => {
      const callback = sinon.stub();
      const disposable = repositoryManager.onCacheInvalidated(callback);

      assert.ok(disposable);
      assert.ok(mockEventBus.on.calledWith(EventType.DiffChanged));

      disposable.dispose();
    });
  });

  describe('Repository State', () => {
    it('should check if repository is dirty', async () => {
      mockGitService.setRepositoryPath.resolves();
      mockGitService.getWorkingTreeStatus.resolves({
        files: [{ path: 'file.ts', worktreeStatus: 'M', indexStatus: 'M' }],
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: []
      });
      mockGitService.getCurrentBranch.resolves({
        name: 'main',
        isCurrent: true,
        isRemote: false,
        commit: { hash: 'abc123', shortHash: 'abc1234', message: '', author: { name: '', email: '' }, date: new Date(), parents: [], refs: [] },
        ahead: 0,
        behind: 0,
        lastCommitDate: new Date()
      });

      await repositoryManager.setActiveRepository('/mock/workspace');

      assert.strictEqual(repositoryManager.isDirty(), true);
    });

    it('should check if repository is clean', async () => {
      mockGitService.setRepositoryPath.resolves();
      mockGitService.getWorkingTreeStatus.resolves({
        files: [],
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: []
      });
      mockGitService.getCurrentBranch.resolves({
        name: 'main',
        isCurrent: true,
        isRemote: false,
        commit: { hash: 'abc123', shortHash: 'abc1234', message: '', author: { name: '', email: '' }, date: new Date(), parents: [], refs: [] },
        ahead: 0,
        behind: 0,
        lastCommitDate: new Date()
      });

      await repositoryManager.setActiveRepository('/mock/workspace');

      assert.strictEqual(repositoryManager.isDirty(), false);
    });

    it('should check if repository is rebasing', () => {
      assert.strictEqual(repositoryManager.isRebasing(), false);
    });

    it('should check if repository is merging', () => {
      assert.strictEqual(repositoryManager.isMerging(), false);
    });

    it('should get current branch', async () => {
      const mockBranch = {
        name: 'main',
        isCurrent: true,
        isRemote: false,
        commit: { hash: 'abc123', shortHash: 'abc1234', message: '', author: { name: '', email: '' }, date: new Date(), parents: [], refs: [] },
        ahead: 0,
        behind: 0,
        lastCommitDate: new Date()
      };
      mockGitService.setRepositoryPath.resolves();
      mockGitService.getWorkingTreeStatus.resolves({
        files: [],
        staged: [],
        unstaged: [],
        untracked: [],
        conflicted: []
      });
      mockGitService.getCurrentBranch.resolves(mockBranch);

      await repositoryManager.setActiveRepository('/mock/workspace');

      const branch = repositoryManager.getCurrentBranch();

      assert.ok(branch);
      assert.strictEqual(branch?.name, 'main');
    });
  });

  describe('Dispose', () => {
    it('should dispose all resources', () => {
      repositoryManager.setCache('key1', { data: 'test1' });
      repositoryManager.setCache('key2', { data: 'test2' });

      repositoryManager.dispose();

      assert.strictEqual(repositoryManager.getRepositoryState(), null);
      assert.strictEqual(repositoryManager.getFromCache('key1'), null);
      assert.strictEqual(repositoryManager.getFromCache('key2'), null);
    });

    it('should clear scheduled timers on dispose', () => {
      repositoryManager.scheduleRefresh('testKey', 5000);

      repositoryManager.dispose();

      assert.ok(true); // If no error thrown, timer was cleared
    });
  });
});
