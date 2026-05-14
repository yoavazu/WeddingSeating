import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import './AllGuestsModal.css';

export default function AllGuestsModal({ tables, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');

  const allGuests = useMemo(() => {
    const guestsList = [];
    tables.forEach(table => {
      table.guests.forEach(guest => {
        guestsList.push({
          ...guest,
          tableName: table.name,
          tableNumber: table.number
        });
      });
    });
    // Optional: Sort alphabetically by name
    return guestsList.sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, [tables]);

  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return allGuests;
    const query = searchQuery.toLowerCase().trim();
    return allGuests.filter(guest => 
      guest.name.toLowerCase().includes(query)
    );
  }, [allGuests, searchQuery]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content all-guests-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="modal-header">
          <h2>כל המוזמנים</h2>
          <p className="subtitle">{allGuests.length} קבוצות / בודדים</p>
        </div>

        <div className="search-container">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="חיפוש לפי שם..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="guests-list-container all-guests-scroll">
          {filteredGuests.length === 0 ? (
            <p className="empty-state">לא נמצאו אורחים תואמים לחיפוש</p>
          ) : (
            <ul className="guests-list">
              {filteredGuests.map((guest, idx) => (
                <li key={idx} className="guest-item">
                  <div className="guest-info main-info">
                    <span className="guest-name">{guest.name}</span>
                    {guest.count > 1 && (
                      <span className="guest-count-badge">{guest.count}</span>
                    )}
                  </div>
                  <div className="guest-table-info">
                    <span className="table-badge">שולחן {guest.tableNumber}</span>
                    <span className="table-name-small">{guest.tableName}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
