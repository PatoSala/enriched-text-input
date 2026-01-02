# enriched-text-input

> [!Note]
This library is still a work in progress. Expect breaking changes.
> 

Proof of concept for a JavaScript only rich-text TextInput component for React Native. The main idea is to render `<Text>` views as children of `<TextInput>`. It will only support text styling since it's not possible to render images inside `Text` views in React Native. [Try it on Expo Snack](https://snack.expo.dev/@patosala/enriched-text-input).

## Motivation

The field for rich-text in react native is still a bit green. Current libraries that add support for rich-text in react native applications are either WebViews wrapping libraries for the web, limiting customization, or require native code which drops support for Expo Go and react-native-web.

In theory, by only using JavaScript we are able to provide better cross-platform compatibility and the possibility to style elements however you want as long as they follow react-native's `Text` supported styles.

## Installation

```bash
npm install enriched-text-input
```

## Usage

```jsx
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { EnrichedTextInput, Toolbar } from 'enriched-text-input';

export default function App() {
  const richTextInputRef = useRef(null);

  return (
    <View style={styles.container}>
      <EnrichedTextInput ref={richTextInputRef}/>
      <Toolbar richTextInputRef={richTextInputRef}>
        <Toolbar.Bold />
        <Toolbar.Italic />
        <Toolbar.Underline />
        <Toolbar.Strikethrough />
        <Toolbar.Code />
        <Toolbar.Keyboard />
      </Toolbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 120
  },
});
```

## Current state

At the moment [1/1/2026] `enriched-text-input` works great for things such as small rich-text inputs (Eg. an input for a messaging app with rich-text support) but not for creating whole rich-text editors. This is because inline styles that do not break line are working as expected (Eg. bold, italic or underline work great but styles such as headings break line so they are currently not supported).

Live parsing of rich text symbols (such as wrapping words in asterisks `*`) is still a work in progress an not working correctly but you can toggle styles through the ref api of the `EnrichedTextInput` (or use the provided `Toolbar`component as shown in the example usage).

## Features

- [x]  Inline markdown styles (**bold**, *italic*, underline, ~~strikethrough~~ and `inline code`).
- [ ]  Paragraph styles (headings, lists, quotes, etc).
- [ ]  Live rich-text parsing.
- [ ]  Links and mentions.
- [x]  Custom inline styles.
- [x]  Custom methods and event handlers (setValue, onStartMention, onStyleChange, etc).

## API Reference

[API Reference](https://github.com/PatoSala/enriched-text-input/blob/main/API_REFERENCE.md)

## Style patterns

Style patterns are the styles that you provide the input with for it to know how it should display certain portions of the text. You can check their structure in the [API reference](https://github.com/PatoSala/enriched-text-input/blob/main/API_REFERENCE.md#stylePatterns). 

By default `enriched-text-input` uses a set of markdown styles (such as **bold**, *italic*, underline, ~~strikethrough~~ and `inline code`) for you to use out of the box, but you can provide your own custom styles through the `stylePatterns` prop. Keep in mind that when using this prop `enriched-text-input` will ignore any default style patterns so that only the ones you provided will be valid.

If you want you can provide `enriched-text-input` with both default style patterns and any additional style patterns you define:

```bash
import { EnrichedTextInput, markdownStyles } from "enriched-text-input";

const customStyles = [
	{
		name: "comment",
		opening: null,
		closing: null,
		render: Comment
	}
];

<EnrichedTextInput
	stylePattrns={[...markdownStyles, ...customStyles]}
/>
```

## Applying styles

To apply styles you can either toggle them using the `ref` method `.toggleStyle()` which accepts as a parameter the name of a style pattern, or you can use rich-text enclosures while typing. This enclosures are defined within the `stylePatterns` prop and corresponding styles will get applied when a matching pattern is found inside the input. 

## Known limitations

- Inline images.
- Only `Text` component styles are supported.

## Contributing

[Contributing guide](https://github.com/PatoSala/enriched-text-input/blob/main/CONTRIBUTING.md)