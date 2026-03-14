"""Google Document AI tool — extracts text from PDF resumes.

Falls back to Gemini multimodal PDF reading if Document AI is not configured.
"""

import base64
import os


def parse_resume_document_ai(pdf_base64: str) -> str:
    """Extract plain text from a PDF resume.

    Tries Google Document AI first. Falls back to Gemini multimodal if
    DOCUMENT_AI_PROCESSOR_ID is not set.

    Args:
        pdf_base64: Base64-encoded PDF file content.

    Returns:
        Extracted plain text from the PDF document.
    """
    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    processor_id = os.environ.get("DOCUMENT_AI_PROCESSOR_ID", "")

    if project_id and processor_id:
        return _extract_with_document_ai(pdf_base64, project_id, processor_id)

    # Fallback: use Gemini's native PDF understanding
    return _extract_with_gemini(pdf_base64)


def _extract_with_document_ai(pdf_base64: str, project_id: str, processor_id: str) -> str:
    """Extract text using Google Document AI."""
    try:
        from google.cloud import documentai  # type: ignore
        from google.api_core.client_options import ClientOptions  # type: ignore

        location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us")
        processor_name = (
            f"projects/{project_id}/locations/{location}/processors/{processor_id}"
        )
        api_endpoint = f"{location}-documentai.googleapis.com"
        client_options = ClientOptions(api_endpoint=api_endpoint)
        client = documentai.DocumentProcessorServiceClient(client_options=client_options)

        raw_document = documentai.RawDocument(
            content=base64.b64decode(pdf_base64),
            mime_type="application/pdf",
        )
        request = documentai.ProcessRequest(
            name=processor_name,
            raw_document=raw_document,
        )
        result = client.process_document(request=request)
        return result.document.text
    except Exception:  # noqa: BLE001 — covers ImportError, InvalidArgument, auth errors, etc.
        return _extract_with_gemini(pdf_base64)


def _extract_with_gemini(pdf_base64: str) -> str:
    """Fallback: use Gemini's multimodal capability to read PDF content."""
    try:
        from google.genai import Client
        from google.genai import types as genai_types

        api_key = os.environ.get("GOOGLE_API_KEY", "")
        client = Client(api_key=api_key) if api_key else Client()

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                genai_types.Content(
                    role="user",
                    parts=[
                        genai_types.Part(
                            text="Extract all the text from this PDF resume. "
                                 "Return the plain text exactly as it appears, preserving structure."
                        ),
                        genai_types.Part(
                            inline_data=genai_types.Blob(
                                mime_type="application/pdf",
                                data=base64.b64decode(pdf_base64),
                            )
                        ),
                    ]
                )
            ],
        )
        return response.text or ""
    except Exception as exc:  # noqa: BLE001
        return f"[PDF extraction failed: {exc}]"
