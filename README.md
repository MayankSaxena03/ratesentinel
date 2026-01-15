# RateSentinel 🚦
**Production-Grade API Rate Limiting & Abuse Protection Platform**

RateSentinel is a centralized backend platform designed to sit in front of APIs and make **real-time decisions** on whether incoming requests should be **allowed, throttled, or blocked**.

The system is built with a strong focus on **correctness, performance, and operational reliability**, and mirrors how rate limiting and abuse protection systems are implemented in real-world SaaS and platform companies.

This project is intentionally engineered to be **resume-grade**, **interview-defensible**, and **production-oriented**, rather than a demo or toy implementation.

---

## Why RateSentinel Exists

APIs are vulnerable to multiple classes of abuse:
- Traffic spikes and burst attacks
- Misused or leaked API keys
- Bots generating excessive errors
- Clients ignoring HTTP 429 responses
- Runaway integrations and faulty scripts

RateSentinel addresses these problems by enforcing limits **within milliseconds**, using Redis-backed algorithms, while maintaining a complete audit trail and observability surface.

---

## Core Responsibilities

RateSentinel performs the following responsibilities for every request:

1. Identifies the caller (tenant, user, API key, IP)
2. Applies rate-limiting rules in real time
3. Handles burst traffic independently from long-term quotas
4. Detects repeated violations and abuse patterns
5. Blocks or throttles offenders with TTL-based rules
6. Logs decisions for audit and replay
7. Exposes metrics for operational visibility

All enforcement logic is designed to be **fast, deterministic, and side-effect free**.

---

## High-Level Architecture

```
Client
  |
  v
RateSentinel API (NestJS, ECS Fargate)
  |
  |-- Redis (ElastiCache)  -> Rate limits, counters, blocks
  |
  |-- MySQL (RDS)          -> Tenants, users, APIs, logs
  |
  |-- Prometheus Metrics  -> /metrics endpoint
```

A separate **worker service** consumes Redis-backed queues to process audit logs and abuse detection asynchronously.

---

## Key Design Decisions

### Multi-Tenancy by Default
- Every request is scoped to a tenant
- Strict tenant isolation enforced at guard and service layers
- No cross-tenant data access is possible

### Redis-First Enforcement
- Redis is the single source of truth for:
  - Token buckets
  - Sliding windows
  - Burst counters
  - Temporary blocks
- Decisions are made without hitting the database

### Fail-Fast Infrastructure Clients
- Redis and database clients are configured to fail fast
- Infinite retries are explicitly disabled
- Hanging requests are treated as bugs, not features

### Explicit Bootstrap Flow
- Tenant creation atomically creates a default admin user
- Bootstrap routes are explicitly marked public
- All other routes are secure-by-default

---

## Rate Limiting Algorithms

RateSentinel uses **multiple complementary algorithms**:

### Token Bucket
- Enforces long-term quotas (per minute / hour / day)
- Smooth refill behavior
- Stored entirely in Redis

### Sliding Window
- Enforces short-term request density
- Prevents request bursts at window boundaries

### Repeated 429 Detection
- Tracks clients that repeatedly ignore throttling
- Automatically escalates to temporary blocks

All algorithms are implemented using **Lua scripts** to guarantee atomicity.

---

## Observability & Operations

### Health Checks
```
GET /health
```
Used by ECS and load balancers to verify liveness.

### Metrics
```
GET /metrics
```
Prometheus-compatible metrics exposed, including:
- Total allowed requests
- Total throttled requests
- Total blocked requests
- Redis latency measurements

### Logs
- All application logs are streamed to CloudWatch
- Block and throttle decisions are persisted for audit

---

## Project Structure (Monorepo)

```
apps/
├── api/
│   ├── auth, tenants, users
│   ├── gateway (entry point)
│   ├── rate-limit engine & guards
│   ├── metrics & health modules
│   └── Dockerfile
│
└── worker/
    ├── audit processors
    ├── abuse detection processors
    ├── Redis queues (BullMQ)
    └── Dockerfile
```

Each service is independently deployable and follows the same infrastructure patterns.

---

## Local Development

### Requirements
- Node.js 18+
- Docker & Docker Compose

### Setup
```bash
git clone https://github.com/MayankSaxena03/ratesentinel.git
cd ratesentinel

cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env

docker-compose up -d
```

### Start API
```bash
cd apps/api
npm install
npm run start:dev
```

---

## AWS Deployment Overview

- Docker images stored in **Amazon ECR**
- Services run on **ECS Fargate**
- Redis provided via **ElastiCache (node-based)**
- MySQL provided via **RDS**
- Logs via **CloudWatch**
- Metrics scraped from ECS tasks

Configuration is injected via ECS task definitions (no secrets in code).

---

## Security & Safety

- No secrets committed to Git
- Environment files are ignored
- VPC-isolated Redis and MySQL
- Security Groups strictly control service access
- Public endpoints are explicitly annotated

---

## What This Project Demonstrates

- Designing for abuse, not just happy paths
- Real-world Redis usage beyond caching
- AWS networking and security group correctness
- Multi-tenant backend design
- Production-safe failure handling
- Observable, operable services

---

## Author

**Mayank Saxena**  
GitHub: https://github.com/MayankSaxena03

---

This project is built for learning, demonstration, and evaluation purposes.
