# Market Research: Making Tez Extractor the Highest Leverage Portfolio Project

*Compiled 2026-07-12 from five parallel research passes: hiring standards, freight tech landscape, document AI production practices, GitHub competitive landscape, and resume metric framing.*

## The verdict

Tez Extractor is already aimed at the most funded application category in freight tech (back office document and email automation), and its architecture (nullable schema, per field confidence, deterministic validation, human review, accuracy eval) is exactly what both hiring guides and industry engineering blogs call the scarcest signal. The plan below is about finishing it, proving it with numbers, and adding the two extensions with the highest payoff per week of work.

## What the research validated

1. **The problem is worth real money.** Vooma raised $16.6M and its "Build" product (extract shipment details from emails/PDFs/screenshots into a TMS) is this exact use case, sold to brokers. Datatruck's TruckGPT does rate confirmations for carriers "in under 15 seconds with 90%+ accuracy across 20+ document types." HappyRobot ($62M), Drumkit, Levity, Parade, and McLeod all monetize freight inbox automation. Industry stat: 75% of supply chain data is still trapped in emails, PDFs, and faxes.
2. **The niche is empty on GitHub.** Every public rate confirmation extractor has zero stars, no tests, no accuracy numbers, no demo. The best open source TMS (LogisticsX, 171 stars) has no document extraction at all. Nobody combines the two. There is no usable public rate con benchmark dataset anywhere (closest: LoREx-160, 160 screenshots, restrictive license, no baselines, 0 stars).
3. **Hiring managers rank "a tool a family member's business actually uses regularly" as the highest impact project type** (2026 portfolio guidance), and evaluation rigor (golden set, per field accuracy, regression gates) as the differentiator most engineers skip. Real users beat polish; tutorial clones and generic "GPT wrapper" bullets are now negative signal.
4. **The numbers to aim for are known.** Honest per field accuracy of 92 to 95% on a real golden set reads as respectable; 97%+ on hard documents is impressive; unqualified "99% accurate" with no methodology reads as marketing. The industry's native KPI is straight through processing rate (% of documents needing no human touch): legacy automation ~30 to 50%, modern AI deployments 70 to 93%. Cost story: fractions of a cent to a few cents per document, with a model tiering rule (cheap model default, escalate on validation failure).

## Ranked: highest leverage moves

### 1. Finish the MVP and get Tez Group actually using it (Steps 8 to 13)
Real production use at a real 120 truck carrier is the single most repeated differentiator across every hiring source. It moves the project from "side project" to "work experience" on the resume. Before deployment, reconstruct the honest before baseline: rate cons per week through the Gmail inbox, minutes per document of manual entry, error incidents. Interviewers chain "walk me through the data" follow ups; the baseline is what makes every later number defensible.

### 2. Make Step 10 the centerpiece, and extend it
The accuracy eval is already planned. Extend it into the full credibility package that production write ups (nilenso, Alan, Ramp, Reducto) treat as standard:
- Per field accuracy table with written rubric (exact match vs normalized per field type), methodology stated (golden set size, how ground truth was labeled)
- Model comparison table: Opus vs Haiku (and optionally others) on accuracy, cost per document, latency
- Straight through processing rate: % of documents that pass validation with no review flag
- Hallucination scored worse than omission in the rubric (one line that signals domain maturity)
- Regression gate: rerun the golden set on any prompt or model change

### 3. Add broker verification at ingestion (new step, the fraud angle)
Freight fraud is the #1 industry problem of 2025 to 2026: $455M+ reported losses in 2024, 400% rise in double brokering reports since 2022, FMCSA replacing its 40 year old registration system (MOTUS) in 2026. Fraud tooling is broker centric; carriers verifying brokers is the underserved reverse direction (Highway launching "Highway for Carriers" proves the demand). When a rate con is extracted, resolve the broker's MC number against FMCSA's free official QCMobile API (https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi): authority status, broker vs carrier authority (a "broker" with only carrier authority is a double brokering red flag), out of service status, name mismatch vs the rate con letterhead. Fraud flags drop naturally into the existing confidence + review dashboard architecture. Free data, small build, mirrors companies like Highway and Truckstop RMIS.

### 4. Publish an open rate confirmation benchmark + eval harness
Effectively novel: zero matching datasets on Hugging Face, zero HN stories ever mention "rate confirmation." Precedent that benchmarks earn outsized attention: Reducto's RD-TableBench and OmniAI's OCR benchmark (637 stars, front page Show HN) are companies using open benchmarks as credibility engines; no one has done it for freight documents. Route around confidentiality with synthetic rate cons calibrated to real layouts (multiple broker letterhead styles, degraded scan augmentation) plus a small hand verified anonymized real set, permissive license, runnable harness, published multi model baselines.

