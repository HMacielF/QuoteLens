"""Original PDFs. Each file is saved privately under its owner's id, and only the owner
gets a link to it: a read-only Blob Storage link that expires after a few minutes."""
from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone
from typing import Protocol
from urllib.parse import quote as url_quote

LINK_MINUTES = 10


class FileStore(Protocol):
    def save(self, path: str, data: bytes) -> None: ...
    def link(self, path: str, file_name: str) -> str: ...


def pdf_path(user_id: str, comparison_id: str, quote_id: str) -> str:
    return f"{user_id}/{comparison_id}/{quote_id}.pdf"


class MemoryFileStore:
    """Used for tests and for running with no storage account. Files are lost on restart."""

    def __init__(self) -> None:
        self.files: dict[str, bytes] = {}

    def save(self, path: str, data: bytes) -> None:
        self.files[path] = data

    def link(self, path: str, file_name: str) -> str:
        return f"memory://{path}"


def sas_url(container_url: str, account_name: str, container: str, path: str, key, file_name: str,
            now: datetime) -> str:
    """A read-only link to one blob, valid for LINK_MINUTES, signed with a user delegation key."""
    from azure.storage.blob import BlobSasPermissions, generate_blob_sas

    safe_name = re.sub(r'[^\w. -]', "_", file_name)[:120] or "quote.pdf"
    token = generate_blob_sas(
        account_name=account_name,
        container_name=container,
        blob_name=path,
        user_delegation_key=key,
        permission=BlobSasPermissions(read=True),
        start=now - timedelta(minutes=5),
        expiry=now + timedelta(minutes=LINK_MINUTES),
        content_disposition=f'inline; filename="{safe_name}"',
        content_type="application/pdf",
    )
    return f"{container_url}/{url_quote(path)}?{token}"


class BlobFileStore:
    """Signs in as the Function App's managed identity. The identity needs Storage Blob Data
    Contributor on the container and Storage Blob Delegator on the account."""

    def __init__(self, account_url: str, container: str) -> None:
        from azure.identity import DefaultAzureCredential
        from azure.storage.blob import BlobServiceClient

        self._service = BlobServiceClient(account_url, credential=DefaultAzureCredential())
        self._container = self._service.get_container_client(container)
        self._container_name = container
        self._key = None
        self._key_expires = datetime.min.replace(tzinfo=timezone.utc)

    def save(self, path: str, data: bytes) -> None:
        from azure.storage.blob import ContentSettings

        self._container.upload_blob(path, data, overwrite=True,
                                    content_settings=ContentSettings(content_type="application/pdf"))

    def link(self, path: str, file_name: str) -> str:
        now = datetime.now(timezone.utc)
        if self._key is None or self._key_expires - now < timedelta(minutes=LINK_MINUTES + 5):
            self._key_expires = now + timedelta(hours=6)
            self._key = self._service.get_user_delegation_key(now - timedelta(minutes=5), self._key_expires)
        return sas_url(self._container.url, self._service.account_name, self._container_name, path,
                       self._key, file_name, now)


def files_from_env() -> FileStore:
    account_url = os.environ.get("QUOTE_FILES_ACCOUNT_URL", "")
    if account_url:
        return BlobFileStore(account_url, os.environ.get("QUOTE_FILES_CONTAINER", "quote-files"))
    if os.environ.get("WEBSITE_INSTANCE_ID"):
        raise RuntimeError("QUOTE_FILES_ACCOUNT_URL is required when running in Azure")
    return MemoryFileStore()
