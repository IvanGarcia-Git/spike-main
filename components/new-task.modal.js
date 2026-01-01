import { useState, useEffect, useMemo } from "react";
import { getCookie } from "cookies-next";
import Select from "react-select";
import BaseModal, { ModalActions, ModalButton, ModalInput, ModalTextarea } from "./base-modal.component";

//TODO: General refactor
export default function NewTaskModal({
  isModalOpen,
  setIsModalOpen,
  onTaskCreated,
  contracts,
  initialTab = "task",
  taskStateName = null,
  selectedDate = null,
  onPreviewChange = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCups, setSelectedCups] = useState("");
  const [newTask, setNewTask] = useState({
    startDate: "",
    startTime: "",
    subject: "",
    initialComment: "",
  });

  const [newReminder, setNewReminder] = useState({
    subject: "",
    description: "",
    startDate: "",
  });

  const [newLeadCall, setNewLeadCall] = useState({
    subject: "",
    observations: "",
    startDate: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [taskStateId, setTaskStateId] = useState(null);

  const taskStates = {
    1: { name: "Por Hacer", colorHex: "#57a9de" },
    2: { name: "Haciendo", colorHex: "#f9d02d" },
    3: { name: "Hecho", colorHex: "#7ede57" },
    4: { name: "Falta Info", colorHex: "#ee4d3a" },
  };

  const cupsOptions = useMemo(() => {
    if (!contracts) return [];
    return contracts.map((contract) => ({
      value: contract.cups,
      label: contract.cups, // Puedes hacerlo más descriptivo si quieres, ej: `${contract.cups} - ${contract.customer.name}`
    }));
  }, [contracts]);

  // Update activeTab when initialTab prop changes (e.g., when opening from different buttons)
  useEffect(() => {
    if (isModalOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isModalOpen]);

  useEffect(() => {
    if (taskStateName) {
      const matchedState = Object.entries(taskStates).find(
        ([, state]) => state.name === taskStateName
      );
      if (matchedState) {
        setTaskStateId(Number(matchedState[0]));
      }
    }
  }, [taskStateName]);

  useEffect(() => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const hours = String(selectedDate.getHours()).padStart(2, "0");
      const minutes = String(selectedDate.getMinutes()).padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;
      const formattedTime = `${hours}:${minutes}`;

      setNewTask((prevTask) => ({
        ...prevTask,
        startDate: formattedDate,
        startTime: formattedTime,
      }));

      setNewReminder((prevReminder) => ({
        ...prevReminder,
        startDate: formattedDate,
      }));

      setNewLeadCall((prevLeadCall) => ({
        ...prevLeadCall,
        startDate: formattedDate,
      }));
    }
  }, [selectedDate]);

  // Emit preview changes to parent component
  useEffect(() => {
    if (!onPreviewChange) return;

    if (!isModalOpen) {
      onPreviewChange(null);
      return;
    }

    let previewData = null;

    if (activeTab === "task" && newTask.startDate && newTask.subject) {
      previewData = {
        type: "task",
        subject: newTask.subject,
        startDate: newTask.startDate,
        startTime: newTask.startTime,
        isPreview: true,
      };
    } else if (activeTab === "reminder" && newReminder.startDate && newReminder.subject) {
      previewData = {
        type: "reminder",
        subject: newReminder.subject,
        startDate: newReminder.startDate,
        isPreview: true,
      };
    } else if (activeTab === "leadCall" && newLeadCall.startDate && newLeadCall.subject) {
      previewData = {
        type: "leadCall",
        subject: newLeadCall.subject,
        startDate: newLeadCall.startDate,
        isPreview: true,
      };
    }

    onPreviewChange(previewData);
  }, [isModalOpen, activeTab, newTask, newReminder, newLeadCall, onPreviewChange]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    const formData = new FormData();
    formData.append("subject", newTask.subject);

    // Handle optional startDate: if no date, send empty; if date exists, combine with time (or use midnight)
    if (newTask.startDate) {
      const timeValue = newTask.startTime || "00:00";
      formData.append("startDate", `${newTask.startDate}T${timeValue}`);
    } else {
      // No date = no startDate (will be null in backend)
      formData.append("startDate", "");
    }

    formData.append("initialComment", newTask.initialComment);

    if (selectedFile) {
      formData.append("taskCommentFile", selectedFile);
    }

    if (taskStateId) {
      formData.append("taskStateId", taskStateId);
    }

    if (selectedCups) {
      const selectedContract = contracts.find((contract) => contract.cups === selectedCups);
      if (selectedContract) {
        const contractUrl = `${process.env.NEXT_PUBLIC_URL_CONTRACT}/contratos/${selectedContract.customer.uuid}/${selectedContract.uuid}`;
        formData.append("contractUrl", contractUrl);
      }
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        setNewTask({
          startDate: "",
          startTime: "",
          subject: "",
          initialComment: "",
        });
        setSelectedFile(null);
        onTaskCreated();
      } else {
        const errorData = await response.json();
        alert(`Error agregando la tarea: ${errorData.message || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    const formData = new FormData();
    formData.append("subject", newReminder.subject);
    formData.append("startDate", newReminder.startDate);
    formData.append("description", newReminder.description);

    if (selectedFile) {
      formData.append("reminderFile", selectedFile);
    }

    if (selectedCups) {
      const selectedContract = contracts.find((contract) => contract.cups === selectedCups);
      if (selectedContract) {
        const contractUrl = `${process.env.NEXT_PUBLIC_URL_CONTRACT}/contratos/${selectedContract.customer.uuid}/${selectedContract.uuid}`;
        formData.append("contractUrl", contractUrl);
      }
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reminders/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        setNewReminder({
          startDate: "",
          subject: "",
          description: "",
        });
        setSelectedFile(null);
        onTaskCreated();
      } else {
        const errorData = await response.json();
        alert(`Error agregando el recordatorio: ${errorData.message || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const handleAddLeadCall = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    const formData = new FormData();
    formData.append("startDate", newLeadCall.startDate);
    formData.append("observations", newLeadCall.observations);
    formData.append("subject", newLeadCall.subject);

    if (selectedCups) {
      const selectedContract = contracts.find((contract) => contract.cups === selectedCups);
      if (selectedContract) {
        const contractUrl = `${process.env.NEXT_PUBLIC_URL_CONTRACT}/contratos/${selectedContract.customer.uuid}/${selectedContract.uuid}`;
        formData.append("contractUrl", contractUrl);
      }
    }

    if (selectedFile) {
      formData.append("leadCallFile", selectedFile);
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lead-calls/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        setNewLeadCall({
          startDate: "",
          subject: "",
          observations: "",
        });
        setSelectedFile(null);
        onTaskCreated();
      } else {
        const errorData = await response.json();
        alert(`Error agregando la llamada: ${errorData.message || "Error desconocido"}`);
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  return (
    <BaseModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Crear nueva tarea"
      maxWidth="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex mb-6 border-b border-slate-200 dark:border-slate-700">
        <button
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "task"
              ? "border-b-2 border-primary text-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("task")}
          type="button"
        >
          Tarea
        </button>
        <button
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "reminder"
              ? "border-b-2 border-primary text-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("reminder")}
          type="button"
        >
          Recordatorio
        </button>
        <button
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === "leadCall"
              ? "border-b-2 border-primary text-primary"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          onClick={() => setActiveTab("leadCall")}
          type="button"
        >
          Llamada
        </button>
      </div>

      {activeTab === "task" && (
        <form onSubmit={handleAddTask}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <ModalInput
              label="Fecha Inicio (opcional)"
              type="date"
              id="startDate"
              value={newTask.startDate}
              onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
            />
            <ModalInput
              label="Hora Inicio (opcional)"
              type="time"
              id="startTime"
              value={newTask.startTime}
              onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
            />
          </div>

          <ModalInput
            label="Asunto"
            type="text"
            id="subject"
            value={newTask.subject}
            onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
            required
          />

          <div className="mb-4">
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2" htmlFor="cups">
              Seleccionar CUPS
            </label>
            <Select
              id="cups"
              options={cupsOptions}
              value={cupsOptions.find((option) => option.value === selectedCups)}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : "";
                setSelectedCups(value);
              }}
              placeholder="Seleccionar o buscar CUPS..."
              isClearable
              noOptionsMessage={() => "No se encontraron CUPS"}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: state.isFocused
                    ? "inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff"
                    : "inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                  minHeight: "48px",
                }),
                input: (base) => ({
                  ...base,
                  color: "#475569",
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "#475569",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#94a3b8",
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  borderRadius: "0.5rem",
                  zIndex: 9999,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "#f1f5f9" : "transparent",
                  color: "#475569",
                  cursor: "pointer",
                }),
              }}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: "#14b8a6",
                  primary25: "#f1f5f9",
                },
              })}
            />
          </div>

          <ModalTextarea
            label="Comentario"
            id="comments"
            value={newTask.initialComment}
            onChange={(e) => setNewTask({ ...newTask, initialComment: e.target.value })}
            rows={4}
          />

          <div className="mb-4">
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2" htmlFor="file">
              Archivo
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>

          <ModalActions>
            <ModalButton
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </ModalButton>
            <ModalButton
              variant="primary"
              type="submit"
              icon="add_task"
            >
              Crear Tarea
            </ModalButton>
          </ModalActions>
        </form>
      )}

      {/* REMINDERS */}

      {activeTab === "reminder" && (
        <form onSubmit={handleAddReminder}>
          <ModalInput
            label="Fecha Inicio"
            type="datetime-local"
            id="startDate"
            value={newReminder.startDate}
            onChange={(e) => setNewReminder({ ...newReminder, startDate: e.target.value })}
            required
          />

          <ModalInput
            label="Asunto"
            type="text"
            id="subject"
            value={newReminder.subject}
            onChange={(e) => setNewReminder({ ...newReminder, subject: e.target.value })}
            required
          />

          <div className="mb-4">
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2" htmlFor="cups">
              Seleccionar CUPS
            </label>
            <Select
              id="cups"
              options={cupsOptions}
              value={cupsOptions.find((option) => option.value === selectedCups)}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : "";
                setSelectedCups(value);
              }}
              placeholder="Seleccionar o buscar CUPS..."
              isClearable
              noOptionsMessage={() => "No se encontraron CUPS"}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: state.isFocused
                    ? "inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff"
                    : "inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                  minHeight: "48px",
                }),
                input: (base) => ({
                  ...base,
                  color: "#475569",
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "#475569",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#94a3b8",
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  borderRadius: "0.5rem",
                  zIndex: 9999,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "#f1f5f9" : "transparent",
                  color: "#475569",
                  cursor: "pointer",
                }),
              }}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: "#14b8a6",
                  primary25: "#f1f5f9",
                },
              })}
            />
          </div>

          <ModalTextarea
            label="Descripción"
            id="description"
            value={newReminder.description}
            onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
            rows={4}
          />

          <div className="mb-4">
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2" htmlFor="file">
              Archivo
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>

          <ModalActions>
            <ModalButton
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </ModalButton>
            <ModalButton
              variant="primary"
              type="submit"
              icon="alarm"
            >
              Crear Recordatorio
            </ModalButton>
          </ModalActions>
        </form>
      )}

      {/* LLAMADAS */}

      {activeTab === "leadCall" && (
        <form onSubmit={handleAddLeadCall}>
          <ModalInput
            label="Fecha Inicio"
            type="datetime-local"
            id="startDate"
            value={newLeadCall.startDate}
            onChange={(e) => setNewLeadCall({ ...newLeadCall, startDate: e.target.value })}
            required
          />

          <ModalInput
            label="Asunto"
            type="text"
            id="subject"
            value={newLeadCall.subject}
            onChange={(e) => setNewLeadCall({ ...newLeadCall, subject: e.target.value })}
            required
          />

          <div className="mb-4">
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2" htmlFor="cups">
              Seleccionar CUPS
            </label>
            <Select
              id="cups"
              options={cupsOptions}
              value={cupsOptions.find((option) => option.value === selectedCups)}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : "";
                setSelectedCups(value);
              }}
              placeholder="Seleccionar o buscar CUPS..."
              isClearable
              noOptionsMessage={() => "No se encontraron CUPS"}
              styles={{
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: state.isFocused
                    ? "inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff"
                    : "inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                  minHeight: "48px",
                }),
                input: (base) => ({
                  ...base,
                  color: "#475569",
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "#475569",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#94a3b8",
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  borderRadius: "0.5rem",
                  zIndex: 9999,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "#f1f5f9" : "transparent",
                  color: "#475569",
                  cursor: "pointer",
                }),
              }}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: "#14b8a6",
                  primary25: "#f1f5f9",
                },
              })}
            />
          </div>

          <ModalTextarea
            label="Observaciones"
            id="observations"
            value={newLeadCall.observations}
            onChange={(e) => setNewLeadCall({ ...newLeadCall, observations: e.target.value })}
            rows={4}
          />

          <div className="mb-4">
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-2" htmlFor="file">
              Archivo
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>

          <ModalActions>
            <ModalButton
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </ModalButton>
            <ModalButton
              variant="primary"
              type="submit"
              icon="phone"
            >
              Crear Llamada
            </ModalButton>
          </ModalActions>
        </form>
      )}
    </BaseModal>
  );
}
