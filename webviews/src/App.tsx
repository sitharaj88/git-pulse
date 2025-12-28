import React, { useState, useEffect, useCallback } from 'react';
import './styles/global.css';

// Icons as inline SVG components
const GitBranchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm.5 4.75a.75.75 0 00-1.5 0v3.5a.75.75 0 00.37.65l2.5 1.5a.75.75 0 10.76-1.3L8.5 7.94V4.75z"/>
  </svg>
);

const DiffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8.75 1.75a.75.75 0 00-1.5 0V5H4a.75.75 0 000 1.5h3.25v3.25a.75.75 0 001.5 0V6.5H12A.75.75 0 0012 5H8.75V1.75zM4 13a.75.75 0 000 1.5h8a.75.75 0 000-1.5H4z"/>
  </svg>
);

const StashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M2.75 6.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H2.75zm0 3a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H2.75zm0-6a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H2.75z"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"/>
    <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"/>
  </svg>
);

interface WebviewMessage {
  command: string;
  diff?: DiffData;
  commits?: CommitData[];
  branches?: BranchData[];
  stashes?: StashData[];
  error?: string;
}

interface CommitData {
  hash: string;
  shortHash: string;
  message: string;
  author: { name: string; email: string };
  date: string;
  branch?: string;
  tags?: string[];
}

interface DiffData {
  filePath: string;
  hunks: HunkData[];
  additions: number;
  deletions: number;
}

interface HunkData {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: LineData[];
}

interface LineData {
  type: 'addition' | 'deletion' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface BranchData {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  tracking?: string;
  ahead?: number;
  behind?: number;
}

interface StashData {
  index: number;
  message: string;
  date: string;
  branch: string;
}

type ViewType = 'commits' | 'diff' | 'branches' | 'stashes';

/**
 * Main GitNova App Component
 */
const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('commits');
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [stashes, setStashes] = useState<StashData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  // Handle messages from VS Code extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data as WebviewMessage;
      
