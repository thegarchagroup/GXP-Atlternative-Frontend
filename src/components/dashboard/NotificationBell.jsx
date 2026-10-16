import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { dashboardService } from '../../services/dashboardService';
import { POLL_INTERVAL_MS } from '../../utils/constants';
import { timeAgo } from '../../utils/dateHelpers';

function linkFor(n, dept) {
  if (dept === 'FRONT_DESK' && n.ticket_id) return `/frontdesk/tickets/${n.ticket_id}`;
  if (dept === 'HOUSEKEEPING' && n.ticket_id) return `/housekeeping/tickets/${n.ticket_id}`;
  if (dept === 'ENGINEERING' && n.repair_id) return `/engineering/repairs/${n.repair_id}`;
  return null;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [seenId, setSeenId] = useState(null);
  const ref = useRef(null);
  const { data } = useApi(() => dashboardService.notifications(), [], { interval: POLL_INTERVAL_MS });
  const items = data || [];

  useEffect(() => {
    if (seenId === null && data) setSeenId(data[0]?.id ?? 0); // don't flag history on first load
  }, [data, seenId]);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const unread = seenId === null ? 0 : items.filter((n) => n.id > seenId).length;
  const toggle = () => {
    setOpen((o) => !o);
    if (items[0]) setSeenId(items[0].id);
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={toggle} className="relative rounded p-2 text-gray-600 hover:bg-gray-100"
        aria-label={unread ? `${unread} new updates` : 'Updates'} aria-expanded={open}>
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brass px-1 text-[10px] font-semibold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-mist bg-white shadow-lg">
          <p className="border-b border-mist px-4 py-2.5 text-sm font-semibold">Recent updates</p>
          <ul className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500">No updates yet.</li>}
            {items.map((n) => {
              const to = linkFor(n, user?.department);
              const body = (
                <>
                  <p className="text-sm">{n.message}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{n.actor?.display_name || 'System'} | {timeAgo(n.created_at)}</p>
                </>
              );
              return (
                <li key={n.id}>
                  {to ? <Link to={to} onClick={() => setOpen(false)} className="block px-4 py-2.5 hover:bg-harbor-50">{body}</Link>
                    : <div className="px-4 py-2.5">{body}</div>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
