"use client";
import { useState, useEffect } from "react";
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

      const preSelectedGroups = (groupCampaigns || []).map(
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="modal-card p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full neumorphic-button flex items-center justify-center">
              <span className="material-icons-outlined text-primary">group</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              Vincular a Grupo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>

        {/* Lista de grupos */}
        <div className="mb-6 max-h-64 overflow-y-auto space-y-2 pr-2">
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-icons-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2 block">
                folder_off
              </span>
              <p className="text-slate-500 dark:text-slate-400">No hay grupos disponibles</p>
            </div>
          ) : (
            groups.map((groupData) => (
              <label
                key={groupData.group.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedGroups.includes(groupData.group.id)
                    ? "neumorphic-card-inset"
                    : "neumorphic-card hover:scale-[1.01]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(groupData.group.id)}
                  onChange={() => handleCheckboxChange(groupData.group.id)}
                  className="w-5 h-5"
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {groupData.group.name}
                </span>
              </label>
            ))
          )}
        </div>

        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="w-full neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
