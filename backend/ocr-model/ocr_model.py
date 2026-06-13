"""Certificate OCR utilities.

This module mirrors the OCR flow used in the Node.js backend:
- decode the uploaded image
- convert to grayscale
- apply a small median blur
- sharpen the image
- run Tesseract OCR
- verify the extracted certificate text
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict

import cv2
import numpy as np
import pytesseract


DEFAULT_MOCK_DB: Dict[str, Dict[str, str]] = {
    "CERT_2024_001": {"student_name": "Rahul Sharma", "course": "Bachelor of Technology"},
    "CERT_2024_002": {"student_name": "Priya Patel", "course": "Data Science Professional"},
    "CERT_2024_003": {"student_name": "Amit Singh", "course": "Master of Business Administration"},
    "CERT_2024_004": {"student_name": "Sneha Reddy", "course": "Bachelor of Arts"},
    "CERT_2024_005": {"student_name": "Vikram Kumar", "course": "Certified Blockchain Developer"},
}


def _load_mock_db() -> Dict[str, Dict[str, str]]:
    """Load the shared mock certificate dataset used by MongoDB and OCR."""

    data_file = Path(__file__).resolve().parent.parent / "data" / "mock-certificates.json"
    if data_file.exists():
        with data_file.open("r", encoding="utf-8") as handle:
            records = json.load(handle)

        loaded_db: Dict[str, Dict[str, str]] = {}
        for record in records:
            certificate_id = str(record.get("certificateId", "")).upper()
            if not certificate_id:
                continue

            loaded_db[certificate_id] = {
                "student_name": record.get("studentName", ""),
                "course": record.get("course", ""),
            }

        if loaded_db:
            return loaded_db

    return DEFAULT_MOCK_DB


MOCK_DB: Dict[str, Dict[str, str]] = _load_mock_db()

CERTIFICATE_ID_PATTERN = re.compile(r"CERT_\d{4}_\d{3}", re.IGNORECASE)


@dataclass(frozen=True)
class OCRResult:
    status: str
    message: str
    student_name: str
    roll_no: str


def configure_tesseract() -> None:
    """Set the Tesseract binary path from the environment when provided."""

    tesseract_cmd = os.getenv("TESSERACT_CMD")
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes into an OCR-friendly grayscale image."""

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Unable to decode the uploaded certificate image.")

    grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.medianBlur(grayscale, 3)

    sharpen_kernel = np.array(
        [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
        dtype=np.float32,
    )
    sharpened = cv2.filter2D(denoised, -1, sharpen_kernel)

    return sharpened


def extract_text_from_certificate(image_bytes: bytes, language: str = "eng") -> str:
    """Run OCR over an uploaded certificate image and return the extracted text."""

    configure_tesseract()
    processed_image = preprocess_image(image_bytes)
    text = pytesseract.image_to_string(processed_image, lang=language)
    return text.strip()


def verify_credentials(extracted_text: str) -> OCRResult:
    """Validate a certificate text string against the in-memory reference data."""

    id_match = CERTIFICATE_ID_PATTERN.search(extracted_text)

    if not id_match:
        return OCRResult(
            status="Suspicious ⚠️",
            message="Could not find a valid Certificate ID in the document.",
            student_name="N/A",
            roll_no="N/A",
        )

    certificate_id = id_match.group(0).upper()
    db_record = MOCK_DB.get(certificate_id)

    if not db_record:
        return OCRResult(
            status="Suspicious ⚠️",
            message="This Certificate ID does not exist in our database.",
            student_name="N/A",
            roll_no=certificate_id,
        )

    student_name = db_record["student_name"]
    if student_name.lower() in extracted_text.lower():
        return OCRResult(
            status="Verified ✅",
            message="The certificate ID and student name match our records.",
            student_name=student_name,
            roll_no=certificate_id,
        )

    return OCRResult(
        status="Suspicious ⚠️",
        message="Certificate ID found, but the name does not match our records.",
        student_name="Mismatch",
        roll_no=certificate_id,
    )


def process_certificate(image_bytes: bytes, language: str = "eng") -> OCRResult:
    """Convenience wrapper that performs OCR and credential verification."""

    extracted_text = extract_text_from_certificate(image_bytes, language=language)

    if not extracted_text:
        return OCRResult(
            status="Error",
            message="OCR could not extract any text from the document.",
            student_name="N/A",
            roll_no="N/A",
        )

    return verify_credentials(extracted_text)


def result_to_dict(result: OCRResult) -> Dict[str, str]:
    """Convert the OCR result dataclass into a JSON-friendly dictionary."""

    return {
        "status": result.status,
        "message": result.message,
        "student_name": result.student_name,
        "roll_no": result.roll_no,
    }


__all__ = [
    "OCRResult",
    "MOCK_DB",
    "configure_tesseract",
    "preprocess_image",
    "extract_text_from_certificate",
    "verify_credentials",
    "process_certificate",
    "result_to_dict",
]