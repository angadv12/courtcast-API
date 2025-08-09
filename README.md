# CourtCast API

CourtCast API turns broadcast basketball footage into structured, query-ready stats & visualizationss.

## Why CourtCast API?

Coaches, trainers, media editors, gambling startups, and even rec-league apps all want structured events (shot attempted, who, where, outcome, clock). Heat-maps are a nice by-product, but the real money is in a generic "video → JSON" pipe they can drop into their own dashboards.

## Project Goal

To build a computer-vision pipeline that converts raw basketball video into event-level JSON and embeddable shot charts.

Target metrics include:
*   90% mAP50, 90% Precision, 90% Recall

This project aims to simulate beta customers, demonstrating a marketable product.

## Key Features (MVP)
*   **Player/Ball Tracking**: Detect and track ball and moving players to map to court position.
*   **Court Homography**: Map court keypoints to canonical court coordinates (0-94 ft, 0-50 ft).
*   **Event Grammar**: JSON spec (`{event:"shot", shooter_id, outcome:"miss", x, y, game_clock}`) similar to SportVU.
*   **Webhooks + Signed URLs**: "Job-done" callbacks.
*   **One-liner Widget**: Embeddable JavaScript widget for heat-maps/shot charts.

## Tech Stack Overview
*   **Detection/Tracking**: YOLOv11
*   **Event Classifier**: 1D Temporal CNN
*   **Homography**: RANSAC on key court lines
*   **Serving**: FastAPI + Uvicorn + Redis queue
*   **Storage**: TimescaleDB (PostGIS for spatial queries)
*   **Auth & Billing**: Stripe (metered usage)

## Progress Timeline (WIP)

### Phase 1 - detection done
* Set up YOLOv11 for processing pre-labeled images of NBA in-game frames
    * Used for player/ball tracking
    * Images dataset from [Roboflow](https://universe.roboflow.com/technion-ui0ov/basket-recognition-9ztqo/dataset/6) by Technion.
* Fine-tuned YOLOv11-Small model for basketball player/ball/basket/referee tracking
   * Trained in 50 epochs, 1280px resolution, with augmentation: degrees=5, translate=0.1, mosaic=0.5
   * All training done on singular RTX 3070-Ti running CUDA=12.1, training done in 26m for 50 epochs using batch=4
* Achieved all target metrics:
   * 98.4% mAP50, 97.9% Precision, 96.7% Recall
 
### Phase 2 - segmentation done (kinda)
* Used SAM2.1 in conjunction with custom YOLO model to segment object detections
   * initial script written in `scripts/nba_segmentation.py`
 * Installing SAM2 on windows was an unreal experience

### Phase 3 - frontend scaffold started
* Used bolt.new to generate modern UI
   * video upload with graceful handling
   * video player (just shows uploaded video no detection/segmentation for now)
   * live court map (i changed this to be static image that will be mapped to later)
   * dummy players for court map overlay
   * dummy analytics
