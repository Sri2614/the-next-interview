"""Google Document AI tool — extracts text from PDF resumes."""

import base64
import os


def parse_resume_document_ai(pdf_base64: str) -> str:
    """Extract plain text from a PDF resume using Google Document AI.

    Args:
        pdf_base64: Base64-encoded PDF file content.

    Returns:
        Extracted plain text from the PDF document.
    """
    try:
        from google.cloud import documentai  # type: ignore
        from google.api_core.client_options import ClientOptions  # type: ignore
    except ImportError:
        return "[Document AI SDK not installed — run: pip install google-cloud-documentai]"

    project_id = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    processor_id = os.environ.get("DOCUMENT_AI_PROCESSOR_ID", "")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us")

    if not project_id or not processor_id:
        return (
            "[Document AI not configured — set GOOGLE_CLOUD_PROJECT and "
            "DOCUMENT_AI_PROCESSOR_ID in agents/.env]"
        )

    # Build the processor resource name
    processor_name = (
        f"projects/{project_id}/locations/{location}/processors/{processor_id}"
    )

    # Must use region-specific endpoint — global endpoint hangs for US processors
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
