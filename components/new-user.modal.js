import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";

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
    return `${hour}:00`;
  });
};
const timeOptions = generateTimeOptions();

const FormField = ({ id, label, children }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    {children}
  </div>
);

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
    role: "agent",
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
        role: "agent",
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

  const handleRoleChange = (e) => {
    setUser((prev) => ({ ...prev, role: e.target.value }));
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

  if (!isOpen) return null;

  const inputClasses =
    "block w-full px-3 py-2 rounded-md bg-background text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm";
  const dateInputClasses = `${inputClasses} text-gray-900`;

  const radioClasses =
    "h-4 w-4 appearance-none rounded-full border border-gray-300 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 lg:ml-72 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full transform transition-transform duration-300 ease-in-out scale-100 opacity-100 relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {userData ? "Editar Usuario" : "Crear Usuario"}
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center transition duration-150"
            onClick={onClose}
            aria-label="Close modal"
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          id="user-modal-form"
          className="p-5 space-y-4 overflow-y-auto flex-grow"
        >
          {/* Personal Information Section */}
          <fieldset className="rounded-lg p-4 border-none">
            <legend className="text-sm font-bold text-blue-600">
              Información Personal
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="name" label="Nombre *">
                <input
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Ej: Juan"
                  className={inputClasses}
                  value={user.name}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              <FormField id="firstSurname" label="Primer Apellido *">
                <input
                  type="text"
                  name="firstSurname"
                  id="firstSurname"
                  placeholder="Ej: Pérez"
                  className={inputClasses}
                  value={user.firstSurname}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              <FormField id="secondSurname" label="Segundo Apellido">
                <input
                  type="text"
                  name="secondSurname"
                  id="secondSurname"
                  placeholder="Ej: García"
                  className={inputClasses}
                  value={user.secondSurname}
                  onChange={handleInputChange}
                />
              </FormField>
              <FormField id="phone" label="Teléfono">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  placeholder="Ej: 600123456"
                  className={inputClasses}
                  value={user.phone || ""}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField id="iban" label="IBAN">
                <input
                  type="text"
                  name="iban"
                  id="iban"
                  placeholder="Ej: ESXX0000000000000000000000"
                  className={inputClasses}
                  value={user.iban || ""}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Account & Access Section */}
          <fieldset className="rounded-lg p-4 border-none">
            <legend className="text-sm font-bold text-blue-600">
              Cuenta y Acceso
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="username" label="Nombre de Usuario *">
                <input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Ej: jperez"
                  className={inputClasses}
                  value={user.username}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              <FormField id="email" label="Email *">
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="ejemplo@dominio.com"
                  className={inputClasses}
                  value={user.email}
                  onChange={handleInputChange}
                  required
                />
              </FormField>
              <FormField
                id="password"
                label={
                  userData ? "Nueva Contraseña (opcional)" : "Contraseña *"
                }
              >
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className={inputClasses}
                  value={user.password}
                  onChange={handleInputChange}
                  required={!userData}
                />
              </FormField>
              <FormField
                id="confirmPassword"
                label={
                  userData
                    ? "Confirmar Nueva Contraseña"
                    : "Repetir Contraseña *"
                }
              >
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="••••••••"
                  className={inputClasses}
                  value={user.confirmPassword}
                  onChange={handleInputChange}
                  required={!userData || !!user.password}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Work Details Section */}
          <fieldset className="rounded-lg p-4 border-none">
            <legend className="text-sm font-bold text-blue-600">
              Detalles Laborales
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="startDate" label="Fecha de Inicio">
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  className={dateInputClasses}
                  value={user.startDate || ""}
                  onChange={handleInputChange}
                />
              </FormField>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <FormField id="startDay" label="Día Inicial">
                    <select
                      name="startDay"
                      id="startDay"
                      className={inputClasses}
                      value={user.startDay}
                      onChange={handleInputChange}
                    >
                      <option value="">Selecciona día</option>
                      {WEEK_DAYS.map((d) => (
                        <option key={`start-${d}`} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {/* Día de fin */}
                <div className="flex-1">
                  <FormField id="endDay" label="Día Final">
                    <select
                      name="endDay"
                      id="endDay"
                      className={inputClasses}
                      value={user.endDay}
                      onChange={handleInputChange}
                    >
                      <option value="">Selecciona día</option>
                      {WEEK_DAYS.map((d) => (
                        <option key={`end-${d}`} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>

              <FormField id="startTime" label="Hora Inicio">
                <select
                  name="startTime"
                  id="startTime"
                  className={inputClasses}
                  value={user.startTime || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Selecciona hora</option>
                  {timeOptions.map((time) => (
                    <option key={`start-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="endTime" label="Hora Fin">
                <select
                  name="endTime"
                  id="endTime"
                  className={inputClasses}
                  value={user.endTime || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Selecciona hora</option>
                  {timeOptions.map((time) => (
                    <option key={`end-${time}`} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField id="shift" label="Turno">
                <select
                  name="shift"
                  id="shift"
                  className={`${inputClasses} capitalize`}
                  value={user.shift || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Selecciona turno</option>
                  {Object.values(USERSHIFT).map((shiftValue) => (
                    <option
                      key={shiftValue}
                      value={shiftValue}
                      className="capitalize"
                    >
                      {shiftValue}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </fieldset>

          {/* Fiscal Data Section */}
          <fieldset className="rounded-lg p-4 border-none">
            <legend className="text-sm font-bold text-blue-600">
              Datos fiscales
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="address" label="Dirección fiscal">
                <input
                  type="text"
                  name="address"
                  id="address"
                  placeholder="Ej: Calle Fiscal 123, 4ºA"
                  className={inputClasses}
                  value={user.address || ""}
                  onChange={handleInputChange}
                />
              </FormField>
              <FormField id="cif" label="DNI/CIF">
                <input
                  type="text"
                  name="cif"
                  id="cif"
                  placeholder="Ej: 12345678A o B12345678"
                  className={inputClasses}
                  value={user.cif || ""}
                  onChange={handleInputChange}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Role and Image Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start px-4">
            {!userData && (
              <FormField id="role" label="Rol de Usuario *">
                <div className="space-y-2 mt-1">
                  <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      onChange={handleRoleChange}
                      checked={user.role === "admin"}
                      className={radioClasses}
                    />
                    <span>Administrador</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="role"
                      value="supervisor"
                      onChange={handleRoleChange}
                      checked={user.role === "supervisor"}
                      className={radioClasses}
                    />
                    <span>Supervisor</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="role"
                      value="agent"
                      onChange={handleRoleChange}
                      checked={user.role === "agent"}
                      className={radioClasses}
                    />
                    <span>Agente</span>
                  </label>
                </div>
              </FormField>
            )}

            {/* Profile Image Upload */}
            <div className={userData ? "sm:col-span-2" : ""}>
              <FormField id="userImage" label="Imagen de Perfil (Opcional)">
                <input
                  type="file"
                  name="userImage"
                  id="userImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {userData?.userImage &&
                  typeof userData.userImage === "string" &&
                  !user.userImage && (
                    <img
                      src={userData.userImage}
                      alt="Current profile"
                      className="mt-2 h-16 w-16 rounded-full object-cover"
                    />
                  )}
                {user.userImage instanceof File && (
                  <img
                    src={URL.createObjectURL(user.userImage)}
                    alt="Preview"
                    className="mt-2 h-16 w-16 rounded-full object-cover"
                  />
                )}
              </FormField>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex justify-end items-center space-x-3 p-5 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition ease-in-out duration-150"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="user-modal-form"
            className="px-4 py-2 rounded-md text-sm font-medium border border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-150"
          >
            {userData ? "Guardar Cambios" : "Crear Usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}
