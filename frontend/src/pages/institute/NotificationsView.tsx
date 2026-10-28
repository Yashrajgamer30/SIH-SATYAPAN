import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../context/authStore';
import {
  Bell, CheckCircle2, AlertTriangle, Info, ShieldCheck,
  Filter, Check, RefreshCw
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  level: 'WARNING' | 'INFO' | 'SUCCESS';
  is_read: boolean;
  created_at: string;
  category: string;
}

export const NotificationsView: React.FC = () => {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'WARNING'>('ALL');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:8000/institute/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const json = await resp.json();
        setNotifications(json.notifications);
      }
    } catch (e) {
      console.warn('Could not load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/institute/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'WARNING') return n.level === 'WARNING';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Header & Actions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-11 font-bold bg-saffron-50 dark:bg-saffron-950 text-saffron-600 dark:text-saffron-400 border border-saffron-200">
              {unreadCount} Unread Alerts
            </span>
          </div>
          <h1 className="text-22 font-bold text-navy-950 dark:text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-saffron-500" />
            <span>Statutory Compliance Notifications</span>
          </h1>
          <p className="text-12 text-gov-muted mt-1">
            Real-time regulatory alerts, SLA deadlines, and scrutiny updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-gov-text text-12 font-bold hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All as Read</span>
            </button>
          )}

          {/* Filter Dropdown */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 p-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-11 font-bold ${filter === 'ALL' ? 'bg-saffron-500 text-white' : 'text-gov-muted'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-3 py-1 rounded-lg text-11 font-bold ${filter === 'UNREAD' ? 'bg-saffron-500 text-white' : 'text-gov-muted'}`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('WARNING')}
              className={`px-3 py-1 rounded-lg text-11 font-bold ${filter === 'WARNING' ? 'bg-saffron-500 text-white' : 'text-gov-muted'}`}
            >
              Warnings
            </button>
          </div>
        </div>
      </div>

      {/* 2. Notifications List */}
      <div className="rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/80 shadow-xs divide-y divide-slate-100 dark:divide-navy-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gov-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-saffron-500 mb-2" />
            <span>Loading notifications...</span>
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-gov-muted">
            No notifications matching the selected filter.
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.is_read ? 'bg-saffron-50/30 dark:bg-navy-800/60' : 'hover:bg-slate-50/50 dark:hover:bg-navy-800/20'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  n.level === 'WARNING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                  n.level === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {n.level === 'WARNING' ? <AlertTriangle className="w-4 h-4" /> :
                   n.level === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> :
                   <Info className="w-4 h-4" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-13 text-navy-950 dark:text-white">
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-saffron-500" />
                    )}
                  </div>
                  <p className="text-12 text-gov-muted leading-relaxed">
                    {n.body}
                  </p>
                  <div className="text-[11px] text-gov-muted flex items-center gap-2">
                    <span className="font-mono">{n.created_at}</span>
                    <span>•</span>
                    <span className="font-bold uppercase tracking-wider">{n.category}</span>
                  </div>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-navy-700 hover:bg-slate-100 text-11 font-semibold text-gov-muted hover:text-navy-900 whitespace-nowrap"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
