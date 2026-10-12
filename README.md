# 📚 BooksApi - ASP.NET Core Web API with Postman

A beginner-friendly, clean, and complete RESTful Web API built using **ASP.NET Core (.NET 10)** and tested with **Postman**. This guide provides an end-to-end breakdown of how this project was designed, created, debugged, and tested, including common errors and roadblocks encountered along the way.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Folder & File Structure](#-folder--file-structure)
4. [Step-by-Step Guide: How the Project Was Built](#-step-by-step-guide-how-the-project-was-built)
   - [Step 1: Project Initialization](#step-1-project-initialization)
   - [Step 2: Creating the Data Model (`Book.cs`)](#step-2-creating-the-data-model-bookcs)
   - [Step 3: Creating the Controller (`BooksController.cs`)](#step-3-creating-the-controller-bookscontrollercs)
   - [Step 4: Configuring the Application Pipeline (`Program.cs`)](#step-4-configuring-the-application-pipeline-programcs)
   - [Step 5: Port & Environment Configuration (`launchSettings.json`)](#step-5-port--environment-configuration-launchsettingsjson)
5. [API Endpoints Reference](#-api-endpoints-reference)
6. [Testing the API with Postman](#-testing-the-api-with-postman)
   - [Prerequisites: Running the Server](#prerequisites-running-the-server)
   - [Testing GET All Books](#1-get-all-books)
   - [Testing GET Book by ID](#2-get-book-by-id)
   - [Testing POST (Create Book)](#3-post-create-a-new-book)
   - [Testing PUT (Update Book)](#4-put-update-an-existing-book)
   - [Testing DELETE (Remove Book)](#5-delete-remove-a-book)
7. [Technical Errors & Blockers Faced (And How They Were Fixed)](#-technical-errors--blockers-faced-and-how-they-were-fixed)
   - [Blocker 1: `404 Not Found` when requesting `/api/books`](#blocker-1-404-not-found-when-requesting-apibooks)
   - [Blocker 2: Process File Lock Warning (`MSB3026`)](#blocker-2-process-file-lock-warning-msb3026)
   - [Blocker 3: HTTPS Redirection (307 Redirects & SSL Errors) in Postman](#blocker-3-https-redirection-307-redirects--ssl-errors-in-postman)
   - [Blocker 4: Default Template Boilerplate Mismatch](#blocker-4-default-template-boilerplate-mismatch)
8. [Best Practices & Future Enhancements](#-best-practices--future-enhancements)

---

## 🌟 Project Overview

The **BooksApi** project provides a set of RESTful HTTP endpoints to perform CRUD (**C**reate, **R**ead, **U**pdate, **D**elete) operations on a collection of books.

* **Base URL (HTTP):** `http://localhost:5063`
* **Base URL (HTTPS):** `https://localhost:7256`
* **API Route:** `/api/books`

---

## 💻 Tech Stack

* **Platform:** [.NET 10](https://dotnet.microsoft.com/) (C# 13)
* **Framework:** ASP.NET Core Web API (Controllers pattern)
* **OpenAPI Support:** `Microsoft.AspNetCore.OpenApi` (v10.0.12)
* **Testing Tools:** [Postman](https://www.postman.com/) & Visual Studio `.http` files

---

## 📂 Folder & File Structure

```text
WebApi_Postman/
├── README.md                           <-- Comprehensive documentation (this file)
└── BooksApi/
    ├── Controllers/
    │   └── BooksController.cs          <-- Handles incoming HTTP requests and responses
    ├── Models/
    │   └── Book.cs                     <-- Defines the schema and properties of a Book
    ├── Properties/
    │   └── launchSettings.json         <-- Local web server ports and environment settings
    ├── appsettings.json                <-- Application configuration and logging rules
    ├── appsettings.Development.json    <-- Development-specific logging overrides
    ├── BooksApi.csproj                 <-- .NET project file declaring dependencies
    ├── BooksApi.http                   <-- Quick HTTP test scratchpad for VS / VS Code
    └── Program.cs                      <-- Application entry point, DI, and middleware
```

### Explaining Key Files in Simple Words:
* **`Program.cs`**: The brain of the application. It sets up what services the app needs (Controllers, OpenAPI) and how HTTP requests pass through the server.
* **`Models/Book.cs`**: The blueprint of what a "Book" looks like (e.g., ID, Title, Author, Price).
* **`Controllers/BooksController.cs`**: The traffic controller. When Postman sends a request to `/api/books`, this file decides what code runs and returns the response back to Postman.
* **`launchSettings.json`**: Specifies which local port number the server listens on (e.g., `5063` for HTTP, `7256` for HTTPS).

---

## 🛠️ Step-by-Step Guide: How the Project Was Built

### Step 1: Project Initialization
The project was created using the .NET CLI command:
```bash
dotnet new webapi -n BooksApi --use-controllers
```
This scaffolds an ASP.NET Core Web API template with standard controller support and configuration files.

---

### Step 2: Creating the Data Model (`Book.cs`)
Location: `BooksApi/Models/Book.cs`

Every API needs data structures. We created the `Book` class representing a single book item:

```csharp
namespace BooksApi.Models;

public class Book
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Genre { get; set; } = string.Empty;
    public int PublishedYear { get; set; }
}
```

* **Why default to `string.Empty`?** In modern C# with Nullable Reference Types enabled (`<Nullable>enable</Nullable>`), non-nullable strings must have a default value to prevent null-reference warnings.

---

### Step 3: Creating the Controller (`BooksController.cs`)
Location: `BooksApi/Controllers/BooksController.cs`

The controller manages HTTP endpoints and uses an in-memory list seeded with 4 sample books:

```csharp
using Microsoft.AspNetCore.Mvc;
using BooksApi.Models;

namespace BooksApi.Controllers;

[ApiController]
[Route("api/[controller]")] // Resolves to /api/books because the class name is BooksController
public class BooksController : ControllerBase
{
    // In-memory list (acts like a lightweight database for testing)
    private static readonly List<Book> _books = new()
    {
        new Book { Id = 1, Title = "The Great Gatsby", Author = "F. Scott Fitzgerald", Price = 10.99m, Genre = "Classic", PublishedYear = 1925 },
        new Book { Id = 2, Title = "To Kill a Mockingbird", Author = "Harper Lee", Price = 12.50m, Genre = "Classic", PublishedYear = 1960 },
        new Book { Id = 3, Title = "1984", Author = "George Orwell", Price = 9.99m, Genre = "Dystopian", PublishedYear = 1949 },
        new Book { Id = 4, Title = "The Hobbit", Author = "J.R.R. Tolkien", Price = 14.99m, Genre = "Fantasy", PublishedYear = 1937 }
    };

    // 1. GET: api/books
    [HttpGet]
    public ActionResult<IEnumerable<Book>> GetAll()
    {
        return Ok(_books);
    }

    // 2. GET: api/books/{id}
    [HttpGet("{id:int}")]
    public ActionResult<Book> GetById(int id)
    {
        var book = _books.FirstOrDefault(b => b.Id == id);
        if (book == null)
            return NotFound(new { message = $"Book with ID {id} not found." });
        return Ok(book);
    }

    // 3. POST: api/books
    [HttpPost]
    public ActionResult<Book> Create([FromBody] Book newBook)
    {
        if (newBook == null)
            return BadRequest("Book data is required.");

        int nextId = _books.Count > 0 ? _books.Max(b => b.Id) + 1 : 1;
        newBook.Id = nextId;

        _books.Add(newBook);
        return CreatedAtAction(nameof(GetById), new { id = newBook.Id }, newBook);
    }

    // 4. PUT: api/books/{id}
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Book updatedBook)
    {
        var existingBook = _books.FirstOrDefault(b => b.Id == id);
        if (existingBook == null)
            return NotFound(new { message = $"Book with ID {id} not found." });

        existingBook.Title = updatedBook.Title;
        existingBook.Author = updatedBook.Author;
        existingBook.Price = updatedBook.Price;
        existingBook.Genre = updatedBook.Genre;
        existingBook.PublishedYear = updatedBook.PublishedYear;

        return Ok(existingBook);
    }

    // 5. DELETE: api/books/{id}
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var book = _books.FirstOrDefault(b => b.Id == id);
        if (book == null)
            return NotFound(new { message = $"Book with ID {id} not found." });

        _books.Remove(book);
        return Ok(new { message = $"Book with ID {id} successfully deleted." });
    }
}
```

---

### Step 4: Configuring the Application Pipeline (`Program.cs`)
Location: `BooksApi/Program.cs`

In ASP.NET Core, services and middleware pipeline are configured in `Program.cs`:

1. `builder.Services.AddControllers();` – Registers controller support so ASP.NET knows where to find action methods.
2. `builder.Services.AddOpenApi();` – Enables built-in OpenAPI specification generation.
3. `app.MapControllers();` – Maps incoming HTTP requests to their matching controller methods based on route attributes.

---

### Step 5: Port & Environment Configuration (`launchSettings.json`)
Location: `BooksApi/Properties/launchSettings.json`

Configured with two profiles:
* **HTTP:** `http://localhost:5063`
* **HTTPS:** `https://localhost:7256` (fallback to `http://localhost:5063`)

---

## 📡 API Endpoints Reference

| HTTP Method | Route | Description | Success Code | Error Code |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/books` | Returns a list of all books | `200 OK` | - |
| **GET** | `/api/books/{id}` | Returns a single book by ID | `200 OK` | `404 Not Found` |
| **POST** | `/api/books` | Adds a new book to the list | `201 Created` | `400 Bad Request` |
| **PUT** | `/api/books/{id}` | Updates an existing book | `200 OK` | `404 Not Found` |
| **DELETE** | `/api/books/{id}` | Deletes a book by ID | `200 OK` | `404 Not Found` |

---

## 🚀 Testing the API with Postman

### Prerequisites: Running the Server
Before sending requests in Postman, ensure the API is running in your terminal:
```bash
cd BooksApi
dotnet run
```
You should see:
```text
Now listening on: http://localhost:5063
Now listening on: https://localhost:7256
```

---

### 1. GET All Books
* **Method:** `GET`
* **URL:** `http://localhost:5063/api/books`
* **Expected Status:** `200 OK`
* **Sample Response Body:**
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "price": 10.99,
    "genre": "Classic",
    "publishedYear": 1925
  },
  {
    "id": 2,
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "price": 12.50,
    "genre": "Classic",
    "publishedYear": 1960
  }
]
```

---

### 2. GET Book by ID
* **Method:** `GET`
* **URL:** `http://localhost:5063/api/books/1`
* **Expected Status:** `200 OK`
* **Sample Response Body:**
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "price": 10.99,
  "genre": "Classic",
  "publishedYear": 1925
}
```

---

### 3. POST (Create a New Book)
* **Method:** `POST`
* **URL:** `http://localhost:5063/api/books`
* **Headers:**
  * Key: `Content-Type`, Value: `application/json`
* **Body Tab:** Select **raw** -> **JSON**
* **Request Body:**
```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 29.99,
  "genre": "Software Engineering",
  "publishedYear": 2008
}
```
* **Expected Status:** `201 Created`
* **Response Header:** `Location: http://localhost:5063/api/books/5`
* **Response Body:**
```json
{
  "id": 5,
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "price": 29.99,
  "genre": "Software Engineering",
  "publishedYear": 2008
}
```

---

### 4. PUT (Update an Existing Book)
* **Method:** `PUT`
* **URL:** `http://localhost:5063/api/books/1`
* **Headers:**
  * Key: `Content-Type`, Value: `application/json`
* **Body Tab:** Select **raw** -> **JSON**
* **Request Body:**
```json
{
  "title": "The Great Gatsby (Special Edition)",
  "author": "F. Scott Fitzgerald",
  "price": 14.99,
  "genre": "Classic Literature",
  "publishedYear": 1925
}
```
* **Expected Status:** `200 OK`

---

### 5. DELETE (Remove a Book)
* **Method:** `DELETE`
* **URL:** `http://localhost:5063/api/books/1`
* **Expected Status:** `200 OK`
* **Response Body:**
```json
{
  "message": "Book with ID 1 successfully deleted."
}
```

---

## ⚠️ Technical Errors & Blockers Faced (And How They Were Fixed)

Understanding the issues encountered during development is essential for troubleshooting future projects:

### Blocker 1: `404 Not Found` when requesting `/api/books`
* **Symptom:** When sending `GET http://localhost:5063/api/books` in Postman, the server responded with:
  ```text
  Status: 404 Not Found
  ```
* **Root Cause:** Both [`Book.cs`](file:///c:/Subodh/WebApi_Postman/BooksApi/Models/Book.cs) and [`BooksController.cs`](file:///c:/Subodh/WebApi_Postman/BooksApi/Controllers/BooksController.cs) were completely blank (0 bytes). Since no controller class or route attributes (`[ApiController]`, `[Route("api/[controller]")]`) existed, the ASP.NET Core routing engine had no registered handler for that URL.
* **Resolution:** 
  1. Defined the `Book` data model in `Models/Book.cs`.
  2. Implemented the `BooksController` inheriting from `ControllerBase` with `[ApiController]` and `[Route("api/[controller]")]`.
  3. Added the `[HttpGet]` action returning an initial seeded list of books.

---

### Blocker 2: Process File Lock Warning (`MSB3026`)
* **Symptom:** During compilation (`dotnet build`), the build system emitted:
  ```text
  warning MSB3026: Could not copy "obj\Debug\net10.0\apphost.exe" to "bin\Debug\net10.0\BooksApi.exe".
  The process cannot access the file because it is being used by another process.
  The file is locked by: "BooksApi (PID)"
  ```
* **Root Cause:** The application was already running in the background. In Windows, an executing `.exe` binary is locked by the OS and cannot be overwritten by the compiler.
* **Resolution:** 
  1. Terminated the existing running process (or stopped the server in terminal using `Ctrl + C`).
  2. Rebuilt the project (`dotnet build`), which completed with `0 Warning(s), 0 Error(s)`.

---

### Blocker 3: HTTPS Redirection (307 Redirects & SSL Errors) in Postman
* **Symptom:**
  - Sending a request to `http://localhost:5063/api/books` might return `307 Temporary Redirect` redirecting to `https://localhost:7256/api/books`.
  - In Postman, calling `https://` may fail with `SSL Error: Self-signed certificate`.
* **Root Cause:**
  - `Program.cs` includes `app.UseHttpsRedirection();`, which automatically redirects insecure HTTP requests to HTTPS.
  - Development HTTPS certificates on localhost are self-signed.
* **Resolution:**
  - **In Postman:** Go to **Settings** (`Ctrl + ,`) -> **General** -> Turn **OFF** `SSL certificate verification`.
  - Alternatively, test using the explicit HTTPS port (`https://localhost:7256/api/books`).

---

### Blocker 4: Default Template Boilerplate Mismatch
* **Symptom:** The scaffolded `.http` file contained requests pointing to `weatherforecast/` which didn't exist in our Books project.
* **Root Cause:** Default project templates include sample WeatherForecast endpoints that were removed.
* **Resolution:** Replaced [`BooksApi.http`](file:///c:/Subodh/WebApi_Postman/BooksApi/BooksApi.http) with clear, structured requests for all 5 Books CRUD endpoints.

---

## 💡 Best Practices & Future Enhancements

1. **Persistent Database (Entity Framework Core):**
   * Currently, the books are stored in memory (`List<Book>`), which resets whenever the application restarts.
   * Future improvement: Integrate SQLite or SQL Server using `Microsoft.EntityFrameworkCore.Sqlite` or `SqlServer`.

2. **Input Validation (Data Annotations):**
   * Add validation attributes in `Book.cs`:
     ```csharp
     [Required(ErrorMessage = "Title is required")]
     [StringLength(100)]
     public string Title { get; set; }

     [Range(0.01, 10000.00)]
     public decimal Price { get; set; }
     ```

3. **Interactive Documentation (Swagger / Scalar UI):**
   * Add `Scalar.AspNetCore` or `Swashbuckle.AspNetCore` to view and test endpoints interactively in the web browser.

4. **Asynchronous Endpoints (`async`/`await`):**
   * When integrating a real database, change controller methods to return `Task<ActionResult<Book>>` and use `await context.SaveChangesAsync()` for optimal throughput under high traffic.
