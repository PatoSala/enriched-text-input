import { useState, useImperativeHandle, useRef, useEffect } from "react";
import { TextInput, Text, StyleSheet, View, Linking } from "react-native";

const exampleText = "Hello *bold* _italic_ lineThrough *underline* world!";

interface Token {
    type: string;
    text: string;
}

interface Diff {
    start: number;
    removed: string;
    added: string;
}
                        
const PATTERNS = [
  { marker: "*", style: "bold" },
  { marker: "_", style: "italic" },
  { marker: "~", style: "strike" },
];

function insertAt(str, index, substring) {
  // Clamp index into valid boundaries
  const i = Math.max(0, Math.min(index, str.length));
  return str.slice(0, i) + substring + str.slice(i);
}

function removeAt(str, index, strToRemove) {
  return str.slice(0, index) + str.slice(index + strToRemove.length);
}

function findMatch(str, marker) {
  const regex = new RegExp(`\\${marker}(.+?)\\${marker}`);
  const match = regex.exec(str);
  return match ? match[1] : null;
}

// Returns string modifications
function diffStrings(prev, next) : Diff {
  let start = 0;

  while (start < prev.length && start < next.length && prev[start] === next[start]) {
    start++;
  }

  let endPrev = prev.length - 1;
  let endNext = next.length - 1;

  while (endPrev >= start && endNext >= start && prev[endPrev] === next[endNext]) {
    endPrev--;
    endNext--;
  }

  return {
    start,
    removed: prev.slice(start, endPrev + 1),
    added: next.slice(start, endNext + 1),
  };
}

const updateTokens = (tokens: Token[], diff: Diff) => {
    let updatedTokens = [...tokens];
    let modifiedIndex = diff.start;
    const wholeString = tokens.reduce((acc, curr) => acc + curr.text, "");

    if (modifiedIndex >= wholeString.length) {
        if (diff.added.length > 0) {
            updatedTokens[updatedTokens.length - 1].text += diff.added;
            return {
                updatedTokens,
                plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
            };
        }

        if (diff.removed.length > 0) {
            const lastTokenIndex = updatedTokens.length - 1;
            updatedTokens[lastTokenIndex].text = updatedTokens[lastTokenIndex].text.slice(0, updatedTokens[lastTokenIndex].text.length - diff.removed.length);
            return {
                updatedTokens,
                plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
            };
        }
    }

    // First: find corresponding token
    for (const [index, token] of tokens.entries()) {
        // Find index to update
        if (modifiedIndex < token.text.length) {
            const tokenCopy = { ...token };

            if (diff.removed.length > 0) {
                tokenCopy.text = removeAt(token.text, modifiedIndex, diff.removed);
            }

            if (diff.added.length > 0) {
                tokenCopy.text = insertAt(token.text, modifiedIndex, diff.added);
            }

            if (tokenCopy.text.length === 0) {
                updatedTokens.splice(index, 1);
                return {
                    updatedTokens,
                    plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
                };
            }

            updatedTokens[index] = tokenCopy;
            break;
        }

        modifiedIndex -= token.text.length;
    }

    return {
        updatedTokens,
        plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
    };
}

export default function RichTextInputV2() {
    const inputRef = useRef<TextInput>(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [tokens, setTokens] = useState([
        {
            type: "text",
            text: "Rich text input "
        },
        {
            type: "bold",
            text: "bold"
        },
        {
            type: "italic",
            text: " world!"
        },
        {
            type: "text",
            text: " "
        }
    ]);
    console.log(tokens);
    const prevTextRef = useRef(tokens.map(t => t.text).join(""));

    const handleSelectionChange = ({ nativeEvent }) => {
        selectionRef.current = nativeEvent.selection;
    }

    const handleOnChangeText = (nextText: string) => {
        console.log("PREV TEXT: ", prevTextRef.current);
        console.log("NEXT TEXT: ", nextText);
        const diff = diffStrings(prevTextRef.current, nextText);
        console.log("DIFF", diff);
        const { updatedTokens, plain_text} = updateTokens(tokens, diff);
        setTokens([...updatedTokens]); 
        
        prevTextRef.current = plain_text;
    }

    return (
       <View style={{ position: "relative" }}>
            <TextInput
                multiline={true}
                ref={inputRef}
                style={styles.textInput}
                placeholder="Rich text input"
                onSelectionChange={handleSelectionChange}
                onChangeText={handleOnChangeText}
            >
                {tokens.map((token, i) => {
                    return (
                        <Text key={i} style={styles[token.type]}>{token.text}</Text>
                    )
                })}
            </TextInput>
       </View>
    );
}

const styles = StyleSheet.create({
    textInput: {
        fontSize: 20,
        width: "100%",
        paddingHorizontal: 16
    },
    text: {
        color: "black"
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: "italic"
    },
    lineThrough: {
        textDecorationLine: "line-through"
    },
    underline: {
        textDecorationLine: "underline",
    }
});