'use client'

import { useState, useEffect } from "react";
import ReactCodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { atomone } from "@uiw/codemirror-theme-atomone";
import type { LanguageSupport } from "@codemirror/language";

export type HistoryEntry = {
    id: string;
    ts: number;
    lang: string;
    code: string;
};

type Props = {
    history: HistoryEntry[];
    onApply: (entry: HistoryEntry) => void;
};

const PER_PAGE = 5;

const HISTORY_LANGS: Record<string, LanguageSupport> = {
    js: javascript(),
    python: python(),
    cpp: cpp(),
    java: java(),
};

type PageItem = number | "dots";

function buildPagination(totalPages: number, current: number): PageItem[] {
    const pages: PageItem[] = [];

    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
    }

    pages.push(1);

    let left = current - 1;
    let right = current + 1;

    if (left < 2) {
        left = 2;
        right = 4;
    }
    if (right > totalPages - 1) {
        right = totalPages - 1;
        left = totalPages - 3;
    }

    if (left > 2) pages.push("dots");

    for (let i = left; i <= right; i++) {
        if (i > 1 && i < totalPages) {
            pages.push(i);
        }
    }

    if (right < totalPages - 1) pages.push("dots");

    pages.push(totalPages);

    return pages;
}

export default function HistorySection({ history, onApply }: Props) {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(history.length / PER_PAGE));

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    if (history.length === 0) {
        return (
            <div className="flex flex-col h-full max-h-[460px]">
                <div className="flex-1 pr-1 text-xs text-slate-500">
                    Истории пока нет. Запусти код, чтобы сохранить первую версию.
                </div>
            </div>
        );
    }

    const start = (page - 1) * PER_PAGE;
    const pageItems = history.slice(start, start + PER_PAGE);
    const pagination = buildPagination(totalPages, page);

    return (
        <div className="flex flex-col h-full max-h-[460px]">
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
                {pageItems.map(entry => (
                    <HistoryItem
                        key={entry.id}
                        entry={entry}
                        onApply={onApply}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                    <button
                        type="button"
                        className="px-2 py-1 rounded-lg bg-[#272C35] disabled:opacity-40"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ‹
                    </button>

                    {pagination.map((item, idx) =>
                        item === "dots" ? (
                            <span
                                key={`dots-${idx}`}
                                className="px-1 text-slate-500"
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setPage(item)}
                                className={`px-2 py-1 rounded-lg ${
                                    item === page
                                        ? "bg-[#435C7B] text-white"
                                        : "bg-[#272C35] text-slate-300"
                                }`}
                            >
                                {item}
                            </button>
                        )
                    )}

                    <button
                        type="button"
                        className="px-2 py-1 rounded-lg bg-[#272C35] disabled:opacity-40"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
}

type HistoryItemProps = {
    entry: HistoryEntry;
    onApply: (entry: HistoryEntry) => void;
};

function HistoryItem({ entry, onApply }: HistoryItemProps) {
    const [open, setOpen] = useState(false);

    const d = new Date(entry.ts);
    const label = d.toLocaleString();

    const copy = () => {
        if (navigator?.clipboard) {
            navigator.clipboard.writeText(entry.code).catch(() => {});
        }
    };

    const langExtension =
        HISTORY_LANGS[entry.lang] ?? HISTORY_LANGS["js"];

    return (
        <div className="bg-[#272C35] rounded-xl px-3 py-2 text-sm">
            <button
                type="button"
                className="flex w-full items-center justify-between"
                onClick={() => setOpen(!open)}
            >
                <div className="flex flex-col text-left">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-xs text-slate-300 uppercase">
                        {entry.lang}
                    </span>
                </div>
                <span className="text-xs text-slate-400">
                    {open ? "▲" : "▼"}
                </span>
            </button>

            {open && (
                <div className="mt-2">
                    <div className="flex gap-2 mb-2">
                        <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-lg bg-[#435C7B]"
                            onClick={copy}
                        >
                            Копировать
                        </button>
                        <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-lg bg-[#435C7B]"
                            onClick={() => onApply(entry)}
                        >
                            Вставить в редактор
                        </button>
                    </div>
                    <div className="border border-slate-600/40 rounded-lg overflow-hidden">
                        <ReactCodeMirror
                            value={entry.code}
                            theme={atomone}
                            extensions={[langExtension]}
                            editable={false}
                            height="150px"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
