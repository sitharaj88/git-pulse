import React, { useState } from 'react';

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

interface DiffViewerProps {
  filePath?: string;
  hunks?: HunkData[];
  additions?: number;
  deletions?: number;
  viewMode?: 'unified' | 'split';
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  filePath = '',
  hunks = [],
  additions = 0,
  deletions = 0,
  viewMode = 'unified',
}) => {
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);

  // Escape HTML for safe rendering
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Get file extension icon
  const getFileIcon = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
      ts: '📘', tsx: '📘', js: '📒', jsx: '📒',
      css: '🎨', scss: '🎨', less: '🎨',
      html: '🌐', json: '📋', md: '📝',
      py: '🐍', go: '🔷', rs: '🦀',
      java: '☕', rb: '💎', php: '🐘',
    };
    return icons[ext || ''] || '📄';
  };

  if (!filePath || hunks.length === 0) {
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
    <div className="diff-viewer">
      <div className="diff-container">
        {/* Header */}
        <div className="diff-header">
          <div className="diff-file-info">
            <span className="file-icon">{getFileIcon(filePath)}</span>
            <span className="file-path">{filePath}</span>
          </div>
          <div className="flex items-center gap-md">
            <div className="diff-stats">
              <span className="diff-stat-added">+{additions}</span>
              <span className="diff-stat-removed">-{deletions}</span>
            </div>
            <div className="diff-toggle">
              <button 
                className={`btn btn-ghost btn-sm ${currentViewMode === 'unified' ? 'active' : ''}`}
                onClick={() => setCurrentViewMode('unified')}
              >
                Unified
              </button>
              <button 
                className={`btn btn-ghost btn-sm ${currentViewMode === 'split' ? 'active' : ''}`}
                onClick={() => setCurrentViewMode('split')}
              >
                Split
              </button>
            </div>
          </div>
        </div>

        {/* Diff Content */}
        <div className="diff-content">
          {currentViewMode === 'unified' ? (
            // Unified view
            hunks.map((hunk, hunkIndex) => (
              <div key={hunkIndex} className="hunk">
                <div className="hunk-header">
                  <span className="hunk-range">
                    @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                  </span>
                </div>
                {hunk.lines.map((line, lineIndex) => (
                  <div key={lineIndex} className={`line ${line.type}`}>
                    <span className="line-number line-number-old">
                      {line.type !== 'addition' ? line.oldLineNumber : ''}
                    </span>
                    <span className="line-number line-number-new">
                      {line.type !== 'deletion' ? line.newLineNumber : ''}
                    </span>
                    <span className="line-prefix">
                      {line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' '}
                    </span>
                    <span 
                      className="line-content" 
                      dangerouslySetInnerHTML={{ __html: escapeHtml(line.content) }}
                    />
                  </div>
                ))}
              </div>
            ))
          ) : (
            // Split view
            hunks.map((hunk, hunkIndex) => (
              <div key={hunkIndex} className="hunk hunk-split">
                <div className="hunk-header">
                  <span className="hunk-range">
                    @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                  </span>
                </div>
                <div className="split-container">
                  <div className="split-left">
                    {hunk.lines.filter(l => l.type !== 'addition').map((line, i) => (
                      <div key={i} className={`line ${line.type === 'deletion' ? 'deletion' : 'context'}`}>
                        <span className="line-number">{line.oldLineNumber}</span>
                        <span 
                          className="line-content"
                          dangerouslySetInnerHTML={{ __html: escapeHtml(line.content) }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="split-right">
                    {hunk.lines.filter(l => l.type !== 'deletion').map((line, i) => (
                      <div key={i} className={`line ${line.type === 'addition' ? 'addition' : 'context'}`}>
                        <span className="line-number">{line.newLineNumber}</span>
                        <span 
                          className="line-content"
                          dangerouslySetInnerHTML={{ __html: escapeHtml(line.content) }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Additional styles for split view */}
      <style>{`
        .diff-toggle {
          display: flex;
          gap: 4px;
          background: var(--surface-tertiary);
          padding: 2px;
          border-radius: var(--radius-md);
        }
        .diff-toggle .btn { padding: 4px 12px; font-size: 0.75rem; }
        .diff-toggle .btn.active { background: var(--color-primary); color: white; }
        .hunk-split .split-container { display: flex; }
        .hunk-split .split-left, .hunk-split .split-right { flex: 1; }
        .hunk-split .split-left { border-right: 1px solid var(--surface-glass-border); }
        .line-number-old, .line-number-new { 
          width: 40px; text-align: right; padding-right: 8px;
          color: var(--text-tertiary); user-select: none;
        }
        .line-prefix { 
          width: 20px; text-align: center; user-select: none;
          font-weight: bold;
        }
        .line.addition .line-prefix { color: var(--git-added); }
        .line.deletion .line-prefix { color: var(--git-deleted); }
        .file-icon { font-size: 1.1rem; }
        .btn-sm { padding: 4px 8px; font-size: 0.75rem; }
      `}</style>
    </div>
  );
};

export default DiffViewer;
