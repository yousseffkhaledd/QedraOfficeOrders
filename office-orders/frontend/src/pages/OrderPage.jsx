import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { mine } from '../mine';
import { describeExtras, money } from '../format';
import ItemDialog from '../components/ItemDialog.jsx';

// Two cart lines are "the same" if item, option, extras and notes all match
const lineKey = (menuItemId, variantId, extras, notes) =>
    [menuItemId, variantId || '', extras.map((e) => e.id).sort().join(','), (notes || '').toLowerCase()].join('|');

// "17 EGP", or "17 / 37 EGP" for items with options
const priceLabel = (item) => {
  if (!item.variants) return money(item.price);
  const prices = [...new Set(item.variants.map((v) => v.price))];
  return prices.length === 1 ? money(prices[0]) : `${prices.join(' / ')} EGP`;
};

const unitWithExtras = (l) => l.unitPrice + l.extras.reduce((s, e) => s + e.price, 0);
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const round2 = (n) => Math.round(n * 100) / 100;

// Server order line -> cart line
const fromServer = (l) => {
  const extras = l.extras.map((e) => ({ id: e.extraId, name: e.name, price: e.price }));
  return { key: lineKey(l.menuItemId, l.variantId, extras, l.notes), menuItemId: l.menuItemId, name: l.name,
    variantId: l.variantId, variantName: l.variantName, unitPrice: l.unitPrice, qty: l.qty, extras, notes: l.notes || '' };
};

