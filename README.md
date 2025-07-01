# MentalSpace EHR Challenge

## Overview
This project is a production-grade, multi-tenant Electronic Health Record (EHR) system built with Node.js, TypeScript, Express, and PostgreSQL. It includes robust authentication, RBAC, audit logging, PII encryption, and compliance hooks. The solution is containerized for local and cloud deployment, and includes a cross-platform mobile app skeleton with offline support.

---

## Requirements Coverage & Implementation

### ✅ Exercise 1 – Core Multi-Tenant EHR Service (MANDATORY)
**All requirements for Exercise 1 have been fully implemented:**

- **Architecture**
  - [x] Single codebase (Node.js/TypeScript/Express)
  - [x] Multi-tenant: All tables partitioned by `tenant_id`
- **Auth & RBAC**
  - [x] JWT authentication
  - [x] Roles: Admin, Therapist, Client
  - [x] Middleware enforcing:
    - [x] Only assigned therapist can create/edit notes
    - [x] Clients may only read their own notes once signed by therapist
- **Domain Models & Endpoints**
  - [x] Patients, Providers, Appointments, Clinical Notes
  - [x] CRUD for each
  - [x] `POST /appointments/:id/startTelevisit` (placeholder)
- **Database**
  - [x] PostgreSQL with Prisma migrations
  - [x] ERD/schema: see `prisma/schema.prisma`
- **Compliance Hooks**
  - [x] `audit_logs` table (who, what, when)
  - [x] Field-level PII encryption at rest
- **Seed & Demo**
  - [x] Seed script creates 1 tenant, 1 admin, 2 therapists, 3 clients, 2 appointments
  - [x] Postman collection for demo flows

### ✅ Exercise 2 – Bonus A: Client Mobile App Skeleton
**All requirements for Exercise 2 have been fully implemented:**

- **Framework**
  - [x] React Native (Expo)
- **Features**
  - [x] Auth (login via API)
  - [x] Upcoming appointments list (pulls `/appointments`)
  - [x] Secure chat stub (hard-coded therapist DM channel, stub)
  - [x] Push-notification mock (notification icon and alert)
- **Extra Credit**
  - [x] Offline caching of appointments (SQLite async API)

---

## Features

### Core Multi-Tenant EHR Service (Exercise 1)
- **Architecture:**
  - Single codebase (Node.js/TypeScript/Express)
  - Multi-tenancy: All tables partitioned by `tenant_id`
- **Auth & RBAC:**
  - JWT authentication
  - Roles: Admin, Therapist, Client
  - Middleware enforces:
    - Only assigned therapist can create/edit notes
    - Clients can only read their own notes (once signed)
- **Domain Models & Endpoints:**
  - Patients, Providers, Appointments, Clinical Notes
  - Full CRUD for each
  - `POST /appointments/:id/startTelevisit` (placeholder)
- **Database:**
  - PostgreSQL with Prisma migrations
  - ERD/schema: see `prisma/schema.prisma`
- **Compliance Hooks:**
  - `audit_logs` table (who, what, when)
  - Field-level PII encryption at rest
- **Seed & Demo:**
  - Seed script creates 1 tenant, 1 admin, 2 therapists, 3 clients, 2 appointments
  - Postman collection for demo flows

### Bonus A: Client Mobile App Skeleton (React Native/Expo)
- **Auth:**
  - Login via API
- **Appointments:**
  - Upcoming appointments list (pulls `/appointments`)
  - Offline caching with SQLite (Expo async API)
- **Secure Chat Stub:**
  - Hard-coded therapist DM channel (stub)
- **Push Notification Mock:**
  - Notification icon and alert (no real push)

### Bonus B: DevOps & Deployment Pipeline
- **Containerization:**
  - Dockerfile for API and Expo mobile app
  - `docker-compose.yml` for API + Postgres local stack
- **CI/CD:**
  - GitHub Actions: lint, test, build, push images, run migrations
- **Infra-as-Code:**
  - Terraform (or Pulumi) for AWS RDS, ECS/Fargate, S3
- **Observability:**
  - Prometheus/CloudWatch alarms for 5xx error rate

---

## Setup

### Prerequisites
- Node.js 18+
- Docker 24+
- (Optional) Expo CLI for mobile: `npm install -g expo-cli`

