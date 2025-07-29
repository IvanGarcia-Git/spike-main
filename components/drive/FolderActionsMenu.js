import { useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";
import { FiEdit3 } from "react-icons/fi";
import { toast } from "react-toastify";
import { getCookie } from "cookies-next";
import { authFetch } from "@/helpers/server-fetch.helper";
import RenameFolderModal from "./RenameFolderModal";
import DeleteFolderModal from "./DeleteFolderModal";

export default function FolderActionsMenu({ folder, setFolders }) {
  const jwtToken = getCookie("factura-token");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDeleteFolder = async () => {
    try {
      const response = await authFetch("DELETE", `folders/${folder.uuid}`, undefined, jwtToken);

      if (!response.ok) {
        const message = await response.json();
        toast.error(message.message, {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        throw new Error("Failed to delete folder");
      }

      setFolders((prevFolders) => prevFolders.filter((f) => f.uuid !== folder.uuid));

      toast.success("Carpeta eliminada!", {
        position: "top-right",
        draggable: true,
        icon: false,
        hideProgressBar: false,
        autoClose: 5000,
        className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
      });

      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const handleRenameFolder = async (folder) => {
    const folderData = { name: folder.name };

    try {
      const response = await authFetch("PATCH", `folders/${folder.uuid}`, folderData, jwtToken);
      if (!response.ok) throw new Error("Failed to rename folder");

      setFolders((prevFolders) =>
        prevFolders.map((mapFolder) =>
          mapFolder.uuid === folder.uuid ? { ...mapFolder, name: folder.name } : mapFolder
        )
      );
      setRenameModalOpen(false);
    } catch (error) {
      console.error("Error renaming folder:", error);
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <BsThreeDots
        onClick={handleMenuToggle}
        size={24}
        className="text-gray-400 absolute right-1 top-1 p-1 hover:bg-gray-300 hover:text-gray-900 rounded-md cursor-pointer"
      />

      {isMenuOpen && (
        <div
          className="absolute top-8 right-0 bg-white border border-gray-300 rounded-lg shadow-md w-40 z-10"
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <ul className="flex flex-col">
            <li
              className="flex gap-2 items-center p-2 hover:bg-gray-100 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setRenameModalOpen(true);
              }}
            >
              <FiEdit3 className="text-gray-600" size={20} />
              Renombrar
            </li>

            <li
              className="flex gap-2 items-center p-2 hover:bg-gray-100 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModalOpen(true);
              }}
            >
              <AiOutlineDelete className="text-gray-600" size={20} />
              <label htmlFor="file-upload" className="cursor-pointer">
                Eliminar
              </label>
            </li>
          </ul>
        </div>
      )}

      {renameModalOpen && (
        <RenameFolderModal
          onConfirm={handleRenameFolder}
          onCancel={() => setRenameModalOpen(false)}
          folder={folder}
        />
      )}

      {deleteModalOpen && (
        <DeleteFolderModal
          onConfirm={handleDeleteFolder}
          onCancel={() => setDeleteModalOpen(false)}
        />
      )}
    </>
  );
}
