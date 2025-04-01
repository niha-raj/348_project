import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookCard from './BookCard';
import { AddBookModal, EditBookModal, DeleteConfirmModal } from './BookModal';

function TBRList({ isModalOpen, setIsModalOpen, books, setBooks }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBook, setNewBook] = useState({
    title: '',
    author_name: '',
    genre: '',
    category: 'Fiction', // Default category set to fiction
    publication_year: '',
    page_count: '',
    priority: 5
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bookToEdit, setBookToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    author_name: '',
    genre: '',
    category: 'Fiction', // Default category set to fiction
    publication_year: '',
    page_count: '',
    priority: 5
  });
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('priority');

  const API_URL = 'http://localhost:5001/api';

  const fetchBooks = async () => {
    try {
      const booksRes = await axios.get(`${API_URL}/tbr`);
      console.log('Books fetched:', booksRes.data); // Debug log
      setBooks(booksRes.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, statusesRes] = await Promise.all([
          axios.get(`${API_URL}/tbr`),
          axios.get(`${API_URL}/statuses`)
        ]);

        console.log('Initial books fetch:', booksRes.data); // Debug log
        setBooks(booksRes.data);
        setStatuses(statusesRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [setBooks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook(prev => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      if (!newBook.title || !newBook.author_name || !newBook.genre) {
        alert('All fields are required.');
        return;
      }

      const response = await axios.post(`${API_URL}/book`, {
        ...newBook,
        priority: parseInt(newBook.priority),
        status_id: 3,
        category: newBook.category || 'Fiction', // Ensure category is sent
        publication_year: newBook.publication_year ? parseInt(newBook.publication_year) : null,
        page_count: newBook.page_count ? parseInt(newBook.page_count) : null
      });

      if (response.data.success) {
        await fetchBooks();
        setNewBook({
          title: '',
          author_name: '',
          genre: '',
          category: 'Fiction',
          publication_year: '',
          page_count: '',
          priority: 5
        });
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book.');
    }
  };

  const handleStatusChange = async (tbrId, statusId) => {
    try {
      await axios.put(`${API_URL}/status`, { tbr_id: tbrId, status_id: statusId });
      await fetchBooks();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRatingChange = async (tbrId, newRating) => {
    try {
      console.log(`Updating rating for book ${tbrId} to ${newRating}`); // Debug log
      
      const response = await axios.put(`${API_URL}/rating`, { 
        tbr_id: tbrId, 
        rating: newRating 
      });
      
      if (response.data.success) {
        console.log('Rating update successful, refreshing books'); // Debug log
        
        // First update the local state for immediate UI feedback
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.tbr_id === tbrId 
              ? { ...book, rating: newRating } 
              : book
          )
        );
        
        // Then fetch fresh data from the server
        await fetchBooks();
      } else {
        console.error('Failed to update rating:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      alert('Failed to update book rating.');
    }
  };

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setIsDeleting(true);
  };

  const handleEditClick = (book) => {
    setBookToEdit(book);
    setEditFormData({
      title: book.title,
      author_name: book.author,
      genre: book.genre,
      category: book.category || 'Fiction', // Get current category or default to fiction
      publication_year: book.publication_year || '',
      page_count: book.page_count || '',
      priority: book.priority || 5
    });
    setIsEditing(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`${API_URL}/book/${bookToDelete.book_id}`);
      
      if (response.data.success) {
        await fetchBooks();
        setIsDeleting(false);
        setBookToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book.');
    }
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    try {
      if (!editFormData.title || !editFormData.author_name || !editFormData.genre) {
        alert('All fields are required.');
        return;
      }

      const response = await axios.put(`${API_URL}/book/${bookToEdit.book_id}`, {
        title: editFormData.title,
        author_name: editFormData.author_name,
        genre: editFormData.genre,
        category: editFormData.category || 'Fiction', // Include category
        publication_year: editFormData.publication_year ? parseInt(editFormData.publication_year) : null,
        page_count: editFormData.page_count ? parseInt(editFormData.page_count) : null,
        priority: parseInt(editFormData.priority),
      });

      if (response.data.success) {
        await fetchBooks();
        setIsEditing(false);
        setBookToEdit(null);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Failed to update book details.');
    }
  };

  const filteredBooks = books.filter(book => {
    if (filter === 'all') return true;
    return book.status === filter;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sort === 'priority') return (b.priority || 0) - (a.priority || 0);
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'author') return a.author.localeCompare(b.author);
    return 0;
  });

  if (loading) {
    return <div className="loading-container"><div className="loading-spinner"></div><p>Loading your reading list...</p></div>;
  }

  return (
    <div className="tbr-list-container">
      {/* Filters and Sorting */}
      <div className="list-controls">
        <div className="filter-container">
          <label>Filter by Status:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Books</option>
            {statuses.map(status => (
              <option key={status.status_id} value={status.status}>
                {status.status}
              </option>
            ))}
          </select>
        </div>
        
        <div className="sort-container">
          <label>Sort by:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>
        </div>
      </div>

      {/* Book List */}
      <div className="book-list-grid">
        {sortedBooks.length === 0 ? (
          <div className="empty-list">
            <p>No books in your reading list yet!</p>
            <button className="add-book-btn" onClick={() => setIsModalOpen(true)}>Add Your First Book</button>
          </div>
        ) : (
          sortedBooks.map((book) => (
            <BookCard 
              key={book.tbr_id} 
              book={book} 
              statuses={statuses}
              onStatusChange={handleStatusChange}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              onRatingChange={handleRatingChange}
            />
          ))
        )}
      </div>

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookData={newBook}
        onInputChange={handleInputChange}
        onSubmit={handleAddBook}
      />

      {/* Edit Book Modal */}
      <EditBookModal
        isOpen={isEditing}
        onClose={() => {setIsEditing(false); setBookToEdit(null);}}
        bookData={editFormData}
        onInputChange={handleEditInputChange}
        onSubmit={handleUpdateBook}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleting}
        book={bookToDelete}
        onConfirm={confirmDelete}
        onCancel={() => {setIsDeleting(false); setBookToDelete(null);}}
      />
    </div>
  );
}

export default TBRList;