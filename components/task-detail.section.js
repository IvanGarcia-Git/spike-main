"use client";
import { useState, useEffect, useRef } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import { FaDownload } from "react-icons/fa6";

export default function TaskDetailComponent({ uuid }) {
  const [task, setTask] = useState(null);
  const [newComment, setNewComment] = useState({
    text: "",
  });
  const [file, setFile] = useState(null);
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
    getTaskDetails();
  }, [uuid]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
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
        fileInputRef.current.value = null;

        await getTaskDetails();
      } else {
        alert("Error al agregar el comentario");
      }
    } catch (error) {
      console.error("Error enviando el comentario:", error);
    }
  };

  if (!task) {
    return (
      <div className="flex justify-center items-start bg-background min-h-screen">
        <div className="w-full max-w-7xl bg-foreground text-black p-6 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start bg-background">
      <div className="w-full max-w-5xl bg-foreground text-black p-6 rounded-lg ">
        {/* Encabezado centrado */}
        <div className="flex justify-center mb-6">
          <h2 className="text-3xl font-bold text-center">{task.subject}</h2>
        </div>

        {/* Estado, Fecha y Destinatario en 3 columnas */}
        <div className="grid grid-cols-3 gap-6 text-lg mb-6">
          <div className="text-center">
            <span
              className="px-4 py-1 rounded-full text-lg font-semibold"
              style={{
                backgroundColor: task.taskState.colorHex,
                color: "#fff",
              }}
            >
              {task.taskState.name}
            </span>
          </div>

          <div className="text-center">
            <p>
              <strong>Fecha de inicio:</strong>{" "}
              {new Date(task.startDate).toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            {task.contractUrl ? (
              <a
                href={task.contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:text-green-700 py-1 px-4 border border-green-500 rounded-full"
              >
                Ver Ficha
              </a>
            ) : (
              <p>
                <strong>Destinatario:</strong> {task.assigneeUser.name}
                {" " + task.assigneeUser.firstSurname}
              </p>
            )

            }

          </div>
        </div>

        {/* Tabla de comentarios */}
        <div className="border-t-2 pt-4">
          <h3 className="text-2xl font-bold mb-4">Comentarios</h3>

          {task.comments.length > 0 ? (
            <table className="min-w-full bg-foreground text-black">
              <thead className="bg-background">
                <tr>
                  <th className="py-2 px-4">Fecha</th>
                  <th className="py-2 px-4">Usuario</th>
                  <th className="py-2 px-4">Comentario</th>
                  <th className="py-2 px-4">Adjunto</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 divide-y divide-gray-600">
                {task.comments.map((comment, index) => (
                  <tr key={index} className="bg-foreground hover:bg-background">
                    <td className="py-2 px-4 text-center text-black">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 text-center text-black">
                      {(comment.user?.name || "Usuario desconocido") +
                        " " +
                        (comment.user?.firstSurname || "")}
                    </td>
                    <td className="py-2 px-4 text-center text-black">
                      {comment.text}
                    </td>
                    <td className="py-2 px-4 text-center flex justify-center items-center text-black">
                      {comment.documentUri ? (
                        <a
                          href={comment.documentUri}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaDownload />
                        </a>
                      ) : (
                        <span>No hay adjunto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay comentarios para esta tarea.</p>
          )}
        </div>

        {/* Nuevo comentario */}
        <div className="border-t-2 pt-4 mt-6">
          <h3 className="text-2xl font-bold mb-2">+ Nuevo Comentario</h3>
          <textarea
            placeholder="Escribe aquí..."
            value={newComment.text}
            onChange={(e) =>
              setNewComment({ ...newComment, text: e.target.value })
            }
            className="w-full p-3 rounded-md border border-gray-300 mb-4 focus:outline-none focus:ring"
            rows="4"
          ></textarea>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
            className="mb-4"
          />

          <div className="flex justify-end">
            <button
              className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondaryHover"
              onClick={handleSubmitComment}
            >
              Comentar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
