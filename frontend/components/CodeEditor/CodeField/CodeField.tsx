'use client'

import {useContext, useCallback, useEffect} from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
import {StreamLanguage} from "@codemirror/language";
import {javascript} from "@codemirror/lang-javascript";
import {python} from "@codemirror/lang-python";
import {cpp} from "@codemirror/lang-cpp";
import {java} from "@codemirror/lang-java";
import {atomone} from "@uiw/codemirror-theme-atomone";

import ContentField from "@/ui/ContentField/ContentField";
import {StateContext, DispatchContext} from "@/components/CodeEditor/contexts";
import {LanguageSupport} from "@codemirror/language";

interface LangMap {
    [key: string] : LanguageSupport
}
const LANGS: LangMap = {
    "js": javascript(),
    "python": python(),
    "cpp": cpp(),
    "java": java()
}

export default function CodeField() {
    const state = useContext(StateContext);
    const dispatch = useContext(DispatchContext);

    const onChange = useCallback((value: string) => dispatch && dispatch({
        type: 'setCodeContent',
        codeContent: value
    }), [dispatch]);
    useEffect(() => {
        console.log(LANGS[state?.language || 'none'])
    })

    return (
        <ContentField fieldLabel={'Code'} height={'500px'}>
            <ReactCodeMirror
                value={state?.codeContent ?? ''}
                width={'100%'}

                onChange={onChange}
                extensions={
                    [LANGS[state?.language || '']]
                }
                theme={atomone}
            >

            </ReactCodeMirror>
        </ContentField>
    )
}