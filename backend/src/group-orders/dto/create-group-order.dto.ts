import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGroupOrderDto {
  /** Just the group name, e.g. "DMD". Today's date is added by the server. */
  @IsString()
  @IsNotEmpty({ message: 'Type a group name' })
  @MaxLength(50)
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Say who is getting the order' })
  @MaxLength(40)
  buyerName: string;

  /** true = delivery (60 EGP split between everyone), false = pickup (0) */
  @IsOptional()
  @IsBoolean()
  delivery?: boolean;
}

export class UpdateGroupOrderDto {
  @IsOptional()
  @IsBoolean()
  delivery?: boolean;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Say who is getting the order' })
  @MaxLength(40)
  buyerName?: string;
}