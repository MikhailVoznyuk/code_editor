import type { Action, State } from "@/components/CodeEditor/CodeEditor.types";

export default function codeEditorReducer(state: State, action: Action): State {
    switch (action.type) {
        case "setLanguage":
            return { ...state, language: action.language, codeContent: '', outputContent: ''};
        case "setCodeContent":
            return { ...state, codeContent: action.codeContent };
        case "setOutputContent":
            return { ...state, outputContent: action.outputContent };
        case "setInputContent":
            return { ...state, inputContent: action.inputContent };
        default:
            throw new Error("Unknown action type");
    }
}
