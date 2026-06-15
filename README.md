# kanban-board

# WebSocket-Powered Kanban Board

A real-time Kanban Board application built with React, Node.js, Socket.IO, Vitest, React Testing Library, and Playwright. The application allows users to create, update, delete, and move tasks across workflow stages while synchronizing changes instantly across connected clients.

## Features

### Real-Time Collaboration

* Live task synchronization using Socket.IO
* Instant updates across multiple connected users
* Automatic task sync on client connection

### Task Management

* Create, update, and delete tasks
* Drag-and-drop task movement between columns
* Task priorities (Low, Medium, High)
* Task categories (Bug, Feature, Enhancement)

### File Attachments

* Upload images and documents
* Image preview support
* File validation and error handling

### Analytics Dashboard

* Task distribution by column
* Completion percentage visualization
* Dynamic chart updates in real-time

### Testing Coverage

* Unit Testing with Vitest
* Integration Testing with React Testing Library
* End-to-End Testing with Playwright

---

## Tech Stack

### Frontend

* React.js
* Socket.IO Client
* React DnD
* React Select
* Recharts / Chart.js
* Vitest
* React Testing Library
* Playwright

### Backend

* Node.js
* Express.js
* Socket.IO
* MongoDB (Optional)

---

## Project Structure

```bash
websocket-kanban-vitest-playwright
│
├── backend
│   ├── server.js
│   └── package.json
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── tests
│   │   │   ├── unit
│   │   │   ├── integration
│   │   │   └── e2e
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

---

## Installation

### Backend Setup

```bash
cd backend
npm install
npm start
```

Server runs on:

```bash
http://localhost:5050
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5050
```

---

## WebSocket Events

| Event       | Description               |
| ----------- | ------------------------- |
| task:create | Create a new task         |
| task:update | Update task details       |
| task:move   | Move task between columns |
| task:delete | Delete a task             |
| sync:tasks  | Sync tasks for new users  |

---

## Running Tests

### Unit & Integration Tests

```bash
npm run test
```

### Test Coverage

```bash
npm run coverage
```

### Playwright E2E Tests

```bash
npx playwright test
```

---

## Test Scenarios

### Kanban Board

* Create task
* Update task
* Delete task
* Drag and drop tasks
* Real-time synchronization

### Dropdown Testing

* Select priority
* Update category

### File Upload Testing

* Upload files
* Validate unsupported files
* Preview uploaded images

### Graph Testing

* Verify task counts
* Verify completion percentage
* Dynamic graph updates

---

## Future Improvements

* User Authentication
* Role-Based Access Control
* Activity Logs
* Notifications
* Cloud File Storage
* Team Workspaces

---

## Author

Shikha Gour

Full Stack Developer

React.js | Node.js | Express.js | MongoDB | Socket.IO | Testing

GitHub: https://github.com/shikha-20171
