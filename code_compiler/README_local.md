# Code Compiler (demo, local-only)

Двухсервисный прототип для выполнения пользовательского кода через WebSocket:

- **frontend** — Next.js 15 (React 19): интерфейс редактора кода.
- **backend** — Node.js + `ws`: принимает код по WebSocket, выполняет его и возвращает вывод.
- Запуск локально через Docker Compose или по отдельности (npm). Прод и безопасность **не цель** этого репозитория — это демо.

> Внимание: бэкенд исполняет произвольный код. Не публикуйте это в интернет, не запускайте на продовых машинах и не давайте доступ незнакомым. Демонстрационный проект только для локальной среды.

---

## Стек
- **Frontend:** Next.js 15, React 19, CodeMirror
- **Backend:** Node 20, TypeScript, `ws`
- **Инфра:** Docker (multi-stage), Docker Compose

---

## Структура проекта
```
code_compiler/
├─ frontend/                # Next.js приложение
│  ├─ app/                  # маршруты/страницы
│  ├─ components/           # компоненты
│  ├─ lib/                  # утилиты, ws-клиент
│  ├─ public/
│  ├─ package.json
│  └─ Dockerfile
├─ backend/                 # Node.js WebSocket сервер
│  ├─ src/
│  │  ├─ server.ts          # HTTP + WS на одном порту, /healthz
│  │  └─ lib/executor/      # исполнение кода (spawn)
│  ├─ tsconfig.json
│  ├─ package.json
│  └─ Dockerfile
└─ docker-compose.yml
```

---

## Быстрый старт (Docker Compose, локально)

Требуется Docker + Compose plugin.

```bash
# из корня репозитория
docker compose build --no-cache
docker compose up -d

# проверить состояние
docker compose ps
docker compose logs -f api
docker compose logs -f web

```

Открыть в браузере: **http://localhost:3000**.

По умолчанию фронт подключается к WebSocket бэка по `ws://localhost:8080` (см. переменную `NEXT_PUBLIC_WS_URL` в `docker-compose.yml`).

---

## Переменные окружения

### Frontend
- `NEXT_PUBLIC_WS_URL` — адрес WebSocket бэка. Для локалки по умолчанию `ws://localhost:8080`.

> Переменные `NEXT_PUBLIC_*` вшиваются в фронтовый бандл на этапе **build**. Если меняете значение — пересоберите образ фронта или перезапустите `npm run dev`.

### Backend
- `PORT` (по умолчанию 8080)
- `HOST` (по умолчанию `0.0.0.0`)


---

## Запуск без Docker (локальная разработка)

### Backend
```bash
cd backend
npm ci
npm run dev   # запускает src/server.ts (HTTP+WS на :8080)
```

### Frontend
```bash
cd frontend
npm ci
# при необходимости явно укажи адрес бэка (иначе дефолт ws://localhost:8080):
# echo "NEXT_PUBLIC_WS_URL=ws://localhost:8080" > .env.local
npm run dev   # http://localhost:3000
```

---

## Протокол обмена (демо)

На данный момент для простоты используется «строка-вход → строка-выход». В планах перейти на JSON-протокол:

```ts
// client -> server
type ExecRequest = {
  type: "exec";
  id: string;
  language: "js";
  code: string;
  stdin?: string[];
};

// server -> client
type ExecEvent =
  | { type: "accepted"; id: string }
  | { type: "progress"; id: string; data: string }
  | { type: "error"; id: string; message: string }
  | { type: "result"; id: string; exitCode: number; durationMs: number };
```

---

## Скрипты

### frontend/package.json
```jsonc
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint"
  }
}
```

### backend/package.json
```jsonc
{
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

## Как собрать фронт изолированно (без compose)

```bash
# сборка
docker build -t code-frontend ./frontend

# запуск
docker run --rm -p 3000:3000 --name next-web code-frontend

# открыть
open http://localhost:3000   # macOS
# или xdg-open / просто зайти в браузер
```

> Если нужен иной адрес WS прямо при сборке фронта, добавьте в Dockerfile:
> ```dockerfile
> ARG NEXT_PUBLIC_WS_URL
> ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
> ```
> и соберите так:
> ```bash
> docker build -t code-frontend --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:8080 ./frontend
> ```

---

## Важно про безопасность

Бэкенд исполняет произвольный код. В демо **нет** песочницы, лимитов CPU/памяти и строгих ограничений по выводу. Не используйте это публично и не доверяйте незнакомым входным данным.

---

## Лицензия
MIT (или укажите свою).
