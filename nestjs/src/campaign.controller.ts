import { All, Body, Controller, Get, Headers, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

import { CheckoutService, DemoError } from './checkout.service.js';
import { homePage, resultPage } from './pages.js';

// INTTEGRO:FLOW [checkout-presentation] This controller builds one finalized
// Order for hosted-page, embedded, and modal Checkout described at
// https://studio.inttegro.com/accept-payment-with-inttegro-checkout; the
// injected service owns trusted catalog and Order work.
@Controller()
export class CampaignController {
  constructor(private readonly checkout: CheckoutService) {}

  @Get()
  home(
    @Query('code') code: string | undefined,
    @Query('message') message: string | undefined,
    @Res() response: Response,
  ) {
    response.type('html').send(
      homePage(randomUUID().replaceAll('-', ''), code && message ? { code, message } : undefined),
    );
  }

  @Post('checkout')
  async createContribution(
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const wantsJson = request.headers.accept?.includes('application/json') ?? false;
    if (wantsJson) response.set('Cache-Control', 'no-store');
    try {
      const requestOrigin = `${request.protocol}://${request.get('host') ?? 'localhost:3013'}`;
      const result = await this.checkout.createHostedCheckout(body, requestOrigin);
      response.cookie('inttegro_demo_order', result.orderId, {
        httpOnly: true,
        maxAge: 30 * 60 * 1000,
        sameSite: 'lax',
        secure: request.secure,
      });
      if (wantsJson) {
        response.status(201).json({ orderId: result.orderId });
      } else {
        // INTTEGRO:DECISION [see-other-redirect] A 303 follows checkout with GET;
        // 307 or 308 would preserve POST and could replay supporter form data.
        response.redirect(303, result.checkoutUrl);
      }
    } catch (error) {
      const publicError = error instanceof DemoError
        ? error
        : new DemoError('api_error', 'Contributions are temporarily unavailable.');
      if (wantsJson) {
        response.status(publicError.code === 'validation_error' ? 400 : 503).json({
          code: publicError.code,
          message: publicError.message,
        });
        return;
      }
      response.redirect(
        303,
        `/?${new URLSearchParams({ code: publicError.code, message: publicError.message })}`,
      );
    }
  }

  @Get('complete')
  complete(@Res() response: Response) {
    // INTTEGRO:VERIFY [server-side-verification] This browser return is not
    // proof of payment. Fulfillment and campaign totals belong behind verified
    // webhook/order state in the fundraising service's durable data store.
    response.type('html').send(resultPage('complete'));
  }

  @Get('cancel')
  cancel(@Res() response: Response) {
    response.type('html').send(resultPage('cancel'));
  }

  @Get('health')
  health() {
    return { status: 'ok', demo: 'nestjs' };
  }

  @All('*path')
  notFound(@Headers('accept') accept: string | undefined, @Res() response: Response) {
    if (accept?.includes('text/html')) response.status(404).type('html').send(resultPage('not-found'));
    else response.status(404).json({ code: 'not_found' });
  }
}
