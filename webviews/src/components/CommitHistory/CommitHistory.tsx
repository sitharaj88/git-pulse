import React from 'react';

interface CommitData {
  hash: string;
  shortHash: string;
  message: string;
  author: { name: string; email: string };
  date: string;
  branch?: string;
  tags?: string[];
  files?: { path: string; status: string }[];
}

interface CommitHistoryProps {
  commits: CommitData[];
  selectedCommit?: string;
  onSelectCommit?: (hash: string) => void;
  onCopyHash?: (hash: string) => void;
}

const CommitHistory: React.FC<CommitHistoryProps> = ({
  commits,
  selectedCommit,
  onSelectCommit,
  onCopyHash,
}) => {
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

  // Generate avatar background color based on name
  const getAvatarColor = (name: string): string => {
    const colors = [
      'linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)',
      'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
      'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
      'linear-gradient(135deg, #EF4444 0%, #F87171 100%)',
      'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

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
    <div className="commit-history">
      <div className="commit-list">
        {commits.map((commit, index) => (
          <div 
            key={commit.hash}
            className={`commit-item ${selectedCommit === commit.hash ? 'selected' : ''}`}
            onClick={() => onSelectCommit?.(commit.hash)}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div 
              className="commit-avatar" 
              style={{ background: getAvatarColor(commit.author.name) }}
            >
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
                    onCopyHash?.(commit.hash);
                  }}
                >
                  {commit.shortHash}
                </span>
                <span className="commit-author">{commit.author.name}</span>
                <span className="commit-separator">•</span>
                <span className="commit-date">{formatDate(commit.date)}</span>
                {commit.branch && (
                  <span className="commit-branch">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878z"/>
                    </svg>
                    {commit.branch}
                  </span>
                )}
                {commit.tags?.map(tag => (
                  <span key={tag} className="commit-tag">
                    🏷️ {tag}
                  </span>
                ))}
              </div>
              {/* Expandable files section */}
              {selectedCommit === commit.hash && commit.files && (
                <div className="commit-files mt-md">
                  <div className="text-xs text-muted mb-sm">Changed Files:</div>
                  {commit.files.map((file) => (
                    <div key={file.path} className="commit-file flex items-center gap-sm text-sm">
                      <span className={`file-status-${file.status}`}>
                        {file.status === 'added' ? '+' : file.status === 'deleted' ? '-' : '~'}
                      </span>
                      <span className="truncate">{file.path}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitHistory;
