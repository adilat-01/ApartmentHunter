# ApartmentHunter - Product Requirement Document (PRD)

## 1. Executive Summary & Objective

ApartmentHunter is a data-driven web application designed to streamline the chaotic process of searching for an apartment. Instead of managing scattered posts, screenshots, and notes, users can aggregate apartment data, extract key metrics using AI, and rank properties based on a personalized, dynamic weighted scoring matrix.

The primary objective for the MVP (Minimum Viable Product) is to support a specialized "Couples" target profile, focusing on data integrity, clear score breakdowns, client-side persistence, and robust manual overrides.

---

## 2. Core User Flow

The system will guide the user through the following deterministic lifecycle:

1. **Setup Preferences:** The couple defines their shared budget boundaries and weighs core criteria.
2. **Ingest Content:** Raw, unstructured text (Facebook/Yad2) is pasted into the app.
3. **AI Extraction:** The background LLM processes the text into a structured JSON schema.
4. **Data Integrity Check & Review:** The system flags missing info; the user reviews and can manually edit any field pre-save.
5. **Dashboard Rendering:** The apartment is saved to the main grid with a dynamic match score and status.
6. **Active Tracking:** The user updates pipeline statuses, adds personal qualitative notes, and views transparent score itemizations.

---

## 3. Product Scope (MoSCoW Prioritization)

### Must Haves (MVP Target)

- **AI Ingestion & Extraction:** Single-box unstructured text parser mapping into a strict JSON object.
- **Pre-Save & Post-Save Manual Editing:** Universal manual overrides for any field.
- **Dynamic Scoring Engine:** Real-time recalculation of match scores upon slider adjustment.
- **Data Completeness Rules:** Suspension/Warning system for low-data inputs.
- **Enhanced Pipeline Management:** Standardized statuses for active tracking.
- **Transparent Score Breakdown:** Granular itemization of how every point was calculated.
- **Persistent Local Storage:** Client-side DB lifecycle with data persistence warnings.
- **Data Portability (Export/Backup):** JSON/CSV export and import to protect against data loss.
- **Qualitative Notes Field:** Free-text storage for subjective inputs.
- **Basic Discovery Tools:** Client-side search, sorting, and filtering options.

### Nice to Haves (Post-MVP)

- Multiple Persona Schemas (Singles, Roommates).
- Advanced multi-image drag-and-drop galleries.
- Complex multi-variable filter combinations and geographic map rendering.

---

## 4. Target Persona Nuances: The "Couples" Profile

To differentiate this from generic search tools, the MVP integrates shared decision-making features:

- **Joint Budget Thresholds:** Replaces individual price constraints with a dual-party budget spectrum (Ideal vs. Maximum Compromise).
- **Consensus-Driven Weights:** The system assumes a single unified preference configuration dashboard representing the shared compromise/agreement negotiated between both partners.

---

## 5. System Criteria Schema & Data Model

### A. Criteria Schema Definition

The configuration framework relies on a decoupled, dynamically typed schema to prevent hardcoding:

```json

{

  "criteria_id": "string",

  "display_name": "string",

  "type": "enum [categorical, boolean]",

  "options": [

    { "value": "string/boolean", "internal_score": 1.0 }

  ],

  "user_weight": 5

}  
  
### B. Core MVP Criteria Setup (Couples Context)

1. **Protected Space (ממ"ד):** Categorical (ממ"ד = 1.0, מקלט = 0.5, אין = 0.0)

2. **Pet Friendly (בעלי חיים):** Boolean (מותר = 1.0, אסור = 0.0)

3. **Outdoor Space (מרחב חיצוני):** Categorical (גינה = 1.0, מרפסת = 0.7, אין = 0.0)

4. **Furnished Status (ריהוט):** Categorical (מלא = 1.0, חלקי = 0.5, ללא = 0.0)

### C. Apartment Object Data Model (TypeScript Definition)

```typescript

interface Apartment {

  id: string;

  createdAt: string;

  status: 'New' | 'Contacted' | 'Viewing Scheduled' | 'Viewed' | 'In Negotiation' | 'Signed' | 'Archived' | 'Rejected';

  originalText: string;

  extractedData: {

    price: number;

    rooms: number;

    area?: string;

    contactPhone?: string;

    moveInDate?: string;

    criteriaValues: Record<string, string | boolean | null>;

  };

  aiConfidenceScore: number;

  missingCriticalFields: string[];

  userNotes: string;

  isOverBudget: boolean;

}  
  
6. Mathematical Scoring & Budget Logic

### A. Core Scoring Algorithm

The match percentage is determined using a dynamic Weighted Average:

- Let W_i be the user-defined weight (integer from 1 to 5) for criterion i.
- Let S_i be the normalized internal score (0.0 to 1.0) mapped from the apartment's data.

