"""
deterministic regex based lookup transcript quality check
"""

import re
from collections import defaultdict, Counter

# Column indices
COL = dict(audio_no=0, segment=1, speaker=2, start=3, end=4,
           transcript=5, nonspeech=6, emotion=7, language=8,
           locale=9, accent=10)
COL_LETTER = list("ABCDEFGHIJK")


# Reference tables
VALID_LOCALES = {
    "arabic":     {"ar", "ar_EG", "ar_IQ", "ar_SA", "ar_SD"},
    "chinese":    {"zh_CN", "zh_TW", "zh_HK", "zh"},
    "czech":      {"cs_CZ", "cs"},
    "danish":     {"da_DK", "da"},
    "dutch":      {"nl_NL", "nl_BE", "li", "nl_SR", "nl"},
    "english":    {"en_US", "en_GB", "en_AU", "en_CA", "en_IN", "en"},
    "finnish":    {"fi_FI", "fi"},
    "french":     {"fr_FR", "fr_CA", "fr_BE", "fr_CH", "fr"},
    "german":     {"de_DE", "de_AT", "de_CH", "bar", "swg", "ksh", "de"},
    "hindi":      {"hi_IN", "awa", "bho", "mwr", "bgc", "hi"},
    "hungarian":  {"hu_HU", "hu"},
    "indonesian": {"id_ID", "id"},
    "italian":    {"it_IT", "it"},
    "japanese":   {"ja_JP", "ja"},
    "korean":     {"ko_KR", "ko"},
    "norwegian":  {"nb_NO", "no"},
    "polish":     {"pl_PL", "pl"},
    "portuguese": {"pt_BR", "pt_PT", "pt"},
    "romanian":   {"ro_RO", "ro_MD", "ro"},
    "russian":    {"ru_RU", "ru"},
    "spanish":    {"es_ES", "es_MX", "es_AR", "es_CO", "es_CL", "es_CR", "es"},
    "swedish":    {"sv_SE", "sv"},
    "thai":       {"th_TH", "th"},
    "turkish":    {"tr_TR", "tr"},
    "vietnamese": {"vi_VN", "vi"},
}

# Bare locale subtag -> preferred full form
BARE_TO_FULL = {
    "ar": "ar_SA", "zh": "zh_CN", "cs": "cs_CZ", "da": "da_DK", "nl": "nl_NL",
    "en": "en_US", "fi": "fi_FI", "fr": "fr_FR", "de": "de_DE", "hi": "hi_IN",
    "hu": "hu_HU", "id": "id_ID", "it": "it_IT", "ja": "ja_JP", "ko": "ko_KR",
    "pl": "pl_PL", "pt": "pt_BR", "ro": "ro_RO", "ru": "ru_RU", "es": "es_ES",
    "sv": "sv_SE", "th": "th_TH", "tr": "tr_TR", "vi": "vi_VN",
}

# Bare tags valid as is
VALID_BARE_AS_IS = {"no", "nb_NO", "li", "bar", "swg", "ksh", "awa", "bho", "mwr", "bgc"}

# Special non-prefixed locales -> language
SPECIAL_LOCALE_LANG = {
    "no": "norwegian", "li": "dutch",
    "bar": "german", "swg": "german", "ksh": "german", "awa": "hindi",
    "bho": "hindi", "mwr": "hindi", "bgc": "hindi"
}

# ISO code -> full language name
ISO_TO_LANG = {
    "ar": "arabic", "zh": "chinese", "cs": "czech", "da": "danish", "nl": "dutch",
    "en": "english", "fi": "finnish", "fr": "french", "de": "german", "hi": "hindi",
    "hu": "hungarian", "id": "indonesian", "it": "italian", "ja": "japanese",
    "ko": "korean", "nb": "norwegian", "no": "norwegian", "pl": "polish",
    "pt": "portuguese", "ro": "romanian", "ru": "russian", "es": "spanish",
    "sv": "swedish", "th": "thai", "tr": "turkish", "vi": "vietnamese",

}

