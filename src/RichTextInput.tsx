import { useState, useImperativeHandle, useRef, useEffect } from "react";
import { TextInput, Text, StyleSheet, View, Linking } from "react-native";

interface Token {
    text: string;
    annotations: Annotations
}

interface Diff {
    start: number;
    removed: string;
    added: string;
}

interface Annotations {
    bold: boolean;
    italic: boolean;
    lineThrough: boolean;
    underline: boolean;
    code: boolean;
}

interface RichTextMatch {
    raw: string;
    content: string;
    start: number;
    end: number;
    expression: string;
}

interface RichTextInputProps {
    ref: any
}
                        
const PATTERNS = [
  { style: "bold", regex: "\\*([^*]+)\\*", render: <Text style={{ fontWeight: "bold" }} /> },
  { style: "italic", regex: "_([^_]+)_", render: <Text style={{ fontStyle: "italic" }} /> },
  { style: "lineThrough", regex: "~([^~]+)~", render: <Text style={{ textDecorationLine: "line-through" }} /> },
  { style: "code", regex: "`([^`]+)`", render: <Text style={{ fontFamily: "ui-monospace", backgroundColor: "lightgray", color: "red", paddingHorizontal: 6 }} /> },
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

function findMatch(str: string, regexExpression: string) : RichTextMatch | null {
  const regex = new RegExp(regexExpression);
  const match = regex.exec(str);
  return match
    ? {
        raw: match[0],
        content: match[1],
        start: match.index,
        end: match.index + match[0].length,
        expression: regexExpression
    }
    : null;
}

function getRequiredLiterals(regexString) {
  // Strip leading/trailing slashes and flags (if user passed /.../ form)
  regexString = regexString.replace(/^\/|\/[a-z]*$/g, "");

  // Remove ^ and $ anchors
  regexString = regexString.replace(/^\^|\$$/g, "");

  // 1. Find the first literal before any group or operator
  const beforeGroup = regexString.match(/^((?:\\.|[^[(])+)/);
  let openLiteral = null;

  if (beforeGroup) {
    const part = beforeGroup[1];
    const litMatch = part.match(/\\(.)|([^\\])/); // first literal
    if (litMatch) {
      openLiteral = litMatch[1] ?? litMatch[2];
    }
  }

  // 2. Detect a closing literal after a capturing group (optional)
  let closeLiteral = null;
  const afterGroup = regexString.match(/\)([^).]+)/);
  if (afterGroup) {
    const part = afterGroup[1];
    const litMatch = part.match(/\\(.)|([^\\])/);
    if (litMatch) {
      closeLiteral = litMatch[1] ?? litMatch[2];
    }
  }

  // Return both if available, otherwise just the opening literal
  return {
    opening: openLiteral,
    closing: closeLiteral,
  };
}

function concileAnnotations(prevAnnotations, nextAnnotations) {
  return {
    bold: nextAnnotations.bold ? !prevAnnotations.bold : prevAnnotations.bold,
    italic: nextAnnotations.italic ? !prevAnnotations.italic : prevAnnotations.italic,
    lineThrough: nextAnnotations.lineThrough ? !prevAnnotations.lineThrough : prevAnnotations.lineThrough,
    underline: nextAnnotations.underline ? !prevAnnotations.underline : prevAnnotations.underline,
    code: nextAnnotations.code ? !prevAnnotations.code : prevAnnotations.code,
    /* color: nextAnnotations.color */
  };
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
const parseRichTextString = (richTextString: string, patterns: { regex: string, style: string }[], initalTokens = null) => {
    let tokens = initalTokens || [
        {
            text: richTextString,
            annotations: {
                bold: false,
                italic: false,
                lineThrough: false,
                underline: false,
                code: false
            }
        }
    ];
    let plain_text = tokens.reduce((acc, curr) => acc + curr.text, "");

    for (const pattern of patterns) {
        let match = findMatch(plain_text, pattern.regex);
        
        if (match) {
            const { result: splittedTokens } = splitTokens(
                tokens,
                match.start,
                match.end - 1,
                { [pattern.style]: true },
                getRequiredLiterals(match.expression).opening
            );
            tokens = splittedTokens;
            plain_text = splittedTokens.reduce((acc, curr) => acc + curr.text, "");
            
            const parsed = parseRichTextString(tokens, patterns, tokens);
            
            return {
                tokens: parsed.tokens,
                plain_text: parsed.plain_text
            }
        }
    }

    return {
        tokens: tokens.filter(token => token.text.length > 0),
        plain_text: plain_text
    }
}

// Returns a rich text string
const parseTokens = (tokens) => {
    
}

// Inserts a token at the given index
// Only when start === end
function insertToken(tokens: Token[], index: number, annotations: Annotations, text = "" ) {
    const updatedTokens = [...tokens];

    let plain_text = tokens.reduce((acc, curr) => acc + curr.text, "");

    // If cursor is at the end
    if (plain_text.length === index) {
        updatedTokens.push({
            text: text,
            annotations: concileAnnotations(updatedTokens[updatedTokens.length - 1].annotations, annotations)
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
        annotations: startToken.annotations
    }

    // Middle token is the selected text
    let middleToken = {
        text: text,
        annotations: concileAnnotations(startToken.annotations, annotations)
    }

    let lastToken = {
        text: startToken.text.slice(startIndex , startToken.text.length),
        annotations: startToken.annotations
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
    const plain_text = tokens.reduce((acc, curr) => acc + curr.text, "");

    // If we're at the end of the string
    if (diff.start >= plain_text.length) {
        if (diff.added.length > 0) {
            updatedTokens[updatedTokens.length - 1].text += diff.added;

            return {
                updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
            };
        }

        if (diff.removed.length > 0) {
            const lastTokenIndex = updatedTokens.length - 1;
            updatedTokens[lastTokenIndex].text = updatedTokens[lastTokenIndex].text.slice(0, updatedTokens[lastTokenIndex].text.length - diff.removed.length);
            
            return {
                updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
            };
        }
    }

    // Find token where start
    let startIndex = diff.start;
    let startToken;

    for (const token of updatedTokens) {
        if (startIndex < token.text.length) {
            startToken = token;
            break;
        }
        startIndex -= token.text.length;
    }
    // Find token where end
    // We need to add the length of the removed/added text to the start index to get the end index
    let endIndex = diff.removed.length > diff.added.length
        ? diff.start + diff.removed.length
        : diff.start + diff.added.length;
    let endToken;

    for (const token of updatedTokens) {
        if (endIndex <= token.text.length) {
            endToken = token;
            break;
        }
        endIndex -= token.text.length;
    }

    const startTokenIndex = updatedTokens.indexOf(startToken);
    const endTokenIndex = updatedTokens.indexOf(endToken);

    // Same token
    if (startTokenIndex === endTokenIndex) {
        const tokenCopy = { ...startToken };

        if (diff.removed.length > 0 && diff.added.length > 0) {
            tokenCopy.text = replaceAt(tokenCopy.text, startIndex, diff.added, diff.removed.length);
                updatedTokens[startTokenIndex] = tokenCopy;
                return {
                    updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                    // Plain text must be updated to prevent bad diffs
                    plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
                };
        }

        if (diff.removed.length > 0) {
            tokenCopy.text = removeAt(tokenCopy.text, startIndex, diff.removed);

            updatedTokens[startTokenIndex] = tokenCopy;
            return {
                updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
            };
        }

        if (diff.added.length > 0) {
            // Check if token index is > 0 and if startIndex === 0 (See RNRT-6)
            if (startTokenIndex > 0 && startIndex === 0) {
                updatedTokens[startTokenIndex - 1].text += diff.added;
                return {
                    updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                    plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
                };
            }

            tokenCopy.text = insertAt(tokenCopy.text, startIndex, diff.added);
            updatedTokens[startTokenIndex] = tokenCopy;
            return {
                updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
            };
        }
    }

    // Cross-token
    if (startTokenIndex !== endTokenIndex) {
        const selectedTokens = updatedTokens.slice(startTokenIndex, endTokenIndex + 1);
        
        if (diff.added.length > 0) {
            const firstToken = selectedTokens[0];
            const lastToken = selectedTokens[selectedTokens.length - 1];

            firstToken.text = firstToken.text.slice(0, startIndex) + diff.added;
            lastToken.text = lastToken.text.slice(endIndex);
            updatedTokens[startTokenIndex] = firstToken;
            updatedTokens[endTokenIndex] = lastToken;

            if (selectedTokens.length > 2) {
                updatedTokens.splice(startTokenIndex + 1, selectedTokens.length - 2);
                return {
                    updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                    plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
                }
            }

            return {
                updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
            }
        }

        /**
         * Remove:
         * - For more than two tokens, works.
         * - For two tokens, does not work properly.
         */
        if (diff.removed.length > 0) {
            const firstToken = selectedTokens[0];
            const lastToken = selectedTokens[selectedTokens.length - 1];

            firstToken.text = firstToken.text.slice(0, startIndex);
            lastToken.text = lastToken.text.slice(endIndex);
            updatedTokens[startTokenIndex] = firstToken;
            updatedTokens[endTokenIndex] = lastToken;
            
            // If more than two tokens, whe need to remove the ones in between
            if (selectedTokens.length > 2) {
                updatedTokens.splice(startTokenIndex + 1, selectedTokens.length - 2);
                return {
                    updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                    plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
                }
            }

            return {
                updatedTokens: updatedTokens.filter(token => token.text.length > 0),
                plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, ""),
            }
        }

        return {
            updatedTokens: updatedTokens.filter(token => token.text.length > 0),
            plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, "")
        };
    }
}

// Updates annotations and splits tokens if necessary
// Only when start !== end
// To-do: Add support for multiple annotations
const splitTokens = (
    tokens: Token[],
    start: number,
    end: number,
    annotations: Annotations,
    /** Used to strip opening and closing chars of rich text matches. */
    withReplacement?: string
) => {
    let updatedTokens = [...tokens];

    // Find token where start
    let startIndex = start;
    let startToken;

    for (const token of updatedTokens) {
        if (startIndex < token.text.length) {
            startToken = token;
            break;
        }
        startIndex -= token.text.length;
    }
    // Find token where end
    let endIndex = end;
    let endToken;
    for (const token of updatedTokens) {
        // The - 1 is necessary
        if (endIndex <= token.text.length) {
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
            annotations: startToken.annotations
        }

        // Middle token is the selected text
        let middleToken = {
            // The replace method is used to remove the opening and closing rich text literal chars when parsing.
            text: startToken.text.slice(startIndex, endIndex).replace(withReplacement, ""),
            annotations: concileAnnotations(startToken.annotations, annotations)
        }

        let lastToken = {
            // The replace method is used to remove the opening and closing rich text literal chars when parsing.
            text: startToken.text.slice(endIndex , startToken.text.length).replace(withReplacement, ""),
            annotations: startToken.annotations
        }

        updatedTokens.splice(startTokenIndex, 1, firstToken, middleToken, lastToken)
        return { result: updatedTokens.filter(token => token.text.length > 0) };
    }

    // Cross-token selection
    if (startTokenIndex !== endTokenIndex) {
        // Before splitting, check if all selected tokens already have the annotation
        const selectedTokens = updatedTokens.slice(startTokenIndex, endTokenIndex + 1);

        const type = Object.keys(annotations)[0]; // When splitting we only pass one key to annotations param.
        const allSelectedTokensHaveAnnotation = selectedTokens.every((token) => token.annotations[type] === true);

        let firstToken = {
            text: startToken.text.slice(0, startIndex),
            annotations: {
                ...startToken.annotations,
                [type]: startToken.annotations[type]
            }
        }

        let secondToken = {
            // The replace method is used to remove the opening and closing rich text literal chars when parsing.
            text: startToken.text.slice(startIndex, startToken.text.length).replace(withReplacement, ""),
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
            // The replace method is used to remove the opening and closing rich text literal chars when parsing.
            text: endToken.text.slice(endIndex, endToken.text.length).replace(withReplacement, ""),
            annotations: {
                ...endToken.annotations,
                [type]: endToken.annotations[type]
            }
        }

        updatedTokens = updatedTokens.slice(0, startTokenIndex).concat([firstToken, secondToken, ...updatedMiddleTokens, secondToLastToken, lastToken]).concat(updatedTokens.slice(endTokenIndex + 1));
        return { result: updatedTokens.filter(token => token.text.length > 0) };
    }
}

// Concats tokens containing similar annotations
const concatTokens = (tokens: Token[]) => {
    let concatenedTokens = [];

    for (const [index, token] of tokens.entries()) {
        if (index === 0) {
            concatenedTokens.push(token);
            continue;
        }

        const prevToken = concatenedTokens[concatenedTokens.length - 1];

        if (prevToken.annotations.bold === token.annotations.bold &&
            prevToken.annotations.italic === token.annotations.italic &&
            prevToken.annotations.lineThrough === token.annotations.lineThrough &&
            prevToken.annotations.underline === token.annotations.underline &&
            prevToken.annotations.code === token.annotations.code) {
            prevToken.text += token.text;
            continue;
        }

        concatenedTokens.push(token);
    }

    return concatenedTokens;
}

function Token({ token }) {
    const { text, annotations } = token;
    const wrappers = [];

    if (annotations.bold) wrappers.push(Bold);
    if (annotations.italic) wrappers.push(Italic);
    if (annotations.underline && annotations.lineThrough) wrappers.push(UnderlineStrikethrough);
    if (annotations.underline) wrappers.push(Underline);
    if (annotations.lineThrough) wrappers.push(Strikethrough);
    if (annotations.code) wrappers.push(Code);

    return wrappers.reduce(
        (children, Wrapper) => <Wrapper>{children}</Wrapper>,
        text
    );
}

function Code({ children }) {
    return (
        <Text style={styles.code}>{children}</Text>
    )
}

function Bold({ children }) {
    return (
        <Text style={styles.bold}>{children}</Text>
    )
}

function Italic({ children }) {
    return (
        <Text style={styles.italic}>{children}</Text>
    )
}

function Underline({ children }) {
    return (
        <Text style={styles.underline}>{children}</Text>
    )
}

function Strikethrough({ children }) {
    return (
        <Text style={styles.lineThrough}>{children}</Text>
    )
}

function UnderlineStrikethrough({ children }) {
    return (
        <Text style={styles.underlineLineThrough}>{children}</Text>
    )
}

export default function RichTextInput(props: RichTextInputProps) {
    const {
        ref
    } = props;

    const inputRef = useRef<TextInput>(null);
    const selectionRef = useRef({ start: 0, end: 0 });
    const [tokens, setTokens] = useState([{
        text: "",
        annotations: {
            bold: false,
            italic: false,
            lineThrough: false,
            underline: false,
            code: false
        }
    }]);
    console.log(tokens);
    useEffect(() => {
        if (tokens.length === 0) {
            setTokens([{
                text: "",
                annotations: {
                    bold: false,
                    italic: false,
                    lineThrough: false,
                    underline: false,
                    code: false
                }
            }])
        }
    }, [tokens]);

    /**
     * Prev text should not contain matching rich text formats.
     * Those should be spliced once the corresponding tokens are created.
     */
    const prevTextRef = useRef(tokens.map(t => t.text).join(""));

    // Find a better name
    // To-do: Allow for multiple styles at once.
    const [toSplit, setToSplit] = useState({
        start: 0,
        end: 0,
        annotations: {
            bold: false,
            italic: false,
            lineThrough: false,
            underline: false,
            code: false
        }
    });

    const handleSelectionChange = ({ nativeEvent }) => {
        selectionRef.current = nativeEvent.selection;
    }

    const handleOnChangeText = (nextText: string) => {
        const diff = diffStrings(prevTextRef.current, nextText);

        let match : RichTextMatch | null = null;

        for (const pattern of PATTERNS) {
            match = findMatch(nextText, pattern.regex);
            if (match) break;
        }

        if (match) {
            // Check token containing match
            // If token already haves this annotation, do not format and perform a simple updateToken.
            const annotation = PATTERNS.find(p => p.regex === match.expression);
            const { result } = splitTokens(
                tokens,
                match.start,
                match.end - 1,
                { [annotation.style]: true },
                // Get the rich text opening char to replace it
                getRequiredLiterals(match.expression).opening
            );
            const plain_text = result.reduce((acc, curr) => acc + curr.text, "");

            setTokens([...concatTokens(result)]);
            prevTextRef.current = plain_text;

            return;
        }

        if (diff.start === toSplit.start
            && diff.start === toSplit.end
            && diff.added.length > 0
            && Object.values(toSplit.annotations).includes(true)) {
            const { result } = insertToken(
                tokens,
                diff.start,
                toSplit.annotations,
                /* toSplit.annotations.code ? ` ${diff.added} ` :  */diff.added
            );
            const plain_text = result.map(t => t.text).join("");
            setTokens([...concatTokens(result)]);

            // Reset
            setToSplit({
                start: 0,
                end: 0,
                annotations: {
                    bold: false,
                    italic: false,
                    lineThrough: false,
                    underline: false,
                    code: false
                }
            });
            prevTextRef.current = plain_text;
            return;
        }

        const { updatedTokens, plain_text} = updateTokens(tokens, diff);
        
        setTokens([...concatTokens(updatedTokens)]); 
        prevTextRef.current = plain_text;
    }

    useImperativeHandle(ref, () => ({

        setValue(value: string) {
            // To keep styles, parsing should be done before setting value
            const { tokens, plain_text } = parseRichTextString(value, PATTERNS);
            setTokens([...concatTokens(tokens)]);
            prevTextRef.current = plain_text;
        },
        toggleBold() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.annotations.bold) {
                setToSplit({
                    start: 0,
                    end: 0,
                    annotations: {
                        ...toSplit.annotations,
                        bold: false
                    }
                });
                return;
            }

            if (start === end) {
                setToSplit({
                    start,
                    end,
                    annotations: {
                        ...toSplit.annotations,
                        bold: true
                    }
                });
                return;
            }

            /**
             * This prevents that when a portion of text is set to bold, the next text inserted after it is not bold.
             */
            if (start < end) {
                setToSplit({
                    start: end,
                    end: end,
                    annotations: {
                        ...toSplit.annotations,
                        bold: true
                    }
                })
            }

            const { result } = splitTokens(tokens, start, end, { bold: true });
            setTokens([...concatTokens(result)]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        toggleItalic() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.annotations.italic ) {
                setToSplit({
                    start: 0,
                    end: 0,
                    annotations: {
                        ...toSplit.annotations,
                        italic: false
                    }
                });
                return;
            }

            if (start === end) {
                setToSplit({
                    start,
                    end,
                    annotations: {
                        ...toSplit.annotations,
                        italic: true
                    }
                });
                return;
            }

            if (start < end) {
                setToSplit({
                    start: end,
                    end: end,
                    annotations: {
                        ...toSplit.annotations,
                        italic: true
                    }
                });
            }

            const { result } = splitTokens(tokens, start, end, { italic: true });
            setTokens([...concatTokens(result)]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        toggleLineThrough() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.annotations.lineThrough) {
                setToSplit({
                    start: 0,
                    end: 0,
                    annotations: {
                        ...toSplit.annotations,
                        lineThrough: false
                    }
                });
                return;
            }

            if (start === end) {
                setToSplit({
                    start,
                    end,
                    annotations: {
                        ...toSplit.annotations,
                        lineThrough: true
                    }
                });
                return;
            }

            if (start < end) {
                setToSplit({
                    start: end,
                    end: end,
                    annotations: {
                        ...toSplit.annotations,
                        lineThrough: true
                    }
                })
            }

            const { result } = splitTokens(tokens, start, end, { lineThrough: true });
            setTokens([...concatTokens(result)]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        toggleUnderline() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.annotations.underline) {
                setToSplit({
                    start: 0,
                    end: 0,
                    annotations: {
                        ...toSplit.annotations,
                        underline: false
                    }
                });
                return;
            }

            if (start === end) {
                setToSplit({
                    start,
                    end,
                    annotations: {
                        ...toSplit.annotations,
                        underline: true
                    }
                });
                return;
            }

            if (start < end) {
                setToSplit({
                    start: end,
                    end: end,
                    annotations: {
                        ...toSplit.annotations,
                        underline: true
                    }
                })
            }

            const { result } = splitTokens(tokens, start, end, { underline: true });
            setTokens([...concatTokens(result)]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        },
        toggleCode() {
            const { start, end } = selectionRef.current;

            if (start === end && toSplit.annotations.code ) {
                setToSplit({
                    start: 0,
                    end: 0,
                    annotations: {
                        ...toSplit.annotations,
                        code: false
                    }
                });
                return;
            }

            if (start === end) {
                setToSplit({
                    start,
                    end,
                    annotations: {
                        ...toSplit.annotations,
                        code: true
                    }
                });
                return;
            }

            if (start < end) {
                setToSplit({
                    start: end,
                    end: end,
                    annotations: {
                        ...toSplit.annotations,
                        code: true
                    }
                });
            }

            const { result } = splitTokens(tokens, start, end, { code: true });
            setTokens([...concatTokens(result)]);
            requestAnimationFrame(() => inputRef.current.setSelection(start, end));
        }
    }));

    return (
       <View style={{ position: "relative" }}>
            <TextInput
                multiline={true}
                ref={inputRef}
                autoComplete="off"
                style={styles.textInput}
                placeholder="Rich text input"
                onSelectionChange={handleSelectionChange}
                onChangeText={handleOnChangeText}
            >
                <Text style={styles.text}>
                    {tokens.map((token, i) => <Token key={i} token={token} />)}
                </Text>
            </TextInput>
       </View>
    );
}

const styles = StyleSheet.create({
    textInput: {
        width: "100%",
        paddingHorizontal: 16,
        fontSize: 20,

    },
    text: {
        color: "black",
        position: "relative"
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
    underlineLineThrough: {
        textDecorationLine: "underline line-through"
    },
    codeContainer: {
        backgroundColor: "lightgray",
        paddingHorizontal: 4,
        borderRadius: 4,
        height: 24,
        position: "absolute",
        top: 10
    },
    code: {
        fontFamily: "ui-monospace",
        color: "red",
        fontSize: 20,
        backgroundColor: "lightgray",
    },
    highlight: {
        width: "100%",
        position: "absolute",
        padding: 20,
        height: 24,
        backgroundColor: "blue"
    }
});