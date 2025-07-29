import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
import { FaFolder } from "react-icons/fa";
import { CiUnlock, CiLock } from "react-icons/ci";
import FolderActionsMenu from "./FolderActionsMenu";

export default function SectionFolders({
  handleOpenFolder,
  folders,
  setFolders,
  section,
}) {
  const jwtToken = getCookie("factura-token");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!section.name) return;

    const url = `folders/${section.name}${
      section.folderParentId ? `?parentFolderId=${section.folderParentId}` : ""
    }`;

    const fetchFolders = async () => {
      try {
        const response = await authGetFetch(url, jwtToken);
        if (!response.ok) throw new Error("Failed to fetch folders");

        const data = await response.json();
        setFolders(data);
        setError("");
      } catch (error) {
        console.error("Error fetching folders:", error);
        setError("Failed to load folders. Please try again later.");
        setFolders([]);
      }
    };

    fetchFolders();
  }, [jwtToken, section, setFolders]);

  const handleLockFolder = async (folder) => {
    const folderData = { locked: !folder.locked };

    try {
      const response = await authFetch(
        "PATCH",
        `folders/${folder.uuid}`,
        folderData,
        jwtToken
      );
      if (!response.ok) throw new Error("Failed to lock/unlock folder");

      const data = await response.json();
      setFolders((prevFolders) =>
        prevFolders.map((mapFolder) =>
          mapFolder.uuid === folder.uuid
            ? { ...mapFolder, locked: !folder.locked }
            : mapFolder
        )
      );
    } catch (error) {
      console.error("Error locking folder:", error);
      setError("Failed to lock folder. Please try again later.");
    }
  };

  return (
    <ul className="flex flex-wrap gap-6 mt-5">
      {error && <p className="text-red-500">{error}</p>}

      {folders?.length > 0 ? (
        folders?.map((folder) => (
          <li
            key={folder.id}
            className="flex flex-1 min-w-48 max-w-48 sm:min-w-72 sm:max-w-72 gap-4 text-lg items-center bg-background py-4 px-7 sm:px-10 rounded-md cursor-pointer hover:bg-backgroundHover relative"
            onClick={() => handleOpenFolder(folder)}
          >
            <FaFolder className="text-gray-400 shrink-0" size={24} />
            <p className="overflow-hidden whitespace-nowrap text-ellipsis">
              {folder.name}
            </p>
            <FolderActionsMenu folder={folder} setFolders={setFolders} />
            {folder.locked ? (
              <CiLock
                onClick={(e) => {
                  e.stopPropagation();
                  handleLockFolder(folder);
                }}
                className="text-gray-900 absolute left-1 bottom-1 p-1 hover:bg-gray-300 rounded-md"
                size={24}
              />
            ) : (
              <CiUnlock
                onClick={(e) => {
                  e.stopPropagation();
                  handleLockFolder(folder);
                }}
                className="text-gray-900 absolute left-1 bottom-1 p-1 hover:bg-gray-300 rounded-md"
                size={24}
              />
            )}
          </li>
        ))
      ) : (
        <p>No hay carpetas</p>
      )}
    </ul>
  );
}