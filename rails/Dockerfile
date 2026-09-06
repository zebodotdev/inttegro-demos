FROM ruby:4.0.6-slim
ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_WITHOUT=development:test
WORKDIR /app
RUN apt-get update -qq \
    && apt-get install --no-install-recommends -y build-essential libyaml-dev \
    && rm -rf /var/lib/apt/lists/*
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .
RUN useradd --create-home --shell /bin/bash rails \
    && chown -R rails:rails /app
USER rails
EXPOSE 3006
CMD ["sh", "-c", "exec bin/rails server --binding 0.0.0.0 --port ${PORT:-3006}"]
