# frozen_string_literal: true

source "https://rubygems.org"

gem "jekyll", "~> 4.4"

group :jekyll_plugins do
  gem "jekyll-paginate", "~> 1.1"
  gem "jekyll-seo-tag", "~> 2.8"
end

# Ruby 3.4+ 에서 기본 gem 에서 빠진 것들
gem "webrick", "~> 1.9"
gem "csv"
gem "base64"
gem "bigdecimal"
gem "logger"

platforms :windows, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end
