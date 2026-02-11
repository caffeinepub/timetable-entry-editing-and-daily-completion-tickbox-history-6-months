import { useState, useEffect } from 'react';
import { useInternetIdentity } from './useInternetIdentity';

export interface AppBackground {
  type: 'default' | 'gradient' | 'color' | 'image';
  value: string;
}

const DEFAULT_BACKGROUND: AppBackground = {
  type: 'default',
  value: '',
};

export function useAppBackground() {
  const { identity } = useInternetIdentity();
  const [background, setBackground] = useState<AppBackground>(DEFAULT_BACKGROUND);

  const getStorageKey = () => {
    if (!identity) return null;
    return `app_background_${identity.getPrincipal().toString()}`;
  };

  // Load background from localStorage on mount or identity change
  useEffect(() => {
    const key = getStorageKey();
    if (!key) {
      setBackground(DEFAULT_BACKGROUND);
      return;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setBackground(JSON.parse(stored));
      } else {
        setBackground(DEFAULT_BACKGROUND);
      }
    } catch (error) {
      console.error('Failed to load app background:', error);
      setBackground(DEFAULT_BACKGROUND);
    }
  }, [identity]);

  const updateBackground = (newBackground: AppBackground) => {
    const key = getStorageKey();
    if (!key) return;

    try {
      localStorage.setItem(key, JSON.stringify(newBackground));
      setBackground(newBackground);
    } catch (error) {
      console.error('Failed to save app background:', error);
    }
  };

  const setGradient = (gradient: string) => {
    updateBackground({ type: 'gradient', value: gradient });
  };

  const setColor = (color: string) => {
    updateBackground({ type: 'color', value: color });
  };

  const setImage = (imageUrl: string) => {
    updateBackground({ type: 'image', value: imageUrl });
  };

  const resetToDefault = () => {
    updateBackground(DEFAULT_BACKGROUND);
  };

  return {
    background,
    setGradient,
    setColor,
    setImage,
    resetToDefault,
  };
}
