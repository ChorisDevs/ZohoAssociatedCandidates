# Zoho Recruit Widget

A custom embedded widget for **Zoho Recruit** that streamlines the hiring workflow — from associating candidates to a job opening all the way through sending agreements, managing VP evaluations, and tracking hired candidate details.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Widget States](#widget-states)
  - [Unhired View](#unhired-view)
  - [Hired View](#hired-view)
- [Functionality Breakdown](#functionality-breakdown)
  - [Job & Client Info Display](#job--client-info-display)
  - [Candidate Association](#candidate-association)
  - [Hiring a Candidate](#hiring-a-candidate)
  - [Unhiring a Candidate](#unhiring-a-candidate)
  - [Engagement Agreement](#engagement-agreement)
  - [Client Agreement](#client-agreement)
  - [VP Agreement](#vp-agreement)
  - [VP Evaluation](#vp-evaluation)
  - [Email Candidate Summary](#email-candidate-summary)
  - [Send Job Req Form to Client](#send-job-req-form-to-client)
- [API Integrations](#api-integrations)
- [Key Variables](#key-variables)
- [Error Handling](#error-handling)
- [Setup & Deployment](#setup--deployment)
- [File Structure](#file-structure)
- [Notes & Caveats](#notes--caveats)

---

## Overview

This widget is embedded inside a **Zoho Recruit Job Opening** record and provides a unified control panel for recruiters. It fetches live data from the current job record, displays associated candidates, and exposes action buttons for every stage of the placement lifecycle.

---

## Features

- 📋 Display job title, client name, phone, and email from the active Job Opening
- 👥 Load and display all associated VP (Virtual Professional) candidates
- 🔍 Search and associate new candidates from the full Zoho Recruit candidate pool (paginated, up to 200 per page)
- ✅ Hire a candidate and populate all contract fields
- ❌ Unhire a candidate with a mandatory reason and automatic note creation
- 📝 Edit hired candidate contract details
- 📄 Create & send Engagement Agreement (Normal or Fast Track)
- 📄 Create & void VP Agreement
- 📄 Create & void Client Agreement (with optional secondary signer)
- 📊 Manage VP Evaluation lifecycle (create, resend, track status)
- 📧 Email candidate summaries to the sales/review team

---

## Tech Stack

| Library | Purpose |
|---|---|
| [Bootstrap 5](https://getbootstrap.com/) | UI layout and components |
| [Bootstrap Icons](https://icons.getbootstrap.com/) | Iconography |
| [DataTables](https://datatables.net/) | Paginated, searchable candidate table |
| [SweetAlert2](https://sweetalert2.github.io/) | Modal dialogs and confirmations |
| [jQuery 3.7](https://jquery.com/) | DOM manipulation and DataTables integration |
| [Zoho Recruit Widget SDK](https://www.zoho.com/recruit/developer-guide/) | Recruit API access (`ZOHO.RECRUIT.*`) |

---

## Widget States

### Unhired View

Shown when the job's `Hired` field is `false`. Contains:

- Job title, client name, phone, and email
- **Send Job Req Form to Client** button
- **Engagement Agreement** button (Create or Void depending on contract status)
- Associated candidates table with checkboxes
- **Email Candidate Summary** button (enabled when ≥1 candidate selected)
- **Hire** button (enabled only when exactly 1 candidate is selected)
- **Associate More VP** link that loads the full candidate pool
- Search bar and **Save Changes** button for new associations

### Hired View

Shown when `Hired` is `true`. Contains:

- Hired candidate header (`{VPName} Hired Details`)
- **Edit Details** and **UnHire** buttons
- Full contract details (billing address, rates, VP info, dates, services)
- **Send VP Evaluation Form** (dynamic color/label based on evaluation status)
- **Create & Send Client Agreement** / **Void Client Agreement**
- **Create & Send VP Agreement** / **Void VP Agreement**

---

## Functionality Breakdown

### Job & Client Info Display

On widget load (`ZOHO.embeddedApp.on("Load", ...)`), the widget calls `ZOHO.RECRUIT.API.getRecord` on the current Job Opening and populates all display fields. Based on the `Hired` flag, either the unhired or hired view is rendered.

---

### Candidate Association

1. Clicking **Associate More VP** triggers `loadAllCandidates()`.
2. This function paginates through all Recruit candidates (200/page) and adds them incrementally to the DataTables instance.
3. Candidates already associated or marked as hired are excluded.
4. Selecting candidates and clicking **Save Changes** calls `associateCandidatesWithJob(candidateIds, jobId)` via `ZOHO.RECRUIT.API.associateJobOpening`.

> **Note:** Candidate data is lazy-loaded on first click to avoid blocking the initial widget render.

---

### Hiring a Candidate

1. Select exactly one associated candidate → **Hire** button becomes active.
2. A SweetAlert2 form (`hireCandidateAndEdit`) collects:
   - Billing address fields
   - Client billing rate (must be greater than VP monthly rate)
   - VP email and phone
   - VP position, hire date, service commencement date
   - Services to be performed, service hours, VP monthly rate
3. On submit, `hireCandidate(...)` calls `ZOHO.RECRUIT.API.updateRecord` on the Job Opening.
4. After hire, the system searches for any existing VP Evaluation linked to this candidate+job and stores its ID on the Job Opening.

---

### Unhiring a Candidate

1. Click **UnHire** in the hired view.
2. A mandatory reason textarea is shown.
3. On confirm:
   - A note is created via `ZOHO.RECRUIT.API.createNotes` with the unhire reason.
   - `hireCandidate(...)` is called with `hire = false`, clearing all contract fields.
   - The page reloads and switches to the unhired view.

---

### Engagement Agreement

- **Create & Send:** Opens a form for engagement fee, company name, billing address, and agreement type (Normal / Fast Track). Calls the `Send_Engagement_Contract` Zoho Function. Saves the returned contract ID to the job record.
- **Void:** Calls `Aggrement_Delete_Contract` Zoho Function with the stored `Engagement_Contract_ID`. Clears the ID from the job record.

---

### Client Agreement

- **Create & Send:** Prompts for an optional secondary signer (populated from the client's contacts). Calls `Dev_create_client_agreement` Zoho Function. Saves `Client_Contract_ID` to the job record.
- **Void:** Requires a void reason. Updates the contract record with the reason via `ZOHO.RECRUIT.API.updateRecord`, waits 1 second, then calls `Aggrement_Delete_Contract`.

---

### VP Agreement

- **Create & Send:** Calls `Dev_create_contract_agreement` Zoho Function. Opens the returned document URL and saves `Candidate_Contract_ID`.
- **Void:** Requires a void reason. Follows the same pattern as Client Agreement voiding (2-second delay before delete call).

---

### VP Evaluation

The evaluation lifecycle is managed by `checkVPEvaluationStatus(candidateId, jobId)`:

| Status | Button Color | Button Label |
|---|---|---|
| No evaluation / >6 months old | Blue | Create New Evaluation |
| Awaiting Client Response | Red (`#CF0000`) | Generated/Pending Client |
| Client Completed | Orange (`#BF3D08`) | Client Completed/Pending Choris |
| Choris Completed | Yellow (`#B9BF08`) | Choris Completed/Pending VP |
| All Completed | Green (`#008F32`) | VP Evaluation Completed |

**Creating a new evaluation** (`createNewEvaluation`):
- Inserts a new `VP_Evaluation` record with `Send_VP_Email_Check: false` and status `Awaiting Client Response`.
- Updates the Job Opening's `VP_Evaluation_ID`.

**Resending** (via `showEvaluationDialog`):
- Updates the VP Evaluation with a specific boolean field depending on the current status:
  - `Awaiting Client Response` → `Send_VP_Email_Check: true`
  - `Client Completed` → `Check_For_Client_Form: true`
  - `Choris Completed` → `Check_For_Choris_Comment_Form: true`
  - `All Completed` → `Send_Evaluation_PDF_Check: true`

---

### Email Candidate Summary

1. Select one or more associated candidates → **Email Candidate Summary** button becomes active.
2. On confirm, for each selected candidate:
   - Updates the candidate record with `Send_Email_To_Marko: true` and the `Job_ID`.
   - POSTs to an external Catalyst webhook endpoint.
3. Shows success/error feedback and reloads.

---

### Send Job Req Form to Client

Calls the `Dev_Send_Job_Requirement_Form` Zoho Function with the current job ID. Displays loading state on the button during the request.

---

## API Integrations

| Endpoint / Function | Trigger | Purpose |
|---|---|---|
| `Get_Associated_Candidates_of_Job` | On load | Fetch candidates associated with this job |
| `Send_Engagement_Contract` | Engagement Agreement button | Create & send engagement doc |
| `Aggrement_Delete_Contract` | Void buttons | Void a contract in Zoho Sign |
| `Dev_create_contract_agreement` | VP Agreement button | Create & send VP agreement doc |
| `Dev_create_client_agreement` | Client Agreement button | Create & send client agreement doc |
| `Dev_Send_Job_Requirement_Form` | Job Req Form button | Email job requirement form to client |
| Catalyst Webhook (`Send_Email_To_Candidate`) | Email Summary button | Send candidate profile email |

All Zoho Function calls use API key authentication (`zapikey`) passed as a query parameter.

---

## Key Variables

| Variable | Description |
|---|---|
| `id` | Current Job Opening record ID (from `data.meta.recordId`) |
| `candidateId` | ID of the hired/selected candidate |
| `all_associated_candidates` | Array of associated candidate objects |
| `associated_candidates` | Array of associated candidate IDs (integers) |
| `finalCandidatesResponse` | Full paginated response of all Recruit candidates |
| `selectedCandidates` | `Set` of candidate IDs selected for association |
| `hiredCandidateDetails` | Object holding details of the hired candidate for unhire operations |
| `engagementAgreementId` | Zoho Sign contract ID for the engagement agreement |
| `vpAgreementId` | Zoho Sign contract ID for the VP agreement |
| `clientAgreementId` | Zoho Sign contract ID for the client agreement |
| `VPName` | Name of the hired VP candidate |
| `companyName` | Company name from the job opening |
| `vpEvaluationName` | Name used when creating a VP Evaluation record |

---

## Error Handling

- All major async operations are wrapped in `try/catch` blocks.
- API failures surface a SweetAlert2 error dialog with a **Retry** prompt.
- Candidate table load errors show an inline error row in the DataTable.
- If note creation fails during unhire, the unhire process still completes (fail-safe).
- Email and phone fields include inline validation with red helper text before form submission.

---

## Setup & Deployment

### Prerequisites

- A Zoho Recruit account with widget/extension support enabled
- API key (`zapikey`) for the Zoho Functions you intend to call
- The Zoho Recruit Widget SDK (`ZRecruitHelper.js`) — loaded automatically from Zoho's CDN

### Steps

1. Clone or download this repository.
2. Replace the `zapikey` values in each API URL with your own Zoho API key.
3. Update the Catalyst webhook URL in `sendEmailToCandidates` if your endpoint differs.
4. Upload the widget files to Zoho Recruit under **Setup → Developer Space → Widgets**.
5. Configure the widget to display on the **Job Openings** detail page.
6. Publish and test in your Recruit environment.

---

## File Structure

```
├── index.html          # Main widget HTML, JS logic, and inline styles
└── CSS/
    └── styles.css      # External stylesheet (referenced but not included here)
```

---

## Notes & Caveats

- **API Key Security:** The `zapikey` is embedded in frontend URLs. For production use, consider routing these calls through a backend proxy or Zoho Deluge functions to avoid exposing the key.
- **Pagination:** The candidate loader fetches all candidates (200/page) on first click of "Associate More VP". For large databases this may take a few seconds.
- **`id` as Array vs String:** Throughout the code `id` is sometimes used as `id[0]` (array) and sometimes directly as a string. Ensure the value from `data.meta.recordId` matches the expected type in your Recruit environment.
- **`hiredCandidateDetails`:** This object is declared but not explicitly populated in the visible code — ensure it is populated before the UnHire flow is triggered in your implementation.
- **Browser Compatibility:** Tested with modern Chromium-based browsers as used in the Zoho Recruit embedded widget environment.
