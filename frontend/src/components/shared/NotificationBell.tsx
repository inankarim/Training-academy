import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import {
  listNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
} from '../../services/notifications.service';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const NotificationBell: React.FC<{ notificationsPath: string }> = ({ notificationsPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadCountApi,
    refetchInterval: 30_000,
  });

  const { data: list } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => listNotificationsApi(1, 5),
    enabled: isOpen,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleItemClick(id: string, isRead: boolean) {
    if (!isRead) {
      await markNotificationReadApi(id);
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    }
  }

  async function handleDelete(id: string) {
    await deleteNotificationApi(id);
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadApi();
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-status-danger px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-lg border border-surface-border bg-surface-card shadow-card">
          <div className="flex items-center justify-between border-b border-surface-border px-3 py-2.5">
            <p className="text-xs font-bold text-ink">Notifications</p>
            <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-accent hover:text-accent-hover">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!list || list.items.length === 0 ? (
              <p className="p-4 text-center text-[11px] text-ink-muted">No notifications yet.</p>
            ) : (
              list.items.map((n) => (
                <div
                  key={n.id}
                  className="group flex items-start gap-2 border-b border-surface-border px-3 py-2.5 last:border-0 hover:bg-surface/60"
                >
                  <button
                    onClick={() => handleItemClick(n.id, n.isRead)}
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  >
                    <span
                      className={clsx('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-accent')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{n.title}</p>
                      <p className="line-clamp-2 text-[11px] text-ink-muted">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-ink-faint">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    title="Remove"
                    className="shrink-0 rounded p-1 text-ink-faint hover:bg-status-dangerSubtle hover:text-status-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              navigate(notificationsPath);
            }}
            className="w-full border-t border-surface-border py-2 text-center text-[11px] font-semibold text-accent hover:text-accent-hover"
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
};
