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

## Status

In development. See BUILD_PLAN.md for the step by step plan. MVP is Step 10.
