import { useEffect, useState } from 'react';
import { api } from '../api';
import { describeExtras, money } from '../format';

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const round2 = (n) => Math.round(n * 100) / 100;

function asText(group) {
  const lines = [group.title, ''];
  for (const r of group.restaurantOrder) {
    const extra = (r.variant ? ` (${r.variant})` : '') + (r.extras.length ? ` ${describeExtras(r.extras, ' ')}` : '');
    const note = r.notes ? ` (${r.notes})` : '';
    lines.push(`${r.qty}x ${r.name}${extra}${note}`);
  }
  lines.push('', `Food: ${money(group.totals.itemsTotal)}`, `VAT ${Math.round(group.vatRate * 100)}%: ${money(group.totals.vatTotal)}`,
      group.delivery ? `Delivery: ${money(group.totals.deliveryFee)}` : 'Pickup (no delivery)', `Total: ${money(group.totals.grandTotal)}`, '', 'Who pays:');
  for (const o of group.orders) {
    const tag = sameName(o.personName, group.buyerName) ? ' (buyer)' : o.paid ? ' (paid)' : '';
    lines.push(`${o.personName}: ${money(o.total)}${tag}`);
  }
  return lines.join('\n');
}

export default function SummaryPage({ group, onChange }) {
  const [buyer, setBuyer] = useState(group.buyerName ?? '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [openRow, setOpenRow] = useState(null);
  const isOpen = group.status === 'open';

  // Keep inputs in sync when someone else changes them (polling)
  useEffect(() => setBuyer(group.buyerName ?? ''), [group.buyerName]);

  const run = async (fn) => {
    setError('');
    try {
      onChange(await fn());
    } catch (e) {
      setError(e.message);
    }
  };

  const closeNow = () =>
      window.confirm('Close this group order? Nobody will be able to add or change orders.') &&
      run(() => api.closeGroupOrder(group.id));

  const setDelivery = (on) => run(() => api.updateGroupOrder(group.id, { delivery: on }));
  const saveBuyer = () => {
    if (!buyer.trim()) return setBuyer(group.buyerName); // required: can't be emptied
    if (buyer.trim() !== group.buyerName) run(() => api.updateGroupOrder(group.id, { buyerName: buyer.trim() }));
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(asText(group));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Couldn’t copy automatically. Select the order text and copy it by hand.');
    }
  }

  const { totals } = group;
  const vatPct = Math.round(group.vatRate * 100);

  // The buyer's own order isn't money to collect: he doesn't pay himself
  const isBuyer = (o) => sameName(o.personName, group.buyerName);
  const others = group.orders.filter((o) => !isBuyer(o));
  const toCollect = round2(others.reduce((s, o) => s + o.total, 0));
  const collected = round2(others.filter((o) => o.paid).reduce((s, o) => s + o.total, 0));
  const left = round2(toCollect - collected);

  if (group.orders.length === 0 && isOpen) {
    return (
        <div className="empty-summary">
          <h1>No orders yet</h1>
          <p className="muted">Tell the office to open this site and pick “{group.title}”. Orders appear here as people send them.</p>
          <a className="btn btn-primary" href={`#/g/${group.id}`}>Add an order</a>
        </div>
    );
  }

  return (
      <>
        {isOpen && (
            <div className="close-warning" role="note">
              <div>
                <strong>Close this group order before you place it with the restaurant.</strong>
                <p>If it stays open, someone can still add food after you’ve ordered, and it won’t be in what arrives.</p>
              </div>
              <button className="btn btn-dark" onClick={closeNow}>Close order now</button>
            </div>
        )}
        <div className="summary-layout">
          <section aria-labelledby="rest-title">
            <div className="ticket">
              <h2 id="rest-title" className="ticket-title">Order from the restaurant</h2>
              <p className="muted ticket-meta">{totals.items} {totals.items === 1 ? 'item' : 'items'} for {totals.people} {totals.people === 1 ? 'person' : 'people'}</p>
              <ul className="ticket-lines">
                {group.restaurantOrder.map((r, i) => (
                    <li key={i}>
                      <div className="tl-main">
                        <span className="tl-qty">{r.qty}×</span>
                        <span className="tl-name">{r.name}</span>
                      </div>
                      {(r.variant || r.extras.length > 0 || r.notes) && (
                          <p className="tl-sub tl-indent">
                            {[r.variant, describeExtras(r.extras), r.notes && `“${r.notes}”`].filter(Boolean).join(' / ')}
                          </p>
                      )}
                      <p className="tl-for tl-indent">
                        for {r.people.map((p) => (p.qty > 1 ? `${p.name} ×${p.qty}` : p.name)).join(', ')}
                      </p>
                    </li>
                ))}
              </ul>
              <dl className="ticket-sum">
                <div><dt>Food</dt><dd>{money(totals.itemsTotal)}</dd></div>
                <div><dt>VAT {vatPct}%</dt><dd>{money(totals.vatTotal)}</dd></div>
                {group.delivery && <div><dt>Delivery</dt><dd>{money(totals.deliveryFee)}</dd></div>}
                <div className="ticket-total"><dt>Total to pay the restaurant</dt><dd>{money(totals.grandTotal)}</dd></div>
              </dl>
              <button className="btn btn-quiet full" onClick={copy}>{copied ? 'Copied' : 'Copy order as text'}</button>
              {isOpen && <p className="fine">Close the order first, so this list can’t change after you send it.</p>}
            </div>
          </section>

          <section className="payers" aria-labelledby="pay-title">
            <div className="payers-head">
              <h2 id="pay-title">Who pays what</h2>
              <p className="collected">
                <strong>{money(collected)}</strong> collected, {money(left)} left
              </p>
            </div>
            <div className="progress" aria-hidden="true">
              <span style={{ width: `${toCollect ? (collected / toCollect) * 100 : 0}%` }} />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                <tr><th>Name</th><th className="num">Food</th><th className="num">VAT</th><th className="num">Delivery</th><th className="num">Total</th><th className="c">Paid</th></tr>
                </thead>
                <tbody>
                {group.orders.map((o) => (
                    <tr key={o.id} className={o.paid && !isBuyer(o) ? 'is-paid' : undefined}>
                      <td>
                        <button className="linkish" onClick={() => setOpenRow(openRow === o.id ? null : o.id)} aria-expanded={openRow === o.id}>
                          {o.personName}
                        </button>
                        {isBuyer(o) && <span className="tag tag-yours buyer-tag">Buyer</span>}
                        {openRow === o.id && (
                            <ul className="row-lines">
                              {o.lines.map((l) => (
                                  <li key={l.id}>
                                    {l.qty}× {l.name}{l.variantName ? ` (${l.variantName})` : ''}{l.extras.length ? ` ${describeExtras(l.extras.map((e) => e.name), ' ')}` : ''}{l.notes ? ` “${l.notes}”` : ''}
                                    <span>{money(l.lineTotal)}</span>
                                  </li>
                              ))}
                            </ul>
                        )}
                      </td>
                      <td className="num">{money(o.subtotal)}</td>
                      <td className="num">{money(o.vat)}</td>
                      <td className="num">{money(o.deliveryShare)}</td>
                      <td className="num strong">{money(o.total)}</td>
                      <td className="c">
                        {isBuyer(o) ? (
                            <span className="muted" title="The buyer doesn’t pay himself">—</span>
                        ) : (
                            <input type="checkbox" checked={o.paid} aria-label={`${o.personName} paid`}
                                   onChange={(e) => run(() => api.setPaid(group.id, o.id, e.target.checked))} />
                        )}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>

            <div className="settings">
              <label className="switch">
                <input type="checkbox" role="switch" checked={group.delivery} onChange={(e) => setDelivery(e.target.checked)} />
                <span className="switch-track" aria-hidden="true" />
                <span>
              Delivery
              <small>{group.delivery ? '60 EGP, split between everyone' : 'Off: no delivery fee'}</small>
            </span>
              </label>
              <label>
                Who’s getting the order?
                <input required value={buyer} onChange={(e) => setBuyer(e.target.value)} onBlur={saveBuyer}
                       onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} maxLength={40} placeholder="e.g. Youssef" />
              </label>
            </div>

            {error && <p className="error" role="alert">{error}</p>}

            <div className="close-box">
              {isOpen ? (
                  <>
                    <p className="muted">
                      Closing stops new orders and changes. Do it right before you place the order.
                      It closes by itself at 12:00 AM.
                    </p>
                    <button className="btn btn-dark" onClick={closeNow}>Close group order</button>
                  </>
              ) : (
                  <>
                    <p className="muted">
                      {group.autoClosed ? 'This group order closed automatically at midnight.' : 'This group order is closed.'}
                    </p>
                    <div className="close-actions">
                      {!group.autoClosed && (
                          <button className="btn btn-quiet" onClick={() => run(() => api.reopenGroupOrder(group.id))}>Reopen it</button>
                      )}
                      <a className="btn btn-quiet" href="#/">Back to all group orders</a>
                    </div>
                  </>
              )}
            </div>
          </section>
        </div>
      </>
  );
}