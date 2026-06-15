# Real-Time Kanban Board

A full-stack Kanban board built with React, Socket.IO, Vitest, and Playwright. The app supports real-time task collaboration, drag-and-drop workflow updates, file attachments, task metadata, and live progress visualization.

## Features

- Create, update, delete, and move tasks between columns
- Real-time sync across connected clients with Socket.IO
- Three workflow columns:
  - To Do
  - In Progress
  - Done
- Drag-and-drop task movement
- Priority selection:
  - Low
  - Medium
  - High
- Category selection:
  - Bug
  - Feature
  - Enhancement
- Attachment uploads for images and PDFs
- Image preview for uploaded image files
- Invalid file type validation
- Live task progress metrics
- Recharts-based graph for:
  - Tasks by column
  - Completion split

## Tech Stack

### Frontend

- React
- Vite
- Socket.IO Client
- react-select
- Recharts
- Vitest
- React Testing Library
- Playwright

### Backend

- Node.js
- Express
- Socket.IO

## Project Structure

```text
websocket-kanban-vitest-playwright-2026-main
├── backend
│   ├── package.json
│   └── server.js
├── frontend
│   ├── package.json
│   ├── playwright.config.js
│   ├── vite.config.js
│   └── src
│       ├── App.jsx
│       ├── components
│       │   ├── KanbanBoard.css
│       │   └── KanbanBoard.jsx
│       ├── lib
│       │   ├── socket.js
│       │   └── taskUtils.js
│       ├── setupTests.js
│       └── tests
│           ├── e2e
│           │   └── KanbanBoard.e2e.test.js
│           ├── helpers
│           │   └── mockSocket.js
│           ├── integration
│           │   └── WebSocketIntegration.test.jsx
│           └── unit
│               └── KanbanBoard.test.jsx
└── README.md
```

## How It Works

### Backend

The backend runs a Socket.IO server and stores tasks in memory.

Implemented socket events:

- `sync:tasks`
- `task:create`
- `task:update`
- `task:move`
- `task:delete`

When a client connects, it receives the current task list through `sync:tasks`. Any task change is broadcast to all connected clients so the UI stays synchronized in real time.

### Frontend

The frontend renders the Kanban board and listens to socket events. Users can:

- add new tasks
- edit task content
- attach files
- update priority and category
- drag tasks between columns
- delete tasks

The progress section updates automatically whenever task data changes.

## Task Storage

Tasks are currently stored in memory on the backend.

Note:
- The original requirement allowed in-memory storage.
- MongoDB was mentioned as preferred, not mandatory.

## Ports

- Frontend: `3000`
- Backend: `5050`

The backend uses port `5050` because port `5000` was already occupied on this machine.

## Installation

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

## Run the Project

Open two terminals.

### Terminal 1: Start backend

```bash
cd backend
node server.js
```

### Terminal 2: Start frontend

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Available Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:e2e
```

### Backend

```bash
node server.js
```

## Testing

### Unit Tests

Unit tests cover:

- task creation
- task update
- task move
- task delete
- progress metrics
- file validation
- socket event registration cleanup

Run:

```bash
cd frontend
npm run test
```

### Integration Tests

Integration tests cover:

- syncing updates across multiple clients
- drag-and-drop state movement

### E2E Tests

Playwright test scenarios include:

- create task
- move task between columns
- real-time multi-client update
- update priority and category
- upload attachment
- delete task
- invalid file error
- graph metric updates

Run:

```bash
cd frontend
npm run test:e2e
```

## Verified Status

Verified locally in this project:

- `npm run lint`
- `npm run test`
- `npm run build`

Note:
- Playwright tests are implemented, but browser execution may depend on local environment setup.

## UI Highlights

- Responsive Kanban layout
- Real-time connection state indicator
- Clean card-based task design
- Visual progress metrics and charts
- Friendly task composer and editor flow

## Future Improvements

- Persist tasks in MongoDB
- Add user authentication
- Add multiple boards
- Add due dates and assignees
- Add task search and filters
- Add optimistic rollback/error toasts

## Summary

This project delivers a complete real-time Kanban board with clean component structure, reusable task utilities, WebSocket-based collaboration, attachment handling, and automated testing support.