# Accent map
VALID_ACCENTS = {
    "arabic":     {"shami arabic", "egyptian arabic", "maghrebi arabic", "gulf arabic",
                   "iraqi arabic", "saudi arabia arabic", "sudanese arabic", "non-native arabic"},
    "chinese":    {"mandarin chinese", "mandarin taiwan", "hokkien (dialect / accent)",
                   "cantonese", "non-native chinese"},
    "czech":      {"standard czech", "regional accent", "non-native czech"},
    "danish":     {"standard danish", "regional accent", "non-native danish"},
    "dutch":      {"standard dutch", "flemish", "limburgish", "suriname dutch",
                   "carribean dutch", "non-native dutch"},
    "english":    {"us english", "british english", "australian english",
                   "canadian english", "indian english", "non-native english"},
    "finnish":    {"standard finnish", "regional accent", "non-native finnish"},
    "french":     {"standard french", "canadian french", "belgian french",
                   "swiss french", "non-native french"},
    "german":     {"standard german", "austrian german", "swiss german", "bavarian",
                   "swabian", "ripuarian german", "non-native german"},
    "hindi":      {"standard hindi", "awadhi", "bhojpuri", "marwari/rajasthani",
                   "haryanvi", "other regional accent", "non-native hindi"},
    "hungarian":  {"standard hungarian", "regional accent", "non-native hungarian"},
    "indonesian": {"standard indonesian", "javanese accent", "balinese accent",
                   "non-native indonesian"},
    "italian":    {"standard italian", "regional accent", "non-native italian"},
    "japanese":   {"standard japanese", "regional accent", "non-native japanese"},
    "korean":     {"standard korean", "regional accent", "north korean", "non-native korean"},
    "norwegian":  {"standard norwegian", "oslo accent", "regional accent", "non-native norwegian"},
    "polish":     {"standard polish", "regional accent", "non-native polish"},
    "portuguese": {"brazilian portuguese", "european portuguese", "african portuguese",
                   "non-native portuguese"},
    "romanian":   {"standard romanian", "moldavian", "regional accent", "non-native romanian"},
    "russian":    {"standard russian", "regional accent", "ukrainian/belarusian russian",
                   "non-native russian"},
    "spanish":    {"castilian spanish", "mexican spanish", "rioplatense spanish",
                   "caribbean spanish", "colombian spanish", "chilean spanish",
                   "andean spanish", "costa rican spanish", "non-native spanish"},
    "swedish":    {"standard swedish", "regional accent", "non-native swedish"},
    "thai":       {"standard thai (central thai)", "regional accent", "non-native thai"},
    "turkish":    {"standard turkish", "eastern anatolian turkish", "black sea region turkish",
                   "aegean turkish", "central anatolian turkish", "non-native turkish"},
    "vietnamese": {"northern vietnamese", "central vietnamese", "southern vietnamese",
                   "non-native vietnamese"},
}

# English number words
_EN_NUM_RE = re.compile(
    r'\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|'
    r'thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|'
    r'thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)\b',
    re.IGNORECASE,
)
_EN_NUM_EXEMPT_RE = re.compile(
    r'\b(plus|minus|times|divided|percent|degrees?|infinity|prime|phi|theta|'
    r'half|quarter|third|fifth|sixth|seventh|eighth|ninth|tenth|once|twice|thrice)\b',
    re.IGNORECASE,
)
_EN_NUM_MAP = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
    "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
    "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
    "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
    "seventy": 70, "eighty": 80, "ninety": 90, "hundred": 100, "thousand": 1000,
    "million": 1_000_000, "billion": 1_000_000_000,
}


# Helpers

def _addr(row_idx: int, col_idx: int) -> str:
    """"0-based i.e. starting from idx 0 -> spreadsheet cell addr"""
    return f"{COL_LETTER[col_idx]}{row_idx + 2}"


