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
    <div className="flex flex-col justify-start items-center bg-background min-h-screen p-8">
      <div className="w-full max-w-6xl bg-foreground text-white p-6 rounded-lg overflow-x-auto">
        <div className="mb-4 flex items-center space-x-4">
          <input
            type="text"
            placeholder="Buscar..."
            className="flex-grow px-4 py-2 rounded bg-background text-black focus:outline-none"
            value={searchQuery}
            onChange={handleSearch}
          />
          <button
            onClick={handleCreateUser}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 whitespace-nowrap"
          >
            Añadir usuario
          </button>
        </div>

        <table className="min-w-full bg-foreground text-black">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-4 text-left"></th>
              <th className="px-4 py-4 text-left">Nombre</th>
              <th className="px-4 py-4 text-left">Email</th>
              <th className="px-4 py-4 text-left">Rol</th>
              <th className="px-4 py-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-300 divide-y divide-gray-600">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="bg-foreground hover:bg-background">
                <td className="px-4 py-4 text-black">
                  <img
                    src={user.imageUri || "/avatar.png"}
                    alt={`${user.name} ${user.firstSurname}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </td>

                <td className="px-4 py-4 text-black">
                  <Link href={`/perfil?uuid=${user.uuid}`} className="hover:underline">
                    {user.name} {user.firstSurname}
                  </Link>
                </td>

                <td className="px-4 py-4 text-black">{user.email}</td>

                <td className="px-4 py-4 text-black">
                  <span
                    className={`px-4 py-1 rounded-full text-sm ${
                      getRolePill(user) === "Admin"
                        ? "bg-red-700"
                        : getRolePill(user) === "Supervisor"
                        ? "bg-secondary"
                        : "bg-blue-800"
                    } text-white`}
                  >
                    {getRolePill(user)}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <button
                    className="text-blue-500 hover:text-blue-700 mr-4"
                    onClick={() => handleEditUser(user)}
                  >
                    <FiEdit size={22} />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteUser(user.uuid)}
                  >
                    <FiTrash size={22} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
