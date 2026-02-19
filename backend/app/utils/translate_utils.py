from typing import Dict, Tuple, List, Any

from deep_translator import GoogleTranslator

_cache: Dict[Tuple[str, str, str], str] = {}
_translator_en_ur = GoogleTranslator(source="en", target="ur")


def _cached_translate(text: str, source: str = "en", target: str = "ur") -> str:
  """
  Translate text with a very simple in-memory cache.
  Falls back to original text on any error.
  """
  if not text:
    return text

  if not isinstance(text, str):
    text = str(text)

  key = (source, target, text)
  if key in _cache:
    return _cache[key]

  try:
    if source == "en" and target == "ur":
      translated = _translator_en_ur.translate(text)
    else:
      translated = GoogleTranslator(source=source, target=target).translate(text)

    if isinstance(translated, str):
      _cache[key] = translated
      return translated
    # If library returns something unexpected, fall back
    return text
  except Exception:
    # On any failure, just return original English text
    return text


def translate_to_urdu(text: Any) -> str:
  """
  Public helper used by views/services.
  Safely translates arbitrary value to Urdu text.
  """
  if text is None:
    return ""
  return _cached_translate(str(text), source="en", target="ur")


def translate_list_to_urdu(items: Any) -> List[str]:
  """
  Translate a list of strings to Urdu.
  If items is not a list, returns [].
  """
  if not isinstance(items, list):
    return []
  return [translate_to_urdu(x) for x in items]

