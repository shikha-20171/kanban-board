import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { vi } from "vitest";

import KanbanBoard from "../../components/KanbanBoard";
import { createMockSocketFactory } from "../helpers/mockSocket";

beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => "blob:mock-file");
});

test("WebSocket updates sync state across multiple clients", async () => {
  const { socketFactory } = createMockSocketFactory();

  render(
    <div>
      <KanbanBoard socketFactory={socketFactory} />
      <KanbanBoard socketFactory={socketFactory} />
    </div>
  );

  const titleInputs = screen.getAllByLabelText("Task Title");
  const addButtons = screen.getAllByRole("button", { name: "Add Task" });

  fireEvent.change(titleInputs[0], { target: { value: "Shared roadmap" } });
  fireEvent.click(addButtons[0]);

  await waitFor(() => {
    expect(screen.getAllByText("Shared roadmap")).toHaveLength(2);
  });
});

test("drag and drop moves a task between columns and updates metrics", async () => {
  const initialTasks = [
    {
      id: "task-1",
      title: "Ship API docs",
      description: "Move this card to done.",
      status: "todo",
      priority: "Medium",
      category: "Feature",
      attachments: [],
    },
  ];
  const { socketFactory } = createMockSocketFactory(initialTasks);

  render(<KanbanBoard socketFactory={socketFactory} />);

  const todoColumn = await screen.findByTestId("column-todo");
  const doneColumn = await screen.findByTestId("column-done");
  const card = within(todoColumn).getByText("Ship API docs");

  fireEvent.dragStart(card, {
    dataTransfer: {
      setData: vi.fn(),
    },
  });

  fireEvent.drop(doneColumn, {
    dataTransfer: {
      getData: () => "task-1",
    },
  });

  await waitFor(() => {
    expect(within(doneColumn).getByText("Ship API docs")).toBeInTheDocument();
  });

  expect(screen.getByText("100% complete")).toBeInTheDocument();
});
