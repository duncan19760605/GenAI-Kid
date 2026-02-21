import re

# Simple keyword-based emotion detection from LLM response and child input
EMOTION_KEYWORDS = {
    "happy": ["happy", "great", "awesome", "yay", "fun", "love", "hooray", "wonderful",
              "開心", "好棒", "太好了", "喜歡", "好玩"],
    "excited": ["excited", "wow", "amazing", "cool", "super",
                "好興奮", "哇", "太厲害了"],
    "curious": ["why", "how", "what", "wonder", "interesting", "tell me",
                "為什麼", "怎麼", "什麼", "好奇"],
    "sad": ["sad", "sorry", "miss", "cry", "hurt", "scared", "afraid",
            "難過", "想念", "哭", "害怕", "傷心"],
    "frustrated": ["can't", "don't know", "hard", "difficult", "wrong", "no",
                   "不會", "不知道", "太難", "不要"],
    "proud": ["did it", "i know", "look", "made", "finished",
              "我會了", "看", "完成了", "做到了"],
}


def detect_emotion(text: str) -> str:
    """Detect emotion from text. Returns the most likely emotion or 'neutral'."""
    lower = text.lower()
    scores = {}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in lower)
        if score > 0:
            scores[emotion] = score

    if not scores:
        return "neutral"

    return max(scores, key=scores.get)


def suggest_character_emotion(child_emotion: str) -> str:
    """Given the child's detected emotion, suggest what emotion the character should show."""
    mapping = {
        "happy": "happy",
        "excited": "excited",
        "curious": "curious",
        "sad": "empathetic",      # Character shows empathy
        "frustrated": "encouraging",  # Character encourages
        "proud": "happy",         # Character celebrates with child
        "neutral": "curious",
    }
    return mapping.get(child_emotion, "curious")
