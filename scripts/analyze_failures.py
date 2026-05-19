#!/usr/bin/env python3
"""
analyze_failures.py — Parse test output and classify each CSS parse failure.

Usage:
    python3 scripts/analyze_failures.py [--out temp/out.txt] [--json lang/failures.json]
"""

import argparse
import json
import os
import re
import sys

# ── Classification definitions ─────────────────────────────────────────────

CATEGORIES = {
    # ── Documented EBNF / CSS constraints ────────────────────────────────────
    "ebnf_constraint__vds_ordering": {
        "label": "VDS || / && ordering (documented constraint)",
        "kind": "documented_constraint",
        "constraint_name": "||_and_&&_both_lose_ordering_flexibility",
        "description": (
            "CSS VDS `||` and `&&` allow any token order; the EBNF fixes a canonical "
            "order. CSS using a non-canonical order (e.g. `border: solid 1px red`, "
            "`animation: name 2s linear`) fails against the grammar."
        ),
    },
    "ebnf_constraint__vendor_prefix_property": {
        "label": "Webkit / vendor-prefixed property (documented constraint)",
        "kind": "documented_constraint",
        "constraint_name": "WebKit_extensions_are_not_written",
        "description": (
            "Webkit/vendor-prefixed properties (-webkit-*, -moz-*, -ms-*) are intentionally "
            "omitted. Documented in docs/CSS_EBNF_CONSTRAINTS.md."
        ),
    },
    "ebnf_constraint__url_prefix_ambiguity": {
        "label": "Optional ident consumes 'url' before url() can match (documented constraint)",
        "kind": "documented_constraint",
        "constraint_name": "Optional_rules_greedily_consume_shared_identifier_prefixes",
        "description": (
            "@namespace [ <ident> ] ( <string> | url(<string>) ) — the optional ident "
            "consumes 'url' as a valid identifier, leaving '(...)' stranded. "
            "Documented in docs/CSS_EBNF_CONSTRAINTS.md."
        ),
    },

    # ── Undocumented EBNF / parser constraints ───────────────────────────────
    "declarationvaluetype_placeholder": {
        "label": "DeclarationValueType = string_literal (placeholder — should be any CSS token sequence)",
        "kind": "undocumented_constraint",
        "description": (
            "DeclarationValueType is defined as `string_literal` — a quoted-string placeholder "
            "instead of the intended 'any CSS token sequence'. Affects @media queries "
            "(MediaQueryListType), @supports (SupportsDeclType / GeneralEnclosedType), "
            "@container size/style queries, @custom-media, and various function fallbacks."
        ),
    },
    "keyframes_percent_selector": {
        "label": "@keyframes uses CssStyleSheet — rejects percentage selectors (0%, 50%, 100%)",
        "kind": "undocumented_constraint",
        "description": (
            "AtKeyframes body = QualifiedRuleListType = CssStyleSheet. CssStyleSheet parses "
            "rules whose selectors must be ComplexSelectorList — which has no production for "
            "percentage tokens (0%, 50%, 100%) or comma-separated percentage lists. "
            "Every @keyframes block using percentage selectors fails."
        ),
    },
    "viewport_unit_keyword_boundary": {
        "label": "sv/lv/dv viewport prefixes are keywords — word-boundary enforcement breaks svh/dvw/lvmin",
        "kind": "undocumented_constraint",
        "description": (
            "small_viewport_length_unit = sv , viewport_length_suffix. "
            "sv / lv / dv are defined as keyword terminals in keyword.ebnf. "
            "Gluon enforces a word boundary after each keyword match, so 'sv' in 'svh' "
            "fails the boundary check because 'h' immediately follows with no boundary. "
            "All dynamic/small/large viewport units (svh, svw, dvh, lvmin, etc.) are affected."
        ),
    },

    # ── Naming bugs / simple implementation mistakes ─────────────────────────
    "naming_bug__image_type_uses_url_keyword": {
        "label": "ImageType uses bare url keyword instead of UrlType — url() images fail",
        "kind": "naming_bug",
        "description": (
            "ImageType = url | ImageFn | ImageSetFn | ... — the first alternative is the bare "
            "keyword terminal url = \"url\", not the UrlType rule (url , '(' , string , ')'). "
            "So background-image: url(\"img.png\"), border-image-source: url(...), "
            "list-style-image: url(...) and all other <image>-typed properties that use url() "
            "fail to parse."
        ),
    },
    "naming_bug__trig_fn_not_in_calc_value": {
        "label": "Trig/exponential functions defined but not in CalcValueType",
        "kind": "naming_bug",
        "description": (
            "CosFn, SinFn, TanFn, AcosFn, AsinFn, AtanFn, Atan2Fn, ExpFn, LogFn, SqrtFn, "
            "PowFn, HypotFn are defined in functions.ebnf but CalcValueType in datatype.ebnf "
            "only lists CalcFn | MinFn | MaxFn | ClampFn | RoundFn | AbsFn | SignFn. "
            "So calc(100px * cos(45deg)) fails."
        ),
    },
    "naming_bug__srgb_case": {
        "label": "sRGB keyword is case-sensitive but CSS uses lowercase srgb",
        "kind": "naming_bug",
        "description": (
            "sRGB = \"sRGB\" in keyword.ebnf (capital R). CSS color() uses lowercase: "
            "color(srgb 0 0 1). Gluon keyword matching is case-sensitive, so color(srgb ...) "
            "fails while color(sRGB ...) would pass. CSS color space names are "
            "case-insensitive per spec."
        ),
    },
    "naming_bug__font_face_stretch_vs_width": {
        "label": "@font-face uses font-stretch but grammar has AtFontFaceWidthDesc with font-width",
        "kind": "naming_bug",
        "description": (
            "AtFontFaceWidthDesc = font_width , colon_symbol , FontFaceWidthDescType , semicolon_symbol. "
            "font_width = \"font-width\". But in real CSS, @font-face uses font-stretch, not font-width. "
            "Any @font-face block with a font-stretch descriptor fails."
        ),
    },

    # ── Missing rules / features ─────────────────────────────────────────────
    "missing_at_rule_descriptor__property": {
        "label": "@property — missing descriptor block (syntax / inherits / initial-value)",
        "kind": "missing_rule",
        "description": (
            "@property uses DeclarationListType = RuleBody which only knows standard properties. "
            "The descriptors syntax, inherits, and initial-value are not CSS properties."
        ),
    },
    "missing_at_rule_descriptor__view_transition": {
        "label": "@view-transition — missing navigation / types descriptors",
        "kind": "missing_rule",
        "description": (
            "@view-transition uses DeclarationListType = RuleBody. The keywords navigation "
            "and types are absent from keyword.ebnf and not in any property rule."
        ),
    },
    "missing_at_rule_descriptor__page_size": {
        "label": "@page — size / page-orientation descriptor missing",
        "kind": "missing_rule",
        "description": (
            "AtPage uses DeclarationRuleListType = RuleBody. PageSizeDescriptorType and "
            "PageOrientationType are defined in atrule.ebnf but never wired into a dedicated "
            "@page descriptor block. size is not a standard CSS property."
        ),
    },
    "missing_at_rule_descriptor__font_face": {
        "label": "@font-face — missing descriptors: font-display / font-variation-settings / size-adjust / unicode-range etc.",
        "kind": "missing_rule",
        "description": (
            "AtFontFaceBlock only handles src, font-weight, font-style, font-width. "
            "Missing: font-display, font-variation-settings, size-adjust, ascent-override, "
            "descent-override, line-gap-override, unicode-range."
        ),
    },
    "missing_at_rule_descriptor__font_palette_values": {
        "label": "@font-palette-values — missing base-palette / override-colors descriptors",
        "kind": "missing_rule",
        "description": (
            "AtFontPaletteValues uses DeclarationListType = RuleBody. "
            "base-palette and override-colors are not standard CSS properties."
        ),
    },
    "missing_at_rule_descriptor__font_feature_values": {
        "label": "@font-feature-values — nested @-rules not supported",
        "kind": "missing_rule",
        "description": (
            "AtFontFeatureValues uses DeclarationRuleListType = RuleBody which does not "
            "handle the nested at-rules: @styleset, @stylistic, @swash, @annotation, "
            "@ornaments, @character-variant."
        ),
    },
    "missing_at_rule_descriptor__counter_style": {
        "label": "@counter-style — missing descriptors: additive-symbols / fallback / suffix / speak-as",
        "kind": "missing_rule",
        "description": (
            "AtCounterStyleBlock handles system, symbols, range, negative, pad but is missing "
            "the additive-symbols, fallback, suffix, and speak-as descriptors."
        ),
    },
    "missing_at_rule_descriptor__function_result": {
        "label": "@function — result: pseudo-property missing",
        "kind": "missing_rule",
        "description": (
            "AtFunction body uses DeclarationRuleListType = RuleBody. The result: pseudo-property "
            "inside @function bodies is not a standard CSS property."
        ),
    },
    "missing_at_rule__color_profile_in_color_fn": {
        "label": "@color-profile — custom color space not usable in color()",
        "kind": "missing_rule",
        "description": (
            "AtColorProfile rule is defined, but ColorFn does not support dashed-ident "
            "color-space names (e.g. color(--swop5c 0% 70% 20% 0%)). "
            "CustomParamsType handles the params but only via ColorspaceParamsType, "
            "which starts with dashed_ident_type already — may be a routing issue."
        ),
    },
    "missing_at_rule__document": {
        "label": "@document — not-standard, not in grammar",
        "kind": "missing_rule",
        "description": (
            "@document (and @-moz-document) are non-standard at-rules not included in AtRule. "
            "Any file using them fails at offset 0."
        ),
    },
    "missing_at_rule__css_nesting": {
        "label": "CSS nesting — @starting-style / @layer / @supports inside rule body",
        "kind": "missing_rule",
        "description": (
            "CSS Nesting (Level 1) allows at-rules like @starting-style, @layer, @supports, "
            "@media inside a rule body (RuleBody). RuleBody allows NestedCssRule and AtRule, "
            "but AtStartingStyle and similar rules may not be reachable via NestedCssRule."
        ),
    },
    "vendor_pseudo_class": {
        "label": "Vendor-prefixed single-colon pseudo-class not handled (:-webkit-*, :-moz-*)",
        "kind": "missing_rule",
        "description": (
            "Fix 6 added PeVendor for double-colon vendor pseudo-elements (::). "
            "Single-colon vendor pseudo-classes like :-webkit-any-link, :-moz-loading "
            "have no equivalent rule."
        ),
    },
    "escaped_identifier": {
        "label": "Escaped characters in identifiers not supported (\\? \\000031 etc.)",
        "kind": "missing_rule",
        "description": (
            "CSS identifiers allow escape sequences. The ident_type rules in primitive.ebnf "
            "do not include a backslash-escape production, so escaped class/ID selectors fail."
        ),
    },
    "color_interpolation_method": {
        "label": "Color-interpolation-method (in srgb / in oklch longer hue) in gradient / color-mix",
        "kind": "missing_rule",
        "description": (
            "CSS Color Level 4 adds an optional color-interpolation-method to gradients and "
            "color-mix: linear-gradient(in srgb, ...). The gradient function rules do not "
            "accept this prefix."
        ),
    },
    "missing_math_function": {
        "label": "CSS math function missing or not exposed: abs() / sign() / acos() / asin() / atan() / atan2()",
        "kind": "missing_rule",
        "description": (
            "abs() and sign() are in MathFunctionType but acos(), asin(), atan(), atan2() "
            "are defined in functions.ebnf but absent from MathFunctionType. "
            "None of the trig functions are in CalcValueType (see naming_bug__trig_fn_not_in_calc_value)."
        ),
    },
    "calc_size_function": {
        "label": "calc-size() function missing",
        "kind": "missing_rule",
        "description": "calc-size() (CSS Values Level 5, for intrinsic size animation) is not in functions.ebnf.",
    },
    "dashed_function_call": {
        "label": "--function-name() custom CSS function call syntax missing",
        "kind": "missing_rule",
        "description": (
            "CSS Values Level 5 allows calling registered CSS functions with the "
            "dashed-ident syntax: padding: --double(var(--base)). This is not handled "
            "in any property value grammar rule."
        ),
    },
    "vendor_function": {
        "label": "Vendor-prefixed CSS function not handled (-moz-image-rect, etc.)",
        "kind": "missing_rule",
        "description": (
            "Vendor-prefixed functions like -moz-image-rect() are not in functions.ebnf. "
            "Consistent with the policy of not encoding webkit/moz extensions."
        ),
    },
    "nth_of_selector": {
        "label": ":nth-child(An+B of <selector-list>) — 'of' syntax not handled",
        "kind": "missing_rule",
        "description": (
            "CSS Selectors Level 4 extended :nth-child / :nth-last-child with an optional "
            "'of <selector-list>' argument. The pseudo-class rules do not accept 'of'."
        ),
    },
    "shape_function": {
        "label": "Shape function as property value (clip-path: polygon() / circle() etc.)",
        "kind": "missing_rule",
        "description": (
            "clip-path and shape-outside accept shape functions: circle(), ellipse(), "
            "polygon(), inset(), path(). These may not be wired into the relevant property rules."
        ),
    },
    "system_color": {
        "label": "CSS system color keyword not in ColorType",
        "kind": "missing_rule",
        "description": (
            "CSS Color Level 4 system colors: Canvas, CanvasText, ButtonFace, ButtonBorder, etc. "
            "are likely absent from ColorType."
        ),
    },
    "gradient_multiposition_stop": {
        "label": "Gradient color-stop with two positions (CSS Images Level 4)",
        "kind": "missing_rule",
        "description": (
            "CSS Images Level 4: a color stop may have two positions: pink 5px 10px. "
            "The gradient stop rules likely only accept one position per color."
        ),
    },
    "is_with_pseudo_element": {
        "label": ":is() / :where() with pseudo-element inside argument list",
        "kind": "missing_rule",
        "description": (
            "CSS Selectors Level 4 allows :is(::before, ::after). The ForgivingSelectorList "
            "used by :is() uses ComplexSelectorNoPe (no pseudo-elements), but some valid "
            "CSS passes pseudo-elements to :is()."
        ),
    },
    "unicode_in_string_literal": {
        "label": "Unicode characters > 0x7E in string literals not matched by string_char_dq/sq",
        "kind": "missing_rule",
        "description": (
            "string_char_dq = \" \" ... \"!\" | \"#\" ... \"~\" covers only ASCII 0x20-0x7E. "
            "Unicode characters above 0x7E (e.g. «, ►, ✓, Ⓐ) in CSS string values fail. "
            "Affects content: \"►\", quotes: \"«\" \"»\", counter symbols with Unicode, etc."
        ),
    },
    "lang_pseudo_extended_syntax": {
        "label": ":lang() — extended syntax: string args, comma list, wildcard not handled",
        "kind": "missing_rule",
        "description": (
            "CSS Selectors Level 4 extends :lang(): allows comma-separated list (:lang(\"nl\", \"de\")), "
            "string arguments (:lang(\"en\")), and wildcard ranges (:lang(\"*-Latn\")). "
            "PcLang probably only accepts a single ident_type argument."
        ),
    },
    "missing_pseudo_element_rule": {
        "label": "Pseudo-element not defined in pseudo-element.ebnf (::search-text, ::cue complex, ::part complex, etc.)",
        "kind": "missing_rule",
        "description": (
            "New or uncommon pseudo-elements not in pseudo-element.ebnf: "
            "::search-text, complex ::cue() selectors, ::part() with compound selectors, "
            "etc."
        ),
    },
    "color_mix_var_in_method": {
        "label": "color-mix() — var() in the color-interpolation-method not supported",
        "kind": "missing_rule",
        "description": (
            "color-mix(in lch var(--distance) hue, ...) uses a var() inside the "
            "hue-interpolation-method. HueInterpolationMethodType expects keywords only."
        ),
    },
    "invalid_css": {
        "label": "Test file contains invalid CSS",
        "kind": "invalid_css",
        "description": "The CSS in the test file is itself invalid per the CSS specification.",
    },
    "unknown": {
        "label": "Unknown / needs manual investigation",
        "kind": "unknown",
        "description": "Cause could not be determined automatically.",
    },
}