def _issue(cell, text, fixed, itype, original) -> dict:
    return {
        "cellAddress": cell,
        "issue": text,
        "fixedValue": fixed,
        "issueType": itype,
        "originalValue": str(original),
    }


def _resolve_lang(raw) -> str:
    """Return lowercase language name from raw value"""
    if not isinstance(raw, str):
        return ""

    v = raw.strip().lower()
    return ISO_TO_LANG.get(v, v)


def _best_locale(lang: str) -> str:
    """return preferred full-form locale for a language"""
    full = [l for l in VALID_LOCALES.get(lang, []) if '_' in l]
    return full[0] if full else next(iter(VALID_LOCALES.get(lang, [""])))


def _to_float(val) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.


# Per-row checks
_SPEAKER_RE = re.compile(r'^speaker_\d{2}$')
_SPEAKER_LIKE_RE = re.compile(r'(?i)^speaker[_ ]?(\d+)$')


def _check_speaker(i, val):
    out = []
    if not isinstance(val, str) or not val:
        out.append(_issue(_addr(i, 2), "Speaker field is empty", "", "SPEAKER_FORMAT", val))
        return out

    if not _SPEAKER_RE.match(val):
        m = _SPEAKER_LIKE_RE.match(val)
        if m:
            fixed = f"speaker_{int(m.group(1)):02d}" if m else ""
            out.append(_issue(
                _addr(i, 2),
                f"Speaker tag must be all-lowercase with underscores and zero-padded number (e.g. speaker_01). Got: '{val}'",
                fixed, "SPEAKER_FORMAT", val
            ))

    return out


def _check_timestamps(i, start, end):
    out = []

    try:
        s, e = _to_float(start), _to_float(end)
    except (TypeError, ValueError):
        return out

    if e <= s:
        out.append(_issue(
            _addr(i, 4),
            f"End time ({e}) must be greater than start time ({s})",
            "", "TIMESTAMP_ORDER", end))
    return out


def _check_emotion(i, val):
    out = []
    if not isinstance(val, str) or not val.strip():
        out.append(_issue(_addr(i, 7), "Emotion field is empty", "neutral", "EMOTION_FORMAT", val))
        return out

    v = val.strip()

    if v.startswith('('):
        inner = re.sub(r'^\(|\)$', '', v).strip().lower()
        out.append(_issue(
            _addr(i, 7),
            f"Emotion must not be wrapped in parentheses. Got: '{v}'",
            inner, "EMOTION_FORMAT", val
        ))
        return out
    if v != v.lower():
        out.append(_issue(
            _addr(i, 7),
            f"Emotions must be plain lowercase. Got: '{v}'",
            v.lower(), "EMOTION_FORMAT", val
        ))
    return out


def _check_language(i, val):
    out = []
    if not isinstance(val, str) or not val.strip():
        out.append(_issue(_addr(i, 8), "Language field is empty", "", "LANGUAGE_FORMAT", val))
        return out
    v = val.strip()
    vl = v.lower()

    if vl in ISO_TO_LANG:
        out.append(_issue(
            _addr(i, 8),
            f"Language must be the full lowercase name, not an ISO code. Got: '{v}'",
            ISO_TO_LANG[vl], "LANGUAGE_FORMAT", val
        ))
        return out
    if v != vl:
        out.append(_issue(
            _addr(i, 8),
            f"Language must be all lowercase. Got: '{v}'",
            vl, "LANGUAGE_FORMAT", val
        ))
    return out


