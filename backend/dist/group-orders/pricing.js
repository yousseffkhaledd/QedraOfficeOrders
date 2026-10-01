"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DELIVERY_FEE = exports.VAT_RATE = exports.round2 = void 0;
exports.lineTotal = lineTotal;
exports.subtotal = subtotal;
exports.vat = vat;
exports.deliveryShare = deliveryShare;
exports.restaurantOrder = restaurantOrder;
const round2 = (n) => Math.round(n * 100) / 100;
exports.round2 = round2;
/** Egyptian VAT. Applied to food and extras, not to the delivery fee. */
exports.VAT_RATE = 0.14;
/** Delivery is either on (this fee, split equally) or off. */
exports.DELIVERY_FEE = 60;
/** (item price + all extras) × qty */
function lineTotal(line) {
    const extras = line.extras.reduce((sum, e) => sum + e.price, 0);
    return (0, exports.round2)((line.unitPrice + extras) * line.qty);
}
function subtotal(order) {
    return (0, exports.round2)(order.lines.reduce((sum, l) => sum + lineTotal(l), 0));
}
function vat(order) {
    return (0, exports.round2)(subtotal(order) * exports.VAT_RATE);
}
/** Delivery fee split equally among everyone who has ordered. */
function deliveryShare(group) {
    const people = group.orders.length;
    return people === 0 ? 0 : (0, exports.round2)(group.deliveryFee / people);
}
/**
 * "What to order from the restaurant": identical items (same item,
 * same option, same extras, same notes) are merged, and we remember who wanted them.
 */
function restaurantOrder(group) {
    const groups = new Map();
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
    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name) || (a.variant ?? '').localeCompare(b.variant ?? '') || a.extras.length - b.extras.length);
}
//# sourceMappingURL=pricing.js.map