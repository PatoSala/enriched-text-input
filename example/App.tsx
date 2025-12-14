import { useRef } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Text, TouchableOpacity, Button } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { RichTextInput, Toolbar, PATTERNS } from 'enriched-text-input';

function Comment({ children }) {
  return (
    <Text style={{
      backgroundColor: "rgba(255, 203, 0, .12)",
      textDecorationLine: "underline",
      textDecorationColor: "rgba(255, 203, 0, .35)",
    }}>
      {children}
    </Text>
  )
}

export default function App() {
  const richTextInputRef = useRef(null);

  const customPatterns = [
    ...PATTERNS,
    { style: "comment", regex: null, render: Comment }
  ];

  const handleComment = () => {
    richTextInputRef.current?.toggleStyle("comment");
  }

  const handleGetRichText = () => {
    const richText = richTextInputRef.current?.getRichText();
    console.log(richText);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={{ flex: 1 }}>
        <RichTextInput
          ref={richTextInputRef}
          patterns={customPatterns}/>

          <Button
            title='Get rich text string'
            onPress={handleGetRichText}
            />
      </View>
      <View style={{ alignSelf: "end"}}>
        <Toolbar richTextInputRef={richTextInputRef}>
          <Toolbar.Bold />
          <Toolbar.Italic />
          <Toolbar.Underline />
          <Toolbar.Strikethrough />
          <Toolbar.Code />
          <TouchableOpacity style={styles.toolbarButton} onPress={handleComment}>
            <FontAwesome6 name="comment-alt" size={16} color="black" />
          </TouchableOpacity>

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
  toolbarButton: {
      height: 50,
      width: 50,
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
  }
});
