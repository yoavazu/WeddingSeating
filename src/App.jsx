import { useState, useEffect } from 'react';
import { fetchTableData, addGuestToTable, removeGuestFromTable, addTable } from './services/googleSheetsService';
import TableCard from './components/TableCard';
import TableModal from './components/TableModal';
import AllGuestsModal from './components/AllGuestsModal';
import { Loader2, AlertCircle, PlusCircle, Search } from 'lucide-react';
import './App.css';

function App() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [totalWeddingGuests, setTotalWeddingGuests] = useState(0);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [isShowingAllGuests, setIsShowingAllGuests] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTableData();
      setTables(data);
      
      const total = data.reduce((sum, table) => sum + table.totalGuests, 0);
      setTotalWeddingGuests(total);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("שגיאה בטעינת נתונים. אנא ודא שיש לך גישה לאינטרנט ונסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddGuest = async (colIndex, guestName, guestCount) => {
    await addGuestToTable(colIndex, guestName, guestCount);
    // Reload data to reflect changes
    await loadData();
    // Update selected table reference so modal updates
    setSelectedTable(prev => {
      const updated = tables.find(t => t.id === prev.id);
      return updated || prev;
    });
  };

  const handleRemoveGuest = async (colIndex, guestName) => {
    await removeGuestFromTable(colIndex, guestName);
    await loadData();
    setSelectedTable(prev => {
      const updated = tables.find(t => t.id === prev.id);
      return updated || prev;
    });
  };

  // When data is refreshed, we need to update the selectedTable if it's open
  useEffect(() => {
    if (selectedTable && !loading) {
      const updated = tables.find(t => t.id === selectedTable.id);
      if (updated) {
        setSelectedTable(updated);
      }
    }
  }, [tables, loading]);

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim() || !newTableNumber.trim()) return;
    
    setIsSubmittingTable(true);
    try {
      await addTable(newTableName, newTableNumber);
      setNewTableName('');
      setNewTableNumber('');
      setIsAddingTable(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'אירעה שגיאה בהוספת השולחן');
    } finally {
      setIsSubmittingTable(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="title-font">סידורי הושבה</h1>
        <div className="header-actions">
          <div 
            className="wedding-stats glass-panel clickable-stats" 
            onClick={() => setIsShowingAllGuests(true)}
            title="הצג את כל המוזמנים"
          >
            <span>סה"כ מוזמנים:</span>
            <strong>{totalWeddingGuests}</strong>
            <Search size={16} className="stats-search-icon" />
          </div>
          <button className="add-table-btn outline" onClick={() => setIsAddingTable(true)}>
            <PlusCircle size={18} />
            הוסף שולחן
          </button>
        </div>
      </header>

      {isAddingTable && (
        <div className="modal-overlay" onClick={() => setIsAddingTable(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsAddingTable(false)}>
              ×
            </button>
            <div className="modal-header">
              <h2>הוספת שולחן חדש</h2>
            </div>
            <form className="add-table-form" onSubmit={handleAddTable}>
              <div className="form-group-col">
                <label>שם השולחן</label>
                <input 
                  type="text" 
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  placeholder="לדוגמה: משפחת כהן"
                  required
                />
              </div>
              <div className="form-group-col">
                <label>מספר השולחן</label>
                <input 
                  type="number" 
                  value={newTableNumber}
                  onChange={e => setNewTableNumber(e.target.value)}
                  placeholder="לדוגמה: 18"
                  required
                />
              </div>
              <button type="submit" disabled={isSubmittingTable} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                {isSubmittingTable ? <Loader2 size={18} className="spin" /> : <PlusCircle size={18} />}
                הוסף שולחן
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="main-content">
        {loading && tables.length === 0 ? (
          <div className="loading-state">
            <Loader2 size={48} className="spin text-primary" />
            <p>טוען נתונים...</p>
          </div>
        ) : error ? (
          <div className="error-state glass-panel">
            <AlertCircle size={48} className="text-danger" />
            <h2>אופס!</h2>
            <p>{error}</p>
            <button onClick={loadData}>נסה שוב</button>
          </div>
        ) : (
          <div className="tables-grid">
            {tables.map(table => (
              <TableCard 
                key={table.id} 
                table={table} 
                onClick={() => setSelectedTable(table)} 
              />
            ))}
          </div>
        )}
      </main>

      {selectedTable && (
        <TableModal 
          table={selectedTable} 
          onClose={() => setSelectedTable(null)} 
          onAddGuest={handleAddGuest}
          onRemoveGuest={handleRemoveGuest}
        />
      )}

      {isShowingAllGuests && (
        <AllGuestsModal 
          tables={tables}
          onClose={() => setIsShowingAllGuests(false)}
        />
      )}

      <footer className="app-footer">
        <div className="seatings-map">
          <h3>מפת הושבה</h3>
          <img src="/seatings.jpeg" alt="מפת סידורי הושבה" className="seatings-image" />
        </div>
      </footer>
    </div>
  );
}

export default App;
