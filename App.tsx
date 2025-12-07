import { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TextInput, View, Button } from 'react-native';

import Toolbar from './src/Toolbar';
import RichTextInput from './src/RichTextInput';

export default function App() {
  const richTextInputRef = useRef(null);

  return (
    <View style={styles.container}>
      <RichTextInput ref={richTextInputRef}/>
      <Toolbar richTextInputRef={richTextInputRef} />
      <StatusBar style="auto" />
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
