# GitNova - Advanced Git Integration

A comprehensive git plugin for Visual Studio Code that provides advanced git operations through an intuitive, performant, and modern user interface.

## Features

- **Branch Management**: Create, delete, rename, switch, and compare branches with ease
- **Commit History**: View and search commit history with detailed information
- **Diff Viewer**: Side-by-side and unified diff views with syntax highlighting
- **Stash Management**: Create, apply, pop, and drop stashes
- **Interactive Rebase**: Drag-and-drop commit reordering with conflict resolution
- **Merge Conflict Resolution**: Side-by-side conflict view with merge strategies
- **Remote Operations**: Fetch, pull, push, and manage remotes
- **Status Bar Integration**: Quick access to branch, status, and sync information
- **Tree Views**: Native VSCode tree views for branches, commits, stashes, and remotes

## Technology Stack

- **TypeScript 5.x** - Type-safe development
- **VSCode Extension API** - Native integration with VSCode
- **Simple-git 3.x** - Git operations wrapper
- **React 18.x** - Modern UI components for webviews
- **Zustand 4.x** - Lightweight state management
- **esbuild** - Fast bundling and compilation

## Installation

### From VSCode Marketplace

Coming soon!

### From Source

1. Clone the repository:
```bash
git clone https://github.com/sitharaj88/git-nova.git
cd git-nova
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run compile
```

4. Run in development mode:
```bash
npm run watch
```

5. Press F5 in VSCode to launch the Extension Development Host

## Development

### Project Structure

```
git-nova/
├── src/                    # Main source code
│   ├── commands/          # Command handlers
│   ├── core/              # Core services (GitService, RepositoryManager, EventBus)
│   ├── models/            # Data models and interfaces
│   ├── providers/         # Tree data providers
│   ├── views/             # Webview panel managers
│   ├── webview/           # Webview UI code
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── constants/         # Constants and enums
├── webviews/              # React webview source
│   ├── components/        # React components
│   ├── state/            # State management
│   ├── utils/            # Utility functions
│   └── styles/           # CSS/SCSS files
├── test/                  # Test files
├── resources/             # Icons and schemas
└── .vscode/              # VSCode configuration
```

### Available Scripts

- `npm run compile` - Build the extension
- `npm run watch` - Build and watch for changes
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run test` - Run tests
- `npm run package` - Package the extension for distribution

### Configuration

The extension can be configured through VSCode settings:

```json
{
  "gitNova.autoRefresh": true,
  "gitNova.refreshInterval": 60000,
  "gitNova.showStatusBar": true,
  "gitNova.defaultBranchName": "main",
  "gitNova.showRemoteBranches": true,
  "gitNova.branchSortOrder": "recent",
  "gitNova.showCommitGraph": true,
  "gitNova.diffViewMode": "unified",
  "gitNova.ignoreWhitespace": false,
  "gitNova.showLineNumbers": true,
  "gitNova.autoStashBeforeRebase": false,
  "gitNova.autoFetch": false
}
```

## Architecture

The plugin follows a layered architecture with event-driven communication:

1. **Presentation Layer**: Tree views, webviews, and status bar
2. **Command Layer**: Command handlers for user actions
3. **Service Layer**: GitService, RepositoryManager, EventBus
4. **Data Layer**: Models, interfaces, and cache

For detailed architecture information, see the architecture documentation in the `plans/` directory.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Apache-2.0 License - see LICENSE file for details
