# CSS Value Definition Syntax → EBNF Transformation

CSS properties and data types are formally specified using **CSS Value Definition Syntax (VDS)**. The raw VDS strings are scraped from MDN into `docs/syntax/*.txt` files and transformed into **gluon-compatible EBNF**. The goal is proto-correctness — the EBNF feeds gluon v2 (`GrammarToAST` → `Compile`) to produce protobuf message types.

For translation constraints and information losses, see [CSS_EBNF_CONSTRAINTS.md](CSS_EBNF_CONSTRAINTS.md).

---

## CSS VDS Notation Reference

| CSS VDS | Meaning |
|---|---|
| `<name>` | Reference to another data type |
| `<name()>` | Reference to a function-type data type |
| `<'property-name'>` | Use the value syntax of that property (constituent reference) |
| `keyword` | Bare keyword literal |
| `"literal"` | Quoted literal |
| `a b c` | Juxtaposition — all of a, b, c in order |
| `a \| b \| c` | Exactly one of a, b, or c |
| `a \|\| b \|\| c` | One or more of a, b, c in any order |
| `a && b && c` | All of a, b, c required, any order |
| `[ expr ]` | Grouping (not optional by itself) |
| `expr?` | Optional — zero or one |
| `expr*` | Zero or more |
| `expr+` | One or more |
| `expr#` | One or more, comma-separated |
| `expr{n}` | Exactly n |
| `expr{m,n}` | Between m and n |
| `expr!` | At least one in group must be non-default |

---

## Operator Mapping

| CSS VDS | EBNF | Notes |
|---|---|---|
| `a \| b \| c` | `a \| b \| c` | Direct alternation → gluon `oneof` |
| `a b c` | `a , b , c` | Juxtaposition → sequential fields |
| `a && b && c` | `a , b , c` | Order canonicalized to declaration order |
| `a \|\| b \|\| c` | `[ a ] , [ b ] , [ c ]` | Each operand wrapped optional |
| `[ expr ]` | `( expr )` | CSS grouping → EBNF required group |
| `expr?` | `[ expr ]` | EBNF optional |
| `expr*` | `{ expr }` | EBNF zero-or-more |
| `expr+` | `expr , { expr }` | One or more |
| `expr#` | `expr , { comma_symbol , expr }` | Comma-separated list |
| `expr{n}` | `expr , expr , …` ×n | Expanded inline |
| `expr{m,n}` | `expr` ×m `, [ expr ]` ×(n−m) | m required + (n−m) optional |
| `expr!` | `expr` + comment | Constraint unencodable; noted in comment |
| `<'prop'>` | `prop_prop` | Constituent property → reference its `_prop` rule |

### Why `|` is the only structurally distinct operator

At the gluon proto level:

- **`|`** → `oneof` — exactly one field set
- **`||`, `&&`, juxtaposition** → flat message with sequential fields — identical proto shape

The `[ ]` wrapping for `||` is documentary only. All ordering and "at least one" semantics live in the render layer.

---

## Naming Conventions

| CSS VDS form | EBNF rule name | Example |
|---|---|---|
| `<foo-bar>` | `foo_bar_type` | `<color-mix>` → `color_mix_type` |
| `<foo-bar()>` | `foo_bar_fn` | `<color-mix()>` → `color_mix_fn` |
| `<name [0,∞]>` | `name_type` | Range annotation stripped |
| `foo-bar` property | `foo_bar_prop` | `outline-color` → `outline_color_prop` |
| `foo-bar` keyword | `foo_bar` | `outline-color` keyword → `outline_color` |

Range annotations (`[0,100]`, `[0,∞]`) on type references are stripped — they are value constraints, not structural distinctions. See [CSS_EBNF_CONSTRAINTS.md](CSS_EBNF_CONSTRAINTS.md) §9.

The `_fn` suffix distinguishes function-call types (`<rgb()>` → `rgb_fn`) from the bare keyword (`rgb`) that shares the same base name in `keyword.ebnf`.

---

