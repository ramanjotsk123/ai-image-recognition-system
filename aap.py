import logging
from functools import lru_cache
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from starlette.concurrency import run_in_threadpool
from transformers import pipeline


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

MODEL_NAME = "google/mobilenet_v2_1.4_224"
MAX_FILE_BYTES = 5 * 1024 * 1024  # 5 MB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Image Recognition System",
    description=(
        "An image classification API using a pretrained "
        "deep-learning model."
    ),
    version="1.0.0",
)

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)


@app.get("/")
def home():
    """Serve the browser-based interface."""
    return FileResponse(BASE_DIR / "index.html")


@lru_cache(maxsize=1)
def get_classifier():
    """Load the pretrained image classification model once."""
    logger.info("Loading model: %s", MODEL_NAME)

    return pipeline(
        task="image-classification",
        model=MODEL_NAME,
        device=-1,  # Use CPU for broader compatibility.
    )


def classify_image(image, top_k):
    """Run image classification and format the predictions."""
    classifier = get_classifier()
    results = classifier(image, top_k=top_k)

    predictions = [
        {
            "label": result["label"],
            "confidence": round(float(result["score"]) * 100, 2),
        }
        for result in results
    ]

    return predictions


@app.get("/health")
def health():
    """Return basic application status."""
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "model_loaded": get_classifier.cache_info().currsize > 0,
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    top_k: int = Query(default=5, ge=1, le=5),
):
    """Predict image categories and return their scores."""
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Please choose an image file.",
        )

    content = await file.read(MAX_FILE_BYTES + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. The maximum size is 5 MB.",
        )

    try:
        # Verify that the uploaded content is a valid image.
        with Image.open(BytesIO(content)) as check_image:
            check_image.verify()

        # Reopen after verification and standardize the colour format.
        with Image.open(BytesIO(content)) as uploaded_image:
            if (
                uploaded_image.width > 8000
                or uploaded_image.height > 8000
            ):
                raise HTTPException(
                    status_code=400,
                    detail="Image dimensions must not exceed 8000 pixels.",
                )

            image = uploaded_image.convert("RGB")

    except HTTPException:
        raise
    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
    ) as error:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid supported image.",
        ) from error
    finally:
        await file.close()

    try:
        predictions = await run_in_threadpool(
            classify_image,
            image,
            top_k,
        )
    except Exception as error:
        logger.exception("Image classification failed")
        raise HTTPException(
            status_code=503,
            detail=(
                "The AI model could not be loaded or run. "
                "Check the server logs and internet connection."
            ),
        ) from error

    return {
        "model": MODEL_NAME,
        "predictions": predictions,
    }
