using BooksApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace BooksApi.Controllers;

[ApiController]
[Route("api/[controller]")]   // URL becomes /api/books
public class BooksController : ControllerBase
{
    // Our "fake database": a list that lives in memory
    private static readonly List<Book> _books = new()
    {
        new Book { Id = 1, Title = "Clean Code", Author = "Robert C. Martin", Year = 2008 },
        new Book { Id = 2, Title = "The Pragmatic Programmer", Author = "Andrew Hunt", Year = 1999 }
    };
    private static int _nextId = 3;

    // GET /api/books  -> get all books
    [HttpGet]
    public ActionResult<IEnumerable<Book>> GetAll()
    {
        return Ok(_books);                       // 200 OK
    }

    // GET /api/books/1  -> get one book
    [HttpGet("{id}")]
    public ActionResult<Book> GetById(int id)
    {
        var book = _books.FirstOrDefault(b => b.Id == id);
        if (book is null) return NotFound();     // 404
        return Ok(book);                         // 200 OK
    }

    // POST /api/books  -> add a new book
    [HttpPost]
    public ActionResult<Book> Create(Book newBook)
    {
        newBook.Id = _nextId++;
        _books.Add(newBook);
        return CreatedAtAction(nameof(GetById), new { id = newBook.Id }, newBook);  // 201 Created
    }

    // PUT /api/books/1  -> update an existing book
    [HttpPut("{id}")]
    public IActionResult Update(int id, Book updated)
    {
        var book = _books.FirstOrDefault(b => b.Id == id);
        if (book is null) return NotFound();     // 404

        book.Title = updated.Title;
        book.Author = updated.Author;
        book.Year = updated.Year;
        return NoContent();                      // 204 No Content
    }

    // DELETE /api/books/1  -> remove a book
    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var book = _books.FirstOrDefault(b => b.Id == id);
        if (book is null) return NotFound();     // 404

        _books.Remove(book);
        return NoContent();                      // 204 No Content
    }

        // PATCH /api/books/1  -> update only the fields that are sent
    [HttpPatch("{id}")]
    public ActionResult<Book> Patch(int id, BookPatchDto changes)
    {
        var book = _books.FirstOrDefault(b => b.Id == id);
        if (book is null) return NotFound();                 // 404

        if (changes.Title is not null)  book.Title  = changes.Title;
        if (changes.Author is not null) book.Author = changes.Author;
        if (changes.Year is not null)   book.Year   = changes.Year.Value;

        return Ok(book);                                     // 200 with updated book
    }

    // HEAD /api/books  -> headers only, no body
    [HttpHead]
    public IActionResult HeadAll()
    {
        Response.Headers["X-Total-Count"] = _books.Count.ToString();
        return Ok();
    }

    // HEAD /api/books/1  -> does this book exist?
    [HttpHead("{id}")]
    public IActionResult HeadById(int id)
    {
        return _books.Any(b => b.Id == id) ? Ok() : NotFound();
    }

    // OPTIONS /api/books  -> which methods are allowed?
    [HttpOptions]
    public IActionResult OptionsAll()
    {
        Response.Headers["Allow"] = "GET, POST, HEAD, OPTIONS";
        return Ok();
    }

    // OPTIONS /api/books/1
    [HttpOptions("{id}")]
    public IActionResult OptionsById(int id)
    {
        Response.Headers["Allow"] = "GET, PUT, PATCH, DELETE, HEAD, OPTIONS";
        return Ok();
    }
}