import { useState, useImperativeHandle, useRef, useEffect, JSX } from "react";
import { TextInput, Text, StyleSheet, View, TextInputProps } from "react-native";
import { markdownStyles } from "./markdownStyles";

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
    [key: string]: boolean | string | null
}

interface RichTextMatch {
    raw: string;
    content: string;
    start: number;
    end: number;
    pattern: Pattern;
    /** @deprecated */
    expression: string;
}

interface Pattern {
    regex: string;
    style: string;
    render: any;
    opening?: string;
    closing?: string;
}

interface EnrichedTextInputProps {
    ref: any;
    stylePatterns?: Pattern[];
    placeholder?: string;
    multiline?: boolean;
    defaultValue?: string | Token[];
    onValueChange?: () => void;
    onSelectionChange?: () => void;
}

/**
 * Note: maybe instead of using regex we could just define an "opening" and "closing" char.
 * If both are defined we look for a match that looks like {opening}{content}{closing}.
 * If just opening is defined, we look for a match that looks like {opening}{content}.
 * Closing can not be defined if opening is not defined.
 */
export const defaultStylePatterns : Pattern[] = markdownStyles;

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

function findTokens(
    /** The tokens to search over. */
    tokens: Token[],
    /** start position of selection.*/
    start: number,
    /** end position of selection.*/
    end?: number
) {
    
    if (end) {
        // To-do: search for all tokens between start and end
        return { result: null };
    }

    let startIndex = start;
    let startToken;
    for (const token of tokens) {
        if (startIndex <= token.text.length) {
            startToken = token;
            break;
        }
        startIndex -= token.text.length;
    }

    const startTokenIndex = tokens.indexOf(startToken);

    return { result: [startToken] };
}

/**
 * To-do: Add support for openings and closings that are conformed by two or more chars (e.g. **, __, <b>, etc.)
 */
function findMatchV2(str: string, patterns: Pattern[]) : RichTextMatch | null {
    let match = null;
    let copyOfString = str;

    for (const pattern of patterns) {
        let evenCount = 0;

        for (const char of copyOfString) {
            /** Cases where both opening and closing chars are defined (*...*, _..._, etc.)*/
            if (pattern.opening && pattern.closing) {
                if (evenCount < 2 && char === pattern.opening) {
                    evenCount++;
                }
                if (evenCount === 2 && char === pattern.closing) {
                    const openingIndex = copyOfString.indexOf(pattern.opening);
                    const closingIndex = copyOfString.indexOf(pattern.closing, openingIndex + 1);

                    match = {
                        raw: copyOfString.slice(openingIndex, closingIndex + 1),
                        content: copyOfString.slice(openingIndex + 1, closingIndex),
                        start: openingIndex,
                        end: closingIndex,
                        pattern,
                        /** @deprecated */
                        expression: pattern.regex
                    };
                    break;
                }
            }

            /** Cases where only opening char is defined (@, #, etc.) */
        }
    }

    return match;
}

/**
 * If prev token contains new annotation, negate prev. Else, use new annotation.
 * 
 * @example
 * prev: { bold: true }
 * new: { bold: false }
 * result: { bold: false }
 */
function concileAnnotations(prevAnnotations, newAnnotations) {
  let updatedAnnotations = { ...prevAnnotations };

  for (const key of Object.keys(newAnnotations)) {
    newAnnotations[key]
    ? updatedAnnotations[key] = !updatedAnnotations[key]
    : updatedAnnotations[key] = newAnnotations[key];
  }

  return updatedAnnotations;
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

/** 
 * [Needs refactoring]
 * Parse rich text string into tokens.
 */
const parseRichTextString = (richTextString: string, patterns: Pattern[], initialTokens?: Token[])
: { tokens: Token[], plain_text: string } => {
    let copyOfString = richTextString;
    let tokens : Token[] = initialTokens || [
        {
            text: copyOfString,
            annotations: {}
        }
    ];

    for (const pattern of patterns) {
        let evenCount = 0;

        for (const char of copyOfString) {
            /** Cases where both opening and closing chars are defined (*...*, _..._, etc.)*/
            if (pattern.opening && pattern.closing) {
                if (evenCount < 2 && char === pattern.opening) {
                    evenCount++;
                }
                if (evenCount === 2 && char === pattern.closing) {
                    const openingIndex = copyOfString.indexOf(pattern.opening);
                    const closingIndex = copyOfString.indexOf(pattern.closing, openingIndex + 1);

                    copyOfString = copyOfString.slice(0, openingIndex) + copyOfString.slice(closingIndex);
                    const { result, plain_text } = splitTokens(tokens, openingIndex, closingIndex, { [pattern.style]: true }, pattern.opening);
                    tokens = result;
                    copyOfString = plain_text;
                }
            }

            /** Cases where only opening char is defined (@, #, etc.) */
        }
    }

    return {
        tokens,
        plain_text: copyOfString
    };
}

/**
 * Parse tokens into rich text string.
 * To-do: Find a way to group consequitive tokens with a same annotation inside one single
 * wrapper.
 * 
 * @example
 * Tokens: [{ text: "Hello", annotations: { bold: true } }, { text: "World", annotations: { bold: true, italic: true } }]
 * Current output: *Hello* *_World_*
 * Desired output: *Hello _World_*
 */
const parseTokens = (tokens: Token[], patterns: Pattern[]) => {
    return tokens.map(token => {
        const { text, annotations } = token;
        // Rich text wrappers (opening and closing chars)
        const wrappers = [];

        patterns.forEach(pattern => {
            // If annotation has a truthy value, add the corresponding wrapper.
            if (annotations[pattern.style]) wrappers.push(pattern.opening);
        });

        return wrappers.reduce(
            (children, wrapper) => `${wrapper}${children}${wrapper}`,
            text
        );
    }).join("");
}

// Inserts a token at the given index
// Only when start === end
// To-do: Instead of recieving annotations and text it could recieve a token.
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
        annotations: concileAnnotations(startToken.annotations, annotations) // prevAnnotations + newAnnotations
    }

    let lastToken = {
        text: startToken.text.slice(startIndex , startToken.text.length),
        annotations: startToken.annotations
    }
    
    updatedTokens.splice(startTokenIndex, 1, firstToken, middleToken, lastToken);
    return {
        result: updatedTokens.filter(token => token.text.length > 0)
    };
}

