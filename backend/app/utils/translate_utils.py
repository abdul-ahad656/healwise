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


def translate_to_english(text: Any, source: str = "auto") -> str:
  """
  Safely translate arbitrary value to English text for ML / search.
  """
  if text is None:
    return ""
  return _cached_translate(str(text), source=source, target="en")


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
  return [translate_to_urdu(x) for x in items if x]


def translate_awareness_field(value: Any) -> Any:
  """
  Translate medicine-awareness fields stored as either a list or a single
  string (admin form saves multiline text). Preserves shape for the client.
  """
  if value is None:
    return ""

  if isinstance(value, list):
    out: List[str] = []
    for item in value:
      if not item:
        continue
      if isinstance(item, str) and "\n" in item:
        out.extend(
          translate_to_urdu(ln)
          for ln in item.splitlines()
          if ln.strip()
        )
      else:
        out.append(translate_to_urdu(item))
    return out

  if isinstance(value, str):
    text = value.strip()
    if not text:
      return ""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) > 1:
      return [translate_to_urdu(ln) for ln in lines]
    return translate_to_urdu(text)

  return translate_to_urdu(str(value))

