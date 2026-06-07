import { useState, useCallback } from 'react';

export default function useNotification() {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((message, type = 'info', duration = 2500) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  }, []);

  return { notification, notify };
}
