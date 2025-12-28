# GitNova Test Suite

This directory contains the test suite for the GitNova extension.

## Test Structure

```
test/
├── fixtures/           # Test fixtures and mock data
│   ├── gitRepos/      # Mock git repositories for testing
│   └── mockResponses/ # Mock API responses
├── integration/         # Integration tests
└── unit/             # Unit tests
    ├── gitService.test.ts           # Tests for GitService
    ├── repositoryManager.test.ts     # Tests for RepositoryManager
    ├── eventBus.test.ts             # Tests for EventBus
    └── configManager.test.ts         # Tests for ConfigManager
```

## Unit Tests

### GitService Tests (`gitService.test.ts`)
Tests the core Git service that wraps simple-git:
- **Initialization**: Repository path setup
- **Branch Operations**: Create, delete, switch, rename, merge branches
- **Commit Operations**: Create, amend, get history, search commits
- **Status Operations**: Get working tree status, staged/unstaged files
- **Stage/Unstage Operations**: Stage, unstage, and discard changes
- **Diff Operations**: Get file diffs, staged/unstaged diffs, compare branches
- **Stash Operations**: Create, list, apply, pop, drop, clear stashes
- **Rebase Operations**: Start, continue, abort, skip, edit rebase
- **Merge Operations**: Merge, abort, continue, get conflicts, accept ours/theirs
- **Remote Operations**: Get, add, remove, set URL, prune remotes
- **Push/Pull/Fetch Operations**: Fetch, push, pull operations
- **Repository Operations**: Initialize, set path, dispose

### RepositoryManager Tests (`repositoryManager.test.ts`)
Tests the repository state and caching manager:
- **Initialization**: Setup with GitService
- **Active Repository**: Set/get active repository
- **Cache Operations**: Set/get cache, invalidate cache
- **Cache Refresh**: Refresh status, branches, remotes
- **Scheduled Refresh**: Schedule and cancel refresh timers
- **Event Subscriptions**: Subscribe to repository/cache changes
- **Repository State**: Check dirty, rebasing, merging status
- **Dispose**: Clean up resources

### EventBus Tests (`eventBus.test.ts`)
Tests the event system for inter-component communication:
- **Event Emission**: Emit events to listeners
- **Event Subscription**: Subscribe/unsubscribe from events
- **Once Subscription**: Subscribe to events that fire once
- **Event Types**: All event types (RepositoryChanged, DiffChanged, etc.)
- **Multiple Subscriptions**: Multiple listeners for same/different events
- **Event Data**: Pass complex/null data to listeners
- **Listener Management**: Count listeners, check for listeners, get event types
- **Cleanup**: Clear specific/all listeners, dispose
- **Error Handling**: Handle errors in event handlers

### ConfigManager Tests (`configManager.test.ts`)
Tests the configuration manager:
- **Initialization**: Load default configuration
- **Configuration Getters**: Get all configuration values
- **Configuration Setters**: Update specific configuration values
- **Multiple Configuration Updates**: Update multiple values at once
- **Configuration Reload**: Reload from VSCode settings
- **Configuration Reset**: Reset to defaults or specific keys
- **Configuration Changes**: Subscribe to configuration changes
- **Default Configuration**: Return default values
- **Dispose**: Clean up resources

## Running Tests

### Prerequisites
Install test dependencies:
```bash
npm install --save-dev @types/mocha @types/chai @types/sinon mocha chai sinon
```

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Specific Test File
```bash
npm test -- test/unit/gitService.test.ts
```

### Run with Coverage
```bash
npm run test:coverage
```

## Test Framework

The test suite uses:
- **Mocha**: Test runner
- **Chai**: Assertion library (via Node's built-in `assert`)
- **Sinon**: Mocking and stubbing library

## Test Coverage

The unit tests cover approximately 90% of the core services:

| Service | Coverage | Test Count |
|---------|-----------|-------------|
| GitService | ~95% | 70+ |
| RepositoryManager | ~90% | 20+ |
| EventBus | ~95% | 20+ |
| ConfigManager | ~90% | 25+ |

## Notes

- Tests use Sinon for mocking VSCode API and simple-git
- All tests are isolated and don't depend on external state
- Tests use proper cleanup in `afterEach` hooks
- Async tests use proper async/await patterns
- Error cases are tested where applicable

## Future Enhancements

- Add integration tests for end-to-end git operations
- Add tests for tree view providers (BranchProvider, CommitProvider, etc.)
- Add tests for webview managers (DiffViewManager, CommitHistoryManager)
- Add UI tests for React webview components
- Add performance tests for large repositories