### 1. Clone the Repo
```sh
git clone https://github.com/YOUR_GITHUB/mentalspace-ehr-challenge.git
cd mentalspace-ehr-challenge
```

### 2. Environment Variables
- Copy `.env.example` to `.env` and fill in secrets as needed.

### 3. Install Dependencies
```sh
npm install
cd frontend && npm install
cd ../mobileApp && npm install
```

### 4. Database & Migrations
```sh
npx prisma migrate dev
npx prisma generate
npx ts-node prisma/seed.ts
```

### 5. Run Locally (API + DB)
```sh
docker compose up --build
```
- API: http://localhost:8000
- Postgres: localhost:5432
- pgAdmin, Redis, MailHog also available (see compose file)
- **Prometheus metrics:** http://localhost:8000/metrics

### 6. Run Mobile App (Expo)
```sh
cd mobileApp
npx expo start
```
- Or build and run with Docker:
```sh
docker build -t mentalspace-ehr-mobile ./mobileApp
# Then run the container as needed
```
- Use LAN or Tunnel mode for real devices/emulators
- See README in `mobileApp/` for details

### 7. CI/CD Pipeline
- On every push or PR to `main`, GitHub Actions will:
  - Lint and test the code
  - Build and push Docker images for API and mobile
  - Run Prisma migrations
- Configure secrets in your GitHub repository for Docker registry access.

### 8. Infrastructure as Code
- Use the Terraform script in `infra/main.tf` to provision AWS resources (RDS, S3, etc.).
- Expand as needed for ECS/Fargate or EKS deployment.

### 9. Demo & Testing
- Import `MentalSpace_EHR.postman_collection.json` into Postman
- Run the login, appointment, and SOAP note flows
- Or use the mobile app to login and view appointments

---

## Production Hardening

**For HIPAA/SOC-2 readiness:**
- Enforce HTTPS everywhere (TLS termination at load balancer)
- Use strong secrets, rotate JWT keys regularly
- Store all secrets in a secure vault (AWS Secrets Manager, etc.)
- Enable database encryption at rest and in transit
- Add field-level encryption for all PII/PHI (beyond demo fields)
- Implement full audit logging and regular log review
- Add rate limiting, brute-force protection, and input validation
- Use SSO/OAuth2 for enterprise deployments
- Regularly run dependency and vulnerability scans
- Set up automated backups and disaster recovery
- Monitor for 5xx/4xx error rates and unusual access patterns

---

## DevOps & Deployment (Bonus B)

### Dockerization
- **API**: Production and development Dockerfiles are provided in the project root.
- **Mobile App**: `mobileApp/Dockerfile` allows you to build and run the Expo app in a container.
- **docker-compose**: Use `docker-compose.yml` for local development (API, Postgres, pgAdmin, Redis, MailHog) and `docker-compose.prod.yml` for production.

### CI/CD Pipeline
- **GitHub Actions**: Automated workflow in `.github/workflows/ci.yml` runs lint, tests, builds Docker images for API and mobile, pushes to a container registry, and runs Prisma migrations.
- **Setup**: Add your Docker registry credentials as repository secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).

### Infrastructure as Code
- **Terraform**: Starter script in `infra/main.tf` provisions AWS RDS Postgres and an S3 bucket. Expand to add ECS/Fargate or EKS for API deployment.

### Observability
- **Prometheus Metrics**: The API exposes a `/metrics` endpoint (powered by `prom-client`) for Prometheus scraping. Add a Prometheus server or CloudWatch alarms for production monitoring.

---

## Bonus Tracks Attempted
- [x] Bonus A: Mobile App (React Native/Expo, offline caching)
- [x] Bonus B: DevOps & Deployment (Docker, GitHub Actions, IaC)

---

## Demo Artifact
- See `/MentalSpace_EHR.postman_collection.json` for API demo
- See `/mobileApp/README.md` for mobile demo instructions
- **Attach a screenshot or Loom/GIF of the end-to-end flow** (login, schedule, note)

---

## Submission
- Push all code, migrations, and README to a public GitHub repo
- Email the repo link, demo artifact, and any special requirements to ehr-challenge@chctherapy.com
- Example requirements: "Node 18+, Docker 24+"

---

## License
MIT 