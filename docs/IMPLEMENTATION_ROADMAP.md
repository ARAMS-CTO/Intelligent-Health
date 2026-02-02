# Intelligent Health - Master Implementation Roadmap

This document tracks the progress of upgrading the Intelligent Health platform to a production-grade, cloud-native application.

## Phase 1: Infrastructure & Persistence (Foundational)
- [ ] **1. Cloud SQL Integration (PostgreSQL)**
    - *Goal*: Replace ephemeral SQLite/Memory state with managed PostgreSQL.
    - *Tasks*: 
        - Update `database.py` for Cloud SQL Connector.
        - Add PostgreSQL drivers to `requirements.txt`.
        - Migrate In-Memory Blockchain/Token state to SQL Models.
- [ ] **2. Google Cloud Storage Integration**
    - *Goal*: Persistent file storage for medical records/uploads.
    - *Tasks*:
        - Implement `StorageService` using `google-cloud-storage`.
        - Update file upload routes to use GCS buckets.
- [ ] **3. Security Hardening**
    - *Goal*: Secure data access.
    - *Tasks*:
        - Implement Role-Based Access Control (RBAC) middleware for data routes.
        - Ensure all Database/Storage calls verify `user_id`.

## Phase 2: Blockchain & Smart Contracts (Concordium)
- [ ] **4. Real Smart Contracts**
    - *Goal*: Move from simulated Python logic to real Rust smart contracts.
    - *Tasks*:
        - Write `access_control.rs` (Record permissions).
        - Write `token_economy.rs` (Rewards).
        - Update `ConcordiumService` to use gRPC/HTTP-RPC for contract calls.
        - Create deployment scripts for Testnet.

## Phase 3: AI & Scalability
- [ ] **5. AI Optimization (Google Cloud)**
    - *Goal*: Scalable AI with advanced context resilience.
    - *Tasks*:
        - Implement "Advanced Chunking/Re-ranking" for RAG.
        - Migrate Vector Store from local files to `pgvector` (Postgres) or Cloud Vector Search.
- [ ] **6. Scalability & Cloud Run Tuning**
    - *Goal*: Ensure container starts reliably and scales.
    - *Tasks*:
        - Optimize Docker image size.
        - Tune Gunicorn workers/threads.
        - Verify graceful shutdown/startup.

## Phase 4: Features & Testing
- [ ] **7. Orthopedics Module**
    - *Goal*: Complete the UI/UX for the Orthopedics dashboard.
    - *Tasks*:
        - Build `OrthopedicsDashboard.tsx`.
        - Integrate with Body Map.
- [ ] **8. End-to-End Testing**
    - *Goal*: Automated verification of critical flows.
    - *Tasks*:
        - Set up Playwright/Cypress.
        - Write tests for "Patient Login -> Check Records -> Chat with Agent".

---

## Current Focus: Phase 1 (Infrastructure)
Initializing database and storage upgrades to solve "State Volatility" and "Deployment Failures" first.
