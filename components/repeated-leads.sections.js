import React, { useState, useEffect } from "react";
import { FaCircle } from "react-icons/fa";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";

export default function RepeatedLeads() {
  const [repeatedLeads, setRepeatedLeads] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [assigningPhoneNumber, setAssigningPhoneNumber] = useState(null);

  const groupLeadsByPhoneNumber = (leads) => {
    const grouped = leads.reduce((acc, lead) => {
      const { phoneNumber, campaign, uuid } = lead;

      if (!acc[phoneNumber]) {
        acc[phoneNumber] = {
          phoneNumber,
          campaigns: [],
          leadUuids: [],
        };
      }

      acc[phoneNumber].campaigns.push(campaign?.name || "Sin campaña");
      acc[phoneNumber].leadUuids.push(uuid);

      return acc;
    }, {});

    return Object.values(grouped);
  };

  const getAllUsers = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authGetFetch("users/all", jwtToken);

      if (response.ok) {
        const responseJson = await response.json();
        setAllUsers(responseJson);
      } else {
        console.error("Error cargando la información de los usuarios");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    const fetchRepeatedLeads = async () => {
      const jwtToken = getCookie("factura-token");
      const response = await authGetFetch("leads/repeated/entries", jwtToken);

      if (response.ok) {
        const data = await response.json();
        setRepeatedLeads(groupLeadsByPhoneNumber(data));
      } else {
        console.error("Error fetching repeated leads.");
      }
    };

    fetchRepeatedLeads();
    getAllUsers();
  }, []);

  const handleShowAgain = async (leadUuids) => {
    const jwtToken = getCookie("factura-token");

    let response;

    for (const leadUuid of leadUuids) {
      response = await authFetch(
        "PATCH",
        `leads/${leadUuid}`,
        { leadStateId: null },
        jwtToken
      );
    }

    if (response.ok) {
      alert("Lead/s actualizados correctamente");
    } else {
      alert("Error actualizando el estado del lead");
    }
  };

  const handleAssignTo = async (userToAssignId, leadUuid) => {
    const jwtToken = getCookie("factura-token");

    try {
      const response = await authFetch(
        "POST",
        "leads/assign-to-queue",
        { userId: userToAssignId, leadUuid },
        jwtToken
      );

      if (response.ok) {
        alert("Lead actualizado correctamente");
        window.location.reload();
      } else {
        alert("Error al actualizar el Lead");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  return (
    <div className="bg-foreground p-4 rounded-md text-black">
      {repeatedLeads.map((entry, index) => (
        <div key={index} className="mb-4 hover:bg-background p-2 rounded">
          <div className="flex items-center justify-between my-2">
            <div className="flex items-center">
              <FaCircle className="text-red-500 mr-2" size={12} />
              <span className="text-lg">
                El registro <strong>{entry.phoneNumber}</strong> se encuentra en{" "}
                <strong className="text-red-500">
                  {entry.campaigns.length}
                </strong>{" "}
                campañas: <strong>{entry.campaigns.join(", ")}</strong>.
              </span>
            </div>
            <div className="flex gap-2">
              {/* Botón Relanzar */}
              <button
                onClick={() => handleShowAgain(entry.leadUuids)}
                className="w-20 h-10 px-1 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm text-center"
              >
                Relanzar
              </button>
              {/* Botón Asignar a */}
              {assigningPhoneNumber === entry.phoneNumber ? (
                <select
                  className="w-28 h-10 px-2 py-1 bg-gray-100 border rounded-md text-sm"
                  onChange={(e) =>
                    handleAssignTo(e.target.value, entry.leadUuids[0])
                  }
                >
                  <option value="">Selecciona un usuario</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.firstSurname}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setAssigningPhoneNumber(entry.phoneNumber)}
                  className="w-24 h-10 px-2 py-1 bg-secondaryHover text-white rounded-md hover:bg-secondary text-sm"
                >
                  Asignar a
                </button>
              )}
            </div>
          </div>
          {index < repeatedLeads.length - 1 && (
            <hr className="border-t border-gray-300 my-2" />
          )}
        </div>
      ))}
    </div>
  );
}
