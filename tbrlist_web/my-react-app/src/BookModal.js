// AddBookModal component
function AddBookModal({ isOpen, onClose, bookData, onInputChange, onSubmit }) {
    if (!isOpen) return null;
    
    return (
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">Add New Book</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <form onSubmit={onSubmit} className="modal-body">
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={bookData.title}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Author:</label>
              <input
                type="text"
                name="author_name"
                value={bookData.author_name}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Genre:</label>
              <input
                type="text"
                name="genre"
                value={bookData.genre}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Priority (1-10):</label>
              <input
                type="number"
                name="priority"
                min="1"
                max="10"
                value={bookData.priority}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="modal-footer">
              <button type="submit" className="submit-btn">Add Book</button>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  // EditBookModal component
  function EditBookModal({ isOpen, onClose, bookData, onInputChange, onSubmit }) {
    if (!isOpen) return null;
    
    return (
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">Edit Book</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <form onSubmit={onSubmit} className="modal-body">
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={bookData.title}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Author:</label>
              <input
                type="text"
                name="author_name"
                value={bookData.author_name}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Genre:</label>
              <input
                type="text"
                name="genre"
                value={bookData.genre}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Priority (1-10):</label>
              <input
                type="number"
                name="priority"
                min="1"
                max="10"
                value={bookData.priority}
                onChange={onInputChange}
                required
              />
            </div>
            <div className="modal-footer">
              <button type="submit" className="submit-btn">Update Book</button>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  // DeleteConfirmModal component
  function DeleteConfirmModal({ isOpen, book, onConfirm, onCancel }) {
    if (!isOpen || !book) return null;
    
    return (
      <div className="modal-backdrop">
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">Confirm Deletion</h2>
            <button className="modal-close" onClick={onCancel}>×</button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to remove "{book.title}" by {book.author} from your reading list?</p>
          </div>
          <div className="modal-footer">
            <button className="delete-btn" onClick={onConfirm}>Delete Book</button>
            <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }
  
  export { AddBookModal, EditBookModal, DeleteConfirmModal };
  