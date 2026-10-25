const form = document.getElementById("uploadForm");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewPlaceholder = document.getElementById("previewPlaceholder");
const predictButton = document.getElementById("predictButton");
const statusMessage = document.getElementById("statusMessage");
const resultsList = document.getElementById("resultsList");

const MAX_FILE_SIZE = 5 * 1024 * 1024;

let selectedFile = null;
let previewUrl = null;

function clearPreview() {
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    imagePreview.removeAttribute("src");
    imagePreview.hidden = true;
    previewPlaceholder.hidden = false;
}

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    selectedFile = null;
    predictButton.disabled = true;
    resultsList.replaceChildren();
    clearPreview();

    if (!file) {
        statusMessage.textContent = "Select an image to begin.";
        return;
    }

    const supportedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!supportedTypes.includes(file.type)) {
        statusMessage.textContent =
            "Please select a JPG, PNG, or WEBP image.";
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        statusMessage.textContent =
            "The image is too large. Please select an image under 5 MB.";
        return;
    }

    selectedFile = file;
    previewUrl = URL.createObjectURL(file);

    imagePreview.src = previewUrl;
    imagePreview.hidden = false;
    previewPlaceholder.hidden = true;

    statusMessage.textContent =
        "Image ready. Select Analyze Image to continue.";

    predictButton.disabled = false;
});

function renderPredictions(predictions) {
    resultsList.replaceChildren();

    predictions.forEach((prediction, index) => {
        const item = document.createElement("article");
        item.className = "prediction-item";

        const heading = document.createElement("div");
        heading.className = "prediction-heading";

        const label = document.createElement("span");
        label.className = "prediction-label";
        label.textContent = `${index + 1}. ${prediction.label}`;

        const score = document.createElement("span");
        score.className = "prediction-score";
        score.textContent = `${prediction.confidence.toFixed(2)}%`;

        heading.append(label, score);

        const track = document.createElement("div");
        track.className = "progress-track";

        const bar = document.createElement("div");
        bar.className = "progress-bar";

        const safeScore = Math.max(
            0,
            Math.min(100, prediction.confidence)
        );

        bar.style.width = `${safeScore}%`;
        track.appendChild(bar);

        item.append(heading, track);
        resultsList.appendChild(item);
    });
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!selectedFile) {
        statusMessage.textContent =
            "Please select a valid image first.";
        return;
    }

    predictButton.disabled = true;
    predictButton.textContent = "Analyzing...";

    statusMessage.textContent =
        "The AI model is analyzing your image. " +
        "The first request may take longer.";

    resultsList.replaceChildren();

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
        const response = await fetch("/predict?top_k=5", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail || "The image could not be analyzed."
            );
        }

        renderPredictions(data.predictions);

        statusMessage.textContent =
            `Analysis complete using ${data.model}.`;
    } catch (error) {
        statusMessage.textContent =
            `Error: ${error.message}. Make sure the Python API is running.`;
    } finally {
        predictButton.disabled = false;
        predictButton.textContent = "Analyze Image";
    }
});

window.addEventListener("beforeunload", () => {
    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }
});
