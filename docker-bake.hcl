variable "VITE_POSTHOG_KEY"  { default = "" }
variable "VITE_POSTHOG_HOST" { default = "" }

group "default" {
  targets = ["initializer"]
}

target "initializer-meta" {}
target "initializer" {
  inherits   = ["initializer-meta"]
  context    = "."
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64", "linux/arm64"]
  args = {
    VITE_POSTHOG_KEY  = "${VITE_POSTHOG_KEY}"
    VITE_POSTHOG_HOST = "${VITE_POSTHOG_HOST}"
  }
}
