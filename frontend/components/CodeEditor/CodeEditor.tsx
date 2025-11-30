'use client'

import { useReducer } from "react";

import CodeField from "@/components/CodeEditor/CodeField/CodeField";
import ContentField from "@/ui/ContentField/ContentField";
import CodeFieldHeader from "@/components/CodeEditor/CodeFieldHeader/CodeFieldHeader";
import { StateContext, DispatchContext } from "@/components/CodeEditor/contexts";
import codeEditorReducer from "@/components/CodeEditor/reducer";
import InputField from "@/ui/InputField/InputField";

export default function CodeEditor() {
    const [state, dispatch] = useReducer(codeEditorReducer, {
        language: "js",
        codeContent: 'console.log("Hello world")',
        inputContent: "",
        outputContent: "",
    });

    return (
        <div className="flex justify-center items-center py-10 flex-wrap">
            <StateContext value={state}>
                <DispatchContext value={dispatch}>
                <div className="flex flex-col gap-4 max-w-5xl w-full flex-wrap shrink-0">
                        <div className="flex w-full">
                            <CodeFieldHeader />
                        </div>
                        <div className="flex flex-col flex-wrap  max-h-[600px] gap-4">
                            <CodeField />
                            <InputField fieldLabel="Input (stdin)" />
                            <ContentField fieldLabel={"Output"} width={"320px"} height={"240px"}>
                                <div className="px-3 py-2 whitespace-pre-wrap">
                                    <h5>{state.outputContent}</h5>
                                </div>
                            </ContentField>
                        </div>


                </div>
                </DispatchContext>
            </StateContext>
        </div>
    );
}
