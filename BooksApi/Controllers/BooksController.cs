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
}