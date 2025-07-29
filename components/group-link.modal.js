"use client";
import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";

export default function GroupLinkModal({
  isOpen,
  onClose,
  groupCampaigns,
  campaignId,
}) {
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchGroups();

      const preSelectedGroups = groupCampaigns.map(
        (campaign) => campaign.groupId
      );
      setSelectedGroups(preSelectedGroups);
    }
  }, [isOpen, groupCampaigns]);

  const fetchGroups = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("groups", jwtToken);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        alert("Error al obtener los grupos.");
      }
    } catch (error) {
      console.error("Error al obtener los grupos:", error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleCheckboxChange = async (groupId) => {
    const isSelected = selectedGroups.includes(groupId);
    const jwtToken = getCookie("factura-token");

    try {
      if (isSelected) {
        setSelectedGroups((prevSelected) =>
          prevSelected.filter((id) => id !== groupId)
        );
      } else {
        setSelectedGroups((prevSelected) => [...prevSelected, groupId]);
      }

      const payload = {
        groupId,
        campaignId,
        ...(isSelected && { unlink: true }),
      };

      const response = await authFetch(
        "POST",
        "campaigns/link-to-group",
        payload,
        jwtToken
      );

      if (!response.ok) {
        alert("Error al vincular o desvincular el grupo.");
        return;
      }

      alert(
        isSelected
          ? "Grupo desvinculado correctamente"
          : "Grupo vinculado correctamente"
      );
    } catch (error) {
      console.error("Error al vincular/desvincular el grupo:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center lg:ml-72">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Vincular a grupo</h3>
          <button onClick={onClose} className="text-gray-500">
            <FiX size={20} />
          </button>
        </div>
        <div className="mb-4 max-h-60 overflow-y-auto">
          {groups.map((groupData) => (
            <label key={groupData.group.id} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedGroups.includes(groupData.group.id)}
                onChange={() => handleCheckboxChange(groupData.group.id)}
                className="mr-2"
              />
              <span>{groupData.group.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
