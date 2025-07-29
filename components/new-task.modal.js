import { useState, useEffect, useMemo } from "react";
import { getCookie } from "cookies-next";
import Select from "react-select";

//TODO: General refactor
export default function NewTaskModal({
  isModalOpen,
  setIsModalOpen,
  onTaskCreated,
  contracts,
  initialTab = "task",
  taskStateName = null,
  selectedDate = null,
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    const jwtToken = getCookie("factura-token");

    const formData = new FormData();
    formData.append("subject", newTask.subject);
    formData.append("startDate", `${newTask.startDate}T${newTask.startTime}`);
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
    <div
      className={`bg-foreground text-black p-6 rounded-lg shadow-lg w-full max-w-lg ${
        isModalOpen ? "" : "hidden"
      }`}
    >
      <h3 className="text-xl font-bold mb-4 text-black">Crear nueva tarea</h3>
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 ${
            activeTab === "task" ? "border-b-2 border-blue-500 font-bold" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("task")}
        >
          Tarea
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "reminder" ? "border-b-2 border-blue-500 font-bold" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("reminder")}
        >
          Recordatorio
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "leadCall" ? "border-b-2 border-blue-500 font-bold" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("leadCall")}
        >
          Llamada
        </button>
      </div>

      {activeTab === "task" && (
        <form onSubmit={handleAddTask}>
          <div className="mb-4 flex justify-between">
            <div className="w-1/2 pr-2">
              <label className="block text-black mb-2" htmlFor="startDate">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="startDate"
                className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                value={newTask.startDate}
                onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                required
              />
            </div>
            <div className="w-1/2 pl-2">
              <label className="block text-black mb-2" htmlFor="startTime">
                Hora Inicio
              </label>
              <input
                type="time"
                id="startTime"
                className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
                value={newTask.startTime}
                onChange={(e) => setNewTask({ ...newTask, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="subject">
              Asunto
            </label>
            <input
              type="text"
              id="subject"
              className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
              value={newTask.subject}
              onChange={(e) => setNewTask({ ...newTask, subject: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="cups">
              Seleccionar CUPS
            </label>
            <Select
              id="cups"
              options={cupsOptions}
              value={cupsOptions.find((option) => option.value === selectedCups)}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : "";
                setSelectedCups(value);
                // Opcional: puedes mantener la lógica de actualizar el estado de la tarea aquí si lo necesitas
                // Por ejemplo, para la pestaña de tareas:
                // setNewTask({ ...newTask, contractUrl: value });
              }}
              placeholder="Seleccionar o buscar CUPS..."
              isClearable
              noOptionsMessage={() => "No se encontraron CUPS"}
              styles={{
                // Estilos opcionales para que se parezca a tus otros inputs
                control: (base) => ({
                  ...base,
                  backgroundColor: "#eaf0f9", // bg-background (si usas Tailwind, adapta el color)
                  border: "none",
                  boxShadow: "none",
                }),
              }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="comments">
              Comentario
            </label>
            <textarea
              id="comments"
              className="w-full h-32 px-4 py-2 rounded bg-background text-black focus:outline-none"
              rows="4"
              value={newTask.initialComment}
              onChange={(e) => setNewTask({ ...newTask, initialComment: e.target.value })}
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="file">
              Archivo
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full cursor-pointer"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
            >
              Crear Tarea
            </button>
          </div>
        </form>
      )}

      {/* REMINDERS */}

      {activeTab === "reminder" && (
        <form onSubmit={handleAddReminder}>
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="startDate">
              Fecha Inicio
            </label>
            <input
              type="datetime-local"
              id="startDate"
              className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
              value={newReminder.startDate}
              onChange={(e) => setNewReminder({ ...newReminder, startDate: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="subject">
              Asunto
            </label>
            <input
              type="text"
              id="subject"
              className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
              value={newReminder.subject}
              onChange={(e) => setNewReminder({ ...newReminder, subject: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="cups">
              Seleccionar CUPS
            </label>
            <Select
              id="cups"
              options={cupsOptions}
              value={cupsOptions.find((option) => option.value === selectedCups)}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : "";
                setSelectedCups(value);
                // Opcional: puedes mantener la lógica de actualizar el estado de la tarea aquí si lo necesitas
                // Por ejemplo, para la pestaña de tareas:
                // setNewTask({ ...newTask, contractUrl: value });
              }}
              placeholder="Seleccionar o buscar CUPS..."
              isClearable
              noOptionsMessage={() => "No se encontraron CUPS"}
              styles={{
                // Estilos opcionales para que se parezca a tus otros inputs
                control: (base) => ({
                  ...base,
                  backgroundColor: "#eaf0f9", // bg-background (si usas Tailwind, adapta el color)
                  border: "none",
                  boxShadow: "none",
                }),
              }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="description">
              Descripción
            </label>
            <textarea
              id="description"
              className="w-full h-32 px-4 py-2 rounded bg-background text-black focus:outline-none"
              rows="4"
              value={newReminder.description}
              onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="file">
              Archivo
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full cursor-pointer"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
            >
              Crear Recordatorio
            </button>
          </div>
        </form>
      )}

      {/* LLAMADAS */}

      {activeTab === "leadCall" && (
        <form onSubmit={handleAddLeadCall}>
          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="startDate">
              Fecha Inicio
            </label>
            <input
              type="datetime-local"
              id="startDate"
              className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
              value={newLeadCall.startDate}
              onChange={(e) => setNewLeadCall({ ...newLeadCall, startDate: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="subject">
              Asunto
            </label>
            <input
              type="text"
              id="subject"
              className="w-full px-4 py-2 rounded bg-background text-black focus:outline-none"
              value={newLeadCall.subject}
              onChange={(e) => setNewLeadCall({ ...newLeadCall, subject: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="cups">
              Seleccionar CUPS
            </label>
            <Select
              id="cups"
              options={cupsOptions}
              value={cupsOptions.find((option) => option.value === selectedCups)}
              onChange={(selectedOption) => {
                const value = selectedOption ? selectedOption.value : "";
                setSelectedCups(value);
                // Opcional: puedes mantener la lógica de actualizar el estado de la tarea aquí si lo necesitas
                // Por ejemplo, para la pestaña de tareas:
                // setNewTask({ ...newTask, contractUrl: value });
              }}
              placeholder="Seleccionar o buscar CUPS..."
              isClearable
              noOptionsMessage={() => "No se encontraron CUPS"}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "#eaf0f9", 
                  border: "none",
                  boxShadow: "none",
                }),
              }}
            />
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="observations">
              Observaciones
            </label>
            <textarea
              id="observations"
              className="w-full h-32 px-4 py-2 rounded bg-background text-black focus:outline-none"
              rows="4"
              value={newLeadCall.observations}
              onChange={(e) => setNewLeadCall({ ...newLeadCall, observations: e.target.value })}
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-black mb-2" htmlFor="file">
              Archivo
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full cursor-pointer"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="bg-red-600 text-white px-4 py-2 rounded mr-2 hover:bg-red-700"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondaryHover"
            >
              Crear Llamada
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
