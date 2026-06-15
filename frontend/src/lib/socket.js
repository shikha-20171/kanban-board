import { io } from "socket.io-client";

export function createSocketClient(
  url = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5050"
) {
  return io(url, {
    transports: ["websocket"],
    autoConnect: true,
  });
}

export function registerSocketEvents(socket, handlers) {
  socket.on("sync:tasks", handlers.onSyncTasks);
  socket.on("task:created", handlers.onTaskCreated);
  socket.on("task:updated", handlers.onTaskUpdated);
  socket.on("task:moved", handlers.onTaskMoved);
  socket.on("task:deleted", handlers.onTaskDeleted);

  return () => {
    socket.off("sync:tasks", handlers.onSyncTasks);
    socket.off("task:created", handlers.onTaskCreated);
    socket.off("task:updated", handlers.onTaskUpdated);
    socket.off("task:moved", handlers.onTaskMoved);
    socket.off("task:deleted", handlers.onTaskDeleted);
  };
}
