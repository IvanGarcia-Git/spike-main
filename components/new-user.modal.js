import { useState, useEffect } from "react";
import BaseModal, { ModalActions, ModalButton, ModalInput, ModalSelect } from "./base-modal.component";

const USERSHIFT = {
  MORNING: "mañana",
  AFTERNOON: "tarde",
};

const WEEK_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const generateTimeOptions = () => {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return { value: `${hour}:00`, label: `${hour}:00` };
  });
};

const weekDayOptions = WEEK_DAYS.map((d) => ({ value: d, label: d }));
const shiftOptions = Object.values(USERSHIFT).map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
const timeOptions = generateTimeOptions();

const roleOptions = [
  { value: "admin", label: "Administrador" },
  { value: "colaborador", label: "Colaborador" },
  { value: "agente", label: "Agente" },
];

export default function UserModal({
  isOpen,
  onClose,
  onSave,
  userData = null,
}) {
  const [user, setUser] = useState({
    name: "",
    firstSurname: "",
    secondSurname: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "agente",
    userImage: null,
    startDate: "",
    startDay: "",
    endDay: "",
    startTime: "",
    endTime: "",
    shift: "",
    phone: "",
    iban: "",
    address: "",
    cif: "",
  });

  useEffect(() => {
    if (userData) {
      let initialStartTime = "";
      let initialEndTime = "";
      if (
        userData.time &&
        typeof userData.time === "string" &&
        userData.time.includes(" - ")
      ) {
        [initialStartTime, initialEndTime] = userData.time.split(" - ");
      }

      let initialStartDay = "";
      let initialEndDay = "";
      if (
        userData.days &&
        typeof userData.days === "string" &&
        userData.days.includes(" a ")
      ) {
        [initialStartDay, initialEndDay] = userData.days.split(" a ");
      }

      setUser({
        ...userData,
        password: "",
        confirmPassword: "",
        startDate: userData.startDate || "",
        startDay: initialStartDay,
        endDay: initialEndDay,
        startTime: initialStartTime || "",
        endTime: initialEndTime || "",
        shift: userData.shift || "",
        phone: userData.phone || "",
        iban: userData.iban || "",
        address: userData.address || "",
        cif: userData.cif || "",
        userImage: userData.userImage || null,
      });
    } else {
      setUser({
        name: "",
        firstSurname: "",
        secondSurname: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "agente",
        userImage: null,
        startDate: "",
        days: "",
        startTime: "",
        endTime: "",
        shift: "",
        phone: "",
        iban: "",
        address: "",
        cif: "",
      });
    }
  }, [userData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setUser((prev) => ({ ...prev, userImage: file }));
  };

  const cleanUserData = (userData) => {
    const cleaned = { ...userData };
    const nullableFields = ["startDate", "days", "time", "shift", "phone", "iban"];
    nullableFields.forEach((field) => {
      if (cleaned[field] === "" || cleaned[field] === undefined) {
        cleaned[field] = null;
      }
    });
    return cleaned;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userData && user.password !== user.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (userData && user.password && user.password !== user.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const finalUser = { ...user };

    if (finalUser.startTime && finalUser.endTime) {
      finalUser.time = `${finalUser.startTime} - ${finalUser.endTime}`;
    } else {
      finalUser.time = "";
    }
    delete finalUser.startTime;
    delete finalUser.endTime;

    if (finalUser.startDay && finalUser.endDay) {
      finalUser.days = `${finalUser.startDay} a ${finalUser.endDay}`;
    } else {
      finalUser.days = "";
    }
    delete finalUser.startDay;
    delete finalUser.endDay;

    const cleanedUser = cleanUserData(finalUser);

    let dataToSend;
    if (cleanedUser.userImage instanceof File) {
      dataToSend = new FormData();
      Object.keys(cleanedUser).forEach((key) => {
        if (key === "userImage" && cleanedUser.userImage instanceof File) {
          dataToSend.append(key, cleanedUser.userImage);
        } else if (cleanedUser[key] !== null && cleanedUser[key] !== undefined) {
          dataToSend.append(key, cleanedUser[key]);
        }
      });
    } else {
      dataToSend = { ...cleanedUser };
      if (!userData && dataToSend.userImage === null) {
        delete dataToSend.userImage;
      }
    }

    onSave(dataToSend);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={userData ? "Editar Usuario" : "Crear Usuario"}
      subtitle={userData ? "Modifica los datos del usuario" : "Completa los datos para crear un nuevo usuario"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
        {/* Información Personal */}
        <fieldset className="neumorphic-card-inset rounded-lg p-4">
          <legend className="text-sm font-bold text-primary px-2 -ml-2">
            Información Personal
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <ModalInput
              label="Nombre"
              type="text"
              id="name"
              value={user.name}
              onChange={handleInputChange}
              required
              placeholder="Ej: Juan"
              name="name"
            />
            <ModalInput
              label="Primer Apellido"
              type="text"
              id="firstSurname"
              value={user.firstSurname}
              onChange={handleInputChange}
              required
              placeholder="Ej: Pérez"
              name="firstSurname"
            />
            <ModalInput
              label="Segundo Apellido"
              type="text"
              id="secondSurname"
              value={user.secondSurname}
              onChange={handleInputChange}
              placeholder="Ej: García"
              name="secondSurname"
            />
            <ModalInput
              label="Teléfono"
              type="tel"
              id="phone"
              value={user.phone || ""}
              onChange={handleInputChange}
              placeholder="Ej: 600123456"
              name="phone"
            />
          </div>
          <div className="mt-4">
            <ModalInput
              label="IBAN"
              type="text"
              id="iban"
              value={user.iban || ""}
              onChange={handleInputChange}
              placeholder="Ej: ESXX0000000000000000000000"
              name="iban"
            />
          </div>
        </fieldset>

        {/* Cuenta y Acceso */}
        <fieldset className="neumorphic-card-inset rounded-lg p-4">
          <legend className="text-sm font-bold text-primary px-2 -ml-2">
            Cuenta y Acceso
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <ModalInput
              label="Nombre de Usuario"
              type="text"
              id="username"
              value={user.username}
              onChange={handleInputChange}
              required
              placeholder="Ej: jperez"
              name="username"
            />
            <ModalInput
              label="Email"
              type="email"
              id="email"
              value={user.email}
              onChange={handleInputChange}
              required
              placeholder="ejemplo@dominio.com"
              name="email"
            />
            <ModalInput
              label={userData ? "Nueva Contraseña (opcional)" : "Contraseña"}
              type="password"
              id="password"
              value={user.password}
              onChange={handleInputChange}
              required={!userData}
              placeholder="••••••••"
              name="password"
            />
            <ModalInput
              label={userData ? "Confirmar Nueva Contraseña" : "Repetir Contraseña"}
              type="password"
              id="confirmPassword"
              value={user.confirmPassword}
              onChange={handleInputChange}
              required={!userData || !!user.password}
              placeholder="••••••••"
              name="confirmPassword"
            />
          </div>
        </fieldset>

        {/* Detalles Laborales */}
        <fieldset className="neumorphic-card-inset rounded-lg p-4">
          <legend className="text-sm font-bold text-primary px-2 -ml-2">
            Detalles Laborales
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <ModalInput
              label="Fecha de Inicio"
              type="date"
              id="startDate"
              value={user.startDate || ""}
              onChange={handleInputChange}
              name="startDate"
            />
            <ModalSelect
              label="Turno"
              id="shift"
              value={user.shift || ""}
              onChange={handleInputChange}
              options={shiftOptions}
              placeholder="Selecciona turno"
              name="shift"
            />
            <ModalSelect
              label="Día Inicial"
              id="startDay"
              value={user.startDay || ""}
              onChange={handleInputChange}
              options={weekDayOptions}
              placeholder="Selecciona día"
              name="startDay"
            />
            <ModalSelect
              label="Día Final"
              id="endDay"
              value={user.endDay || ""}
              onChange={handleInputChange}
              options={weekDayOptions}
              placeholder="Selecciona día"
              name="endDay"
            />
            <ModalSelect
              label="Hora Inicio"
              id="startTime"
              value={user.startTime || ""}
              onChange={handleInputChange}
              options={timeOptions}
              placeholder="Selecciona hora"
              name="startTime"
            />
            <ModalSelect
              label="Hora Fin"
              id="endTime"
              value={user.endTime || ""}
              onChange={handleInputChange}
              options={timeOptions}
              placeholder="Selecciona hora"
              name="endTime"
            />
          </div>
        </fieldset>

        {/* Datos Fiscales */}
        <fieldset className="neumorphic-card-inset rounded-lg p-4">
          <legend className="text-sm font-bold text-primary px-2 -ml-2">
            Datos Fiscales
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <ModalInput
              label="Dirección fiscal"
              type="text"
              id="address"
              value={user.address || ""}
              onChange={handleInputChange}
              placeholder="Ej: Calle Fiscal 123, 4ºA"
              name="address"
            />
            <ModalInput
              label="DNI/CIF"
              type="text"
              id="cif"
              value={user.cif || ""}
              onChange={handleInputChange}
              placeholder="Ej: 12345678A o B12345678"
              name="cif"
            />
          </div>
        </fieldset>

        {/* Rol e Imagen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!userData && (
            <fieldset className="neumorphic-card-inset rounded-lg p-4">
              <legend className="text-sm font-bold text-primary px-2 -ml-2">
                Rol de Usuario
              </legend>
              <div className="space-y-3 mt-2">
                {roleOptions.map((role) => (
                  <label
                    key={role.value}
                    className="flex items-center space-x-3 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      onChange={handleInputChange}
                      checked={user.role === role.value}
                      className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                      {role.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className={`neumorphic-card-inset rounded-lg p-4 ${userData ? "sm:col-span-2" : ""}`}>
            <legend className="text-sm font-bold text-primary px-2 -ml-2">
              Imagen de Perfil
            </legend>
            <div className="mt-2">
              <input
                type="file"
                name="userImage"
                id="userImage"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
              />
              <div className="mt-3 flex items-center gap-4">
                {userData?.userImage &&
                  typeof userData.userImage === "string" &&
                  !user.userImage && (
                    <img
                      src={userData.userImage}
                      alt="Current profile"
                      className="h-16 w-16 rounded-full object-cover neumorphic-card"
                    />
                  )}
                {user.userImage instanceof File && (
                  <img
                    src={URL.createObjectURL(user.userImage)}
                    alt="Preview"
                    className="h-16 w-16 rounded-full object-cover neumorphic-card"
                  />
                )}
              </div>
            </div>
          </fieldset>
        </div>
      </form>

      <ModalActions>
        <ModalButton variant="ghost" onClick={onClose}>
          Cancelar
        </ModalButton>
        <ModalButton
          variant="primary"
          type="submit"
          onClick={handleSubmit}
          icon={userData ? "save" : "person_add"}
        >
          {userData ? "Guardar Cambios" : "Crear Usuario"}
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
