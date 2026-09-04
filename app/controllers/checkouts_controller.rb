class CheckoutsController < ApplicationController
  def new
    @attempt_id = SecureRandom.uuid
    @error_code = params[:code].to_s
    @error_message = params[:message].to_s
  end

  def create
    checkout = CheckoutService.parse(params.permit(:name, :email, :phone, :attempt_id).to_h)
    origin = ENV["INTTEGRO_DEMO_PUBLIC_URL"].presence || request.base_url.chomp("/")
    result = CheckoutService.create(checkout, origin)
    cookies.encrypted[:inttegro_demo_order] = { value: result.fetch(:order_id), expires: 30.minutes.from_now, httponly: true, same_site: :lax, secure: request.ssl? }
    redirect_to result.fetch(:checkout_url), allow_other_host: true, status: :see_other
  rescue CheckoutService::DemoError => error
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