def _check_locale(i, locale_val, language_val):
    out = []
    if not isinstance(locale_val, str) or not locale_val.strip():
        lang = _resolve_lang(language_val)
        inferred = _best_locale(lang) if lang else ""
        out.append(_issue(_addr(i, 9), "Locale field is empty", inferred, "LOCALE_FORMAT", locale_val))
        return out

    loc = locale_val.strip()
    lang = _resolve_lang(language_val)

    # Checking separator format. Must be underscore(_)
    sep_m = re.match(r'^([a-zA-Z]{2,3})([_\-/ ])([a-zA-Z]{2,3})$', loc)
    if sep_m:
        lp, sep, rp = sep_m.groups()
        expected = f"{lp.lower()}_{rp.upper()}"

        if loc != expected:
            out.append(_issue(
                _addr(i, 9),
                f"Locale must use underscore with lowercase lang + UPPERCASE region. Got:'{loc}'",
                expected if lang in VALID_LOCALES and expected in VALID_LOCALES[lang] else _best_locale(lang),
                "LOCALE_FORMAT", locale_val
            ))

            return out
        loc = expected

    # Validity check against approved table
    if lang in VALID_LOCALES and loc not in VALID_LOCALES[lang]:
        out.append(_issue(
            _addr(i, 9),
            f"Locale {loc} is not valid for language '{lang}'",
            _best_locale(lang), "LOCALE_FORMAT", locale_val))
        return out

    # Bare subtag expansion (only when full form is determinable and present in approved set)
    if re.match(r'^[a-z]{2,3}$', loc) and loc not in VALID_BARE_AS_IS and loc in BARE_TO_FULL:
        full = BARE_TO_FULL[loc]

        if lang not in VALID_LOCALES or full in VALID_LOCALES.get(lang, set()):
            out.append(_issue(
                _addr(i, 9),
                f"Bare locale subtag '{loc}' should be expanded to full regional from",
                full, "LOCALE_FORMAT", locale_val))

    return out


def _check_accent(i, accent_val, language_val):
    out = []
    lang = _resolve_lang(language_val)

    if (not isinstance(accent_val, str) or not accent_val.strip() or accent_val.strip().lower() == "null"):
        fallback = f"standard {lang}" if lang else ""

        out.append(_issue(
            _addr(i, 10),
            "Accent field must not be empty or null",
            fallback, "ACCENT_MISSING", accent_val
        ))
        return out

    acc = accent_val.strip()
    acc_l = acc.lower()

    if lang not in VALID_ACCENTS:
        return out  # Unknown language

    valid = VALID_ACCENTS[lang]

    if acc_l in valid:
        if acc != acc_l:
            out.append(_issue(
                _addr(i, 10),
                f"Accent must all be lowercase. Got: '{acc}'",
                acc_l, "ACCENT_INVALID", accent_val
            ))
        return out

    # Not in list at all
    fallback = (f"standard {lang}" if f"standard {lang}" in valid
                else "regional accent" if "regional accent" in valid else sorted(valid)[0])
    sample = ", ".join(sorted(valid)[:4])

    out.append(_issue(
        _addr(i, 10),
        f"Accent '{acc}' is not in the approved list for '{lang}'. Example: {sample}...",
        fallback, "ACCENT_INVALID", accent_val
    ))
    return out


def _check_nonspeech_col(i, val):
    out = []
    if not isinstance(val, str) or not val.strip():
        return out
    v = val.strip()

    if v.lower() == "(none)":
        return out  # nothing to fix

    if not (v.startswith('(') and v.endswith(')')):
        out.append(_issue(
            _addr(i, 6),
            f"Non-speech event must be wrapped in parentheses. Got: '{v}'",
            f"({v.lower()})", "NONSPEECH_FORMAT", val
        ))

    inner = v[1:-1]
    if inner != inner.lower():
        out.append(_issue(
            _addr(i, 6,),
            f"Non-speech event must be lowercase. Got '{v}'",
            f"({inner.lower()})", "NONSPEECH_FORMAT", val
        ))
    return out


_INLINE_TAG_RE = re.compile(r'\([^)]+\)')
_INLINE_ALLOWED = {'...', 'silence', 'overlapping', '/overlapping'}


