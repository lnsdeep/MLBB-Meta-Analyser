"""
Moonton GMS API Signer
Computes HMAC-SHA1 authorization signatures required by api.gms.moontontech.com.
"""

import base64
import hashlib
import hmac
import time
from typing import Optional
import requests

from .config import GMS_BASE_URL, DEFAULT_HEADERS


class MoontonSigner:
    """Handles enigma token caching and request signature generation."""

    def __init__(self, session: Optional[requests.Session] = None):
        self.session = session or requests.Session()
        self._enigma: Optional[str] = None
        self._enigma_expires_at: float = 0.0

    def get_enigma(self, force_refresh: bool = False) -> str:
        """
        Fetch the ephemeral enigma key from Moonton's basev4 endpoint.
        Caches token for 10 minutes unless forced.
        """
        now = time.time()
        if not force_refresh and self._enigma and now < self._enigma_expires_at:
            return self._enigma

        ts = int(now * 1000)
        url = f"{GMS_BASE_URL}/api/act/basev4?_t={ts}"
        headers = {**DEFAULT_HEADERS, "x-lang": ""}

        resp = self.session.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") != 0:
            raise RuntimeError(f"Failed to fetch enigma from basev4: {data.get('message')}")

        server_info = data.get("data", {}).get("server", {})
        enigma = server_info.get("enigma")
        if not enigma:
            raise ValueError(f"Enigma token missing in basev4 response: {data}")

        self._enigma = enigma
        # Cache for 10 minutes
        self._enigma_expires_at = now + 600
        return self._enigma

    def sign_request(
        self,
        method: str,
        path: str,
        query_string: str = "",
        body_string: str = "",
        enigma: Optional[str] = None,
    ) -> str:
        """
        Sign an HTTP request using HMAC-SHA1 according to Moonton's frontend specification:
        message = METHOD.upper() + "\n" + PATH + "\n" + QUERY_STRING + "\n" + BODY_STRING
        signature = Base64(HMAC-SHA1(key=enigma, message=message))
        """
        if not enigma:
            enigma = self.get_enigma()

        message = f"{method.upper()}\n{path}\n{query_string}\n{body_string}"
        signature_bytes = hmac.new(
            enigma.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha1,
        ).digest()

        return base64.b64encode(signature_bytes).decode("utf-8")
