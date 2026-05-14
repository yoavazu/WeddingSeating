import React, { useState } from 'react';
import { X, UserPlus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import './TableModal.css';

export default function TableModal({ table, onClose, onAddGuest, onRemoveGuest }) {
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestCount, setNewGuestCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newGuestName.trim()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onAddGuest(table.colIndex, newGuestName, newGuestCount);
      setNewGuestName('');
      setNewGuestCount(1);
    } catch (err) {
      setError(err.message || 'אירעה שגיאה בהוספת האורח');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (guest) => {
    if (!window.confirm(`האם אתה בטוח שברצונך להסיר את ${guest.name}?`)) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onRemoveGuest(table.colIndex, guest.name);
    } catch (err) {
      setError(err.message || 'אירעה שגיאה בהסרת האורח');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="modal-header">
          <h2>שולחן {table.number}</h2>
          <p className="subtitle">{table.name}</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="guests-list-container">
          <div className="guests-list-header">
            <h3>רשימת אורחים ({table.totalGuests}{table.maxCapacity ? ` / ${table.maxCapacity}` : ''} סה"כ)</h3>
          </div>
          
          {table.guests.length === 0 ? (
            <p className="empty-state">אין אורחים בשולחן זה</p>
          ) : (
            <ul className="guests-list">
              {table.guests.map((guest, idx) => (
                <li key={idx} className="guest-item">
                  <div className="guest-info">
                    <span className="guest-name">{guest.name}</span>
                    <span className="guest-count-badge">{guest.count}</span>
                  </div>
                  <button 
                    className="icon-btn danger" 
                    onClick={() => handleRemove(guest)}
                    disabled={isSubmitting}
                    title="הסר אורח"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="add-guest-form" onSubmit={handleAdd}>
          <h4>הוספת אורח</h4>
          <div className="form-group">
            <input 
              type="text" 
              placeholder="שם האורח" 
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <input 
              type="number" 
              min="1" 
              max="20"
              value={newGuestCount}
              onChange={(e) => setNewGuestCount(parseInt(e.target.value) || 1)}
              disabled={isSubmitting}
              required
            />
            <button type="submit" disabled={isSubmitting || !newGuestName.trim()}>
              {isSubmitting ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
              <span>הוסף</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
