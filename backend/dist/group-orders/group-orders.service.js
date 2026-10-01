"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupOrdersService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const store_service_1 = require("../store/store.service");
const pricing_1 = require("./pricing");
/** "Wed 30 Sep", in this computer's local time */
const dateLabel = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
/** 12:00 AM at the end of the day the group order was started (local time) */
const midnightAfter = (iso) => {
    const d = new Date(iso);
    d.setHours(24, 0, 0, 0);
    return d;
};
let GroupOrdersService = class GroupOrdersService {
    constructor(store) {
        this.store = store;
    }
    // ---------- auto close at midnight ----------
    onModuleInit() {
        this.closeExpired(); // catches orders left open while the server was off
        this.timer = setInterval(() => this.closeExpired(), 60_000);
    }
    onModuleDestroy() {
        clearInterval(this.timer);
    }
    /** Closes every open group order that was started before today's 12:00 AM. */
    closeExpired() {
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
        if (changed)
            this.store.save();
    }
    // ---------- reading ----------
    getOne(id, viewer) {
        this.closeExpired();
        return this.view(this.find(id), viewer);
    }
    /** Home page list. Everyone sees open orders; only the owner sees names and money. */
    list(viewer) {
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
    create(dto, viewer) {
        const now = new Date();
        const group = {
            id: (0, crypto_1.randomUUID)(),
            title: `${dto.title.trim()}, ${dateLabel(now)}`, // date added automatically
            status: 'open',
            deliveryFee: dto.delivery ? pricing_1.DELIVERY_FEE : 0,
            buyerName: dto.buyerName.trim(),
            ownerIp: viewer.ip,
            createdAt: now.toISOString(),
            orders: [],
        };
        this.store.db.groupOrders.push(group);
        this.store.save();
        return this.view(group, viewer);
    }
    update(id, dto, viewer) {
        const group = this.findOwned(id, viewer);
        if (dto.delivery !== undefined)
            group.deliveryFee = dto.delivery ? pricing_1.DELIVERY_FEE : 0;
        if (dto.buyerName !== undefined)
            group.buyerName = dto.buyerName.trim();
        this.store.save();
        return this.view(group, viewer);
    }
    close(id, viewer) {
        const group = this.findOwned(id, viewer);
        group.status = 'closed';
        group.closedAt = new Date().toISOString();
        this.store.save();
        return this.view(group, viewer);
    }
    reopen(id, viewer) {
        const group = this.findOwned(id, viewer);
        if (new Date() >= midnightAfter(group.createdAt)) {
            throw new common_1.ConflictException('This group order is from a previous day. Start a new one.');
        }
        group.status = 'open';
        group.closedAt = undefined;
        group.autoClosed = undefined;
        this.store.save();
        return this.view(group, viewer);
    }
    setPaid(groupId, orderId, paid, viewer) {
        const group = this.findOwned(groupId, viewer);
        const order = group.orders.find((o) => o.id === orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        order.paid = paid;
        this.store.save();
        return this.view(group, viewer);
    }
    // ---------- one person's part (anyone) ----------
    submitOrder(groupId, dto, viewer) {
        const group = this.findOpen(groupId);
        const now = new Date().toISOString();
        const order = {
            id: (0, crypto_1.randomUUID)(),
            personName: dto.personName.trim(),
            editToken: (0, crypto_1.randomUUID)(),
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
    updateOrder(groupId, orderId, token, dto, viewer) {
        const group = this.findOpen(groupId);
        const order = this.findOwnOrder(group, orderId, token);
        order.personName = dto.personName.trim();
        order.lines = dto.lines.map((l) => this.buildLine(l));
        order.updatedAt = new Date().toISOString();
        this.store.save();
        return this.view(group, viewer);
    }
    deleteOrder(groupId, orderId, token, viewer) {
        const group = this.findOpen(groupId);
        const order = this.findOwnOrder(group, orderId, token);
        group.orders = group.orders.filter((o) => o.id !== order.id);
        this.store.save();
        return this.view(group, viewer);
    }
    // ---------- helpers ----------
    /** Checks the item and extras against the menu and snapshots names + prices. */
    buildLine(dto) {
        const { menuItems, extras } = this.store.db;
        const item = menuItems.find((m) => m.id === dto.menuItemId && m.available);
        if (!item)
            throw new common_1.BadRequestException(`Item "${dto.menuItemId}" is not on the menu`);
        // Items with sizes / bread choices: the chosen variant decides the price
        let unitPrice = item.price;
        let variant;
        if (item.variants?.length) {
            const v = item.variants.find((x) => x.id === dto.variantId);
            if (!v)
                throw new common_1.BadRequestException(`Choose an option for ${item.name}`);
            unitPrice = v.price;
            variant = v;
        }
        const extraIds = [...new Set(dto.extraIds ?? [])];
        const lineExtras = extraIds.map((id) => {
            const extra = extras.find((e) => e.id === id);
            if (!extra || !item.extraIds.includes(id)) {
                throw new common_1.BadRequestException(`"${id}" can't be added to ${item.name}`);
            }
            return { extraId: extra.id, name: extra.name, price: extra.price, group: extra.group };
        });
        // "No tahini" and "Extra tahini" can't both be chosen (same for baladi / shami)
        const groups = lineExtras.map((e) => e.group).filter(Boolean);
        if (new Set(groups).size !== groups.length) {
            throw new common_1.BadRequestException(`Choose only one option of each kind for ${item.name}`);
        }
        // Bread only applies to sandwiches: none for a carry-out pack, baladi if nothing was picked
        const hasBread = item.extraIds.includes('m-bread-baladi');
        const isPack = variant?.id === 'pack';
        if (isPack && groups.includes('bread')) {
            throw new common_1.BadRequestException(`A carry-out pack has no bread (${item.name})`);
        }
        if (hasBread && !isPack && !groups.includes('bread')) {
            const baladi = extras.find((e) => e.id === 'm-bread-baladi');
            lineExtras.unshift({ extraId: baladi.id, name: baladi.name, price: baladi.price, group: baladi.group });
        }
        return {
            id: (0, crypto_1.randomUUID)(),
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
    find(id) {
        const group = this.store.db.groupOrders.find((g) => g.id === id);
        if (!group)
            throw new common_1.NotFoundException('Group order not found');
        return group;
    }
    findOpen(id) {
        this.closeExpired();
        const group = this.find(id);
        if (group.status !== 'open')
            throw new common_1.ConflictException('This group order is closed');
        return group;
    }
    findOwned(id, viewer) {
        const group = this.find(id);
        if (group.ownerIp !== viewer.ip) {
            throw new common_1.ForbiddenException('Only the person who started this group order can do that');
        }
        return group;
    }
    findOwnOrder(group, orderId, token) {
        const order = group.orders.find((o) => o.id === orderId);
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (!token || token !== order.editToken) {
            throw new common_1.ForbiddenException('You can only change an order made from this browser');
        }
        return order;
    }
    /** Everything, with totals. Never sent as-is to a non-owner. */
    fullView(group) {
        const share = (0, pricing_1.deliveryShare)(group);
        const orders = group.orders.map((o) => {
            const sub = (0, pricing_1.subtotal)(o);
            const v = (0, pricing_1.vat)(o);
            return {
                id: o.id,
                editToken: o.editToken, // stripped before sending
                personName: o.personName,
                paid: o.paid,
                createdAt: o.createdAt,
                updatedAt: o.updatedAt,
                lines: o.lines.map((l) => ({ ...l, lineTotal: (0, pricing_1.lineTotal)(l) })),
                subtotal: sub,
                vat: v,
                deliveryShare: share,
                total: (0, pricing_1.round2)(sub + v + share),
            };
        });
        const itemsTotal = (0, pricing_1.round2)(orders.reduce((s, o) => s + o.subtotal, 0));
        const vatTotal = (0, pricing_1.round2)(orders.reduce((s, o) => s + o.vat, 0));
        const deliveryFee = orders.length ? group.deliveryFee : 0;
        const grandTotal = (0, pricing_1.round2)(itemsTotal + vatTotal + deliveryFee);
        const paidTotal = (0, pricing_1.round2)(orders.filter((o) => o.paid).reduce((s, o) => s + o.total, 0));
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
                unpaidTotal: (0, pricing_1.round2)(grandTotal - paidTotal),
            },
        };
    }
    /**
     * What the API returns.
     * Owner: every order, the restaurant list and all totals.
     * Anyone else: only their own orders (matched by edit token) and the number of people.
     */
    view(group, viewer) {
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
            vatRate: pricing_1.VAT_RATE,
            isOwner,
            orders: visible.map(({ editToken, ...o }) => o),
            restaurantOrder: isOwner ? (0, pricing_1.restaurantOrder)(group) : [],
            totals: isOwner ? full.totals : { people: full.totals.people },
        };
    }
};
exports.GroupOrdersService = GroupOrdersService;
exports.GroupOrdersService = GroupOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], GroupOrdersService);
//# sourceMappingURL=group-orders.service.js.map