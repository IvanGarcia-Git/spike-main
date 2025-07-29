"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback, useState, Suspense } from "react";
import FileUpload from "@/components/drive/FileUpload";
import SectionFiles from "@/components/drive/SectionFiles";
import SectionFolders from "@/components/drive/SectionFolders";
import { TbFileReport, TbFile, TbFileCertificate, TbFileText } from "react-icons/tb";
import TabPrice from "./TabPrice";
import GlobalLoadingOverlay from "../global-loading.overlay";

const navbar = [
  { label: "Precios", section: "PricesSection" },
  { label: "Reciente", section: "recent", fileType: "private" },
  { label: "Archivos personales", section: "private", fileType: "private" },
  { label: "Archivos grupales", section: "shared", fileType: "shared" },
];

export default function DriveClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedSection, setSelectedSection] = useState({
    name: null,
    fileType: null,
  });
  const [files, setFiles] = useState(null);
  const [folders, setFolders] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    const folderParentId = searchParams.get("parentFolderId") || null;
    const section = searchParams.get("section") || null;
    if (section) {
      const selected = navbar.find((item) => item.label.toLowerCase() === section);
      if (selected) {
        setSelectedSection(() => ({
          name: selected.section,
          fileType: selected.fileType,
          folderParentId,
        }));
      }
    } else {
      setSelectedSection(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedSection && selectedSection.name !== undefined && selectedSection.name !== '') {
      setIsLoading(false);
    }
  }, [selectedSection]);

  const handleOpenFolder = (folder) => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedSection.name === "recent") {
      const newSection = folder.type === "private" ? "archivos personales" : "archivos grupales";
      params.set("section", newSection);
    }

    params.set("parentFolderId", folder.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="text-black px-4 sm:px-10 py-4">
      <div className="flex justify-between max-w-3xl p-2 mx-auto flex-wrap gap-y-2">
        {navbar.map((item, index) => (
          <button
            key={index}
            className={`flex items-center gap-2 pb-2 ${
              searchParams.get("section") === item.label.toLowerCase()
                ? "text-black border-b-2 border-blue-500"
                : "text-gray-400 hover:text-black hover:border-b-2 hover:border-blue-400"
            }`}
            onClick={() => {
              const params = new URLSearchParams();
              params.set("section", item.label.toLowerCase());
              router.replace(`${pathname}?${params.toString()}`);
            }}
          >
            {item.section === "recent" ? (
              <TbFileReport
                size={24}
                className={
                  searchParams.get("section") === item.label.toLowerCase()
                    ? "text-blue-400"
                    : "text-gray-400"
                }
              />
            ) : item.section === "shared" ? (
              <TbFileCertificate
                size={24}
                className={
                  searchParams.get("section") === item.label.toLowerCase()
                    ? "text-blue-400"
                    : "text-gray-400"
                }
              />
            ) : item.section === "private" ? (
              <TbFileText
                size={24}
                className={
                  searchParams.get("section") === item.label.toLowerCase()
                    ? "text-blue-400"
                    : "text-gray-400"
                }
              />
            ) : (
              <TbFile
                size={24}
                className={
                  searchParams.get("section") === item.label.toLowerCase()
                    ? "text-blue-400"
                    : "text-gray-400"
                }
              />
            )}

            <span className="font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
      {isLoading ? (
        <GlobalLoadingOverlay />
      ) : selectedSection.name === "PricesSection" ? (
        <main>
          <TabPrice />
        </main>
      ) : (
        <main>
          <FileUpload section={selectedSection} setFiles={setFiles} setFolders={setFolders} />

          <div className="mt-6">
            <h3 className="text-2xl font-bold">Carpetas</h3>
            <div className="mt-4">
              <SectionFolders
                handleOpenFolder={handleOpenFolder}
                folders={folders}
                setFolders={setFolders}
                section={selectedSection}
              />
            </div>
          </div>

          <div className="grid grid-cols-[32px_1fr_1fr_75px_1fr_50px] gap-4 mt-10 bg-background p-4">
            <span></span>
            <span>Nombre</span>
            <span>Fecha</span>
            <span>Tamaño</span>
            <span>Propietario</span>
            <span></span>
          </div>

          <SectionFiles files={files} setFiles={setFiles} section={selectedSection} />
        </main>
      )}
    </div>
  );
}
