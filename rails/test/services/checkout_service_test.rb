require "test_helper"

class CheckoutServiceTest < ActiveSupport::TestCase
  test "rejects invalid email" do
    error = assert_raises(CheckoutService::DemoError) do
      CheckoutService.parse("name" => "Akua", "email" => "bad", "phone" => "+233", "attempt_id" => "attempt_123")
    end
    assert_equal "validation_error", error.code
  end

  test "builds the shared order request" do
    checkout = CheckoutService::Checkout.new(name: "Akua", email: "akua@example.com", phone: "+233", attempt_id: "attempt_123")
    request = CheckoutService.order_params(checkout, "https://demo.example")
    assert_equal "demo-attempt_123", request.dig(:request_meta, :idempotency_key)
    assert_equal true, request[:finalize]
    assert_equal "https://demo.example/complete", request.dig(:checkout_settings, :redirect_url)
    assert_equal 5000, request.dig(:line_items, 0, :product, :price).value
  end
end
