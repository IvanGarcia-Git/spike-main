"use client";
import BaseModal from "./base-modal.component";
import TaskDetailComponent from "./task-detail.section";

export default function TaskDetailModal({ uuid, isOpen, onClose }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Tarea"
      maxWidth="max-w-3xl"
    >
      <TaskDetailComponent uuid={uuid} onClose={onClose} />
    </BaseModal>
  );
}
