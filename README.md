# CourtCast API

CourtCast API turns any basketball video into structured, query-ready stats & visualizations.

## Why CourtCast API?

Coaches, trainers, media editors, gambling startups, and even rec-league apps all want structured events (shot attempted, who, where, outcome, clock). Heat-maps are a nice by-product, but the real money is in a generic "video → JSON" pipe they can drop into their own dashboards.

## Project Goal

To build a computer-vision pipeline that converts raw basketball video into event-level JSON and embeddable shot charts. Target metrics include:
*   93% shot-detection F1
*   14 cm median location error
*   Processing 60 games/hour on a single RTX 3080

This project aims to onboard beta customers and generate MRR, demonstrating a marketable product.

## Key Features (MVP)
*   **Court Homography**: Map detections to canonical court coordinates (0-94 ft, 0-50 ft).
*   **Event Grammar**: JSON spec (`{event:"shot", shooter_id, outcome:"miss", x, y, game_clock}`) similar to SportVU.
*   **Webhooks + Signed URLs**: "Job-done" callbacks.
*   **One-liner Widget**: Embeddable JavaScript widget for heat-maps/shot charts.

## Tech Stack Overview
*   **Detection/Tracking**: YOLOv9 + DeepSORT
*   **Event Classifier**: 1D Temporal CNN
*   **Homography**: RANSAC on key court lines
*   **Serving**: FastAPI + Uvicorn + Redis queue
*   **Storage**: TimescaleDB (PostGIS for spatial queries)
*   **Auth & Billing**: Stripe (metered usage)

## Progress Report (WIP)

### Week 1
* Found 7 full-length NBA game videos (2016 NBA finals) for labeling
  * Processed videos using Handbrake for compression
  * Split 2-hour game vids into 10 minute chunks
* Currently setting up LabelStudio to label events in game videos

