[![plastic](https://dcbadge.limes.pink/api/server/https://discord.gg/DRmNp34bFE?bot=true&style=plastic)](https://discord.gg/DRmNp34bFE)

# react-native-rich-text

Proof of concept for a JavaScript only rich TextInput component for React Native.
The main idea is to render `<Text>` views as children of `<TextInput>`.
It will only support text styling since it's not possible to render images inside `Text` views in React Native.

> [!NOTE]
> Works out of the box with Expo Go.

## Features


- [x] Basic text formatting (*bold*, _italic_, __underline__, ~~strikethrough~~).
- [ ] Rich text format parsing (WIP).
- [ ] Links and mentions.
- [ ] Custom styling.
- [ ] Exposed event handlers (onSubmit, onChange, onBlur, onFocus, etc).
- [ ] Custom methods and event handlers (setText, onStartMention, onStyleChange, etc)

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

## Future plans
- Custom styles support.
- Add support for rich text inline formatting (*, ~, #, etc).

## Known limitations
- Inline images.
