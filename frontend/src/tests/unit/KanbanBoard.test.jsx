import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import KanbanBoard from "../../components/KanbanBoard.jsx";
import {
  createTask,
  deleteTask,
  getProgressMetrics,
  moveTask,
  updateTask,
  validateAttachment,
} from "../../lib/taskUtils.js";
import { registerSocketEvents } from "../../lib/socket.js";

test("renders Kanban board title", () => {
  render(<KanbanBoard socketFactory={() => ({ on: vi.fn(), off: vi.fn(), disconnect: vi.fn() })} />);
  expect(screen.getByText("Kanban Board")).toBeInTheDocument();
});

test("task helpers add, update, move, and delete tasks", () => {
  const createdTask = createTask({
    title: "Write regression tests",
    description: "Cover the drag and drop flow",
  });

  expect(createdTask.title).toBe("Write regression tests");

  const updatedTasks = updateTask([createdTask], {
    ...createdTask,
    priority: "High",
  });
  expect(updatedTasks[0].priority).toBe("High");

  const movedTasks = moveTask(updatedTasks, createdTask.id, "done");
  expect(movedTasks[0].status).toBe("done");

  const deletedTasks = deleteTask(movedTasks, createdTask.id);
  expect(deletedTasks).toHaveLength(0);
});

test("progress metrics summarize the board", () => {
  const metrics = getProgressMetrics([
    createTask({ title: "Task 1", description: "", status: "todo" }),
    createTask({ title: "Task 2", description: "", status: "in-progress" }),
    createTask({ title: "Task 3", description: "", status: "done" }),
  ]);

  expect(metrics.total).toBe(3);
  expect(metrics.done).toBe(1);
  expect(metrics.completion).toBe(33);
});

test("unsupported attachments are rejected", () => {
  const file = new File(["bad"], "notes.txt", { type: "text/plain" });
  expect(validateAttachment(file)).toMatch(/Unsupported file format/i);
});

test("registerSocketEvents wires handlers and cleans them up", () => {
  const socket = {
    on: vi.fn(),
    off: vi.fn(),
  };
  const handlers = {
    onSyncTasks: vi.fn(),
    onTaskCreated: vi.fn(),
    onTaskUpdated: vi.fn(),
    onTaskMoved: vi.fn(),
    onTaskDeleted: vi.fn(),
  };

  const unsubscribe = registerSocketEvents(socket, handlers);

  expect(socket.on).toHaveBeenCalledTimes(5);

  unsubscribe();

  expect(socket.off).toHaveBeenCalledTimes(5);
});
