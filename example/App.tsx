import { useRef } from 'react';
import { StyleSheet, View, KeyboardAvoidingView } from 'react-native';

import { RichTextInput, Toolbar } from 'enriched-text-input';

export default function App() {
  const richTextInputRef = useRef(null);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={{ flex: 1 }}>
        <RichTextInput ref={richTextInputRef}/>
      </View>
      <View style={{ alignSelf: "end"}}>
        <Toolbar richTextInputRef={richTextInputRef}>
          <Toolbar.Heading/>
          <Toolbar.SubHeading/>
          <Toolbar.SubSubHeading/>
          <Toolbar.Bold />
          <Toolbar.Italic />
          <Toolbar.Underline />
          <Toolbar.Strikethrough />
          <Toolbar.Code />
          <Toolbar.Keyboard />
        </Toolbar>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 120
  },
});
