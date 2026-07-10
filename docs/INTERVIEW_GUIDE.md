# Interview Guide: Tez Extractor

Study notes so you can explain every part of this project thoroughly. Read one section per day and say the answers out loud.

## The 30 second pitch

"My family ran a trucking company in Nashville. Every load we booked arrived as a rate confirmation, a PDF that looks different for every broker, and dispatchers retyped them into spreadsheets by hand. I built a tool that extracts those documents into structured load records using an LLM, validates the output with code, and gives dispatchers a review dashboard. I measured it against a hand labeled answer key built from our real documents."

Why this pitch works: real problem, real documents, a measurable result, and it shows you know that LLM output cannot be trusted blindly.

## The trucking vocabulary (know these cold)

- **Carrier**: the company that owns trucks and moves freight. Tez Group was a carrier.
- **Broker**: middleman who finds freight for carriers and takes a cut. Integrity Express Logistics, Transportation One, FST were brokers Tez worked with.
- **Rate confirmation (rate con)**: the contract for one load. Says pickup, delivery, rate, equipment, rules, and fines.
- **Load**: one shipment, one truck, point A to point B for an agreed rate.
- **BOL (bill of lading)**: the paper the shipper signs saying what got loaded.
- **POD (proof of delivery)**: the signed paper proving the load arrived. No POD, no payment.
- **MC and DOT numbers**: federal registration numbers for carriers. Tez Group was MC 1160002, DOT 3507693.
- **Detention**: money owed when a driver waits too long at pickup or delivery.
- **Accessorial**: any extra charge beyond the base rate (lumper fees, pallet exchange, detention).
- **Equipment**: trailer type. "Van 53 ft DRY" means a standard 53 foot dry van.
- **FCFS**: first come first served, a pickup with no fixed appointment, just a window.

## Every feature, and the why behind it

### 1. Document ingestion (PDF, image, email text)
**What**: accept a rate con in any form it actually arrives.
**Why**: because real documents are messy. Our own samples include a clean three page PDF, a PDF with no text layer, and phone screenshots of emails. A system that only handles clean PDFs handles maybe half of reality.
**Interview line**: "The hardest part of document extraction is not the parsing, it is that every broker formats things differently and half the inputs are photos."

### 2. Text layer detection
**What**: check if the PDF actually contains selectable text. If not, route it to the vision path.
**Why**: some PDFs are just a picture wrapped in a PDF file. Running text extraction on those returns nothing. You have to detect that case and handle it differently.
**Interview line**: "I check the extracted character count; below a threshold I treat the document as a scan and send the rendered image to the vision model instead."

### 3. LLM extraction with a strict schema
**What**: send the document to the Claude API with a prompt that forces JSON output matching the load record schema, one confidence score per field.
**Why**: classic regex parsing breaks the moment a new broker shows up with a new layout. An LLM generalizes across layouts. But you constrain it with a schema so the output is machine usable, not prose.
**Interview line**: "The model handles layout variety; the schema handles reliability. I ask for per field confidence so the system knows what it does not know."

### 4. Validation layer in code
**What**: after the model answers, plain TypeScript checks every field: dates must parse, the rate must be a positive number, required fields must exist, delivery cannot be before pickup.
**Why**: this is the most important engineering decision in the project. LLMs sometimes produce plausible but wrong output. Code catches the wrongness the model is confident about.
**Interview line**: "I never let model output into the database unchecked. Deterministic validation runs on every extraction, and anything that fails or scores low confidence is flagged needs review instead of silently stored."

### 5. Review dashboard (human in the loop)
**What**: a table of extracted loads. Flagged records show the original document side by side with the extracted fields so a dispatcher can fix and approve.
**Why**: a tool that is right 95 percent of the time but gives you no way to catch the other 5 percent is useless for money documents. A missed appointment window costs $250 a day in late fees per the rate con terms.
**Interview line**: "The goal is not replacing the dispatcher, it is turning ten minutes of retyping into thirty seconds of review."

### 6. Accuracy evaluation against an answer key
**What**: hand labeled correct values for all sample documents, and a script that scores the extractor per field.
**Why**: without measurement, "it works" is a feeling. With it, you get a number, you know which fields fail (time windows are usually hardest), and every prompt change is testable.
**Interview line**: "I built the eval before polishing the prompt. That way every change was measured, not vibes."

## Questions an interviewer will ask, with honest answers

**"Why not just use regex or a PDF table parser?"**
Because there were four brokers in my sample set alone and each formats differently. Regex per broker means new code for every new broker. The LLM approach handled all four layouts with one prompt, and the eval proved it.

**"How do you handle the model being wrong?"**
Three layers: per field confidence from the model, deterministic validation in code, and a human review queue for anything flagged. Wrong and confident is the dangerous case, which is why validation is code, not another model call.

**"What was the hardest input?"**
Phone screenshots of emails, and one PDF that was a scan with no text layer. Both go through the vision path, where the model reads the image directly.

**"Why Supabase / Postgres?"**
Load records are relational and I query them by status, broker, and date. I had shipped with this stack before (ScholarUz, ClassroomAI), so I could move fast and spend the time on extraction quality instead.

**"What would you build next?"**
Email ingestion so records flow straight from the inbox, dedupe for revised rate cons, then lifecycle tracking through delivery, POD, and invoicing. Each stage reuses the same pattern: extract, validate, review.

**"Is this real data?"**
Yes, real rate confirmations from my family's carrier operation. That is also why the samples are not in the public repo: they contain real driver and broker phone numbers.

## The rule for everything

Never claim a feature that is not merged and working. In an interview, "that is the next step on my build plan" is a strong answer, not a weak one.
