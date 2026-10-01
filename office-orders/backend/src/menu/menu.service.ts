import { Injectable } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import { Extra } from '../store/types';

@Injectable()
export class MenuService {
    constructor(private readonly store: StoreService) {}

    /** Menu items with their allowed extras resolved into full objects. */
    getMenu() {
        const { menuItems, extras } = this.store.db;
        return menuItems
            .filter((item) => item.available)
            .map(({ extraIds, ...item }) => ({
                ...item,
                extras: extraIds
                    .map((id) => extras.find((e) => e.id === id))
                    .filter((e): e is Extra => e !== undefined),
            }));
    }
}