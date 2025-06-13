from ultralytics import YOLO
import os
import time
import gc
import torch

def track_basketball_video(input_video_path, output_video_path=None):
    """
    Track basketball players, referees, balls, and baskets in a video
    
    Args:
        input_video_path: Path to your input MP4 video
        output_video_path: Path for output video (optional - auto-generated if None)
    """
    
    # Load your trained model
    model = YOLO(r'C:\Users\Angad Brar\Desktop\courtcast-API\notebooks\runs\detect\train\weights\best.pt')
    print(f"Model loaded! Classes: {model.names}")
    
    # Auto-generate output path if not provided
    if output_video_path is None:
        base_name = os.path.splitext(os.path.basename(input_video_path))[0]
        output_video_path = f"{base_name}_tracked.mp4"
    
    print(f"Input video: {input_video_path}")
    print(f"Output video: {output_video_path}")
    print("Starting tracking...")
    
    start_time = time.time()
    
    # Run tracking on the video
    results = model.track(
        source=input_video_path,
        
        # Output settings
        save=True,                    # Save the annotated video
        project='basketball_tracking', # Output folder
        name='tracked_video',         # Subfolder name
        exist_ok=True,               # Overwrite if exists
        
        # Model parameters
        imgsz=1280,
        conf=0.6,                    # Confidence threshold (adjust if needed)
        iou=0.5,                     # IoU threshold for NMS
        max_det=50,                  # Limit detections per frame
        
        # Tracking parameters
        tracker='bytetrack.yaml',    # Tracking algorithm
        persist=True,                # Maintain tracker between frames
        
        # Visualization
        show_labels=True,            # Show class names
        show_conf=True,              # Show confidence scores
        show_boxes=True,             # Show bounding boxes
        line_width=2,                # Box line thickness
        
        # Performance
        stream=True,                 # Process frame by frame (memory efficient)
        verbose=True                 # Show progress
    )
    
    # Process the video (this consumes the generator)
    frame_count = 0
    for result in results:
        frame_count += 1
        if frame_count % 1000 == 0:  # Progress update every 1000 frames
            print(f"Processed {frame_count} frames...")
            # Clear memory periodically
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    print(f"\n🎉 Tracking completed!")
    print(f"⏱️  Processing time: {processing_time:.1f} seconds")
    print(f"📁 Output saved to: basketball_tracking/tracked_video/")
    print(f"🎬 Look for your annotated video in that folder!")
    
    # Final memory cleanup
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()
    
    return frame_count

if __name__ == "__main__":
    input_video = "C:/Users/Angad Brar/Desktop/courtcast-API/images/thunder_pacers_g3.mp4"
    os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
    frame_count = track_basketball_video(input_video)
    
    # Don't convert generator to list - causes memory issues
    print("\n📊 Tracking Summary:")
    print(f"Total frames processed: {frame_count}")
    print("Processing completed successfully!")