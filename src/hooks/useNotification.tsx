import { useState, useCallback } from 'react';
import { Notification } from '../components/Notification';

interface NotificationState {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  id: number;
}

let notificationId = 0;

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  const showNotification = useCallback((
    message: string,
    type: 'error' | 'warning' | 'info' | 'success' = 'info'
  ) => {
    const id = ++notificationId;
    setNotifications((prev) => [...prev, { message, type, id }]);
    return id;
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const NotificationContainer = () => (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {notifications.map((notification, index) => (
        <div key={notification.id} style={{ marginTop: `${index * 0.5}rem` }}>
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
            duration={notification.type === 'error' || notification.type === 'warning' ? 8000 : 5000}
          />
        </div>
      ))}
    </div>
  );

  return { showNotification, NotificationContainer };
}

