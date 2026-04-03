
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from dotenv import load_dotenv
import os

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET")
)

def upload_image(file: UploadFile, folder: str = "somates_posts") -> str:
    """
    Uploads an UploadFile to Cloudinary and returns the secure URL.
    The folder is optional and defaults to 'somates_posts'.
    """
    result = cloudinary.uploader.upload(
        file.file,
        folder=folder,
        transformation=[{"width": 800, "height": 800, "crop": "limit"}]
    )
    return result["secure_url"]
