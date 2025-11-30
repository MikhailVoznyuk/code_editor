# Online Code Runner

Интерактивный онлайн-редактор кода с серверным выполнением в изолированных Docker-контейнерах.

Пользователь пишет код в браузере (JS / Python / C++ / Java), нажимает **Run**, код уезжает на сервер, там в отдельном контейнере компилируется/исполняется, результат и ошибки возвращаются в интерфейс.  
Ввод с клавиатуры (`stdin`, например `input()` в Python) тоже поддерживается.

---

## Основные возможности

- Выполнение кода в **отдельном Docker-контейнере** для каждого запуска:
  - отключённая сеть (`--network none`);
  - лимит по памяти, CPU и количеству процессов;
  - контейнер удаляется сразу после завершения (`--rm`).
- Поддерживаемые языки:
  - **JavaScript** (Node.js)
  - **Python 3**
  - **C++ (G++ / C++17)**
  - **Java 17**
- Поддержка **stdin**:
  - отдельное текстовое поле для ввода;
  - ввод прокидывается в контейнер через STDIN;
  - работает с `input()` в Python, `std::cin` в C++, `Scanner` в Java и т.п.
- WebSocket-API:
  - фронтенд общается с backend по WebSocket;
  - протокол простой: JSON `{ language, code, stdin }`.
- Фронтенд:
  - Next.js + React;
  - редактор кода на базе CodeMirror;
  - отдельные поля: код, stdin, вывод.

---

## Стек

- **Frontend**
  - Next.js
  - React
  - CodeMirror (`@uiw/react-codemirror`)
- **Backend**
  - Node.js
  - TypeScript
  - `ws` (WebSocket-сервер)
- **Инфраструктура**
  - Docker / Docker Compose
  - Отдельный `runner`-образ с установленными:
    - Node.js
    - Python 3
    - G++ (C++17)
    - OpenJDK 17

---

## Архитектура

Сервисы в `docker-compose.yml`:

- `web`  
  Next.js фронтенд, отдаёт UI и открывает WebSocket-подключение к `api`.

- `api`  
  WebSocket-сервер:
  - принимает JSON `{ language, code, stdin }`;
  - создаёт временную папку в Docker-volume;
  - пишет туда исходник (`main.js`, `main.py`, `main.cpp`, `Main.java`);
  - запускает одноразовый контейнер `code-runner:latest` с ограничениями;
  - собирает `stdout`/`stderr` и отправляет обратно по WebSocket.

- `runner`  
  Образ, внутри которого непосредственно выполняется код.  
  API вызывает его через `docker run` для каждого запроса.

Хранилище временных файлов:

- общий Docker-volume `code-runner-data`;
- в `api` он примонтирован как `/code-runner`;
- в `runner` как `/workspace`;
- для каждого запуска создаётся подпапка `/code-runner/run-XXXX`, которая в runner-контейнере видна как `/workspace/run-XXXX`.

---

## Запуск через Docker Compose

### Требования

- Docker + Docker Compose (Docker Desktop на macOS / Windows, обычный Docker на Linux).

### Шаги

1. Клонировать репозиторий:

   ```bash
   git clone <url_репозитория>
   cd <папка_репозитория>
   ```

2. Собрать образы:

   ```bash
   docker compose build
   ```

3. Запустить стек:

   ```bash
   docker compose up -d
   ```

4. Открыть фронтенд:

   ```text
   http://localhost:3000
   ```

Backend (WebSocket-сервер) доступен на:

```text
ws://localhost:8080
```

---

## Использование

1. Открыть UI (`http://localhost:3000`).
2. Выбрать язык в селекте:
   - JavaScript
   - Python
   - C++
   - Java
3. Написать код в редакторе.
4. Если код ожидает ввод:
   - ввести строки/аргументы в поле **Input (stdin)**;
   - каждая новая строка пойдёт как отдельный ввод (для `input()`, `std::getline` и т.п.).
5. Нажать **Run**:
   - код улетит на сервер;
   - будет создан и выполнен контейнер;
   - результат работы программы появится в блоке **Output**.

---

## Формат WebSocket-протокола

Фронтенд отправляет на backend JSON следующего вида:

