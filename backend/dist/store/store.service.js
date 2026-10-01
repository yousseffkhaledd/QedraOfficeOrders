"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const seed_1 = require("./seed");
/**
 * Prototype storage: group orders are saved in one JSON file.
 * The menu always comes from seed.ts, so editing seed.ts and restarting
 * updates the menu without deleting any orders.
 */
let StoreService = class StoreService {
    constructor() {
        this.file = process.env.DATA_FILE ?? (0, path_1.join)(process.cwd(), 'data', 'db.json');
    }
    onModuleInit() {
        const saved = (0, fs_1.existsSync)(this.file) ? JSON.parse((0, fs_1.readFileSync)(this.file, 'utf8')) : {};
        this.data = { extras: seed_1.extras, menuItems: seed_1.menuItems, groupOrders: saved.groupOrders ?? [] };
        this.save();
    }
    get db() {
        return this.data;
    }
    save() {
        (0, fs_1.mkdirSync)((0, path_1.dirname)(this.file), { recursive: true });
        (0, fs_1.writeFileSync)(this.file, JSON.stringify({ groupOrders: this.data.groupOrders }, null, 2));
    }
};
exports.StoreService = StoreService;
exports.StoreService = StoreService = __decorate([
    (0, common_1.Injectable)()
], StoreService);
//# sourceMappingURL=store.service.js.map