import { Text, StyleSheet } from "react-native";

export function Code({ children }) {
    return (
        <Text style={styles.code}>{children}</Text>
    )
}

export function Bold({ children }) {
    return (
        <Text style={styles.bold}>{children}</Text>
    )
}

export function Italic({ children }) {
    return (
        <Text style={styles.italic}>{children}</Text>
    )
}

export function Underline({ children }) {
    return (
        <Text style={styles.underline}>{children}</Text>
    )
}

export function Strikethrough({ children }) {
    return (
        <Text style={styles.lineThrough}>{children}</Text>
    )
}

export function UnderlineStrikethrough({ children }) {
    return (
        <Text style={styles.underlineLineThrough}>{children}</Text>
    )
}

export function Heading({ children }) {
    return (
        <Text style={styles.heading}>{children}</Text>
    )
}

export function SubHeading({ children }) {
    return (
        <Text style={styles.subHeading}>{children}</Text>
    )
}

export function SubSubHeading({ children }) {
    return (
        <Text style={styles.subSubHeading}>{children}</Text>
    )
}

const styles = StyleSheet.create({
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
        color: "#EB5757",
        fontSize: 20,
        backgroundColor: "rgba(135, 131, 120, .15)"
    },
    highlight: {
        width: "100%",
        position: "absolute",
        padding: 20,
        height: 24,
        backgroundColor: "blue"
    },
    heading: {
        fontSize: 32,
        fontWeight: "bold"
    },
    subHeading: {
        fontSize: 28,
        fontWeight: "bold"
    },
    subSubHeading: {
        fontSize: 24,
        fontWeight: "bold"
    }
});