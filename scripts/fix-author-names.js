const books = db.books.find({}).toArray();
let updated = 0;
for (const book of books) {
  const author = db.authors.findOne({ _id: book.authorId });
  if (author && book.authorName !== author.name) {
    db.books.updateOne({ _id: book._id }, { $set: { authorName: author.name } });
    updated++;
  }
}
print("Updated " + updated + " books with author names");
