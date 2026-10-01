import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { extras, menuItems } from './seed';
import { Database } from './types';

/**
 * Prototype storage: group orders are saved in one JSON file.
 * The menu always comes from seed.ts, so editing seed.ts and restarting
 * updates the menu without deleting any orders.
 */
@Injectable()
export class StoreService implements OnModuleInit {
  private readonly file = process.env.DATA_FILE ?? join(process.cwd(), 'data', 'db.json');
  private data: Database;

  onModuleInit() {
    const saved = existsSync(this.file) ? JSON.parse(readFileSync(this.file, 'utf8')) : {};
    this.data = { extras, menuItems, groupOrders: saved.groupOrders ?? [] };
    this.save();
  }

  get db(): Database {
    return this.data;
  }

  save() {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify({ groupOrders: this.data.groupOrders }, null, 2));
  }
}