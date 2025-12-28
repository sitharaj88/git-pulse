import React from 'react';

interface StashData {
  index: number;
  message: string;
  date: string;
  branch: string;
  filesChanged?: number;
}

interface StashManagerProps {
  stashes: StashData[];
  onApply?: (index: number) => void;
  onPop?: (index: number) => void;
  onDrop?: (index: number) => void;
  onCreateStash?: () => void;
}

const StashManager: React.FC<StashManagerProps> = ({
  stashes,
  onApply,
  onPop,
  onDrop,
  onCreateStash,
}) => {
  // Format relative date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (stashes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📦</div>
        <div className="empty-state-title">No stashes</div>
        <div className="empty-state-description">
          Stash your changes to save them for later without committing.
        </div>
        <button className="btn mt-lg" onClick={onCreateStash}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z"/>
          </svg>
          Create Stash
        </button>
      </div>
    );
  }

  return (
    <div className="stash-manager">
      {/* Header with action */}
      <div className="stash-header flex justify-between items-center mb-md">
        <span className="text-sm text-muted">{stashes.length} stash{stashes.length !== 1 ? 'es' : ''}</span>
        <button className="btn btn-ghost btn-sm" onClick={onCreateStash}>
          + New Stash
        </button>
      </div>

      {/* Stash list */}
      <div className="stash-list">
        {stashes.map((stash, index) => (
          <div 
            key={stash.index}
            className="stash-card"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="stash-card-header">
              <div className="stash-index-badge">
                stash@&#123;{stash.index}&#125;
              </div>
              <div className="stash-meta">
                <span className="stash-branch">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.6 }}>
                    <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878z"/>
                  </svg>
                  {stash.branch}
                </span>
                <span className="stash-date">{formatDate(stash.date)}</span>
              </div>
            </div>
            
            <div className="stash-message">
              {stash.message || 'WIP on ' + stash.branch}
            </div>

            {stash.filesChanged !== undefined && (
              <div className="stash-files text-xs text-muted mt-sm">
                {stash.filesChanged} file{stash.filesChanged !== 1 ? 's' : ''} changed
              </div>
            )}

            <div className="stash-actions">
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => onApply?.(stash.index)}
                title="Apply stash but keep it in the list"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0zm3.78 5.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L4.22 8.28a.75.75 0 011.06-1.06l1.72 1.72 3.72-3.72a.75.75 0 011.06 0z"/>
                </svg>
                Apply
              </button>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => onPop?.(stash.index)}
                title="Apply stash and remove from list"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.22 3.22a.75.75 0 011.06 0L8 4.94l1.72-1.72a.75.75 0 111.06 1.06L9.06 6l1.72 1.72a.75.75 0 01-1.06 1.06L8 7.06 6.28 8.78a.75.75 0 01-1.06-1.06L6.94 6 5.22 4.28a.75.75 0 010-1.06z"/>
                  <path d="M8 14a6 6 0 100-12 6 6 0 000 12zM8 1a8 8 0 100 16A8 8 0 008 1z"/>
                </svg>
                Pop
              </button>
              <button 
                className="btn btn-ghost btn-sm btn-danger"
                onClick={() => onDrop?.(stash.index)}
                title="Delete this stash permanently"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19a1.75 1.75 0 001.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"/>
                </svg>
                Drop
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Component-specific styles */}
      <style>{`
        .stash-manager { }
        .stash-card {
          animation: slideUp 0.3s ease forwards;
          opacity: 0;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stash-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-sm);
        }
        .stash-index-badge {
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 4px 10px;
          background: linear-gradient(135deg, var(--color-secondary) 0%, #0891B2 100%);
          color: white;
          border-radius: var(--radius-full);
        }
        .stash-meta {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
        .stash-branch {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .stash-message {
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .stash-actions {
          display: flex;
          gap: var(--space-xs);
          margin-top: var(--space-md);
          padding-top: var(--space-md);
          border-top: 1px solid var(--surface-glass-border);
        }
        .stash-actions .btn {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-sm { padding: 6px 12px; font-size: 0.75rem; }
      `}</style>
    </div>
  );
};

export default StashManager;
