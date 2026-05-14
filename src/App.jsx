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
  const [isShowingAllGuests, setIsShowingAllGuests] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTableData();
      
      const hasReserve1 = data.some(t => t.name === 'רזרבה 1' || t.number == 'רזרבה 1');
      const hasReserve2 = data.some(t => t.name === 'רזרבה 2' || t.number == 'רזרבה 2');
      
      if (!hasReserve1) {
        data.push({ id: 'reserve-1', number: 'רזרבה 1', name: 'רזרבה 1', colIndex: -1, guests: [], totalGuests: 0, maxCapacity: null });
      }
      if (!hasReserve2) {
        data.push({ id: 'reserve-2', number: 'רזרבה 2', name: 'רזרבה 2', colIndex: -2, guests: [], totalGuests: 0, maxCapacity: null });
      }
      
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
    if (colIndex < 0) {
      alert("כדי להוסיף אורחים לשולחן רזרבה, יש ליצור עבורו עמודה ב-Google Sheet קודם.");
      return;
    }

    const count = parseInt(guestCount, 10) || 1;
    const tempGuest = { name: guestName, count: count, tempId: `temp-${Date.now()}` };

    // Optimistic UI update
    setTables(prev => prev.map(t => {
      if (t.colIndex === colIndex) {
        return { ...t, guests: [...t.guests, tempGuest], totalGuests: t.totalGuests + count };
      }
      return t;
    }));
    setSelectedTable(prev => {
      if (!prev || prev.colIndex !== colIndex) return prev;
      return { ...prev, guests: [...prev.guests, tempGuest], totalGuests: prev.totalGuests + count };
    });
    setTotalWeddingGuests(prev => prev + count);

    try {
      await addGuestToTable(colIndex, guestName, guestCount);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('אירעה שגיאה. הנתונים מתרעננים...');
      await loadData();
    }
  };

  const handleRemoveGuest = async (colIndex, guestName) => {
    if (colIndex < 0) return;

    let removedCount = 0;
    
    // Optimistic UI update
    setTables(prev => prev.map(t => {
      if (t.colIndex === colIndex) {
        const guestToRemove = t.guests.find(g => g.name === guestName);
        if (guestToRemove) removedCount = guestToRemove.count;
        return { ...t, guests: t.guests.filter(g => g.name !== guestName), totalGuests: t.totalGuests - removedCount };
      }
      return t;
    }));
    setSelectedTable(prev => {
      if (!prev || prev.colIndex !== colIndex) return prev;
      return { ...prev, guests: prev.guests.filter(g => g.name !== guestName), totalGuests: prev.totalGuests - removedCount };
    });
    setTotalWeddingGuests(prev => prev - removedCount);

    try {
      await removeGuestFromTable(colIndex, guestName);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('אירעה שגיאה. הנתונים מתרעננים...');
      await loadData();
    }
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
        </div>
      </header>

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
