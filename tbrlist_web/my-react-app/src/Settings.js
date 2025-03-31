import React, { useState } from 'react';

function Settings() {
  const [theme, setTheme] = useState('light');
  const [cardLayout, setCardLayout] = useState('grid');
  const [showPriority, setShowPriority] = useState(true);
  const [defaultSort, setDefaultSort] = useState('priority');
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  
  // This is a placeholder for settings that would actually update app state
  const saveSettings = () => {
    alert('Settings saved! Your preferences have been updated.');
    // In a real app: updateAppSettings({ theme, cardLayout, showPriority, defaultSort, notifications, autoBackup });
  };

  return (
    <div className="notebook-page">
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-description">Customize your reading journal experience</p>
      </div>

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
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
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
                  value={cardLayout}
                  onChange={(e) => setCardLayout(e.target.value)}
                  className="settings-select"
                >
                  <option value="grid">Grid Cards</option>
                  <option value="list">List View</option>
                </select>
              </div>
            </div>
            
            <div className="divider"></div>
            
            <div className="settings-control toggle">
              <div className="toggle-label">
                <label htmlFor="show-priority">Show Priority Badges</label>
                <span className="setting-description">Display priority indicators on book cards</span>
              </div>
              <div className="toggle-switch">
                <input 
                  id="show-priority" 
                  type="checkbox"
                  checked={showPriority}
                  onChange={(e) => setShowPriority(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
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
              <label htmlFor="default-sort">Default Sort Order</label>
              <div className="select-wrapper">
                <select 
                  id="default-sort"
                  value={defaultSort}
                  onChange={(e) => setDefaultSort(e.target.value)}
                  className="settings-select"
                >
                  <option value="priority">Priority</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="added">Date Added</option>
                </select>
              </div>
            </div>
            
            <div className="divider"></div>
            
            <div className="settings-control toggle">
              <div className="toggle-label">
                <label htmlFor="notifications">Reading Reminders</label>
                <span className="setting-description">Receive notifications about your reading goals</span>
              </div>
              <div className="toggle-switch">
                <input 
                  id="notifications" 
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
            
            <div className="divider"></div>
            
            <div className="settings-control toggle">
              <div className="toggle-label">
                <label htmlFor="auto-backup">Automatic Backup</label>
                <span className="setting-description">Backup your reading list automatically</span>
              </div>
              <div className="toggle-switch">
                <input 
                  id="auto-backup" 
                  type="checkbox"
                  checked={autoBackup}
                  onChange={(e) => setAutoBackup(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </div>
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
            <p className="settings-description">
              Export your reading list for backup or import a previously saved list.
            </p>
            
            <div className="settings-actions-row">
              <button className="settings-btn export-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export Reading List
              </button>
              <button className="settings-btn import-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
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
              <span>Importing a list will replace your current reading list</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-footer">
        <button className="primary-btn save-settings-btn" onClick={saveSettings}>
          Save Settings
        </button>
      </div>
    </div>
  );
}

export default Settings;