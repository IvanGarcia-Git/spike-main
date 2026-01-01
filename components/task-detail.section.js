"use client";
import { useState, useEffect, useRef } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { ModalTextarea, ModalActions, ModalButton } from "./base-modal.component";
import { toast } from "react-toastify";

export default function TaskDetailComponent({ uuid, onClose, onDelete }) {
  const [task, setTask] = useState(null);
  const [newComment, setNewComment] = useState({ text: "" });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const getTaskDetails = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`tasks/${uuid}`, jwtToken);

      if (response.ok) {
        const taskResponse = await response.json();
        setTask(taskResponse);
      } else {
        alert("Error cargando los detalles de la tarea");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    if (uuid) {
      getTaskDetails();
    }
  }, [uuid]);

  const handleDeleteTask = async () => {
    if (!uuid) return;

    setIsDeleting(true);
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch("DELETE", `tasks/${uuid}`, {}, jwtToken);

      if (response.ok) {
        toast.success("Tarea eliminada correctamente");
        if (onDelete) {
          onDelete();
        }
        onClose();
      } else {
        toast.error("Error al eliminar la tarea");
      }
    } catch (error) {
      console.error("Error eliminando la tarea:", error);
      toast.error("Error de red al eliminar la tarea");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.text.trim() && !file) return;

    setIsSubmitting(true);
    const jwtToken = getCookie("factura-token");

    const formData = new FormData();
    formData.append("text", newComment.text);
    if (file) {
      formData.append("taskCommentFile", file);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/task-comments/${uuid}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        setNewComment({ text: "" });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
        await getTaskDetails();
      } else {
        alert("Error al agregar el comentario");
      }
    } catch (error) {
      console.error("Error enviando el comentario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 rounded-full neumorphic-card-inset flex items-center justify-center mb-4">
          <span className="material-icons-outlined text-3xl text-primary animate-spin">
            sync
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400">Cargando tarea...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <span className="material-icons-outlined text-danger text-2xl">warning</span>
            <div className="flex-1">
              <p className="font-medium text-slate-800 dark:text-slate-200 mb-2">
                ¿Eliminar esta tarea?
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Esta acción no se puede deshacer. Se eliminarán también todos los comentarios asociados.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm rounded-lg neumorphic-button text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="px-3 py-1.5 text-sm rounded-lg bg-danger text-white hover:bg-red-600 transition-colors flex items-center gap-1"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-icons-outlined text-sm animate-spin">sync</span>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-outlined text-sm">delete</span>
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Título de la tarea */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            {task.subject}
          </h4>
          {task.description && (
            <p className="text-slate-600 dark:text-slate-400">
              {task.description}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 rounded-lg neumorphic-button text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Eliminar tarea"
        >
          <span className="material-icons-outlined">delete_outline</span>
        </button>
      </div>

      {/* Info en grid como el formulario de crear tarea */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Estado */}
        <div className="mb-4">
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
            Estado
          </label>
          <div className="px-4 py-3 rounded-lg neumorphic-card-inset">
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: task.taskState?.colorHex || "#57a9de",
                color: "#fff",
              }}
            >
              {task.taskState?.name || "Sin estado"}
            </span>
          </div>
        </div>

        {/* Fecha */}
        <div className="mb-4">
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
            Fecha de inicio
          </label>
          <div className="px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300">
            {task.startDate
              ? new Date(task.startDate).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Sin fecha definida"}
          </div>
        </div>

        {/* Destinatario o Contrato */}
        <div className="mb-4">
          <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
            {task.contractUrl ? "Contrato" : "Destinatario"}
          </label>
          <div className="px-4 py-3 rounded-lg neumorphic-card-inset">
            {task.contractUrl ? (
              <a
                href={task.contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:text-primary-dark font-medium transition-colors"
              >
                <span className="material-icons-outlined text-sm mr-1">description</span>
                Ver Ficha
              </a>
            ) : (
              <span className="text-slate-700 dark:text-slate-300">
                {task.assigneeUser?.name || "Sin asignar"}
                {task.assigneeUser?.firstSurname ? ` ${task.assigneeUser.firstSurname}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sección de Comentarios */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Comentarios
          </h5>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {task.comments?.length || 0} comentarios
          </span>
        </div>

        {task.comments && task.comments.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto mb-6 pr-2">
            {task.comments.map((comment, index) => (
              <div
                key={index}
                className="p-4 rounded-lg neumorphic-card-inset"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-primary">
                        {(comment.user?.name?.[0] || "U").toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">
                        {(comment.user?.name || "Usuario") +
                          " " +
                          (comment.user?.firstSurname || "")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  {comment.documentUri && (
                    <a
                      href={comment.documentUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg neumorphic-button text-slate-500 hover:text-primary transition-colors"
                      title="Descargar adjunto"
                    >
                      <span className="material-icons-outlined text-lg">download</span>
                    </a>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-300 ml-11">
                  {comment.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 mb-6 rounded-lg neumorphic-card-inset">
            <span className="material-icons-outlined text-4xl text-slate-400 dark:text-slate-500 mb-2 block">
              chat_bubble_outline
            </span>
            <p className="text-slate-500 dark:text-slate-400">No hay comentarios aún</p>
          </div>
        )}

        {/* Formulario de nuevo comentario */}
        <form onSubmit={handleSubmitComment}>
          <ModalTextarea
            label="Nuevo Comentario"
            id="newComment"
            value={newComment.text}
            onChange={(e) => setNewComment({ text: e.target.value })}
            placeholder="Escribe tu comentario aquí..."
            rows={3}
          />

          <div className="mb-4">
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2">
              Archivo adjunto
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
            {file && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </div>

          <ModalActions>
            <ModalButton variant="ghost" onClick={onClose}>
              Cerrar
            </ModalButton>
            <ModalButton
              variant="primary"
              type="submit"
              disabled={isSubmitting || (!newComment.text.trim() && !file)}
              icon={isSubmitting ? "sync" : "send"}
            >
              {isSubmitting ? "Enviando..." : "Enviar Comentario"}
            </ModalButton>
          </ModalActions>
        </form>
      </div>
    </div>
  );
}
