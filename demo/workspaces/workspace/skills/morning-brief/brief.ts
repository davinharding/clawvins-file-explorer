import { listTasks, postMessage } from "../../lib/mission-control";

type Bucket = "done" | "in-progress" | "blocked";

export async function morningBrief(since: Date) {
  const tasks = await listTasks({ updatedSince: since });
  const buckets = new Map<Bucket, string[]>();

  for (const task of tasks) {
    const key: Bucket = task.blocked ? "blocked" : task.status === "done" ? "done" : "in-progress";
    buckets.set(key, [...(buckets.get(key) ?? []), `• ${task.title} (${task.assignee})`]);
  }

  const sections = (["done", "in-progress", "blocked"] as const)
    .filter((k) => buckets.has(k))
    .map((k) => `*${k}*\n${buckets.get(k)!.join("\n")}`);

  await postMessage(sections.join("\n\n") || "Quiet night. Nothing to report.");
}
