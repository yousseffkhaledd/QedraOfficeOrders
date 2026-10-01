import { useState } from 'react';
import { api } from '../api';
import { money } from '../format';
import { mine } from '../mine';
import { usePolling } from '../usePolling';
import StartGroupOrder from '../components/StartGroupOrder.jsx';

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const initials = (name) =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// A stable soft colour per name, so the same person always gets the same avatar
const TONES = ['#d7ebe3', '#e4e1f5', '#f6e3cf', '#dde8f4', '#f3dde2', '#e6ecd3'];
const tone = (name) => TONES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length];

function Avatars({ names }) {
    const shown = names.slice(0, 5);
    return (
        <span className="avatars" aria-label={names.join(', ')}>
      {shown.map((n, i) => (
          <span key={i} className="avatar" style={{ background: tone(n) }} title={n}>{initials(n)}</span>
      ))}
            {names.length > shown.length && <span className="avatar avatar-more">+{names.length - shown.length}</span>}
    </span>
    );
}

function GroupRow({ g }) {
    const myCount = mine.list(g.id).length;
    const open = g.status === 'open';
    return (
        <li className={open ? 'group-row' : 'group-row group-row-closed'}>
            <div className="gr-main">
                <div className="gr-titleline">
                    <a className="gr-title" href={open ? `#/g/${g.id}` : `#/g/${g.id}/summary`}>{g.title}</a>
                    {g.isOwner && <span className="tag tag-yours">Yours</span>}
                </div>
                <span className="gr-meta">
          {g.isOwner ? 'You started this' : `${g.buyerName} is getting it`} at {time(g.createdAt)}
        </span>
                <div className="gr-people">
                    {g.people && g.people.length > 0 && <Avatars names={g.people} />}
                    <span>
            {g.peopleCount === 0 ? 'No orders yet' : count(g.peopleCount, 'person has', 'people have') + ' ordered'}
          </span>
                    {myCount > 0 && <span className="gr-mine">including {count(myCount, 'order', 'orders')} from you</span>}
                </div>
            </div>
            <div className="gr-side">
                {g.isOwner && (
                    <span className="gr-total">
            <small>Total</small>
                        {money(g.grandTotal)}
          </span>
                )}
                <div className="gr-actions">
                    {g.isOwner && <a className="btn btn-quiet gr-cta" href={`#/g/${g.id}/summary`}>Summary</a>}
                    {open && <a className="btn btn-primary gr-cta" href={`#/g/${g.id}`}>Add an order</a>}
                </div>
            </div>
        </li>
    );
}

export default function HomePage() {
    const { data: list, error } = usePolling(api.listGroupOrders, 'list');
    const [starting, setStarting] = useState(false);

    if (list === undefined) {
        return error ? <p className="banner banner-error" role="alert">{error}</p> : <p className="muted center">Loading…</p>;
    }

    const open = list.filter((g) => g.status === 'open');
    const closed = list.filter((g) => g.status === 'closed').slice(0, 5); // only yours are sent

    return (
        <div className="home">
            {error && <p className="banner banner-error" role="alert">{error}</p>}

            <div className="home-head">
                <h2>Open group orders <span className="count">{open.length}</span></h2>
                <button className={starting ? 'btn btn-quiet' : 'btn btn-primary'} onClick={() => setStarting((s) => !s)}>
                    {starting ? 'Cancel' : 'Start a group order'}
                </button>
            </div>

            {starting && (
                <div className="ticket start-card">
                    <h3 className="start-title">Start a group order</h3>
                    <StartGroupOrder onCreated={(g) => (window.location.hash = `#/g/${g.id}/summary`)} />
                </div>
            )}

            {open.length === 0 && !starting && (
                <div className="empty-home">
                    <p className="empty-home-title">Nobody is collecting orders right now.</p>
                    <p className="muted">Start a group order, then tell the office to open this page and pick it.</p>
                </div>
            )}

            <ul className="group-list">
                {open.map((g) => <GroupRow key={g.id} g={g} />)}
            </ul>

            {closed.length > 0 && (
                <>
                    <h2 className="closed-title">Your closed group orders</h2>
                    <ul className="group-list">
                        {closed.map((g) => <GroupRow key={g.id} g={g} />)}
                    </ul>
                </>
            )}
        </div>
    );
}