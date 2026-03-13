import Search from './Search';

const Sidebar = ({
  sidebarOpen,
  onNewEntry,
  onExportAll,
  onExportSelect,
  exportMode,
  entriesCount,
  searchTerm,
  onSearchChange,
  blockerFilter,
  onBlockerFilterChange,
  filteredCount,
}) => (
  <aside className={`lms-sidebar${sidebarOpen ? ' open' : ''}`} style={styles.sidebar}>
    <button style={styles.newEntryBtn} onClick={onNewEntry}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
      New Entry
    </button>

    <div style={styles.sidebarDivider} />

    <p style={styles.sidebarLabel}>Export</p>
    <button
      style={{ ...styles.sidebarBtn, ...(entriesCount === 0 ? styles.sidebarBtnDisabled : {}) }}
      onClick={onExportAll}
      disabled={entriesCount === 0}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 6 }}>
        <path d="M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 10.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      Export All PDF
    </button>
    <button
      style={{ ...styles.sidebarBtn, ...(entriesCount === 0 ? styles.sidebarBtnDisabled : {}), ...(exportMode ? styles.sidebarBtnActive : {}) }}
      onClick={onExportSelect}
      disabled={entriesCount === 0}
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 6 }}>
        <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="7" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="7" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="7" y="7" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
      Select to Export
    </button>

    <div style={styles.sidebarDivider} />

    <p style={styles.sidebarLabel}>Filter</p>
    <Search
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      blockerFilter={blockerFilter}
      onBlockerFilterChange={onBlockerFilterChange}
      filteredCount={filteredCount}
      totalEntries={entriesCount}
    />

    <div style={{ flex: 1 }} />

    <p style={styles.sidebarFooter}>{entriesCount} total {entriesCount === 1 ? 'entry' : 'entries'}</p>
  </aside>
);

const styles = {
  sidebar: {
    width: '220px',
    minWidth: '220px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    position: 'sticky',
    top: '56px',
    height: 'calc(100vh - 56px)',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  sidebarDivider: {
    height: '1px',
    backgroundColor: '#f3f4f6',
    margin: '8px 0',
  },
  sidebarLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    margin: '0 0 4px 2px',
  },
  sidebarBtn: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
  },
  sidebarBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    color: '#2563eb',
  },
  sidebarBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  sidebarFooter: {
    fontSize: '11px',
    color: '#d1d5db',
    textAlign: 'center',
    margin: '8px 0 0',
  },
  newEntryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Sidebar;
