# Frontend Updates & Feature Completeness Plan

Generated: January 30, 2026

## Analysis Summary
- **Backend ↔ Frontend Route Congruence:** ~80% — Most CRUD operations implemented; missing cover letter, resume edit, job retry/cancel, and interview stages UI.
- **Navbar Usability:** Good but has redundancy; nav ordering could be optimized.
- **Page Design & UI Consistency:** Good — Styles, colors, and interaction patterns are consistent.
- **Overall Readiness:** ~75–80% ready for production.

---

## Priority 1: Ease of Use (Highest Impact)

### [ ] Add "Generate Resume" button to job-application detail page
- **File:** `src/routes/job-applications/[id]/+page.svelte`
- **Rationale:** Allow one-click resume generation from app detail without navigating to selection page.
- **Implementation:** Add button near "Edit" and "Edit Status" buttons that navigates to `/resumes/generate?jobApplicationId={app.id}`
- **Backend Support:** ✓ Already supports `POST /resumes/generate` with `jobApplicationId`

### [ ] Add interview-stages link to job-application detail
- **File:** `src/routes/job-applications/[id]/+page.svelte`
- **Rationale:** Make interview stage tracking discoverable; currently hidden despite backend/page existing.
- **Implementation:** Add a tab or link section (e.g., "Interview Stages") that navigates to `/job-applications/{id}/interview-stages`
- **Backend Support:** ✓ Routes exist in `internal/domains/jobapplications/interviewstages`

### [ ] Add "Generate Cover Letter" button to job-application detail
- **File:** `src/routes/job-applications/[id]/+page.svelte`
- **Rationale:** Expose backend feature `POST /job-applications/:id/generate-cover-letter`
- **Implementation:** Add button that calls the endpoint and displays result (modal or inline).
- **Backend Support:** ✓ Endpoint exists; needs frontend integration.

---

## Priority 2: Feature Completeness

### [ ] Create resume detail/edit page
- **Files:** 
  - Create `src/routes/resumes/[id]/+page.svelte` (detail view)
  - Create `src/routes/resumes/[id]/edit/+page.svelte` (or single edit form)
- **Rationale:** Currently no way to edit resume title/tags after upload.
- **Implementation:** 
  - Display resume metadata (title, tags, isMain, isFeatured, createdAt)
  - Add edit form or inline editing for title and tags
  - Call `PATCH /resumes/:id` to update
- **Backend Support:** ✓ `PATCH /resumes/:id` exists

### [ ] Add visual indicators for main/featured resumes
- **File:** `src/routes/resumes/+page.svelte`
- **Rationale:** Currently buttons exist but no visual distinction; users can't see at a glance which resume is active.
- **Implementation:** Add badges/icons (e.g., "⭐ Main" and "✨ Featured" badges) on resume cards.

### [ ] Add retry/cancel UI for failed generation jobs
- **File:** `src/routes/resumes/generate/+page.svelte` (ResumeGenerationProgress component)
- **Rationale:** If a resume generation fails, no way to retry without regenerating from scratch.
- **Implementation:** 
  - In progress component, after failure, show "Retry" and "Cancel" buttons
  - Call `POST /resumes/jobs/:id/retry` or `POST /resumes/jobs/:id/cancel`
- **Backend Support:** ✓ Endpoints exist

---

## Priority 3: UX Polish

### [ ] Reorganize navbar links
- **File:** `src/routes/+layout.svelte`
- **Current Order:** Dashboard → Applications → Resumes → Generate Resume → New Application → Profile
- **Suggested Order:** Applications → Dashboard → Resumes → Generate Resume → Profile
- **Rationale:** Primary action (Applications) first; "New Application" becomes inline button in list page.
- **Implementation:** Reorder link elements; keep "New Application" on list page, not navbar.

### [ ] Add mobile-responsive hamburger menu
- **File:** `src/routes/+layout.svelte`
- **Rationale:** Navbar has 6+ links; will overflow on mobile without hamburger.
- **Implementation:** Conditionally show hamburger button on small screens; use slide-out menu or dropdown.

### [ ] Add confirmation dialogs for all destructive actions
- **Files:** Multiple (job-applications, resumes pages)
- **Current State:** Delete actions already have `confirm()` dialog.
- **Rationale:** Ensure all destructive operations (delete, mark as main, etc.) ask for confirmation.
- **Implementation:** Review existing delete handlers; add `confirm()` where missing.

### [ ] Display language on application list
- **File:** `src/routes/job-applications/+page.svelte`
- **Rationale:** Language field is stored but not visible in the list; users won't know what language is set.
- **Implementation:** Add language as a badge/tag on each application card (e.g., next to "Interest Level").

---

## Priority 4: Minor Tweaks

### [ ] Complete interview-stages page UI
- **File:** `src/routes/job-applications/[id]/interview-stages/+page.svelte`
- **Rationale:** Page exists in file structure but design/completeness unknown.
- **Implementation:** Review and finalize (or confirm if already complete).

### [ ] Add form field hints for application fields
- **Files:** `src/routes/job-applications/new/+page.svelte`, `src/routes/job-applications/[id]/edit/+page.svelte`
- **Rationale:** Fields like "source" and "applicationMethod" may confuse users.
- **Implementation:** Add descriptive placeholders and help text.

### [ ] Update event bindings (completed)
- **Status:** ✓ DONE — Converted `onclick` to `on:click`, `onchange` to `on:change`, etc.

### [ ] Make resume download use configured backend URL (completed)
- **Status:** ✓ DONE — Updated `/resumes/generate` to use `config.jobsApiUrl` instead of relative path.

---

## Implementation Order

1. **Phase 1 (P1):** Add buttons/links to app detail (resume gen, interview stages, cover letter)
2. **Phase 2 (P2):** Resume detail/edit page + visual indicators
3. **Phase 3 (P2):** Retry/cancel for generation
4. **Phase 4 (P3):** Navbar reorganization + mobile menu
5. **Phase 5 (P3/P4):** Language display + form hints

---

## Testing Checklist

- [ ] All new buttons navigate/call correct endpoints
- [ ] Resume generation with `jobApplicationId` pre-filled works
- [ ] Interview stages page loads and displays data
- [ ] Cover letter generation triggers correctly
- [ ] Resume edit form updates metadata
- [ ] Main/featured badges display correctly
- [ ] Retry/cancel buttons appear on failed jobs
- [ ] Mobile navbar menu is usable on small screens
- [ ] Language field appears on app list

---

## Notes

- **Backend Endpoints Ready:** All required endpoints exist and are functional.
- **CRUD Gaps:** Resume metadata editor (detail/edit page) is the only significant missing CRUD page.
- **API Congruence:** Frontend API client (`resumesApi`, `jobApplicationsApi`) already supports all endpoints used by new features.
