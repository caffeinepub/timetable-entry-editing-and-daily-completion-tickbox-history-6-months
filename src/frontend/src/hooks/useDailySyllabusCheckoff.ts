import { useState, useEffect } from 'react';

export function useDailySyllabusCheckoff() {
  const [checkoffCount, setCheckoffCount] = useState(0);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const storageKey = `syllabusCheckoff_${today}`;
    const stored = localStorage.getItem(storageKey);
    setCheckoffCount(stored ? parseInt(stored, 10) : 0);

    // Poll for changes every second
    const interval = setInterval(() => {
      const current = localStorage.getItem(storageKey);
      const currentCount = current ? parseInt(current, 10) : 0;
      setCheckoffCount(currentCount);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return checkoffCount;
}
