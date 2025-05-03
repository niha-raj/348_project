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
    
    // Listen for settings update events from other components
    window.addEventListener('settingsUpdated', handleSettingsUpdateEvent);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdateEvent);
    };
  }, []);

  // Handle settings update events from other components (like the Settings page)
  const handleSettingsUpdateEvent = (event) => {
    console.log('SettingsContext: Received settingsUpdated event', event.detail);
    // Trigger a refresh of settings from server
    fetchSettings();
  };

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
      const response = await fetch('http://localhost:5002/api/settings');
      const data = await response.json();
      
      if (response.ok) {
        console.log('SettingsContext: Fetched settings from server:', data);
        
        // Be more careful with boolean conversions - use explicit checks
        setSettings({
          theme: data.theme || 'light',
          cardLayout: data.card_layout || 'grid',
          // Use explicit undefined checks to handle falsy values properly
          showPriority: data.show_priority === undefined ? true : Boolean(data.show_priority),
          defaultSort: data.default_sort || 'priority',
          notifications: data.notifications === undefined ? true : Boolean(data.notifications),
          autoBackup: data.auto_backup === undefined ? false : Boolean(data.auto_backup)
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
    // Log what's being updated
    console.log('SettingsContext: Updating settings with:', newSettings);
    console.log('SettingsContext: Current settings before update:', settings);
    
    // Update local state immediately for responsive UI
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      console.log('SettingsContext: Settings after update:', updatedSettings);
      return updatedSettings;
    });
    
    // Save to server
    try {
      // Create a payload that matches the server's expected format
      const payload = {
        theme: newSettings.theme !== undefined ? newSettings.theme : settings.theme,
        card_layout: newSettings.cardLayout !== undefined ? newSettings.cardLayout : settings.cardLayout,
        show_priority: newSettings.showPriority !== undefined ? newSettings.showPriority : settings.showPriority,
        default_sort: newSettings.defaultSort !== undefined ? newSettings.defaultSort : settings.defaultSort,
        notifications: newSettings.notifications !== undefined ? newSettings.notifications : settings.notifications,
        auto_backup: newSettings.autoBackup !== undefined ? newSettings.autoBackup : settings.autoBackup
      };
      
      console.log('SettingsContext: Sending settings to server:', payload);
      
      const response = await fetch('http://localhost:5002/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('SettingsContext: Server settings updated successfully:', data);
        
        // Re-fetch settings from server to ensure consistency
        fetchSettings();
        
        // Dispatch an event for other components that might be using the settings
        const event = new CustomEvent('settingsUpdated', {
          detail: { ...settings, ...newSettings }
        });
        window.dispatchEvent(event);
      } else {
        console.error('Error saving settings:', data.error);
        // Revert changes by re-fetching
        fetchSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Revert changes by re-fetching
      fetchSettings();
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