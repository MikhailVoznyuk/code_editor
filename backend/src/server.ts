import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
import Executor from "./lib/executor/executor.js";

type ServerConfig = {
    port: number;
    host: string;
};

type IncomingPayload = {
    language?: string;
    code?: string;
    codeContent?: string;
    stdin?: string;
};

const serverConfig: ServerConfig = {
    port: Number(process.env.PORT ?? 8080),
    host: process.env.HOST ?? "0.0.0.0",
};

const wss = new WebSocketServer(serverConfig);
const executor = new Executor();

wss.on("connection", (ws) => {
    ws.on("message", async (data) => {
        try {
            const raw = data.toString();
            const payload = JSON.parse(raw) as IncomingPayload;

            const language = payload.language ?? "js";
            const codeContent = payload.codeContent ?? payload.code ?? "";
            const stdin = payload.stdin ?? "";

            const result = await executor.addTask({
                id: randomUUID(),
                language,
                codeContent,
                stdin,
            });

            ws.send(result);
        } catch {
            ws.send("Invalid payload");
        }
    });
});
