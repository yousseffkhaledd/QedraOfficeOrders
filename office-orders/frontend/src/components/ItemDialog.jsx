import { useEffect, useRef, useState } from 'react';
import { money } from '../format';

const GROUP_LABEL = { bread: 'Bread', tahini: 'Tahini', salad: 'Salad', arugula: 'Arugula' };
// Bread has no "Normal": you always pick one (baladi first), and only for a sandwich
const REQUIRED = ['bread'];

export default function ItemDialog({ item, onAdd, onClose }) {
  const [variantId, setVariantId] = useState(item.variants?.[0]?.id ?? null);
  const [selected, setSelected] = useState([]); // paid add-ons
  const [changes, setChanges] = useState({}); // { tahini: 'm-tahini-no', salad: 'm-salad-extra', ... }
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addons = item.extras.filter((e) => e.kind !== 'mod');
  const mods = item.extras.filter((e) => e.kind === 'mod');
  const isPack = variantId === 'pack';
  const groups = [...new Set(mods.map((m) => m.group))].filter((g) => !(g === 'bread' && isPack));
  const pick = (g) =>
      changes[g] ?? (REQUIRED.includes(g) ? mods.find((m) => m.group === g)?.id ?? null : null);

  const toggle = (id) =>
      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const variant = item.variants?.find((v) => v.id === variantId) ?? null;
  const base = variant ? variant.price : item.price;
  const chosenChanges = mods.filter((m) => groups.includes(m.group) && pick(m.group) === m.id);
  const chosenAddons = addons.filter((e) => selected.includes(e.id));
  const chosen = [...chosenChanges, ...chosenAddons];
  const total = (base + chosen.reduce((s, e) => s + e.price, 0)) * qty;

  return (
      <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
          <div className="dialog-head">
            <div>
              <h2 id="dlg-title">{item.name}</h2>
              {item.nameAr && <p className="ar" lang="ar" dir="rtl">{item.nameAr}</p>}
              {item.description && <p className="muted dlg-desc">{item.description}</p>}
            </div>
            <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {item.variants && (
              <fieldset className="variants">
                <legend>Choose one</legend>
                {item.variants.map((v) => (
                    <label key={v.id} className={v.id === variantId ? 'variant is-on' : 'variant'}>
                      <input type="radio" name="variant" checked={v.id === variantId} onChange={() => setVariantId(v.id)} />
                      <span>{v.name}</span>
                      <span className="extra-price">{money(v.price)}</span>
                    </label>
                ))}
              </fieldset>
          )}

          {groups.length > 0 && (
              <fieldset className="adjust">
                <legend>How do you want it?</legend>
                {groups.map((g) => {
                  const opts = mods.filter((m) => m.group === g);
                  const current = pick(g);
                  const required = REQUIRED.includes(g);
                  return (
                      <div key={g} className="adjust-row">
                        <span className="adjust-label">{GROUP_LABEL[g] ?? g}</span>
                        <div className="seg" role="radiogroup" aria-label={GROUP_LABEL[g] ?? g}>
                          {!required && (
                              <button type="button" role="radio" aria-checked={current === null}
                                      onClick={() => setChanges((c) => ({ ...c, [g]: null }))}>Normal</button>
                          )}
                          {opts.map((o) => (
                              <button key={o.id} type="button" role="radio" aria-checked={current === o.id}
                                      onClick={() => setChanges((c) => ({ ...c, [g]: o.id }))}>
                                {o.name.replace(/\s*(tahini|salad|arugula|bread)$/i, '')}
                                {o.price > 0 && <small> +{o.price}</small>}
                              </button>
                          ))}
                        </div>
                      </div>
                  );
                })}
              </fieldset>
          )}

          {addons.length > 0 && (
              <fieldset className="extras">
                <legend>Add extras <span className="optional">optional</span></legend>
                <div className="extras-grid">
                  {addons.map((e) => (
                      <label key={e.id} className="extra">
                        <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggle(e.id)} />
                        <span>{e.name}</span>
                        <span className="extra-price">{e.price > 0 ? `+${money(e.price)}` : 'Free'}</span>
                      </label>
                  ))}
                </div>
              </fieldset>
          )}

          <label className="notes">
            <span>Note for the restaurant <span className="optional">optional</span></span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={120} placeholder="e.g. well done" />
          </label>

          <div className="dialog-foot">
            <div className="stepper" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One less">−</button>
              <span aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="One more">+</button>
            </div>
            <button className="btn btn-primary grow" onClick={() => onAdd({ item, variant, extras: chosen, qty, notes: notes.trim() })}>
              Add for {money(total)}
            </button>
          </div>
          <p className="fine dlg-vat">Prices before VAT.</p>
        </div>
      </div>
  );
}