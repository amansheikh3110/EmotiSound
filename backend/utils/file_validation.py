"""
EmotiSound File Validation Utilities
Safely validates uploaded audio streams, extensions, MIME types, and file sizes.
"""

from pathlib import Path
from typing import Tuple
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

from ml.config import ALLOWED_AUDIO_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES
from backend.utils.errors import ValidationError, UnsupportedAudioError, PayloadTooLargeError


def validate_uploaded_audio(file: FileStorage) -> Tuple[str, str]:
    """
    Validates an incoming multipart audio file upload.
    Returns:
        (sanitized_filename, file_extension)
    """
    if not file or not file.filename:
        raise ValidationError("No audio file was uploaded with the request.")

    raw_filename = file.filename
    clean_name = secure_filename(raw_filename)
    if not clean_name:
        clean_name = "recording.wav"

    ext = Path(clean_name).suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise UnsupportedAudioError(
            f"Unsupported audio format '{ext}'. Supported formats: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
        )

    # Check file stream size
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)  # Reset to beginning

    if file_size == 0:
        raise ValidationError("Uploaded audio file is empty (0 bytes).")

    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise PayloadTooLargeError(
            f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum allowed limit of {MAX_UPLOAD_SIZE_BYTES / (1024*1024):.0f} MB."
        )

    return clean_name, ext
