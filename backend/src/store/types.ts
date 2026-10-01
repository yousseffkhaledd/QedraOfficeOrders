export interface Extra {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  /** 'add' = a paid add-on (kiri, eggs...); 'mod' = a change to what's inside (no tahini, extra salad, bread) */
  kind: 'add' | 'mod';
  /** mods of the same ingredient share a group; only one per group can be chosen */
  group?: string;
}

/** A size / bread choice, e.g. "Sandwich" 17 vs "Carry-out pack" 37 */
export interface Variant {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  category: string;
  price: number; // used when the item has no variants
  variants?: Variant[]; // if present, the person must pick one and its price is used
  available: boolean;
  extraIds: string[]; // which extras are allowed on this item
}

// Names and prices are copied ("snapshotted") into the order,
// so changing the menu later never changes old orders.
export interface OrderLineExtra {
  extraId: string;
  name: string;
  price: number;
}

export interface OrderLine {
  id: string;
  menuItemId: string;
  name: string;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  qty: number;
  extras: OrderLineExtra[];
  notes?: string;
}

export interface PersonOrder {
  id: string;
  personName: string;
  editToken: string; // secret held by the browser that created this order
  paid: boolean;
  lines: OrderLine[];
  createdAt: string;
  updatedAt: string;
}

export type GroupOrderStatus = 'open' | 'closed';

export interface GroupOrder {
  id: string;
  title: string;
  status: GroupOrderStatus;
  deliveryFee: number; // 60 when delivery is on, 0 when off
  buyerName: string; // who is going to get / order the food (required)
  ownerIp: string; // IP of the computer that started it: only this IP sees the summary
  createdAt: string;
  closedAt?: string;
  autoClosed?: boolean; // true when it was closed automatically at midnight
  orders: PersonOrder[];
}

export interface Database {
  extras: Extra[];
  menuItems: MenuItem[];
  groupOrders: GroupOrder[];
}