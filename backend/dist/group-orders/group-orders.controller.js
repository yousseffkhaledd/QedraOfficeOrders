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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupOrdersController = void 0;
const common_1 = require("@nestjs/common");
const client_ip_1 = require("../common/client-ip");
const create_group_order_dto_1 = require("./dto/create-group-order.dto");
const submit_order_dto_1 = require("./dto/submit-order.dto");
const group_orders_service_1 = require("./group-orders.service");
// The browser sends every edit token it holds, comma separated, so we can show it its own orders
const viewer = (ip, tokens) => ({
    ip,
    tokens: (tokens ?? '').split(',').map((t) => t.trim()).filter(Boolean),
});
let GroupOrdersController = class GroupOrdersController {
    constructor(service) {
        this.service = service;
    }
    list(ip) {
        return this.service.list(viewer(ip));
    }
    getOne(id, ip, tokens) {
        return this.service.getOne(id, viewer(ip, tokens));
    }
    create(dto, ip) {
        return this.service.create(dto, viewer(ip));
    }
    update(id, dto, ip) {
        return this.service.update(id, dto, viewer(ip));
    }
    close(id, ip) {
        return this.service.close(id, viewer(ip));
    }
    reopen(id, ip) {
        return this.service.reopen(id, viewer(ip));
    }
    submit(id, dto, ip, tokens) {
        return this.service.submitOrder(id, dto, viewer(ip, tokens));
    }
    updateOrder(id, orderId, dto, ip, token, tokens) {
        return this.service.updateOrder(id, orderId, token, dto, viewer(ip, tokens));
    }
    deleteOrder(id, orderId, ip, token, tokens) {
        return this.service.deleteOrder(id, orderId, token, viewer(ip, tokens));
    }
    setPaid(id, orderId, dto, ip) {
        return this.service.setPaid(id, orderId, dto.paid, viewer(ip));
    }
};
exports.GroupOrdersController = GroupOrdersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, client_ip_1.ClientIp)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, client_ip_1.ClientIp)()),
    __param(2, (0, common_1.Headers)('x-edit-tokens')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, client_ip_1.ClientIp)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_group_order_dto_1.CreateGroupOrderDto, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, client_ip_1.ClientIp)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_group_order_dto_1.UpdateGroupOrderDto, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, client_ip_1.ClientIp)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "close", null);
__decorate([
    (0, common_1.Patch)(':id/reopen'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, client_ip_1.ClientIp)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "reopen", null);
__decorate([
    (0, common_1.Post)(':id/orders'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, client_ip_1.ClientIp)()),
    __param(3, (0, common_1.Headers)('x-edit-tokens')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_order_dto_1.SubmitOrderDto, String, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "submit", null);
__decorate([
    (0, common_1.Put)(':id/orders/:orderId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, client_ip_1.ClientIp)()),
    __param(4, (0, common_1.Headers)('x-edit-token')),
    __param(5, (0, common_1.Headers)('x-edit-tokens')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, submit_order_dto_1.SubmitOrderDto, String, String, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Delete)(':id/orders/:orderId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, client_ip_1.ClientIp)()),
    __param(3, (0, common_1.Headers)('x-edit-token')),
    __param(4, (0, common_1.Headers)('x-edit-tokens')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "deleteOrder", null);
__decorate([
    (0, common_1.Patch)(':id/orders/:orderId/paid'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, client_ip_1.ClientIp)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, submit_order_dto_1.SetPaidDto, String]),
    __metadata("design:returntype", void 0)
], GroupOrdersController.prototype, "setPaid", null);
exports.GroupOrdersController = GroupOrdersController = __decorate([
    (0, common_1.Controller)('group-orders'),
    __metadata("design:paramtypes", [group_orders_service_1.GroupOrdersService])
], GroupOrdersController);
//# sourceMappingURL=group-orders.controller.js.map