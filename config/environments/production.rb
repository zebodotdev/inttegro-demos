Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  # Hosted deployments terminate TLS at a trusted reverse proxy. Compose runs
  # directly on localhost, where forcing HTTPS would redirect to a TLS endpoint
  # that does not exist. Keep secure-by-default production behavior while
  # allowing the documented local container path to opt out explicitly.
  config.force_ssl = ENV.fetch("RAILS_FORCE_SSL", "true") == "true"
  config.public_file_server.enabled = true
end
