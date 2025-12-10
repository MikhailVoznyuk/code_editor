'use client'

import { useReducer, useState, useRef, useEffect } from "react";

import CodeField from "@/components/CodeEditor/CodeField/CodeField";
import ContentField from "@/ui/ContentField/ContentField";
import CodeFieldHeader from "@/components/CodeEditor/CodeFieldHeader/CodeFieldHeader";
import { StateContext, DispatchContext } from "@/components/CodeEditor/contexts";
import codeEditorReducer from "@/components/CodeEditor/reducer";
import InputField from "@/ui/InputField/InputField";

import HistorySection, {
    HistoryEntry,
} from "@/components/CodeEditor/HistorySection/HistorySection";

const HISTORY_KEY = "code_editor_history_v1";
const MIN_COL_WIDTH = 15;

export default function CodeEditor() {
    const [state, dispatch] = useReducer(codeEditorReducer, {
        language: "js",
        codeContent: 'console.log("Hello world")',
        inputContent: "",
        outputContent: "",
    });

    const [codeWidth, setCodeWidth] = useState(50);   // %
    const [historyWidth, setHistoryWidth] = useState(20); // %
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [topHeight, setTopHeight] = useState(50); // % высоты Input в средней колонке
    const middleColRef = useRef<HTMLDivElement | null>(null);

    const [history, setHistory] = useState<HistoryEntry[]>([]);

    const ioWidth = 100 - codeWidth - historyWidth;

    // загрузка истории + стартовый снапшот
    useEffect(() => {
        if (typeof window === "undefined") return;
        const raw = localStorage.getItem(HISTORY_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setHistory(parsed);
                    return;
                }
            } catch {}
        }

        const initCode = state.codeContent;
        if (initCode && initCode.trim()) {
            const e: HistoryEntry = {
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                ts: Date.now(),
                lang: state.language,
                code: initCode,
            };
            setHistory([e]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // сохранение истории
    useEffect(() => {
        if (typeof window === "undefined") return;
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }, [history]);

    function addHistorySnapshot() {
        const code = state.codeContent;
        const lang = state.language;
        if (!code || !code.trim()) return;

        const entry: HistoryEntry = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ts: Date.now(),
            lang,
            code,
        };
        setHistory(prev => [entry, ...prev].slice(0, 50));
    }

    function applyHistory(entry: HistoryEntry) {
        if (dispatch) {
            dispatch({
                type: "setLanguage",
                language: entry.lang,
            });
            dispatch({
                type: "setCodeContent",
                codeContent: entry.code,
            });
        }

        const clone: HistoryEntry = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ts: Date.now(),
            lang: entry.lang,
            code: entry.code,
        };
        setHistory(prev => [clone, ...prev].slice(0, 50));
    }

    // ресайзер между кодом и средней колонкой
    function onDragCodeHandleStart(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();
        const startX = e.clientX;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const startCode = codeWidth;

        function onMove(ev: MouseEvent) {
            const dx = ev.clientX - startX;
            const startPx = (startCode / 100) * rect.width;
            const newPx = startPx + dx;
            let next = (newPx / rect.width) * 100;

            if (next < MIN_COL_WIDTH) next = MIN_COL_WIDTH;
            if (100 - next - historyWidth < MIN_COL_WIDTH) {
                next = 100 - historyWidth - MIN_COL_WIDTH;
            }
            setCodeWidth(next);
        }

        function onUp() {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    // ресайзер между средней колонкой и историей
    function onDragHistoryHandleStart(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();
        const startX = e.clientX;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const startHistory = historyWidth;

        function onMove(ev: MouseEvent) {
            const dx = ev.clientX - startX;
            const startPx = (startHistory / 100) * rect.width;
            const newPx = startPx - dx; // dx>0 -> история меньше, средняя колонка больше
            let next = (newPx / rect.width) * 100;

            if (next < MIN_COL_WIDTH) next = MIN_COL_WIDTH;
            if (100 - codeWidth - next < MIN_COL_WIDTH) {
                next = 100 - codeWidth - MIN_COL_WIDTH;
            }
            setHistoryWidth(next);
        }

        function onUp() {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    // вертикальный ресайзер внутри средней колонки
    function onVerticalDragStart(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();
        const startY = e.clientY;
        const rect = middleColRef.current?.getBoundingClientRect();
        if (!rect) return;

        const startTopHeight = topHeight;

        function onMove(ev: MouseEvent) {
            const dy = ev.clientY - startY;
            const startPx = (startTopHeight / 100) * rect.height;
            const newPx = startPx + dy;
            let next = (newPx / rect.height) * 100;

            if (next < 20) next = 20;
            if (next > 80) next = 80;

            setTopHeight(next);
        }

        function onUp() {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        }

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    }

    return (
        <div className="flex justify-center items-center py-10 flex-wrap w-[94vw] sm:w-[96vw]">
            <StateContext value={state}>
                <DispatchContext value={dispatch}>
                    <div className="flex flex-col gap-4 max-w-8xl w-full flex-wrap">
                        <div className="flex w-full">
                            <CodeFieldHeader onRun={addHistorySnapshot} />
                        </div>

                        <div
                            ref={containerRef}
                            className="flex w-full lg:flex-row flex-col lg:max-h-[600px] gap-4"
                        >
                            {/* левая колонка: код */}
                            <div
                                className="flex flex-col min-w-[220px] lg:h-full"
                                style={{ flexBasis: `${codeWidth}%` }}
                            >
                                <CodeField />
                            </div>

                            {/* ресайзер между кодом и IO */}
                            <div
                                className="hidden lg:block w-1 cursor-col-resize relative group"
                                onMouseDown={onDragCodeHandleStart}
                            >
                                <div
                                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-slate-500/30 group-hover:bg-slate-500/80 h-[100px]"
                                    style={{ top: "calc(100% / 2 - 50px)" }}
                                />
                            </div>

                            {/* средняя колонка: stdin + output */}
                            <div
                                ref={middleColRef}
                                className="flex flex-col gap-4 min-w-[220px] lg:h-[500px]"
                                style={{ flexBasis: `${ioWidth}%` }}
                            >
                                <div
                                    className="flex flex-col min-h-[100px]"
                                    style={{ flexBasis: `${topHeight}%` }}
                                >
                                    <InputField fieldLabel="Input (stdin)" />
                                </div>

                                <div
                                    className="hidden lg:block h-1 cursor-row-resize relative group"
                                    onMouseDown={onVerticalDragStart}
                                >
                                    <div
                                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-slate-500/30 group-hover:bg-slate-500/80 w-[100px]"
                                        style={{ left: "calc(100% / 2 - 50px)" }}
                                    />
                                </div>

                                <div
                                    className="flex flex-col min-h-[100px]"
                                    style={{ flexBasis: `${100 - topHeight}%` }}
                                >
                                    <ContentField fieldLabel={"Output"}>
                                        <div className="px-3 py-2 whitespace-pre-wrap">
                                            <h5>{state.outputContent}</h5>
                                        </div>
                                    </ContentField>
                                </div>
                            </div>

                            {/* ресайзер между IO и историей */}
                            <div
                                className="hidden lg:block w-1 cursor-col-resize relative group"
                                onMouseDown={onDragHistoryHandleStart}
                            >
                                <div
                                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-slate-500/30 group-hover:bg-slate-500/80 h-[100px]"
                                    style={{ top: "calc(100% / 2 - 50px)" }}
                                />
                            </div>

                            {/* правая колонка: история */}
                            <div
                                className="flex flex-col min-w-[220px] lg:h-full"
                                style={{ flexBasis: `${historyWidth}%` }}
                            >
                                <ContentField fieldLabel="History" height={"500px"}>
                                    <HistorySection
                                        history={history}
                                        onApply={applyHistory}
                                    />
                                </ContentField>
                            </div>
                        </div>
                    </div>
                </DispatchContext>
            </StateContext>
        </div>
    );
}
