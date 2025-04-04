import React, { useState, useEffect } from 'react';

// For debugging purposes
const logRatingData = (message, data) => {
  console.log(`${message}:`, data);
};

function StarRating({ initialRating = 0, onRatingChange }) {
  const [hoveredRating, setHoveredRating] = useState(0);
  
  // For debugging
  useEffect(() => {
    logRatingData('StarRating receiving initialRating', initialRating);
  }, [initialRating]);
  
  const handleRatingClick = (newRating) => {
    logRatingData('Clicked rating', newRating);
    if (onRatingChange) {
      onRatingChange(newRating);
    }
  };
  
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hoveredRating || initialRating) ? 'filled' : 'empty'}`}
          onClick={() => handleRatingClick(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          style={{
            cursor: 'pointer',
            color: star <= (hoveredRating || initialRating) ? '#FFD700' : '#CCCCCC',
            fontSize: '24px',
            marginRight: '2px'
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function BookCard({ book, layout = 'grid', statuses, onStatusChange, onEditClick, onDeleteClick, onRatingChange }) {
  // For debugging
  useEffect(() => {
    logRatingData('BookCard received book with rating', book.rating);
  }, [book.rating]);
  
  // Function to determine priority label and color
  const getPriorityInfo = (priority) => {
    if (!priority) return { label: 'Low', color: '#AAAAAA', borderRadius: '12px' };
    
    if (priority <= 4) return { label: 'High', color: '#E57373', borderRadius: '12px' };
    if (priority <= 7) return { label: 'Medium', color: '#FFD54F', borderRadius: '12px' };
    return { label: 'Low', color: '#81C784', borderRadius: '12px' };
  };

  const priorityInfo = getPriorityInfo(book.priority);

  // Get status color based on status name
  const getStatusColor = (status) => {
    switch(status) {
      case 'Not Started': return '#BDBDBD';
      case 'In-Progress': return '#81C784';
      case 'Complete': return '#05472A';
      default: return '#BDBDBD';
    }
  };
  
  // Handle rating change
  const handleRatingChange = (newRating) => {
    logRatingData(`Rating change for book ${book.tbr_id}`, newRating);
    if (onRatingChange) {
      onRatingChange(book.tbr_id, newRating);
    }
  };

  // Choose the appropriate class based on layout
  const cardClassName = layout === 'list' 
    ? `book-card-list ${book.status === 'Complete' ? 'completed' : ''}` 
    : `book-card ${book.status === 'Complete' ? 'completed' : ''}`;

  // Grid layout (original layout)
  if (layout === 'grid') {
    return (
      <div className={cardClassName}>
        <div className="book-status-indicator" style={{ backgroundColor: getStatusColor(book.status) }}></div>
        
        <div className="book-header">
          <h3 className="book-title">{book.title}</h3>
          <div 
            className="priority-badge"
            style={{ backgroundColor: priorityInfo.color }}
          >
            {priorityInfo.label}
          </div>
        </div>
        
        <div className="book-details">
          <p className="book-author">by {book.author}</p>
          <p className="book-genre">{book.genre}</p>
          
          {/* Star Rating Component */}
          <div className="book-rating">
            <StarRating 
              initialRating={Number(book.rating) || 0} 
              onRatingChange={handleRatingChange} 
            />
            <span className="rating-text">
              {book.rating ? `${book.rating}/5` : ''}
            </span>
          </div>
        </div>
        
        <div className="book-actions">
          <div className="status-selector">
            <select
              value={book.status}
              onChange={(e) => {
                const selectedStatus = statuses.find(s => s.status === e.target.value);
                if (selectedStatus) {
                  onStatusChange(book.tbr_id, selectedStatus.status_id);
                }
              }}
              style={{ backgroundColor: getStatusColor(book.status) }}
            >
              {statuses.map(status => (
                <option key={status.status_id} value={status.status}>
                  {status.status}
                </option>
              ))}
            </select>
          </div>
          
          <div className="card-buttons">
            <button className="edit-btn" onClick={() => onEditClick(book)}>
              Edit
            </button>
            <button className="delete-btn" onClick={() => onDeleteClick(book)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // List layout (new layout)
  return (
    <div className={cardClassName}>
      <div className="book-status-indicator-list" style={{ backgroundColor: getStatusColor(book.status) }}></div>
      
      <div className="book-content-list">
        <div className="book-header-list">
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">by {book.author}</p>
          <p className="book-genre">{book.genre}</p>
          
          <div className="book-metadata">
            {book.publication_year && <span className="book-year">{book.publication_year}</span>}
            {book.page_count && <span className="book-pages">{book.page_count} pages</span>}
          </div>
        </div>
        
        <div className="book-controls-list">
          <div 
            className="priority-badge-list"
            style={{ backgroundColor: priorityInfo.color }}
          >
            {priorityInfo.label} Priority
          </div>
          
          <div className="book-rating">
            <StarRating 
              initialRating={Number(book.rating) || 0} 
              onRatingChange={handleRatingChange} 
            />
            <span className="rating-text">
              {book.rating ? `${book.rating}/5` : ''}
            </span>
          </div>
          
          <div className="status-selector-list">
            <select
              value={book.status}
              onChange={(e) => {
                const selectedStatus = statuses.find(s => s.status === e.target.value);
                if (selectedStatus) {
                  onStatusChange(book.tbr_id, selectedStatus.status_id);
                }
              }}
              style={{ backgroundColor: getStatusColor(book.status) }}
            >
              {statuses.map(status => (
                <option key={status.status_id} value={status.status}>
                  {status.status}
                </option>
              ))}
            </select>
          </div>
          
          <div className="card-buttons-list">
            <button className="edit-btn" onClick={() => onEditClick(book)}>
              Edit
            </button>
            <button className="delete-btn" onClick={() => onDeleteClick(book)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookCard;