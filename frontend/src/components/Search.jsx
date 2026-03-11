import React, { useState, useRef } from 'react';

const Search = () => {
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockerFilter, setBlockerFilter] = useState('all');

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchTerm === '' ||
      entry.yesterday.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.today.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.blockers.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBlocker = blockerFilter === 'all' ||
      (blockerFilter === 'with-blockers' && entry.blockers.trim() !== '') ||
      (blockerFilter === 'no-blockers' && entry.blockers.trim() === '');

    return matchesSearch && matchesBlocker;
  });

  const exportEntries = () => {
    let exportText = 'Stand-up Notes\n\n';
    entries.forEach(entry => {
      exportText += `${formatDate(entry.date)}\n\n`;
      exportText += `Yesterday: ${entry.yesterday || 'No activities recorded'}\n\n`;
      exportText += `Today: ${entry.today}\n\n`;
      exportText += `Blockers: ${entry.blockers || 'No blockers reported'}\n\n`;
      exportText += `Notes: ${entry.notes || 'No special notes'}\n\n`;
      exportText += '---\n\n';
    });
  };

  const toggleBlockerFilter = () => {
    const filters = ['all', 'with-blockers', 'no-blockers'];
    const currentIndex = filters.indexOf(blockerFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    setBlockerFilter(filters[nextIndex]);
  };

  const getBlockerFilterText = () => {
    switch (blockerFilter) {
      case 'all': return 'All Entries';
      case 'with-blockers': return 'With Blockers';
      case 'no-blockers': return 'No Blockers';
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.searchSection}>
        <input
          style={styles.searchInput}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search entries..."
        />

        <div style={styles.filterRow}>
          <button
            style={styles.filterButton}
            onClick={toggleBlockerFilter}
          >
            {getBlockerFilterText()}
          </button>
          {entries.length > 0 && (
            <button
              style={{ ...styles.filterButton, ...styles.exportButton, marginLeft: '8px' }}
              onClick={exportEntries}
            >
              Export
            </button>
          )}
        </div>

        <p style={styles.resultCount}>
          Showing {filteredEntries.length} of {entries.length} entries
        </p>
      </div>
    </div>
  );
};

const styles = {
  searchSection: {
    backgroundColor: '#f3f4f6',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    maxWidth: '800px',
    margin: '0 auto',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '16px',
    marginBottom: '12px',
    width: '100%',
    boxSizing: 'border-box',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '8px',
  },
  filterButton: {
    backgroundColor: '#4f46e5',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    color: '#ffffff',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
  },
  exportButton: {
    backgroundColor: '#059669',
  },
  resultCount: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0',
  },
};

export default Search;