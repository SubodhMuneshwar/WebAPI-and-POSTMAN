using Microsoft.AspNetCore.Mvc;
using BooksApi.Models;

namespace BooksApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    // In-memory collection of books seeded with sample data
    private static readonly List<Book> _books = new()
    {
        new Book { Id = 1, Title = "The Great Gatsby", Author = "F. Scott Fitzgerald", Price = 10.99m, Genre = "Classic", PublishedYear = 1925 },
        new Book { Id = 2, Title = "To Kill a Mockingbird", Author = "Harper Lee", Price = 12.50m, Genre = "Classic", PublishedYear = 1960 },
        new Book { Id = 3, Title = "1984", Author = "George Orwell", Price = 9.99m, Genre = "Dystopian", PublishedYear = 1949 },
        new Book { Id = 4, Title = "The Hobbit", Author = "J.R.R. Tolkien", Price = 14.99m, Genre = "Fantasy", PublishedYear = 1937 }
    };

    // GET: api/books
    [HttpGet]
    public ActionResult<IEnumerable<Book>> GetAll()
    {
        return Ok(_books);
    }

    // GET: api/books/{id}
    [HttpGet("{id:int}")]
    public ActionResult<Book> GetById(int id)
    {
        var book = _books.FirstOrDefault(b => b.Id == id);
        if (book == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }
        return Ok(book);
    }

    // POST: api/books
    [HttpPost]
    public ActionResult<Book> Create([FromBody] Book newBook)
    {
        if (newBook == null)
        {
            return BadRequest("Book data is required.");
        }

        int nextId = _books.Count > 0 ? _books.Max(b => b.Id) + 1 : 1;
        newBook.Id = nextId;

        _books.Add(newBook);
        return CreatedAtAction(nameof(GetById), new { id = newBook.Id }, newBook);
    }

    // PUT: api/books/{id}
    [HttpPut("{id:int}")]
    public IActionResult Update(int id, [FromBody] Book updatedBook)
    {
        var existingBook = _books.FirstOrDefault(b => b.Id == id);
        if (existingBook == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }

        existingBook.Title = updatedBook.Title;
        existingBook.Author = updatedBook.Author;
        existingBook.Price = updatedBook.Price;
        existingBook.Genre = updatedBook.Genre;
        existingBook.PublishedYear = updatedBook.PublishedYear;

        return Ok(existingBook);
    }

    // DELETE: api/books/{id}
    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var book = _books.FirstOrDefault(b => b.Id == id);
        if (book == null)
        {
            return NotFound(new { message = $"Book with ID {id} not found." });
        }

        _books.Remove(book);
        return Ok(new { message = $"Book with ID {id} successfully deleted." });
    }
}
