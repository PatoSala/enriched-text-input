import { useRef, useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Text, Button, TextInput } from 'react-native';
import { EnrichedTextInput, Toolbar, markdownStyles } from 'enriched-text-input';
import * as Clipboard from 'expo-clipboard';

export default function App() {
  const [rawValue, setRawValue] = useState("");
  const [richTextStringValue, setRichTextStringValue] = useState("");
  const [activeStyles, setActiveStyles] = useState([]);
  console.log("ACTIVE STYLES:", activeStyles);
  const richTextInputRef = useRef(null);

  const handleGetRichText = () => {
    const richText = richTextInputRef.current?.getRichTextValue();

    setRichTextStringValue(richText);
  }

  const handleCopyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={{ flex: 1 }}>
        <TextInput
          multiline
          style={{ fontSize: 20, padding: 16 }}
          value={rawValue}
          onChangeText={(text) => setRawValue(text)}
          placeholder='Raw text'
        />
        <Button
          title='Set rich text string'
          onPress={() => richTextInputRef.current?.setValue(rawValue)}
        />

        <EnrichedTextInput
          ref={richTextInputRef}
          placeholder="Rich text"
          onValueChange={() => console.log("VALUE CHANGE", richTextInputRef.current?.getRichTextValue())}
          multiline={true}
        />
        <Button
          title='Get rich text string'
          onPress={handleGetRichText}
        />
        <Text style={{ padding: 16, fontSize: 20, color: richTextStringValue ? "black" : "#b3b3b3" }}>{richTextStringValue ? richTextStringValue : "Get rich text output will appear here!"}</Text>

        <View style={{ flexDirection: "row", justifyContent: "center"}}>
          <Button
            title='Clear'
            onPress={() => setRichTextStringValue("")}
          />
          <Button
            title='Copy'
            onPress={() => handleCopyToClipboard(richTextStringValue)}
          />
        </View>
      </View>
      <View style={{ alignSelf: "end"}}>
        <Toolbar richTextInputRef={richTextInputRef}>
          <Toolbar.Bold/>
          <Toolbar.Italic />
          <Toolbar.Underline />
          <Toolbar.Strikethrough />
          <Toolbar.Code />
          {/* <TouchableOpacity style={styles.toolbarButton} onPress={handleComment}>
            <FontAwesome6 name="comment-alt" size={16} color="black" />
          </TouchableOpacity> */}
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
