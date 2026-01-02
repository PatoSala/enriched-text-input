import { Bold, Code, Heading, Italic, SubHeading, SubSubHeading, Strikethrough, Underline } from "./components/StyledText";

export const markdownStyles = [
  { style: "bold", regex: "\\*([^*]+)\\*", render: Bold, opening: "*", closing: "*" },
  { style: "italic", regex: "_([^_]+)_", render: Italic, opening: "_", closing: "_" },
  { style: "lineThrough", regex: "~([^~]+)~", render: Strikethrough, opening: "~", closing: "~" },
  { style: "code", regex: "`([^`]+)`", render: Code, opening: "`", closing: "`" },
  { style: "underline", regex: "__([^_]+)__", render: Underline, opening: "__", closing: "__" },
  { style: "heading", regex: null, render: Heading, opening: "#", closing: null },
  { style: "subHeading", regex: null, render: SubHeading, opening: "##", closing: null },
  { style: "subSubHeading", regex: null, render: SubSubHeading, opening: "###", closing: null }
];