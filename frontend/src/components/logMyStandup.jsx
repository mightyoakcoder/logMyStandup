import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import EntryModal from './EntryModal';
import Sidebar from './Sidebar';
import EntryCard from './EntryCard';
import ExportBar from './ExportBar';

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
        <Sidebar
          sidebarOpen={sidebarOpen}
          onNewEntry={() => { openNew(); closeSidebar(); }}
          onExportAll={() => { exportAll(); closeSidebar(); }}
          onExportSelect={() => { setExportMode(true); setExportSelectedIds(new Set()); closeSidebar(); }}
          exportMode={exportMode}
          entriesCount={entries.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          blockerFilter={blockerFilter}
          onBlockerFilterChange={setBlockerFilter}
          filteredCount={filteredEntries.length}
        />

        <main style={styles.main}>
          {exportMode && (
            <ExportBar
              selectedCount={exportSelectedIds.size}
              onExport={exportSelected}
              onCancel={() => { setExportMode(false); setExportSelectedIds(new Set()); }}
            />
          )}

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
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isCollapsed={collapsedEntries.has(entry.id)}
                  onToggleCollapse={toggleEntryExpansion}
                  exportMode={exportMode}
                  isSelected={exportSelectedIds.has(entry.id)}
                  onToggleSelect={toggleExportSelection}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
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
  backdrop: {
    position: 'fixed',
    inset: 0,
    top: '56px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 199,
  },
  layout: {
    display: 'flex',
    flex: 1,
  },
  main: {
    flex: 1,
    padding: '24px',
    minWidth: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '16px',
    alignItems: 'start',
  },
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
