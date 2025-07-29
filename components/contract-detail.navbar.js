import { FiFileText } from "react-icons/fi";
import { MdHistory } from "react-icons/md";
import { IoFootstepsOutline } from "react-icons/io5";
import { BsFileEarmarkPerson } from "react-icons/bs";

export default function ContractDetailNav({ activeSection, onSectionChange }) {
  return (
    <nav className="flex gap-8 mb-6">
      <button
        className={`flex items-center gap-2 pb-2 ${
          activeSection === "Detail"
            ? "text-black border-b-2 border-blue-500"
            : "text-gray-400 hover:text-black hover:border-b-2 hover:border-blue-400"
        }`}
        onClick={() => onSectionChange("Detail")}
      >
        <FiFileText
          size={24}
          className={
            activeSection === "Detail" ? "text-blue-400" : "text-gray-400"
          }
        />
        <span className="font-semibold">Detalle</span>
      </button>

      <button
        className={`flex items-center gap-2 pb-2 ${
          activeSection === "Activity"
            ? "text-black border-b-2 border-blue-500"
            : "text-gray-400 hover:text-black hover:border-b-2 hover:border-blue-400"
        }`}
        onClick={() => onSectionChange("Activity")}
      >
        <IoFootstepsOutline
          size={24}
          className={
            activeSection === "Activity" ? "text-blue-400" : "text-gray-400"
          }
        />
        <span className="font-semibold">Seguimiento</span>
      </button>

      <button
        className={`flex items-center gap-2 pb-2 ${
          activeSection === "Historic"
            ? "text-black border-b-2 border-blue-500"
            : "text-gray-400 hover:text-black hover:border-b-2 hover:border-blue-400"
        }`}
        onClick={() => onSectionChange("Historic")}
      >
        <MdHistory
          size={24}
          className={
            activeSection === "Historic" ? "text-blue-400" : "text-gray-400"
          }
        />
        <span className="font-semibold">Histórico</span>
      </button>


      <button
        className={`flex items-center gap-2 pb-2 ${
          activeSection === "Documents"
            ? "text-black border-b-2 border-blue-500"
            : "text-gray-400 hover:text-black hover:border-b-2 hover:border-blue-400"
        }`}
        onClick={() => onSectionChange("Documents")}
      >
        <BsFileEarmarkPerson
          size={24}
          className={
            activeSection === "Documents" ? "text-blue-400" : "text-gray-400"
          }
        />
        <span className="font-semibold">Documentación</span>
      </button>
    </nav>
  );
}
