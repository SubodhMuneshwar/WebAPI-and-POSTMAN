import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, RefreshCw, Trash2, Edit3, Sliders, Sparkles, 
  Clock, Activity, CheckCircle2, XCircle, Copy, Check, 
  Layers, Send, X, ExternalLink
} from 'lucide-react';
import './App.css';

const PRESET_BOOKS = [
  { title: "Clean Architecture", author: "Robert C. Martin", year: 2017 },
  { title: "Domain-Driven Design", author: "Eric Evans", year: 2003 },
  { title: "Refactoring", author: "Martin Fowler", year: 1999 },
  { title: "Design Patterns (GoF)", author: "Erich Gamma et al.", year: 1994 },
  { title: "Building Microservices", author: "Sam Newman", year: 2015 },
  { title: "Site Reliability Engineering", author: "Betsy Beyer et al.", year: 2016 }
];

export default function App() {
  const [apiUrl, setApiUrl] = useState("http://localhost:5063");
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  
  // Last Request Inspector State
  const [inspector, setInspector] = useState({
    method: "GET",
    url: "http://localhost:5063/api/books",
    status: null,
    statusText: "",
    duration: 0,
    headers: {},
    responseBody: null,
    requestBody: null,
    timestamp: null
  });
  const [inspectorTab, setInspectorTab] = useState("response");
  const [copied, setCopied] = useState(false);

  // Modals & Forms
  const [activeModal, setActiveModal] = useState(null); // { type: 'create' | 'edit' | 'patch', book?: object }
  const [formData, setFormData] = useState({ title: '', author: '', year: 2024 });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Generic Request Runner with Telemetry & Latency measurement
  const executeHttp = async (method, endpoint, body = null) => {
    setLoading(true);
    const fullUrl = `${apiUrl}${endpoint}`;
    const startTime = performance.now();

    const options = {
      method,
      headers: {
        'Accept': 'application/json'
      }
    };

    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(fullUrl, options);
      const duration = Math.round(performance.now() - startTime);
      setServerOnline(true);

      // Extract Headers
      const headersMap = {};
      response.headers.forEach((val, key) => {
        headersMap[key] = val;
      });

      // Parse JSON body if present
      let data = null;
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      setInspector({
        method,
        url: fullUrl,
        status: response.status,
        statusText: response.statusText || (response.ok ? "OK" : "Error"),
        duration,
        headers: headersMap,
        responseBody: data,
        requestBody: body,
        timestamp: new Date().toLocaleTimeString()
      });

      return { ok: response.ok, status: response.status, data, headers: headersMap };
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setServerOnline(false);

      setInspector({
        method,
        url: fullUrl,
        status: 0,
        statusText: "Connection Failed",
        duration,
        headers: {},
        responseBody: { 
          error: "Unable to reach API server",
          details: err.message,
          hint: "Ensure 'dotnet run' is active on " + apiUrl + " with CORS enabled."
        },
        requestBody: body,
        timestamp: new Date().toLocaleTimeString()
      });

      showToast(`Connection failed to ${apiUrl}`, "error");
      return { ok: false, status: 0, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 1. GET /api/books
  const fetchAllBooks = async () => {
    const res = await executeHttp("GET", "/api/books");
    if (res.ok && Array.isArray(res.data)) {
      setBooks(res.data);
      showToast(`Fetched ${res.data.length} books (200 OK)`);
    }
  };

  // 2. GET /api/books/{id}
  const fetchBookById = async (id) => {
    const res = await executeHttp("GET", `/api/books/${id}`);
    if (res.ok) {
      showToast(`Loaded Book #${id} (200 OK)`);
    } else if (res.status === 404) {
      showToast(`Book #${id} not found (404)`, "error");
    }
  };

  // 3. POST /api/books (Quick Seed)
  const quickSeedBook = async () => {
    const randomBook = PRESET_BOOKS[Math.floor(Math.random() * PRESET_BOOKS.length)];
    const res = await executeHttp("POST", "/api/books", randomBook);
    if (res.ok) {
      showToast(`Created "${randomBook.title}" (201 Created)`);
      fetchAllBooks();
    }
  };

  // 3b. POST /api/books (Custom Modal)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) {
      showToast("Title and Author are required", "error");
      return;
    }
    const res = await executeHttp("POST", "/api/books", {
      title: formData.title,
      author: formData.author,
      year: parseInt(formData.year) || 2024
    });
    if (res.ok) {
      showToast(`Book added successfully (201 Created)`);
      setActiveModal(null);
      fetchAllBooks();
    }
  };

  // 4. PUT /api/books/{id}
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const id = activeModal.book.id;
    const res = await executeHttp("PUT", `/api/books/${id}`, {
      title: formData.title,
      author: formData.author,
      year: parseInt(formData.year) || 2024
    });
    if (res.ok) {
      showToast(`Book #${id} updated (204 No Content)`);
      setActiveModal(null);
      fetchAllBooks();
    }
  };

  // 5. PATCH /api/books/{id} (1-Click Bump Year +1)
  const quickBumpYear = async (book) => {
    const newYear = (book.year || 2000) + 1;
    const res = await executeHttp("PATCH", `/api/books/${book.id}`, { year: newYear });
    if (res.ok) {
      showToast(`Book #${book.id} year bumped to ${newYear} via PATCH`);
      // Update locally
      setBooks(books.map(b => b.id === book.id ? { ...b, year: newYear } : b));
    }
  };

  // 5b. PATCH /api/books/{id} (Custom Partial Update)
  const handlePatchSubmit = async (e) => {
    e.preventDefault();
    const id = activeModal.book.id;
    const patchPayload = {};
    if (formData.title.trim()) patchPayload.title = formData.title;
    if (formData.author.trim()) patchPayload.author = formData.author;
    if (formData.year) patchPayload.year = parseInt(formData.year);

    const res = await executeHttp("PATCH", `/api/books/${id}`, patchPayload);
    if (res.ok) {
      showToast(`Book #${id} patched successfully`);
      setActiveModal(null);
      fetchAllBooks();
    }
  };

  // 6. DELETE /api/books/{id}
  const deleteBook = async (id, title) => {
    const res = await executeHttp("DELETE", `/api/books/${id}`);
    if (res.ok) {
      showToast(`Deleted "${title}" (204 No Content)`);
      setBooks(books.filter(b => b.id !== id));
    }
  };

  // 7. HEAD /api/books
  const inspectHead = async (id = null) => {
    const endpoint = id ? `/api/books/${id}` : "/api/books";
    const res = await executeHttp("HEAD", endpoint);
    if (res.ok) {
      const totalCount = res.headers["x-total-count"] || "N/A";
      showToast(`HEAD Success! X-Total-Count: ${totalCount}`);
    } else {
      showToast(`HEAD returned ${res.status}`);
    }
  };

  // 8. OPTIONS /api/books
  const inspectOptions = async (id = null) => {
    const endpoint = id ? `/api/books/${id}` : "/api/books";
    const res = await executeHttp("OPTIONS", endpoint);
    if (res.ok) {
      const allowed = res.headers["allow"] || "GET, POST, HEAD, OPTIONS";
      showToast(`Allowed Methods: ${allowed}`);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllBooks();
  }, []);

  const copyJson = () => {
    if (inspector.responseBody) {
      navigator.clipboard.writeText(JSON.stringify(inspector.responseBody, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMethodBadgeClass = (m) => {
    switch (m?.toUpperCase()) {
      case 'GET': return 'badge-get';
      case 'POST': return 'badge-post';
      case 'PUT': return 'badge-put';
      case 'PATCH': return 'badge-patch';
      case 'DELETE': return 'badge-delete';
      case 'HEAD': return 'badge-head';
      case 'OPTIONS': return 'badge-options';
      default: return 'badge-get';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status >= 200 && status < 300) return 'badge-status-2xx';
    if (status >= 400 && status < 500) return 'badge-status-4xx';
    if (status >= 500) return 'badge-status-5xx';
    return '';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <BookOpen size={24} />
            </div>
            <div className="brand-text">
              <h1>BooksApi Explorer</h1>
              <p>Visual CRUD & HTTP Verbs Playground</p>
            </div>
          </div>

          <div className="header-controls">
            <div className="server-pill">
              <span className={`status-dot ${serverOnline ? 'online' : 'offline'}`} />
              <span>{apiUrl}</span>
            </div>
            <button 
              className="btn-icon" 
              onClick={fetchAllBooks} 
              title="Ping & Reload Catalog"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="main-layout">
        {/* Left: Action Bar & Book Catalog */}
        <section className="catalog-section">
          {/* 1-Click Operations Bar */}
          <div className="toolbar-card">
            <div className="toolbar-title">
              <h2><Sparkles size={16} color="#818cf8" /> One-Click Operations</h2>
              <span className="books-count">{books.length} Books in Catalog</span>
            </div>

            <div className="toolbar-buttons">
              <button className="btn-action btn-primary" onClick={() => {
                setFormData({ title: '', author: '', year: new Date().getFullYear() });
                setActiveModal({ type: 'create' });
              }}>
                <Plus size={16} /> Add Custom Book
              </button>

              <button className="btn-action btn-seed" onClick={quickSeedBook} title="POST /api/books with random book">
                <Send size={15} /> 1-Click Quick Seed Book (POST)
              </button>

              <button className="btn-action" onClick={fetchAllBooks} title="GET /api/books">
                <RefreshCw size={15} /> Refresh All (GET)
              </button>

              <button className="btn-action" onClick={() => inspectHead()} title="HEAD /api/books">
                <Activity size={15} /> Headers Check (HEAD)
              </button>

              <button className="btn-action" onClick={() => inspectOptions()} title="OPTIONS /api/books">
                <Layers size={15} /> Allowed Verbs (OPTIONS)
              </button>
            </div>
          </div>

          {/* Catalog Grid */}
          <div className="books-section-header">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Live Books Catalog</h2>
          </div>

          {books.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} color="#64748b" style={{ margin: '0 auto 1rem' }} />
              <h3>Catalog is Empty or Server is Unreachable</h3>
              <p>Click below to seed sample books or verify that 'dotnet run' is active on {apiUrl}.</p>
              <button className="btn-action btn-primary" onClick={quickSeedBook}>
                <Plus size={16} /> Seed Sample Book (POST)
              </button>
            </div>
          ) : (
            <div className="books-grid">
              {books.map(book => (
                <div key={book.id} className="book-card animate-fade">
                  <div>
                    <div className="book-card-top">
                      <span className="book-id-badge">#{book.id}</span>
                      <span className="book-year-badge">Year: {book.year}</span>
                    </div>

                    <div className="book-info">
                      <h3>{book.title}</h3>
                      <p>By {book.author}</p>
                    </div>
                  </div>

                  {/* 1-Click Actions for this book */}
                  <div className="book-card-actions">
                    <button 
                      className="btn-card-action"
                      onClick={() => fetchBookById(book.id)}
                      title="GET /api/books/{id}"
                    >
                      <ExternalLink size={13} /> GET
                    </button>

                    <button 
                      className="btn-card-action"
                      onClick={() => {
                        setFormData({ title: book.title, author: book.author, year: book.year });
                        setActiveModal({ type: 'edit', book });
                      }}
                      title="PUT /api/books/{id} (Full update)"
                    >
                      <Edit3 size={13} /> PUT
                    </button>

                    <button 
                      className="btn-card-action btn-card-patch"
                      onClick={() => quickBumpYear(book)}
                      title="PATCH /api/books/{id} (1-Click bumps year +1)"
                    >
                      <Sliders size={13} /> PATCH (+1 Yr)
                    </button>

                    <button 
                      className="btn-card-action btn-card-delete"
                      onClick={() => deleteBook(book.id, book.title)}
                      title="DELETE /api/books/{id}"
                    >
                      <Trash2 size={13} /> DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Live Request & Response Inspector (Mini Postman) */}
        <aside className="inspector-panel">
          <div className="inspector-header">
            <h2>
              <Activity size={18} color="#6366f1" /> Live HTTP Inspector
            </h2>
            {inspector.status && (
              <span className={`badge-method ${getStatusBadgeClass(inspector.status)}`}>
                {inspector.status} {inspector.statusText}
              </span>
            )}
          </div>

          <div className="inspector-summary">
            <div className="inspector-url-row">
              <span className={`badge-method ${getMethodBadgeClass(inspector.method)}`}>
                {inspector.method}
              </span>
              <span>{inspector.url}</span>
            </div>

            <div className="inspector-meta-row">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {inspector.duration} ms
              </span>
              <span>•</span>
              <span>{inspector.timestamp || 'Ready'}</span>
            </div>
          </div>

          {/* Inspector Tabs */}
          <div className="inspector-tabs">
            <button 
              className={`inspector-tab ${inspectorTab === 'response' ? 'active' : ''}`}
              onClick={() => setInspectorTab('response')}
            >
              Response Body
            </button>
            <button 
              className={`inspector-tab ${inspectorTab === 'headers' ? 'active' : ''}`}
              onClick={() => setInspectorTab('headers')}
            >
              Headers ({Object.keys(inspector.headers).length})
            </button>
            {inspector.requestBody && (
              <button 
                className={`inspector-tab ${inspectorTab === 'request' ? 'active' : ''}`}
                onClick={() => setInspectorTab('request')}
              >
                Payload
              </button>
            )}
          </div>

          {/* Inspector Content */}
          <div className="inspector-body">
            {inspectorTab === 'response' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                  <button 
                    onClick={copyJson}
                    className="btn-icon"
                    style={{ fontSize: '0.75rem', gap: '4px', padding: '0.2rem 0.5rem' }}
                    title="Copy response JSON"
                  >
                    {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="code-block">
                  {inspector.responseBody 
                    ? JSON.stringify(inspector.responseBody, null, 2) 
                    : "// No content or empty response"}
                </pre>
              </div>
            )}

            {inspectorTab === 'headers' && (
              <div className="headers-list">
                {Object.entries(inspector.headers).map(([key, val]) => (
                  <div key={key} className="header-row">
                    <span>{key}:</span>
                    <span>{val}</span>
                  </div>
                ))}
                {Object.keys(inspector.headers).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No headers recorded yet.</p>
                )}
              </div>
            )}

            {inspectorTab === 'request' && (
              <pre className="code-block">
                {JSON.stringify(inspector.requestBody, null, 2)}
              </pre>
            )}
          </div>
        </aside>
      </main>

      {/* Modal Dialog for Add / Edit */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {activeModal.type === 'create' && 'Add New Book (POST)'}
                {activeModal.type === 'edit' && `Update Book #${activeModal.book.id} (PUT)`}
                {activeModal.type === 'patch' && `Patch Book #${activeModal.book.id} (PATCH)`}
              </h3>
              <button className="btn-icon" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={
              activeModal.type === 'create' ? handleCreateSubmit : 
              activeModal.type === 'edit' ? handleUpdateSubmit : handlePatchSubmit
            }>
              <div className="form-group">
                <label>Book Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="e.g. Clean Code"
                  required={activeModal.type !== 'patch'}
                />
              </div>

              <div className="form-group">
                <label>Author</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.author} 
                  onChange={e => setFormData({ ...formData, author: e.target.value })} 
                  placeholder="e.g. Robert C. Martin"
                  required={activeModal.type !== 'patch'}
                />
              </div>

              <div className="form-group">
                <label>Published Year</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formData.year} 
                  onChange={e => setFormData({ ...formData, year: e.target.value })} 
                  placeholder="e.g. 2008"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-action" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-action btn-primary">
                  {activeModal.type === 'create' && 'Create Book (POST)'}
                  {activeModal.type === 'edit' && 'Save Changes (PUT)'}
                  {activeModal.type === 'patch' && 'Apply Patch (PATCH)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast notification */}
      {toast && (
        <div className="toast-container">
          <div className="toast-item">
            {toast.type === 'error' ? (
              <XCircle size={18} color="#f43f5e" />
            ) : (
              <CheckCircle2 size={18} color="#10b981" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
