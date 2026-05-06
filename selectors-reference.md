# CSS Selectors

See per-selector documentation on MDN. Generally selector syntax is not that complicated. It's just

```
a:link {
  color: blue;
}
```

But across tons of different conditions and niche situations.

```
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:active#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:any-link#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:autofill#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:buffering#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:checked#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:default#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:defined#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:dir#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:disabled#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:empty#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:enabled#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:first-child#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:first-of-type#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-within#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:fullscreen#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:future#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:hover#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:in-range#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:indeterminate#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:interest-source#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:interest-target#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:invalid#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:is#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:lang#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:last-child#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:last-of-type#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:link#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:is#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:modal#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:muted#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:not#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-child#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-of-type#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-last-child#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-last-of-type#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:only-child#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:only-of-type#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:open#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:optional#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:out-of-range#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:past#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:paused#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:picture-in-picture#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:placeholder-shown#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:playing#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:popover-open#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:read-only#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:read-write#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:required#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:root#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:scope#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:seeking#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:stalled#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:target#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:user-invalid#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:user-valid#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:valid#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:visited#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:volume-locked#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:where#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Webkit_extensions#pseudo-classes#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Attribute_selectors#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Class_selectors#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/ID_selectors#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Type_selectors#syntax
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Universal_selectors#syntax
```
