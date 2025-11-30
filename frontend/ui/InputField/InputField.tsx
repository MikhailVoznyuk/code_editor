'use client'

import React, { useContext } from "react";
import { DispatchContext } from "@/components/CodeEditor/contexts";

type InputFieldProps = {
    fieldLabel: string;
};

export default function InputField({ fieldLabel }: InputFieldProps) {
    const dispatch = useContext(DispatchContext);

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (dispatch) {
            dispatch({
                type: "setInputContent",
                inputContent: value,
            });
        }
    };

    return (
        <div className="relative bg-[#272C35] rounded-xl overflow-hidden">
            <div className="px-3 mb-1 bg-[#01A2FF] w-fit rounded-[14px_0_14px_0] text-base text-white">
                {fieldLabel}
            </div>
            <form>
                <textarea
                    onChange={onChange}
                    placeholder="Введите stdin (аргументы или строки ввода)"
                    className="w-full px-3 pb-3 bg-transparent outline-none text-base text-white resize-y"
                    rows={4}
                />
            </form>
        </div>
    );
}
