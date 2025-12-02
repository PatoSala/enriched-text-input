import { useState, useImperativeHandle, useRef, useEffect } from "react";
import { TextInput, Text, StyleSheet, View, Linking } from "react-native";

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

function removeAt(str, index, strToRemove) {
  return str.slice(0, index) + str.slice(index + strToRemove.length);
}

function replaceAt(str, index, substring, length) {
  // Clamp index into valid boundaries
  const i = Math.max(0, Math.min(index, str.length));
  return str.slice(0, i) + substring + str.slice(i + length);
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

// Returns an array of tokens
const parseString = (text: string) => {
    
}

// Returns a rich text string
const parseTokens = (tokens) => {
    
}

// Inserts a token at the given index
// Only when start === end
function insertToken(tokens, index, type, text="" ) {
    const updatedTokens = [...tokens];

    let plain_text = tokens.reduce((acc, curr) => acc + curr.text, "");

    // If cursor is at the end
    if (plain_text.length === index) {
        updatedTokens.push({
            text: text,
            annotations: {
                ...updatedTokens[updatedTokens.length - 1].annotations,
                [type]: !updatedTokens[updatedTokens.length - 1].annotations[type]
            }
        });

        return { result: updatedTokens.filter(token => token.text.length > 0) };
    }

    let startIndex = index;
    let startToken;

    for (const token of updatedTokens) {
        if (startIndex <= token.text.length) {
            startToken = token;
            break;
        }
        startIndex -= token.text.length;
    }

    const startTokenIndex = updatedTokens.indexOf(startToken);

    let firstToken = {
        text: startToken.text.slice(0, startIndex),
        annotations: {
            ...startToken.annotations,
            [type]: startToken.annotations[type]
        }
    }

    // Middle token is the selected text
    let middleToken = {
        text: text,
        annotations: {
            ...startToken.annotations,
            [type]: !startToken.annotations[type]
        }
    }

    let lastToken = {
        text: startToken.text.slice(startIndex , startToken.text.length),
        annotations: {
            ...startToken.annotations,
            [type]: startToken.annotations[type]
        }
    }

    /**
     * Note: the following conditionals are to prevent empty tokens.
     * It would be ideal if instead of catching empty tokens we could write the correct insert logic to prevent them.
     * Maybe use a filter instead?
     */
    
    updatedTokens.splice(startTokenIndex, 1, firstToken, middleToken, lastToken);
    
    return {
        result: updatedTokens.filter(token => token.text.length > 0)
    };
}

// Updates token content (add, remove, replace)
// Note: need to support cross-token updates.
// It's actually updating just the text of tokens
const updateTokens = (tokens: Token[], diff: Diff) => {
    let updatedTokens = [...tokens];
    let modifiedIndex = diff.start;
    const plain_text = tokens.reduce((acc, curr) => acc + curr.text, "");

    // If we're at the end of the string
    if (modifiedIndex >= plain_text.length) {
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

        /**
         * If removing a character we need to check if character index is less than token length.
         * 
         */
       if (modifiedIndex < token.text.length && diff.removed.length > 0) {
            const tokenCopy = { ...token };

            /* if (diff.removed.length > 0 && diff.added.length > 0) {
                tokenCopy.text = replaceAt(token.text, modifiedIndex, diff.added, diff.removed.length);
                updatedTokens[index] = tokenCopy;
                break;
            } */

           tokenCopy.text = removeAt(token.text, modifiedIndex, diff.removed);

           if (tokenCopy.text.length === 0) {
                updatedTokens.splice(index, 1);
                break;
            }

            updatedTokens[index] = tokenCopy;
            break;
       }

        /**
         * When adding a character we check if char index is less or equal to token length
         * to handle situations where the last char of a token is removed.
         * Example:
         * Char index in token: 4
         * Token text's length: 4
         */
        if (modifiedIndex <= token.text.length && diff.removed.length === 0) {
            const tokenCopy = { ...token };

            // Handle case where both add and remove are present?
            /* if (diff.removed.length > 0 && diff.added.length > 0) {
                tokenCopy.text = replaceAt(token.text, modifiedIndex, diff.added, diff.removed.length);
                updatedTokens[index] = tokenCopy;
                break;
            } */

            // Add if theres something to add
            if (diff.added.length > 0) {
                tokenCopy.text = insertAt(token.text, modifiedIndex, diff.added);
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

// Updates annotations and splits tokens if necessary
// Only when start !== end
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
        // The - 1 is necessary
        if (endIndex - 1 < token.text.length) {
            endToken = token;
            break;
        }
        endIndex -= token.text.length;
    }

    const startTokenIndex = updatedTokens.indexOf(startToken);
    const endTokenIndex = updatedTokens.indexOf(endToken);

    // If same token, split
    if (startTokenIndex === endTokenIndex) {

        /* 
            Selection:      |---------|
            Tokens:     ["Rich text input "] ["bold"] ["world!"] [" "]

            Selection is within a token. We need to split that token to apply annotations:

            First token: ["Ri"]
            Middle token: ["ch text inp"] --> Annotations are applied here.
            Last token: ["ut "]

            Result: ["Ri"] ["ch text inp"] ["ut "] ["bold"] ["world!"] [" "]
        */
        
        let firstToken = {
            text: startToken.text.slice(0, startIndex),
            annotations: {
                ...startToken.annotations,
                [type]: startToken.annotations[type]
            }
        }

        // Middle token is the selected text
        let middleToken = {
            text: startToken.text.slice(startIndex, endIndex),
            annotations: {
                ...startToken.annotations,
                [type]: !startToken.annotations[type]
            }
        }

        let lastToken = {
            text: startToken.text.slice(endIndex , startToken.text.length),
            annotations: {
                ...startToken.annotations,
                [type]: startToken.annotations[type]
            }
        }

        // Note: the following conditionals are to prevent empty tokens.
        // It would be ideal if instead of catching empty tokens we could write the correct insert logic to prevent them.
        if (firstToken.text.length === 0 && lastToken.text.length === 0) {
            updatedTokens.splice(startTokenIndex, 1, middleToken);
            return { result: updatedTokens };
        }

        if (firstToken.text.length === 0) {
            updatedTokens.splice(startTokenIndex, 1, middleToken, lastToken);
            return { result: updatedTokens };
        }

        if (lastToken.text.length === 0) {
            updatedTokens.splice(startTokenIndex, 1, firstToken, middleToken);
            return { result: updatedTokens };
        }
        
        updatedTokens.splice(startTokenIndex, 1, firstToken, middleToken, lastToken);
        return { result: updatedTokens };
    }

    // Cross-token selection
    if (startTokenIndex !== endTokenIndex) {
        // Before splitting, check if all selected tokens already have the annotation
        const selectedTokens = updatedTokens.slice(startTokenIndex, endTokenIndex + 1);
        const allSelectedTokensHaveAnnotation = selectedTokens.every((token) => token.annotations[type] === true);

        let firstToken = {
            text: startToken.text.slice(0, startIndex),
            annotations: {
                ...startToken.annotations,
                [type]: startToken.annotations[type]
            }
        }

        let secondToken = {
            text: startToken.text.slice(startIndex, startToken.text.length),
            annotations: {
                ...startToken.annotations,
                [type]: allSelectedTokensHaveAnnotation ? false : true
            }
        }

        const middleTokens = updatedTokens.slice(startTokenIndex + 1, endTokenIndex);
        let updatedMiddleTokens = [...middleTokens];

        for (const [index, token] of middleTokens.entries()) {
            updatedMiddleTokens[index] = {
                text: token.text,
                annotations: {
                    ...token.annotations,
                    [type]: allSelectedTokensHaveAnnotation ? false : true
                }
            }
        }

        let secondToLastToken = {
            text: endToken.text.slice(0, endIndex),
            annotations: {
                ...endToken.annotations,
                [type]: allSelectedTokensHaveAnnotation ? false : true
            }
        }

        let lastToken = {
            text: endToken.text.slice(endIndex, endToken.text.length),
            annotations: {
                ...endToken.annotations,
                [type]: endToken.annotations[type]
            }
        }

        // Catch empty tokens. Empty tokens are always at the extremes.
        if (firstToken.text.length === 0 && lastToken.text.length === 0) {
            updatedTokens = updatedTokens.slice(0, startTokenIndex).concat([secondToken, ...updatedMiddleTokens, secondToLastToken]).concat(updatedTokens.slice(endTokenIndex + 1));
            return { result: updatedTokens };
        }

        if (firstToken.text.length === 0) {
            updatedTokens = updatedTokens.slice(0, startTokenIndex).concat([secondToken, ...updatedMiddleTokens, secondToLastToken, lastToken]).concat(updatedTokens.slice(endTokenIndex + 1));
            return { result: updatedTokens };
        }

        if (lastToken.text.length === 0) {
            updatedTokens = updatedTokens.slice(0, startTokenIndex).concat([firstToken, secondToken, ...updatedMiddleTokens, secondToLastToken]).concat(updatedTokens.slice(endTokenIndex + 1));
            return { result: updatedTokens };
        }

        updatedTokens = updatedTokens.slice(0, startTokenIndex).concat([firstToken, secondToken, ...updatedMiddleTokens, secondToLastToken, lastToken]).concat(updatedTokens.slice(endTokenIndex + 1));
        return { result: updatedTokens };
    }
}



export default function RichTextInput({ ref }) {
    const inputRef = useRef<TextInput>(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [tokens, setTokens] = useState([{
        text: "",
        annotations: {
            bold: false,
            italic: false,
            lineThrough: false,
            underline: false,
            color: "black",
            comment: false
        }
    }]);

    const prevTextRef = useRef(tokens.map(t => t.text).join(""));

    const [toSplit, setToSplit] = useState({
        start: 0,
        end: 0,
        type: null
    });

    const handleSelectionChange = ({ nativeEvent }) => {
        selectionRef.current = nativeEvent.selection;
    }

    const handleOnChangeText = (nextText: string) => {
        const diff = diffStrings(prevTextRef.current, nextText);

        if (diff.start === toSplit.start && diff.start === toSplit.end && diff.added.length > 0 && toSplit.type) {
            const { result } = insertToken(tokens, diff.start, toSplit.type, diff.added);
            const plain_text = result.map(t => t.text).join("");
            setTokens([...result]);
            setToSplit({ start: 0, end: 0, type: null });
            prevTextRef.current = plain_text;
            return;
        }

        const { updatedTokens, plain_text} = updateTokens(tokens, diff);
        
        setTokens([...updatedTokens]); 
        prevTextRef.current = plain_text;
    }

    useImperativeHandle(ref, () => ({
        toggleBold() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.type === "bold") {
                setToSplit({ start: 0, end: 0, type: null });
                return;
            }

            if (start === end) {
                setToSplit({ start, end, type: "bold" });
                return;
            }

            const { result } = splitTokens(tokens, start, end, "bold");
            setTokens([...result]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        toggleItalic() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.type === "italic") {
                setToSplit({ start: 0, end: 0, type: null });
                return;
            }

            if (start === end) {
                setToSplit({ start, end, type: "italic" });
                return;
            }

            const { result } = splitTokens(tokens, start, end, "italic");
            setTokens([...result]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        toggleLineThrough() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.type === "lineThrough") {
                setToSplit({ start: 0, end: 0, type: null });
                return;
            }

            if (start === end) {
                setToSplit({ start, end, type: "lineThrough" });
                return;
            }

            const { result } = splitTokens(tokens, start, end, "lineThrough");
            setTokens([...result]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        toggleUnderline() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.type === "underline") {
                setToSplit({ start: 0, end: 0, type: null });
                return;
            }

            if (start === end) {
                setToSplit({ start, end, type: "underline" });
                return;
            }

            const { result } = splitTokens(tokens, start, end, "underline");
            setTokens([...result]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        toggleComment() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.type === "comment") {
                setToSplit({ start: 0, end: 0, type: null });
                return;
            }

            if (start === end) {
                setToSplit({ start, end, type: "comment" });
                return;
            }

            const { result } = splitTokens(tokens, start, end, "comment");
            setTokens([...result]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        setValue(value: string) {
            // To keep styles, parsing should be done before setting value

        }
    }))

    return (
       <View style={{ position: "relative" }}>
            <TextInput
                multiline={true}
                ref={inputRef}
                autoCorrect={false}
                autoComplete="off"
                style={styles.textInput}
                placeholder="Rich text input"
                onSelectionChange={handleSelectionChange}
                onChangeText={handleOnChangeText}
            >
                {tokens.map((token, i) => {
                    return (
                        <Text key={i} style={[
                            styles.text,
                            ...Object.entries(token.annotations).map(([key, value]) => value ? styles[key] : null).filter(Boolean),
                            token.annotations.underline && token.annotations.lineThrough && styles.underlineLineThrough
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
    },
    comment: {
        textDecorationLine: "underline",
        textDecorationColor: "rgba(255, 203, 0, .35)",
        backgroundColor: "rgba(255, 203, 0, .12)"
    },
    underlineLineThrough: {
        textDecorationLine: "underline line-through"
    }
});