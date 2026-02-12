"""
URL utilities.

Normalization, base URL extraction, internal link filtering,
and domain matching for the crawler and discovery engine.
"""

from __future__ import annotations

from urllib.parse import urljoin, urlparse, urlunparse


def normalize_url(url: str) -> str:
    """
    Normalize a URL for consistent comparison.

    - Strips fragments and trailing slashes
    - Lowercases the scheme and host
    - Removes default ports (80/443)
    """
    parsed = urlparse(url)

    scheme = parsed.scheme.lower() or "https"
    netloc = parsed.hostname or ""
    port = parsed.port

    # Drop default ports
    if port and not ((scheme == "http" and port == 80) or (scheme == "https" and port == 443)):
        netloc = f"{netloc}:{port}"

    path = parsed.path.rstrip("/") or "/"
    query = parsed.query

    return urlunparse((scheme, netloc, path, "", query, ""))


def extract_base_url(url: str) -> str:
    """
    Extract the base URL (scheme + host) from a full URL.

    Example: "https://agmarknet.gov.in/foo/bar" → "https://agmarknet.gov.in"
    """
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def get_domain(url: str) -> str:
    """
    Extract the domain from a URL.

    Example: "https://www.agmarknet.gov.in/path" → "www.agmarknet.gov.in"
    """
    return urlparse(url).hostname or ""


def get_root_domain(url: str) -> str:
    """
    Extract the root domain (last two segments) for subdomain matching.

    Example: "https://data.agmarknet.gov.in" → "agmarknet.gov.in"
    """
    domain = get_domain(url)
    parts = domain.split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return domain


def is_internal_link(link: str, base_url: str) -> bool:
    """
    Check if a link is internal to the base URL's domain.

    Handles relative links, same-domain, and subdomain matching.
    """
    if not link:
        return False

    # Resolve relative links
    absolute = resolve_url(link, base_url)
    return get_root_domain(absolute) == get_root_domain(base_url)


def resolve_url(link: str, base_url: str) -> str:
    """
    Resolve a potentially relative URL against a base URL.

    Example: resolve_url("/prices", "https://example.com/page") → "https://example.com/prices"
    """
    return urljoin(base_url, link)


def is_downloadable(url: str, extensions: frozenset[str] | None = None) -> bool:
    """
    Check if a URL points to a downloadable file (PDF, Excel, CSV).
    """
    if extensions is None:
        from app.core.constants import DOWNLOADABLE_EXTENSIONS
        extensions = DOWNLOADABLE_EXTENSIONS

    path = urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in extensions)


def strip_query_params(url: str) -> str:
    """Remove query parameters from a URL."""
    parsed = urlparse(url)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))
