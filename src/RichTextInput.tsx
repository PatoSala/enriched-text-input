import { useState, useImperativeHandle, useRef, useEffect } from "react";
import { TextInput, Text, StyleSheet, View, Linking } from "react-native";

const exampleText = "Hello *bold* _italic_ lineThrough *underline* world!";
const exampleTokens = [
    {
        text: "Rich text input ",
        annotations: {
            bold: false,
            italic: false,
            lineThrough: false,
            underline: false,
            color: "black"
        }
    },
    {
        text: "bold",
        annotations: {
            bold: true,
            italic: false,
            lineThrough: false,
            underline: false,
            color: "black"
        }
    },
    {
        text: " world!",
        annotations: {
            bold: false,
            italic: true,
            lineThrough: false,
            underline: false,
            color: "black"
        }
    },
    {
        text: " ",
        annotations: {
            bold: false,
            italic: false,
            lineThrough: false,
            underline: false,
            color: "black"
        }
    }
];

interface Token {
    text: string;
    annotations: {
        bold: boolean;
        italic: boolean;
        lineThrough: boolean;
        underline: boolean;
        color: string;
    }
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

function replaceAt(str, index, substring, length) {
  // Clamp index into valid boundaries
  const i = Math.max(0, Math.min(index, str.length));
  return str.slice(0, i) + substring + str.slice(i + length);
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

// Parses rich text into tokens
const parseTokens = (text: string) => {
    const tokens = [];
}
// Updates token content (add, remove, replace)
// Note: need to support cross-token updates.
const updateTokens = (tokens: Token[], diff: Diff) => {
    let updatedTokens = [...tokens];
    let modifiedIndex = diff.start;
    const wholeString = tokens.reduce((acc, curr) => acc + curr.text, "");

    // If we're at the end of the string
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

            // Handle case where both add and remove are present?
            if (diff.removed.length > 0 && diff.added.length > 0) {
                tokenCopy.text = replaceAt(token.text, modifiedIndex, diff.added, diff.removed.length);
                updatedTokens[index] = tokenCopy;
                break;
            }

            // Remove if theres something to remove
            if (diff.removed.length > 0) {
                tokenCopy.text = removeAt(token.text, modifiedIndex, diff.removed);
            }

            // Add if theres something to add
            if (diff.added.length > 0) {
                tokenCopy.text = insertAt(token.text, modifiedIndex, diff.added);
            }

            // If token is now empty, remove it
            if (tokenCopy.text.length === 0) {
                updatedTokens.splice(index, 1);
                break;
            }


            updatedTokens[index] = tokenCopy;
            break;
        }

        modifiedIndex -= token.text.length;
    }

    return {
        updatedTokens,
        // Plain text must be updated to prevent bad diffs
        plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
    };
}

const splitTokens = (tokens, start, end, type ) => {
    let updatedTokens = [...tokens];

    // Find token where start
    let startIndex = start;
    let startToken;

    for (const [index, token] of updatedTokens.entries()) {
        if (startIndex < token.text.length) {
            startToken = token;
            break;
        }
        startIndex -= token.text.length;
    }
    // Find token where end
    let endIndex = end;
    let endToken;
    for (const [index, token] of updatedTokens.entries()) {
        if (endIndex < token.text.length) {
            endToken = token;
            break;
        }
        endIndex -= token.text.length;
    }

    // If same token, split
    if (updatedTokens.indexOf(startToken) === updatedTokens.indexOf(endToken)) {
        let firstToken = {
            text: startToken.text.slice(0, startIndex),
            annotations: {
                ...startToken.annotations,
                [type]: false
            }
        }

        let middleToken = {
            text: startToken.text.slice(startIndex, endIndex),
            annotations: {
                ...startToken.annotations,
                [type]: true
            }
        }

        let lastToken = {
            text: startToken.text.slice(endIndex, startToken.text.length),
            annotations: {
                ...startToken.annotations,
                [type]: false
            }
        }

        updatedTokens.splice(updatedTokens.indexOf(startToken), 1, firstToken, middleToken, lastToken);
    }

    // Cross-token selection
    if (updatedTokens.indexOf(startToken) !== updatedTokens.indexOf(endToken)) {
        let firstToken = {
            text: startToken.text.slice(0, startIndex),
            annotations: {
                ...startToken.annotations,
                [type]: false
            }
        }

        let secondToken = {
            text: startToken.text.slice(startIndex, startToken.text.length),
            annotations: {
                ...startToken.annotations,
                [type]: true
            }
        }

        const middleTokens = updatedTokens.slice(updatedTokens.indexOf(startToken) + 1, updatedTokens.indexOf(endToken));
        let updatedMiddleTokens = [...middleTokens];

        for (const [index, token] of middleTokens.entries()) {
            updatedMiddleTokens[index] = {
                text: token.text,
                annotations: {
                    ...token.annotations,
                    [type]: true
                }
            }
        }

        let secondToLastToken = {
            text: endToken.text.slice(0, endIndex),
            annotations: {
                ...endToken.annotations,
                [type]: true
            }
        }

        let lastToken = {
            text: endToken.text.slice(endIndex, endToken.text.length),
            annotations: {
                ...endToken.annotations,
                [type]: false
            }
        }

        updatedTokens = updatedTokens.slice(0, updatedTokens.indexOf(startToken)).concat([firstToken, secondToken, ...updatedMiddleTokens, secondToLastToken, lastToken]).concat(updatedTokens.slice(updatedTokens.indexOf(endToken) + 1));
    }

    return {
        result: updatedTokens
    }
}

export default function RichTextInput({ ref }) {
    const inputRef = useRef<TextInput>(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [tokens, setTokens] = useState(exampleTokens);

    const prevTextRef = useRef(tokens.map(t => t.text).join(""));

    const handleSelectionChange = ({ nativeEvent }) => {
        selectionRef.current = nativeEvent.selection;
    }

    const handleOnChangeText = (nextText: string) => {
        const diff = diffStrings(prevTextRef.current, nextText);
        const { updatedTokens, plain_text} = updateTokens(tokens, diff);
        
        setTokens([...updatedTokens]); 
        
        prevTextRef.current = plain_text;
    }

    useImperativeHandle(ref, () => ({
        toggleBold() {
            const { start, end } = selectionRef.current;
            const { result } = splitTokens(tokens, start, end, "bold");
            setTokens([...result]);
            inputRef.current.setSelection(end, end);
        },
        toggleItalic() {
            const { start, end } = selectionRef.current;
            const { result } = splitTokens(tokens, start, end, "italic");
            setTokens([...result]);
            inputRef.current.setSelection(end, end);

        },
        toggleLineThrough() {
            const { start, end } = selectionRef.current;
            const { result } = splitTokens(tokens, start, end, "lineThrough");
            setTokens([...result]);
            inputRef.current.setSelection(end, end);
        },
        toggleUnderline() {
            const { start, end } = selectionRef.current;
            const { result } = splitTokens(tokens, start, end, "underline");
            setTokens([...result]);
            inputRef.current.setSelection(end, end);
        }
    }))

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
                        <Text key={i} style={[
                            styles.text,
                            ...Object.entries(token.annotations).map(([key, value]) => value ? styles[key] : null)
                        ]}>{token.text}</Text>
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