def _check_inline_nonspeech(i, transcript):
    """Flag non-speech tags embedded inside transcript text (column F)."""
    out = []

    if not isinstance(transcript, str):
        return out
    for m in _INLINE_TAG_RE.finditer(transcript):
        inner = m.group(0)[1: -1].strip().lower()
        if inner in _INLINE_ALLOWED or re.match(r'\.+', inner):
            continue
        fixed = re.sub(r'  +', ' ', transcript.replace(m.group(0), '')).strip()

        out.append(_issue(
            _addr(i, 5),
            f"Non-speech tag '{m.group(0)}' must not appear inline in the transcript",
            fixed, "NONSPEECH_FORMAT", transcript
        ))
    return out


def _check_pause_format(i, transcript):
    """Flag '...' (three dots) used as a pause instead of '(...)'."""
    out = []
    if not isinstance(transcript, str):
        return out

    if re.search(r'(?<!\.)\.\.\.(?!\.)', transcript):
        fixed = transcript.replace('...', '(...)')
        out.append(_issue(
            _addr(i, 5),
            "Use '(...)' for a short pause, not '...'",
            fixed, "TRANSCRIPT_PAUSE", transcript
        ))

    return out


def _check_en_numbers(i, transcript, language_val):
    """English-only: flag spelled-out cardinal number words."""
    out = []
    if not isinstance(transcript, str):
        return out

    lang = _resolve_lang(language_val)
    if lang != "english":
        return out

    for m in _EN_NUM_RE.finditer(transcript):
        word = m.group(0)
        ctx = transcript[max(0, m.start()-25): m.end()+25]

        if _EN_NUM_EXEMPT_RE.search(ctx):
            continue
        numval = _EN_NUM_MAP.get(word.lower(), word)
        fixed = transcript[:m.start()] + str(numval) + transcript[m.end():]

        out.append(_issue(
            _addr(i, 5),
            f"Number word '{word}' should be written as an Arabic numeral",
            fixed, "TRANSCRIPT_NUMBER", transcript
        ))
        break
    return out


# Cross-segment checks

def _check_timestamp_gaps(rows):
    out = []
    by_audio = defaultdict(list)

    for i, row in enumerate(rows):
        by_audio[row[COL["audio_no"]]].append((i, row))

    for audio_no, segs in by_audio.items():
        segs.sort(key=lambda x: _to_float(x[1][COL["segment"]]))

        for j in range(len(segs) - 1):
            i_cur, r_cur = segs[j]
            i_nxt, r_nxt = segs[j+1]

            try:
                end_cur = _to_float(r_cur[COL["end"]])
                start_nxt = _to_float(r_nxt[COL["start"]])
            except (TypeError, ValueError):
                continue

            if abs(end_cur - start_nxt) > 0.01:
                out.append(_issue(
                    _addr(i_nxt, COL["start"]),
                    f"Start time ({start_nxt}) does not match previous segment's end time ({end_cur})",
                    str(end_cur), "TIMESTAMP_GAP", r_nxt[COL["start"]]
                ))
    return out


def _check_locale_consistency(rows):
    out = []
    by_audio = defaultdict(list)

    for i, row in enumerate(rows):
        by_audio[row[COL["audio_no"]]].append((i, row))

    for audio_no, segs in by_audio.items():
        locales = [str(s[1][COL["locale"]]).strip() for s in segs]

        # Filter out null values
        # valid_locales = [l for l in locales if l and l.lower() != "null"]
        # if not valid_locales:
        #     continue

        majority = Counter(locales).most_common(1)[0][0]
        for (i, row), loc in zip(segs, locales):
            if loc != majority:
                out.append(_issue(
                    _addr(i, COL["locale"]),
                    f"Locale '{loc}' inconsistent with majority '{majority}' for audio '{audio_no}'",
                    majority, "LOCALE_FORMAT", loc
                ))
    return out


