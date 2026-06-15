import React, { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./KanbanBoard.css";
import { createSocketClient, registerSocketEvents } from "../lib/socket";
import {
  buildAttachment,
  CATEGORY_OPTIONS,
  COLUMN_META,
  COLUMN_ORDER,
  createTask,
  getProgressMetrics,
  groupTasksByColumn,
  PRIORITY_OPTIONS,
  validateAttachment,
} from "../lib/taskUtils";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  category: "Feature",
};

const PRIORITY_SELECT_OPTIONS = PRIORITY_OPTIONS.map((priority) => ({
  value: priority,
  label: priority,
}));

const CATEGORY_SELECT_OPTIONS = CATEGORY_OPTIONS.map((category) => ({
  value: category,
  label: category,
}));

const SELECT_STYLES = {
  control: (base, state) => ({
    ...base,
    minHeight: 49,
    borderRadius: 14,
    borderColor: state.isFocused ? "#1b998b" : "rgba(23, 33, 33, 0.15)",
    boxShadow: state.isFocused ? "0 0 0 1px #1b998b" : "none",
    "&:hover": {
      borderColor: "#1b998b",
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 14,
    overflow: "hidden",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#1b998b"
      : state.isFocused
        ? "rgba(27, 153, 139, 0.12)"
        : "white",
    color: state.isSelected ? "white" : "#172121",
  }),
};

function getSelectOption(options, value) {
  return options.find((option) => option.value === value) ?? options[0];
}

function TaskCard({ task, onDelete, onStartEdit }) {
  return (
    <article
      className="task-card"
      data-testid={`task-card-${task.id}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/task-id", task.id);
      }}
    >
      <h4>{task.title}</h4>
      <p>{task.description || "No description provided yet."}</p>

      <div className="task-meta">
        <span className={`pill priority-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        <span className="pill category">{task.category}</span>
      </div>

      {task.attachments.length > 0 ? (
        <div className="attachment-list">
          {task.attachments.map((attachment) => (
            <a
              key={attachment.id}
              className="attachment-link"
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
            >
              {attachment.isImage ? (
                <img
                  className="attachment-preview"
                  src={attachment.url}
                  alt={attachment.name}
                />
              ) : (
                <span className="attachment-preview" aria-hidden="true" />
              )}
              <span>{attachment.name}</span>
            </a>
          ))}
        </div>
      ) : null}

      <div className="task-actions">
        <button
          className="ghost-button"
          type="button"
          onClick={() => onStartEdit(task)}
        >
          Edit
        </button>
        <button
          className="danger-button"
          type="button"
          onClick={() => onDelete(task.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function TaskEditor({
  draft,
  error,
  onChange,
  onFileChange,
  onCancel,
  onSave,
}) {
  return (
    <form className="editor-form" onSubmit={onSave}>
      <div className="field-group">
        <label htmlFor={`edit-title-${draft.id}`}>Title</label>
        <input
          id={`edit-title-${draft.id}`}
          value={draft.title}
          onChange={(event) => onChange("title", event.target.value)}
          required
        />
      </div>
      <div className="field-group">
        <label htmlFor={`edit-description-${draft.id}`}>Description</label>
        <textarea
          id={`edit-description-${draft.id}`}
          value={draft.description}
          onChange={(event) => onChange("description", event.target.value)}
        />
      </div>
      <div className="field-row">
        <div className="field-group">
          <label htmlFor={`edit-priority-${draft.id}`}>Priority</label>
          <Select
            inputId={`edit-priority-${draft.id}`}
            options={PRIORITY_SELECT_OPTIONS}
            value={getSelectOption(PRIORITY_SELECT_OPTIONS, draft.priority)}
            onChange={(option) => onChange("priority", option?.value ?? "Medium")}
            styles={SELECT_STYLES}
            classNamePrefix="react-select"
          />
        </div>
        <div className="field-group">
          <label htmlFor={`edit-category-${draft.id}`}>Category</label>
          <Select
            inputId={`edit-category-${draft.id}`}
            options={CATEGORY_SELECT_OPTIONS}
            value={getSelectOption(CATEGORY_SELECT_OPTIONS, draft.category)}
            onChange={(option) => onChange("category", option?.value ?? "Feature")}
            styles={SELECT_STYLES}
            classNamePrefix="react-select"
          />
        </div>
      </div>
      <div className="field-group">
        <label htmlFor={`edit-file-${draft.id}`}>Add Attachment</label>
        <input
          id={`edit-file-${draft.id}`}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
          onChange={onFileChange}
        />
      </div>
      {error ? <p className="error-message">{error}</p> : null}
      <div className="task-actions">
        <button className="secondary-button" type="submit">
          Save
        </button>
        <button className="ghost-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function KanbanBoard({ socketFactory = createSocketClient }) {
  const socketRef = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState("Connecting...");
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editingError, setEditingError] = useState("");
  const [dragOverColumn, setDragOverColumn] = useState(null);

  useEffect(() => {
    const socket = socketFactory();
    socketRef.current = socket;

    const syncTasks = (nextTasks) => {
      setTasks(nextTasks);
      setLoading(false);
    };

    const cleanUpSocketEvents = registerSocketEvents(socket, {
      onSyncTasks: syncTasks,
      onTaskCreated: (task) => {
        setTasks((currentTasks) => {
          if (currentTasks.some((currentTask) => currentTask.id === task.id)) {
            return currentTasks;
          }

          return [...currentTasks, task];
        });
        setLoading(false);
      },
      onTaskUpdated: (task) => {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            currentTask.id === task.id ? task : currentTask
          )
        );
      },
      onTaskMoved: (task) => {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            currentTask.id === task.id ? task : currentTask
          )
        );
      },
      onTaskDeleted: (taskId) => {
        setTasks((currentTasks) =>
          currentTasks.filter((currentTask) => currentTask.id !== taskId)
        );
      },
    });

    socket.on("connect", () => {
      setConnectionState("Live");
    });

    socket.on("connect_error", () => {
      setConnectionState("Offline demo mode");
      setLoading(false);
    });

    socket.on("disconnect", () => {
      setConnectionState("Reconnecting...");
    });

    return () => {
      cleanUpSocketEvents();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketFactory]);

  const groupedTasks = useMemo(() => groupTasksByColumn(tasks), [tasks]);
  const progress = useMemo(() => getProgressMetrics(tasks), [tasks]);
  const barChartData = useMemo(
    () =>
      COLUMN_ORDER.map((columnId) => ({
        name: COLUMN_META[columnId].title,
        count: progress.counts[columnId],
      })),
    [progress]
  );
  const completionChartData = useMemo(
    () => [
      { name: "Done", value: progress.done, color: "#1b998b" },
      {
        name: "Remaining",
        value: Math.max(progress.total - progress.done, 0),
        color: "#ffd166",
      },
    ],
    [progress]
  );

  function resetComposer() {
    setFormState(EMPTY_FORM);
    setAttachmentFile(null);
    setFormError("");
  }

  function handleCreateTask(event) {
    event.preventDefault();
    if (!formState.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    const attachmentError = validateAttachment(attachmentFile);
    if (attachmentError) {
      setFormError(attachmentError);
      return;
    }

    const attachments = attachmentFile ? [buildAttachment(attachmentFile)] : [];
    const task = createTask({
      ...formState,
      attachments,
    });

    setTasks((currentTasks) => [...currentTasks, task]);
    setLoading(false);
    setFormError("");
    resetComposer();
    socketRef.current?.emit?.("task:create", task);
  }

  function handleDeleteTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.filter((currentTask) => currentTask.id !== taskId)
    );
    socketRef.current?.emit?.("task:delete", taskId);
  }

  function handleStartEdit(task) {
    setEditingTaskId(task.id);
    setEditingDraft({ ...task });
    setEditingError("");
  }

  function handleSaveEdit(event) {
    event.preventDefault();
    if (!editingDraft.title.trim()) {
      setEditingError("Title is required.");
      return;
    }

    const nextTask = {
      ...editingDraft,
      title: editingDraft.title.trim(),
      description: editingDraft.description.trim(),
    };

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === nextTask.id ? nextTask : currentTask
      )
    );
    socketRef.current?.emit?.("task:update", nextTask);
    setEditingTaskId(null);
    setEditingDraft(null);
    setEditingError("");
  }

  function handleMoveTask(taskId, nextStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === taskId
          ? { ...currentTask, status: nextStatus }
          : currentTask
      )
    );

    const movedTask = tasks.find((task) => task.id === taskId);
    if (movedTask) {
      socketRef.current?.emit?.("task:move", {
        ...movedTask,
        status: nextStatus,
      });
    }
  }

  function handleEditAttachment(event) {
    const file = event.target.files?.[0];
    const attachmentError = validateAttachment(file);
    if (attachmentError) {
      setEditingError(attachmentError);
      return;
    }

    if (!file) {
      return;
    }

    setEditingDraft((currentDraft) => ({
      ...currentDraft,
      attachments: [...currentDraft.attachments, buildAttachment(file)],
    }));
    setEditingError("");
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Real-time workflow cockpit</span>
            <h1>Real-time Kanban Board</h1>
            <p>
              Create, update, move, and track tasks with live sync, attachment
              previews, and progress insights across the whole board.
            </p>
          </div>
          <div className="status-chip" data-testid="connection-state">
            {connectionState}
          </div>
        </section>

        <div className="dashboard-grid">
          <aside className="panel composer">
            <h2>Kanban Board</h2>
            <p className="hint-text">
              Add work items with priority, category, and attachments.
            </p>
            <form onSubmit={handleCreateTask}>
              <div className="field-group">
                <label htmlFor="task-title">Task Title</label>
                <input
                  id="task-title"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Ship a smoother drag-and-drop flow"
                />
              </div>
              <div className="field-group">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Add enough detail so anyone can pick it up."
                />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label htmlFor="task-priority">Priority</label>
                  <Select
                    inputId="task-priority"
                    options={PRIORITY_SELECT_OPTIONS}
                    value={getSelectOption(
                      PRIORITY_SELECT_OPTIONS,
                      formState.priority
                    )}
                    onChange={(option) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        priority: option?.value ?? "Medium",
                      }))
                    }
                    styles={SELECT_STYLES}
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="task-category">Category</label>
                  <Select
                    inputId="task-category"
                    options={CATEGORY_SELECT_OPTIONS}
                    value={getSelectOption(
                      CATEGORY_SELECT_OPTIONS,
                      formState.category
                    )}
                    onChange={(option) =>
                      setFormState((currentState) => ({
                        ...currentState,
                        category: option?.value ?? "Feature",
                      }))
                    }
                    styles={SELECT_STYLES}
                    classNamePrefix="react-select"
                  />
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="task-file">Attachment</label>
                <input
                  id="task-file"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
                  onChange={(event) => {
                    setAttachmentFile(event.target.files?.[0] ?? null);
                    setFormError("");
                  }}
                />
              </div>
              {formError ? <p className="error-message">{formError}</p> : null}
              <button className="primary-button" type="submit">
                Add Task
              </button>
            </form>
          </aside>

          <main className="board-layout">
            <section className="panel chart-panel">
              <div className="metrics-row">
                <article className="metric-card">
                  <span className="metric-label">Total Tasks</span>
                  <span className="metric-value" data-testid="metric-total">
                    {progress.total}
                  </span>
                </article>
                <article className="metric-card">
                  <span className="metric-label">To Do</span>
                  <span className="metric-value" data-testid="metric-todo">
                    {progress.counts.todo}
                  </span>
                </article>
                <article className="metric-card">
                  <span className="metric-label">In Progress</span>
                  <span
                    className="metric-value"
                    data-testid="metric-in-progress"
                  >
                    {progress.counts["in-progress"]}
                  </span>
                </article>
                <article className="metric-card">
                  <span className="metric-label">Done</span>
                  <span className="metric-value" data-testid="metric-done">
                    {progress.done}
                  </span>
                </article>
              </div>
              <div>
                <span className="metric-label">Completion</span>
                <strong data-testid="metric-completion">
                  {progress.completion}% complete
                </strong>
                <div className="progress-bar" aria-label="Completion progress">
                  <span style={{ width: `${progress.completion}%` }} />
                </div>
              </div>
              <div className="chart-grid">
                <div className="chart-card" data-testid="task-progress-chart">
                  <h3>Tasks by Column</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[12, 12, 0, 0]} fill="#172121" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card" data-testid="completion-chart">
                  <h3>Completion Split</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={completionChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={56}
                        outerRadius={88}
                        paddingAngle={4}
                      >
                        {completionChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="board-columns">
              {COLUMN_ORDER.map((columnId) => (
                <section className="panel column" key={columnId}>
                  <div className="column-header">
                    <h3>{COLUMN_META[columnId].title}</h3>
                    <span className="column-badge">
                      {groupedTasks[columnId].length}
                    </span>
                  </div>
                  <div
                    className={`task-list ${
                      dragOverColumn === columnId ? "is-over" : ""
                    }`}
                    data-testid={`column-${columnId}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragOverColumn(columnId);
                    }}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={(event) => {
                      event.preventDefault();
                      const taskId = event.dataTransfer.getData("text/task-id");
                      setDragOverColumn(null);
                      if (taskId) {
                        handleMoveTask(taskId, columnId);
                      }
                    }}
                  >
                    {loading ? (
                      <div className="loading-state">Loading tasks...</div>
                    ) : groupedTasks[columnId].length === 0 ? (
                      <div className="empty-state">
                        Drop a task here or create a new one.
                      </div>
                    ) : (
                      groupedTasks[columnId].map((task) =>
                        editingTaskId === task.id ? (
                          <article className="task-card" key={task.id}>
                            <TaskEditor
                              draft={editingDraft}
                              error={editingError}
                              onChange={(field, value) =>
                                setEditingDraft((currentDraft) => ({
                                  ...currentDraft,
                                  [field]: value,
                                }))
                              }
                              onFileChange={handleEditAttachment}
                              onCancel={() => {
                                setEditingTaskId(null);
                                setEditingDraft(null);
                                setEditingError("");
                              }}
                              onSave={handleSaveEdit}
                            />
                          </article>
                        ) : (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onDelete={handleDeleteTask}
                            onStartEdit={handleStartEdit}
                          />
                        )
                      )
                    )}
                  </div>
                </section>
              ))}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default KanbanBoard;
