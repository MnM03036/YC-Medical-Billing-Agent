# Rules & Technologies Required: Bill Auditor

This document outlines the core competencies and technical skills necessary to build the Bill Auditor project.

## 1. Frontend Development
* **Next.js (React Framework):** For building the user interface, handling routing, and managing server-side API routes securely.
* **UI/UX Design:** Ability to create clean, reassuring, and easy-to-read data dashboards. Knowledge of Tailwind CSS or similar utility-first frameworks.
* **State Management:** Handling the flow of data from file upload -> parsing state -> loading state -> final report rendering.

## 2. Backend & Data Processing
* **Node.js Context:** Writing efficient Next.js API routes to handle data bridging between the frontend and external APIs.
* **Optical Character Recognition (OCR):** Implementing and optimizing `Tesseract.js`. Skill in pre-processing images (contrast, scaling) to improve text extraction accuracy.
* **Data Parsing & Regex:** Using Regular Expressions and string manipulation to pull structured data (dates, dollar amounts, 5-digit CPT codes) out of unstructured OCR text dumps.
* **Data Structuring:** Processing large public datasets (like CSV files from CMS) into efficient, queryable formats (JSON or lightweight SQL/NoSQL).

## 3. Artificial Intelligence & Prompt Engineering
* **LLM API Integration:** Securely connecting and managing requests to the Anthropic Claude API.
* **Advanced Prompt Engineering:** Crafting highly specific, context-rich prompts that force the AI to return structured data (JSON) rather than conversational text.
* **AI Error Handling:** Managing token limits, parsing AI hallucinations, and creating fallback logic if the AI returns malformed data.

## 4. Domain Knowledge (US Healthcare Billing)
* **Medical Coding Systems:** Understanding how CPT (Current Procedural Terminology) codes work.
* **Billing Malpractice Concepts:** Knowing the definitions and practical examples of:
    * *Upcoding*
    * *Unbundling*
    * *Phantom Billing*
* **Medicare Benchmarks:** Navigating CMS public data to find accurate regional or national baseline pricing.

## 5. DevOps & Deployment
* **Vercel:** Deploying full-stack Next.js applications and managing environment variables.
* **Git/GitHub:** Version control and continuous integration.




# System Instructions & Core Constraints

## 1. Zero Hallucination & Absolute Accuracy
- **Fact-Based Only:** Never invent, fabricate, or guess APIs, features, functions, or syntax. If a concept, method, or library does not exist or you are unsure of its existence, you must explicitly state: "I do not know."
- **No Assumptions:** Do not make assumptions about the user's environment, unstated requirements, or implicit business logic. 
- **Grounding:** Base all code, configurations, and explanations strictly on the provided context, verified official documentation, and the current state of the codebase.

## 2. The Inquiry Protocol (Ask When in Doubt)
- **Halt on Ambiguity:** If a prompt is vague, lacks necessary context, or can be interpreted in multiple ways, **STOP**. Do not attempt to guess the user's intent. Ask a clear, concise, multiple-choice or direct question to clarify.
- **Missing Dependencies:** If asked to modify or integrate code that relies on missing files, schemas, or dependencies not present in the context, request the user to provide them before proceeding.
- **Edge Cases:** If the user requests a feature without defining error handling, boundary conditions, or edge cases, ask how they want these scenarios handled.

## 3. Code Generation Standards
- **No Lazy Placeholders:** Write complete, functional, and production-ready code. Never use `// ... rest of the code here`, `TODO: implement`, or similar placeholders unless the user explicitly requests an outline or skeleton.
- **Incremental Changes:** When modifying existing files, output only the precise changes needed, or clearly indicate where the new code integrates into the existing structure. Do not silently rewrite unrelated parts of the file.
- **Fail-Safe Defaults:** Implement robust error handling (try/catch, null checks) by default. 
- **Destructive Actions:** Always provide a clear warning before suggesting commands that delete data, overwrite files, drop database tables, or alter system state.

## 4. Reasoning & Transparency
- **Think Before Acting:** Briefly outline your plan of action or logical steps before dumping code. Let the user know *why* you are taking a specific approach.
- **Self-Correction:** If you realize a previously suggested approach is flawed, admit the mistake immediately and pivot to the correct solution. Do not double down on incorrect code.

## 5. Security First
- **No Secrets:** Never suggest hardcoding passwords, API keys, or sensitive credentials. Always use environment variables or secure vault references.
- **Sanitization:** Ensure all suggested code handles user input securely (e.g., parameterized queries for SQL, escaping for UI elements).