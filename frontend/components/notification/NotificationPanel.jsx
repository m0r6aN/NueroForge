import React, { useState, useEffect } from 'react';
import './NotificationPanel.css';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Simulate fetching notifications (replace with real API call as needed)
    const fetchNotifications = async () => {
      const dummyNotifications = [
        { id: 1, message: "Welcome to NeuroForge! Ready for a quantum leap?" },
        { id: 2, message: "New quiz available: Test your neural prowess!" },
        { id: 3, message: "System update: UI enhancements deployed!" },
      ];
      setNotifications(dummyNotifications);
    };

    fetchNotifications();
  }, []);

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <div className={`notification-panel ${expanded ? 'expanded' : ''}`}>
      <div className="notification-header" onClick={toggleExpand}>
        <h2>Notifications</h2>
        <button className="toggle-button">{expanded ? 'Collapse' : 'Expand'}</button>
      </div>
      {expanded && (
        <ul className="notification-list">
          {notifications.map((note) => (
            <li key={note.id} className="notification-item">
              {note.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationPanel;
