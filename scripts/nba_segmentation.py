import cv2
import time
import numpy as np
import torch
import gc
import os
from pathlib import Path
from ultralytics import YOLO, SAM
from tqdm import tqdm

class BasketballSegmentationPipeline:
    def __init__(self, config=None):
        """Initialize basketball segmentation pipeline with YOLO + SAM"""
        
        # Default configuration optimized for basketball
        self.config = {
            # Model paths
            'yolo_model_path': "../notebooks/runs/detect/train/weights/best.pt",
            'sam_model_path': "sam2.1_b.pt",
            
            # Video settings
            'source_video': "../basketball_tracking/g7_finals_2025.mp4",  # Your example video
            'output_dir': "../basketball_tracking/segmentation/",
            'output_video_name': None,  # Auto-generated if None
            
            # Processing settings
            'start_frame': 0,
            'end_frame': None,  # Process entire video if None
            'scale_factor': 1.0,
            'target_fps': None,  # Keep original FPS if None
            
            # Basketball-specific detection settings
            'confidence_threshold': 0.6,  # Optimized for basketball
            'iou_threshold': 0.5,
            'max_detections': 50,  # Handle multiple players
            
            # SAM settings
            'sam_score_threshold': 0.0,
            'overlay_alpha': 0.3,
            
            # Performance settings
            'batch_processing': False,
            'memory_cleanup_interval': 1000,  # Frames
            'show_progress': True,
            
            # Basketball class mapping (based on your trained model)
            'class_names': {0: 'referee', 1: 'basket', 2: 'ball', 3: 'player'},
            'class_colors': {
                0: (255, 255, 0),   # Yellow for referee
                1: (0, 0, 255),     # Red for basket  
                2: (255, 165, 0),   # Orange for ball
                3: (0, 255, 0)      # Green for player
            }
        }
        
        # update with user config
        if config:
            self.config.update(config)
            
        # initialize models
        self._load_models()
        self._setup_paths()
    
    def _load_models(self):
        """Load YOLO and SAM models"""
        print("Loading basketball detection model...")
        self.yolo_model = YOLO(self.config['yolo_model_path'])
        print(f"Model classes: {self.yolo_model.names}")
        
        print("Loading SAM segmentation model...")
        self.sam_model = SAM(self.config['sam_model_path'])
        
        # gpu optimization
        if torch.cuda.is_available():
            print(f"Using GPU: {torch.cuda.get_device_name()}")
        else:
            print("Using CPU (slower processing)")
    
    def _setup_paths(self):
        """Setup input/output paths"""
        # create output directory
        self.output_dir = Path(self.config['output_dir'])
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # generate output video name if not provided
        if not self.config['output_video_name']:
            input_name = Path(self.config['source_video']).stem
            timestamp = int(time.time())
            self.config['output_video_name'] = f"{input_name}_segmented_{timestamp}.mp4"
        
        self.output_path = self.output_dir / self.config['output_video_name']
    
    def process_video(self):
        """Main video processing pipeline"""
        print(f"\n🏀 Starting basketball segmentation pipeline...")
        print(f"📹 Input: {self.config['source_video']}")
        print(f"💾 Output: {self.output_path}")
        
        # open video
        cap = cv2.VideoCapture(self.config['source_video'])
        if not cap.isOpened():
            raise ValueError(f"❌ Error: Could not open video {self.config['source_video']}")
        
        # get video properties
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        input_fps = int(cap.get(cv2.CAP_PROP_FPS))
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # calculate processing range
        start_idx = self.config['start_frame']
        end_idx = self.config['end_frame'] if self.config['end_frame'] else total_frames
        end_idx = min(end_idx, total_frames)
        
        print(f"📊 Video info: {frame_width}x{frame_height} @ {input_fps}fps")
        print(f"🎯 Processing frames {start_idx} to {end_idx} ({end_idx - start_idx} frames)")
        
        # setup video writer
        output_fps = self.config['target_fps'] if self.config['target_fps'] else input_fps
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        
        # adjust dimensions if scaling
        if self.config['scale_factor'] != 1.0:
            output_width = int(frame_width * self.config['scale_factor'])
            output_height = int(frame_height * self.config['scale_factor'])
        else:
            output_width, output_height = frame_width, frame_height
            
        out = cv2.VideoWriter(str(self.output_path), fourcc, output_fps, (output_width, output_height))
        
        # processing variables
        processed_frames = 0
        total_processing_time = 0
        
        # progress bar
        pbar = tqdm(total=end_idx - start_idx, desc="🎬 Processing frames") if self.config['show_progress'] else None
        
        try:
            # skip to start frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, start_idx)
            
            for frame_idx in range(start_idx, end_idx):
                ret, frame = cap.read()
                if not ret:
                    print(f"⚠️  Warning: Could not read frame {frame_idx}")
                    break
                
                # process frame
                start_time = time.time()
                processed_frame = self._process_frame(frame, frame_idx)
                processing_time = time.time() - start_time
                
                if processed_frame is not None:
                    out.write(processed_frame)
                    processed_frames += 1
                    total_processing_time += processing_time
                
                # update progress
                if pbar:
                    pbar.update(1)
                    if processed_frames > 0:
                        avg_fps = processed_frames / total_processing_time
                        pbar.set_postfix({'FPS': f'{avg_fps:.1f}'})
                
                # memory cleanup
                if frame_idx % self.config['memory_cleanup_interval'] == 0:
                    self._cleanup_memory()
        
        finally:
            # cleanup
            cap.release()
            out.release()
            if pbar:
                pbar.close()
            self._cleanup_memory()
        
        # summary
        if processed_frames > 0:
            avg_processing_fps = processed_frames / total_processing_time
            print(f"\n✅ Processing completed!")
            print(f"📈 Processed {processed_frames} frames")
            print(f"⚡ Average processing speed: {avg_processing_fps:.2f} FPS")
            print(f"💾 Output saved: {self.output_path}")
        else:
            print("❌ No frames were processed")
    
    def _process_frame(self, frame, frame_idx):
        """Process a single frame with YOLO + SAM"""
        try:
            # resize if needed
            if self.config['scale_factor'] != 1.0:
                frame = cv2.resize(frame, None, 
                                 fx=self.config['scale_factor'], 
                                 fy=self.config['scale_factor'])
            
            # yolo detection with basketball-optimized settings
            results = self.yolo_model.track(
                frame, 
                persist=True,
                conf=self.config['confidence_threshold'],
                iou=self.config['iou_threshold'],
                max_det=self.config['max_detections'],
                verbose=False
            )
            
            # extract detections
            if not results or not results[0].boxes:
                return frame  # return original frame if no detections
            
            boxes = results[0].boxes.xyxy.cpu().numpy()
            confidences = results[0].boxes.conf.cpu().numpy()
            class_ids = results[0].boxes.cls.cpu().numpy().astype(int)
            track_ids = results[0].boxes.id.cpu().numpy() if results[0].boxes.id is not None else None
            
            # sam segmentation using yolo detections - CORRECTED
            if len(boxes) > 0:
                # Use SAM2.1 with bboxes
                sam_results = self.sam_model(
                    frame, 
                    bboxes=boxes.tolist(),  # Convert to list format
                    verbose=False,
                    conf=self.config['sam_score_threshold']  # Confidence threshold for mask quality
                )
                
                annotated_frame = self._create_annotations(
                    frame, boxes, confidences, class_ids, track_ids, sam_results
                )
                return annotated_frame
            
            return frame
            
        except Exception as e:
            print(f"⚠️  Error processing frame {frame_idx}: {e}")
            return frame
    
    def _create_annotations(self, frame, boxes, confidences, class_ids, track_ids, sam_results):
        """Create annotated frame with basketball-specific visualizations"""
        annotated_frame = frame.copy()
        
        # Create a single colored mask for all objects
        combined_colored_mask = np.zeros_like(frame)

        # Extract masks from SAM results - CORRECTED for SAM2.1
        masks = None
        if sam_results and len(sam_results) > 0:
            try:
                # SAM2.1 returns results differently
                if hasattr(sam_results[0], 'masks') and sam_results[0].masks is not None:
                    masks = sam_results[0].masks.data.cpu().numpy()
                else:
                    print("⚠️  No masks found in SAM results")
            except Exception as e:
                print(f"⚠️  Error extracting masks: {e}")
        
        for i, (box, confidence, class_id) in enumerate(zip(boxes, confidences, class_ids)):
            x1, y1, x2, y2 = map(int, box)
            
            # get basketball-specific styling
            class_name = self.config['class_names'].get(class_id, f'class_{class_id}')
            color = self.config['class_colors'].get(class_id, (255, 255, 255))
            
            # adjust color based on confidence
            if confidence < 0.7:
                color = tuple(int(c * 0.6) for c in color)  # dim color for low confidence
            
            # create label with basketball context
            label_parts = [class_name, f"{confidence:.2f}"]
            if track_ids is not None and i < len(track_ids):
                track_id = int(track_ids[i])
                label_parts.insert(-1, f"ID:{track_id}")
            label = " ".join(label_parts)
            
            # draw bounding box
            thickness = 3 if class_name == 'ball' else 2  # thicker for ball
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, thickness)
            
            # draw label with background
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(annotated_frame, (x1, y1 - label_size[1] - 10), 
                         (x1 + label_size[0], y1), color, -1)
            cv2.putText(annotated_frame, label, (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # add sam mask to the combined mask
            if masks is not None and i < len(masks):
                try:
                    mask = masks[i]
                    if mask.ndim == 3:
                        mask = mask[0]  # Take first channel if 3D
                    
                    # Ensure mask is binary
                    mask_binary = (mask > 0.5).astype(np.uint8)
                    
                    # Add the colored mask to the combined mask
                    mask_indices = mask_binary > 0
                    combined_colored_mask[mask_indices] = color
                    
                except Exception as e:
                    print(f"⚠️  Error applying mask {i}: {e}")
        
        # blend the combined mask with the frame
        alpha = self.config['overlay_alpha']
        annotated_frame = cv2.addWeighted(
            annotated_frame,
            1 - alpha,
            combined_colored_mask,
            alpha,
            0
        )
        
        return annotated_frame
    
    def _cleanup_memory(self):
        """Clean up GPU memory"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()

def main():
    """Main execution function"""
    # basketball-specific configuration
    config = {
        'source_video': "../basketball_tracking/g7_finals_2025.mp4",
        'start_frame': 0,
        'end_frame': 1500,  # Process first 1500 frames for testing
        'confidence_threshold': 0.6,
        'show_progress': True,
        'overlay_alpha': 0.7,  # Increase alpha for better mask visibility
        'sam_score_threshold': 0.5,  # Add threshold for mask filtering
    }
    
    # create and run pipeline
    pipeline = BasketballSegmentationPipeline(config)
    pipeline.process_video()

if __name__ == "__main__":
    # handle windows path issues
    os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
    main()