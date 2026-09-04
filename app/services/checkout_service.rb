require "inttegro"
require "uri"

class CheckoutService
  Checkout = Data.define(:name, :email, :phone, :attempt_id)

  class DemoError < StandardError
    attr_reader :code

    def initialize(code, message)
      @code = code
      super(message)
    end
  end

  class << self
    def parse(values)
      checkout = Checkout.new(
        name: values.fetch("name", "").strip,
        email: values.fetch("email", "").strip,
        phone: values.fetch("phone", "").strip,
        attempt_id: values.fetch("attempt_id", "").strip
      )
      unless checkout.name.present? && checkout.phone.present? && checkout.email.match?(/\A[^\s@]+@[^\s@]+\.[^\s@]+\z/)
        raise DemoError.new("validation_error", "Enter a name, valid email, and phone number.")
      end
      unless checkout.attempt_id.match?(/\A[A-Za-z0-9_-]{8,100}\z/)
        raise DemoError.new("validation_error", "Start a fresh checkout and try again.")
      end
      checkout
    end

    def order_params(checkout, origin)
      {
        request_meta: { idempotency_key: "demo-#{checkout.attempt_id}" },
        customer_data: { name: checkout.name, email_address: checkout.email, phone_number: checkout.phone },
        finalize: true,
        checkout_settings: { redirect_url: "#{origin}/complete", cancel_url: "#{origin}/cancel" },
        line_items: [{
          type: "product",
          product: {
            type: Inttegro::ProductType::DIGITAL,
            name: "Inttegro integration workshop",
            quantity: 1,
            price: Inttegro::PriceParams.new(currency: Inttegro::Money::Currency::GHS, value: 5000)
          }
        }]
      }
    end

    def create(checkout, origin)
      uri = URI.parse(origin)
      unless %w[http https].include?(uri.scheme) && uri.host
        raise DemoError.new("configuration_error", "The demo public URL is invalid.")
      end
      api_key = ENV.fetch("INTTEGRO_API_KEY", "").strip
      raise DemoError.new("configuration_error", "Set INTTEGRO_API_KEY on the server.") if api_key.empty?

      public_origin = "#{uri.scheme}://#{uri.host}"
      public_origin += ":#{uri.port}" unless [80, 443].include?(uri.port)
      order = Inttegro::Client.new(api_key: api_key).orders.create(**order_params(checkout, public_origin))
      checkout_url = order.invoice&.format_value&.web&.url
      raise DemoError.new("api_error", "Inttegro did not return a hosted checkout URL.") if checkout_url.blank?
      { order_id: order.id, checkout_url: checkout_url }
    rescue DemoError
      raise
    rescue Inttegro::APIError
      raise DemoError.new("api_error", "Inttegro rejected the checkout request.")
    rescue StandardError
      raise DemoError.new("api_error", "Checkout is temporarily unavailable.")
    end
  end
end
