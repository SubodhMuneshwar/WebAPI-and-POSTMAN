namespace BooksApi.Models;

public class BookPatchDto
{
    public string? Title { get; set; }
    public string? Author { get; set; }
    public int? Year { get; set; }
}