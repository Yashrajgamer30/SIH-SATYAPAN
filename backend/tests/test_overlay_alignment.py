"""
SATYAPAN - Step 3d Meaningful Test Suite: Overlay Alignment & Real Detector Verification
Tests:
1. Field Extractor vs Independent Tesseract OCR:
   'Validity Upto' bbox from extract_document_page_data overlaps independent Tesseract OCR word box within 8px.
2. Pixel-Level Non-Blank Coverage Test (100% and 200% zoom):
   For every overlay rectangle, sampling the page image under it confirms dark (non-blank) pixels
   (at least 3% below 200 grey value).
3. Detector Realism:
   QR Code decoded payload HMAC verification, HoughCircles seal detector, and signature stroke detector.
"""

import io
import os
import pytest
import numpy as np
from PIL import Image
import cv2
import pypdfium2 as pdfium
import pytesseract

from app.services.document_renderer import (
    render_page_png,
    extract_document_page_data,
    detect_real_qr,
    detect_real_seals,
    detect_real_signature,
    SCALE_150
)

# Configure tesseract binary if available
if os.path.exists(r"C:\Program Files\Tesseract-OCR\tesseract.exe"):
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def test_validity_upto_bbox_overlaps_independent_tesseract_ocr():
    """
    Acceptance Criterion:
    The 'Validity Upto' bbox from the field extractor overlaps the OCR word box
    from an independent source (Tesseract output), within 8px.
    Do not compare two values produced by the same function.
    """
    doc_id = "fire_noc_clean.pdf"

    # Source 1: Field Extractor under test
    page_data = extract_document_page_data(doc_id, page_num=1)
    validity_box = None
    for b in page_data["boxes"]:
        if "valid" in b["field"].lower():
            validity_box = b
            break

    assert validity_box is not None, "Field extractor must produce 'Validity Upto' box."

    # Source 2: Independent Tesseract OCR run directly on rendered raster image
    png_bytes, w_px, h_px = render_page_png(doc_id, page_num=1)
    pil_img = Image.open(io.BytesIO(png_bytes))

    tess_data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
    n_boxes = len(tess_data["text"])

    tess_validity_box = None
    for i in range(n_boxes):
        word = tess_data["text"][i].strip()
        if word.lower() == "validity":
            tess_validity_box = {
                "x": float(tess_data["left"][i]),
                "y": float(tess_data["top"][i]),
                "w": float(tess_data["width"][i]),
                "h": float(tess_data["height"][i])
            }
            break

    assert tess_validity_box is not None, "Independent Tesseract OCR must find 'Validity' token on page."

    # Assert spatial alignment within 8.0 pixels threshold
    dx = abs(validity_box["x"] - tess_validity_box["x"])
    dy = abs(validity_box["y"] - tess_validity_box["y"])

    print(f"Field extractor box: ({validity_box['x']}, {validity_box['y']})")
    print(f"Independent Tesseract box: ({tess_validity_box['x']}, {tess_validity_box['y']})")
    print(f"Coordinate delta: dx = {dx:.2f}px, dy = {dy:.2f}px")

    assert dx <= 8.0, f"X-alignment delta {dx:.2f}px exceeds 8.0px threshold."
    assert dy <= 8.0, f"Y-alignment delta {dy:.2f}px exceeds 8.0px threshold."


def test_overlay_rectangles_contain_dark_pixels_at_100_and_200_zoom():
    """
    Acceptance Criterion:
    For each overlay rectangle on fire_noc_clean.pdf, sample the page image under it;
    the rectangle must contain dark (non-blank) pixels (at least 3% below 200 grey).
    Test at zoom 100% and 200%.
    """
    doc_id = "fire_noc_clean.pdf"
    page_data = extract_document_page_data(doc_id, page_num=1)
    boxes = page_data["boxes"]

    assert len(boxes) >= 4, "Must extract at least 4 overlay regions (QR, Seal, Signature, Fields)."

    # 1. Test at 100% Zoom (150 DPI)
    png_bytes_100, _, _ = render_page_png(doc_id, page_num=1)
    img_100 = cv2.imdecode(np.frombuffer(png_bytes_100, np.uint8), cv2.IMREAD_GRAYSCALE)

    for b in boxes:
        x, y, w, h = int(b["x"]), int(b["y"]), int(b["w"]), int(b["h"])
        roi = img_100[y:y+h, x:x+w]
        assert roi.size > 0, f"ROI for box {b['field']} is empty."

        dark_px = np.count_nonzero(roi < 200)
        pct_dark = (dark_px / roi.size) * 100.0

        assert pct_dark >= 3.0, (
            f"100% zoom: Box '{b['field']}' has {pct_dark:.2f}% dark pixels (< 3.0% threshold). "
            f"Box points to blank whitespace instead of real content."
        )

    # 2. Test at 200% Zoom (300 DPI)
    from app.services.document_renderer import resolve_document_file
    file_path = resolve_document_file(doc_id)
    pdf = pdfium.PdfDocument(str(file_path))
    pil_200 = pdf[0].render(scale=SCALE_150 * 2.0).to_pil()
    img_200 = cv2.cvtColor(np.array(pil_200), cv2.COLOR_RGB2GRAY)

    for b in boxes:
        # Scale coordinates by 2 for 200% zoom
        x, y, w, h = int(b["x"] * 2), int(b["y"] * 2), int(b["w"] * 2), int(b["h"] * 2)
        roi = img_200[y:y+h, x:x+w]
        assert roi.size > 0, f"200% ROI for box {b['field']} is empty."

        dark_px = np.count_nonzero(roi < 200)
        pct_dark = (dark_px / roi.size) * 100.0

        assert pct_dark >= 3.0, (
            f"200% zoom: Box '{b['field']}' has {pct_dark:.2f}% dark pixels (< 3.0% threshold)."
        )


def test_real_detectors_on_demo_pack():
    """Verifies QR decoder, seal detector, and signature stroke detector on clean and tampered files."""
    # 1. Clean file: QR must be valid HMAC, Seal detected, Signature detected
    clean_data = extract_document_page_data("fire_noc_clean.pdf", 1)
    clean_types = [b["type"] for b in clean_data["boxes"]]
    assert "qr" in clean_types
    assert "seal" in clean_types
    assert "signature" in clean_types

    # 2. Bad QR file: QR box must be tagged as 'tamper' with invalid HMAC
    bad_qr_data = extract_document_page_data("university_letter_bad_qr.pdf", 1)
    qr_box = next((b for b in bad_qr_data["boxes"] if "QR" in b["field"]), None)
    assert qr_box is not None
    assert qr_box["type"] == "tamper"

    # 3. Copy-Move Seal file: must detect both authentic and cloned seal
    copy_move_data = extract_document_page_data("trust_deed_copy_move_seal.png", 1)
    box_ids = [b["id"] for b in copy_move_data["boxes"]]
    assert "box-seal-authentic" in box_ids or "box-seal" in box_ids
    assert "box-seal-tamper" in box_ids
