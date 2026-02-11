from urllib.parse import urlparse, urljoin

def clean_url(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

def is_internal_link(base_url, link):
    base_netloc = urlparse(base_url).netloc
    link_netloc = urlparse(link).netloc
    return base_netloc == link_netloc or not link_netloc

def normalize_link(base_url, link):
    return urljoin(base_url, link)
