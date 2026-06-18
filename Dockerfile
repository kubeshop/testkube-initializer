# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && sh -c 'for attempt in 1 2 3; do npm ci && exit 0; echo "npm ci failed (attempt ${attempt}/3), retrying..."; sleep $((attempt * 5)); done; exit 1'

ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ARG VITE_FEEDBACK_WEBHOOK_URL
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST
ENV VITE_FEEDBACK_WEBHOOK_URL=$VITE_FEEDBACK_WEBHOOK_URL

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