# ── Pattern matching helpers ───────────────────────────────────────────────

def has_non_ascii_in_string(content: str) -> bool:
    """Check if any quoted string in the CSS contains non-ASCII characters."""
    # Find all quoted strings and check their content
    for m in re.finditer(r'"([^"]*)"', content):
        if any(ord(c) > 127 for c in m.group(1)):
            return True
    for m in re.finditer(r"'([^']*)'", content):
        if any(ord(c) > 127 for c in m.group(1)):
            return True
    # Also check for bare Unicode outside strings (e.g. counter symbols)
    outside_strings = re.sub(r'"[^"]*"|\'[^\']*\'', '', content)
    if any(ord(c) > 127 for c in outside_strings):
        return True
    return False


def classify(path: str, content: str, error_offset: int, file_size: int) -> list[str]:
    """Return a list of category keys for this failure. Order: specific first."""
    reasons = []
    c = content

    # ── @document (non-standard at-rule, not in grammar) ────────────────────
    if re.search(r'@-?(?:moz-)?document\b', c):
        reasons.append("missing_at_rule__document")

    # ── vendor-prefixed CSS property (documented constraint) ─────────────────
    if re.search(r'^\s*(?:-webkit-|-moz-|-ms-)[\w-]+\s*:', c, re.MULTILINE):
        reasons.append("ebnf_constraint__vendor_prefix_property")

    # ── vendor-prefixed single-colon pseudo-class ────────────────────────────
    if re.search(r'(?<!:):(?:-webkit-|-moz-|-ms-)[\w-]+', c):
        reasons.append("vendor_pseudo_class")

    # ── vendor-prefixed functions ────────────────────────────────────────────
    if re.search(r'-(?:moz|webkit|ms)-[\w-]+\s*\(', c):
        reasons.append("vendor_function")

    # ── @namespace url() — documented optional ident prefix ambiguity ────────
    if re.search(r'@namespace\s+url\s*\(', c):
        reasons.append("ebnf_constraint__url_prefix_ambiguity")

    # ── @keyframes with percentage selectors ─────────────────────────────────
    if re.search(r'@keyframes', c) and re.search(r'\d+%\s*(?:,|\{)', c):
        reasons.append("keyframes_percent_selector")

    # ── ImageType uses bare url keyword — all url("...") image values fail ───
    # Detect property values that use url() in an <image> context
    image_url_props = [
        'background-image', 'background', 'list-style-image',
        'border-image-source', 'border-image', 'mask', 'mask-image',
        'shape-outside', 'offset-path', 'background-blend-mode',
        'border-image-repeat', 'border-image-slice', 'border-image-width',
        'border-image-outset', 'mask-border', 'cursor',
        'background-repeat', 'background-size', 'background-origin',
        'background-position', 'background-attachment', 'background-position-x',
        'background-position-y', 'background-color',
    ]
    # Check if file uses url() in a property value context (not inside @font-face src)
    # excluding atrules that already handle UrlType properly
    has_image_url = bool(re.search(r'url\s*\(\s*(?:"[^"]*"|\'[^\']*\')', c))
    # Don't flag if it's ONLY in @font-face src (which uses UrlType directly)
    content_without_fontface = re.sub(r'@font-face\s*\{[^}]*\}', '', c, flags=re.DOTALL)
    has_image_url_outside_fontface = bool(
        re.search(r'url\s*\(\s*(?:"[^"]*"|\'[^\']*\')', content_without_fontface)
    )
    if has_image_url_outside_fontface:
        # Check if any of the failing image properties are present
        if any(re.search(rf'\b{re.escape(p)}\s*:', content_without_fontface) for p in image_url_props):
            reasons.append("naming_bug__image_type_uses_url_keyword")
        # Or if url() appears after a property colon at all
        elif re.search(r':\s*(?:[^;]*\s)?url\s*\(', content_without_fontface):
            reasons.append("naming_bug__image_type_uses_url_keyword")

    # ── DeclarationValueType = string_literal placeholder ────────────────────
    # @media with non-trivial queries (media type keyword or feature queries)
    if re.search(r'@media\s+(?:print|screen|all|speech|not|only|\()', c):
        reasons.append("declarationvaluetype_placeholder")
    if re.search(r'@media\s*\(', c):
        reasons.append("declarationvaluetype_placeholder")
    # @supports with declaration-style or logical features
    if re.search(r'@supports\s+(?:not\s+)?\(', c):
        reasons.append("declarationvaluetype_placeholder")
    # @custom-media
    if re.search(r'@custom-media\b', c):
        reasons.append("declarationvaluetype_placeholder")
    # @container with feature queries (named or unnamed)
    if re.search(r'@container\s+(?:[\w-]+\s+)?\(', c):
        reasons.append("declarationvaluetype_placeholder")
    # @container style() queries
    if re.search(r'@container\s+(?:[\w-]+\s+)?style\s*\(', c):
        reasons.append("declarationvaluetype_placeholder")

    # ── @property descriptors ────────────────────────────────────────────────
    if re.search(r'@property\b', c) and re.search(r'\bsyntax\b|\binherits\b|\binitial-value\b', c):
        reasons.append("missing_at_rule_descriptor__property")

    # ── @view-transition descriptors ─────────────────────────────────────────
    if re.search(r'@view-transition', c) and re.search(r'\bnavigation\b|\btypes\b', c):
        reasons.append("missing_at_rule_descriptor__view_transition")

    # ── @page size / page-orientation ────────────────────────────────────────
    if re.search(r'@page', c) and re.search(r'\bsize\s*:|page-orientation\s*:', c):
        reasons.append("missing_at_rule_descriptor__page_size")

    # ── @font-face missing descriptors ───────────────────────────────────────
    if re.search(r'@font-face', c):
        missing_descs = ['font-display', 'font-variation-settings', 'size-adjust',
                         'ascent-override', 'descent-override', 'line-gap-override',
                         'unicode-range']
        if any(re.search(rf'\b{re.escape(d)}\s*:', c) for d in missing_descs):
            reasons.append("missing_at_rule_descriptor__font_face")

    # ── @font-face font-stretch vs font-width naming bug ─────────────────────
    if re.search(r'@font-face', c) and re.search(r'\bfont-stretch\s*:', c):
        reasons.append("naming_bug__font_face_stretch_vs_width")

    # ── @font-palette-values ─────────────────────────────────────────────────
    if re.search(r'@font-palette-values', c) and re.search(r'base-palette|override-colors', c):
        reasons.append("missing_at_rule_descriptor__font_palette_values")

    # ── @font-feature-values nested @-rules ──────────────────────────────────
    if re.search(r'@font-feature-values', c) and re.search(
            r'@styleset|@stylistic|@swash|@annotation|@ornaments|@character-variant', c):
        reasons.append("missing_at_rule_descriptor__font_feature_values")

    # ── @counter-style missing descriptors ───────────────────────────────────
    if re.search(r'@counter-style', c):
        missing = ['additive-symbols', 'fallback', 'suffix', 'speak-as']
        if any(re.search(rf'\b{re.escape(d)}\s*:', c) for d in missing):
            reasons.append("missing_at_rule_descriptor__counter_style")

    # ── @function result: pseudo-property ────────────────────────────────────
    if re.search(r'@function', c) and re.search(r'\bresult\s*:', c):
        reasons.append("missing_at_rule_descriptor__function_result")

    # ── @color-profile / color() with custom space ───────────────────────────
    if re.search(r'color\(--[\w-]+', c):
        reasons.append("missing_at_rule__color_profile_in_color_fn")

    # ── CSS Nesting — @starting-style inside rule body ───────────────────────
    # Detect @starting-style inside a { } block (not at top level)
    if re.search(r'\{[^}]*@starting-style', c, re.DOTALL):
        reasons.append("missing_at_rule__css_nesting")

    # ── Custom CSS function call (--fn-name()) ────────────────────────────────
    if re.search(r'--[\w-]+\s*\(', c):
        # But don't flag if it's only inside @function definitions
        outside_atfn = re.sub(r'@function\s+--[\w-]+\s*\([^{]*\)\s*\{[^}]*\}', '', c, flags=re.DOTALL)
        if re.search(r'--[\w-]+\s*\(', outside_atfn):
            reasons.append("dashed_function_call")

    # ── escaped identifiers ──────────────────────────────────────────────────
    if re.search(r'[#.][^\s{]*\\', c):
        reasons.append("escaped_identifier")

    # ── color-interpolation-method in gradients ───────────────────────────────
    if re.search(r'gradient\s*\(\s*in\s+(?:srgb|oklab|oklch|hsl|hwb|lch|lab|display-p3|a98-rgb|prophoto-rgb|rec2020)', c, re.IGNORECASE):
        reasons.append("color_interpolation_method")

    # ── color-mix var() in interpolation method ───────────────────────────────
    if re.search(r'color-mix\s*\(\s*in\s+\w+\s+var\s*\(', c):
        reasons.append("color_mix_var_in_method")

    # ── sRGB case sensitivity bug ─────────────────────────────────────────────
    if re.search(r'\bcolor\s*\(\s*srgb\b', c, re.IGNORECASE) and not re.search(r'\bcolor\s*\(\s*sRGB\b', c):
        reasons.append("naming_bug__srgb_case")

    # ── trig/exp functions defined but not in CalcValueType ──────────────────
    if re.search(r'\bcalc\s*\([^)]*(?:cos|sin|tan|acos|asin|atan|atan2|exp|log|sqrt|pow|hypot)\s*\(', c):
        reasons.append("naming_bug__trig_fn_not_in_calc_value")

    # ── missing math functions (abs/acos/asin/atan used outside calc) ────────
    if re.search(r'\b(?:acos|asin|atan2|atan|abs|sign)\s*\(', c):
        reasons.append("missing_math_function")

    # ── calc-size() ──────────────────────────────────────────────────────────
    if re.search(r'\bcalc-size\s*\(', c):
        reasons.append("calc_size_function")

    # ── :nth-child(An+B of .selector) ────────────────────────────────────────
    if re.search(r':nth-(?:child|last-child)\s*\([^)]*\bof\b', c):
        reasons.append("nth_of_selector")

    # ── shape functions as property values ────────────────────────────────────
    if re.search(r'(?:clip-path|shape-outside)\s*:\s*(?:polygon|circle|ellipse|inset|path)\s*\(', c):
        reasons.append("shape_function")

    # ── system colors ─────────────────────────────────────────────────────────
    system_colors = (
        r'\b(?:Canvas|CanvasText|LinkText|VisitedText|ActiveText|ButtonFace|ButtonText|'
        r'ButtonBorder|Field|FieldText|Highlight|HighlightText|SelectedItem|SelectedItemText|'
        r'Mark|MarkText|GrayText|AccentColor|AccentColorText|ActiveBorder|ActiveCaption|'
        r'AppWorkspace|ButtonHighlight|ButtonShadow|CaptionText|'
        r'InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|'
        r'MenuText|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|'
        r'ThreeDShadow|WindowFrame|WindowText)\b'
    )
    if re.search(system_colors, c):
        reasons.append("system_color")

    # ── gradient with two-position color stop ────────────────────────────────
    if re.search(r'gradient', c):
        # Pattern: color/value followed by two measurements: "pink 5px 10px" or "0.25turn 0.5turn"
        if re.search(r'[\w)]\s+[\d.]+\w*\s+[\d.]+\w*\s*[,)]', c):
            reasons.append("gradient_multiposition_stop")

    # ── :is() with pseudo-element ─────────────────────────────────────────────
    if re.search(r':is\s*\([^)]*::', c):
        reasons.append("is_with_pseudo_element")

    # ── Unicode > 0x7E in strings ─────────────────────────────────────────────
    if has_non_ascii_in_string(c):
        reasons.append("unicode_in_string_literal")

    # ── :lang() extended syntax ───────────────────────────────────────────────
    if re.search(r':lang\s*\(\s*(?:"|\*|[A-Z])', c):
        reasons.append("lang_pseudo_extended_syntax")
    if re.search(r':lang\s*\([^)]*,', c):
        reasons.append("lang_pseudo_extended_syntax")

    # ── Missing pseudo-element ────────────────────────────────────────────────
    missing_pe = ['::search-text']
    if any(re.search(rf'{pe}\b', c) for pe in missing_pe):
        reasons.append("missing_pseudo_element_rule")

    # ── Viewport units (sv/lv/dv prefix + suffix as keyword boundary problem) ─
    if re.search(r'\d+(?:svh|svw|svmin|svmax|svb|svi|lvh|lvw|lvmin|lvmax|lvb|lvi|dvh|dvw|dvmin|dvmax|dvb|dvi)\b', c, re.IGNORECASE):
        reasons.append("viewport_unit_keyword_boundary")

    # ── VDS ordering — detect common out-of-order shorthands ─────────────────
    # border: <style> <width> (style before width)
    if re.search(r'\bborder(?:-top|-right|-bottom|-left)?\s*:\s*(?:solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)\s+[\d.]', c):
        reasons.append("ebnf_constraint__vds_ordering")
    # border: <style> <color> (style before color, e.g. "border: dotted;")
    if re.search(r'\bborder\s*:\s*(?:solid|dashed|dotted|double|groove|ridge|inset|outset)', c):
        reasons.append("ebnf_constraint__vds_ordering")
    # font: <size>/<line-height>
    if re.search(r'\bfont\s*:\s*[\d.]+(?:em|rem|px|pt|%|ex)\s*/\s*[\d.]+', c):
        reasons.append("ebnf_constraint__vds_ordering")
    # font: <size> <generic-family> without weight/style before size
    if re.search(r'\bfont\s*:\s*[\d.]+(?:em|rem|px|pt|%)\s+(?:serif|sans-serif|monospace|cursive|fantasy|system-ui|math|emoji|fangsong|ui-serif|ui-sans-serif|ui-monospace|ui-rounded)', c):
        reasons.append("ebnf_constraint__vds_ordering")
    # animation: <name> <time> (name first)
    if re.search(r'\banimation(?:-name)?\s*.*\banimation\s*:[^;]*\b(?!infinite|alternate|reverse|none|both|forwards|backwards|running|paused|linear|ease|ease-in|ease-out|ease-in-out|normal|auto)(?:[a-z][\w-]*)\s+[\d.]+(?:s|ms)\b', c):
        reasons.append("ebnf_constraint__vds_ordering")
    # animation shorthand with <name> before <duration> heuristic
    if re.search(r'\banimation\s*:\s*(?:[a-z][\w-]*)\s+[\d.]+(?:s|ms)\b', c):
        reasons.append("ebnf_constraint__vds_ordering")
    # background: <url> <color> (color after url)
    if re.search(r'\bbackground\s*:[^;]*url\([^)]+\)\s+#[0-9a-fA-F]', c):
        reasons.append("ebnf_constraint__vds_ordering")
    # background: url() color repeat — color inline (VDS order)
    if re.search(r'\bbackground\s*:[^;]*url\([^)]+\)[^;]*(?:no-repeat|repeat-x|repeat-y|repeat)', c):
        if re.search(r'\bbackground\s*:[^;]*#[0-9a-fA-F]', c):
            reasons.append("ebnf_constraint__vds_ordering")

    # ── Remove duplicates preserving order ────────────────────────────────────
    seen = set()
    unique = []
    for r in reasons:
        if r not in seen:
            seen.add(r)
            unique.append(r)

    return unique if unique else ["unknown"]


