import os
from dotenv import load_dotenv
from roboflow import Roboflow
load_dotenv()
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
rf = Roboflow(api_key=ROBOFLOW_API_KEY)
project = rf.workspace("angadv12").project("courtcast")

version = project.version(1)
version.deploy("yolov11", r"C:\Users\Angad Brar\Desktop\courtcast-API\notebooks\runs\detect\train")