```json
{
  "language": "python",
  "code": "s = input()\nprint('echo:', s)",
  "stdin": "hello stdin\n"
}
```

Поля:

- `language` – строка, один из:
  - `"js"`, `"javascript"`
  - `"py"`, `"python"`
  - `"cpp"`, `"cplusplus"`
  - `"java"`
- `code` – исходный код для выполнения;
- `stdin` – опциональная строка, которая будет отправлена в STDIN процесса внутри контейнера  
  (если не нужна – поле можно не передавать).

Ответ от сервера:

- обычная текстовая строка с объединённым `stdout` и `stderr` программы.

---

## Реализация запуска кода

Backend при выполнении задачи делает примерно следующее:

1. Создаёт временную директорию в `/code-runner/run-XXXX`.
2. Сохраняет туда файл:
   - JS: `main.js`
   - Python: `main.py`
   - C++: `main.cpp`
   - Java: `Main.java`
3. Вызывает:

   ```bash
   docker run \
     -i \
     --rm \
     --network none \
     --memory 256m \
     --cpus 1 \
     --pids-limit 64 \
     -v code-runner-data:/workspace \
     -w /workspace/run-XXXX \
     code-runner:latest \
     bash -lc "<команда для языка>"
   ```

   где `<команда>`:

   - JavaScript: `node main.js`
   - Python: `python3 main.py`
   - C++: `g++ main.cpp -O2 -std=c++17 -o main && ./main`
   - Java: `javac Main.java && java Main`

4. Ввод (`stdin`) передаётся в процесс контейнера через `child.stdin.write(...)`.

После завершения:

- временная папка удаляется;
- контейнер уничтожается (флаг `--rm`).

---

## Добавление нового языка

Чтобы добавить новый язык, нужно:

1. Расширить таблицу конфигураций в `backend/src/lib/executor/executor.ts`:

   ```ts
   const SUPPORTED_LANGUAGES = new Map<string, LanguageConfig>([
     // существующие
     ["js", { fileName: "main.js", command: "node main.js" }],
     ...
     // новый язык
     ["ruby", { fileName: "main.rb", command: "ruby main.rb" }]
   ]);
   ```

2. Убедиться, что нужный интерпретатор/компилятор установлен в `runner/Dockerfile`.
3. При необходимости добавить язык в селект на фронтенде.

---

## Переменные окружения

### Backend (`api`)

- `PORT` – порт WebSocket-сервера (по умолчанию `8080`);
- `HOST` – хост для WebSocket-сервера (по умолчанию `0.0.0.0`);
- `EXEC_BASE_DIR` – базовая директория для временных файлов внутри контейнера API  
  (по умолчанию `/code-runner`);
- `EXEC_VOLUME` – имя Docker-volume (по умолчанию `code-runner-data`).

### Frontend (`web`)

- `NEXT_PUBLIC_WS_URL` – URL WebSocket-сервера как его видит браузер  
  (по умолчанию `ws://localhost:8080`, в docker-compose выставляется `ws://api:8080`).

---

## Безопасность и ограничения

- Код выполняется в **отдельном контейнере**:
  - ограничение по памяти: `256m`;
  - ограничение по CPU: `--cpus 1`;
  - ограничение по количеству процессов: `--pids-limit 64`.
- **Сеть отключена**: `--network none`.
- Контейнер удаляется после выполнения: `--rm`.
- Все временные файлы хранятся в отдельном volume `code-runner-data` и чистятся после выполнения.

Этого достаточно для учебного / демонстрационного окружения. Для продакшена при необходимости можно добавить:
- таймауты по времени выполнения;
- более строгие лимиты ресурсов;
- отдельный docker-daemon / worker-нод для запуска кода.

---

## Структура репозитория

```text
.
├── backend/          # WebSocket API (Node.js + TypeScript)
│   ├── src/
│   │   ├── server.ts             # WebSocket-сервер
│   │   └── lib/executor/         # Логика запуска кода в Docker
│   └── Dockerfile
├── frontend/         # Next.js фронтенд с редактором кода
│   ├── components/CodeEditor/
│   ├── ui/
│   └── Dockerfile
├── runner/           # Dockerfile с рантаймами (Node, Python, G++, Java)
├── docker-compose.yml
└── README.md         # этот файл
```
