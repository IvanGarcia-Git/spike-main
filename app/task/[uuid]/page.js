"use client";
import TaskDetailComponent from "@/components/task-detail.section";

export default function TaskDetails({ params }) {
  return <TaskDetailComponent uuid={params.uuid} />;
}
