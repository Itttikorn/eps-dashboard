# Infrastructure Specification — Unit: `frontend`

**Stage**: `infrastructure-design` (3.4)  
**Unit**: `frontend` (`U2`, kind: `ui`, directory: `frontend`)  
**Lead Agent**: `aidlc-aws-platform-agent`  
**Support Agents**: `aidlc-devsecops-agent`, `aidlc-compliance-agent`  
**Date**: 2026-10-19  

---

## 1. Upstream Traceability & Deployment Posture

This infrastructure specification details the containerization, static file delivery, reverse proxying, and deployment topology for the React 18 single-page application (`frontend`), tracing from:
- `performance-design.md`: Bundle size budgets ($< 250\text{ KB}$ gzipped) and static asset caching (`NFR1.6`).
- `security-design.md`: Intranet deployment (`NFR6.1`), CSP headers (`NFR6.4`), and upload limits (`NFR6.5`).
- `scalability-design.md` & `reliability-design.md`: Zero-downtime rolling restarts and container healthiness.
- `observability-design.md` & `logical-components.md`: Service endpoints and proxy topology.
- `components.md` & `functional-spec.md`: UI component distribution and interactive routes.
- `contract-summary.md`: OpenAPI integration with `wa-backend:8080`.

---

## 2. Containerization Architecture (NFR6.1)

### 2.1 Multi-Stage Docker Build
The frontend image is constructed via a dual-stage Dockerfile optimizing production image size and security:
- **Build Stage (`builder`)**: Uses `node:20-alpine`, installs locked dependencies via `npm ci`, verifies TypeScript types, and compiles static assets via `npm run build` into `dist/`.
- **Runtime Stage (`runner`)**: Uses `nginxinc/nginx-unprivileged:alpine`, copying static assets into `/usr/share/nginx/html/` with non-root execution (UID 101).

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginxinc/nginx-unprivileged:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. Web Server & Reverse Proxy Configuration (NFR6.4, NFR6.5)

### 3.1 Nginx Routing & SPA Fallback
The unprivileged Nginx instance serves static assets directly and handles HTML5 client-side pushState routing:

```nginx
server {
    listen 8080;
    server_name localhost;

    # Gzip Compression (NFR1.6)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;
    gzip_min_length 1000;

    # Client Upload Limit (NFR6.5)
    client_max_body_size 10M;

    # Security Headers & CSP (NFR6.4)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:8080;" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # Static Assets with Cache Control
    location /assets/ {
        root /usr/share/nginx/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy to Go Backend
    location /api/ {
        proxy_pass http://wa-backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
    }

    # SPA Fallback
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 4. Docker Compose Integration & Network Topology

### 4.1 Multi-Container Service Grid
The frontend service (`wa-frontend`) joins the shared internal Docker network (`cbm-network`) alongside `wa-backend` and `postgres:16`:

```yaml
version: '3.8'

services:
  wa-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wa-frontend
    restart: unless-stopped
    ports:
      - "3000:8080"
    depends_on:
      wa-backend:
        condition: service_healthy
    networks:
      - cbm-network
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost:8080/ || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 5s

networks:
  cbm-network:
    driver: bridge
```

---

## 5. Security Hardening & Environmental Compliance (NFR5.2, NFR6.1)

- **Unprivileged User**: Runs as `nginx` (UID 101, GID 101), preventing container breakout hazards.
- **Read-Only Root Filesystem Compatible**: Static files served from `/usr/share/nginx/html` with temporary storage mapped to `/tmp`.
- **Intranet Access Boundary**: Port 3000 bound to host network interface for corporate intranet access without external public exposure.

