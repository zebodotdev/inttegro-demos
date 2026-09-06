class CheckoutsController < ApplicationController
  # INTTEGRO:FLOW [hosted-checkout] #create is the merchant-to-hosted-checkout
  # boundary described at
  # https://studio.inttegro.com/accept-payment-with-inttegro-checkout.
  # INTTEGRO:VERIFY [server-side-verification] #complete is a UX return, not
  # proof of payment. Look up the owner-scoped order server-side before
  # fulfillment and reconcile non-terminal states as documented at
  # https://studio.inttegro.com/webhooks.
  def new
    @attempt_id = SecureRandom.uuid
    @error_code = params[:code].to_s
    @error_message = params[:message].to_s
  end

  def create
    checkout = CheckoutService.parse(params.permit(:name, :email, :phone, :attempt_id).to_h)
    origin = ENV["INTTEGRO_DEMO_PUBLIC_URL"].presence || request.base_url.chomp("/")
    result = CheckoutService.create(checkout, origin)
    # INTTEGRO:DECISION [durable-order-correlation] This encrypted, HttpOnly
    # cookie is only a demo correlation aid. A production database must bind the
    # merchant cart, owner, Inttegro order ID, and idempotency key.
    cookies.encrypted[:inttegro_demo_order] = { value: result.fetch(:order_id), expires: 30.minutes.from_now, httponly: true, same_site: :lax, secure: request.ssl? }
    # INTTEGRO:DECISION [see-other-redirect] 303 follows the hosted URL with GET;
    # it does not replay this POST body as 307/308 would.
    redirect_to result.fetch(:checkout_url), allow_other_host: true, status: :see_other
  rescue CheckoutService::DemoError => error
    # INTTEGRO:SECURITY [safe-error-boundary] Only bounded public messages enter
    # the redirect. Detailed upstream errors remain in access-controlled logs.
    redirect_to root_path(code: error.code, message: error.message), status: :see_other
  end

  def complete
    @complete = true
    render :result
  end

  def cancel
    @complete = false
    render :result
  end
end
