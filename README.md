[![plastic](https://dcbadge.limes.pink/api/server/https://discord.gg/DRmNp34bFE?bot=true&style=plastic)](https://discord.gg/DRmNp34bFE)

# enriched-text-input

> [!Note]
> This library is still a work in progress. Expect breaking changes.

Proof of concept for a JavaScript only rich-text TextInput component for React Native.
The main idea is to render `<Text>` views as children of `<TextInput>`.
It will only support text styling since it's not possible to render images inside `Text` views in React Native. [Try it on Expo Snack](https://snack.expo.dev/@patosala/enriched-text-input).

## Motivation
The field for rich-text in react native is still a bit green. Current libraries that add support for rich-text in react native applications are either WebViews wrapping libraries for the web, limiting customization, or require native code which drops support for Expo Go and react-native-web.

In theory, by only using JavaScript we are able to provide better cross-platform compatibility and the possibility to style elements however you want as long as they follow react-native's `Text` supported styles.

## Installation
```
npm install enriched-text-input
```

## Usage
```js
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { RichTextInput, Toolbar } from 'enriched-text-input';

export default function App() {
  const richTextInputRef = useRef(null);

  return (
    <View style={styles.container}>
      <RichTextInput ref={richTextInputRef}/>
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
At the moment [1/1/2026] `enriched-text-input` works great for things such as small rich-text inputs (Eg. an input for a messaging app with rich-text support) but not for creating whole rich-text editors. This is because inline styles that do not break line are working as expected (Eg. bold, italic or underline work great but styles such as headings break line so they are currently not supported).

Live parsing of rich text symbols (such as wrapping words in asterisks `*`) is still a work in progress an not working correctly but you can toggle styles through the ref api of the `EnrichedTextInput` (or use the provided `Toolbar` component as shown in the example usage).

## Features

- [x] Basic text formatting (__bold__, _italic_, underline, ~~strikethrough~~ and `inline code`).
- [ ] Rich text format parsing.
- [ ] Links and mentions.
- [x] Custom styling.
- [x] Custom rich text patterns.
- [ ] Exposed event handlers (onSubmit, onChange, onBlur, onFocus, etc).
- [ ] Custom methods and event handlers (setValue, onStartMention, onStyleChange, etc).
- [ ] Headings.

## Known limitations
- Inline images.
- Only `Text`component styles are supported.

## Contributing

### Clone this repo

1. Fork and clone your Github froked repo:
```
git clone https://github.com/<github_username>/react-native-rich-text.git
```

2. Go to cloned repo directory:
```
cd react-native-rich-text
```

### Install dependencies

1. Install the dependencies in the root of the repo:
```
npm install
```

3. After that you can start the project with:
```
npm start
```

## Create a pull request
After making any changes, open a pull request. Once you submit your pull request, it will get reviewed.
