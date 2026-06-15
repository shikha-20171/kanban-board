import { test, expect } from "@playwright/test";

test("User can add a task and see it on the board", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Real-time Kanban Board")).toBeVisible();

  await page.getByLabel("Task Title").fill("Playwright task");
  await page.getByLabel("Description").fill("Verify create flow");
  await page.getByRole("button", { name: "Add Task" }).click();

  await expect(page.getByText("Playwright task")).toBeVisible();
});

test("User can drag and drop a task between columns", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Task Title").fill("Drag me");
  await page.getByRole("button", { name: "Add Task" }).click();

  await page.getByTestId(/task-card-/).filter({ hasText: "Drag me" }).dragTo(
    page.getByTestId("column-done")
  );

  await expect(page.getByTestId("column-done").getByText("Drag me")).toBeVisible();
});

test("UI updates in real time when another user modifies tasks", async ({ browser }) => {
  const pageOne = await browser.newPage();
  const pageTwo = await browser.newPage();

  await pageOne.goto("/");
  await pageTwo.goto("/");

  await pageOne.getByLabel("Task Title").fill("Synced story");
  await pageOne.getByRole("button", { name: "Add Task" }).click();

  await expect(pageTwo.getByText("Synced story")).toBeVisible();

  await pageOne.close();
  await pageTwo.close();
});

test("User can update dropdowns, upload files, and remove tasks", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Task Title").fill("Attachment task");
  await page.getByRole("button", { name: "Add Task" }).click();

  const card = page.getByTestId(/task-card-/).filter({ hasText: "Attachment task" });
  await card.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Priority").last().click();
  await page.getByRole("option", { name: "High" }).click();
  await page.getByLabel("Category").last().click();
  await page.getByRole("option", { name: "Bug" }).click();
  await page
    .getByLabel("Add Attachment")
    .setInputFiles({
      name: "preview.png",
      mimeType: "image/png",
      buffer: Buffer.from("mock-image"),
    });
  await page.getByRole("button", { name: "Save" }).click();

  await expect(card.getByText("High")).toBeVisible();
  await expect(card.getByText("Bug")).toBeVisible();
  await expect(card.getByText("preview.png")).toBeVisible();

  await card.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Attachment task")).toHaveCount(0);
});

test("Invalid files show an error message and graph metrics update", async ({ page }) => {
  await page.goto("/");

  const totalBefore = Number(await page.getByTestId("metric-total").textContent());

  await page.getByLabel("Task Title").fill("Chart task");
  await page.getByRole("button", { name: "Add Task" }).click();
  await expect(page.getByText("Chart task")).toBeVisible();
  await expect(page.getByTestId("metric-total")).toHaveText(String(totalBefore + 1));

  await page
    .getByLabel("Attachment")
    .setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("bad-file"),
    });
  await page.getByRole("button", { name: "Add Task" }).click();

  await expect(page.getByText(/Unsupported file format/i)).toBeVisible();

  await page.getByTestId(/task-card-/).filter({ hasText: "Chart task" }).dragTo(
    page.getByTestId("column-done")
  );
  await expect(page.getByTestId("metric-done")).not.toHaveText("0");
  await expect(page.getByTestId("metric-completion")).toContainText("% complete");
});
