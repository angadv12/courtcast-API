if __name__ == "__main__":
    import os
    import subprocess
    import sys

    sys.stdout.flush()
    os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
    os.environ['PYTHONUNBUFFERED'] = '1'

    # get gpu information
    try:
        result = subprocess.run(['nvidia-smi'], capture_output=True, text=True, check=True)
        print(result.stdout)
        print("=" * 50)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("nvidia-smi not available or no NVIDIA GPU detected")

    import os
    HOME = os.getcwd()
    print(HOME)

    import ultralytics
    print(ultralytics.checks())
    from ultralytics import YOLO
    from dotenv import load_dotenv
    from roboflow import Roboflow

    load_dotenv()
    ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
    rf = Roboflow(api_key=ROBOFLOW_API_KEY)

    workspace = rf.workspace("angadv12")
    project = workspace.project("courtcast")
    version = project.version(1)
    dataset = version.download("yolov11")

    model = YOLO('yolo11s.pt')
    results = model.train(
        data=r'C:\Users\Angad Brar\Desktop\courtcast-API\notebooks\courtcast-1\data.yaml',
        epochs=50,
        imgsz=1280,
        batch=4,
        patience=15,
        lr0=0.001,
        lrf=0.01,
        
        warmup_epochs=3,
        warmup_bias_lr=0.1,
        warmup_momentum=0.8,
        
        degrees=5,
        translate=0.1,
        mosaic=0.5,
        plots=True,
        verbose=True,
    )