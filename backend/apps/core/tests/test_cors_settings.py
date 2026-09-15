from django.conf import settings
from django.test import SimpleTestCase

from config.settings.base import _ensure_origin_list


class EnsureOriginListTests(SimpleTestCase):
    def test_render_yaml_string_can_be_appended(self):
        origins = _ensure_origin_list("https://felissi-f.vercel.app")
        origins.append("http://localhost:5173")
        self.assertEqual(
            origins,
            ["https://felissi-f.vercel.app", "http://localhost:5173"],
        )

    def test_csv_and_sequence_inputs(self):
        from_csv = _ensure_origin_list("https://a.example,https://b.example")
        from_list = _ensure_origin_list(["https://a.example", "https://b.example"])
        self.assertEqual(from_csv, from_list)

    def test_regex_list_is_extended_not_replaced(self):
        existing = [r"^https://old\.example$"]
        regexes = list(existing)
        preview = r"^https://felissi-[a-z0-9-]+\.vercel\.app$"
        if preview not in regexes:
            regexes.append(preview)
        self.assertEqual(regexes[0], existing[0])
        self.assertEqual(regexes[1], preview)

    def test_non_production_settings_exclude_vercel_storefront(self):
        self.assertNotIn("https://felissi-f.vercel.app", settings.CORS_ALLOWED_ORIGINS)
        self.assertFalse(
            any("felissi-" in pattern for pattern in settings.CORS_ALLOWED_ORIGIN_REGEXES)
        )