# ── Parse out.txt ─────────────────────────────────────────────────────────

def parse_failures(out_path: str) -> list[dict]:
    results = []
    fail_re = re.compile(r'^FAIL\s+(.+)$')
    err_re  = re.compile(r'parsing "[^"]+": unconsumed input at offset (\d+) of (\d+)')

    with open(out_path) as f:
        lines = f.readlines()

    i = 0
    while i < len(lines):
        m = fail_re.match(lines[i].rstrip())
        if m:
            rel = m.group(1)
            error_msg = ""
            offset, size = 0, 0
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                em = err_re.search(next_line)
                if em:
                    offset = int(em.group(1))
                    size   = int(em.group(2))
                error_msg = next_line
            results.append({
                "file": rel,
                "error_message": error_msg,
                "error_offset": offset,
                "file_size": size,
            })
            i += 2
            continue
        i += 1

    return results


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Classify CSS parse failures from test output.")
    ap.add_argument("--out",      default="temp/out.txt",      help="Path to test output file")
    ap.add_argument("--json",     default="lang/failures.json", help="Output JSON path")
    ap.add_argument("--testdata", default="lang/testdata",      help="Testdata directory")
    args = ap.parse_args()

    failures = parse_failures(args.out)
    print(f"Found {len(failures)} failures in {args.out}")

    records = []
    unknown_count = 0

    for entry in failures:
        rel = entry["file"]
        css_path = os.path.join(args.testdata, rel)

        try:
            with open(css_path) as f:
                content = f.read()
        except FileNotFoundError:
            content = ""

        cats = classify(rel, content, entry["error_offset"], entry["file_size"])
        if cats == ["unknown"]:
            unknown_count += 1

        records.append({
            "file":             rel,
            "error_message":    entry["error_message"],
            "error_offset":     entry["error_offset"],
            "file_size":        entry["file_size"],
            "categories":       cats,
            "category_details": {k: CATEGORIES[k] for k in cats if k in CATEGORIES},
        })

    from collections import Counter
    cat_counts: Counter = Counter()
    for r in records:
        for cat in r["categories"]:
            cat_counts[cat] += 1

    summary = {
        "total_failures":        len(records),
        "unknown_count":         unknown_count,
        "by_category":           dict(cat_counts.most_common()),
        "category_definitions":  CATEGORIES,
    }

    output = {"summary": summary, "failures": records}

    os.makedirs(os.path.dirname(args.json) or ".", exist_ok=True)
    with open(args.json, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {args.json}")
    print(f"\nBy category ({len(cat_counts)} categories, {unknown_count} still unknown):")
    for cat, count in cat_counts.most_common():
        kind = CATEGORIES.get(cat, {}).get("kind", "?")
        label = CATEGORIES.get(cat, {}).get("label", cat)[:60]
        print(f"  {count:4d}  [{kind:30s}]  {label}")


if __name__ == "__main__":
    main()
