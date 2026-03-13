import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const getTodayString = () => {
  const today = new Date();
  return today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
};

const EMPTY = {
  date: '',
  yesterday: '',
  today: '',
  blockers: '',
  notes: '',
};

export default function EntryModal({ entry, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, date: getTodayString() });

  useEffect(() => {
    if (entry) {
      setForm({ ...EMPTY, ...entry });
    } else {
      setForm({ ...EMPTY, date: getTodayString() });
    }
  }, [entry]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.today.trim()) {
      alert('Please enter what you plan to do today');
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{entry ? 'Edit Entry' : 'New Entry'}</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">What I Did Yesterday</label>
              <textarea
                className="form-input form-textarea"
                value={form.yesterday}
                onChange={e => set('yesterday', e.target.value)}
                placeholder="Describe what you accomplished yesterday..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">What I Plan To Do Today *</label>
              <textarea
                className="form-input form-textarea"
                value={form.today}
                onChange={e => set('today', e.target.value)}
                placeholder="What are your goals for today..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Blockers</label>
              <textarea
                className="form-input form-textarea"
                value={form.blockers}
                onChange={e => set('blockers', e.target.value)}
                placeholder="Any blockers or impediments..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Special Notes</label>
              <textarea
                className="form-input form-textarea"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any additional notes or observations..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="modal-btn modal-btn-primary">
              {entry ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
