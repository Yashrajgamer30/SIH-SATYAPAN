import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock, X } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  type: 'success' | 'warning' | 'info';
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'DigiLocker Verification Passed',
      description: 'Fire Safety NOC for Saraswati IT verified genuine with digital signature PKCS#7.',
      timestamp: '10 mins ago',
      unread: true,
      type: 'success'
    },
    {
      id: 'notif-2',
      title: 'Duplicate Faculty Registration Alert',
      description: 'Dr. Ramesh V. Kulkarni found active concurrently in another institute roster.',
      timestamp: '25 mins ago',
      unread: true,
      type: 'warning'
    },
    {
      id: 'notif-3',
      title: 'New EoA Application Submitted',
      description: 'Sahyadri College of Engineering submitted Extension of Approval dossier.',
      timestamp: '1 hour ago',
      unread: false,
      type: 'info'
    }
  ]);

  const menuRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-gov-muted hover:text-gov-text hover:bg-gov-subtle transition-colors cursor-pointer"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-saffron-500 rounded-full ring-2 ring-gov-surface" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gov-surface border border-gov-border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-gov-border flex items-center justify-between bg-gov-surface">
            <div className="flex items-center gap-2">
              <h4 className="text-14 font-bold text-gov-text">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-11 font-bold px-1.5 py-0.2 bg-navy-50 text-navy-700 rounded-full tabular-nums">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-12 text-navy-700 font-semibold hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gov-border/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-12 text-gov-muted">
                No recent notifications
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 transition-colors ${
                    item.unread ? 'bg-navy-50/40' : 'hover:bg-gov-subtle'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {item.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : item.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 overflow-hidden">
                      <p className={`text-12 ${item.unread ? 'font-bold text-gov-text' : 'font-medium text-gov-text'}`}>
                        {item.title}
                      </p>
                      <p className="text-11 text-gov-muted mt-0.5 leading-snug">
                        {item.description}
                      </p>
                      <span className="text-[10px] text-gov-muted mt-1 block font-mono">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
