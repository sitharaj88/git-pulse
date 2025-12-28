import React from 'react';

interface BranchData {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  tracking?: string;
  ahead?: number;
  behind?: number;
  lastCommit?: string;
}

interface BranchManagerProps {
  branches: BranchData[];
  onCheckout?: (branchName: string) => void;
  onMerge?: (branchName: string) => void;
  onDelete?: (branchName: string) => void;
  onCreateBranch?: () => void;
}

const BranchManager: React.FC<BranchManagerProps> = ({
  branches,
  onCheckout,
  onMerge,
  onDelete,
  onCreateBranch,
}) => {
  const localBranches = branches.filter(b => !b.isRemote);
  const remoteBranches = branches.filter(b => b.isRemote);

  if (branches.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🌿</div>
        <div className="empty-state-title">No branches found</div>
        <div className="empty-state-description">
          Create your first branch to start organizing your work.
        </div>
        <button className="btn mt-lg" onClick={onCreateBranch}>
          Create Branch
        </button>
      </div>
    );
  }

  return (
    <div className="branch-manager">
      {/* Create branch button */}
      <div className="flex justify-between items-center mb-md">
        <span className="text-sm text-muted">
          {localBranches.length} local, {remoteBranches.length} remote
        </span>
        <button className="btn btn-sm" onClick={onCreateBranch}>
          + New Branch
        </button>
      </div>

      <div className="branch-list">
        {/* Local Branches */}
        {localBranches.length > 0 && (
          <div className="branch-section">
            <div className="branch-section-header">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.6 }}>
                <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878z"/>
              </svg>
              <span>LOCAL</span>
            </div>
            {localBranches.map((branch, index) => (
              <div 
                key={branch.name}
                className={`branch-item ${branch.isCurrent ? 'current' : ''}`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="branch-icon">
                  {branch.isCurrent ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--color-primary)">
                      <circle cx="8" cy="8" r="4"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.5 }}>
                      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  )}
                </div>
                <div className="branch-info">
                  <div className="branch-name">
                    {branch.name}
                    {branch.isCurrent && (
                      <span className="badge badge-primary ml-sm">current</span>
                    )}
                  </div>
                  {branch.tracking && (
                    <div className="branch-tracking text-xs text-muted">
                      → {branch.tracking}
                      {branch.ahead !== undefined && branch.ahead > 0 && (
                        <span className="ml-sm" style={{ color: 'var(--color-success)' }}>↑{branch.ahead}</span>
                      )}
                      {branch.behind !== undefined && branch.behind > 0 && (
                        <span className="ml-sm" style={{ color: 'var(--color-warning)' }}>↓{branch.behind}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="branch-actions">
                  {!branch.isCurrent && (
                    <>
                      <button 
                        className="btn btn-ghost btn-icon tooltip" 
                        data-tooltip="Checkout"
                        onClick={() => onCheckout?.(branch.name)}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                        </svg>
                      </button>
                      <button 
                        className="btn btn-ghost btn-icon tooltip" 
                        data-tooltip="Merge into current"
                        onClick={() => onMerge?.(branch.name)}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM8.5 9.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3.75.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                          <path d="M5 5.372v5.378a2.25 2.25 0 101.5 0V5.372a2.25 2.25 0 10-1.5 0zm6.5 4.378a2.25 2.25 0 10-1.5 0V6.75a.75.75 0 00-.75-.75h-3a.75.75 0 010-1.5h3A2.25 2.25 0 0111.5 6.75v3z"/>
                        </svg>
                      </button>
                      <button 
                        className="btn btn-ghost btn-icon btn-danger tooltip" 
                        data-tooltip="Delete"
                        onClick={() => onDelete?.(branch.name)}
                      >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19a1.75 1.75 0 001.741-1.575l.66-6.6a.75.75 0 00-1.492-.15l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Remote Branches */}
        {remoteBranches.length > 0 && (
          <div className="branch-section mt-lg">
            <div className="branch-section-header">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.6 }}>
                <path d="M1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0zM8 0a8 8 0 100 16A8 8 0 008 0z"/>
              </svg>
              <span>REMOTE</span>
            </div>
            {remoteBranches.map((branch, index) => (
              <div 
                key={branch.name}
                className="branch-item remote"
                style={{ animationDelay: `${(localBranches.length + index) * 30}ms` }}
              >
                <div className="branch-icon">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--color-secondary)" style={{ opacity: 0.6 }}>
                    <circle cx="8" cy="8" r="3"/>
                  </svg>
                </div>
                <div className="branch-info">
                  <div className="branch-name text-muted">{branch.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Component-specific styles */}
      <style>{`
        .branch-manager { }
        .branch-section { }
        .branch-section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: var(--space-sm) var(--space-md);
        }
        .branch-item {
          animation: slideIn 0.3s ease forwards;
          opacity: 0;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .branch-info { flex: 1; min-width: 0; }
        .branch-tracking { margin-top: 2px; }
        .branch-item.remote { opacity: 0.7; }
        .branch-item.remote:hover { opacity: 1; }
        .ml-sm { margin-left: var(--space-sm); }
        .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
      `}</style>
    </div>
  );
};

export default BranchManager;