def _check_language_consistency(rows):
    out = []
    by_audio = defaultdict(list)

    for i, row in enumerate(rows):
        by_audio[row[COL["audio_no"]]].append((i, row))

    for audio_no, segs in by_audio.items():
        langs = [_resolve_lang(s[1][COL["language"]]) for s in segs]
        majority = Counter(langs).most_common(1)[0][0]

        for (i, row), lang in zip(segs, langs):
            if lang != majority:
                out.append(_issue(
                    _addr(i, COL["language"]),
                    f"Language '{lang}' inconsistent with majority '{majority}' for audio '{audio_no}'",
                    majority, "LANGUAGE_FORMAT", row[COL["language"]]
                ))
    return out

# Use majority language across audio group as the trusted value


def _resolve_row_lang(data_rows):
    """Returns dict of row_idx -> trusted language string."""
    by_audio = defaultdict(list)

    for i, row in enumerate(data_rows):
        by_audio[row[COL["audio_no"]]].append((i, row))

    trusted = {}
    for audio_no, segs in by_audio.items():
        langs = [_resolve_lang(s[1][COL["language"]]) for s in segs]
        majority = Counter(langs).most_common(1)[0][0]

        for i, row in segs:
            trusted[i] = majority
    return trusted


def _check_speaker_consistency(rows):
    out = []
    by_audio = defaultdict(list)

    for i, row in enumerate(rows):
        by_audio[row[COL["audio_no"]]].append((i, row))

        for audio_no, segs in by_audio.items():
            known = {
                row[COL["speaker"]] for _, row in segs if _SPEAKER_RE.match(row[COL["speaker"]])
            }

            if not known:
                continue

            for i, row in segs:
                val = row[COL["speaker"]]

                if _SPEAKER_RE.match(str(val)):
                    continue

                # Try to extract a digit and match to nearest known speaker
                digits = re.search(r'\d+', str(val))

                if (digits):
                    n = int(digits.group())

                    fixed = min(known, key=lambda s: abs(int(re.search(r'\d+', s).group()) - n))

                    out.append(_issue(
                        _addr(i, 2),
                        f"Malformed speaker '{val}' resolved to nearest known speaker in file.",
                        fixed, "SPEAKER_FORMAT", val
                    ))
                else:
                    # No digits - can't figure out how to resolve, flag for user
                    out.append(_issue(
                        _addr(i, 2),
                        f"Could not resolve malformed speaker '{val}' — no digit found to match against known speakers ({', '.join(sorted(known))}).",
                        "Please fix manually.", "SPEAKER_FORMAT", val
                    ))
    return out


def run_deterministic_audit(payload: list) -> list[dict]:
    """
    Run all deterministic checks on 2D transcript array recieved from sheet.
    Row 0 = header; data rows start at idx 1.
    Returns a deduplicated list of issue dicts
    """

    if not payload or len(payload) < 2:
        return []

    data_rows = [list(r) + [""] * max(0, 11-len(r)) for r in payload[1:]]
    issues = []

    trusted_lang = _resolve_row_lang(data_rows)

    for i, row in enumerate(data_rows):
        issues += _check_speaker(i, row[COL["speaker"]])
        issues += _check_timestamps(i, row[COL["start"]], row[COL["end"]])
        issues += _check_emotion(i, row[COL["emotion"]])
        issues += _check_language(i, row[COL["language"]])
        issues += _check_locale(i, row[COL["locale"]], trusted_lang[i])
        issues += _check_accent(i, row[COL["accent"]], trusted_lang[i])
        issues += _check_nonspeech_col(i, row[COL["nonspeech"]])
        issues += _check_inline_nonspeech(i, row[COL["transcript"]])
        issues += _check_pause_format(i, row[COL["transcript"]])
        issues += _check_en_numbers(i, row[COL["transcript"]], row[COL["language"]])

    issues += _check_timestamp_gaps(data_rows)
    issues += _check_speaker_consistency(data_rows)
    issues += _check_locale_consistency(data_rows)
    issues += _check_language_consistency(data_rows)

    # Deduplicate by (cellAddress, issueType)
    seen, deduped = set(), []

    for issue in issues:
        key = (issue["cellAddress"], issue["issueType"])

        if key not in seen:
            seen.add(key)
            deduped.append(issue)

    return deduped
