"use client";
import { useState, useEffect, useRef } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import * as jose from "jose";

export default function UserMultiSelect({
  selectedUserIds,
  onSelectionChange,
  currentUserId,
}) {
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    checkUserRole();
    fetchVisibleUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkUserRole = () => {
    const jwtToken = getCookie("factura-token");
    if (!jwtToken) return;
    try {
      const payload = jose.decodeJwt(jwtToken);
      setIsManager(payload.isManager || false);
    } catch (error) {
      console.error("Error decodificando token:", error);
    }
  };

  const fetchVisibleUsers = async () => {
    const jwtToken = getCookie("factura-token");
    if (!jwtToken) return;

    try {
      // Decode token to check if manager
      const payload = jose.decodeJwt(jwtToken);
      const isUserManager = payload.isManager || false;

      // Use appropriate endpoint based on role
      const endpoint = isUserManager ? "users/visible-users" : "users/agent-visible-users";
      const response = await authGetFetch(endpoint, jwtToken);

      if (response.ok) {
        const data = await response.json();
        // Response contains { users: [], count: number }
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching visible users:", error);
    }
  };

  const handleToggleUser = (userId) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId];

    // Ensure at least one user is always selected (current user)
    if (newSelection.length === 0) {
      newSelection.push(currentUserId);
    }

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const allUserIds = [currentUserId, ...users.map((u) => u.id)];
    onSelectionChange([...new Set(allUserIds)]);
  };

  const handleSelectOnlyMe = () => {
    onSelectionChange([currentUserId]);
  };

  const getSelectedCount = () => {
    return selectedUserIds.length;
  };

  const getDisplayText = () => {
    if (selectedUserIds.length === 1 && selectedUserIds[0] === currentUserId) {
      return "Mi agenda";
    }
    if (selectedUserIds.length === users.length + 1) {
      return "Todos los usuarios";
    }
    return `${selectedUserIds.length} usuario${selectedUserIds.length > 1 ? "s" : ""}`;
  };

  // Only show if there are other users to select
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 neumorphic-button rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
      >
        <span className="material-icons-outlined text-base">people</span>
        <span>{getDisplayText()}</span>
        <span className="material-icons-outlined text-sm">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 neumorphic-card rounded-lg shadow-lg z-50 p-2">
          {/* Quick actions */}
          <div className="flex gap-2 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={handleSelectOnlyMe}
              className="flex-1 px-2 py-1 text-xs neumorphic-button rounded text-slate-600 dark:text-slate-300 hover:text-primary"
            >
              Solo yo
            </button>
            <button
              onClick={handleSelectAll}
              className="flex-1 px-2 py-1 text-xs neumorphic-button rounded text-slate-600 dark:text-slate-300 hover:text-primary"
            >
              Todos
            </button>
          </div>

          {/* User list */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {/* Current user always first */}
            <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedUserIds.includes(currentUserId)}
                onChange={() => handleToggleUser(currentUserId)}
                className="w-4 h-4 text-primary rounded focus:ring-primary"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Mi agenda
              </span>
            </label>

            {/* Divider if there are other users */}
            {users.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
            )}

            {/* Other visible users */}
            {users
              .filter((user) => user.id !== currentUserId)
              .map((user) => (
                <label
                  key={user.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => handleToggleUser(user.id)}
                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {user.name} {user.firstSurname}
                  </span>
                </label>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
