import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


def validate_email(email):
    """
    Validates email format (e.g. name@gmail.com).
    Returns (is_valid, error_message)
    """
    if not email or not str(email).strip():
        return False, "Email is required"

    normalized = str(email).strip().lower()
    if not EMAIL_REGEX.match(normalized):
        return False, "Enter a valid email address (e.g. name@gmail.com)"

    return True, None
