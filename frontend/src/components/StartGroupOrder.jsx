import { useState } from 'react';
import { api } from '../api';

// Same format the server adds to the name, shown here as a preview
const today = () =>
    new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export default function StartGroupOrder({ onCreated }) {
  const [buyerName, setBuyerName] = useState('');
  const [title, setTitle] = useState('');
  const [delivery, setDelivery] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function start(e) {
    e.preventDefault();
    if (!buyerName.trim()) return setError('Say who is getting the order.');
    if (!title.trim()) return setError('Type a group name.');
    setBusy(true);
    setError('');
    try {
      const group = await api.createGroupOrder({ buyerName: buyerName.trim(), title: title.trim(), delivery });
      onCreated(group);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
      <form onSubmit={start} className="start-form">
        <div className="row-2">
          <label>
            Who’s getting the order?
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required maxLength={40}
                   placeholder="Your name" autoFocus />
          </label>
          <label>
            Group name
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={50}
                   placeholder="Group name" />
          </label>
        </div>
        <p className="fine">
          It will show as “{title.trim() || 'Group name'}, {today()}” and closes automatically at 12:00 AM tonight.
        </p>
        <label className="switch">
          <input type="checkbox" role="switch" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
          <span className="switch-track" aria-hidden="true" />
          <span>
          Delivery
          <small>{delivery ? '60 EGP, split between everyone' : 'Off: someone picks it up, no fee'}</small>
        </span>
        </label>
        <p className="fine">Only this computer will see who ordered what and the totals.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Starting…' : 'Start group order'}</button>
      </form>
  );
}