/**
 * Updates token content (add, remove, replace)
 * It's actually updating just the text of tokens
 * To-do: Separate the logic of finding the corresponding token into another function.
 * Instead of recieving a diff it could recieve an array of tokens to update.
 */
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
         * (right now remove for more than two tokens works properly. Anyway, it might need better testing).
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

/**
 * Updates annotations and splits tokens if necessary. Only when start !== end.
 * To-do: Separate the logic of finding the corresponding token into another function.
 */
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
            /** 
             * We need to concile previous annotations with new ones.
             * Eg. If we are applying bold to middle token but start token already has bold, we need to toggle bold off.
             * But if we are applying bold to middle token but start token does not have bold, we need to toggle bold on.
             */
            annotations: concileAnnotations(startToken.annotations, annotations)
        }

        let lastToken = {
            // The replace method is used to remove the opening and closing rich text literal chars when parsing.
            text: startToken.text.slice(endIndex , startToken.text.length).replace(withReplacement, ""),
            annotations: startToken.annotations
        }

        updatedTokens.splice(startTokenIndex, 1, firstToken, middleToken, lastToken)
        return {
            result: updatedTokens.filter(token => token.text.length > 0),
            plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, "")
        };
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
        return {
            result: updatedTokens.filter(token => token.text.length > 0),
            plain_text: updatedTokens.reduce((acc, curr) => acc + curr.text, "")
        };
    }
}

// Concats tokens containing same annotations
const concatTokens = (tokens: Token[]) => {
    let concatenedTokens = [];

    for (const [index, token] of tokens.entries()) {
        if (index === 0) {
            concatenedTokens.push(token);
            continue;
        }

        const prevToken = concatenedTokens[concatenedTokens.length - 1];

        /**
         * If prev token has all the same annotations as current token, we add curent token text to prev token
         * and continue looping without adding current token to concatened tokens array.
         */
        const prevTokenAnnotations = Object.keys(prevToken.annotations);
        if (prevTokenAnnotations.length > 0 && prevTokenAnnotations.every(key => prevToken.annotations[key] === token.annotations[key])) {
            prevToken.text += token.text;
            continue;
        }

        concatenedTokens.push(token);
    }

    return concatenedTokens;
}

interface TokenProps {
    token: Token;
    patterns: Pattern[]
}

function Token(props: TokenProps) : JSX.Element {
    const { token, patterns } = props;
    const { text, annotations } = token;
    const wrappers = [];

    patterns.forEach(pattern => {
        // If annotation has a truthy value, add the corresponding wrapper.
        if (annotations[pattern.style]) wrappers.push(pattern.render);
    });
    return wrappers.reduce(
        (children, Wrapper) => <Wrapper>{children}</Wrapper>,
        text
    );
}

