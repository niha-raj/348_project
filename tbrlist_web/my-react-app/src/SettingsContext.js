import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context
const SettingsContext = createContext();

// Create a provider component
export const SettingProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    theme: 'light',
    cardLayout: 'grid',
    showPriority: true,
    defaultSort: 'priority',
    notifications: true,
    autoBackup: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings on initial load
  useEffect(() => {
    fetchSettings();
    
    // Apply theme from localStorage if available (for immediate theme on load)
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      applyTheme(savedTheme);
    }
  }, []);

  // Update body class when theme changes
  useEffect(() => {
    applyTheme(settings.theme);
    
    // Save to localStorage for immediate theme on next load
    localStorage.setItem('app-theme', settings.theme);
  }, [settings.theme]);

  const applyTheme = (theme) => {
    // Remove any existing theme classes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
    // Add the selected theme class
    document.body.classList.add(`theme-${theme}`);
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/api/settings');
      const data = await response.json();
      
      if (response.ok) {
        setSettings({
          theme: data.theme || 'light',
          cardLayout: data.card_layout || 'grid',
          showPriority: Boolean(data.show_priority),
          defaultSort: data.default_sort || 'priority',
          notifications: Boolean(data.notifications),
          autoBackup: Boolean(data.auto_backup)
        });
      } else {
        console.error('Error fetching settings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    // Update local state immediately for responsive UI
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
    
    // Save to server
    try {
      const response = await fetch('http://localhost:5001/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          theme: newSettings.theme !== undefined ? newSettings.theme : settings.theme,
          card_layout: newSettings.cardLayout !== undefined ? newSettings.cardLayout : settings.cardLayout,
          show_priority: newSettings.showPriority !== undefined ? newSettings.showPriority : settings.showPriority,
          default_sort: newSettings.defaultSort !== undefined ? newSettings.defaultSort : settings.defaultSort,
          notifications: newSettings.notifications !== undefined ? newSettings.notifications : settings.notifications,
          auto_backup: newSettings.autoBackup !== undefined ? newSettings.autoBackup : settings.autoBackup
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Error saving settings:', data.error);
        // Could revert changes here if needed
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Could revert changes here if needed
    }
  };

  const value = {
    settings,
    isLoading,
    updateSettings,
    fetchSettings
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

// Custom hook to use the context
export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};