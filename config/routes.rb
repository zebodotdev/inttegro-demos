Rails.application.routes.draw do
  root "checkouts#new"
  post "/checkout", to: "checkouts#create"
  get "/complete", to: "checkouts#complete"
  get "/cancel", to: "checkouts#cancel"
  get "/health", to: proc { [200, { "content-type" => "application/json" }, ['{"status":"ok","demo":"rails"}']] }
end