export default function EnrichedTextInput(props: EnrichedTextInputProps) {
    const {
        ref,
        stylePatterns = defaultStylePatterns,
        placeholder,
        multiline,
        defaultValue,
        onSelectionChange,
        onValueChange,
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

    useEffect(( ) => {
        if (defaultValue) {
            if (Array.isArray(defaultValue)) {
                // Maybe check if tokens structure is valid before setting.
                setTokens(defaultValue);
                return;
            }
            // To keep styles, parsing should be done before setting defaultValue
            const { tokens, plain_text } = parseRichTextString(defaultValue, stylePatterns);
            setTokens(tokens);
            prevTextRef.current = plain_text;
        }
    }, []);

    /**
     * Prev text should not contain matching rich text formats.
     * Those should be spliced once the corresponding tokens are created.
     */
    const prevTextRef = useRef(tokens.map(t => t.text).join(""));

    /**
     * To-do: Find a better name.
     * toSplit state is used to toggle styles when selection length === 0 (start === end).
     * Eg, if user is typing with no styles applied and then presses the "bold" button with no text selected,
     * the text to be inserted after that press should be styled as bold.
     * The same happens to toggle of a style. If user is typing in "bold" and presses the "bold" button again,
     * the text to be inserted after that press should not be styled as bold.
     */
    const [toSplit, setToSplit] = useState({
        start: 0,
        end: 0,
        annotations: {}
    });
    /* console.log("toSplit", toSplit); */
    const handleSelectionChange = ({ nativeEvent }) => {
        selectionRef.current = nativeEvent.selection;
        onSelectionChange && onSelectionChange(nativeEvent);
    }

    const handleOnChangeText = (nextText: string) => {
        const diff = diffStrings(prevTextRef.current, nextText);

       const match = findMatchV2(nextText, stylePatterns);
       /* console.log("MATCH:", match); */

        // Note: refactor to use new parseRichText function instead of regex
        if (match) {
            // Check token containing match
            // If token already haves this annotation, do not format and perform a simple updateToken.
            const { result, plain_text } = splitTokens(
                tokens,
                match.start,
                match.end/*  - 1 */, // I don't remember why the -1
                { [match.pattern.style]: true },
                // Get the rich text opening char to replace it
                match.pattern.opening
            );

            setTokens([...concatTokens(result)]);
            prevTextRef.current = plain_text;

            return;
        }


        if (Object.values(toSplit.annotations).some(Boolean) && diff.start === toSplit.start && diff.start === toSplit.end) {
            const { result } = insertToken(
                tokens,
                diff.start,
                toSplit.annotations,
                diff.added
            );
            const plain_text = result.map(t => t.text).join("");
            setTokens(concatTokens(result));

            // Reset
            setToSplit({
                start: 0,
                end: 0,
                annotations: {}
            });
            prevTextRef.current = plain_text;
            return;
        }

        // Default update
        const { updatedTokens, plain_text} = updateTokens(tokens, diff);
        
        setTokens([...concatTokens(updatedTokens)]); 
        prevTextRef.current = plain_text;
    }

    useImperativeHandle(ref, () => ({
        /**
         * Sets the TextInput's value as a rich text string or an array of tokens.
         */
        setValue(value: string | Token[]) {
            if (Array.isArray(value)) {
                // Maybe check if tokens structure is valid before setting.
                setTokens(value);
                return;
            }
            // To keep styles, parsing should be done before setting value
            const { tokens, plain_text } = parseRichTextString(value, stylePatterns);
            setTokens(tokens);
            prevTextRef.current = plain_text;
        },
        /**
         * Sets the TextInput's selection.
         */
        setSelection(start: number, end: number) {
            inputRef.current.setSelection(start, end);
        },
        /**
         * Focuses the TextInput.
         */
        focus() {
            inputRef.current.focus();
        },
        blur() {
            inputRef.current.blur();
        },
        /**
         * Returns the TextInput's value as a rich text string matching the patterns 
         * for each style defined in the patterns prop. If a style does not define an
         * opening and closing char, it is ignored.
         */
        getRichTextString() {
            return parseTokens(tokens, stylePatterns);
        },
        /**
         * Returns the text input's value as an array of tokens.
         */
        getTokenizedString() : Token[] {
            return tokens;
        },
        /** 
         * Toggles a given style. The style prop must match the name of a pattern.
         */
        toggleStyle(style: keyof Token["annotations"]) {
            const { start, end } = selectionRef.current;

            if (start === end) {
                setToSplit({
                    start,
                    end,
                    annotations: concileAnnotations(toSplit.annotations, { [style]: true })
                });
                return;
            }

            const { result } = splitTokens(tokens, start, end, { [style]: true });
            setTokens([...concatTokens(result)]);
            requestAnimationFrame(() => {
                inputRef.current.setSelection(start, end);
            });
        },
        /**
         * Returns the active styles for the current selection.
         */
        getActiveStyles() {
            // Check for styles of the token at the current cursor position.
            const { result } = findTokens(tokens, selectionRef.current.start);
            
            if (result[0].annotations) {
                return Object.keys(result[0].annotations).filter(key => result[0].annotations[key]);
            }

            return [];
        }
    }));

    return (
       <View style={{ position: "relative" }}>
            <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder={placeholder}
                multiline={multiline}
                onSelectionChange={handleSelectionChange}
                onChangeText={handleOnChangeText}
            >
                <Text style={styles.text}>
                    {tokens.map((token, i) => <Token key={i} token={token} patterns={stylePatterns}/>)}
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
        zIndex: 1
    },
    text: {
        color: "black",
    }
});