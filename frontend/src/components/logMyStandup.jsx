import React, { useState, useRef } from 'react';
import Search from './Search';

const LogMyStandup = () => {
  // Helper function to get today's date in local timezone
  const getTodayString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + 
          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
          String(today.getDate()).padStart(2, '0');
  };

  const [entries, setEntries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockerFilter, setBlockerFilter] = useState('all');
  const [expandedEntries, setExpandedEntries] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [formData, setFormData] = useState({
    date: getTodayString(),
    yesterday: '',
    today: '',
    blockers: '',
    notes: ''
  });

  // Refs for form navigation
  const dateRef = useRef(null);
  const yesterdayRef = useRef(null);
  const todayRef = useRef(null);
  const blockersRef = useRef(null);
  const notesRef = useRef(null);

  const resetForm = () => {
    const today = new Date();
    const formattedToday = today.getFullYear() + '-' + 
                          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(today.getDate()).padStart(2, '0');
    setFormData({
      date: formattedToday,
      yesterday: '',
      today: '',
      blockers: '',
      notes: ''
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.today.trim()) {
      alert('Please enter what you plan to do today');
      return;
    }

    if (editingId) {
      setEntries(entries.map(entry => 
        entry.id === editingId ? { ...formData, id: editingId } : entry
      ));
    } else {
      const newEntry = { ...formData, id: Date.now() };
      setEntries([newEntry, ...entries]);
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = (entry) => {
    setFormData({
      date: entry.date,
      yesterday: entry.yesterday,
      today: entry.today,
      blockers: entry.blockers,
      notes: entry.notes
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

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

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const toggleEntryExpansion = (entryId) => {
    const newExpandedEntries = new Set(expandedEntries);
    if (newExpandedEntries.has(entryId)) {
      newExpandedEntries.delete(entryId);
    } else {
      newExpandedEntries.add(entryId);
    }
    setExpandedEntries(newExpandedEntries);
  };

  const isEntryExpanded = (entryId) => {
    return expandedEntries.has(entryId);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedEntries(new Set());
  };

  const toggleEntrySelection = (entryId) => {
    const newSelection = new Set(selectedEntries);
    if (newSelection.has(entryId)) {
      newSelection.delete(entryId);
    } else {
      newSelection.add(entryId);
    }
    setSelectedEntries(newSelection);
  };

  const selectAllEntries = () => {
    const allIds = new Set(filteredEntries.map(entry => entry.id));
    setSelectedEntries(allIds);
  };

  const clearAllSelections = () => {
    setSelectedEntries(new Set());
  };

  const bulkDelete = () => {
    if (selectedEntries.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedEntries.size} entries?`)) {
      setEntries(entries.filter(entry => !selectedEntries.has(entry.id)));
      setSelectedEntries(new Set());
      setSelectionMode(false);
    }
  };

  const bulkShare = (format) => {
    if (selectedEntries.size === 0) return;

    const selectedEntriesData = entries.filter(entry => selectedEntries.has(entry.id));
    let shareText = '';

    if (format === 'teams') {
      shareText = `**Stand-up Notes (${selectedEntries.size} entries)**\n\n`;
      selectedEntriesData.forEach(entry => {
        shareText += `**${formatDate(entry.date)}**\n`;
        shareText += `**✅ Yesterday:** ${entry.yesterday || 'No activities recorded'}\n`;
        shareText += `**🎯 Today:** ${entry.today}\n`;
        if (entry.blockers.trim()) shareText += `**🚫 Blockers:** ${entry.blockers}\n`;
        if (entry.notes.trim()) shareText += `**📝 Notes:** ${entry.notes}\n`;
        shareText += `\n---\n\n`;
      });
    } else if (format === 'slack') {
      shareText = `*Stand-up Notes (${selectedEntries.size} entries)*\n\n`;
      selectedEntriesData.forEach(entry => {
        shareText += `*${formatDate(entry.date)}*\n`;
        shareText += `*Yesterday:* ${entry.yesterday || 'No activities recorded'}\n`;
        shareText += `*Today:* ${entry.today}\n`;
        if (entry.blockers.trim()) shareText += `*Blockers:* ${entry.blockers}\n`;
        if (entry.notes.trim()) shareText += `*Notes:* ${entry.notes}\n`;
        shareText += `\n---\n\n`;
      });
    } else {
      shareText = `Stand-up Notes (${selectedEntries.size} entries)\n\n`;
      selectedEntriesData.forEach(entry => {
        shareText += `${formatDate(entry.date)}\n`;
        shareText += `Yesterday: ${entry.yesterday || 'No activities recorded'}\n`;
        shareText += `Today: ${entry.today}\n`;
        shareText += `Blockers: ${entry.blockers || 'No blockers reported'}\n`;
        shareText += `Notes: ${entry.notes || 'No special notes'}\n`;
        shareText += `\n---\n\n`;
      });
    }

    // Copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
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

    navigator.clipboard.writeText(exportText).then(() => {
      alert('Exported to clipboard!');
    }).catch(() => {
      alert('Failed to export');
    });
  };

  const shareWithTeams = () => {
    if (entries.length === 0) {
      alert('Create some entries first to share');
      return;
    }

    const latestEntry = entries[0];
    let teamsMessage = `**Daily Stand-up - ${formatDate(latestEntry.date)}**\n\n`;
    teamsMessage += `**✅ Yesterday:**\n${latestEntry.yesterday || 'No activities recorded'}\n\n`;
    teamsMessage += `**🎯 Today:**\n${latestEntry.today}\n\n`;
    if (latestEntry.blockers.trim()) {
      teamsMessage += `**🚫 Blockers:**\n${latestEntry.blockers}\n\n`;
    }
    if (latestEntry.notes.trim()) {
      teamsMessage += `**📝 Notes:**\n${latestEntry.notes}\n\n`;
    }

    navigator.clipboard.writeText(teamsMessage).then(() => {
      alert('Teams message copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy');
    });
  };

  const shareWithSlack = () => {
    if (entries.length === 0) {
      alert('Create some entries first to share');
      return;
    }

    const latestEntry = entries[0];
    let slackMessage = `*Daily Stand-up - ${formatDate(latestEntry.date)}*\n\n`;
    slackMessage += `*Yesterday:*\n${latestEntry.yesterday || 'No activities recorded'}\n\n`;
    slackMessage += `*Today:*\n${latestEntry.today}\n\n`;
    if (latestEntry.blockers.trim()) {
      slackMessage += `*Blockers:*\n${latestEntry.blockers}\n\n`;
    }
    if (latestEntry.notes.trim()) {
      slackMessage += `*Notes:*\n${latestEntry.notes}\n\n`;
    }

    navigator.clipboard.writeText(slackMessage).then(() => {
      alert('Slack message copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy');
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

  if (showForm) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>
            {editingId ? 'Edit Entry' : 'New Stand-up Entry'}
          </h1>
        </div>
        
        <div style={styles.form}>
          <label style={styles.label}>Date</label>
          <input
            ref={dateRef}
            style={styles.input}
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />

          <label style={styles.label}>What I did yesterday</label>
          <textarea
            ref={yesterdayRef}
            style={{...styles.input, ...styles.textArea}}
            value={formData.yesterday}
            onChange={(e) => setFormData({...formData, yesterday: e.target.value})}
            placeholder="Describe what you accomplished yesterday..."
          />

          <label style={styles.label}>What I plan to do today *</label>
          <textarea
            ref={todayRef}
            style={{...styles.input, ...styles.textArea}}
            value={formData.today}
            onChange={(e) => setFormData({...formData, today: e.target.value})}
            placeholder="What are your goals for today..."
          />

          <label style={styles.label}>Blockers</label>
          <textarea
            ref={blockersRef}
            style={{...styles.input, ...styles.textArea}}
            value={formData.blockers}
            onChange={(e) => setFormData({...formData, blockers: e.target.value})}
            placeholder="Any blockers or impediments..."
          />

          <label style={styles.label}>Special Notes</label>
          <textarea
            ref={notesRef}
            style={{...styles.input, ...styles.textArea}}
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Any additional notes or observations..."
          />

          <div style={styles.buttonRow}>
            <button 
              style={{...styles.button, ...styles.primaryButton}}
              onClick={handleSubmit}
            >
              {editingId ? 'Update Entry' : 'Save Entry'}
            </button>
            <button 
              style={{...styles.button, ...styles.secondaryButton}}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Stand-up Notes</h1>
        <p style={styles.headerSubtitle}>Track your daily progress and blockers</p>
        
        <div style={styles.headerActions}>
          <button 
            style={styles.headerButton}
            onClick={() => setShowForm(true)}
          >
            New Entry
          </button>
          <button 
            style={{
              ...styles.headerButton,
              ...(selectionMode ? styles.selectionActiveButton : styles.selectionButton)
            }}
            onClick={toggleSelectionMode}
          >
            {selectionMode ? 'Done' : 'Select'}
          </button>
        </div>
      </div>

      {selectionMode && selectedEntries.size > 0 && (
        <div style={styles.selectionActions}>
          <div style={styles.selectionControls}>
            <button 
              style={styles.selectionControlButton}
              onClick={selectAllEntries}
            >
              Select All
            </button>
            <button 
              style={styles.selectionControlButton}
              onClick={clearAllSelections}
            >
              Clear
            </button>
            <span style={styles.selectedCount}>
              {selectedEntries.size} selected
            </span>
          </div>
          
          <div style={styles.bulkActions}>
            <button 
              style={{...styles.bulkButton, backgroundColor: '#4f46e5'}}
              onClick={() => bulkShare('teams')}
            >
              Share (Teams)
            </button>
            <button 
              style={{...styles.bulkButton, backgroundColor: '#7c3aed'}}
              onClick={() => bulkShare('slack')}
            >
              Share (Slack)
            </button>
            <button 
              style={{...styles.bulkButton, ...styles.deleteButton}}
              onClick={bulkDelete}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <Search />

      <div style={styles.scrollView}>
        {filteredEntries.length === 0 && entries.length === 0 ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>No entries yet</h2>
            <p style={styles.emptySubtitle}>
              Create your first stand-up entry to get started.
            </p>
            <button 
              style={styles.headerButton}
              onClick={() => setShowForm(true)}
            >
              Create Entry
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>No matching entries</h2>
            <p style={styles.emptySubtitle}>
              Try adjusting your search or filter criteria.
            </p>
            <button 
              style={styles.headerButton}
              onClick={() => {
                setSearchTerm('');
                setBlockerFilter('all');
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isExpanded = isEntryExpanded(entry.id);
            const isSelected = selectedEntries.has(entry.id);
            const hasBlockers = entry.blockers.trim() !== '';

            return (
              <div 
                key={entry.id}
                style={{
                  ...styles.entryCard,
                  ...(isSelected ? styles.selectedEntryCard : {})
                }}
              >
                <div 
                  style={styles.entryHeader}
                  onClick={() => {
                    if (selectionMode) {
                      toggleEntrySelection(entry.id);
                    } else {
                      toggleEntryExpansion(entry.id);
                    }
                  }}
                >
                  {selectionMode && (
                    <div 
                      style={styles.checkbox}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEntrySelection(entry.id);
                      }}
                    >
                      <div style={{
                        ...styles.checkboxBox,
                        ...(isSelected ? styles.checkboxSelected : {})
                      }}>
                        {isSelected && <span style={styles.checkboxTick}>✓</span>}
                      </div>
                    </div>
                  )}
                  
                  <div style={styles.entryHeaderContent}>
                    <h3 style={styles.entryDate}>{formatDate(entry.date)}</h3>
                    
                    {!isExpanded && !selectionMode && (
                      <div style={styles.entryPreview}>
                        {hasBlockers && (
                          <span style={styles.blockerIndicator}>⚠️</span>
                        )}
                        <p style={styles.previewText}>{entry.today}</p>
                      </div>
                    )}
                  </div>
                  
                  {!selectionMode && (
                    <div style={styles.entryToggle}>
                      <span style={styles.toggleIcon}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  )}
                </div>

                {isExpanded && !selectionMode && (
                  <>
                    <div style={styles.entryActions}>
                      <button 
                        style={styles.actionButton}
                        onClick={() => handleEdit(entry)}
                      >
                        Edit
                      </button>
                      <button 
                        style={styles.actionButton}
                        onClick={() => handleDelete(entry.id)}
                      >
                        <span style={styles.deleteButtonText}>Delete</span>
                      </button>
                    </div>

                    <div style={styles.entryContent}>
                      <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Yesterday</h4>
                        <div style={styles.sectionContent}>
                          <p style={styles.sectionText}>
                            {entry.yesterday || 'No activities recorded'}
                          </p>
                        </div>
                      </div>

                      <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Today's Plan</h4>
                        <div style={{...styles.sectionContent, ...styles.todayContent}}>
                          <p style={styles.sectionText}>{entry.today}</p>
                        </div>
                      </div>

                      <div style={styles.section}>
                        <h4 style={{...styles.sectionTitle, ...styles.blockersTitle}}>
                          ⚠️ Blockers
                        </h4>
                        <div style={{...styles.sectionContent, ...styles.blockersContent}}>
                          <p style={styles.sectionText}>
                            {entry.blockers || 'No blockers reported'}
                          </p>
                        </div>
                      </div>

                      <div style={styles.section}>
                        <h4 style={{...styles.sectionTitle, ...styles.notesTitle}}>
                          📝 Special Notes
                        </h4>
                        <div style={{...styles.sectionContent, ...styles.notesContent}}>
                          <p style={styles.sectionText}>
                            {entry.notes || 'No special notes'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  scrollView: {
    padding: '16px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderBottom: '1px solid #e5e7eb',
    maxWidth: '800px',
    margin: '0 auto',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '4px',
    margin: '0 0 4px 0',
  },
  headerSubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '16px',
    margin: '0 0 16px 0',
  },
  headerButton: {
    backgroundColor: '#2563eb',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  selectionButton: {
    backgroundColor: '#6b7280',
  },
  selectionActiveButton: {
    backgroundColor: '#059669',
  },
  selectionActions: {
    backgroundColor: '#f3f4f6',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    maxWidth: '800px',
    margin: '0 auto',
  },
  selectionControls: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px',
  },
  selectionControlButton: {
    backgroundColor: '#4f46e5',
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px',
  },
  selectedCount: {
    marginLeft: 'auto',
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  bulkActions: {
    display: 'flex',
    gap: '8px',
  },
  bulkButton: {
    flex: 1,
    padding: '8px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  selectedEntryCard: {
    borderColor: '#3b82f6',
    borderWidth: '2px',
  },
  checkbox: {
    marginRight: '12px',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  checkboxBox: {
    width: '20px',
    height: '20px',
    border: '2px solid #d1d5db',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxTick: {
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  form: {
    padding: '16px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  label: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
    marginTop: '16px',
    display: 'block',
  },
  input: {
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  textArea: {
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  buttonRow: {
    display: 'flex',
    marginTop: '24px',
    gap: '12px',
  },
  button: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#d1d5db',
    color: '#374151',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
    minHeight: '400px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '500',
    color: '#111827',
    marginBottom: '8px',
  },
  emptySubtitle: {
    fontSize: '16px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '16px',
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    marginBottom: '16px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
  },
  entryHeader: {
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
  },
  entryHeaderContent: {
    flex: 1,
  },
  entryPreview: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '4px',
  },
  blockerIndicator: {
    marginRight: '8px',
    fontSize: '12px',
  },
  previewText: {
    fontSize: '14px',
    color: '#6b7280',
    flex: 1,
    margin: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  entryToggle: {
    paddingLeft: '12px',
  },
  toggleIcon: {
    fontSize: '16px',
    color: '#9ca3af',
  },
  entryActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '0 16px 8px 16px',
    borderBottom: '1px solid #f3f4f6',
    gap: '8px',
  },
  entryDate: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0',
  },
  actionButton: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#f3f4f6',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
  entryContent: {
    padding: '16px',
  },
  section: {
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  blockersTitle: {
    color: '#d97706',
  },
  notesTitle: {
    color: '#059669',
  },
  sectionContent: {
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
  },
  todayContent: {
    backgroundColor: '#eff6ff',
  },
  blockersContent: {
    backgroundColor: '#fff7ed',
  },
  notesContent: {
    backgroundColor: '#f0fdf4',
  },
  sectionText: {
    fontSize: '15px',
    color: '#4b5563',
    lineHeight: '20px',
    margin: '0',
    whiteSpace: 'pre-wrap',
  },
};

export default LogMyStandup;