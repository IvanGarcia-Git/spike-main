import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { authFetch, authGetFetch } from "@/helpers/server-fetch.helper";
import { AiOutlineDelete } from "react-icons/ai";
import { toast } from "react-toastify";
import Image from "next/image";
import DeleteFileModal from "./DeleteFileModal";
import { getCalendarDate } from "@/helpers/dates.helper";

function bytesToSize(bytes) {
  const KB = 1024;
  const MB = KB * 1024;

  if (bytes < MB) {
    return `${(bytes / KB).toFixed(2)} KB`;
  } else {
    return `${(bytes / MB).toFixed(2)} MB`;
  }
}

export default function SectionFiles({ files, setFiles, section }) {
  const jwtToken = getCookie("factura-token");
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFileUuid, setSelectedFileUuid] = useState(null);

  useEffect(() => {
    if (!section.name) return;
    const url = `files/${section.name}${
      section.folderParentId ? `?folderId=${section.folderParentId}` : ""
    }`;

    const fetchFiles = async () => {
      try {
        const response = await authGetFetch(url, jwtToken);
        if (!response.ok) throw new Error("Failed to fetch files");
        const data = await response.json();
        setFiles(data);
        setError("");
      } catch (error) {
        console.error("Error fetching files:", error);
        setError("Failed to load files. Please try again later.");
        setFiles([]);
      }
    };

    fetchFiles();
  }, [section, setFiles]);

  function openDeleteModal(uuid) {
    setIsDeleteModalOpen(true);
    setSelectedFileUuid(uuid);
  }

  function getFileType(file) {
    if (!file) return "unknown";

    const mimeType = file.mimetype?.toLowerCase() || file.mimeType?.toLowerCase();
    const mimeTypeMap = {
      "image/": "image",
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
      "application/vnd.ms-excel": "excel",
      "audio/": "mp3",
    };

    for (const [key, value] of Object.entries(mimeTypeMap)) {
      if (mimeType.startsWith(key) || mimeType === key) return value;
    }

    return "unknown";
  }

  async function confirmDeleteFile() {
    if (!selectedFileUuid) return;

    const response = await authFetch("DELETE", `files/${selectedFileUuid}`, undefined, jwtToken);

    if (!response.ok) {
      toast.error("Algo salió mal!", {
        position: "top-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      throw new Error("Failed to delete file");
    }

    toast.success("Archivo eliminado!", {
      position: "top-right",
      draggable: true,
      icon: false,
      hideProgressBar: false,
      autoClose: 5000,
      className: `transition-all transform hover:-translate-y-1 hover:shadow-l border border-gray-400`,
    });

    const updatedFiles = files.filter((file) => file.uuid !== selectedFileUuid);
    setFiles(updatedFiles);
    setIsDeleteModalOpen(false);
    setSelectedFileUuid(null);
  }

  return (
    <>
      <ul className="flex flex-col space-y-4 mt-5">
        {error && <p className="text-red-500">{error}</p>}

        {files?.length > 0 ? (
          files?.map((file) => (
            <li
              key={file.id}
              className="grid grid-cols-[32px_1fr_1fr_75px_1fr_50px] gap-4 items-center"
            >
              <Image
                className="rounded-full"
                src={`/${getFileType(file)}.png`}
                alt={`icon for ${getFileType(file)} files`}
                width={32}
                height={32}
              />
              <a
                className="overflow-hidden whitespace-nowrap text-ellipsis"
                href={file.uri}
                target="_blank"
              >
                <span>{file.name}</span>
              </a>
              <span> {getCalendarDate(file.createdAt)} </span>
              <span>{bytesToSize(file.size)}</span>
              <span className="overflow-hidden whitespace-nowrap text-ellipsis">
                {" "}
                {file.ownerEmail}{" "}
              </span>
              <AiOutlineDelete
                className="cursor-pointer text-red-500 hover:text-red-700"
                size={24}
                onClick={() => openDeleteModal(file.uuid)}
              />
            </li>
          ))
        ) : (
          <p>No hay archivos</p>
        )}
      </ul>

      {isDeleteModalOpen && (
        <DeleteFileModal
          onConfirm={confirmDeleteFile}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  );
}
