import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";

export default function GroupUsersModal({
  isOpen,
  onClose,
  groupId,
  groupUsers,
  onUpdateGroupUsers,
}) {
  const [allUsers, setAllUsers] = useState([]);
  const [visibleUsersId, setVisibleUsersId] = useState([]);

  const getAllUsersList = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch(`users/all`, jwtToken);

      if (response.ok) {
        const users = await response.json();
        setAllUsers(users);
      } else {
        console.error("Error obteniendo listado de usuarios");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
    }
  };

  const handleUserToggle = async (userId, isChecked) => {
    const jwtToken = getCookie("factura-token");
    const endpoint = isChecked ? "groups/link-user" : "groups/unlink-user";
    const data = { groupId, userId };

    try {
      const response = await authFetch("POST", endpoint, data, jwtToken);

      if (response.ok) {
        const updatedVisibleUsersId = isChecked
          ? [...visibleUsersId, userId]
          : visibleUsersId.filter((id) => id !== userId);

        setVisibleUsersId(updatedVisibleUsersId);

        // Actualizar la lista de integrantes en el componente padre
        const updatedGroupUsers = allUsers
          .filter((user) => updatedVisibleUsersId.includes(user.id))
          .map((user) => ({
            userId: user.id,
            user: {
              id: user.id,
              name: user.name,
              firstSurname: user.firstSurname,
            },
          }));

        onUpdateGroupUsers(updatedGroupUsers);
      } else {
        console.error(
          `Error al ${isChecked ? "vincular" : "desvincular"} el usuario`
        );
      }
    } catch (error) {
      console.error(
        `Error en la solicitud al ${
          isChecked ? "vincular" : "desvincular"
        } usuario:`,
        error
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      getAllUsersList();
      const initialVisibleUsers = groupUsers.map((user) => user.userId);
      setVisibleUsersId(initialVisibleUsers);
    }
  }, [isOpen, groupUsers]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 lg:ml-72"
      onClick={onClose}
    >
      <div
        className="bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">Editar Integrantes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-auto">
          {allUsers.map((user) => (
            <div key={user.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`user-${user.id}`}
                className="mr-2"
                checked={visibleUsersId.includes(user.id)}
                onChange={(e) => handleUserToggle(user.id, e.target.checked)}
              />
              <label htmlFor={`user-${user.id}`} className="text-black">
                {`${user.name} ${user.firstSurname}`}
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
