import { View, Text, StyleSheet, TouchableOpacity, Keyboard } from "react-native";
import { RefObject, Ref } from "react";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

interface RichTextInput {
    toggleBold: () => void;
    toggleItalic: () => void;
    setValue: (value: string) => void;
}

interface ToolbarProps {
    richTextInputRef: Ref<RichTextInput>,
}

export default function Toolbar({
    richTextInputRef
} : ToolbarProps) {

    const handleBold = () => {
        richTextInputRef.current.toggleBold();
    }

    const handleItalic = () => {
        richTextInputRef.current.toggleItalic();
    }

    const handleLineThrough = () => {
        richTextInputRef.current.toggleLineThrough();
    }

    const handleUnderline = () => {
        richTextInputRef.current.toggleUnderline();
    }

    const handleComment = () => {
        richTextInputRef.current.toggleComment();
    }

    const handleKeyboardDismiss = () => {
        Keyboard.dismiss();
    }

    return (
        <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleBold}>
                <FontAwesome6 name="bold" size={16} color="black" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton} onPress={handleItalic}>
                <FontAwesome6 name="italic" size={16} color="black" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton} onPress={handleLineThrough}>
                <FontAwesome6 name="strikethrough" size={16} color="black" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton} onPress={handleUnderline}>
                <FontAwesome6 name="underline" size={16} color="black" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton} onPress={handleComment}>
                <FontAwesome6 name="comment-alt" size={16} color="black" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.toolbarButton, styles.keyboardDown]} onPress={handleKeyboardDismiss}>
                <FontAwesome6 name="keyboard" size={16} color="black" />
                <View style={styles.keyboardArrowContainer}>
                    <FontAwesome6 name="chevron-down" size={10} color="black"/>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    toolbar: {
        width: "100%",
        height: 50,
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        marginTop: 16
    },
    toolbarButton: {
        height: 50,
        width: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    keyboardDown: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",

    },
    keyboardArrowContainer: {
        position: "absolute",
        bottom: 10
    }
});