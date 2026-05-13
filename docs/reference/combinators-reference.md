# CSS Combinators

See eg https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Combinators

Combinators are very useful for creating and propagating interactions between style components, allowing you to implement surprisingly complex behavior, such as the infamous/magical CSS checkbox hack to implement button-like dynamic behavior on-click by propagating :selected to child and sibling elements.

Because they are declarative and ... *cascading* ... this is much more maintainable and orderly than similar functionality could be with javascript.

```
/* Set top margin on <p> elements that are direct children of <div> */
div > p {
  margin-top: 0;
}
```

Note, column combinator is as of May 2026 very new and low priority for us

```
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Child_combinator
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Column_combinator
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Descendant_combinator
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Next-sibling_combinator
https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Subsequent-sibling_combinator
```
