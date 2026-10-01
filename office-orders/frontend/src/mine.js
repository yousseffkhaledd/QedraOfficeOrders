// Remembers, in this browser only, your last name typed and which orders you made.
// Shape: { [groupId]: [{ orderId, token }, ...] }  (one entry per person you ordered for)
// Whoever holds an order's edit token can change it. That's what replaces a login.
const KEY = 'office-orders:mine';
const NAME_KEY = 'office-orders:name';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function write(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode): app still works, just can't edit later */
  }
}

// Older versions stored a single { orderId, token } per group
const listFor = (all, groupId) => {
  const v = all[groupId];
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
};

export const mine = {
  list: (groupId) => listFor(read(), groupId),
  tokenFor: (groupId, orderId) =>
      listFor(read(), groupId).find((m) => m.orderId === orderId)?.token ?? null,
  add: (groupId, orderId, token) => {
    const all = read();
    all[groupId] = [...listFor(all, groupId).filter((m) => m.orderId !== orderId), { orderId, token }];
    write(all);
  },
  remove: (groupId, orderId) => {
    const all = read();
    all[groupId] = listFor(all, groupId).filter((m) => m.orderId !== orderId);
    write(all);
  },
  getName: () => {
    try {
      return localStorage.getItem(NAME_KEY) ?? '';
    } catch {
      return '';
    }
  },
  setName: (name) => {
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      /* ignore */
    }
  },
};