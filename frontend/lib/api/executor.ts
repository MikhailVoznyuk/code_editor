'use server'

import { WebSocket } from "ws";

const url =
    process.env.WS_SERVER_URL ??
    (process.env.NODE_ENV === "production"
        ? "ws://api:8080"
        : "ws://localhost:8080");

type ExecutionPayload = {
    language: string;
    code: string;
    stdin?: string;
};

export default async function executor(
    language: string,
    codeContent: string,
    stdin: string
): Promise<string> {
    const socket = new WebSocket(url);
    const payload: ExecutionPayload = {
        language,
        code: codeContent,
        stdin: stdin.length > 0 ? stdin : undefined,
    };

    let output = "";

    await new Promise<void>((resolve, reject) => {
        socket.addEventListener("open", () => {
            socket.send(JSON.stringify(payload));
        });

        socket.addEventListener("message", (e) => {
            output = e.data.toString();
            socket.close();
            resolve();
        });

        socket.addEventListener("error", (err) => {
            console.error("WS error:", err);
            output = "Connection error";
            reject(new Error("WebSocket error"));
        });
    });

    return output;
}
