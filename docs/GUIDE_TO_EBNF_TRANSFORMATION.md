# CSS Value Definition Syntax to EBNF Transformation

## Background

CSS properties and data types are formally specified using **CSS Value Definition Syntax (VDS)**, a notation maintained by the W3C. The raw VDS strings are scraped from MDN into `docs/syntax/*.txt` files. This document describes how those VDS strings are mechanically transformed into **gluon-compatible EBNF** for use in the proto-CSS pipeline.

The goal is **proto-correctness**, not syntactic faithfulness. The EBNF is fed into the gluon v2 compiler (`GrammarToAST` -> `Compile`) which produces protobuf message types. Decisions about how to handle ambiguous or lossy mappings are made with the final proto shape in mind.

---

## CSS VDS Notation Reference

| CSS VDS | Meaning |
|---|---|
| `<name>` | Reference to another data type |
| `<name()>` | Reference to a function-type data type |
| `keyword` | Bare keyword literal |
| `"literal"` | Quoted literal |
| `a b c` | Juxtaposition — all of a, b, c in order (concatenation) |
| `a \| b \| c` | Exactly one of a, b, or c |
| `a \|\| b \|\| c` | One or more of a, b, c in any order |
| `a && b && c` | All of a, b, c required, any order |
| `[ expr ]` | Grouping bracket (not optional by itself) |
| `expr?` | Optional — zero or one |
| `expr*` | Zero or more |
| `expr+` | One or more |
| `expr#` | One or more, comma-separated |
| `expr{n}` | Exactly n |
| `expr{m,n}` | Between m and n |
| `expr!` | At least one in group must be non-default |

---

## EBNF Transformation Rules

### Operator Mapping

| CSS VDS | EBNF | Notes |
|---|---|---|
| `a \| b \| c` | `a \| b \| c` | Direct alternation -> gluon `oneof` |
| `a b c` (juxtaposition) | `a , b , c` | Concatenation -> sequential fields |
| `a && b && c` | `a , b , c` | All required, canonical order |
| `a \|\| b \|\| c` | `[ a ] , [ b ] , [ c ]` | Each wrapped optional (see below) |
| `[ expr ]` | `( expr )` or transparent | CSS grouping -> EBNF group |
| `expr?` | `[ expr ]` | EBNF optional |
| `expr*` | `{ expr }` | EBNF repetition |
| `expr+` | `expr , { expr }` | One or more |
| `expr#` | `expr , { "," , expr }` | Comma-separated list |
| `expr{n}` | `expr , expr , …` (n times) | Expanded inline |
| `expr{m,n}` | `expr × m , [ expr ] × (n−m)` | m required + optional remainder |
| `expr!` | `expr` + comment | Constraint noted, not enforced in grammar |

### `||` Mapping — Proto Correctness

The CSS VDS `||` operator means "one or more of these operands, in any order, each used at most once." There is no standard EBNF equivalent, and both `a | b | c` (wrong — only one) and `z, { z }; z = a | b | c` (wrong — allows `a a a`) are incorrect.

The correct proto representation for `a || b || c` is a **message with all-optional fields**:

```protobuf
message Foo {
  A a = 1;  // optional (nil if absent)
  B b = 2;  // optional
  C c = 3;  // optional
}
```

This is produced from the EBNF `[ a ] , [ b ] , [ c ]` — each operand wrapped in `[ ]` (optional). The "at least one must be set" constraint and any ordering flexibility are enforced in the render layer, not the schema.

**Note:** In proto3, `optional` is the default for message-type fields (nil = absent). So `[ a ] , [ b ]` and `a , b` generate identical proto output — both produce optional message fields. The `[ ]` wrapper in EBNF is therefore purely documentary for `||` vs `&&` vs juxtaposition, not structurally meaningful at the proto level. The semantic difference lives in the CSS render layer.

### `&&` Mapping

`a && b && c` (all required, any order) maps to plain concatenation `a , b , c`. This produces the same flat proto fields as juxtaposition. Order is canonicalized to declaration order; the render layer may accept any order on input.

### Why `|` is the Only Structurally Meaningful Operator

At the gluon proto-compilation level:
- **`|`** -> `oneof value { ... }` — exactly one field can be set
- **everything else** -> flat message with sequential fields — any combination can be set

The distinction between `||`, `&&`, and juxtaposition is entirely invisible to the proto schema. All three produce the same flat message structure. Only `|` produces a different shape (`oneof`).

---

## Naming Conventions

### CSS VDS -> EBNF Rule Name

| CSS VDS form | EBNF name | Example |
|---|---|---|
| `<foo-bar>` | `foo_bar` | `<color-mix>` -> `color_mix` |
| `<foo-bar()>` | `foo_bar_fn` | `<color-mix()>` -> `color_mix_fn` |
| `<name [0,∞]>` | `name` | `<number [0,∞]>` -> `number` |

Range annotations like `[0,100]` or `[0,∞]` in type references are stripped — they are value constraints, not structural distinctions. The referenced type name is preserved.

The `_fn` suffix distinguishes function-call types (`<rgb()>`) from the bare keyword (`rgb`) that shares the same base name in `keyword.ebnf`.

### Keyword Terminals

Bare keywords in CSS VDS (e.g., `none`, `auto`, `block`) are looked up in `lang/keyword.ebnf` and referenced by name rather than repeated as string literals. This ensures a single source of truth for keyword strings.

Examples:
- `none` -> `none` (keyword.ebnf: `none = "none" ;`)
- `currentColor` -> `currentcolor` (case-insensitive lookup)
- `-infinity` -> `_infinity` (keyword.ebnf: `_infinity = "-infinity" ;`)

If a keyword is not found in keyword.ebnf, it falls back to a string literal `"keyword"`.

---

## Already-Implemented Types

The following types are already defined in existing EBNF files and are skipped by the script:

| CSS Type | EBNF name | File |
|---|---|---|
| `<number>` | `number` | `lang/datatype.ebnf` |
| `<integer>` | `integer` | `lang/datatype.ebnf` |
| `<percentage>` | `percentage` | `lang/datatype.ebnf` |
| `<length>` | `length` | `lang/datatype.ebnf` |

Primitives (`zero`, `digit`, `whole_number`, etc.) from `lang/primitive.ebnf` are also excluded from regeneration.

---

## Stubbed References

Types that are **referenced** by definitions in `datatypes.txt` but are **not themselves defined** there are emitted as bare rule references without a definition. These will be defined in other EBNF files or added later:

- `angle` — `<angle>` type (lengths/units file)
- `url` — `<url>` type
- `string` — `<string>` type
- `dashed_ident` — `<dashed-ident>`
- `resolution` — `<resolution>`
- `zero` — already in `primitive.ebnf`
- `number_token` — lexer primitive
- `hash_token` — lexer primitive

---

## Deduplication

`datatypes.txt` contains several type definitions that appear more than once (e.g., `<color-interpolation-method>` appears three times). The script processes only the **first occurrence** of each CSS name. Subsequent occurrences are marked `[done]` in the source file and skipped.

---

## Running the Script

```bash
# Dry run — prints output without modifying files
python scripts/vds_to_ebnf.py --dry-run

# Apply — appends to lang/datatype.ebnf, marks datatypes.txt
python scripts/vds_to_ebnf.py
```

The script appends a clearly delimited section to `lang/datatype.ebnf` and marks each processed definition in `docs/syntax/datatypes.txt` with a `(* [done] *)` annotation on the definition header line.
