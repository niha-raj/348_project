import React, { useState } from 'react';
import TBRList from './TBRlist';
import Stats from './Stats';
import Settings from './Settings';
import ReadingGoals from './ReadingGoals';
import { SettingProvider } from './SettingsContext'; // Import the SettingProvider
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [currentPage, setCurrentPage] = useState('tbr');

  // Function to handle opening the modal (Add New Book)
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Function to handle clearing the TBR list
  const handleClearTBR = async () => {
    if (window.confirm('Are you sure you want to clear your entire TBR list? This action cannot be undone.')) {
      try {
        const response = await fetch('http://localhost:5002/api/clear_tbr', {
          method: 'DELETE',
        });
        if (response.ok) {
          setBooks([]);  // Clear the books list in the frontend
          alert('TBR List has been cleared.');
        }
      } catch (error) {
        console.error('Error clearing TBR list:', error);
        alert('Failed to clear TBR list.');
      }
    }
  };

  // Render the current page based on state
  const renderPage = () => {
    switch(currentPage) {
      case 'tbr':
        return (
          <TBRList 
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            books={books}
            setBooks={setBooks}
          />
        );
      case 'stats':
        return <Stats books={books} />;
      case 'goals': 
        return <ReadingGoals />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <TBRList 
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
            books={books}
            setBooks={setBooks}
          />
        );
    }
  };

  

  return (
    <SettingProvider> {/* Wrap the entire app with SettingProvider */}
      <div className="App">
        <div className="notebook-container">
          {/* Notebook Binding */}
          <div className="notebook-binding">
            <div className="binding-rings">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="binding-ring"></div>
              ))}
            </div>
          </div>
          
          {/* Notebook Content */}
          <div className="notebook-content">
            {/* Header */}
            <div className="notebook-header">
              <h1>Reading Journal</h1>
              <div className="notebook-actions">
                <button className="add-button" onClick={handleOpenModal}>
                  <span>+</span> Add Book
                </button>
                <button className="clear-button" onClick={handleClearTBR}>
                  Clear List
                </button>
              </div>
            </div>
            
            {/* Notebook Tabs */}
            <div className="notebook-tabs">
              <button 
                className={currentPage === 'tbr' ? "tab active" : "tab"}
                onClick={() => setCurrentPage('tbr')}
              >
                To Be Read
              </button>
              <button 
                className={currentPage === 'stats' ? "tab active" : "tab"}
                onClick={() => setCurrentPage('stats')}
              >
                Reading Stats
              </button>
              <button 
                className={currentPage === 'goals' ? "tab active" : "tab"}
                onClick={() => setCurrentPage('goals')}
              >
                Reading Goals
              </button>
              <button 
                className={currentPage === 'settings' ? "tab active" : "tab"}
                onClick={() => setCurrentPage('settings')}
              >
                Settings
              </button>
            </div>
            
            {/* Main Content */}
            <div className="notebook-page">
              {renderPage()}
            </div>
          </div>
        </div>
      </div>
    </SettingProvider>
  );
}

export default App;