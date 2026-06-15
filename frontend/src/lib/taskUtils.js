export const COLUMN_ORDER = ["todo", "in-progress", "done"];

export const COLUMN_META = {
  todo: { id: "todo", title: "To Do" },
  "in-progress": { id: "in-progress", title: "In Progress" },
  done: { id: "done", title: "Done" },
};

export const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
export const CATEGORY_OPTIONS = ["Bug", "Feature", "Enhancement"];
export const ALLOWED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export function createTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTask(input) {
  return {
    id: input.id ?? createTaskId(),
    title: input.title.trim(),
    description: input.description.trim(),
    status: input.status ?? "todo",
    priority: input.priority ?? "Medium",
    category: input.category ?? "Feature",
    attachments: input.attachments ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function updateTask(tasks, updatedTask) {
  return tasks.map((task) =>
    task.id === updatedTask.id
      ? {
          ...task,
          ...updatedTask,
          updatedAt: new Date().toISOString(),
        }
      : task
  );
}

export function deleteTask(tasks, taskId) {
  return tasks.filter((task) => task.id !== taskId);
}

export function moveTask(tasks, taskId, status) {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status,
          updatedAt: new Date().toISOString(),
        }
      : task
  );
}

export function groupTasksByColumn(tasks) {
  return COLUMN_ORDER.reduce((accumulator, columnId) => {
    accumulator[columnId] = tasks.filter((task) => task.status === columnId);
    return accumulator;
  }, {});
}

export function getProgressMetrics(tasks) {
  const groupedTasks = groupTasksByColumn(tasks);
  const total = tasks.length;
  const done = groupedTasks.done.length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);

  return {
    total,
    done,
    completion,
    counts: {
      todo: groupedTasks.todo.length,
      "in-progress": groupedTasks["in-progress"].length,
      done: groupedTasks.done.length,
    },
  };
}

export function buildAttachment(file) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    type: file.type,
    url: URL.createObjectURL(file),
    isImage: file.type.startsWith("image/"),
  };
}

export function validateAttachment(file) {
  if (!file) {
    return null;
  }

  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return "Unsupported file format. Please upload an image or PDF.";
  }

  return null;
}
