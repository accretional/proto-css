# Grammar-Based CSS Property Generation

This document describes the system that generates exhaustive HTML visual references for CSS properties, driven by EBNF grammar definitions.

## Pipeline Overview

```
lang/*.ebnf (12 files, ~3900 rules)
        │
        ▼
   metaparser (gluon v2)
        │
        ▼
   GrammarDescriptor
        │
        ▼
   GenAll(propRuleName, limit)     ──▶  exhaustive CSS values
        │                                      │
        ▼                                      ▼
   loadBlueprint(prop.textproto)   +   values  ──▶  generateFromBlueprint()
        │                                              │
        ▼                                              ▼
   chrome-testing/html/generated/{property}.html
```

1. **Parse**: 12 EBNF files are concatenated and parsed into a `GrammarDescriptor` via the gluon v2 metaparser.
2. **Enumerate**: For each property, `GenAll` walks the grammar tree exhaustively, producing all valid CSS values (capped at 36).
3. **Render**: Each property's blueprint (textproto sidecar) defines the demo shape. The generator stamps out one card per value.

## Blueprint System

### What

Each CSS property has a `.textproto` sidecar file in `chrome-testing/blueprints/` that describes *how* to demonstrate the property, separate from *which values* to show. The blueprint defines:

- **`target_tag`** — the HTML element to apply the property to (default: `div`)
- **`target_base_style`** — inline styles on the target *excluding* the tested property
- **`target_inner_html`** — text/HTML inside the target element
- **`child_elements`** — child elements (for flex/grid demos)
- **`siblings_before` / `siblings_after`** — sibling elements (for position/float demos)
- **`wrapper_style`** — style on the `.demo-area` wrapper
- **`extra_css`** — additional CSS rules in the `<style>` block
- **`max_values`** — override the default cap of 36
- **`demo_type`** — semantic tag (BOX, FLEX, GRID, TEXT, etc.) for documentation

### Why blueprints instead of templates

The original approach used hand-written HTML templates with a fixed number of demo cards. The generator could only swap values into existing cards 1-to-1, meaning the number of demonstrated values was locked to whatever the template author chose.

Blueprints decouple **structure** from **values**. The blueprint says "here's what a demo card looks like for `flex-direction`" and the generator says "here are 6 valid values from the grammar" — producing 6 cards. If the grammar later adds a new keyword, the generator picks it up automatically without touching the blueprint.

### How blueprints were derived

Each blueprint was extracted from its corresponding hand-written template by parsing the HTML structure: identifying the target element, its base styles, child/sibling elements, and any extra CSS rules. This preserved the visual design decisions (colors, sizes, layouts) that make each property's demo meaningful.

## Representative Values

### What

A collection of ~59 grammar type entries defined in `chrome-testing/representative_values.textproto`, each with a type name, hand-picked sample values, and optional primary rules. The proto schema is in `chrome-testing/proto/representative.proto`.

```textproto
types {
  type_name: "ColorType"
  values: "red"
  values: "#3498db"
  values: "rgb(0, 128, 0)"
  values: "transparent"
  values: "currentcolor"
  primary_rules: "color"
  primary_rules: "background-color"
  primary_rules: "border-color"
  # ...
}
```

### Why

CSS grammar types like `ColorType` are recursively defined and can produce infinite values (`rgb(0,0,0)` through `rgb(255,255,255)` alone is 16 million). Enumerating them exhaustively is impossible and visually useless — seeing 36 slightly different colors tells you nothing about what `border-top-width` does.

Representative values short-circuit recursion at these open-ended types, providing a small set of visually distinct, meaningful examples. This keeps generation fast (milliseconds, not heat death of the universe) and output useful.

### Primary Rules

But when the property *is* the type — e.g., the `color` property exists specifically to set a color — short-circuiting with 5 samples misses the point. The `primary_rules` field lists properties where the type should NOT be short-circuited, so the grammar is expanded fully.

Example: `ColorType` lists `color`, `background-color`, `accent-color`, etc. as primary rules. When generating values for `color`, `ColorType` is expanded fully (producing named colors, system colors, `device-cmyk()`, `light-dark()`, etc.). When generating values for `border-width`, `ColorType` is never even reached (it's not in the grammar), and for `border`, it would be short-circuited to the 5 representative samples.

### Coverage

Types with representative values include:
- Dimensions: `LengthType`, `LengthPercentageType`, `PercentageType`
- Colors: `ColorType`, `NamedColorType`, `ColorBaseType`
- Time/animation: `TimeType`, `AngleType`, `EasingFunctionType`
- Functions: `CalcFn`, `MathFunctionType`, `FilterFunctionType`, `TransformFunctionType`
- Complex types: `ImageType`, `GradientType`, `ShadowType`, `PositionType`

## Cycle Detection

CSS grammars contain genuine cycles. For example:
```
CalcSumType = CalcProductType (("+"|"-") CalcProductType)* ;
CalcProductType = CalcValueType (("*"|"/") CalcValueType)* ;
CalcValueType = NumberType | LengthPercentageType | "(" CalcSumType ")" ;
```

`CalcSumType → CalcProductType → CalcValueType → CalcSumType` is a cycle.

The enumerator tracks a `visited` set of rule names. When it encounters a rule already in the set, it returns empty — breaking the cycle. Combined with representative values (which short-circuit `CalcType` before recursion even starts), this prevents infinite loops while still producing useful output.

A hard depth limit of 15 provides an additional safety net.

## Grid Column Auto-Sizing

The number of grid columns adapts to the value count:

| Values | Columns |
|--------|---------|
| 1–3    | 2       |
| 4–6    | 3       |
| 7–12   | 4       |
| 13–20  | 5       |
| 21+    | 6       |

This keeps cards readable at any count — properties with 3 values (like `visibility`) get wide cards, while properties with 30+ keyword alternatives (like `display`) get a dense grid.

## Fallback Mechanism

Properties without a blueprint file get a generic fallback: a simple `cornflowerblue` rectangle with the property applied inline. This ensures every property in the grammar gets a generated page, even if no one has written a blueprint for it yet. Currently 5 of 528 properties use the fallback.

## Running

```bash
# Generate all HTML files
./tools/gen.sh

# Or directly:
go run ./chrome-testing/cmd/generate/ \
  --lang lang \
  --blueprints chrome-testing/blueprints \
  --out chrome-testing/html/generated \
  --max 36
```

## File Map

| Path | Purpose |
|------|---------|
| `lang/*.ebnf` | 12 EBNF grammar files defining CSS syntax |
| `chrome-testing/proto/blueprint.proto` | Protobuf schema for blueprint sidecars |
| `chrome-testing/proto/representative.proto` | Protobuf schema for representative values |
| `chrome-testing/proto/propertydesc.proto` | Protobuf schema for property descriptors |
| `chrome-testing/proto/*.pb.go` | Generated Go code from protos |
| `chrome-testing/textproto/representative_values.textproto` | Representative value definitions with primary rules |
| `chrome-testing/textproto/blueprints/*.textproto` | 525 blueprint sidecar files |
| `chrome-testing/cmd/generate/main.go` | Generator entry point, blueprint loading, HTML rendering |
| `chrome-testing/cmd/generate/grammargen.go` | Grammar wrapper, GenAll, GenN, enumeration logic |
| `chrome-testing/html/generated/*.html` | Output: 528 generated HTML pages |
| `chrome-testing/html/template/*.html` | Original hand-written templates (reference) |
