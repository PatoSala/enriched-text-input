# API Reference

## Props

### `ref`

A React ref that lets you call any ref methods on the input.

### `patterns`

An array of style patterns for the input. Use this prop to define which styles should be available for the input to use. 

```jsx
interface Pattern {
    name: string;
    render: React.Component;
    opening: string | null;
    closing: string | null;
}
```

A pattern can have either both opening and closing enclosures defined or just the opening enclosure, but cannot have only the closing enclosure defined. 

### `defaultValue`

Provides an initial value for the input. Can be a string or an array of tokens. If it’s a string and it matches any style defined in the `patterns` prop, proper styles will be applied. 

### `onSelectionChange`

Callback that is called when the text input selection is changed.

### `onValueChange`

Callback that is called when the text input's value changes. You can use this callback to call ref methods such as `.getRawValue()`, `.getRichTextValue()` or `.getTokenizedValue()` to get the text input’s value in your preferred 

### `onDebounceValueChange`

Same as `onValueChange` but with an applied debouncing effect.

## Ref methods

### `.setValue()`

```jsx
setValue: (value: string | Tokens[]) => void;
```

Sets the value of the input.

- `value: string | Tokens[]` - the value to set the input. If it’s a valid rich text string, the corresponding styling will be applied.

### `.setSelection()`

```jsx
setSelection: (start: number, end: number) => void;
```

Sets the selection of the input.

- `start: number` - the start index of the input’s selection.
- `end: number` - the end index of the input’s selection.

### `.focus()`

```jsx
focus: () => void;
```

Focuses the input;

### `.blur()`

```jsx
blur: () => void;
```

Blurs the input.

### `.toggleStyle()`

```jsx
toggleStyle: (style: string) => void;
```

Toggles a style at the cursor’s position.

- `style: string` - the name of a pattern to toggle.

### `.getActiveStyle()`

```jsx
getActiveStyle: () => string[] | [];
```

Returns the active styles for the current selection.

### `.getRawValue()`

```jsx
getRawValue: () => string;
```

Returns the input’s value as a raw string without rich text enclosures.

### `.getRichTextValue()`

```jsx
getRichTextValue: () => string;
```

Returns the text input’s value as a rich text string matching the patterns for each style defined in the patterns prop. If a style does not define an opening and closing char, it is ignored.

### `.getTokenizedValue()`

```jsx
getTokenizedValue: () => Tokens[];
```

Returns the text input's value as an array of tokens.