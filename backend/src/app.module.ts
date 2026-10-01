import { Module } from '@nestjs/common';
import { StoreModule } from './store/store.module';
import { MenuModule } from './menu/menu.module';
import { GroupOrdersModule } from './group-orders/group-orders.module';

@Module({
  imports: [StoreModule, MenuModule, GroupOrdersModule],
})
export class AppModule {}
