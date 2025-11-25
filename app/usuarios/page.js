"use client";

import { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import { FiEdit, FiTrash } from "react-icons/fi";
import UserModal from "@/components/new-user.modal";
import Link from "next/link";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loggedUserData, setLoggedUserData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const getUsers = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const payload = jose.decodeJwt(jwtToken);
      setLoggedUserData(payload);

      const response = await authGetFetch("users/visible-users", jwtToken);

      if (response.ok) {
        const usersData = await response.json();

        setUsers(usersData.users);
      } else {
        alert("Error al cargar los usuarios");
      }
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const handleDeleteUser = async (userUuid) => {
    const confirmDelete = confirm(
      "¿Estás seguro de que quieres eliminar este usuario?"
    );
    if (!confirmDelete) return;

    const confirmDelete2 = confirm(
      "Si este usuario tiene contratos creados, se perderán, ¿desea continuar?"
    );
    if (!confirmDelete2) return;

    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "DELETE",
        "users/",
        { userUuid },
        jwtToken
      );

      if (response.ok) {
        setUsers(users.filter((user) => user.uuid !== userUuid));
        alert("Usuario eliminado exitosamente");
      } else {
        alert("Error al eliminar el usuario");
      }
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
    }
  };

  const getRolePill = (user) => {
    if (user.isManager && user.groupId === loggedUserData.groupId) {
      return "Admin";
    } else if (user.isManager && user.groupId !== loggedUserData.groupId) {
      return "Supervisor";
    } else {
      return "Agente";
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.name} ${user.firstSurname}`.toLowerCase();
    const role = getRolePill(user).toLowerCase();
    return (
      fullName.includes(searchQuery) ||
      user.email.toLowerCase().includes(searchQuery) ||
      role.includes(searchQuery)
    );
  });

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    toggleModal();
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    toggleModal();
  };

  const handleSaveUser = async (dataFromModal) => {
    const jwtToken = getCookie("factura-token");
    const isFormDataFromModal = dataFromModal instanceof FormData;
    const userId = isFormDataFromModal ? dataFromModal.get("id") : dataFromModal.id;
    const userUuid = isFormDataFromModal ? dataFromModal.get("uuid") : dataFromModal.uuid;
    const isUpdating = !!userId && !!userUuid;

    if (!isUpdating) {
      let formDataForPost = new FormData();

      if (isFormDataFromModal) {
        formDataForPost = dataFromModal;
      } else {
        Object.keys(dataFromModal).forEach((key) => {
          if (
            dataFromModal[key] !== null &&
            dataFromModal[key] !== undefined &&
            key !== "id" &&
            key !== "uuid"
          ) {
            formDataForPost.append(key, dataFromModal[key]);
          }
        });
      }
      formDataForPost.delete("id");
      formDataForPost.delete("uuid");

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${jwtToken}` },
          body: formDataForPost,
        });
        if (response.ok) {
          const createdUser = await response.json();
          setUsers((prevUsers) => [...prevUsers, createdUser]);
          alert("Usuario creado con éxito");
        } else {
          const errorText = await response.text();
          console.error("Error creating user:", response.status, errorText);
          alert(`Error al crear el usuario: ${errorText || response.statusText}`);
        }
      } catch (error) {
        console.error("Network error during create:", error);
        alert(`Error de red o del servidor al crear el usuario: ${error.message}`);
      }
    } else {
      const formDataForPatch = new FormData();
      let userDataObjectForBackend = {};

      formDataForPatch.append("userUuid", userUuid);

      if (isFormDataFromModal) {
        dataFromModal.forEach((value, key) => {
          if (key === "userImage") {
            formDataForPatch.append("userImage", value);
          } else if (key !== "id" && key !== "uuid") {
            if (key === "isManager") {
              userDataObjectForBackend[key] = value === "true";
            } else {
              userDataObjectForBackend[key] = value;
            }
          }
        });
      } else {
        Object.keys(dataFromModal).forEach((key) => {
          if (key !== "id" && key !== "uuid") {
            userDataObjectForBackend[key] = dataFromModal[key];
          }
        });
      }

      if (
        userDataObjectForBackend.hasOwnProperty("password") &&
        !userDataObjectForBackend.password
      ) {
        delete userDataObjectForBackend.password;
      }

      formDataForPatch.append("userData", JSON.stringify(userDataObjectForBackend));

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${jwtToken}` },
          body: formDataForPatch,
        });
        if (response.ok) {
          const updatedUser = await response.json();
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
            )
          );
          alert("Usuario actualizado con éxito"); 
          window.location.reload()
        } else {
          const errorData = await response.text();
          console.error("Error response:", errorData);
          alert(`Error al editar el usuario: ${response.statusText}`); 
        }
      } catch (error) {
        console.error("Error al editar el usuario:", error);
        alert("Error de red o del servidor al editar el usuario.")
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Search and Add Button */}
      <div className="neumorphic-card p-6">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-sm bg-transparent text-slate-800 dark:text-slate-200"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <button
            onClick={handleCreateUser}
            className="px-5 py-3 rounded-lg neumorphic-button text-white bg-primary hover:bg-primary/90 font-medium"
          >
            Añadir usuario
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="neumorphic-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3 font-semibold">Nombre</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Rol</th>
                <th className="p-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="table-row-divider">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full neumorphic-card p-0.5 flex items-center justify-center mr-3">
                        <img
                          src={user.imageUri || "/avatar.png"}
                          alt={`${user.name} ${user.firstSurname}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                      <Link
                        href={`/perfil?uuid=${user.uuid}`}
                        className="font-medium text-slate-800 dark:text-slate-200 hover:text-primary transition"
                      >
                        {user.name} {user.firstSurname}
                      </Link>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {user.email}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        getRolePill(user) === "Admin"
                          ? "bg-red-500/20 text-red-600 dark:text-red-400"
                          : getRolePill(user) === "Supervisor"
                          ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {getRolePill(user)}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400"
                        onClick={() => handleEditUser(user)}
                      >
                        <span className="material-icons-outlined text-lg">edit</span>
                      </button>
                      <button
                        className="p-2 rounded-lg neumorphic-button text-slate-600 dark:text-slate-400"
                        onClick={() => handleDeleteUser(user.uuid)}
                      >
                        <span className="material-icons-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de creación/edición de usuario */}
      <UserModal
        isOpen={isModalOpen}
        onClose={toggleModal}
        onSave={handleSaveUser}
        userData={selectedUser}
      />
    </div>
  );
}
