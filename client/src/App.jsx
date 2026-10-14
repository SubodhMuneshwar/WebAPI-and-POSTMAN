import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Trash2, Edit2, Sliders, RefreshCw, 
  X, Check, AlertCircle, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import './App.css';

const DEFAULT_BOOKS = [
  { title: "Clean Code", author: "Robert C. Martin", year: 2008 },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", year: 1999 },
  { title: "Design Patterns", author: "Erich Gamma et al.", year: 1994 },
  { title: "Refactoring", author: "Martin Fowler", year: 1999 }
];

export default function App() {
  const API_URL = "http://localhost:5063";
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  
  // Minimal bottom telemetry
  const [lastAction, setLastAction] = useState({
    method: "GET",
    endpoint: "/api/books",
    status: 200,
    duration: 0,
    data: null
  });
  const [showJson, setShowJson] = useState(false);

  // Modal & Toast
  const [modal, setModal] = useState(null); // { type: 'create' | 'edit', book?: object }
  const [formData, setFormData] = useState({ title: '', author: '', year: 2024 });
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // HTTP Helper
  const callApi = async (method, endpoint, body = null) => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers: {
          'Accept': 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        body: body ? JSON.stringify(body) : null
      });

      const duration = Math.round(performance.now() - start);
      setServerOnline(true);

      let data = null;
      const text = await res.text();
      if (text) {
        try { data = JSON.parse(text); } catch { data = text; }
      }

      setLastAction({
        method,
        endpoint,
        status: res.status,
        duration,
        data
      });

      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      setServerOnline(false);
      setLastAction({
        method,
        endpoint,
        status: 0,
        duration: Math.round(performance.now() - start),
        data: { error: err.message, hint: "Make sure 'dotnet run' is active on " + API_URL }
      });
      notify("API Connection Failed");
      return { ok: false, status: 0 };
    } finally {
      setLoading(false);
    }
  };

  // 1. GET /api/books (Fetch All)
  const fetchAll = async () => {
    setSearchQuery("");
    const res = await callApi("GET", "/api/books");
    if (res.ok && Array.isArray(res.data)) {
      setBooks(res.data);
    }
  };

  // 2. GET /api/books/search?query=... (Live Search)
  const searchBooks = async (query) => {
    setSearchQuery(query);
    const trimmed = query.trim();
    if (!trimmed) {
      fetchAll();
      return;
    }
    const res = await callApi("GET", `/api/books/search?query=${encodeURIComponent(trimmed)}`);
    if (res.ok && Array.isArray(res.data)) {
      setBooks(res.data);
    }
  };

  // 3. POST /api/books (Create)
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author) return;
    const res = await callApi("POST", "/api/books", {
      title: formData.title,
      author: formData.author,
      year: parseInt(formData.year) || 2024
    });
    if (res.ok) {
      notify("Book created (201 Created)");
      setModal(null);
      fetchAll();
    }
  };

  // 4. PUT /api/books/{id} (Update)
  const handleUpdate = async (e) => {
    e.preventDefault();
    const id = modal.book.id;
    const res = await callApi("PUT", `/api/books/${id}`, {
      title: formData.title,
      author: formData.author,
      year: parseInt(formData.year) || 2024
    });
    if (res.ok) {
      notify(`Book #${id} updated (204 No Content)`);
      setModal(null);
      fetchAll();
    }
  };

  // 5. PATCH /api/books/{id} (1-Click Bump Year +1)
  const bumpYear = async (book) => {
    const nextYear = (book.year || 2000) + 1;
    const res = await callApi("PATCH", `/api/books/${book.id}`, { year: nextYear });
    if (res.ok) {
      notify(`Year updated to ${nextYear} via PATCH`);
      setBooks(books.map(b => b.id === book.id ? { ...b, year: nextYear } : b));
    }
  };

  // 6. DELETE /api/books/{id} (Delete)
  const deleteBook = async (id, title) => {
    const res = await callApi("DELETE", `/api/books/${id}`);
    if (res.ok) {
      notify(`Deleted "${title}" (204 No Content)`);
      setBooks(books.filter(b => b.id !== id));
    }
  };

  // 7. Seed Demo Books
  const seedDemoBooks = async () => {
    for (const b of DEFAULT_BOOKS) {
      await callApi("POST", "/api/books", b);
    }
    notify("Sample books added!");
    fetchAll();
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="app-wrapper">
      {/* Minimal Header */}
      <header className="header-bar">
        <div className="brand-title">
          <BookOpen size={22} color="#6366f1" />
          <h1>Books Library</h1>
        </div>

        <div className="status-badge" title="Backend API status">
          <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`} />
          <span>{serverOnline ? 'localhost:5063' : 'Offline'}</span>
        </div>
      </header>

      {/* Unified Search & Action Bar */}
      <section className="controls-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-input"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => searchBooks(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => searchBooks("")}>
              <X size={15} />
            </button>
          )}
        </div>

        <button 
          className="btn-primary"
          onClick={() => {
            setFormData({ title: '', author: '', year: 2024 });
            setModal({ type: 'create' });
          }}
        >
          <Plus size={16} /> Add Book
        </button>

        <button className="btn-secondary" onClick={fetchAll} title="Reload list">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </section>

      {/* Book Count Summary */}
      <div className="list-summary">
        <span>
          {searchQuery ? `Search results for "${searchQuery}" (${books.length})` : `All Books (${books.length})`}
        </span>
        {books.length === 0 && (
          <button 
            onClick={seedDemoBooks}
            style={{ color: '#6366f1', background: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            + Seed Sample Books
          </button>
        )}
      </div>

      {/* Books List (Clean and uncluttered) */}
      <main className="book-list">
        {books.length === 0 ? (
          <div className="empty-box">
            <BookOpen size={40} color="#475569" />
            <h3>No books found</h3>
            <p>
              {searchQuery 
                ? `No books match "${searchQuery}". Clear your search to see all books.` 
                : "Your collection is empty. Click below to add sample books."}
            </p>
            {searchQuery ? (
              <button className="btn-secondary" onClick={() => searchBooks("")}>
                Clear Search
              </button>
            ) : (
              <button className="btn-primary" onClick={seedDemoBooks}>
                <Sparkles size={15} /> Add Sample Books
              </button>
            )}
          </div>
        ) : (
          books.map(book => (
            <div key={book.id} className="book-item">
              <div className="book-main-info">
                <div className="book-title-row">
                  <span className="book-title-text">{book.title}</span>
                  <span className="book-year-pill">{book.year}</span>
                </div>
                <span className="book-author-text">by {book.author}</span>
              </div>

              {/* 1-Click Operations */}
              <div className="book-actions-group">
                <button 
                  className="action-btn action-btn-patch"
                  onClick={() => bumpYear(book)}
                  title="PATCH: Increment year by 1 in 1 click"
                >
                  <Sliders size={13} /> +1 Yr
                </button>

                <button 
                  className="action-btn"
                  onClick={() => {
                    setFormData({ title: book.title, author: book.author, year: book.year });
                    setModal({ type: 'edit', book });
                  }}
                  title="PUT: Edit book"
                >
                  <Edit2 size={13} /> Edit
                </button>

                <button 
                  className="action-btn action-btn-delete"
                  onClick={() => deleteBook(book.id, book.title)}
                  title="DELETE: Remove book"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Minimal Bottom Telemetry Bar */}
      <footer className="bottom-telemetry-bar">
        <div className="telemetry-summary">
          <div className="telemetry-endpoint">
            <span className={`badge-method badge-${lastAction.method.toLowerCase()}`}>
              {lastAction.method}
            </span>
            <span>{lastAction.endpoint}</span>
          </div>

          <div className="telemetry-stats">
            <span style={{ color: lastAction.status >= 200 && lastAction.status < 300 ? '#34d399' : '#fb7185' }}>
              {lastAction.status || 'Err'}
            </span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: 'var(--text-dim)' }}>{lastAction.duration} ms</span>
            
            {lastAction.data && (
              <button 
                className="btn-toggle-json"
                onClick={() => setShowJson(!showJson)}
              >
                {showJson ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <span>{showJson ? 'Hide JSON' : 'View JSON'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible JSON Preview */}
        {showJson && lastAction.data && (
          <pre className="telemetry-json-drawer">
            {JSON.stringify(lastAction.data, null, 2)}
          </pre>
        )}
      </footer>

      {/* Simple Clean Modal for Add / Edit */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3>{modal.type === 'create' ? 'Add New Book' : `Edit Book #${modal.book.id}`}</h3>
              <button className="clear-search-btn" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={modal.type === 'create' ? handleCreate : handleUpdate}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Clean Code"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Author</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Robert C. Martin"
                  value={formData.author}
                  onChange={e => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Year</label>
                <input 
                  type="number" 
                  className="form-control"
                  placeholder="e.g. 2008"
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modal.type === 'create' ? 'Save Book' : 'Update Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Toast Notification */}
      {toast && (
        <div className="toast-box">
          <Check size={15} color="#10b981" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
