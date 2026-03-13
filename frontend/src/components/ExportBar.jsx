const ExportBar = ({ selectedCount, onExport, onCancel }) => (
  <div style={styles.exportBar}>
    <div style={styles.exportBarActions}>
      <button
        style={{ ...styles.exportBarBtn, opacity: selectedCount === 0 ? 0.5 : 1 }}
        onClick={onExport}
        disabled={selectedCount === 0}
      >
        Export Selected PDF
      </button>
      <button
        style={{ ...styles.exportBarBtn, backgroundColor: '#6b7280' }}
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
    <span style={styles.exportBarCount}>{selectedCount} selected</span>
  </div>
);

const styles = {
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
};

export default ExportBar;
