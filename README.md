# Tez Extractor

Turns trucking rate confirmation emails and PDFs into structured load records.

## The problem

Tez Group Inc was a Nashville based trucking carrier (MC 1160002, DOT 3507693) that ran dispatch through a shared Gmail inbox. Every load booked through a broker arrived as a rate confirmation: a PDF or email that looks completely different depending on the broker. Integrity Express Logistics sends a three page table. FST Brokerage sends a different layout. Some arrive as photos of a phone screen. A dispatcher had to read each one and retype the pickup, delivery, rate, and equipment details by hand into spreadsheets. Retyping is slow and mistakes are expensive: a missed appointment window can cost $250 per day in late fees.

## What this does

1. Accepts a rate confirmation (PDF upload, image, or email text)
2. Extracts the text (direct text layer when the PDF has one, vision model when it is a scan or photo)
3. Uses the Claude API to pull out a structured load record: broker, load number, pickup and delivery locations with dates and time windows, miles, weight, equipment type, and rate, each with a confidence score
4. Validates the result (dates must parse, rate must be a number, required fields present) and flags anything uncertain as needs review
5. Shows everything in a dashboard where a dispatcher can review, correct, and approve records

Accuracy is measured against a hand labeled answer key built from real Tez Group rate confirmations.

## Stack

Next.js, TypeScript, Supabase (PostgreSQL), Claude API, Vercel.

## Samples

The `samples/` folder holds real rate confirmations from four brokers (kept out of git because they contain real phone numbers and contact details). The eval answer key is built from these.

## Accuracy

Measured against a hand labeled answer key covering all 13 sample documents (156 field cells) from 9 different brokers, run through the live pipeline by `scripts/eval.mjs`:

| Model | Overall | Clean rate confirmation PDFs | Cost per full run |
|---|---|---|---|
| Claude Opus 4.8 | 92.9% (145/156) | 100% (84/84) | $0.39 |
| Claude Haiku 4.5 | 93.6% (146/156) | 98.8% (83/84) | $0.06 |

The aggregate scores are close, but the error types differ: the smaller model made category confusions (reading the carrier's MC number as the load number, naming the carrier as the broker) that the larger model avoided. Known limitation surfaced by the eval: a screenshot listing multiple available loads fools both models into reporting one of them as the booked load; the fix would be a document classifier stage upstream.

## Status

MVP complete (Steps 1 to 10). See BUILD_PLAN.md for what each step delivered and the Phase 2 and 3 roadmap.
