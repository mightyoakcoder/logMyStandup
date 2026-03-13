const formatDateShort = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    day,
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    year,
  };
};

const EntryCard = ({
  entry,
  isCollapsed,
  onToggleCollapse,
  exportMode,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}) => {
  const isExpanded = !isCollapsed;
  const hasBlockers = entry.blockers.trim() !== '';
  const dateParts = formatDateShort(entry.date);

  return (
    <div
      style={{
        ...styles.card,
        ...(isSelected ? styles.cardSelected : {}),
        ...(isExpanded ? styles.cardExpanded : {}),
      }}
    >
      {/* Card header */}
      <div
        style={styles.cardHeader}
        onClick={() => exportMode ? onToggleSelect(entry.id) : onToggleCollapse(entry.id)}
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
            <div style={{ ...styles.checkboxBox, ...(isSelected ? styles.checkboxSelected : {}) }}>
              {isSelected && <span style={styles.checkboxTick}>✓</span>}
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
            <button style={styles.actionBtn} onClick={() => onEdit(entry)}>Edit</button>
            <button style={{ ...styles.actionBtn, ...styles.actionBtnDelete }} onClick={() => onDelete(entry.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
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
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
};

export default EntryCard;
