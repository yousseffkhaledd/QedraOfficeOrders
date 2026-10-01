import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StoreService } from '../store/store.service';
import { GroupOrder, OrderLine, PersonOrder } from '../store/types';
import { CreateGroupOrderDto, UpdateGroupOrderDto } from './dto/create-group-order.dto';
import { OrderLineDto, SubmitOrderDto } from './dto/submit-order.dto';
import { DELIVERY_FEE, deliveryShare, lineTotal, restaurantOrder, round2, subtotal, vat, VAT_RATE } from './pricing';

/** Who is asking: their IP (decides ownership) and the edit tokens their browser holds. */
export interface Viewer {
  ip: string;
  tokens: string[];
}

/** "Wed 30 Sep", in this computer's local time */
const dateLabel = (d: Date) =>
    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** 12:00 AM at the end of the day the group order was started (local time) */
const midnightAfter = (iso: string) => {
  const d = new Date(iso);
  d.setHours(24, 0, 0, 0);
  return d;
};

@Injectable()
export class GroupOrdersService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(private readonly store: StoreService) {}

  // ---------- auto close at midnight ----------

  onModuleInit() {
    this.closeExpired(); // catches orders left open while the server was off
    this.timer = setInterval(() => this.closeExpired(), 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  /** Closes every open group order that was started before today's 12:00 AM. */
  private closeExpired() {
    const now = new Date();
    let changed = false;
    for (const g of this.store.db.groupOrders) {
      if (g.status === 'open' && now >= midnightAfter(g.createdAt)) {
        g.status = 'closed';
        g.closedAt = midnightAfter(g.createdAt).toISOString();
        g.autoClosed = true;
        changed = true;
      }
    }
    if (changed) this.store.save();
  }

  // ---------- reading ----------

  getOne(id: string, viewer: Viewer) {
    this.closeExpired();
    return this.view(this.find(id), viewer);
  }

  /** Home page list. Everyone sees open orders; only the owner sees names and money. */
  list(viewer: Viewer) {
    this.closeExpired();
    return [...this.store.db.groupOrders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter((g) => g.status === 'open' || g.ownerIp === viewer.ip) // closed ones: owner only
        .map((g) => {
          const isOwner = g.ownerIp === viewer.ip;
          const full = this.fullView(g);
          return {
            id: g.id,
            title: g.title,
            status: g.status,
            buyerName: g.buyerName,
            createdAt: g.createdAt,
            closedAt: g.closedAt,
            isOwner,
            peopleCount: g.orders.length,
            people: isOwner ? g.orders.map((o) => o.personName) : undefined,
            grandTotal: isOwner ? full.totals.grandTotal : undefined,
          };
        });
  }

  // ---------- group order lifecycle (owner only, except create) ----------

  create(dto: CreateGroupOrderDto, viewer: Viewer) {
    const now = new Date();
    const group: GroupOrder = {
      id: randomUUID(),
      title: `${dto.title.trim()}, ${dateLabel(now)}`, // date added automatically
      status: 'open',
      deliveryFee: dto.delivery ? DELIVERY_FEE : 0,
      buyerName: dto.buyerName.trim(),
      ownerIp: viewer.ip,
      createdAt: now.toISOString(),
      orders: [],
    };
    this.store.db.groupOrders.push(group);
    this.store.save();
    return this.view(group, viewer);
  }

  update(id: string, dto: UpdateGroupOrderDto, viewer: Viewer) {
    const group = this.findOwned(id, viewer);
    if (dto.delivery !== undefined) group.deliveryFee = dto.delivery ? DELIVERY_FEE : 0;
    if (dto.buyerName !== undefined) group.buyerName = dto.buyerName.trim();
    this.store.save();
    return this.view(group, viewer);
  }

  close(id: string, viewer: Viewer) {
    const group = this.findOwned(id, viewer);
    group.status = 'closed';
    group.closedAt = new Date().toISOString();
    this.store.save();
    return this.view(group, viewer);
  }

  reopen(id: string, viewer: Viewer) {
    const group = this.findOwned(id, viewer);
    if (new Date() >= midnightAfter(group.createdAt)) {
      throw new ConflictException('This group order is from a previous day. Start a new one.');
    }
    group.status = 'open';
    group.closedAt = undefined;
    group.autoClosed = undefined;
    this.store.save();
    return this.view(group, viewer);
  }

  setPaid(groupId: string, orderId: string, paid: boolean, viewer: Viewer) {
    const group = this.findOwned(groupId, viewer);
    const order = group.orders.find((o) => o.id === orderId);
    if (!order) throw new NotFoundException('Order not found');
    order.paid = paid;
    this.store.save();
    return this.view(group, viewer);
  }

  // ---------- one person's part (anyone) ----------

  submitOrder(groupId: string, dto: SubmitOrderDto, viewer: Viewer) {
    const group = this.findOpen(groupId);
    const now = new Date().toISOString();
    const order: PersonOrder = {
      id: randomUUID(),
      personName: dto.personName.trim(),
      editToken: randomUUID(),
      paid: false,
      lines: dto.lines.map((l) => this.buildLine(l)),
      createdAt: now,
      updatedAt: now,
    };
    group.orders.push(order);
    this.store.save();
    // The only time the edit token is ever sent to anyone.
    const withNew = { ...viewer, tokens: [...viewer.tokens, order.editToken] };
    return { orderId: order.id, editToken: order.editToken, group: this.view(group, withNew) };
  }

  updateOrder(groupId: string, orderId: string, token: string | undefined, dto: SubmitOrderDto, viewer: Viewer) {
    const group = this.findOpen(groupId);
    const order = this.findOwnOrder(group, orderId, token);
    order.personName = dto.personName.trim();
    order.lines = dto.lines.map((l) => this.buildLine(l));
    order.updatedAt = new Date().toISOString();
    this.store.save();
    return this.view(group, viewer);
  }

  deleteOrder(groupId: string, orderId: string, token: string | undefined, viewer: Viewer) {
    const group = this.findOpen(groupId);
    const order = this.findOwnOrder(group, orderId, token);
    group.orders = group.orders.filter((o) => o.id !== order.id);
    this.store.save();
    return this.view(group, viewer);
  }

  // ---------- helpers ----------

  /** Checks the item and extras against the menu and snapshots names + prices. */
  private buildLine(dto: OrderLineDto): OrderLine {
    const { menuItems, extras } = this.store.db;
    const item = menuItems.find((m) => m.id === dto.menuItemId && m.available);
    if (!item) throw new BadRequestException(`Item "${dto.menuItemId}" is not on the menu`);

    // Items with sizes / bread choices: the chosen variant decides the price
    let unitPrice = item.price;
    let variant: { id: string; name: string } | undefined;
    if (item.variants?.length) {
      const v = item.variants.find((x) => x.id === dto.variantId);
      if (!v) throw new BadRequestException(`Choose an option for ${item.name}`);
      unitPrice = v.price;
      variant = v;
    }

    const extraIds = [...new Set(dto.extraIds ?? [])];
    const lineExtras = extraIds.map((id) => {
      const extra = extras.find((e) => e.id === id);
      if (!extra || !item.extraIds.includes(id)) {
        throw new BadRequestException(`"${id}" can't be added to ${item.name}`);
      }
      return { extraId: extra.id, name: extra.name, price: extra.price, group: extra.group };
    });

    // "No tahini" and "Extra tahini" can't both be chosen (same for baladi / shami)
    const groups = lineExtras.map((e) => e.group).filter(Boolean);
    if (new Set(groups).size !== groups.length) {
      throw new BadRequestException(`Choose only one option of each kind for ${item.name}`);
    }

    // Bread only applies to sandwiches: none for a carry-out pack, baladi if nothing was picked
    const hasBread = item.extraIds.includes('m-bread-baladi');
    const isPack = variant?.id === 'pack';
    if (isPack && groups.includes('bread')) {
      throw new BadRequestException(`A carry-out pack has no bread (${item.name})`);
    }
    if (hasBread && !isPack && !groups.includes('bread')) {
      const baladi = extras.find((e) => e.id === 'm-bread-baladi')!;
      lineExtras.unshift({ extraId: baladi.id, name: baladi.name, price: baladi.price, group: baladi.group });
    }

    return {
      id: randomUUID(),
      menuItemId: item.id,
      name: item.name,
      variantId: variant?.id,
      variantName: variant?.name,
      unitPrice,
      qty: dto.qty,
      extras: lineExtras.map(({ group, ...e }) => e),
      notes: dto.notes?.trim() || undefined,
    };
  }

  private find(id: string): GroupOrder {
    const group = this.store.db.groupOrders.find((g) => g.id === id);
    if (!group) throw new NotFoundException('Group order not found');
    return group;
  }

  private findOpen(id: string): GroupOrder {
    this.closeExpired();
    const group = this.find(id);
    if (group.status !== 'open') throw new ConflictException('This group order is closed');
    return group;
  }

  private findOwned(id: string, viewer: Viewer): GroupOrder {
    const group = this.find(id);
    if (group.ownerIp !== viewer.ip) {
      throw new ForbiddenException('Only the person who started this group order can do that');
    }
    return group;
  }

  private findOwnOrder(group: GroupOrder, orderId: string, token: string | undefined): PersonOrder {
    const order = group.orders.find((o) => o.id === orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (!token || token !== order.editToken) {
      throw new ForbiddenException('You can only change an order made from this browser');
    }
    return order;
  }

  /** Everything, with totals. Never sent as-is to a non-owner. */
  private fullView(group: GroupOrder) {
    const share = deliveryShare(group);
    const orders = group.orders.map((o) => {
      const sub = subtotal(o);
      const v = vat(o);
      return {
        id: o.id,
        editToken: o.editToken, // stripped before sending
        personName: o.personName,
        paid: o.paid,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        lines: o.lines.map((l) => ({ ...l, lineTotal: lineTotal(l) })),
        subtotal: sub,
        vat: v,
        deliveryShare: share,
        total: round2(sub + v + share),
      };
    });

    const itemsTotal = round2(orders.reduce((s, o) => s + o.subtotal, 0));
    const vatTotal = round2(orders.reduce((s, o) => s + o.vat, 0));
    const deliveryFee = orders.length ? group.deliveryFee : 0;
    const grandTotal = round2(itemsTotal + vatTotal + deliveryFee);
    const paidTotal = round2(orders.filter((o) => o.paid).reduce((s, o) => s + o.total, 0));

    return {
      orders,
      totals: {
        people: orders.length,
        items: group.orders.reduce((s, o) => s + o.lines.reduce((q, l) => q + l.qty, 0), 0),
        itemsTotal,
        vatTotal,
        deliveryFee,
        grandTotal,
        paidTotal,
        unpaidTotal: round2(grandTotal - paidTotal),
      },
    };
  }

  /**
   * What the API returns.
   * Owner: every order, the restaurant list and all totals.
   * Anyone else: only their own orders (matched by edit token) and the number of people.
   */
  private view(group: GroupOrder, viewer: Viewer) {
    const isOwner = group.ownerIp === viewer.ip;
    const full = this.fullView(group);
    const visible = isOwner ? full.orders : full.orders.filter((o) => viewer.tokens.includes(o.editToken));

    return {
      id: group.id,
      title: group.title,
      status: group.status,
      deliveryFee: group.deliveryFee,
      delivery: group.deliveryFee > 0,
      buyerName: group.buyerName,
      createdAt: group.createdAt,
      closedAt: group.closedAt,
      autoClosed: !!group.autoClosed,
      closesAt: midnightAfter(group.createdAt).toISOString(),
      vatRate: VAT_RATE,
      isOwner,
      orders: visible.map(({ editToken, ...o }) => o),
      restaurantOrder: isOwner ? restaurantOrder(group) : [],
      totals: isOwner ? full.totals : { people: full.totals.people },
    };
  }
}