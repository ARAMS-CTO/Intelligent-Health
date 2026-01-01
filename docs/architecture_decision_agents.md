# Architectural Decision Record: Agent Orchestration vs. Microservices

## Context
The user suggested splitting agents (Doctor, Patient, Nurse) into separate microservices with an orchestrator.

## Analysis
### Option 1: Full Microservices
- **Pros:** Independent scaling, strict isolation, technology agnosticism per agent.
- **Cons:** 
  - Massive Dev/Ops overhead (Docker Compose, K8s, networking).
  - Latency in IPC (Inter-Process Communication).
  - Code duplication (shared models/utils require private packages).
  - Overkill for current MVP/Prototype stage.
  - "Distributed Monolith" risk.

### Option 2: Modular Monolith with Agent Bus (Recommended)
- **Concept:** Use the existing `AgentBusService` as the internal "Orchestrator".
- **Structure:**
  - `server/agents/nurse_agent.py`: Class encapsulating Nurse logic.
  - `server/agents/doctor_agent.py`: Class for Doctor logic.
  - `server/agents/orchestrator.py`: Managing task delegation.
- **Pros:**
  - Fast development velocity.
  - Shared memory/database access (efficient).
  - Easy to extract into microservices later (just wrap the Class in a FastAPI app).
  - Zero network latency for agent-to-agent talk.

## Decision
Adopt **Option 2**. We will evolve the `AgentBus` into a formal Orchestrator that manages distinct Agent Classes. This provides the "feel" and logical separation of microservices without the infrastructure headache.

## Implementation Steps
1.  Refactor `server/services/agent_bus.py` to support "Agent Registration".
2.  Create `server/agents/` directory.
3.  Implement `BaseAgent` class (standard interface).
4.  Mistral/Gemini can act as the "Router" within the Orchestrator to dispatch tasks to the correct sub-agent.
