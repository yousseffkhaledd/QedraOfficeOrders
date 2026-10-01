import { GroupOrder, OrderLine, PersonOrder } from '../store/types';

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Egyptian VAT. Applied to food and extras, not to the delivery fee. */
export const VAT_RATE = 0.14;

/** Delivery is either on (this fee, split equally) or off. */
export const DELIVERY_FEE = 60;

/** (item price + all extras) × qty */
export function lineTotal(line: OrderLine): number {
  const extras = line.extras.reduce((sum, e) => sum + e.price, 0);
  return round2((line.unitPrice + extras) * line.qty);
}

export function subtotal(order: PersonOrder): number {
  return round2(order.lines.reduce((sum, l) => sum + lineTotal(l), 0));
}

export function vat(order: PersonOrder): number {
  return round2(subtotal(order) * VAT_RATE);
}

/** Delivery fee split equally among everyone who has ordered. */
export function deliveryShare(group: GroupOrder): number {
  const people = group.orders.length;
  return people === 0 ? 0 : round2(group.deliveryFee / people);
}

/**
 * "What to order from the restaurant": identical items (same item,
 * same option, same extras, same notes) are merged, and we remember who wanted them.
 */
export function restaurantOrder(group: GroupOrder) {
  const groups = new Map<
      string,
      { name: string; variant?: string; extras: string[]; notes?: string; qty: number; people: { name: string; qty: number }[] }
  >();

  for (const order of group.orders) {
    for (const line of order.lines) {
      const extraIds = line.extras.map((e) => e.extraId).sort();
      const notes = line.notes?.trim() || undefined;
      const key = [line.menuItemId, line.variantId ?? '', extraIds.join(','), (notes ?? '').toLowerCase()].join('|');

      let entry = groups.get(key);
      if (!entry) {
        entry = { name: line.name, variant: line.variantName, extras: line.extras.map((e) => e.name), notes, qty: 0, people: [] };
        groups.set(key, entry);
      }
      entry.qty += line.qty;
      entry.people.push({ name: order.personName, qty: line.qty });
    }
  }

  return [...groups.values()].sort(
      (a, b) => a.name.localeCompare(b.name) || (a.variant ?? '').localeCompare(b.variant ?? '') || a.extras.length - b.extras.length,
  );
}