import React, { useState, useEffect } from 'react';
import { useSettingsContext } from './SettingsContext'; // Update the path as needed

// Create a reusable ToggleSwitch component
const ToggleSwitch = ({ id, label, description, isChecked, onChange }) => {
  return (
    <div className="settings-control toggle">
      <div className="toggle-label">
        <label htmlFor={id}>{label}</label>
        {description && <span className="setting-description">{description}</span>}
      </div>
      <label className="toggle-switch">
        <input 
          id={id} 
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
};

function Settings() {
  // Get settings from context instead of managing local state
  const { settings, updateSettings, isLoading: contextLoading } = useSettingsContext();
  
  // Local state for UI
  const [saveMessage, setSaveMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Local form state
  const [formValues, setFormValues] = useState({
    theme: 'light',
    cardLayout: 'grid',
    showPriority: true,
    defaultSort: 'priority',
    notifications: true,
    autoBackup: false
  });
  
  // Initialize form values from context when available
  useEffect(() => {
    if (!contextLoading) {
      console.log('Settings component: Loading values from context', settings);
      setFormValues({
        theme: settings.theme,
        cardLayout: settings.cardLayout,
        showPriority: settings.showPriority,
        defaultSort: settings.defaultSort,
        notifications: settings.notifications,
        autoBackup: settings.autoBackup
      });
    }
  }, [settings, contextLoading]);

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    try {
      console.log('Settings component: Saving form values to context', formValues);
      setIsLoading(true);
      
      // Update context with form values
      await updateSettings(formValues);
      
      setSaveMessage('Settings saved successfully! Layout changes will apply on your next visit to the book list.');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReadingList = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/export');
      
      if (response.ok) {
        // Get the text content directly
        const textContent = await response.text();
        
        // Create a downloadable file
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor element to download the file
        const a = document.createElement('a');
        a.href = url;
        a.download = `reading-journal-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Try to get the error message from JSON
        try {
          const errorData = await response.json();
          console.error('Error exporting data:', errorData.error);
          alert('Error exporting data. Please try again.');
        } catch {
          console.error('Error exporting data:', response.status);
          alert('Error exporting data. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    }
  };
  
  const importReadingList = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt'; // Accept .txt files
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Confirm before importing
          if (window.confirm('Importing will replace your current reading list. Continue?')) {
            // Create a FormData object to send the file
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('http://localhost:5002/api/import', {
              method: 'POST',
              body: formData // Send the file as FormData
            });
            
            const data = await response.json();
            
            if (response.ok) {
              alert(`Import successful! ${data.details.new_books_added} new books added, ${data.details.updates_made} books updated.`);
              window.location.reload();
            } else {
              console.error('Error importing data:', data.error);
              alert('Error importing data. Please try again.');
            }
          }
        } catch (error) {
          console.error('Error reading file:', error);
          alert('Error reading file. Please try again.');
        }
      }
    };
    
    input.click();
  };

  if (contextLoading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="notebook-page">
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-description">Customize your reading journal experience</p>
      </div>

      {saveMessage && (
        <div className="save-message success">
          {saveMessage}
        </div>
      )}

      <div className="settings-grid">
        {/* Appearance Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <h3 className="settings-card-title">Appearance</h3>
          </div>
          
          <div className="settings-card-body">
            <div className="settings-control">
              <label htmlFor="theme-select">Theme</label>
              <div className="select-wrapper">
                <select 
                  id="theme-select"
                  value={formValues.theme}
                  onChange={(e) => handleFieldChange('theme', e.target.value)}
                  className="settings-select"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="sepia">Sepia</option>
                </select>
              </div>
            </div>
            
            <div className="divider"></div>
            
            <div className="settings-control">
              <label htmlFor="layout-select">Book Layout</label>
              <div className="select-wrapper">
                <select 
                  id="layout-select"
                  value={formValues.cardLayout}
                  onChange={(e) => handleFieldChange('cardLayout', e.target.value)}
                  className="settings-select"
                >
                  <option value="grid">Grid Cards</option>
                  <option value="list">List View</option>
                </select>
              </div>
              <span className="setting-description">This setting controls how books are displayed throughout the app</span>
            </div>
            
            <div className="divider"></div>
            
            {/* Using the ToggleSwitch component instead of direct HTML */}
            <ToggleSwitch
              id="show-priority"
              label="Show Priority Badges"
              description="Display priority indicators on book cards"
              isChecked={formValues.showPriority}
              onChange={(checked) => handleFieldChange('showPriority', checked)}
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </div>
            <h3 className="settings-card-title">Preferences</h3>
          </div>
          
          <div className="settings-card-body">
            <div className="settings-control">
              <label htmlFor="sort-select">Default Sort</label>
              <div className="select-wrapper">
                <select 
                  id="sort-select"
                  value={formValues.defaultSort}
                  onChange={(e) => handleFieldChange('defaultSort', e.target.value)}
                  className="settings-select"
                >
                  <option value="priority">Priority</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="date_added">Date Added</option>
                </select>
              </div>
              <span className="setting-description">This controls the default order of your reading list</span>
            </div>
            
            <div className="divider"></div>
            
            <ToggleSwitch
              id="notifications"
              label="Notifications"
              description="Receive reminders for reading goals"
              isChecked={formValues.notifications}
              onChange={(checked) => handleFieldChange('notifications', checked)}
            />
            
            <div className="divider"></div>
            
            <ToggleSwitch
              id="auto-backup"
              label="Automatic Backup"
              description="Back up your reading list daily"
              isChecked={formValues.autoBackup}
              onChange={(checked) => handleFieldChange('autoBackup', checked)}
            />
          </div>
        </div>
        
        {/* Data Management Section */}
        <div className="settings-card wide">
          <div className="settings-card-header">
            <div className="settings-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <h3 className="settings-card-title">Data Management</h3>
          </div>
          
          <div className="settings-card-body">
            <div className="settings-actions-row">
              <button className="settings-btn export-btn" onClick={exportReadingList} disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Export Reading List
              </button>
            </div>
            <span className="setting-description">Download your reading list as a text file</span>
            
            <div className="divider"></div>
            
            <div className="settings-actions-row">
              <button className="settings-btn import-btn" onClick={importReadingList} disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Import Reading List
              </button>
            </div>
            <div className="settings-warning">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              This will merge with your existing reading list
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-footer">
        <button 
          className="primary-btn save-settings-btn" 
          onClick={saveSettings} 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default Settings;