export default function OrderPage({ group, menu, onChange }) {
  const isOpen = group.status === 'open';

  // Orders made from this browser in this group (one per person you ordered for)
  const [mineList, setMineList] = useState(() => mine.list(group.id));
  const myOrders = mineList.map((m) => group.orders.find((o) => o.id === m.orderId)).filter(Boolean);
  const findMine = (n) => myOrders.find((o) => sameName(o.personName, n));

  // If this browser already ordered here under its last-used name, reopen that order.
  // Otherwise start with an empty name: never pre-fill someone's name on a new order.
  const [initial] = useState(() => {
    const saved = mine.getName();
    const match = saved && findMine(saved);
    return match
        ? { activeId: match.id, name: match.personName, cart: match.lines.map(fromServer) }
        : { activeId: null, name: '', cart: [] };
  });

  const [activeId, setActiveId] = useState(initial.activeId); // null = a new person's order
  const [name, setName] = useState(initial.name);
  const [cart, setCart] = useState(initial.cart);
  const [dirty, setDirty] = useState(false); // cart changed since last save/load
  const [dialogItem, setDialogItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const active = myOrders.find((o) => o.id === activeId) ?? null;

  // Menu grouped by category, filtered by the search box (English or Arabic)
  const categories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map();
    for (const item of menu) {
      if (q && !item.name.toLowerCase().includes(q) && !(item.nameAr ?? '').includes(q)) continue;
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return [...map.entries()];
  }, [menu, search]);

  const catId = (c) => `cat-${c.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const jumpTo = (c) => document.getElementById(catId(c))?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Highlight the section you're currently scrolled to in the category bar
  const [currentCat, setCurrentCat] = useState(null);
  useEffect(() => {
    const onScroll = () => {
      let cur = categories[0]?.[0] ?? null;
      for (const [c] of categories) {
        const el = document.getElementById(catId(c));
        if (el && el.getBoundingClientRect().top < 90) cur = c;
      }
      setCurrentCat(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [categories]);

  // Same math as the server: food + VAT on food + equal share of delivery
  const subtotal = cart.reduce((s, l) => s + unitWithExtras(l) * l.qty, 0);
  const vat = round2(subtotal * group.vatRate);
  const peopleAfter = group.totals.people + (active ? 0 : cart.length ? 1 : 0);
  const deliveryShare = cart.length && peopleAfter ? round2(group.deliveryFee / peopleAfter) : 0;
  const toPay = round2(subtotal + vat + deliveryShare);
  const vatPct = Math.round(group.vatRate * 100);
  const others = group.orders.filter((o) => !myOrders.some((m) => m.id === o.id));
  const itemCount = cart.reduce((n, l) => n + l.qty, 0);
  // The buyer doesn't pay himself: his own order just shows his share
  const isBuyer = !!name.trim() && sameName(name, group.buyerName);

  const okToLeave = () =>
      !dirty || !cart.length || window.confirm('You have changes that aren’t saved. Discard them?');

  /** Switch the ticket to one of my existing orders, or to a new person (null). */
  function switchTo(order, { keepName = false, message = '' } = {}) {
    setActiveId(order ? order.id : null);
    if (!keepName) setName(order ? order.personName : '');
    setCart(order ? order.lines.map(fromServer) : []);
    setDirty(false);
    setError('');
    setNotice(message);
  }

  /** Runs when the name box loses focus. Changing the name never renames an order:
   *  it opens your order for that name, or starts a new order for a new person. */
  function commitName() {
    const n = name.trim();
    if (!n) return;
    const match = findMine(n);

    if (match && match.id !== activeId) {
      if (!okToLeave()) return setName(active ? active.personName : '');
      switchTo(match, { message: `Editing ${match.personName}’s order.` });
    } else if (!match && active) {
      if (!okToLeave()) return setName(active.personName);
      switchTo(null, { keepName: true, message: `New order for ${n}. ${active.personName}’s order is still saved.` });
    }
  }

  function change(next) {
    setCart(next);
    setDirty(true);
    setNotice('');
  }

  function addToCart({ item, variant, extras, qty, notes }) {
    const key = lineKey(item.id, variant?.id, extras, notes);
    const existing = cart.find((l) => l.key === key);
    change(existing
        ? cart.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + qty) } : l))
        : [...cart, { key, menuItemId: item.id, name: item.name, variantId: variant?.id, variantName: variant?.name,
          unitPrice: variant ? variant.price : item.price, qty, extras, notes }]);
    setDialogItem(null);
  }

  const setQty = (key, qty) =>
      change(qty <= 0 ? cart.filter((l) => l.key !== key) : cart.map((l) => (l.key === key ? { ...l, qty } : l)));

  async function send() {
    const personName = name.trim();
    if (!personName) return setError('Type a name first so the buyer knows whose food this is.');
    if (!cart.length) return setError('Add at least one item from the menu.');

    const body = {
      personName,
      lines: cart.map((l) => ({ menuItemId: l.menuItemId, variantId: l.variantId, qty: l.qty,
        extraIds: l.extras.map((e) => e.id), notes: l.notes || undefined })),
    };
    setBusy(true);
    setError('');
    try {
      mine.setName(personName);
      if (active) {
        const token = mine.tokenFor(group.id, active.id);
        onChange(await api.updateOrder(group.id, active.id, token, body));
        setNotice(`${personName}’s order updated.`);
      } else {
        const res = await api.submitOrder(group.id, body);
        mine.add(group.id, res.orderId, res.editToken);
        setMineList(mine.list(group.id));
        setActiveId(res.orderId);
        onChange(res.group);
        setNotice(`Order sent for ${personName}. To order for someone else, choose “New person”.`);
      }
      setDirty(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeActive() {
    if (!window.confirm(`Remove ${active.personName}’s order?`)) return;
    setBusy(true);
    try {
      onChange(await api.deleteOrder(group.id, active.id, mine.tokenFor(group.id, active.id)));
      mine.remove(group.id, active.id);
      setMineList(mine.list(group.id));
      switchTo(null, { message: `${active.personName}’s order was removed.` });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const duplicateName = !active && name.trim() && others.some((o) => sameName(o.personName, name));

  return (
      <div className="order-layout">
        <section className="menu" aria-label="Menu">
          {!isOpen && (
              <p className="banner">
                {group.autoClosed ? 'This group order closed automatically at midnight.' : 'This group order is closed.'}{' '}
                Go back to all group orders to join an open one.
              </p>
          )}

          {myOrders.length > 0 && isOpen && (
              <div className="mine-bar" role="group" aria-label="Orders you added">
                <span className="mine-label">Your orders here</span>
                {myOrders.map((o) => (
                    <button key={o.id} className="chip" aria-pressed={o.id === activeId}
                            onClick={() => o.id !== activeId && okToLeave() && switchTo(o)}>
                      {o.personName} <small>{money(o.total)}</small>
                    </button>
                ))}
                <button className="chip chip-new" aria-pressed={activeId === null}
                        onClick={() => activeId !== null && okToLeave() && switchTo(null)}>
                  + New person
                </button>
              </div>
          )}

          <div className="order-head">
            <label className="name-field">
              <span>{active ? 'Name' : 'Who is this order for?'}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} onBlur={commitName}
                     onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                     placeholder="e.g. Youssef" maxLength={40} disabled={!isOpen} autoComplete="off" />
            </label>
            <label className="menu-search">
              <span>Search the menu</span>
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. foul, كبدة" />
            </label>
          </div>
          {active && isOpen && (
              <p className="fine">Editing {active.personName}’s order. Type a different name to add an order for someone else.</p>
          )}
          {duplicateName && <p className="hint">Someone called {name.trim()} has already ordered. Add a last initial so the buyer can tell you apart.</p>}

          <p className="fine vat-note">
            Prices are before {vatPct}% VAT.{' '}
            {group.delivery
                ? `Delivery is ${money(group.deliveryFee)}, split equally between everyone who orders.`
                : 'No delivery fee on this order.'}
          </p>

          {categories.length > 1 && (
              <nav className="cat-nav" aria-label="Menu sections">
                {categories.map(([category]) => (
                    <button key={category} type="button" aria-current={category === currentCat ? 'true' : undefined}
                            onClick={() => jumpTo(category)}>{category}</button>
                ))}
              </nav>
          )}

          {menu.length > 0 && categories.length === 0 && (
              <p className="menu-empty">Nothing on the menu matches “{search.trim()}”.</p>
          )}

          {categories.map(([category, items]) => (
              <div key={category} id={catId(category)} className="menu-cat">
                <h2>{category} <small>{items.length}</small></h2>
                <ul className="menu-grid">
                  {items.map((item) => (
                      <li key={item.id}>
                        <button className="menu-item" onClick={() => setDialogItem(item)} disabled={!isOpen}>
                    <span className="mi-text">
                      <span className="mi-name">{item.name}</span>
                      <span className="mi-sub">
                        <span className="mi-price">{priceLabel(item)}</span>
                        {item.nameAr && <span className="mi-ar" lang="ar" dir="rtl">{item.nameAr}</span>}
                      </span>
                    </span>
                          <span className="mi-add" aria-hidden="true">+</span>
                        </button>
                      </li>
                  ))}
                </ul>
              </div>
          ))}
        </section>

        <aside className="side">
          <div className="ticket">
            <div className="ticket-head">
              <h2 className="ticket-title">{name.trim() ? `${name.trim()}’s order` : 'New order'}</h2>
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
            {cart.length === 0 ? (
                <p className="muted ticket-empty">Pick something from the menu to start.</p>
            ) : (
                <ul className="ticket-lines">
                  {cart.map((l) => (
                      <li key={l.key}>
                        <div className="tl-main">
                          <span className="tl-name">{l.name}</span>
                          <span className="tl-price">{money(unitWithExtras(l) * l.qty)}</span>
                        </div>
                        {(l.variantName || l.extras.length > 0 || l.notes) && (
                            <p className="tl-sub">
                              {[l.variantName, describeExtras(l.extras.map((e) => e.name)), l.notes && `“${l.notes}”`].filter(Boolean).join(' / ')}
                            </p>
                        )}
                        {isOpen && (
                            <div className="stepper stepper-sm">
                              <button onClick={() => setQty(l.key, l.qty - 1)} aria-label={`One less ${l.name}`}>−</button>
                              <span>{l.qty}</span>
                              <button onClick={() => setQty(l.key, Math.min(20, l.qty + 1))} aria-label={`One more ${l.name}`}>+</button>
                            </div>
                        )}
                      </li>
                  ))}
                </ul>
            )}

            <dl className="ticket-sum">
              <div><dt>Food</dt><dd>{money(subtotal)}</dd></div>
              <div><dt>VAT {vatPct}%</dt><dd>{money(vat)}</dd></div>
              {group.delivery && (
                  <div><dt>Share of delivery</dt><dd>{money(deliveryShare)}</dd></div>
              )}
              <div className="ticket-total"><dt>{isBuyer ? 'Your share' : `To pay ${group.buyerName}`}</dt><dd>{money(toPay)}</dd></div>
            </dl>
            {group.delivery && <p className="fine">VAT is on food only. Your delivery share drops as more people order.</p>}

            {error && <p className="error" role="alert">{error}</p>}
            {notice && <p className="ok" role="status">{notice}</p>}

            {isOpen && (
                <div className="ticket-actions">
                  <button className="btn btn-primary" onClick={send} disabled={busy || (active && !dirty)}>
                    {busy ? 'Saving…' : active ? (dirty ? 'Save changes' : 'Order saved') : 'Send order'}
                  </button>
                  {active && <button className="btn btn-danger" onClick={removeActive} disabled={busy}>Remove {active.personName}’s order</button>}
                </div>
            )}
          </div>

          {others.length > 0 && (
              <p className="others">Also in this order: {others.map((o) => o.personName).join(', ')}</p>
          )}
        </aside>

        {dialogItem && <ItemDialog item={dialogItem} onAdd={addToCart} onClose={() => setDialogItem(null)} />}
      </div>
  );
}