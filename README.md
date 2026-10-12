# BooksApi Explorer

BooksApi Explorer is a .NET 10 books API paired with a React frontend for exercising REST operations. Use the UI as a small visual HTTP-method playground, or send requests directly with Postman or another HTTP client.

The backend uses an ASP.NET Core controller and an in-memory collection. The React client is a separate Vite development server and calls the API directly from the browser; the API enables CORS for this integration.

## Architecture

```text
┌────────────────────── Browser ──────────────────────────────┐
│ React 19 + Vite (default :5173)                              │
│ Books catalog, forms, one-click operations                   │
│ Live HTTP inspector (request, response, headers, duration)   │
└───────────────────────┬─────────────────────────────────────┘
                        │ fetch to http://localhost:5063
                        │ cross-origin requests
                        ▼
┌──────────────────── .NET 10 API ─────────────────────────────┐
│ ASP.NET Core pipeline                                        │
│  CORS AllowAll → authorization middleware → controllers      │
│                              │                               │
│                              ▼                               │
│                  BooksController (/api/books)                 │
│                   CRUD + PATCH + HEAD + OPTIONS               │
│                              │                               │
│                              ▼                               │
│       static List<Book> and process-local next ID             │
└──────────────────────────────────────────────────────────────┘
```

The React client defaults to `http://localhost:5063`. The `http` launch profile uses that origin. The `https` profile also binds HTTPS on `https://localhost:7256`; the frontend's base URL is currently hard-coded to HTTP, so use the HTTP profile for the documented setup. The backend has no HTTPS redirection middleware.

## Features

- View the current catalog and refresh it with `GET /api/books`.
- Open a book by ID and inspect its response.
- Create a custom book or seed a random preset book with `POST`.
- Edit an entire book with `PUT`.
- Bump a book's year with the UI's one-click `PATCH` action. Other clients can send any subset of supported fields.
- Delete a book with `DELETE`.
- Inspect collection headers with `HEAD` and supported method headers with `OPTIONS`.
- Inspect the last HTTP request in the built-in panel: method, URL, status, latency, time, response body, response headers, and request payload when present. Copy the response JSON.
- See a server status indicator and toast/error feedback.

## Project structure

```text
WebApi_Postman/
├── README.md
├── .gitignore
├── BooksApi/
│   ├── BooksApi.csproj
│   ├── Program.cs
│   ├── BooksApi.http
│   ├── appsettings.json
│   ├── appsettings.Development.json
│   ├── Properties/launchSettings.json
│   ├── Controllers/BooksController.cs
│   └── Models/
│       ├── Book.cs
│       └── BookPatchDto.cs
└── client/
    ├── package.json
    ├── package-lock.json
    ├── index.html
    ├── vite.config.js
    ├── .oxlintrc.json
    ├── README.md
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        └── index.css
```

| File | Responsibility |
| --- | --- |
| `BooksApi/BooksApi.csproj` | ASP.NET Core Web SDK project targeting `net10.0`; uses `Microsoft.AspNetCore.OpenApi` 10.0.12. |
| `BooksApi/Program.cs` | Configures the permissive `AllowAll` CORS policy and exposes `X-Total-Count` and `Allow`; registers controllers/OpenAPI; maps `/openapi/v1.json` in Development; adds CORS, authorization middleware, and controller routes. |
| `BooksApi/Controllers/BooksController.cs` | Implements collection and item operations for `/api/books`. |
| `BooksApi/Models/Book.cs` | `Id`, required `Title`, required `Author`, and `Year`. |
| `BooksApi/Models/BookPatchDto.cs` | Nullable `Title`, `Author`, and `Year` fields for partial updates. |
| `BooksApi/Properties/launchSettings.json` | `http` profile: `http://localhost:5063`; `https` profile: `https://localhost:7256;http://localhost:5063`; both run in Development without launching a browser. |
| `BooksApi/appsettings*.json` | Logging and allowed-host configuration. |
| `BooksApi/BooksApi.http` | Visual Studio/VS Code HTTP scratch file. It still contains the template `weatherforecast` request; it is not yet a BooksApi request collection. |
| `client/package.json` / `package-lock.json` | React, React DOM, Lucide icons, Vite, React plugin, Oxlint scripts and locked dependencies. |
| `client/index.html` | Page metadata, title, Google Fonts links, and React mount point. |
| `client/vite.config.js` | Enables the React Vite plugin. It does not proxy API requests; the client uses its configured API base URL directly. |
| `client/src/main.jsx` | Mounts the application with React Strict Mode and global styles. |
| `client/src/App.jsx` | Catalog, request execution/telemetry, CRUD forms, quick operations, response inspector, toasts, and connection status. |
| `client/src/App.css`, `client/src/index.css` | Layout, responsive design, component styles, and global styling. |
| `client/.oxlintrc.json` | Oxlint React/OXC rules. |
| `client/README.md` | Vite starter-template notes; this root README has the BooksApi-specific client instructions. |
| `.gitignore` | Standard .NET/Visual Studio generated-file exclusions. |