Formula: Final Score = ( Sum(W_i  *S_i) / Sum(W_i) )*  100

### B. Budget Penalty & Over-Budget Logic

Price is treated as a core component of the overall score but triggers metadata flags rather than immediate deletion.

- Condition 1: If Price <= Ideal Budget -> S_budget = 1.0
- Condition 2: If Price > Maximum Budget -> S_budget = 0.0 and set isOverBudget = true
- Condition 3 (Linear Decay): If Ideal Budget < Price <= Maximum Budget -> S_budget = 1.0 - ( (Price - Ideal Budget) / (Maximum Budget - Ideal Budget) )

### C. Data Completeness & Exclusions

- **Data Completeness Threshold:** If criteriaValues contains fewer than 3 valid inputs out of the 4 core criteria, the Final Score calculation is suspended and displayed as "Incomplete". A high-priority visual warning is bound to the element.
- **Dynamic Denominator Adjustment:** If exactly 3 criteria are resolved, the missing item is completely omitted from both the numerator and denominator Sum(W_i). No arbitrary point penalties are applied; instead, a "Partial Score" badge is appended.  
  
7. AI Ingestion Engine & Structured Schema
  The interface will pass unformatted text to the backend LLM, enforcing a rigid output configuration via Structured Outputs:
{
  "price": 4800,
  "rooms": 2.5,
  "area": "פלורנטין, תל אביב",
  "contactPhone": "050-1234567",
  "moveInDate": "2026-08-01",
  "criteriaValues": {
    "protected_space": "ממ"ד",
    "pet_friendly": true,
    "outdoor_space": "אין",
    "furnished_status": null
  },
  "aiConfidenceScore": 0.92,
  "missingCriticalFields": ["furnished_status"]
}

```

## 8. Frontend Interface & UI/UX Strategy

### A. Structural Grid Layout

- **Control Sidebar (Sticky Left):** House slider controls for Ideal/Max Budgets and numeric priority selectors (1-5 weights) for individual criteria. Includes a client-side text filter input and sort-order selectors.
- **Global Monitoring Banner (Header KPIs):** Transparent numeric blocks reflecting the system state: Tracked | Viewed | In Negotiation | Signed | Archived. Includes a persistent local-only storage warning banner with an Export JSON link.
- **Core Apartment Workspace (Main Grid):** Responsive CSS Grid rendering apartment nodes. Over-budget entities retain positioning but are visually attenuated (muted background) and stamped with an "Over Budget" indicator.

### B. Transparent Score Breakdown

Clicking any node instantiates an informative interface revealing the underlying mathematical formula metrics:  



|                  |                    |                 |                      |                     |                       |
| ---------------- | ------------------ | --------------- | -------------------- | ------------------- | --------------------- |
| **Criterion**    | **Value Detected** | **User Weight** | **Normalized Score** | **Weighted Points** | **Status**            |
| Protected Space  | ממ"ד               | 5               | 1.0                  | 5.0 / 5.0           | Resolved              |
| Budget           | 4,800 (Over Ideal) | 4               | 0.4                  | 1.6 / 4.0           | Degraded              |
| Furnished Status | Not Found          | 3               | N/A                  | Excluded            | Excluded (No Penalty) |




## 9. Data Architecture & Failure Modes (Backup/Export)

- **Local Scope Limitation:** Application state is entirely localized to client-side LocalStorage.
- **Data Safety Controls:** The interface must feature an Export/Import subsystem:
  - **Export:** Serializes the entire application state array into a .json backup file.
  - **Import:** Parses an external .json schema, validates object keys against the Apartment[] data model structure, and overwrites or appends data safely into local storage.



## 10. Functional Acceptance Criteria (AC)

### AC 1: Weighted Scoring Engine

- **Given** an apartment has an identified price between the Ideal Budget ($4,000) and Maximum Budget ($5,000), namely $4,500,
- **When** the scoring calculation executes,
- **Then** the normalized budget component score (S_budget) must equal exactly 0.5.
- **And** changing the weight slider of any criteria must trigger an instant client-side update of the Final Score without forcing a webpage refresh.

### AC 2: Missing Data Enforcement

- **Given** an AI extraction returns null or empty fields for 2 or more core criteria,
- **When** the apartment data object is passed to the rendering engine,
- **Then** the interface must block numeric score visualization, assign an "Incomplete" state badge, and display a missing-data layout notification.

### AC 3: Manual State Override

- **Given** an apartment is flagged as "Incomplete" due to an unidentified field (e.g., pet_friendly: null),
- **When** the user manually overrides the specific field to true via the edit modal interface,
- **Then** the application must instantly remove the critical error flag, compute the correct math score using the updated variable, and persist the modifications to LocalStorage.

