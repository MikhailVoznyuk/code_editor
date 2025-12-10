import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

type Task = {
    id: string;
    language: string;
    codeContent: string;
    stdin?: string;
};

type LanguageConfig = {
    fileName: string;
    command: string;
};

const SUPPORTED_LANGUAGES = new Map<string, LanguageConfig>([
    ["js",         { fileName: "main.js",   command: "node main.js" }],
    ["javascript", { fileName: "main.js",   command: "node main.js" }],
    ["py",         { fileName: "main.py",   command: "python3 main.py" }],
    ["python",     { fileName: "main.py",   command: "python3 main.py" }],
    ["cpp",        { fileName: "main.cpp",  command: "g++ main.cpp -O2 -std=c++17 -o main && ./main" }],
    ["cplusplus",  { fileName: "main.cpp",  command: "g++ main.cpp -O2 -std=c++17 -o main && ./main" }],
    ["java",       { fileName: "Main.java", command: "javac Main.java && java Main" }],
]);

function getLanguageConfig(language: string): LanguageConfig {
    const key = language.toLowerCase();
    const found = SUPPORTED_LANGUAGES.get(key);
    if (found) {
        return found;
    }
    return { fileName: "main.js", command: "node main.js" };
}

class Executor {
    private baseDir: string;
    private volumeName: string;

    constructor() {
        this.baseDir = process.env.EXEC_BASE_DIR || "/code-runner";
        this.volumeName = process.env.EXEC_VOLUME || "code-runner-data";
    }

    async addTask(task: Task): Promise<string> {
        return this.run(task);
    }

    private async createTempDir(): Promise<string> {
        await fs.mkdir(this.baseDir, { recursive: true });
        const prefix = path.join(this.baseDir, "run-");
        const dir = await fs.mkdtemp(prefix);
        try {
            await fs.chmod(dir, 0o777);
        } catch {
            // ignore chmod errors
        }
        return dir;
    }

    private async clearDir(dir: string): Promise<void> {
        await fs.rm(dir, { recursive: true, force: true });
    }

    private async run(task: Task): Promise<string> {
        const config = getLanguageConfig(task.language);

        const tmpDir = await this.createTempDir();
        const filePath = path.join(tmpDir, config.fileName);

        await fs.writeFile(filePath, task.codeContent, { encoding: "utf-8" });

        const relPath = path.relative(this.baseDir, tmpDir).replace(/\\/g, "/");
        const workDirInRunner = relPath.length > 0 ? `/workspace/${relPath}` : "/workspace";

        const dockerArgs = [
            "run",
            "-i",
            "--rm",
            "--network", "none",
            "--memory", "256m",
            "--cpus", "1",
            "--pids-limit", "64",
            "-v", `${this.volumeName}:/workspace`,
            "-w", workDirInRunner,
            "code-runner:latest",
            "bash",
            "-lc",
            config.command,
        ];

        let output = "";

        await new Promise<void>((resolve) => {
            const child = spawn("docker", dockerArgs, {
                stdio: ["pipe", "pipe", "pipe"],
            });

            if (task.stdin && task.stdin.length > 0) {
                let data = task.stdin;
                if (!data.endsWith("\n")) {
                    data += "\n";
                }
                child.stdin.write(data);
            }
            child.stdin.end();

            child.stdout.on("data", (data) => {
                output += data.toString();
            });

            child.stderr.on("data", (data) => {
                output += data.toString();
            });

            child.on("error", (err) => {
                output += `\n[executor error] ${String(err)}`;
                resolve();
            });

            child.on("close", () => {
                resolve();
            });
        });

        await this.clearDir(tmpDir);

        return output;
    }
}

export default Executor;
