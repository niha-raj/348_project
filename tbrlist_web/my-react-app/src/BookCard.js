import React from 'react';

function BookCard({ book, statuses, onStatusChange, onEditClick, onDeleteClick }) {
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

  return (
    <div className={`book-card ${book.status === 'Complete' ? 'completed' : ''}`}>
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

export default BookCard;