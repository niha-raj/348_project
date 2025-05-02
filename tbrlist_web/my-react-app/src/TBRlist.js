import React, { useState, useEffect, useCallback } from 'react';
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
    category: 'Fiction', 
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
    category: 'Fiction',
    publication_year: '',
    page_count: '',
    priority: 5
  });
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('priority');
  const [cardLayout, setCardLayout] = useState('grid');
  // Add reminders state
  const [reminders, setReminders] = useState([]);

  const API_URL = 'http://localhost:5001/api';

  const fetchBooks = async () => {
    try {
      const booksRes = await axios.get(`${API_URL}/tbr`);
      console.log('Books fetched:', booksRes.data);
      setBooks(booksRes.data);
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings`);
      const data = await response.json();
      
      if (response.ok) {
        setCardLayout(data.card_layout || 'grid');
        
        if (data.default_sort) {
          setSort(data.default_sort);
        }
      } else {
        console.error('Error fetching settings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Add function to check reminders
  const checkReminders = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/goals/reminders`);
      if (response.ok) {
        const data = await response.json();
        if (data.reminders_count > 0) {
          setReminders(data.reminders);
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, statusesRes] = await Promise.all([
          axios.get(`${API_URL}/tbr`),
          axios.get(`${API_URL}/statuses`)
        ]);

        console.log('Initial books fetch:', booksRes.data);
        setBooks(booksRes.data);
        setStatuses(statusesRes.data);
        
        await fetchSettings();
        // Call checkReminders to get reading goal reminders
        await checkReminders();
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [setBooks, checkReminders]);

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
        category: newBook.category || 'Fiction',
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
      // Re-check reminders after status change as it might affect reading goals
      await checkReminders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleRatingChange = async (tbrId, newRating) => {
    try {
      console.log(`Updating rating for book ${tbrId} to ${newRating}`);
      
      const response = await axios.put(`${API_URL}/rating`, { 
        tbr_id: tbrId, 
        rating: newRating 
      });
      
      if (response.data.success) {
        console.log('Rating update successful, refreshing books');
        
        setBooks(prevBooks => 
          prevBooks.map(book => 
            book.tbr_id === tbrId 
              ? { ...book, rating: newRating } 
              : book
          )
        );
        
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
      category: book.category || 'Fiction',
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
        category: editFormData.category || 'Fiction',
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
      {/* Reminders Section */}
      {reminders.length > 0 && (
        <div className="reminders-container">
          <h3>Reading Goal Reminders</h3>
          <div className="reminders-list">
            {reminders.map(reminder => (
              <div className="reminder" key={reminder.goal_id}>
                {reminder.goal_type === 'books' && 
                  `Remember your goal to read ${reminder.target_value} books by ${reminder.end_date}. ` +
                  `Current progress: ${reminder.progress} books (${
                    Math.round((reminder.progress / reminder.target_value) * 100)
                  }%).`
                }
                {reminder.goal_type === 'pages' && 
                  `Remember your goal to read ${reminder.target_value} pages by ${reminder.end_date}. ` +
                  `Current progress: ${reminder.progress} pages (${
                    Math.round((reminder.progress / reminder.target_value) * 100)
                  }%).`
                }
                {reminder.goal_type === 'specific_book' && 
                  `Remember your goal to read "${reminder.book_title}" by ${reminder.end_date}.`
                }
                {reminder.goal_type === 'genre' && 
                  `Remember your goal to focus on the "${reminder.genre_name}" genre by ${reminder.end_date}.`
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Sorting Controls */}
      <div className="list-controls">
        <div className="left-controls">
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
      </div>

      {/* Book List */}
      <div className={`book-list-${cardLayout}`}>
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
              layout={cardLayout}
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