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
