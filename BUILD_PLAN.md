# Tez Extractor Build Plan

Each step ends with something you can run and see. MVP is Step 10.

## Phase 1: The extractor (MVP)

- [x] **Step 1: Project kickoff.** Repo created, 13 real sample documents collected in `samples/` (7 PDFs and 6 email screenshots from Integrity Express Logistics, Transportation One, FST Brokerage Services, and TMC).
- [x] **Step 2: App scaffold.** Create the Next.js + TypeScript app, run it locally, see the home page. (Next.js 16, React 19, Tailwind; dev server on port 3001)
- [x] **Step 3: Database.** Supabase project with a `loads` table: broker, load_number, pickup_location, pickup_date, pickup_window, delivery_location, delivery_date, delivery_window, miles, weight, equipment, rate, status, needs_review, confidence, raw_text, source_file. Locked down with RLS; server side secret key only; verified via /api/db-check.
- [x] **Step 4: Text extraction.** API route that accepts an uploaded PDF and returns its raw text. Detect PDFs with no text layer (like semail.pdf) and mark them for the vision path. Verified against all samples: 6 PDFs extract 1,489 to 7,505 chars; semail.pdf and images correctly flagged needsVision.
- [x] **Step 5: The extraction brain.** Send the raw text to the Claude API with a prompt that returns strict JSON matching our load record schema, with a confidence value per field. Verified against 3 broker layouts (Integrity Express, FST, Transportation One): every field correct, all high confidence, 2 to 3.5 cents per document.
- [x] **Step 6: Vision path.** Screenshots go to Claude as images; scanned PDFs go as native PDF documents read visually. Verified: semail.pdf (zero text layer) produced a complete all high confidence record (Zipline Logistics, 5th broker); cover email screenshots correctly returned only the visible fields as null free extractions with low confidence flags, no hallucination.
- [x] **Step 7: Validation layer.** Code (not the model) checks every result: required fields present, dates parse and are ordered, rate/miles/weight in sane ranges, low confidence fields flagged. Verified both directions: clean Axle Logistics PDF passes with zero problems; partial screenshot flagged needs_review with 6 named problems.
- [x] **Step 8: Upload page.** Drag and drop or click to browse; shows the extracted record with per field confidence dots, Ready or Needs review badge, validation problems, path taken, and cost. Verified end to end in the browser.
- [x] **Step 9: Review dashboard.** Every extraction now persists to the Supabase loads table. The /loads dashboard lists all records with status badges (Extracted, Needs review, Approved); clicking a row opens an editor for all 12 fields with Save and approve. Verified end to end in the browser: flagged record corrected (rate set by reviewer) and approved, status updated in Postgres.
- [ ] **Step 10: Accuracy eval (MVP).** Hand label the correct answers for all 13 samples into an answer key file. A script runs the extractor against all of them and prints per field accuracy. This number goes on the resume, whatever it honestly is.

## Phase 2: The inbox

- [ ] **Step 11: Email ingestion.** A forwarding address or Gmail integration so rate confirmations flow in automatically instead of by manual upload.
- [ ] **Step 12: Dedupe and threading.** The same load often arrives twice (original plus a revised rate con). Detect updates to an existing load instead of creating duplicates.
- [ ] **Step 13: Deploy.** Vercel production deploy with a simple login.

## Phase 3: Toward a small TMS

- [ ] **Step 14: Load lifecycle.** Statuses: booked, picked up, delivered, paperwork complete, invoiced, paid.
- [ ] **Step 15: Rate analytics.** Rate per mile, broker comparison, lane history from accumulated records.
- [ ] **Step 16: Accounting export.** CSV export of completed loads for invoicing and settlements.
