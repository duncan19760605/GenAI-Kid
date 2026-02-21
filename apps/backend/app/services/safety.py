import re

# Topics that should never appear in child-facing content
BLOCKED_TOPICS = {
    "violence", "weapon", "gun", "knife", "kill", "murder", "blood",
    "drug", "alcohol", "cigarette", "smoke", "beer", "wine",
    "sex", "naked", "porn",
    "suicide", "self-harm", "cut myself",
    "hate", "racist", "slur",
    "address", "phone number", "credit card", "password", "social security",
}

# Patterns for personal info extraction attempts
PII_PATTERNS = [
    r"what(?:'s| is) your (?:address|phone|school|last name|full name)",
    r"where do you live",
    r"tell me your (?:address|number|school)",
]


def check_content_safety(text: str) -> tuple[bool, str]:
    """Check if text is safe for children. Returns (is_safe, reason)."""
    lower = text.lower()

    # Check blocked words
    for word in BLOCKED_TOPICS:
        if word in lower:
            return False, f"blocked_topic:{word}"

    # Check PII extraction patterns
    for pattern in PII_PATTERNS:
        if re.search(pattern, lower):
            return False, "pii_extraction_attempt"

    return True, ""


def sanitize_for_child(text: str) -> str:
    """Sanitize LLM output before sending to child. Remove any leaked unsafe content."""
    # This is a safety net; the system prompt should prevent most issues
    for word in BLOCKED_TOPICS:
        text = re.sub(rf"\b{re.escape(word)}\b", "...", text, flags=re.IGNORECASE)
    return text


SAFETY_REDIRECT_RESPONSES = {
    "zh": "嗯，我們來聊點別的好嗎？你今天做了什麼好玩的事呢？",
    "en": "Hmm, let's talk about something else! What fun things did you do today?",
    "es": "Hmm, hablemos de otra cosa. ¿Qué cosas divertidas hiciste hoy?",
}


def get_safety_redirect(language: str) -> str:
    return SAFETY_REDIRECT_RESPONSES.get(language, SAFETY_REDIRECT_RESPONSES["en"])
