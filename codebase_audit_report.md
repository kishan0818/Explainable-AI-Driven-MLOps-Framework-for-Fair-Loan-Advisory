# Codebase Audit Report
**Project Name:** Explainable AI Driven MLOps Framework for Fair and Inclusive Loan Advisory  
**Date of Audit:** August 11, 2026

---

## PART 1 — COMPLETE PROJECT MAP

This map cataloges the components implemented in the repository, their exact files, key functions, and current implementation status.

| Component | Purpose | Exact File(s) | Key Classes/Functions | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React SPA portal for user applications, chat, admin monitoring, and simulators. | - [page.tsx](file:///d:/TWXAI_integ/app/page.tsx)<br>- [user/dashboard/page.tsx](file:///d:/TWXAI_integ/app/user/dashboard/page.tsx)<br>- [admin/dashboard/page.tsx](file:///d:/TWXAI_integ/app/admin/dashboard/page.tsx)<br>- [government-schemes/page.tsx](file:///d:/TWXAI_integ/app/government-schemes/page.tsx) | `LoginPage`, `UserDashboard`, `AdminDashboardPage` | **Implemented** |
| **Backend** | Fast API router providing loan risk scoring, chat endpoints, auth verify, and logs. | - [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py) | `lifespan`, `login`, `chat_endpoint`, `analyze_application`, `verify_token` | **Implemented** |
| **ML/Model Code** | Implements standard and adaptive models, preprocessing, scaling, SMOTE, and metrics curves. | - [train_xgboost.py](file:///d:/TWXAI_integ/TWXAI_backend/train_xgboost.py)<br>- [train_adaptive_model.py](file:///d:/TWXAI_integ/TWXAI_backend/train_adaptive_model.py)<br>- [model_evaluation.py](file:///d:/TWXAI_integ/TWXAI_backend/model_evaluation.py)<br>- [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py) | `XGBoostTrainer`, `AdaptiveModelTrainer`, `ModelEvaluator`, `load_and_preprocess` | **Implemented** |
| **Database** | Stores transactional applications, bank suitabilities, registry models, and events. | - [model_registry_setup.sql](file:///d:/TWXAI_integ/TWXAI_backend/model_registry_setup.sql)<br>- [fix_db_constraint.sql](file:///d:/TWXAI_integ/TWXAI_backend/fix_db_constraint.sql) | Tables: `model_registry`, `mlops_logs`, `loan_applications`, `analysis_results`, `bank_suitability` | **Implemented** |
| **LLM Integrations** | Powers the chat interface using NVIDIA API completions. | - [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L301) | `call_llm_api` | **Implemented** (Requires env key) |
| **RAG Pipeline** | Contextual search for schemes and rules using keyword lookup. | - [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L248) | `search_knowledge_base` | **Partial** (No Vector index/embeddings) |
| **Vector Database** | Semantic retrieval using vector similarity. | None | N/A | **Not Implemented** |
| **External APIs** | reCAPTCHA validation and Google SERP search for url resolution. | - [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L52)<br>- [search_recovery.py](file:///d:/TWXAI_integ/TWXAI_backend/search_recovery.py#L16) | `verify_recaptcha`, `SearchRecovery.find_new_url` | **Implemented** |
| **Scheduled Jobs** | Automated background loops for scraping or monitoring. | - [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L1355) | `trigger_regulatory_audit_api` (Uses FastAPI `BackgroundTasks`) | **Partial** (API-triggered, not cron-scheduled) |
| **Background Workers** | Process heavy computations asynchronously (e.g. Celery). | None | N/A | **Not Implemented** |
| **Monitoring** | Gathers changes, hashes, and availability of regulatory pages. | - [regulatory_monitor.py](file:///d:/TWXAI_integ/TWXAI_backend/regulatory_monitor.py#L14)<br>- [validator.py](file:///d:/TWXAI_integ/TWXAI_backend/validator.py#L11) | `RegulatoryMonitor.process_schemes`, `RegulatoryValidator.check_url` | **Implemented** |
| **Retraining Pipeline** | Automated retraining based on performance drop or drift alerts. | - [train_adaptive_model.py](file:///d:/TWXAI_integ/TWXAI_backend/train_adaptive_model.py#L17) | `AdaptiveModelTrainer` | **Partial** (Manual CLI execution required) |
| **Fairness Pipeline** | Monitored demographic parity differences and disparate impact indices. | - [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py#L118) | `FairnessMonitor` | **Implemented** |
| **Drift Detection** | Computes KL Divergence on numerical features to verify shifts. | - [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py#L65) | `DriftDetector` | **Implemented** |
| **Explainability** | Tree SHAP initialization to explain model variables. | - [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py#L167) | `DualModelController` (Instantiates `shap.TreeExplainer`) | **Partial** (Runs in code but values aren't saved/rendered in UI) |
| **Auth & Security** | Login guards, JWT generation, admin roles, and reCAPTCHA. | - [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L478)<br>- [page.tsx](file:///d:/TWXAI_integ/app/page.tsx) | `login`, `verify_token` | **Implemented** |
| **Docker & CI/CD** | Multi-container setup for local/cloud orchestrations. | - [Dockerfile](file:///d:/TWXAI_integ/Dockerfile)<br>- [TWXAI_backend/Dockerfile](file:///d:/TWXAI_integ/TWXAI_backend/Dockerfile)<br>- [docker-compose.yml](file:///d:/TWXAI_integ/docker-compose.yml) | N/A | **Implemented** |
| **Environment Vars** | Configuration of secrets, API endpoints, and Supabase connections. | - [.env](file:///d:/TWXAI_integ/.env) | N/A | **Implemented** |
| **Logging** | MLOps and regulatory history capture. | - [governance.py](file:///d:/TWXAI_integ/TWXAI_backend/governance.py#L13) | `GovernanceManager.log_action` | **Implemented** |
| **Tests** | Functional validation suites for backend, XAI, and frontend. | - [test_xai_backend.py](file:///d:/TWXAI_integ/test_xai_backend.py)<br>- [test_integration.py](file:///d:/TWXAI_integ/test_integration.py)<br>- [test_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/test_backend.py) | N/A | **Implemented** |

---

## PART 2 — CURRENT AI/ML PIPELINE

The diagram below traces the actual execution flow implemented in the project.

```
       [ User Input ]  -->  [ Next.js Multi-step Form UI ]
                                        ↓ (POST Request /analyze-application)
                               [ fastapi_backend.py ]
                                        ↓
                              [ Preprocessing / Encoding ]
                                        ↓
                             [ mlops_pipeline.py ]
                                        ↓
                       [ DualModelController.predict() ]
                       ├─► [ DriftDetector.compute_drift() ] ──────┐
                       │                                           ▼
                       │                      If drift > 0.1 and candidate exists
                       │                                   [ Swap Model ]
                       │                                           ▼
                       ├─► [ Standard XGBoost ] ──► [ Candidate Adaptive Model ]
                       ├─► [ TreeExplainer.shap_values() ]
                       └─► [ FairnessMonitor.update() ] 
                                        ↓
                             [ fastapi_backend.py ]
                       ├─► [ calculate_risk() ] (Deterministic Credit Score & DTI Guardrails)
                       ├─► [ evaluate_banks() ] (Seeded Bank Profile Suitability Check)
                       ├─► [ evaluate_rules() ] (Hard & Soft JSON Eligibility Rules Check)
                       ├─► [ evaluate_schemes() ] (Scheme Rules and Fallback Categories Match)
                       ├─► [ generate_improvements() ] (Borderline DTI/Credit/Income Advice)
                       ├─► [ build_explanation() ] (Excludes inclusion rules from negative factors)
                       └─► [ DB Write ] (Persist Apps, Results, Banks, Rules to Supabase tables)
                                        ↓
                             [ Final JSON Response ]  -->  [ User Dashboard UI ]
```

### ML Pipeline Specifications
*   **Dataset:** [loan_default_data.csv](file:///d:/TWXAI_integ/TWXAI_backend/loan_default_data.csv) (Size: 25.09 MB, 255,347 records, features: 18 columns).
*   **Features Used (16):** `Age`, `Income`, `LoanAmount`, `CreditScore`, `MonthsEmployed`, `NumCreditLines`, `InterestRate`, `LoanTerm`, `DTIRatio`, `Education`, `EmploymentType`, `MaritalStatus`, `HasMortgage`, `HasDependents`, `LoanPurpose`, `HasCoSigner`.
*   **Target Variable:** `Default` (Class Imbalance: `90.4%` Non-default / `9.6%` Default, ratio: `1:9.42`).
*   **Train/Test Split:** `80%` train / `20%` test split, stratified using `random_state=42`.
*   **Preprocessing:** Imputation (Median for numeric, Mode for categorical), `LabelEncoder` for string categorical variables, and `StandardScaler` scaling.
*   **SMOTE:** Executed inside [train_xgboost.py](file:///d:/TWXAI_integ/TWXAI_backend/train_xgboost.py#L70) during training to handle the class imbalance.
*   **Models Utilized:** 
    *   **Primary:** XGBoost model saved as `xgboost_smote.json` inside the [results_rf_smote_controlled_pca1_wocs/models](file:///d:/TWXAI_integ/TWXAI_backend/results_rf_smote_controlled_pca1_wocs/models) folder.
    *   **Candidate:** Adaptive XGBoost model saved as `xgboost_adaptive.json` trained on noisy data ([synthetic_loans_noisy.csv](file:///d:/TWXAI_integ/TWXAI_backend/synthetic_loans_noisy.csv)).
    *   **Legacy Fallback:** Random Forest model saved as `rf_smote_model.joblib`.
*   **Threshold Selection:** The baseline model uses `0.50` decision threshold. System evaluation in `final_results/run_config.json` recommends tuning this to `0.20` to optimize the F1 Score while maintaining a Recall $\ge 44\%$.
*   **Explainability:** Features are attribution-analyzed via Tree SHAP. Positive/negative factors are rendered in the dashboard.
*   **Fairness:** Age demographic parity differences (Age < 30 vs Age $\ge$ 30) are calculated. If the disparity ratio is $< 0.8$, a database log warning is inserted.
*   **Drift Detection:** Calculated in real-time on numerical columns of incoming batches via KL Divergence against training references.
*   **RAG Engine:** Simple word-token split matching. Queries the local [rules.json](file:///d:/TWXAI_integ/TWXAI_backend/rules.json) and [schemes.json](file:///d:/TWXAI_integ/TWXAI_backend/schemes.json) database.
*   **Chatbot:** Receives a query, retrieves JSON rule/scheme context chunks, constructs a system prompt, and calls the NVIDIA `openai/gpt-oss-20b` endpoint.

---

## PART 3 — EXISTING AGENTIC COMPONENTS

The codebase was analyzed to determine if agentic capabilities exist.

1.  **Planner:** ❌ **Not implemented**
2.  **Tool calling:** ❌ **Not implemented**
3.  **At least two tools:** ❌ **Not implemented**
4.  **Memory/state:** ❌ **Not implemented** (Chatbot endpoint has no history/state handling; it runs single-turn).
5.  **Retry:** ❌ **Not implemented**
6.  **Reflection:** ❌ **Not implemented**
7.  **Human approval:** ❌ **Not implemented**
8.  **Structured output:** ❌ **Not implemented** (LLM response is a raw string; validation is only done on input parameters).
9.  **Error handling:** 🟡 **Partially implemented**
    *   *Mechanism:* Try-catch blocks wrap the models and DB pipelines. If the standard model or database connection fails, the system logs the issue and falls back to default rates or neutral scores.
    *   *Exact File:* [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py) lines 1059-1163 and 1248-1262.
10. **Logging:** ✅ **Fully implemented**
    *   *Mechanism:* Every model swap, drift alert, or database write is logged. System activities are tracked in the Supabase `mlops_logs` table. Regulatory audits are logged to `regulatory_audit_log.csv` via the `GovernanceManager` helper.
    *   *Exact File:* [governance.py](file:///d:/TWXAI_integ/TWXAI_backend/governance.py#L28) (`log_action` function) and [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py#L52) (`log_event` function).
11. **Conditional routing:** 🟡 **Partially implemented**
    *   *Mechanism:* The `DualModelController` routes incoming inference requests. If the computed feature drift score exceeds the threshold (`0.1`), it routes predictions to the candidate adaptive model (`xgboost_adaptive.json`) and triggers a `model_switch` log event.
    *   *Exact File:* [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py#L297) (within `predict` function).
12. **Parallel execution:** ❌ **Not implemented**
13. **Multi-agent architecture:** ❌ **Not implemented**

---

## PART 4 — WHICH EXISTING COMPONENTS SHOULD BECOME AGENTS?

To avoid unnecessary complexity, only components that benefit from dynamic reasoning, planning, or external API interaction should be converted to agents. Here is the evaluation of potential candidates:

### 1. Loan Advisory Chatbot Agent (Candidate J)
*   **Should this actually be an agent?** **YES**
*   **Why?** The current chatbot uses single-turn RAG. An agent can interpret user queries, call tools to search local files, query user application statuses, fetch external web references, and dynamically route tasks.
*   **Goal:** Provide grounded, compliant advice about loan eligibility, schemes, and guidelines.
*   **Tools:** Scheme Search, Rule Check, Application Status Lookup, External Web Search.
*   **Input:** Chat message history and the applicant's profile ID.
*   **Output:** Grounded responses referencing official regulations, with citations.
*   **Memory/State:** Thread conversational history.
*   **Deterministic Decisions:** None (entirely advisory).
*   **Delegated LLM Decisions:** Formatting responses, mapping intents to tools, and drafting summaries.
*   **Failure Cases:** Hallucinating regulatory guidelines, tool timeout, or conversational loops.
*   **Value Add:** High. Improves user interaction by replacing template matching with structured tool usage.

### 2. RAG Research & Web Search Agent (Combined D & E)
*   **Should this actually be an agent?** **YES** (merged into a single information gathering agent)
*   **Why?** The system needs to retrieve information from internal documents (local schemes JSON database) and external search engines (RBI circular updates via SerpApi). A unified research agent handles this routing.
*   **Goal:** Fetch and summarize regulatory information from internal or external sources.
*   **Tools:** Vector DB Retriever, SerpApi Google Search, Web Scraper.
*   **Input:** Search query or raw question.
*   **Output:** Context summaries with official URLs.
*   **Memory/State:** Query context.
*   **Deterministic Decisions:** Document indexing and raw similarity threshold filtering.
*   **Delegated LLM Decisions:** Formulating search queries and merging multiple text sources.
*   **Failure Cases:** Scraping blocked domains or parsing unformatted PDFs.
*   **Value Add:** High. Automates regulatory search.

### Deterministic Components (Should NOT become Agents)
*   **Loan Assessment (Candidate A):** Must remain a deterministic pipeline. ML default probability must be calculated directly, and guardrail rules (DTI/Credit Score) must be hard-coded to ensure regulatory compliance and prevent LLM halluncinations.
*   **XAI Explanation (Candidate C):** Attributions must be calculated mathematically using SHAP/LIME. The LLM should only translate these raw values into user-friendly summaries.
*   **Fairness and Drift (Candidates F, G, H, I):** Calculating KL divergence, Demographic Parity, and training models are mathematical procedures. They must remain deterministic to ensure auditability.

---

## PART 5 — DESIGN THE IDEAL AGENTIC WORKFLOW

Based on the audit, the diagram below illustrates a clean agentic design. It separates deterministic mathematical operations from the LLM reasoning loop.

```
                         [ User Query ]
                               │
                               ▼
            ┌─────────────────────────────────────┐
            │   Loan Advisory Chatbot Agent       │◄─── [ Conversational Memory ]
            │   (Planner / Router LLM)            │
            └──────────────────┬──────────────────┘
                               │
                 Routes to appropriate tools
                               │
        ┌──────────────────────┼──────────────────────┬──────────────────────┐
        ▼                      ▼                      ▼                      ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ Database Tool │      │ XGBoost Model │      │  RAG Search   │      │ SerpApi Search│
│(Deterministic)│      │(Deterministic)│      │  (Vector DB)  │      │    (Web)      │
├───────────────┤      ├───────────────┤      ├───────────────┤      ├───────────────┤
│ Query user    │      │ Predict risk  │      │ Search local  │      │ Google search │
│ loan history  │      │ probability & │      │ rules/schemes │      │ for latest RBI│
│ from Supabase │      │ run SHAP XAI  │      │ documents     │      │ guidelines    │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │                      │
        └──────────────────────┼──────────────────────┴──────────────────────┘
                               │
                       [ Raw Outputs ]
                               │
                               ▼
            ┌─────────────────────────────────────┐
            │     Structured Response Agent       │
            │     (Pydantic Output Guardrail)     │
            └──────────────────┬──────────────────┘
                               │
                               ▼
                  [ Validated JSON Response ]
```

### Allocation of Responsibilities
*   **LLM Responsibilities:**
    1.  Parse user intent and determine which tools to call.
    2.  Extract search parameters and query terms from user messages.
    3.  Summarize raw contexts retrieved from RAG or external searches.
    4.  Translate mathematical SHAP attributions into user-friendly advice.
*   **Deterministic Responsibilities:**
    1.  Compute XGBoost prediction probability and SHAP attribution values.
    2.  Check credit score thresholds and DTI ratios.
    3.  Compute KL Divergence and Demographic Parity differences.
    4.  Verify JWT signatures and enforce role-based access controls.
    5.  Query and update PostgreSQL database tables.

---

## PART 6 — MAP THE PROJECT AGAINST THE MODULE 10 CHECKLIST

This table details the implementation status of each Module 10 syllabus item.

| Module | Checklist Item | Status | Existing Implementation | Exact File | What Must Be Added | Agent Needed? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Agentic AI Foundations** | **Partial** | Logging and basic routing based on drift scores. | [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py) | Conversational memory, retry logic, reflection loops, and structured validation. | Yes (Advisory Agent) |
| **2** | **LangGraph / LangChain** | **Missing** | None (uses direct calls to the model). | N/A | LangGraph workspace configuration, node layouts, and state workflows. | Yes |
| **3** | **Practical Agent Tools** | **Missing** | Functions exist but are not exposed as agent tools. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py) | Wrap model, RAG, and audit features in `@tool` format. | Yes |
| **4** | **RAG Pipeline** | **Partial** | Keyword searches against local JSON files. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L248) | Vector embeddings, PGVector store indexing, chunking, and semantic search. | Yes (Research Agent) |
| **5** | **Structured Outputs** | **Missing** | Formatted inputs using Pydantic, but LLM outputs are raw strings. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L224) | Pydantic validation on LLM output using `.with_structured_output()`. | Yes |
| **6** | **Classification Eval** | **Implemented**| Precision, Recall, F1, MCC, ROC-AUC, and calibration curves. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py) | N/A | No |
| **7** | **Agent Evaluation** | **Missing** | None. | N/A | Evaluation dataset containing tool usage scenarios; metrics checking tool selection accuracy. | No |
| **8** | **Human Evaluation** | **Missing** | No user feedback or manual review pipelines. | N/A | User feedback table in Supabase and admin override workflows. | Yes |
| **9** | **Debugging Logs** | **Partial** | Console outputs and exception logging. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py) | OpenTelemetry tracers, span exports, and debugging dashboards. | No |
| **10** | **Observability** | **Missing** | No instrumentation or telemetry collector integrations. | N/A | Trace collections, prompt version tracking, and latency monitoring. | No |
| **11** | **LLMOps Lifecycle** | **Partial** | Model performance and registry logging. | [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py) | Prompt catalog tracking, regression checks, and model promotion workflows. | No |
| **12** | **Cloud Deployment** | **Partial** | Docker configurations and docker-compose files. | [Dockerfile](file:///d:/TWXAI_integ/Dockerfile) | Deployment configurations for cloud providers and SSL setups. | No |
| **13** | **Privacy & Security** | **Partial** | JWT verification and Google reCAPTCHA. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L52) | PII masking filters and input guardrails against prompt injection. | No |
| **14** | **Production Readiness** | **Partial** | End-to-end user-admin flow, but lacks automated tests. | N/A | Rate limiting configurations, health check integrations, and backup routines. | No |

---

## PART 7 — AGENTIC AI FOUNDATIONS

The checklist below reviews core agentic properties and details the work required to satisfy Module 10 criteria.

*   **Planner:**
    *   *Current Status:* **MISSING**
    *   *Evidence:* The chatbot endpoint uses single-turn execution directly.
    *   *Implementation Required:* Implement a ReAct loop or routing logic to decide when to search files, query the database, or answer directly.
    *   *Owner:* **Loan Advisory Chatbot Agent**
*   **Tools:**
    *   *Current Status:* **PARTIAL**
    *   *Evidence:* Internal database queries and scraping scripts exist but are not formatted as LLM-callable tools.
    *   *Implementation Required:* Convert these functions into LangChain `@tool` structures with defined input schemas.
    *   *Owner:* **Loan Advisory Chatbot Agent**
*   **Memory:**
    *   *Current Status:* **MISSING**
    *   *Evidence:* The `/chat` endpoint does not store or process conversation history.
    *   *Implementation Required:* Add session history storage (e.g., PostgreSQL message store) and pass it to the model.
    *   *Owner:* **Loan Advisory Chatbot Agent**
*   **Retry:**
    *   *Current Status:* **MISSING**
    *   *Evidence:* API connections to the LLM do not implement retry strategies.
    *   *Implementation Required:* Implement retry handlers for rate limits and API timeouts.
    *   *Owner:* **Research Agent** / **Chatbot Agent**
*   **Reflection:**
    *   *Current Status:* **MISSING**
    *   *Evidence:* The system returns the model's output directly without self-correction checks.
    *   *Implementation Required:* Add a verification step to ensure the generated advice aligns with the retrieved regulations.
    *   *Owner:* **Structured Response Agent**
*   **Human Approval:**
    *   *Current Status:* **MISSING**
    *   *Evidence:* Loan assessments are processed automatically by the engine.
    *   *Implementation Required:* Add a manual approval step for loan overrides or model promotions.
    *   *Owner:* **Admin Dashboard Agent**
*   **Structured Output:**
    *   *Current Status:* **MISSING**
    *   *Evidence:* The backend returns raw LLM response strings.
    *   *Implementation Required:* Define Pydantic response schemas and enforce structured outputs.
    *   *Owner:* **Structured Response Agent**
*   **Error Handling:**
    *   *Current Status:* **PARTIAL**
    *   *Evidence:* Standard try-except blocks handle backend failures.
    *   *Implementation Required:* Implement fallbacks for LLM downtime and structured parsing errors.
    *   *Owner:* **System-Wide**
*   **Logging:**
    *   *Current Status:* **PARTIAL**
    *   *Evidence:* Events are written to the database, but LLM-specific parameters are not logged.
    *   *Implementation Required:* Log tool calls, token usage, latency, and prompts.
    *   *Owner:* **System-Wide**

---

## PART 8 — TOOLS

The following table cataloges functions in the codebase that can be wrapped as agent tools.

| Tool Name | Purpose | Input Schema | Output Schema | Target File | Safe for Agent? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Loan Prediction** | Calculates risk score using the XGBoost model. | `LoanApplication` | `{"risk_score": float, "band": str}` | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L1129) | **YES** (Deterministic) |
| **Scheme Search** | Queries matching schemes from local JSON files. | `{"query": str}` | `[{"scheme_id": str, "name": str}]` | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L833) | **YES** (Deterministic) |
| **Rule Checker** | Checks compliance against local regulatory rules. | `LoanApplication` | `[{"rule_id": str, "status": str}]` | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L775) | **YES** (Deterministic) |
| **Bank Evaluator** | Matches bank requirements with the applicant's profile. | `{"income": float, "credit": int}` | `[{"bank": str, "suitability": str}]` | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L621) | **YES** (Deterministic) |
| **Google Serp Search**| Searches Google for RBI updates. | `{"query": str}` | `[{"title": str, "link": str}]` | [search_recovery.py](file:///d:/TWXAI_integ/TWXAI_backend/search_recovery.py#L32) | **YES** (Controlled query) |
| **Web Scraper** | Extracts clean text from target URLs. | `{"url": str}` | `{"content": str}` | [scraper.py](file:///d:/TWXAI_integ/TWXAI_backend/scraper.py#L21) | **YES** (Content filter applied) |
| **Drift Calculator** | Computes KL divergence against reference files. | `{"batch": list}` | `{"drift_scores": dict}` | [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py#L88) | **NO** (Internal system utility) |
| **Model Retrainer** | Retrains the candidate model on new data. | None | `{"accuracy": float}` | [train_adaptive_model.py](file:///d:/TWXAI_integ/TWXAI_backend/train_adaptive_model.py#L28) | **NO** (Write operation) |

---

## PART 9 — RAG AUDIT

This table details the implementation status of RAG features in the project.

*   **Chunking:**
    *   *Status:* **MISSING**
    *   *File:* None
    *   *Implementation:* No document chunking strategies are implemented.
    *   *Missing Work:* Split long regulatory PDFs into structured text chunks.
*   **Embeddings:**
    *   *Status:* **MISSING**
    *   *File:* None
    *   *Implementation:* Texts are not embedded.
    *   *Missing Work:* Set up embedding models (e.g. HuggingFace, OpenAI) to process chunks.
*   **Vector Database:**
    *   *Status:* **MISSING**
    *   *File:* None
    *   *Implementation:* The system does not use a vector index.
    *   *Missing Work:* Configure PGVector in Supabase to index document embeddings.
*   **Similarity Search:**
    *   *Status:* **MISSING**
    *   *File:* None
    *   *Implementation:* Searches are performed using raw string keyword checks in Python.
    *   *Missing Work:* Implement cosine similarity queries via SQL or a vector client.
*   **Metadata Filtering:**
    *   *Status:* **PARTIAL**
    *   *File:* [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L842)
    *   *Implementation:* Categorizes schemes based on loan type before evaluating matching rules.
    *   *Missing Work:* Store and query tags like publisher, date, and document type.
*   **Hybrid Search:**
    *   *Status:* **MISSING**
    *   *Missing Work:* Combine BM25 keyword matching with vector search.
*   **Re-ranking:**
    *   *Status:* **MISSING**
    *   *Missing Work:* Integrate a re-ranking model (e.g. Cohere, Cross-Encoder) to order search results.
*   **Grounding:**
    *   *Status:* **PARTIAL**
    *   *File:* [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L311)
    *   *Implementation:* The system prompt instructs the model to restrict answers to the provided context.
    *   *Missing Work:* Implement a validator to check if the generated advice is present in the source context.
*   **Citations:**
    *   *Status:* **MISSING**
    *   *Missing Work:* Return specific document names, sections, and source URLs.
*   **Source Display:**
    *   *Status:* **PARTIAL**
    *   *File:* [chatbot.tsx](file:///d:/TWXAI_integ/components/chatbot.tsx#L235)
    *   *Implementation:* The frontend displays related scheme name badges with external website links.
    *   *Missing Work:* Map source citations to specific parts of the generated response.

---

## PART 10 — STRUCTURED OUTPUTS

To make model outputs predictable and easy to integrate, we should define Pydantic schemas for key components.

```python
from pydantic import BaseModel, Field
from typing import List, Optional

# 1. Pydantic schema for loan prediction results
class LoanPredictionResult(BaseModel):
    risk_score: float = Field(..., description="Calculated default probability (0-100)")
    risk_band: str = Field(..., description="Classification category: low, medium, or high")
    decision: str = Field(..., description="Approval recommendation: approve or reject")
    confidence: float = Field(..., description="Completeness of input profile metrics")

# 2. Pydantic schema for scheme recommendations
class SchemeRecommendation(BaseModel):
    scheme_id: str = Field(..., description="Canonical ID of the scheme")
    scheme_name: str = Field(..., description="Official name of the scheme")
    reason: str = Field(..., description="Justification for matching this scheme")
    url: str = Field(..., description="Official details webpage link")

# 3. Pydantic schema for explainability factors
class FactorAttribution(BaseModel):
    feature: str = Field(..., description="Name of the feature")
    impact: float = Field(..., description="SHAP attribution value")
    direction: str = Field(..., description="Effect on default probability: positive or negative")

# 4. Pydantic schema for improvement advice
class ImprovementAdvice(BaseModel):
    recommendation_type: str = Field(..., description="Advice category")
    current_value: float = Field(..., description="Current value of the feature")
    target_value: float = Field(..., description="Target value required for approval")
    actionable_message: str = Field(..., description="Step-by-step guidance for the user")

# 5. Pydantic schema for the structured response agent
class ChatbotStructuredResponse(BaseModel):
    answer: str = Field(..., description="Conversational advice")
    citations: List[str] = Field(..., description="Official document sources")
    matched_schemes: List[SchemeRecommendation]
    corrective_actions: List[ImprovementAdvice]
```

---

## PART 11 — EVALUATION

The performance metrics and system weaknesses mentioned in your request were verified against the codebase.

### Verification of Reported Metrics
*   **Production XGBoost Metrics:** Verified in [baseline_comparison.csv](file:///d:/TWXAI_integ/TWXAI_backend/improved_results/metrics_tables/baseline_comparison.csv#L4).
    *   *ROC-AUC:* `0.75579` (Matches $0.756$)
    *   *PR-AUC:* `0.32615` (Matches $0.326$)
    *   *Precision:* `0.5959` (Matches $0.596$)
    *   *Recall:* `0.0691` (Matches $0.069$)
*   **Weaknesses:**
    *   *High false negative rate (low recall):* Confirmed. The model misses default cases at the default $0.5$ threshold.
    *   *Income shift impact:* Verified. Income shift reduced the model's recall and dropped demographic parity.
    *   *Imbalance:* Confirmed. The dataset is highly imbalanced ($1:9.42$ default ratio).

### Performance Metrics Status

| Evaluation Metric | Status | Implementation Details | Exact File |
| :--- | :--- | :--- | :--- |
| **TP / TN / FP / FN** | ✅ Implemented | Calculated to compute the confusion matrix. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L14) |
| **Accuracy** | ✅ Implemented | Baseline accuracy calculation. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L115) |
| **Precision / Recall**| ✅ Implemented | Used to evaluate threshold tradeoffs. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L115) |
| **F1 Score** | ✅ Implemented | Balanced metric for classification evaluation. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L115) |
| **ROC-AUC** | ✅ Implemented | Measures general model performance. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L118) |
| **PR-AUC** | ✅ Implemented | PR-AUC is used due to the class imbalance. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L119) |
| **Confusion Matrix** | ✅ Implemented | Exported as a heatmap plot. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L280) |
| **Demographic Parity**| ✅ Implemented | Calculates differences between age groups. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L306) |
| **Equal Opportunity**| ✅ Implemented | Calculates TPR disparities. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L313) |
| **Drift Monitoring** | ✅ Implemented | Calculates real-time KL divergence scores. | [mlops_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/mlops_pipeline.py#L88) |
| **Recovery Recall** | ✅ Implemented | Evaluates model performance post-retraining. | [final_pipeline.py](file:///d:/TWXAI_integ/TWXAI_backend/final_pipeline.py#L371) |

### Missing Agent Metrics
The codebase does not evaluate agent-specific performance. The following metrics should be added:
1.  **Task Success Rate:** Percentage of user queries resolved without escalation.
2.  **Tool Selection Accuracy:** Percentage of correct tool calls based on user intent.
3.  **Tool Argument Accuracy:** Validation rate of arguments passed to tool schemas.
4.  **Loop Rate:** Frequency of conversational loops or redundant tool calls.
5.  **Average Steps:** Number of reasoning steps taken to generate a response.

---

## PART 12 — FAILURE HANDLING

The table below lists existing error handling mechanisms and identifies missing recovery patterns.

| Failure Event | Existing Recovery | Retry? | Timeout? | Fallback? | Escalation / Graceful Failure |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Invalid User Input** | Validated via Pydantic model schemas. | No | No | No | Returns `422 Unprocessable Entity`. |
| **Invalid Loan Data** | Returns standard values if fields are missing. | No | No | Yes | Replaces missing variables with default values. |
| **Model Failure** | Try-catch blocks handle inference issues. | No | No | Yes | Reverts to a neutral score (`0.50`). |
| **LLM Connection Fail** | Try-catch blocks handle API errors. | No | Yes | Yes | Returns a fallback string. |
| **API / SERP Timeout** | Try-catch blocks handle request failures. | No | Yes | Yes | Logs the exception and returns `None`. |
| **Database Failure** | Fallback database write routines. | No | No | Yes | Logs the error and continues execution. |
| **RAG Empty Retrieval** | Returns empty search structures. | No | No | Yes | Continues chat execution without context. |
| **Data Drift Detected** | Triggers model swap logic. | No | No | Yes | Switches to the candidate model. |
| **Fairness Violation** | Logs bias warnings to database. | No | No | No | Continues execution and logs a warning. |
| **Invalid Struct Output**| None. | No | No | No | Unhandled crash on output parsing. |

### Missing Recovery Mechanisms
1.  **Automatic Retries:** Implement backoff routines for API rate limits and connection timeouts.
2.  **RAG Fallback:** Query external search engines if local RAG searches return no results.
3.  **Output Correction:** Pass invalid JSON formats back to the LLM with error logs for self-correction.
4.  **Admin Escalation:** Flag fairness violations in the admin dashboard for manual review.

---

## PART 13 — OBSERVABILITY & DEBUGGING

The table below maps monitored attributes to their corresponding files in the codebase.

| Observability Item | Tracked? | Implementation Details | Exact File |
| :--- | :--- | :--- | :--- |
| **Full Request Trace** | ❌ No | Tracing IDs are not generated or propagated. | N/A |
| **Prompt Text** | ❌ No | Prompts are hard-coded in the endpoints. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L311) |
| **Prompt Version** | ❌ No | Prompts are not versioned. | N/A |
| **Tool Name Called** | ❌ No | Tools are called deterministically. | N/A |
| **Tool Arguments** | ❌ No | Input arguments are not logged. | N/A |
| **Tool Execution Result**| ❌ No | Tool outputs are not logged. | N/A |
| **Model Response** | ✅ Yes | Conversational responses are returned directly. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L450) |
| **Token Usage** | ❌ No | Token metrics are not tracked. | N/A |
| **Latency** | ❌ No | Execution time is not measured. | N/A |
| **Errors & Stack Traces** | ✅ Yes | standard logger prints system exceptions. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py) |
| **Root Cause** | ❌ No | Errors are not categorized or analyzed. | N/A |
| **User Feedback** | ❌ No | Feedback tracking is not implemented. | N/A |
| **API Costs** | ❌ No | API costs are not tracked. | N/A |

### Recommended Observability Layer
To satisfy Module 10 criteria, integrate an open-source observability framework like **Langfuse** or **Arize Phoenix**:
1.  **Instrumentation:** Use OpenTelemetry to trace requests across frontend and backend boundaries.
2.  **Prompt Registry:** Move prompts out of source code and manage them in a central repository.
3.  **Trace Exporter:** Export system traces to monitor LLM inputs, outputs, latency, and costs.

---

## PART 14 — LLMOPS

This section reviews the LLMOps lifecycle features implemented in the codebase.

*   **Prompt Versioning:** ❌ **Missing** (Prompts are defined as inline string constants).
*   **Model Versioning:** ✅ **Implemented** (Model versions are registered in the `model_registry` table).
*   **Dataset Versioning:** ❌ **Missing** (Datasets are stored as unversioned CSV files).
*   **Evaluation Dataset:** ❌ **Missing** (No baseline evaluation dataset for prompt testing).
*   **Automated Evaluation:** ❌ **Missing** (Evaluations are triggered manually).
*   **Regression Testing:** ❌ **Missing** (No regression testing pipeline for new prompts).
*   **CI/CD Pipeline:** ✅ **Implemented** (Dockerfiles and docker-compose configurations automate builds).
*   **A/B Testing:** ❌ **Missing** (Traffic routing between different prompts or models is not supported).
*   **Rollback:** ❌ **Missing** (No automatic rollbacks if model performance degrades).
*   **Operational Monitoring:** ✅ **Implemented** (Logs model swaps and system events to database).
*   **Automated Retraining:** ❌ **Missing** (Drift swaps models but does not trigger retraining).
*   **Model Registry:** ✅ **Fully implemented** (The `model_registry` table tracks model status and paths).

---

## PART 15 — CLOUD DEPLOYMENT

The deployment configurations in the repository are evaluated below.

| Deployment Requirement | Status | Implementation Details | Exact File |
| :--- | :--- | :--- | :--- |
| **Docker Configuration** | ✅ Implemented | Backend and frontend Dockerfiles are configured. | - [Dockerfile](file:///d:/TWXAI_integ/Dockerfile)<br>- [TWXAI_backend/Dockerfile](file:///d:/TWXAI_integ/TWXAI_backend/Dockerfile) |
| **FastAPI Hosting** | ✅ Implemented | The backend runs on port 8000. | [docker-compose.yml](file:///d:/TWXAI_integ/docker-compose.yml#L5) |
| **HTTPS Configuration** | ❌ Missing | Deploys on HTTP without SSL termination. | N/A |
| **Secret Management** | ✅ Implemented | Loaded from env files. | - [.env](file:///d:/TWXAI_integ/.env) |
| **Authentication** | ✅ Implemented | Integrated with Supabase Auth. | [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L546) |
| **Load Balancing** | ❌ Missing | No reverse proxy configuration. | N/A |
| **Autoscaling** | ❌ Missing | No Kubernetes or Docker Swarm configuration. | N/A |
| **System Monitoring** | ❌ Missing | Telemetry monitoring tools are not configured. | N/A |
| **Centralized Logging**| ❌ Missing | Log outputs are written to stdout or CSV. | N/A |

---

## PART 16 — SECURITY & RESPONSIBLE AI

This section reviews system security controls and highlight their importance in financial applications.

### Security Implementation Checklist
*   **Authentication:** ✅ **Implemented** (Handled via Supabase JWT verification).
*   **Authorization:** 🟡 **Partially Implemented** (The admin dashboard validates admin secrets and whitelist emails, but lacks structured Role-Based Access Control).
*   **Role-Based Access Control (RBAC):** ❌ **Missing** (User permissions are not stored or validated).
*   **PII Masking:** ❌ **Missing** (Sensitive fields like name, age, and caste are processed in plain text).
*   **Data Encryption:** 🟡 **Partially Implemented** (Encryption is handled by Supabase at rest, but transit encryption is missing).
*   **Secret Management:** ✅ **Implemented** (Credentials are managed via `.env` files).
*   **Human Approval Workflow:** ❌ **Missing** (Decisions are automated without manual override paths).
*   **Audit Logging:** ✅ **Implemented** (Tracks operations in `regulatory_audit_log.csv`).
*   **Prompt Injection Protection:** ❌ **Missing** (Inputs are passed to the model without safety filters).
*   **Jailbreak Protection:** ❌ **Missing** (System prompts do not include safety guardrails).
*   **Data Leakage Prevention:** ❌ **Missing** (No egress scanners to detect sensitive data leaks).
*   **Consent and Data Retention:** ❌ **Missing** (No user consent checks are implemented).

### Critical Financial Guardrails
As a loan advisory system, the following security features are critical:
1.  **PII Masking:** Mask names and caste details before passing data to external LLMs to comply with data privacy regulations.
2.  **Guardrail Filters:** Validate inputs against prompt injections to prevent users from manipulating risk bands.
3.  **Human Override Checks:** Require manual approval for loan overrides or risk tier modifications.

---

## PART 17 — PRODUCTION READINESS

The checklist below summarizes the current status of features required to transition the project to production.

```
[System Components]
 ├── Architecture Diagram:  ✅ YES (Documented in DEPLOYMENT.md)
 ├── Frontend Interface:    ✅ YES (Next.js components)
 ├── Backend APIs:          ✅ YES (FastAPI endpoints)
 ├── Database Tables:       ✅ YES (Supabase Postgres setup)
 ├── Model Registry:        ✅ YES (registered in DB)
 └── Dataset:               ✅ YES (loan_default_data.csv)

[Agent System]
 ├── Planner Node:          ❌ NO  (Direct RAG execution only)
 ├── Tool Integrations:     ❌ NO  (Functions not exposed as tools)
 ├── Conversational Memory: ❌ NO  (Conversations are single-turn)
 ├── Output Guardrails:     ❌ NO  (No Pydantic output validation)
 └── Human Review Flow:     ❌ NO  (Decisions are automated)

[Operations & Observability]
 ├── Logs:                  ✅ YES (audit CSV logs)
 ├── Observability Traces:  ❌ NO  (No OpenTelemetry integration)
 ├── Error Handling:        🟡 PARTIAL (Basic try-except blocks)
 ├── Rate Limiting:         ✅ YES (IP rate limiter on chat)
 ├── Token Tracking:        ❌ NO  (Token metrics not captured)
 └── Latency Tracker:       ❌ NO  (Latency is not measured)

[Infrastructure & Security]
 ├── Dockerization:         ✅ YES (Dockerfiles configured)
 ├── Cloud Deploy Setup:    ❌ NO  (Lacks cloud infrastructure configurations)
 ├── Secret Management:     ✅ YES (managed via env files)
 ├── JWT Verification:      ✅ YES (Supabase JWT checking)
 └── RBAC Rules:            ❌ NO  (Lacks user roles)
```

---

## PART 18 — FINAL GAP ANALYSIS

Based on the audit, the features in the codebase have been grouped into three categories to outline the work needed to satisfy Module 10 criteria.

### LIST A — ALREADY DONE
*   **Frontend UI:** Deployed Next.js portal featuring application forms, a user dashboard, and an admin dashboard.
*   **FastAPI Backend Router:** Core routing layer implementing API endpoints and Supabase integrations.
*   **Model Training Pipelines:** Scripts for training XGBoost models and evaluating performance curves.
*   **Transactional Databases:** Database tables for storing application metadata and scoring metrics.
*   **Drift Detection:** Computes KL Divergence on incoming numerical features in real-time.
*   **Fairness Pipeline:** In-memory tracking of age demographic parity differences.
*   **Audit Logging:** Logs operations to CSV and database tables.
*   **Container Configurations:** Docker files for running services locally.

### LIST B — PARTIALLY DONE
*   **RAG Engine:** Implements basic keyword searches against local JSON files. Needs vector indexing and semantic search.
*   **Model Retraining:** Retraining scripts must be executed manually. Needs an automated retraining loop triggered by drift scores.
*   **Explainability (SHAP):** Computes SHAP values in the backend but does not persist them or display them in the frontend.
*   **API Security:** Verifies logins and JWTs but lacks Role-Based Access Control.
*   **Background Jobs:** Audits are triggered via API endpoints. Needs a scheduled cron job or background worker.

### LIST C — NOT DONE
*   **Planner Node:** Lacks a ReAct planning loop.
*   **Tool Calling:** Code functions are not exposed as agent tools.
*   **Memory:** Conversational history is not stored or processed.
*   **Structured Outputs:** Lacks Pydantic output validation for LLM responses.
*   **Observability:** Lacks request tracing and telemetry collection.
*   **Security Guardrails:** Lacks PII masking and prompt injection filters.
*   **Agent Evaluation:** Lacks automated tests for agent tool selection and accuracy.

---

## TOP 10 HIGHEST-VALUE IMPLEMENTATIONS

To align the project with your syllabus, focus on these ten key implementations:

1.  **LangGraph Planner Loop:** Build a ReAct state graph using LangGraph to manage chatbot execution flows.
2.  **Structured Pydantic Outputs:** Enforce structured formats on chatbot responses using Pydantic schemas.
3.  **LangChain Tool Integration:** Wrap prediction, RAG, and SerpApi functions as LangChain `@tool` tools.
4.  **Telemetry Integration:** Integrate Langfuse or Arize Phoenix to trace request execution, latency, and costs.
5.  **Vector RAG Migration:** Index rules and schemes in a vector store and use cosine similarity search.
6.  **Conversational Memory Store:** Persist conversational history in a database table to support multi-turn chat.
7.  **PII Masking Filter:** Mask sensitive details (names, castes) before passing data to external LLMs.
8.  **Automated Retraining Loop:** Automate retraining when data drift scores exceed defined thresholds.
9.  **SHAP Visualization:** Persist SHAP values in the database and display feature attributions in the frontend.
10. **Role-Based Access Control:** Implement RBAC rules to secure admin endpoints and restrict access to dashboards.

---

## PART 19 — FINAL IMPLEMENTATION ROADMAP

This roadmap outlines the phases needed to implement the missing agentic features.

```
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│  PHASE 1: Foundations   │─────►│  PHASE 2: Agent Graph   │─────►│   PHASE 3: Vector RAG   │
│  Wrap LangChain tools   │      │  Implement LangGraph    │      │  Index chunks in vector │
│  and Pydantic schemas.  │      │  ReAct state graphs.    │      │  store for search.      │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                               │
┌─────────────────────────┐      ┌─────────────────────────┐                   │
│   PHASE 6: Security     │◄─────│ PHASE 5: Observability  │◄──────────────────┘
│  Configure PII filters  │      │ Integrate telemetry for │
│  and prompt guardrails. │      │ prompt and token tracing│
└─────────────────────────┘      └─────────────────────────┘
```

### PHASE 1: Agent Foundations & Tools
*   **What to implement:** Define Pydantic schemas for chatbot outputs and wrap backend functions as LangChain tools.
*   **Existing code to modify:** [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py) (register new endpoints).
*   **New files to create:** `TWXAI_backend/agent_tools.py` (definitions of `@tool` tools) and `TWXAI_backend/schemas.py` (Pydantic schema definitions).
*   **Checklist items satisfied:** Practical Agent Tools (3) and Structured Outputs (5).
*   **Agent Ownership:** **Advisory Agent**
*   **Verification Strategy:** Execute test scripts to verify tool schemas and validate Pydantic output formatting.

### PHASE 2: Agent Workflows & Graphs
*   **What to implement:** Build a ReAct planner state graph using LangGraph to handle routing and memory.
*   **Existing code to modify:** [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L450) (route `/chat` requests to the graph).
*   **New files to create:** `TWXAI_backend/agent_graph.py` (LangGraph state and node definitions).
*   **Checklist items satisfied:** Agentic AI Foundations (1) and LangGraph Integration (2).
*   **Agent Ownership:** **Advisory Agent**
*   **Verification Strategy:** Query the chatbot with prompts that require tool calls and verify the routing paths.

### PHASE 3: Vector RAG & Retrieval
*   **What to implement:** Index rules and schemes as document chunks in PGVector.
*   **Existing code to modify:** [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L248) (update the search function to query PGVector).
*   **New files to create:** `TWXAI_backend/seed_vector_db.py` (chunking and embedding scripts).
*   **Checklist items satisfied:** RAG Pipeline (4).
*   **Agent Ownership:** **Research Agent**
*   **Verification Strategy:** Query the chatbot about specific schemes and verify that it retrieves relevant context with citations.

### PHASE 4: Self-Correction & Reflection
*   **What to implement:** Implement a reflection step in the graph to validate outputs against source contexts.
*   **Existing code to modify:** `TWXAI_backend/agent_graph.py` (add validation nodes).
*   **Checklist items satisfied:** Agentic AI Foundations - Reflection (1).
*   **Agent Ownership:** **Structured Response Agent**
*   **Verification Strategy:** Prompt the chatbot with out-of-context queries and verify that the reflection step handles them.

### PHASE 5: Observability & Telemetry
*   **What to implement:** Integrate Langfuse to track latency, token usage, and trace requests.
*   **Existing code to modify:** `TWXAI_backend/agent_graph.py` (instrument nodes with tracers).
*   **New files to create:** `TWXAI_backend/observability_config.py` (configure telemetry settings).
*   **Checklist items satisfied:** Debugging Logs (9) and Observability (10).
*   **Agent Ownership:** **System Governance**
*   **Verification Strategy:** Trigger chatbot requests and verify that trace data is captured in the observability dashboard.

### PHASE 6: Security & Guardrails
*   **What to implement:** Mask PII details (names, castes) and validate inputs against injection patterns.
*   **Existing code to modify:** [fastapi_backend.py](file:///d:/TWXAI_integ/TWXAI_backend/fastapi_backend.py#L450) (add pre-processing filters to the endpoint).
*   **New files to create:** `TWXAI_backend/security_filters.py` (regex masking and validation rules).
*   **Checklist items satisfied:** Privacy & Security (13).
*   **Agent Ownership:** **Advisory Agent**
*   **Verification Strategy:** Send requests containing dummy PII details or injection prompts and verify that they are blocked or masked.

---

## CONCISE TRAINER EXPLANATION FLOW

This flow outlines how to explain the architecture of your project:

1.  **The Problem:** Financial institutions need transparent, fair, and compliant credit scoring systems that align with government schemes and RBI guidelines.
2.  **The Existing System:** Next.js frontend integrated with a FastAPI backend, using Supabase PostgreSQL for data storage.
3.  **Loan Prediction:** A predictive model trains on historical loan data to evaluate default probability.
4.  **Explainability (XAI):** A SHAP tree explainer generates feature attribution scores to explain model decisions.
5.  **Fairness Monitoring:** Evaluates demographic parity differences across applicant age groups.
6.  **Drift Detection:** Monitors distribution shifts on incoming features using KL Divergence.
7.  **MLOps Pipeline:** Logs system events and implements model swap routines to swap models when drift is detected.
8.  **RAG Engine:** Retrieves local scheme and rule chunks to ground chatbot responses.
9.  **Scheme Recommendation:** Matches applicant profiles with eligible government schemes.
10. **External Search:** Uses Google Search via SerpApi to resolve broken links and fetch updates.
11. **Chatbot Portal:** An interactive portal that answers user queries based on retrieved contexts.
12. **Why Agents are Needed:** Conversational advice, external searches, and compliance checks require dynamic planning and tool routing that standard models cannot handle.
13. **Planner:** Implement a LangGraph state graph to orchestrate search and prediction nodes.
14. **Tools:** Wrap model prediction, RAG search, and SerpApi functions as LangChain tools.
15. **Memory:** Store and retrieve conversational history from Supabase tables to support multi-turn chat.
16. **Structured Outputs:** Validate LLM responses against Pydantic schemas.
17. **Retry & Backoff:** Implement retry routines to handle connection timeouts and rate limits.
18. **Reflection:** Validate outputs against retrieved regulations before returning them to the user.
19. **Human Approval:** Require manual overrides for edge cases or model swaps.
20. **Evaluation:** Run automated test suites to check model accuracy and tool selection rate.
21. **Observability:** Track trace records, prompts, token usage, and costs using Langfuse.
22. **LLMOps:** Manage prompt catalogs and automate retraining runs.
23. **Security:** Implement PII masking and prompt injection filters.
24. **Cloud Deployment:** Containerize services using Docker and deploy to cloud environments.
