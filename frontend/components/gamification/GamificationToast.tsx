import React, { useState, useEffect } from 'react';

interface Toast {
  id: number;
  message: string;
}

const GamificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Simulate incoming toast notifications every 10 seconds
    const interval = setInterval(() => {
      const newToast: Toast = {
        id: Date.now(),
        message: `Achievement unlocked at ${new Date().toLocaleTimeString()}!`,
      };
      setToasts(prev => [...prev, newToast]);
      // Remove toast after 5 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== newToast.id));
      }, 5000);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="bg-purple-600 text-white px-4 py-2 rounded shadow transition-opacity duration-500"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default GamificationToast;