      switch (message.command) {
        case 'showCommits':
          setCommits(message.commits || []);
          setLoading(false);
          break;
        case 'showDiff':
          setDiffData(message.diff || null);
          setLoading(false);
          break;
        case 'showBranches':
          setBranches(message.branches || []);
          setLoading(false);
          break;
        case 'showStashes':
          setStashes(message.stashes || []);
          setLoading(false);
          break;
        case 'showEmpty':
          setCommits([]);
          setDiffData(null);
          setBranches([]);
          setStashes([]);
          setLoading(false);
          break;
        case 'showError':
          setLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage as EventListener);
    return () => window.removeEventListener('message', handleMessage as EventListener);
  }, []);

  // Copy to clipboard helper
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // Format relative date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get initials from author name
  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Escape HTML for diff content
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Render commit history
  const renderCommits = () => {
    if (commits.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No commits yet</div>
          <div className="empty-state-description">
            Commits will appear here once you start making changes to your repository.
          </div>
        </div>
      );
    }

    return (
      <div className="commit-list">
        {commits.map((commit) => (
          <div 
            key={commit.hash}
            className={`commit-item ${selectedCommit === commit.hash ? 'selected' : ''}`}
            onClick={() => setSelectedCommit(commit.hash === selectedCommit ? null : commit.hash)}
          >
            <div className="commit-avatar">
              {getInitials(commit.author.name)}
            </div>
            <div className="commit-content">
              <div className="commit-message">{commit.message}</div>
              <div className="commit-meta">
                <span 
                  className="commit-hash tooltip" 
                  data-tooltip="Click to copy"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(commit.hash);
                  }}
                >
                  {commit.shortHash}
                </span>
                <span>{commit.author.name}</span>
                <span>•</span>
                <span>{formatDate(commit.date)}</span>
                {commit.branch && (
                  <span className="commit-branch">
                    <GitBranchIcon /> {commit.branch}
                  </span>
                )}
                {commit.tags?.map(tag => (
                  <span key={tag} className="commit-tag">🏷️ {tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render diff viewer
  const renderDiff = () => {
    if (!diffData || diffData.hunks.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No diff to display</div>
          <div className="empty-state-description">
            Select a file or commit to view its changes.
          </div>
        </div>
      );
    }

    return (
      <div className="diff-container">
        <div className="diff-header">
          <div className="diff-file-info">
            <span>📄</span>
            <span>{diffData.filePath}</span>
          </div>
          <div className="diff-stats">
            <span className="diff-stat-added">+{diffData.additions}</span>
            <span className="diff-stat-removed">-{diffData.deletions}</span>
          </div>
        </div>
        <div className="diff-content">
          {diffData.hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex} className="hunk">
              <div className="hunk-header">
                @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
              </div>
              {hunk.lines.map((line, lineIndex) => (
                <div key={lineIndex} className={`line ${line.type}`}>
                  <span className="line-number">
                    {line.type === 'deletion' ? line.oldLineNumber : line.newLineNumber || ''}
                  </span>
                  <span className="line-content">{escapeHtml(line.content)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render branches
  const renderBranches = () => {
    if (branches.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <div className="empty-state-title">No branches found</div>
          <div className="empty-state-description">
            Create your first branch to start organizing your work.
          </div>
        </div>
      );
    }

    const localBranches = branches.filter(b => !b.isRemote);
    const remoteBranches = branches.filter(b => b.isRemote);

    return (
      <div className="branch-list">
        {localBranches.length > 0 && (
          <>
            <div className="text-xs text-muted font-medium mb-sm mt-md">LOCAL BRANCHES</div>
            {localBranches.map((branch) => (
              <div key={branch.name} className={`branch-item ${branch.isCurrent ? 'current' : ''}`}>
                <div className="branch-icon"><GitBranchIcon /></div>
                <div className="branch-name">{branch.name}</div>
                {branch.isCurrent && <span className="badge badge-primary">current</span>}
                {branch.ahead !== undefined && branch.ahead > 0 && (
                  <span className="badge badge-success">↑{branch.ahead}</span>
                )}
                {branch.behind !== undefined && branch.behind > 0 && (
                  <span className="badge badge-warning">↓{branch.behind}</span>
                )}
                <div className="branch-actions">
                  <button className="btn btn-ghost btn-icon tooltip" data-tooltip="Checkout">
                    ➡️
                  </button>
                  <button className="btn btn-ghost btn-icon tooltip" data-tooltip="Merge">
                    🔀
                  </button>
                  <button className="btn btn-ghost btn-icon tooltip" data-tooltip="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
        {remoteBranches.length > 0 && (
          <>
            <div className="text-xs text-muted font-medium mb-sm mt-lg">REMOTE BRANCHES</div>
            {remoteBranches.map((branch) => (
              <div key={branch.name} className="branch-item">
                <div className="branch-icon" style={{ color: 'var(--color-secondary)' }}>
                  <GitBranchIcon />
                </div>
                <div className="branch-name text-muted">{branch.name}</div>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  // Render stashes
  const renderStashes = () => {
    if (stashes.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No stashes</div>
          <div className="empty-state-description">
            Stash your changes to save them for later without committing.
          </div>
        </div>
      );
    }

    return (
      <div className="stash-list">
        {stashes.map((stash) => (
          <div key={stash.index} className="stash-card">
            <div className="stash-header">
              <span className="stash-index">stash@&#123;{stash.index}&#125;</span>
              <span className="stash-date">{formatDate(stash.date)}</span>
            </div>
            <div className="stash-message">{stash.message}</div>
            <div className="stash-actions">
              <button className="btn btn-ghost text-sm">Apply</button>
              <button className="btn btn-ghost text-sm">Pop</button>
              <button className="btn btn-ghost btn-danger text-sm">Drop</button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Tab configuration
  const tabs = [
    { id: 'commits' as ViewType, label: 'History', icon: <HistoryIcon /> },
    { id: 'diff' as ViewType, label: 'Changes', icon: <DiffIcon /> },
    { id: 'branches' as ViewType, label: 'Branches', icon: <GitBranchIcon /> },
    { id: 'stashes' as ViewType, label: 'Stashes', icon: <StashIcon /> },
  ];

  return (
    <div className="git-nova-app">
      <div className="header">
        <h1>GitNova</h1>
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeView === tab.id ? 'active' : ''}
              onClick={() => setActiveView(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading...</div>
          </div>
        ) : (
          <>
            {activeView === 'commits' && renderCommits()}
            {activeView === 'diff' && renderDiff()}
            {activeView === 'branches' && renderBranches()}
            {activeView === 'stashes' && renderStashes()}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
