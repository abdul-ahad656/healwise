import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

DOMAIN_TYPO_MAP = {
    "gml.com": "gmail.com",
    "gml.co": "gmail.com",
    "gml.con": "gmail.com",
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gnail.com": "gmail.com",
    "gmaill.com": "gmail.com",
    "gmail.co": "gmail.com",
    "gmail.cm": "gmail.com",
    "gmail.con": "gmail.com",
    "gmailcom.com": "gmail.com",
    "googlemail.co": "googlemail.com",
    "outlok.com": "outlook.com",
    "outllok.com": "outlook.com",
    "otlook.com": "outlook.com",
    "outlool.com": "outlook.com",
    "outlook.co": "outlook.com",
    "outlook.cm": "outlook.com",
    "outlook.con": "outlook.com",
    "outllook.com": "outlook.com",
    "hotmial.com": "hotmail.com",
    "hotmal.com": "hotmail.com",
    "hotmali.com": "hotmail.com",
    "hotmail.co": "hotmail.com",
    "hotmail.con": "hotmail.com",
    "yaho.com": "yahoo.com",
    "yahooo.com": "yahoo.com",
    "yahoo.co": "yahoo.com",
    "iclod.com": "icloud.com",
    "icloud.co": "icloud.com",
    "live.co": "live.com",
    "live.con": "live.com",
}

DOMAIN_STEM_TYPO_MAP = {
    "gml": "gmail.com",
    "gmial": "gmail.com",
    "gmai": "gmail.com",
    "gamil": "gmail.com",
    "gnail": "gmail.com",
    "gmaill": "gmail.com",
    "outlok": "outlook.com",
    "outllok": "outlook.com",
    "otlook": "outlook.com",
    "outlool": "outlook.com",
    "outllook": "outlook.com",
    "hotmial": "hotmail.com",
    "hotmal": "hotmail.com",
    "yaho": "yahoo.com",
    "yahooo": "yahoo.com",
    "iclod": "icloud.com",
}

KNOWN_GOOD_DOMAINS = {
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "yahoo.com",
    "icloud.com",
}


def _parse_email_parts(email: str):
    at = email.find("@")
    if at <= 0 or at >= len(email) - 1:
        return None
    return email[:at], email[at + 1 :].lower()


def suggest_email_correction(email: str) -> str | None:
    normalized = str(email or "").strip().lower()
    parts = _parse_email_parts(normalized)
    if not parts:
        return None

    local, domain = parts
    if domain in KNOWN_GOOD_DOMAINS:
        return None

    if domain in DOMAIN_TYPO_MAP:
        return f"{local}@{DOMAIN_TYPO_MAP[domain]}"

    stem = domain.split(".")[0]
    corrected = DOMAIN_STEM_TYPO_MAP.get(stem)
    if corrected and domain != corrected:
        return f"{local}@{corrected}"

    return None


def validate_email(email):
    """
    Validates email format and common provider typos (gml → gmail, outlok → outlook).
    Returns (is_valid, error_message)
    """
    if not email or not str(email).strip():
        return False, "Email is required"

    normalized = str(email).strip().lower()
    suggestion = suggest_email_correction(normalized)
    if suggestion:
        return False, f"Check the email provider spelling. Did you mean {suggestion}?"

    if not EMAIL_REGEX.match(normalized):
        return False, "Enter a valid email address (e.g. name@gmail.com)"

    return True, None