Build output and installed dependencies (`BooksApi/bin`, `BooksApi/obj`, `client/dist`, `client/node_modules`) are generated and should not be committed.

## API reference

The controller has route prefix `/api/books`. JSON properties use ASP.NET Core's standard web naming, such as `title` and `year`. Initial process state contains:

```json
[
  { "id": 1, "title": "Clean Code", "author": "Robert C. Martin", "year": 2008 },
  { "id": 2, "title": "The Pragmatic Programmer", "author": "Andrew Hunt", "year": 1999 }
]
```

| Method | Path | Success response | Other behavior |
| --- | --- | --- | --- |
| `GET` | `/api/books` | `200 OK`, array of books | — |
| `GET` | `/api/books/{id}` | `200 OK`, one book | `404 Not Found` if no matching ID. |
| `POST` | `/api/books` | `201 Created`, created book and `Location` header | Server assigns `_nextId`, starting at 3. |
| `PUT` | `/api/books/{id}` | `204 No Content` | Replaces title, author, and year; `404` if absent. |
| `PATCH` | `/api/books/{id}` | `200 OK`, updated book | Updates non-null fields only; `404` if absent. |
| `DELETE` | `/api/books/{id}` | `204 No Content` | `404` if absent. |
| `HEAD` | `/api/books` | `200 OK`, no body | Adds `X-Total-Count` with current collection size. |
| `HEAD` | `/api/books/{id}` | `200 OK`, no body | `404` if absent. |
| `OPTIONS` | `/api/books` | `200 OK` | Adds `Allow: GET, POST, HEAD, OPTIONS`. |
| `OPTIONS` | `/api/books/{id}` | `200 OK` | Adds `Allow: GET, PUT, PATCH, DELETE, HEAD, OPTIONS`. |

`[ApiController]` handles request binding and model validation. `Title` and `Author` have `[Required]`; `Year` has no range validation. A PATCH value of `null` leaves the existing field unchanged; fields cannot be cleared to null.

Example POST or PUT body:

```json
{
  "title": "The Left Hand of Darkness",
  "author": "Ursula K. Le Guin",
  "year": 1969
}
```

Example partial update:

```json
{
  "year": 1970
}
```

## React client behavior

The app starts by requesting `GET /api/books`. The catalog is displayed as cards with per-book GET, PUT, PATCH year-bump, and DELETE actions. Toolbar actions open the create form, seed one of six preset books, refresh the list, or issue collection-level HEAD/OPTIONS requests.

Create and full-update dialogs require title and author in the browser and send title, author, and year. The one-click PATCH action increments the selected book's year. The source also contains a handler for submitting selected fields via a patch dialog, but no current UI action opens that dialog. HEAD/OPTIONS results are shown in the inspector when returned by the browser/API; the API exposes `X-Total-Count` and `Allow` through CORS. The inspector retains the latest operation's method, URL, status, elapsed time, response headers/body, and request body when supplied.

The frontend's API origin is currently a state default of `http://localhost:5063` in `client/src/App.jsx`; there is no visible API URL editor or environment-based configuration.

## Run locally

Install the .NET 10 SDK and Node.js/npm. From `WebApi_Postman`, use two terminals.

Terminal 1 — run the API using the HTTP profile:

```powershell
dotnet run --project .\BooksApi\BooksApi.csproj --launch-profile http
```

The API listens at `http://localhost:5063`. In Development, its OpenAPI document is available at `http://localhost:5063/openapi/v1.json`.

Terminal 2 — run the React client:

```powershell
cd .\client
npm.cmd install
npm.cmd run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). PowerShell users can use `npm.cmd` if script execution blocks `npm.ps1`; this avoids changing the execution policy.

Other client scripts:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

`preview` serves a previously built frontend; it does not start the API. Postman can be used independently against `http://localhost:5063/api/books`.

## CORS, state, and limitations

- `AllowAll` accepts any origin, method, and header, and exposes `X-Total-Count` and `Allow` to browser JavaScript. This is convenient for local learning but should be restricted before deployment.
- The HTTPS launch profile binds HTTPS and HTTP endpoints. The API currently does not call `UseHttpsRedirection`; the React client defaults to the HTTP URL.
- Books and the next-ID counter are static in-memory state. Data resets on API restart and is not shared across separate processes.
- The static list is not protected for concurrent writes. This project is a learning/demo API, not a production persistence layer.
- OpenAPI is mapped only in Development, with no interactive Swagger UI configured.
- No authentication, database, pagination, automated test project, or exported Postman collection is present.
- `BooksApi.http` still points at `/weatherforecast/`; use the documented routes or Postman instead.
