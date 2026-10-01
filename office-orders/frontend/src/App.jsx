import { useEffect, useState } from 'react';
import { api } from './api';
import { usePolling } from './usePolling';
import HomePage from './pages/HomePage.jsx';
import OrderPage from './pages/OrderPage.jsx';
import SummaryPage from './pages/SummaryPage.jsx';

// #/                 -> home (all group orders)
// #/g/<id>           -> add an order to that group order
// #/g/<id>/summary   -> everyone's orders + who pays what (owner only)
function parseHash() {
    const m = window.location.hash.match(/^#\/g\/([^/]+)(\/summary)?$/);
    if (!m) return { page: 'home' };
    return { page: m[2] ? 'summary' : 'order', id: m[1] };
}

function useHashRoute() {
    const [route, setRoute] = useState(parseHash);
    useEffect(() => {
        const on = () => {
            setRoute(parseHash());
            window.scrollTo(0, 0);
        };
        window.addEventListener('hashchange', on);
        return () => window.removeEventListener('hashchange', on);
    }, []);
    return route;
}

/** "8 h 49 min" until 12:00 AM tonight, refreshed every 30 seconds */
function useUntilMidnight() {
    const calc = () => {
        const end = new Date();
        end.setHours(24, 0, 0, 0);
        const mins = Math.max(0, Math.round((end - new Date()) / 60000));
        const h = Math.floor(mins / 60);
        return h ? `${h} h ${mins % 60} min` : `${mins} min`;
    };
    const [left, setLeft] = useState(calc);
    useEffect(() => {
        const t = setInterval(() => setLeft(calc()), 30000);
        return () => clearInterval(t);
    }, []);
    return left;
}

function HomeHero() {
    const left = useUntilMidnight();
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    return (
        <div className="hero">
            <h1>Orders for {today}</h1>
            <p>Pick a group order to add your food, or start one for your team.</p>
        </div>
    );
}

function Topbar({ group, page, children }) {
    return (
        <header className="band">
            <div className="band-inner">
                <div className="topbar">
                    <a className="brand" href="#/" aria-label="Youssef x Qedra, home">
                        <img className="brand-logo" src="/brand-logo-dark.svg" alt="Youssef x Qedra" />
                        <p className="brand-tagline">Group food orders, split fairly</p>
                    </a>
                    {group && (
                        <p className="group-chip">
                            <span className="group-chip-title">{group.title}</span>
                            <span className={`status status-${group.status}`}>{group.status === 'open' ? 'Open' : 'Closed'}</span>
                        </p>
                    )}
                    {group && (
                        <nav className="tabs" aria-label="Pages">
                            <a href="#/">All groups</a>
                            <a href={`#/g/${group.id}`} aria-current={page === 'order' ? 'page' : undefined}>Add order</a>
                            {group.isOwner && (
                                <a href={`#/g/${group.id}/summary`} aria-current={page === 'summary' ? 'page' : undefined}>
                                    Summary <span className="count">{group.totals.people}</span>
                                </a>
                            )}
                        </nav>
                    )}
                </div>
                {children}
            </div>
        </header>
    );
}

function GroupScreen({ id, page, menu, menuBanner }) {
    const { data: group, setData: setGroup, error } = usePolling(() => api.getGroupOrder(id), id);

    return (
        <>
            <Topbar group={group} page={page} />
            <div className="app">
                {menuBanner}
                {error && (
                    <p className="banner banner-error" role="alert">
                        {error} <a href="#/">Back to all group orders</a>
                    </p>
                )}
                <main>
                    {group === undefined && !error && <p className="muted center">Loading…</p>}
                    {group && page === 'order' && <OrderPage group={group} menu={menu} onChange={setGroup} />}
                    {group && page === 'summary' && group.isOwner && <SummaryPage group={group} onChange={setGroup} />}
                    {group && page === 'summary' && !group.isOwner && (
                        <div className="empty-summary">
                            <h1>Only {group.buyerName} can see this</h1>
                            <p className="muted">The summary is visible only on the computer that started this group order.</p>
                            <a className="btn btn-primary" href={`#/g/${group.id}`}>Add an order</a>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

export default function App() {
    const route = useHashRoute();
    const [menu, setMenu] = useState([]);
    const [menuError, setMenuError] = useState('');

    // Keep trying until the menu loads (e.g. backend still starting up)
    useEffect(() => {
        let stopped = false;
        let timer;
        const load = () =>
            api.getMenu()
                .then((m) => {
                    if (stopped) return;
                    setMenu(m);
                    setMenuError('');
                })
                .catch((e) => {
                    if (stopped) return;
                    setMenuError(e.message);
                    timer = setTimeout(load, 3000);
                });
        load();
        return () => {
            stopped = true;
            clearTimeout(timer);
        };
    }, []);

    const menuBanner = menuError && (
        <p className="banner banner-error" role="alert">The menu didn’t load ({menuError}). Trying again…</p>
    );

    return route.page === 'home' ? (
        <>
            <Topbar><HomeHero /></Topbar>
            <div className="app">
                {menuBanner}
                <main><HomePage /></main>
            </div>
        </>
    ) : (
        // key: switching groups starts the screen fresh
        <GroupScreen key={route.id} id={route.id} page={route.page} menu={menu} menuBanner={menuBanner} />
    );
}