import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicator: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  isHighContrast: boolean;
  isLargeText: boolean;
  isReducedMotion: boolean;
  isScreenReader: boolean;
  isKeyboardNavigation: boolean;
  isFocusIndicator: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReader: false,
  keyboardNavigation: false,
  focusIndicator: true
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // โหลดการตั้งค่าจาก localStorage
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  // บันทึกการตั้งค่าเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings]);

  // ใช้การตั้งค่าทันทีเมื่อ component mount
  useEffect(() => {
    applyAccessibilitySettings(settings);
  }, []);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const applyAccessibilitySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High Contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large Text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced Motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Focus Indicator
    if (settings.focusIndicator) {
      root.classList.add('focus-indicator');
    } else {
      root.classList.remove('focus-indicator');
    }

    // Keyboard Navigation
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  };

  const value: AccessibilityContextType = {
    settings,
    updateSettings,
    isHighContrast: settings.highContrast,
    isLargeText: settings.largeText,
    isReducedMotion: settings.reducedMotion,
    isScreenReader: settings.screenReader,
    isKeyboardNavigation: settings.keyboardNavigation,
    isFocusIndicator: settings.focusIndicator
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Component สำหรับ Accessibility Toggle
export const AccessibilityToggle: React.FC = () => {
  const { settings, updateSettings } = useAccessibility();

  return (
    <div className="accessibility-toggle">
      <h3>การตั้งค่าการเข้าถึง</h3>
      <div className="toggle-options">
        <label>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => updateSettings({ highContrast: e.target.checked })}
          />
          ความคมชัดสูง
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.largeText}
            onChange={(e) => updateSettings({ largeText: e.target.checked })}
          />
          ตัวอักษรใหญ่
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
          />
          ลดการเคลื่อนไหว
        </label>
        
        <label>
          <input
            type="checkbox"
            checked={settings.focusIndicator}
            onChange={(e) => updateSettings({ focusIndicator: e.target.checked })}
          />
          แสดงตัวชี้โฟกัส
        </label>
      </div>
    </div>
  );
};

// Component สำหรับ Keyboard Navigation
export const KeyboardNavigation: React.FC = () => {
  const { isKeyboardNavigation } = useAccessibility();

  useEffect(() => {
    if (!isKeyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      
      // Skip to main content
      if (event.key === 'Tab' && event.altKey) {
        event.preventDefault();
        const mainContent = document.querySelector('main');
        if (mainContent) {
          (mainContent as HTMLElement).focus();
        }
      }

      // Navigate between sections
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const currentIndex = Array.from(focusableElements).findIndex(el => el === target);
        
        if (currentIndex !== -1) {
          const nextIndex = event.key === 'ArrowDown' 
            ? (currentIndex + 1) % focusableElements.length
            : (currentIndex - 1 + focusableElements.length) % focusableElements.length;
          
          (focusableElements[nextIndex] as HTMLElement)?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isKeyboardNavigation]);

  return null;
};

// Component สำหรับ Screen Reader Announcements
export const ScreenReaderAnnouncement: React.FC<{ message: string }> = ({ message }) => {
  const { isScreenReader } = useAccessibility();

  if (!isScreenReader) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    >
      {message}
    </div>
  );
};

// Hook สำหรับประกาศข้อความให้ screen reader
export const useScreenReader = () => {
  const { isScreenReader } = useAccessibility();

  const announce = (message: string) => {
    if (!isScreenReader) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);
    
    // ลบหลังจากประกาศแล้ว
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
};

// CSS สำหรับ accessibility features
export const accessibilityStyles = `
  /* High Contrast Mode */
  .high-contrast {
    --background: #000000;
    --foreground: #ffffff;
    --primary: #ffff00;
    --primary-foreground: #000000;
    --secondary: #ffffff;
    --secondary-foreground: #000000;
    --muted: #333333;
    --muted-foreground: #cccccc;
    --accent: #ffff00;
    --accent-foreground: #000000;
    --destructive: #ff0000;
    --destructive-foreground: #ffffff;
    --border: #ffffff;
    --input: #ffffff;
    --ring: #ffff00;
  }

  /* Large Text Mode */
  .large-text {
    font-size: 1.2em;
  }

  .large-text h1 { font-size: 2.5em; }
  .large-text h2 { font-size: 2em; }
  .large-text h3 { font-size: 1.75em; }
  .large-text p { font-size: 1.2em; }
  .large-text button { font-size: 1.2em; padding: 0.75em 1.5em; }
  .large-text input { font-size: 1.2em; padding: 0.75em; }

  /* Reduced Motion */
  .reduced-motion *,
  .reduced-motion *::before,
  .reduced-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Focus Indicator */
  .focus-indicator *:focus {
    outline: 3px solid #ffff00 !important;
    outline-offset: 2px !important;
  }

  /* Keyboard Navigation */
  .keyboard-navigation *:focus {
    outline: 3px solid #ffff00 !important;
    outline-offset: 2px !important;
  }

  /* Screen Reader Only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`; 