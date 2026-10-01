import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderLineDto {
  @IsString()
  menuItemId: string;

  /** Required when the item has variants (sandwich / carry-out pack, fino / baladi...) */
  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  qty: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  notes?: string;
}

export class SubmitOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  personName: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one item' })
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines: OrderLineDto[];
}

export class SetPaidDto {
  @IsBoolean()
  paid: boolean;
}