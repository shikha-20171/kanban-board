function createSocket(server) {
  const listeners = new Map();

  return {
    on(eventName, callback) {
      const callbacks = listeners.get(eventName) ?? new Set();
      callbacks.add(callback);
      listeners.set(eventName, callbacks);
    },
    off(eventName, callback) {
      const callbacks = listeners.get(eventName);
      if (!callbacks) {
        return;
      }

      callbacks.delete(callback);
    },
    emit(eventName, payload) {
      server.handleEvent(eventName, payload);
    },
    disconnect() {
      trigger("disconnect");
    },
    trigger,
  };

  function trigger(eventName, payload) {
    const callbacks = listeners.get(eventName);
    if (!callbacks) {
      return;
    }

    callbacks.forEach((callback) => callback(payload));
  }
}

export function createMockSocketFactory(initialTasks = []) {
  const clients = [];
  let tasks = [...initialTasks];

  const server = {
    handleEvent(eventName, payload) {
      if (eventName === "task:create") {
        tasks = [...tasks, payload];
        broadcast("task:created", payload);
      }

      if (eventName === "task:update") {
        tasks = tasks.map((task) => (task.id === payload.id ? payload : task));
        broadcast("task:updated", payload);
      }

      if (eventName === "task:move") {
        tasks = tasks.map((task) => (task.id === payload.id ? payload : task));
        broadcast("task:moved", payload);
      }

      if (eventName === "task:delete") {
        tasks = tasks.filter((task) => task.id !== payload);
        broadcast("task:deleted", payload);
      }
    },
  };

  function broadcast(eventName, payload) {
    clients.forEach((client) => client.trigger(eventName, payload));
  }

  function socketFactory() {
    const socket = createSocket(server);
    clients.push(socket);
    queueMicrotask(() => {
      socket.trigger("connect");
      socket.trigger("sync:tasks", tasks);
    });
    return socket;
  }

  return {
    socketFactory,
    pushSync(nextTasks) {
      tasks = nextTasks;
      broadcast("sync:tasks", nextTasks);
    },
  };
}
