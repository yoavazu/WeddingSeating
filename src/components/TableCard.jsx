import React from 'react';
import { Users } from 'lucide-react';
import './TableCard.css';

export default function TableCard({ table, onClick }) {
  return (
    <div className="table-card glass-panel animate-fade-in" onClick={onClick}>
      <div className="table-card-header">
        <h2 className="title-font">{table.number}</h2>
        <span className="table-badge">שולחן</span>
      </div>
      <div className="table-card-body">
        <h3>{table.name}</h3>
      </div>
      <div className="table-card-footer">
        <div className="guest-count">
          <Users size={18} />
          <span>{table.totalGuests} אורחים</span>
        </div>
      </div>
    </div>
  );
}
