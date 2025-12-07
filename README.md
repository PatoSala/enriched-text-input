[![plastic](https://dcbadge.limes.pink/api/server/https://discord.gg/DRmNp34bFE?bot=true&style=plastic)](https://discord.gg/DRmNp34bFE)

# enriched-text-input

> [!Note]
> This library it's still a work in progress.

Proof of concept for a JavaScript only rich-text TextInput component for React Native.
The main idea is to render `<Text>` views as children of `<TextInput>`.
It will only support text styling since it's not possible to render images inside `Text` views in React Native.

## Motivation
The field for rich-text in react native is still a bit green. Current libraries that add support for rich-text in react native applications are either WebViews wrapping libraries for the web, limiting customization, or require native code which drops support for Expo Go and react-native-web.

In theory, by only using JavaScript we are able to provide better cross-platform compatibility and the possibility to style however you want elements like links, mentions, bold, italic, unerline text and more.

## Features

- [x] Basic text formatting (*bold*, _italic_, __underline__, ~~strikethrough~~).
- [x] Rich text format parsing.
- [ ] Links and mentions.
- [ ] Custom styling.
- [ ] Custom rich text patterns.
- [ ] Exposed event handlers (onSubmit, onChange, onBlur, onFocus, etc).
- [ ] Custom methods and event handlers (setValue, onStartMention, onStyleChange, etc).
- [ ] Headings.

## Known limitations
- Inline images.

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
