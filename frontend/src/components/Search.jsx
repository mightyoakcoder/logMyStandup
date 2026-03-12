const Search = ({ searchTerm, onSearchChange, blockerFilter, onBlockerFilterChange, filteredCount, totalEntries }) => {
  const filters = ['all', 'with-blockers', 'no-blockers'];
  const filterLabels = { all: 'All', 'with-blockers': 'Blockers', 'no-blockers': 'Clear' };

  return (
    <div style={styles.searchSection}>
      <input
        style={styles.searchInput}
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search entries..."
      />
      <div style={styles.filterRow}>
        {filters.map(f => (
          <button
            key={f}
            style={{ ...styles.filterBtn, ...(blockerFilter === f ? styles.filterBtnActive : {}) }}
            onClick={() => onBlockerFilterChange(f)}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>
      {(searchTerm || blockerFilter !== 'all') && (
        <p style={styles.resultCount}>{filteredCount} of {totalEntries} entries</p>
      )}
    </div>
  );
};

const styles = {
  searchSection: {
    marginBottom: '16px',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '14px',
    marginBottom: '8px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },
  filterRow: {
    display: 'flex',
    gap: '6px',
  },
  filterBtn: {
    padding: '5px 12px',
    borderRadius: '20px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  filterBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    color: '#2563eb',
  },
  resultCount: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '8px 0 0 2px',
  },
};

export default Search;
