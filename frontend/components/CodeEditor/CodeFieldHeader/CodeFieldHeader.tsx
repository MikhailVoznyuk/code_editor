'use client'

import { useContext, ChangeEvent } from "react";

import Image from "next/image";

import RunButton from "@/ui/RunButton/RunButton";
import executor from "@/lib/api/executor";
import { StateContext, DispatchContext } from "@/components/CodeEditor/contexts";
import Button from "@/ui/Button/Button";

const EXT_BY_LANG: Record<string, string> = {
    js: "js",
    python: "py",
    cpp: "cpp",
    java: "java",
};

type Props = {
    onRun?: () => void;
};

export default function CodeFieldHeader({ onRun }: Props) {
    const state = useContext(StateContext);
    const dispatch = useContext(DispatchContext);

    const onLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
        if (dispatch) {
            dispatch({
                type: "setLanguage",
                language: e.target.value,
            });
        }
    };

    const runCode = async () => {
        if (onRun) onRun();

        const output = await executor(
            state?.language ?? "js",
            state?.codeContent ?? "",
            state?.inputContent ?? ""
        );
        if (dispatch) {
            dispatch({
                type: "setOutputContent",
                outputContent: output,
            });
        }
    };

    const downloadCode = () => {
        const code = state?.codeContent ?? "";
        if (!code) return;

        const lang = state?.language ?? "js";
        const ext = EXT_BY_LANG[lang] ?? "txt";
        const blob = new Blob([code], {
            type: "text/plain;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `code.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex items-center gap-2 w-fit h-14 px-2 bg-[#272C35] rounded-xl">
            <select
                className="bg-[#435C7B] h-9 text-white rounded-xl px-2"
                value={state?.language ?? "js"}
                onChange={onLanguageChange}
            >
                <option value="js">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
            </select>
            <RunButton callback={runCode} />
            <Button
                variant="secondary"
                onClick={downloadCode}
                additionalClasses="!px-0"
            >
                <div className="bg-[#01a2ff] hover:bg-[#FFF] rounded-xl p-0.5 transition-[0.3s_ease]">
                    <div className='w-[32px] h-[32px] bg-[url("/icons/download.svg")] hover:bg-[url("/icons/download_hover.svg")] bg-contain'></div>
                </div>
                {/*<Image src={'/icons/download.svg'} alt={''} width={24} height={24}/>*/}
            </Button>
        </div>
    );
}
