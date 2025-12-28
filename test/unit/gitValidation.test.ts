import * as assert from 'assert';
import * as sinon from 'sinon';
import { GitService } from '../../src/core/gitService';

describe('GitService - Repository Validation', () => {
  let gitService: GitService;
  let mockGit: any;
  let simpleGitStub: sinon.SinonStub;

  beforeEach(() => {
    // Create mock git instance with all methods
    mockGit = {
      status: sinon.stub(),
      cwd: sinon.stub().returnsThis()
    };

    // Stub simple-git module
    const simpleGitModule = require('simple-git');
    simpleGitStub = sinon.stub(simpleGitModule, 'simpleGit').returns(mockGit);
    
    gitService = new GitService();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('isValidRepository', () => {
    it('should return true for valid git repository', async () => {
      mockGit.status.resolves({ current: 'main', files: [] });

      const isValid = await gitService.isValidRepository('/valid/repo');

      assert.strictEqual(isValid, true);
      assert.ok(mockGit.status.called);
    });

    it('should return false for invalid git repository', async () => {
      mockGit.status.rejects(new Error('Not a git repository'));

      const isValid = await gitService.isValidRepository('/invalid/repo');

      assert.strictEqual(isValid, false);
      assert.ok(mockGit.status.called);
    });
  });

  describe('setRepositoryPath', () => {
    it('should set repository path for valid git repository', async () => {
      mockGit.status.resolves({ current: 'main', files: [] });

      await gitService.setRepositoryPath('/valid/repo');

      assert.strictEqual(gitService.getRepositoryPath(), '/valid/repo');
      assert.ok(mockGit.status.called);
    });

    it('should throw error for non-git repository', async () => {
      mockGit.status.rejects(new Error('Not a git repository'));

      await assert.rejects(
        async () => {
          await gitService.setRepositoryPath('/invalid/repo');
        },
        /Path is not a valid git repository/
      );
    });
  });
});