### 5. Close the loop to money: reconciliation and settlements (Phase 3+)
Mirrors Loop ($35M Series B, then a reported $95M round) and OpenEnvoy. Cross check extracted rate con terms against POD and invoice; auto generate driver settlements. The market criticism of a competing TMS ("AI that reads documents but does not change how settlements get paid") states the gap exactly. Datatruck claims "80% fewer rejected invoices" from this loop. Detention evidence capture (extract appointment windows and detention clauses, join with actual arrival times, auto draft detention invoices) is the least crowded adjacent niche and worth real money to Tez (FMCSA estimates $1.1 to 1.3B per year in lost driver wages industry wide).

### 6. The presentation package
Distilled from exemplary repos (LogisticsX, zerox, paperless-gpt, RD-TableBench):
- Demo GIF at the top of the README: PDF in, structured record out
- Results table front and center: per field accuracy, per model cost, STP rate
- One recruiter scannable line: "X% field level accuracy on N held out rate confirmations across M broker formats at $0.0X per document"
- Mermaid architecture diagram
- Honest limitations and failure taxonomy section (reviewers probe this first)
- Live demo with zero signup access, one command quickstart
- A short write up of motivation, decisions, and tradeoffs (writing about the project multiplies its hiring value)

## Resume rules distilled

- List Tez Group in **work experience** like any employer: company, title, dates. Never mention the family relationship on paper; if asked, acknowledge in one sentence and redirect to the work. Pick a non family reference (dispatcher, a broker contact).
- Bullet format: before and after absolutes beat bare percentages ("4 to 5 minutes per load to under 1 minute" beats "80% faster"). Volume plus accuracy pairs beat either alone ("N rate cons per month at X% field accuracy"). Include the eval or human fallback clause in the bullet itself; that single clause separates it from a wrapper claim.
- Every number must survive 30 seconds of conversational defense. Keep the arithmetic ready: N docs per week times M minutes before, m minutes after.
- Vocabulary that already exists in the industry (usable as comparison points): Datatruck "under 15 seconds, 90%+ accuracy"; Tai TMS "saves brokers ~11 hours a week"; Uber Freight's accuracy journey "60 to 70% at launch to 98%."

## Who this targets

The project doubles as a targeted application asset for freight tech and applied AI companies hiring in SF and remote: Vooma, HappyRobot, FleetWorks (YC, ex Uber Freight), Drumkit, Loop, Highway, Parade/Mudflap, Samsara, Motive, Uber Freight, project44, Flexport, Truckstop, DAT, plus any company hiring "AI engineer, document intelligence" (Reducto, Extend, Sensible, Instabase). Vertical AI investors (CRV thesis) explicitly value domain expertise plus workflow knowledge, which is the exact profile this project demonstrates.

## Honesty flags carried over from the research

- The "$35B per year double brokering cost" figure circulating in the industry is a talking point, far above documented reported losses ($455M in 2024); cite with attribution if used.
- HappyRobot's ROI multiples are self published marketing claims.
- Never present the system as an existing Tez production system until it is actually deployed and in daily use; the resume metric is whatever Step 10 honestly measures.

## Key sources

- Hiring: https://news.ycombinator.com/item?id=38511280 , https://jacobian.org/2020/may/8/engineering-resume-accomplishments/ , https://newsletter.pragmaticengineer.com/p/evals , https://stackoverflow.blog/2020/11/25/how-to-write-an-effective-developer-resume-advice-from-a-hiring-manager/
- Production doc AI: https://blog.nilenso.com/blog/2026/05/18/evals-before-prompts-building-an-llm-ocr-for-kyc/ , https://medium.com/alan/lessons-from-running-an-llm-document-processing-pipeline-in-production-33d87f99cdb1 , https://modal.com/blog/ramp-case-study , https://jxnl.co/writing/2025/09/11/why-most-document-parsing-sucks-adit-reducto/
- Freight tech: https://www.vooma.com/case-studies/zengistics , https://www.datatruck.io/truckgpt , https://highway.com/press-releases/highway-unveils-highway-for-carriers---empowering-carriers-to-verify-brokers-and-combat-fraud , https://truckstop.com/blog/2025-freight-fraud-report/ , https://mobile.fmcsa.dot.gov/QCDevsite/docs/qcApi
- Benchmarks: https://github.com/getomni-ai/benchmark , https://reducto.ai/blog/rd-tablebench , https://docile.rossum.ai/
- Resume metrics: https://www.tealhq.com/post/xyz-resume , https://resumeworded.com/how-to-quantify-resume-key-advice , https://github.com/alexeygrigorev/ai-engineering-field-guide
