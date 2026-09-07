import { Module } from '@nestjs/common';

import { CampaignController } from './campaign.controller.js';
import { CheckoutService } from './checkout.service.js';

@Module({
  controllers: [CampaignController],
  providers: [CheckoutService],
})
export class AppModule {}
