import { mine } from './mine';

// All calls go through Vite's proxy (/api -> NestJS on :3000)
async function request(path, { method = 'GET', body, token, groupId } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-edit-token'] = token;
  // Tell the server which orders in this group are ours, so it shows us our own orders
  if (groupId) {
    const tokens = mine.list(groupId).map((m) => m.token).join(',');
    if (tokens) headers['x-edit-tokens'] = tokens;
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Can’t reach the server. Is the backend running on port 3000?');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getMenu: () => request('/menu'),
  listGroupOrders: () => request('/group-orders'),
  getGroupOrder: (id) => request(`/group-orders/${id}`, { groupId: id }),
  createGroupOrder: (body) => request('/group-orders', { method: 'POST', body }),
  updateGroupOrder: (id, body) => request(`/group-orders/${id}`, { method: 'PATCH', body }),
  closeGroupOrder: (id) => request(`/group-orders/${id}/close`, { method: 'PATCH' }),
  reopenGroupOrder: (id) => request(`/group-orders/${id}/reopen`, { method: 'PATCH' }),
  submitOrder: (id, body) => request(`/group-orders/${id}/orders`, { method: 'POST', body, groupId: id }),
  updateOrder: (id, orderId, token, body) =>
      request(`/group-orders/${id}/orders/${orderId}`, { method: 'PUT', body, token, groupId: id }),
  deleteOrder: (id, orderId, token) =>
      request(`/group-orders/${id}/orders/${orderId}`, { method: 'DELETE', token, groupId: id }),
  setPaid: (id, orderId, paid) =>
      request(`/group-orders/${id}/orders/${orderId}/paid`, { method: 'PATCH', body: { paid } }),
};