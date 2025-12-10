import { View, ScrollView, StyleSheet, TouchableOpacity, Keyboard } from "react-native";
import { useContext, createContext, Ref, useState, useEffect } from "react";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

interface RichTextInput {
    toggleBold: () => void;
    toggleItalic: () => void;
    setValue: (value: string) => void;
}

interface ToolbarProps {
    richTextInputRef: Ref<RichTextInput>,
    children: React.ReactNode
}

const ToolbarContext = createContext(null);

const useToolbarContext = () => {
    const context = useContext(ToolbarContext);
    
    return context;
}

export default function Toolbar({
    richTextInputRef,
    children
} : ToolbarProps) {

    const [ref, setRef] = useState(null);

    useEffect(() => {
        setRef(richTextInputRef);
    }, [richTextInputRef]);

    return (
        <ToolbarContext.Provider value={ref}>
            <ScrollView
                style={styles.toolbar}
                horizontal
                keyboardShouldPersistTaps="always"
            >
                {children}
            </ScrollView>
        </ToolbarContext.Provider>
    );
}

Toolbar.Bold = () => {
    const richTextInputRef = useToolbarContext();

    const handleBold = () => {
        richTextInputRef.current.toggleStyle("bold");
    }

    return (
        <TouchableOpacity style={styles.toolbarButton} onPress={handleBold}>
            <FontAwesome6 name="bold" size={16} color="black" />
        </TouchableOpacity>
    )
}

Toolbar.Italic = () => {
    const richTextInputRef = useToolbarContext();

    const handleItalic = () => {
        richTextInputRef.current.toggleStyle("italic");
    }

    return (
        <TouchableOpacity style={styles.toolbarButton} onPress={handleItalic}>
            <FontAwesome6 name="italic" size={16} color="black" />
        </TouchableOpacity>
    )
}

Toolbar.Strikethrough = () => {
    const richTextInputRef = useToolbarContext();

    const handleLineThrough = () => {
        richTextInputRef.current.toggleStyle("lineThrough");
    }

    return (
        <TouchableOpacity style={styles.toolbarButton} onPress={handleLineThrough}>
            <FontAwesome6 name="strikethrough" size={16} color="black" />
        </TouchableOpacity>
    )
}

Toolbar.Underline = () => {
    const richTextInputRef = useToolbarContext();

    const handleUnderline = () => {
        richTextInputRef.current.toggleStyle("underline");
    }

    return (
        <TouchableOpacity style={styles.toolbarButton} onPress={handleUnderline}>
            <FontAwesome6 name="underline" size={16} color="black" />
        </TouchableOpacity>
    )
}

Toolbar.Code = () => {
    const richTextInputRef = useToolbarContext();

    const handleCode = () => {
        richTextInputRef.current.toggleStyle("code");
    }

    return (
        <TouchableOpacity style={styles.toolbarButton} onPress={handleCode}>
            <FontAwesome6 name="code" size={16} color="black" />
        </TouchableOpacity>
    )
}

Toolbar.Link = () => {
    const richTextInputRef = useToolbarContext();

    const handleLink = () => {
        richTextInputRef.current.toggleStyle("link");
    }

    return (
        <TouchableOpacity style={styles.toolbarButton} onPress={handleLink}>
            <FontAwesome6 name="link" size={16} color="black" />
        </TouchableOpacity>
    )
}

Toolbar.Mention = () => {
    const richTextInputRef = useToolbarContext();

    const handleMention = () => {
        richTextInputRef.current.toggleStyle("mention");
    }

    return (
        <TouchableOpacity style={styles.toolbarButton} onPress={handleMention}>
            <FontAwesome6 name="at" size={16} color="black" />
        </TouchableOpacity>
    )
}

Toolbar.Keyboard = () => {
    const handleKeyboardDismiss = () => {
        Keyboard.dismiss();
    }

    return (
       <TouchableOpacity style={[styles.toolbarButton, styles.keyboardDown]} onPress={handleKeyboardDismiss}>
            <FontAwesome6 name="keyboard" size={16} color="black" />
            <View style={styles.keyboardArrowContainer}>
                <FontAwesome6 name="chevron-down" size={8} color="black"/>
            </View>
        </TouchableOpacity>
    )
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
        paddingBottom: 6
    },
    keyboardArrowContainer: {
        position: "absolute",
        bottom: 13
    }
});