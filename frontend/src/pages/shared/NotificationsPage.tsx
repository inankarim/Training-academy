import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Bell, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  listNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  sendCustomMessageApi,
  deleteNotificationApi,
} from '../../services/notifications.service';
import { listUsersApi } from '../../services/users.service';
import clsx from 'clsx';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isComposing, setIsComposing] = useState(false);

  const canCompose = user?.role === 'admin' || user?.role === 'super_admin';

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page', page],
    queryFn: () => listNotificationsApi(page, 20),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Notifications</h1>
          <p className="mt-1 text-xs text-ink-muted">Course and assignment updates relevant to your role.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllReadMutation.mutate()}
            className="rounded border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:border-ink hover:text-ink"
          >
            Mark all read
          </button>
          {canCompose && (
            <button
              onClick={() => setIsComposing(true)}
              className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-accent-hover"
            >
              Compose Message
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-border bg-surface-card shadow-card">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-ink-muted">Loading notifications...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-ink-faint" />
            <h3 className="mt-3 text-sm font-bold text-ink">No notifications yet</h3>
          </div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {data.items.map((n) => (
              <li
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={clsx('cursor-pointer px-5 py-4 hover:bg-surface/50', !n.isRead && 'bg-accent/5')}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-ink">{n.title}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] text-ink-faint">{formatDateTime(n.createdAt)}</span>
                    <button
                      onClick={(e) => {
                        // The row itself marks-as-read on click; don't trigger that too.
                        e.stopPropagation();
                        deleteMutation.mutate(n.id);
                      }}
                      title="Remove"
                      className="rounded p-1 text-ink-faint hover:bg-status-dangerSubtle hover:text-status-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{n.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-surface-border px-3 py-1 text-xs disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-ink-muted">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-surface-border px-3 py-1 text-xs disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {isComposing && <ComposeMessageModal onClose={() => setIsComposing(false)} />}
    </div>
  );
};

const ComposeMessageModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);

  const { data: learners } = useQuery({
    queryKey: ['learners-for-compose'],
    queryFn: () => listUsersApi({ role: 'learner', status: 'active', pageSize: 100 }),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      sendCustomMessageApi({
        title,
        message,
        targetLearnerIds: sendToAll ? 'all' : selectedLearnerIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      onClose();
    },
  });

  function toggleLearner(id: string) {
    setSelectedLearnerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-charcoal/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-surface-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Compose Message</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded border border-surface-border bg-surface px-3 py-2 text-xs text-ink"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            rows={4}
            className="w-full rounded border border-surface-border bg-surface px-3 py-2 text-xs text-ink"
          />

          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" checked={sendToAll} onChange={(e) => setSendToAll(e.target.checked)} />
            Send to all learners
          </label>

          {!sendToAll && (
            <div className="max-h-40 overflow-y-auto rounded border border-surface-border p-2">
              {(learners?.items ?? []).map((l) => (
                <label key={l.id} className="flex items-center gap-2 py-1 text-xs text-ink">
                  <input
                    type="checkbox"
                    checked={selectedLearnerIds.includes(l.id)}
                    onChange={() => toggleLearner(l.id)}
                  />
                  {l.fullName} <span className="text-ink-faint">({l.email})</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded border border-surface-border px-3 py-1.5 text-xs text-ink-muted">
            Cancel
          </button>
          <button
            disabled={!title.trim() || !message.trim() || (!sendToAll && selectedLearnerIds.length === 0) || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
            className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};
