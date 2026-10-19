# Multi-stage Dockerfile for eps-dashboard Go backend
# Stage 1: Build binary statically
FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w -extldflags '-static'" \
    -o /app/bin/server .

# Stage 2: Minimal hardened unprivileged runner
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -g 10001 -S appuser \
    && adduser -u 10001 -S appuser -G appuser

COPY --from=builder /app/bin/server /app/server

USER appuser:appuser

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O- http://localhost:8080/api/v1/health || exit 1

ENTRYPOINT ["/app/server"]

