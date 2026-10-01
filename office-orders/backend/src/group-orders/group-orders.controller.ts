import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put } from '@nestjs/common';
import { ClientIp } from '../common/client-ip';
import { CreateGroupOrderDto, UpdateGroupOrderDto } from './dto/create-group-order.dto';
import { SetPaidDto, SubmitOrderDto } from './dto/submit-order.dto';
import { GroupOrdersService, Viewer } from './group-orders.service';

// The browser sends every edit token it holds, comma separated, so we can show it its own orders
const viewer = (ip: string, tokens?: string): Viewer => ({
  ip,
  tokens: (tokens ?? '').split(',').map((t) => t.trim()).filter(Boolean),
});

@Controller('group-orders')
export class GroupOrdersController {
  constructor(private readonly service: GroupOrdersService) {}

  @Get()
  list(@ClientIp() ip: string) {
    return this.service.list(viewer(ip));
  }

  @Get(':id')
  getOne(@Param('id') id: string, @ClientIp() ip: string, @Headers('x-edit-tokens') tokens?: string) {
    return this.service.getOne(id, viewer(ip, tokens));
  }

  @Post()
  create(@Body() dto: CreateGroupOrderDto, @ClientIp() ip: string) {
    return this.service.create(dto, viewer(ip));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupOrderDto, @ClientIp() ip: string) {
    return this.service.update(id, dto, viewer(ip));
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @ClientIp() ip: string) {
    return this.service.close(id, viewer(ip));
  }

  @Patch(':id/reopen')
  reopen(@Param('id') id: string, @ClientIp() ip: string) {
    return this.service.reopen(id, viewer(ip));
  }

  @Post(':id/orders')
  submit(
      @Param('id') id: string,
      @Body() dto: SubmitOrderDto,
      @ClientIp() ip: string,
      @Headers('x-edit-tokens') tokens?: string,
  ) {
    return this.service.submitOrder(id, dto, viewer(ip, tokens));
  }

  @Put(':id/orders/:orderId')
  updateOrder(
      @Param('id') id: string,
      @Param('orderId') orderId: string,
      @Body() dto: SubmitOrderDto,
      @ClientIp() ip: string,
      @Headers('x-edit-token') token?: string,
      @Headers('x-edit-tokens') tokens?: string,
  ) {
    return this.service.updateOrder(id, orderId, token, dto, viewer(ip, tokens));
  }

  @Delete(':id/orders/:orderId')
  deleteOrder(
      @Param('id') id: string,
      @Param('orderId') orderId: string,
      @ClientIp() ip: string,
      @Headers('x-edit-token') token?: string,
      @Headers('x-edit-tokens') tokens?: string,
  ) {
    return this.service.deleteOrder(id, orderId, token, viewer(ip, tokens));
  }

  @Patch(':id/orders/:orderId/paid')
  setPaid(
      @Param('id') id: string,
      @Param('orderId') orderId: string,
      @Body() dto: SetPaidDto,
      @ClientIp() ip: string,
  ) {
    return this.service.setPaid(id, orderId, dto.paid, viewer(ip));
  }
}