import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../entities/payment.entity';

export class PaymentResponseDto {
  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  initPoint: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;
}
