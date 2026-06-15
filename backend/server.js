const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5050;

function createTaskStore(initialTasks = []) {
  let tasks = [...initialTasks];

  return {
    getAll() {
      return tasks;
    },
    create(task) {
      tasks = [...tasks, task];
      return task;
    },
    update(updatedTask) {
      tasks = tasks.map((task) =>
        task.id === updatedTask.id
          ? {
              ...task,
              ...updatedTask,
              updatedAt: new Date().toISOString(),
            }
          : task
      );
      return tasks.find((task) => task.id === updatedTask.id);
    },
    move(movedTask) {
      tasks = tasks.map((task) =>
        task.id === movedTask.id
          ? {
              ...task,
              status: movedTask.status,
              updatedAt: new Date().toISOString(),
            }
          : task
      );
      return tasks.find((task) => task.id === movedTask.id);
    },
    delete(taskId) {
      tasks = tasks.filter((task) => task.id !== taskId);
      return taskId;
    },
  };
}

function createKanbanServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });
  const store = createTaskStore([
    {
      id: "seed-task-1",
      title: "Review incoming bugs",
      description: "Triage and prioritize the latest support requests.",
      status: "todo",
      priority: "High",
      category: "Bug",
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  app.get("/health", (_request, response) => {
    response.json({ ok: true, tasks: store.getAll().length });
  });

  io.on("connection", (socket) => {
    socket.emit("sync:tasks", store.getAll());

    socket.on("task:create", (task) => {
      const createdTask = store.create(task);
      io.emit("task:created", createdTask);
    });

    socket.on("task:update", (updatedTask) => {
      const task = store.update(updatedTask);
      if (task) {
        io.emit("task:updated", task);
      }
    });

    socket.on("task:move", (movedTask) => {
      const task = store.move(movedTask);
      if (task) {
        io.emit("task:moved", task);
      }
    });

    socket.on("task:delete", (taskId) => {
      store.delete(taskId);
      io.emit("task:deleted", taskId);
    });
  });

  return { app, io, server, store };
}

if (require.main === module) {
  const { server } = createKanbanServer();
  server.listen(PORT, () => {
    console.log(`Kanban WebSocket server running on port ${PORT}`);
  });
}

module.exports = {
  createKanbanServer,
  createTaskStore,
};
