import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Notebook({ isModalOpen, setIsModalOpen, books, setBooks }) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBook, setNewBook] = useState({
    title: '',
    author_name: '',
    genre: '',
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
    priority: 5
  });

  const API_URL = 'http://localhost:5001/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, statusesRes] = await Promise.all([
          axios.get(`${API_URL}/tbr`),
          axios.get(`${API_URL}/statuses`)
        ]);

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
      });

      if (response.data.success) {
        const booksRes = await axios.get(`${API_URL}/tbr`);
        setBooks(booksRes.data);
        setNewBook({ title: '', author_name: '', genre: '', priority: 5 });
        setIsModalOpen(false);  // Close the modal after adding
      }
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book.');
    }
  };

  // Handle showing delete confirmation modal
  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setIsDeleting(true);
  };

  // Handle showing edit modal
  const handleEditClick = (book) => {
    setBookToEdit(book);
    setEditFormData({
      title: book.title,
      author_name: book.author,
      genre: book.genre,
      priority: book.priority || 5
    });
    setIsEditing(true);
  };

  // Handle the actual deletion
  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`${API_URL}/book/${bookToDelete.book_id}`);
      
      if (response.data.success) {
        // Refresh the book list
        const booksRes = await axios.get(`${API_URL}/tbr`);
        setBooks(booksRes.data);
        // Close the confirmation modal
        setIsDeleting(false);
        setBookToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book.');
    }
  };

  // Handle the book update
  const handleUpdateBook = async (e) => {
    e.preventDefault();
    try {
      if (!editFormData.title || !editFormData.author_name || !editFormData.genre) {
        alert('All fields are required.');
        return;
      }

      // Update book details via API
      const response = await axios.put(`${API_URL}/book/${bookToEdit.book_id}`, {
        title: editFormData.title,
        author_name: editFormData.author_name,
        genre: editFormData.genre,
        priority: parseInt(editFormData.priority),
      });

      if (response.data.success) {
        // Refresh the book list
        const booksRes = await axios.get(`${API_URL}/tbr`);
        setBooks(booksRes.data);
        // Close the edit modal
        setIsEditing(false);
        setBookToEdit(null);
      }
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Failed to update book details.');
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setIsDeleting(false);
    setBookToDelete(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setIsEditing(false);
    setBookToEdit(null);
  };

  if (loading) {
    return <div className="notebook"><p>Loading your books...</p></div>;
  }

  return (
    <div className="notebook" style={{ position: 'relative', padding: '20px' }}>
      {/* Add Book Modal Popup */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '10px',
            width: '300px', textAlign: 'center'
          }}>
            <h3>Add a new book</h3>
            
            <input 
              type="text" name="title" value={newBook.title} onChange={handleInputChange}
              placeholder="Book Title" style={{ width: '100%', marginBottom: '10px', padding: '5px' }} required 
            />
            <input 
              type="text" name="author_name" value={newBook.author_name} onChange={handleInputChange}
              placeholder="Author" style={{ width: '100%', marginBottom: '10px', padding: '5px' }} required 
            />
            <input 
              type="text" name="genre" value={newBook.genre} onChange={handleInputChange}
              placeholder="Genre" style={{ width: '100%', marginBottom: '10px', padding: '5px' }} required 
            />
            <input 
              type="number" name="priority" min="1" max="10" value={newBook.priority} onChange={handleInputChange}
              style={{ width: '100%', marginBottom: '10px', padding: '5px' }} required 
            />
            
            <button onClick={handleAddBook} 
              style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Add to TBR
            </button>
            
            <button onClick={() => setIsModalOpen(false)} 
              style={{ backgroundColor: '#f44336', color: 'white', padding: '10px', marginLeft: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {isEditing && bookToEdit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '10px',
            width: '300px', textAlign: 'center'
          }}>
            <h3>Edit Book Details</h3>
            
            <input 
              type="text" name="title" value={editFormData.title} onChange={handleEditInputChange}
              placeholder="Book Title" style={{ width: '100%', marginBottom: '10px', padding: '5px' }} required 
            />
            <input 
              type="text" name="author_name" value={editFormData.author_name} onChange={handleEditInputChange}
              placeholder="Author" style={{ width: '100%', marginBottom: '10px', padding: '5px' }} required 
            />
            <input 
              type="text" name="genre" value={editFormData.genre} onChange={handleEditInputChange}
              placeholder="Genre" style={{ width: '100%', marginBottom: '10px', padding: '5px' }} required 
            />
            <input 
              type="number" name="priority" min="1" max="10" value={editFormData.priority} onChange={handleEditInputChange}
              style={{ width: '100%', marginBottom: '10px', padding: '5px' }} required 
            />
            
            <button onClick={handleUpdateBook} 
              style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Update Book
            </button>
            
            <button onClick={cancelEdit} 
              style={{ backgroundColor: '#888', color: 'white', padding: '10px', marginLeft: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && bookToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '10px',
            width: '300px', textAlign: 'center'
          }}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete "{bookToDelete.title}" from your TBR list?</p>
            
            <button onClick={confirmDelete} 
              style={{ backgroundColor: '#f44336', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Delete
            </button>
            
            <button onClick={cancelDelete} 
              style={{ backgroundColor: '#888', color: 'white', padding: '10px', marginLeft: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Book List */}
      <div className="book-list" style={{ marginTop: '50px' }}>
        {books.length === 0 ? (
          <p>No books in your TBR list yet!</p>
        ) : (
          books.map((book) => (
            <div key={book.tbr_id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', position: 'relative' }}>
              {/* Book Info - Title, Author, Genre */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  textDecoration: book.status === 'Complete' ? 'line-through' : 'none', 
                  marginTop: '-20px', 
                  marginLeft: '85px'
                }}>
                  {book.title} by {book.author} ({book.genre})
                  {book.priority && <span style={{ color: '#999', marginLeft: '10px' }}>Priority: {book.priority}</span>}
                </span>
                
                {/* Dropdown for Status */}
                <select
                  value={book.status}
                  onChange={(e) => {
                    const selectedStatus = statuses.find(s => s.status === e.target.value);
                    if (selectedStatus) {
                      axios.put(`${API_URL}/status`, { tbr_id: book.tbr_id, status_id: selectedStatus.status_id })
                        .then(() => axios.get(`${API_URL}/tbr`))
                        .then(res => setBooks(res.data))
                        .catch(error => console.error('Error updating status:', error));
                    }
                  }}
                  style={{ padding: '5px', width: '150px', marginTop: '-15px', marginRight: '15px' }}
                >
                  {statuses.map(status => (
                    <option key={status.status_id} value={status.status}>
                      {status.status}
                    </option>
                  ))}
                </select>
                
                {/* Action Buttons Container */}
                <div style={{ display: 'flex', gap: '5px', marginRight: '325px' }}>
                  {/* Edit Button */}
                  <button 
                    onClick={() => handleEditClick(book)} 
                    style={{ 
                      backgroundColor: '#2196F3', 
                      color: 'white', 
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDeleteClick(book)} 
                    style={{ 
                      backgroundColor: '#f44336', 
                      color: 'white', 
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notebook;