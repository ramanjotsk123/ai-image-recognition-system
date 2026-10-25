# AI Image Recognition System

## Project Overview

A computer vision web application that classifies uploaded
images using a pretrained deep-learning model.

## Technologies

- Python
- JavaScript
- HTML5 and CSS3
- FastAPI
- PyTorch
- Hugging Face Transformers
- MobileNetV2

## Features

- Upload and preview images
- Predict image categories using deep learning
- Display the top five predictions and their scores
- Interactive web interface
- Python API for model inference
- Image validation and upload-size limits

## How It Works

1. The user selects an image in the browser.
2. JavaScript sends the image to the Python API.
3. FastAPI validates the uploaded image.
4. A pretrained MobileNetV2 model classifies the image.
5. The API returns predicted categories and scores.
6. JavaScript displays the results.

## Project Structure

- app.py: Python backend and image-classification API
- index.html: Web interface
- static/js/script.js: Browser-side functionality
- static/css/style.css: Website styling
- requirements.txt: Python dependencies

## Installation

Install the required dependencies:

    pip install -r requirements.txt

Start the application:

    uvicorn app:app --reload

Open in your browser:

    http://127.0.0.1:8000

API documentation:

    http://127.0.0.1:8000/docs

The pretrained model must be downloaded before inference.
An internet connection is required for the initial download.

## Model

Google MobileNetV2 Image Classification

Model reference:
https://huggingface.co/google/mobilenet_v2_1.4_224

## Limitations

The project uses a pretrained model rather than training
a new neural network from scratch.

Predictions may be incorrect, particularly for unfamiliar
images or objects outside the model's training categories.

## Project Status

Source code uploaded to GitHub.
Application execution and prediction quality have
not yet been verified.
