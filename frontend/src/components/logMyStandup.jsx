import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import Search from './Search';
import EntryModal from './EntryModal';

const normalizeEntry = (e) => ({
  ...e,
  date: e.date ? String(e.date).slice(0, 10) : '',
  yesterday: e.yesterday || '',
  today: e.today || '',
  blockers: e.blockers || '',
  notes: e.notes || '',
});

const LogMyStandup = ({ sidebarOpen, onSidebarClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockerFilter, setBlockerFilter] = useState('all');
  const [collapsedEntries, setCollapsedEntries] = useState(new Set());
  const [exportMode, setExportMode] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState(new Set());

  const isMobile = () => window.innerWidth <= 700;

  useEffect(() => {
    fetch('/entries')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load entries (${res.status})`);
        return res.json();
      })
      .then(data => {
        const normalized = data.map(normalizeEntry);
        setEntries(normalized);
        if (isMobile()) {
          setCollapsedEntries(new Set(normalized.map(e => e.id)));
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (formData) => {
    try {
      if (editingEntry) {
        const res = await fetch(`/entries/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error(`Failed to update entry (${res.status})`);
        const updated = await res.json();
        setEntries(entries.map(e => e.id === editingEntry.id ? normalizeEntry(updated) : e));
      } else {
        const res = await fetch('/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error(`Failed to create entry (${res.status})`);
        const created = normalizeEntry(await res.json());
        setEntries([created, ...entries]);
        if (isMobile()) {
          setCollapsedEntries(prev => new Set([...prev, created.id]));
        }
      }
      setShowModal(false);
      setEditingEntry(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await fetch(`/entries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete entry (${res.status})`);
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      day: day,
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year,
    };
  };

  const toggleEntryExpansion = (entryId) => {
    const next = new Set(collapsedEntries);
    if (next.has(entryId)) next.delete(entryId); else next.add(entryId);
    setCollapsedEntries(next);
  };

  const toggleExportSelection = (entryId) => {
    const next = new Set(exportSelectedIds);
    if (next.has(entryId)) next.delete(entryId); else next.add(entryId);
    setExportSelectedIds(next);
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

  const buildPdf = (entriesToExport) => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPage = (needed) => {
      if (y + needed > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeLine = (text, size, style, color) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', style || 'normal');
      doc.setTextColor(...(color || [0, 0, 0]));
      const lines = doc.splitTextToSize(text, maxWidth);
      checkPage(lines.length * size * 1.4);
      doc.text(lines, margin, y);
      y += lines.length * size * 1.4;
    };

    writeLine('Stand-up Notes', 20, 'bold', [17, 24, 39]);
    y += 12;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 20;

    entriesToExport.forEach((entry, i) => {
      checkPage(120);
      writeLine(formatDate(entry.date), 13, 'bold', [37, 99, 235]);
      y += 4;
      writeLine('Yesterday', 10, 'bold', [107, 114, 128]);
      writeLine(entry.yesterday || 'No activities recorded', 10, 'normal', [75, 85, 99]);
      y += 6;
      writeLine("Today's Plan", 10, 'bold', [107, 114, 128]);
      writeLine(entry.today, 10, 'normal', [75, 85, 99]);
      y += 6;
      if (entry.blockers.trim()) {
        writeLine('Blockers', 10, 'bold', [217, 119, 6]);
        writeLine(entry.blockers, 10, 'normal', [75, 85, 99]);
        y += 6;
      }
      if (entry.notes.trim()) {
        writeLine('Notes', 10, 'bold', [5, 150, 105]);
        writeLine(entry.notes, 10, 'normal', [75, 85, 99]);
        y += 6;
      }
      if (i < entriesToExport.length - 1) {
        y += 8;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, y, pageWidth - margin, y);
        y += 16;
      }
    });

    doc.save('standup-notes.pdf');
  };

  const exportAll = () => buildPdf(filteredEntries.length > 0 ? filteredEntries : entries);

  const exportSelected = () => {
    const toExport = entries.filter(e => exportSelectedIds.has(e.id));
    if (toExport.length === 0) return;
    buildPdf(toExport);
    setExportMode(false);
    setExportSelectedIds(new Set());
  };

  const openNew = () => { setEditingEntry(null); setShowModal(true); };

  const closeSidebar = () => onSidebarClose?.();

  return (
    <div style={styles.root}>
      <style>{`
        @media (max-width: 700px) {
          .lms-sidebar {
            position: fixed !important;
            top: 56px !important;
            left: 0 !important;
            height: calc(100vh - 56px) !important;
            z-index: 200 !important;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            box-shadow: 4px 0 16px rgba(0,0,0,0.12) !important;
          }
          .lms-sidebar.open {
            transform: translateX(0);
          }
          .lms-backdrop {
            display: block !important;
            opacity: 1;
          }
          .lms-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .lms-backdrop { display: none; }
        .lms-sidebar { transition: transform 0.25s ease; }
      `}</style>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="lms-backdrop"
          onClick={closeSidebar}
          style={styles.backdrop}
        />
      )}

      <div style={styles.layout}>
      {/* Sidebar */}
      <aside className={`lms-sidebar${sidebarOpen ? ' open' : ''}`} style={styles.sidebar}>
        <button style={styles.newEntryBtn} onClick={() => { openNew(); closeSidebar(); }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New Entry
        </button>

        <div style={styles.sidebarDivider} />

        <p style={styles.sidebarLabel}>Export</p>
        <button
          style={{ ...styles.sidebarBtn, ...(entries.length === 0 ? styles.sidebarBtnDisabled : {}) }}
          onClick={() => { exportAll(); closeSidebar(); }}
          disabled={entries.length === 0}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ marginRight: 6 }}>
            <path d="M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 10.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Export All PDF
        </button>
        <button
          style={{ ...styles.sidebarBtn, ...(entries.length === 0 ? styles.sidebarBtnDisabled : {}), ...(exportMode ? styles.sidebarBtnActive : {}) }}
          onClick={() => { setExportMode(true); setExportSelectedIds(new Set()); closeSidebar(); }}
          disabled={entries.length === 0}
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
          onSearchChange={setSearchTerm}
          blockerFilter={blockerFilter}
          onBlockerFilterChange={setBlockerFilter}
          filteredCount={filteredEntries.length}
          totalEntries={entries.length}
        />

        <div style={{ flex: 1 }} />

        <p style={styles.sidebarFooter}>{entries.length} total {entries.length === 1 ? 'entry' : 'entries'}</p>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {/* Export mode bar */}
        {exportMode && (
          <div style={styles.exportBar}>
            <div style={styles.exportBarActions}>
              <button
                style={{ ...styles.exportBarBtn, opacity: exportSelectedIds.size === 0 ? 0.5 : 1 }}
                onClick={exportSelected}
                disabled={exportSelectedIds.size === 0}
              >
                Export Selected PDF
              </button>
              <button
                style={{ ...styles.exportBarBtn, backgroundColor: '#6b7280' }}
                onClick={() => { setExportMode(false); setExportSelectedIds(new Set()); }}
              >
                Cancel
              </button>
            </div>
            <span style={styles.exportBarCount}>{exportSelectedIds.size} selected</span>
          </div>
        )}

        {/* Entry grid */}
        {loading ? (
          <div style={styles.emptyState}>
            <p style={styles.emptySubtitle}>Loading entries...</p>
          </div>
        ) : error ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>Could not load entries</h2>
            <p style={styles.emptySubtitle}>{error}</p>
          </div>
        ) : filteredEntries.length === 0 && entries.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📋</div>
            <h2 style={styles.emptyTitle}>No entries yet</h2>
            <p style={styles.emptySubtitle}>Create your first stand-up entry to get started.</p>
            <button style={styles.newEntryBtn} onClick={openNew}>New Entry</button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <h2 style={styles.emptyTitle}>No matching entries</h2>
            <p style={styles.emptySubtitle}>Try adjusting your search or filter.</p>
            <button style={styles.clearBtn} onClick={() => { setSearchTerm(''); setBlockerFilter('all'); }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="lms-grid" style={styles.grid}>
            {filteredEntries.map((entry) => {
              const isExpanded = !collapsedEntries.has(entry.id);
              const isExportSelected = exportSelectedIds.has(entry.id);
              const hasBlockers = entry.blockers.trim() !== '';
              const dateParts = formatDateShort(entry.date);

              return (
                <div
                  key={entry.id}
                  style={{
                    ...styles.card,
                    ...(isExportSelected ? styles.cardSelected : {}),
                    ...(isExpanded ? styles.cardExpanded : {}),
                  }}
                >
                  {/* Card header */}
                  <div
                    style={styles.cardHeader}
                    onClick={() => exportMode ? toggleExportSelection(entry.id) : toggleEntryExpansion(entry.id)}
                  >
                    {/* Date badge */}
                    <div style={styles.dateBadge}>
                      <span style={styles.dateBadgeDay}>{dateParts.day}</span>
                      <span style={styles.dateBadgeMonth}>{dateParts.month}</span>
                    </div>

                    <div style={styles.cardHeaderContent}>
                      <p style={styles.cardWeekday}>{dateParts.weekday}, {dateParts.year}</p>
                      {!isExpanded && (
                        <p style={styles.cardPreview}>{entry.today || entry.yesterday}</p>
                      )}
                      <div style={styles.cardTags}>
                        {hasBlockers && <span style={styles.tagBlocker}>Blocker</span>}
                        {entry.notes.trim() && <span style={styles.tagNotes}>Notes</span>}
                      </div>
                    </div>

                    <div style={styles.cardControls}>
                      {exportMode ? (
                        <div style={{ ...styles.checkboxBox, ...(isExportSelected ? styles.checkboxSelected : {}) }}>
                          {isExportSelected && <span style={styles.checkboxTick}>✓</span>}
                        </div>
                      ) : (
                        <span style={styles.chevron}>{isExpanded ? '▾' : '▸'}</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && !exportMode && (
                    <div style={styles.cardBody}>
                      <div style={styles.fieldGroup}>
                        <p style={styles.fieldLabel}>Yesterday</p>
                        <p style={styles.fieldText}>{entry.yesterday || 'No activities recorded'}</p>
                      </div>
                      <div style={{ ...styles.fieldGroup, ...styles.fieldToday }}>
                        <p style={styles.fieldLabel}>Today's Plan</p>
                        <p style={styles.fieldText}>{entry.today}</p>
                      </div>
                      {hasBlockers && (
                        <div style={{ ...styles.fieldGroup, ...styles.fieldBlockers }}>
                          <p style={{ ...styles.fieldLabel, color: '#b45309' }}>⚠ Blockers</p>
                          <p style={styles.fieldText}>{entry.blockers}</p>
                        </div>
                      )}
                      {entry.notes.trim() && (
                        <div style={{ ...styles.fieldGroup, ...styles.fieldNotes }}>
                          <p style={{ ...styles.fieldLabel, color: '#047857' }}>📝 Notes</p>
                          <p style={styles.fieldText}>{entry.notes}</p>
                        </div>
                      )}
                      <div style={styles.cardActions}>
                        <button style={styles.actionBtn} onClick={() => handleEdit(entry)}>Edit</button>
                        <button style={{ ...styles.actionBtn, ...styles.actionBtnDelete }} onClick={() => handleDelete(entry.id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      </div>

      {showModal && (
        <EntryModal
          entry={editingEntry}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingEntry(null); }}
        />
      )}
    </div>
  );
};

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 56px)',
    backgroundColor: '#f3f4f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  // Backdrop for mobile drawer
  backdrop: {
    position: 'fixed',
    inset: 0,
    top: '56px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 199,
  },

  // Layout row (sidebar + main)
  layout: {
    display: 'flex',
    flex: 1,
  },

  // Sidebar
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

  // Main
  main: {
    flex: 1,
    padding: '24px',
    minWidth: 0,
  },

  // Export bar
  exportBar: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '10px 16px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  exportBarCount: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1d4ed8',
  },
  exportBarActions: {
    display: 'flex',
    gap: '8px',
  },
  exportBarBtn: {
    backgroundColor: '#2563eb',
    padding: '7px 14px',
    borderRadius: '6px',
    border: 'none',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '16px',
    alignItems: 'start',
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'box-shadow 0.15s, border-color 0.15s',
  },
  cardSelected: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 2px rgba(59,130,246,0.2)',
  },
  cardExpanded: {
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
  },
  dateBadge: {
    width: '40px',
    minWidth: '40px',
    height: '44px',
    backgroundColor: '#f0f4ff',
    border: '1px solid #e0e7ff',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1px',
  },
  dateBadgeDay: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#2563eb',
    lineHeight: 1,
  },
  dateBadgeMonth: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardHeaderContent: {
    flex: 1,
    minWidth: 0,
  },
  cardWeekday: {
    fontSize: '11px',
    color: '#9ca3af',
    margin: '0 0 2px',
    fontWeight: '500',
  },
  cardPreview: {
    fontSize: '13px',
    color: '#374151',
    margin: '0 0 6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    lineHeight: '1.4',
  },
  cardTags: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  tagBlocker: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#b45309',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '4px',
    padding: '1px 6px',
  },
  tagNotes: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#047857',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '4px',
    padding: '1px 6px',
  },
  cardControls: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: '2px',
  },
  chevron: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  checkboxBox: {
    width: '18px',
    height: '18px',
    border: '2px solid #d1d5db',
    borderRadius: '4px',
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
    fontSize: '11px',
    fontWeight: 'bold',
  },

  // Card expanded body
  cardBody: {
    borderTop: '1px solid #f3f4f6',
    padding: '14px 16px 16px',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f3f4f6',
  },
  actionBtn: {
    padding: '5px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '12px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
  },
  actionBtnDelete: {
    color: '#dc2626',
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
  },
  fieldGroup: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '10px 12px',
    marginBottom: '8px',
  },
  fieldToday: {
    backgroundColor: '#eff6ff',
  },
  fieldBlockers: {
    backgroundColor: '#fff7ed',
  },
  fieldNotes: {
    backgroundColor: '#f0fdf4',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 4px',
  },
  fieldText: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.5',
    margin: '0',
    whiteSpace: 'pre-wrap',
  },

  // Empty states
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '40px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px',
  },
  clearBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
};

export default LogMyStandup;
