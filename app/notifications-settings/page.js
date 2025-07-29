"use client";
import React, { useState, useEffect } from "react";
import { getCookie } from "cookies-next";
import { authGetFetch, authFetch } from "@/helpers/server-fetch.helper";
import useIsMobile from "@/hooks/useIsMobile";
import { id } from "date-fns/locale";
import Select from "react-select";

export default function NotificationsSettings() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [selectedEmailOptions, setSelectedEmailOptions] = useState([]);

  const [states, setStates] = useState([]);
  const [showSelects, setShowSelects] = useState(false);

  const isMobile = useIsMobile();

  const [options, setOptions] = useState([
    {
      id: 1,
      label: "Recordatorios personales",
      value: "reminder",
      checked: false,
      sendEmail: false,
    },
    {
      id: 2,
      label: "Tareas que me envían",
      value: "task_send",
      checked: false,
      sendEmail: false,
    },
    { id: 3, label: "Tareas que creo", value: "task_created", checked: false, sendEmail: false },
    {
      id: 4,
      label: "Agendas que me envían",
      value: "lead_call_send",
      checked: false,
      sendEmail: false,
    },
    {
      id: 5,
      label: "Agendas que creo",
      value: "lead_call_created",
      checked: false,
      sendEmail: false,
    },
    { id: 6, label: "Comunicados", value: "communication", checked: false, sendEmail: false },
    {
      id: 7,
      label: "Fin de retro",
      value: "contract_expiration",
      checked: false,
      sendEmail: false,
    },
    {
      id: 8,
      label: "Aviso a los X meses de activación",
      value: "contract_activated",
      checked: false,
      sendEmail: false,
      months: 1,
    },
    {
      id: 9,
      label: "Aviso pago por renovación",
      value: "renew_payment",
      checked: false,
      sendEmail: false,
    },
    {
      id: 10,
      label: "Solicitudes de ausencias",
      value: "vacation_request",
      checked: false,
      sendEmail: false,
    },
    {
      id: 11,
      label: "Comentarios en contratos",
      value: "contract_commented",
      checked: false,
      sendEmail: false,
    },
  ]);

  const [stateChangeOptions, setStateChangeOptions] = useState([]);

  const [multiStateChange, setMultiStateChange] = useState({
    enabled: false, // Para el checkbox principal
    sendEmail: false, // Para el checkbox de email
    fromStates: [], // Array de estados seleccionados en "Pasa de"
    toStates: [], // Array de estados seleccionados en "a"
  });

  const resetOptions = () =>
    options.map((option) => ({ ...option, checked: false, sendEmail: false }));

  const updateOptionsForUser = (user) =>
    options.map((option) => {
      if (option.value.startsWith("contract_activated")) {
        const match = user.notificationsPreferences?.find((value) =>
          value.startsWith("contract_activated")
        );
        const matchEmail = user.notificationsEmailPreferences?.find((value) =>
          value.startsWith("contract_activated")
        );
        return {
          ...option,
          checked: !!match,
          sendEmail: !!matchEmail,
          months: match ? parseInt(match.split("_")[2], 10) : option.months,
        };
      }
      return {
        ...option,
        checked: user.notificationsPreferences?.includes(option.value) || false,
        sendEmail: user.notificationsEmailPreferences?.includes(option.value) || false,
      };
    });

  const getUsersManager = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("users/all", jwtToken);
      if (response.ok) {
        setUsers(await response.json());
      } else {
        console.error("Error cargando la información de los usuarios");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  const getContractStates = async () => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch("contract-states/all", jwtToken);
      if (response.ok) {
        setStates(await response.json());
      } else {
        console.error("Error cargando la información de los estados de contrato");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
    }
  };

  useEffect(() => {
    getUsersManager();
    getContractStates();
  }, []);

  useEffect(() => {
    if (selectedUsers.length === 1) {
      const user = users.find((u) => u.id === selectedUsers[0]);
      if (!user) return;

      // --- Lógica para las otras opciones (sin cambios) ---
      setOptions(updateOptionsForUser(user));

      // --- NUEVA LÓGICA para cargar las preferencias de cambio de estado ---
      const visualPreferences = user.notificationsPreferences || [];
      const emailPreferences = user.notificationsEmailPreferences || [];

      const stateChangePrefs = visualPreferences.filter((p) => p.startsWith("state_change_"));

      if (stateChangePrefs.length > 0) {
        const fromStatesSet = new Set();
        const toStatesSet = new Set();

        stateChangePrefs.forEach((pref) => {
          const parts = pref.split("_");
          if (parts.length === 4) {
            fromStatesSet.add(parts[2]);
            toStatesSet.add(parts[3]);
          }
        });

        const sendEmail = stateChangePrefs.some((p) => emailPreferences.includes(p));

        setMultiStateChange({
          enabled: true,
          sendEmail: sendEmail,
          fromStates: Array.from(fromStatesSet).map((s) => ({ value: s, label: s })),
          toStates: Array.from(toStatesSet).map((s) => ({ value: s, label: s })),
        });
      } else {
        // Si no hay preferencias guardadas, resetea el estado
        setMultiStateChange({ enabled: false, sendEmail: false, fromStates: [], toStates: [] });
      }
    } else {
      // Resetea todo si no hay un único usuario seleccionado
      setOptions(resetOptions());
      setMultiStateChange({ enabled: false, sendEmail: false, fromStates: [], toStates: [] });
    }
  }, [selectedUsers, users]);

  useEffect(() => {
    if (setStateChangeOptions.length > 0) {
      setShowSelects(true);
    }
  }, [stateChangeOptions]);

  const handleCheckboxChange = (id, type) => {
    if (type === "user") {
      setSelectedUsers((prev) =>
        prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
      );
    } else if (type === "contractState") {
      setStateChangeOptions((prevOptions) =>
        prevOptions.map((option) => {
          if (option.id === id) {
            const newCheckedState = !option.checked;
            const key = `state_change_${option.fromState}_${option.toState}`;

            setSelectedOptions((prevSelected) => {
              if (newCheckedState) {
                return [...prevSelected, key];
              } else {
                const updatedSelected = [...prevSelected];
                const index = updatedSelected.indexOf(key);
                if (index > -1) {
                  updatedSelected.splice(index, 1);
                }
                return updatedSelected;
              }
            });

            if (!newCheckedState) {
              setSelectedEmailOptions((prevEmail) => {
                const emailKeyToRemove = key;
                const updatedSelectedEmail = [...prevEmail];
                const index = updatedSelectedEmail.indexOf(emailKeyToRemove);
                if (index > -1) {
                  updatedSelectedEmail.splice(index, 1);
                }
                return updatedSelectedEmail;
              });
            }
            return {
              ...option,
              id: option.id,
              checked: newCheckedState,
              sendEmail: newCheckedState ? option.sendEmail : false,
              fromState: option.fromState,
              toState: option.toState,
              value: option.value,
            };
          }
          return option;
        })
      );
    } else {
      setOptions((prevOptions) =>
        prevOptions.map((option) => {
          if (option.id === id) {
            const newCheckedState = !option.checked;

            return {
              ...option,
              checked: newCheckedState,
              sendEmail: newCheckedState ? option.sendEmail : false,
            };
          }
          return option;
        })
      );

      const option = options.find((opt) => opt.id === id);

      if (option.value.startsWith("contract_activated")) {
        setSelectedOptions((prev) =>
          option.checked
            ? prev.filter((val) => !val.startsWith("contract_activated"))
            : [...prev, `contract_activated_${option.months}`]
        );
      } else {
        setSelectedOptions((prev) =>
          option.checked ? prev.filter((val) => val !== option.value) : [...prev, option.value]
        );
      }
    }
  };

  const handleEmailCheckboxChange = (id, stateContractChangeNotifications) => {
    if (!stateContractChangeNotifications) {
      setOptions((prevOptions) => {
        return prevOptions.map((option) => {
          if (option.id === id) {
            return { ...option, sendEmail: !option.sendEmail };
          }
          return option;
        });
      });

      const option = options.find((opt) => opt.id === id);

      if (option.value.startsWith("contract_activated")) {
        setSelectedEmailOptions((prev) =>
          option.sendEmail
            ? prev.filter((val) => !val.startsWith("contract_activated"))
            : [...prev, `contract_activated_${option.months}`]
        );
      } else {
        setSelectedEmailOptions((prev) =>
          option.sendEmail ? prev.filter((val) => val !== option.value) : [...prev, option.value]
        );
      }
    } else {
      setStateChangeOptions((prevOptions) => {
        return prevOptions.map((option) => {
          if (option.id === id) {
            const newSendEmail = !option.sendEmail;

            setSelectedEmailOptions((prev) => {
              const key = `state_change_${option.fromState}_${option.toState}`;
              return newSendEmail ? [...prev, key] : prev.filter((val) => val !== key);
            });

            return { ...option, sendEmail: newSendEmail };
          }
          return option;
        });
      });
    }
  };

  const handleInputChange = (id, field, value) => {
    setOptions((prev) =>
      prev.map((option) => (option.id === id ? { ...option, [field]: value } : option))
    );

    if (field === "months") {
      setSelectedOptions((prev) =>
        prev.map((val) =>
          val.startsWith("contract_activated") ? `contract_activated_${value}` : val
        )
      );
    }
  };

  const handleSave = async () => {
    const jwtToken = getCookie("factura-token");

    try {
      // --- 1. Generar preferencias de "Cambio de Estado" desde la nueva UI ---
      let generatedStateVisualPrefs = [];
      let generatedStateEmailPrefs = [];

      if (
        multiStateChange.enabled &&
        multiStateChange.fromStates.length > 0 &&
        multiStateChange.toStates.length > 0
      ) {
        const froms = multiStateChange.fromStates.map((s) => s.value);
        const tos = multiStateChange.toStates.map((s) => s.value);

        for (const fromState of froms) {
          for (const toState of tos) {
            // Omitir la combinación si el estado de origen y destino es el mismo
            if (fromState !== toState) {
              const key = `state_change_${fromState}_${toState}`;
              generatedStateVisualPrefs.push(key);
              if (multiStateChange.sendEmail) {
                generatedStateEmailPrefs.push(key);
              }
            }
          }
        }
      }

      // --- 2. Recolectar las OTRAS preferencias (las que no son de cambio de estado) ---
      const otherVisualPrefs = options
        .filter((opt) => opt.checked)
        .map((opt) => {
          if (opt.value.startsWith("contract_activated")) {
            return `contract_activated_${opt.months}`;
          }
          return opt.value;
        });

      const otherEmailPrefs = options
        .filter((opt) => opt.checked && opt.sendEmail)
        .map((opt) => {
          if (opt.value.startsWith("contract_activated")) {
            return `contract_activated_${opt.months}`;
          }
          return opt.value;
        });

      // --- 3. Unir ambas listas de preferencias ---
      const finalVisualPrefs = [...otherVisualPrefs, ...generatedStateVisualPrefs];
      const finalEmailPrefs = [...otherEmailPrefs, ...generatedStateEmailPrefs];

      // Convertir a null si los arrays están vacíos, como en tu lógica original
      const notificationsPreferences =
        finalVisualPrefs.length > 0 ? [...new Set(finalVisualPrefs)] : null;
      const notificationsEmailPreferences =
        finalEmailPrefs.length > 0 ? [...new Set(finalEmailPrefs)] : null;

      // --- 4. Enviar los datos al backend (lógica original sin cambios) ---
      await Promise.all(
        selectedUsers.map(async (userId) => {
          const user = users.find((u) => u.id === userId);
          if (user && user.uuid) {
            await authFetch(
              "PATCH",
              `users`,
              {
                userUuid: user.uuid,
                userData: { notificationsPreferences, notificationsEmailPreferences },
              },
              jwtToken
            );
          }
        })
      );

      // --- 5. Actualizar y notificar al usuario ---
      await getUsersManager();
      alert("Preferencias guardadas correctamente.");
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
      alert("Hubo un error al guardar las preferencias.");
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Acciones que notifican a cada usuario
      </h1>

      <div
        className={`${
          isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-6"
        } w-full max-w-6xl h-full`}
      >
        {/* Usuarios */}
        <div className="p-6 bg-white text-black rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4">Usuarios</h2>
          <div className="flex-grow border border-gray-300 rounded-lg p-4 bg-gray-50 shadow-sm overflow-hidden">
            <div className="h-full overflow-y-auto border border-gray-200 rounded bg-white">
              {users.length > 0 ? (
                users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-none"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleCheckboxChange(user.id, "user")}
                      className="mr-2"
                    />
                    <span className="text-gray-900">{user.name}</span>
                  </label>
                ))
              ) : (
                <div className="p-4 text-center text-gray-600">No se encontraron usuarios.</div>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6 bg-white text-black rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-4">Acciones</h2>
          <div className="border rounded-lg p-4 bg-gray-50 shadow-sm">
            {options.map((option) => (
              <div key={option.id} className="flex justify-between items-center mb-4 flex-wrap">
                {/* Contenedor para el checkbox de Acción */}
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={option.checked}
                      onChange={() => handleCheckboxChange(option.id, "action")}
                      className="mr-2"
                    />
                    {option.label}
                  </label>
                </div>

                {/* Contenedor para el checkbox de Email */}
                <div className={`${option.checked ? "flex" : "hidden"} items-center`}>
                  <label className="flex items-center text-sm text-gray-700">
                    Email:
                    <input
                      type="checkbox"
                      checked={option.sendEmail}
                      onChange={() => handleEmailCheckboxChange(option.id, false)}
                      className="ml-2"
                    />
                  </label>
                </div>

                {/* Contenido adicional como el input de meses, si aplica */}
                {option.id === 9 && option.checked && (
                  <div className="flex items-center mt-2 w-full">
                    <span>Aviso a los</span>
                    <input
                      type="number"
                      value={option.months}
                      onChange={(e) => handleInputChange(option.id, "months", e.target.value)}
                      className="mx-2 p-1 border rounded"
                      min={1}
                    />
                    <span>meses de activación</span>
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 border-t mt-4">
              <div className="font-semibold text-black transition flex items-center">
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4"
                  checked={multiStateChange.enabled}
                  onChange={(e) =>
                    setMultiStateChange((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  disabled={selectedUsers.length === 0}
                />
                <h2>Aviso cambio de estado en los contratos</h2>
              </div>

              {multiStateChange.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start my-4 pl-7">
                  <div>
                    <label className="text-gray-700 block mb-1 text-sm">Pasa de:</label>
                    <Select
                      isMulti
                      options={states.map((s) => ({ value: s.name, label: s.name }))}
                      value={multiStateChange.fromStates}
                      onChange={(selected) =>
                        setMultiStateChange((prev) => ({ ...prev, fromStates: selected || [] }))
                      }
                      className="basic-multi-select"
                      classNamePrefix="select"
                      placeholder="Selecciona..."
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 block mb-1 text-sm">a:</label>
                    <Select
                      isMulti
                      options={states.map((s) => ({ value: s.name, label: s.name }))}
                      value={multiStateChange.toStates}
                      onChange={(selected) =>
                        setMultiStateChange((prev) => ({ ...prev, toStates: selected || [] }))
                      }
                      className="basic-multi-select"
                      classNamePrefix="select"
                      placeholder="Selecciona..."
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center mt-2">
                    <label className="flex items-center text-sm text-gray-700">
                      Notificar por Email:
                      <input
                        type="checkbox"
                        checked={multiStateChange.sendEmail}
                        onChange={(e) =>
                          setMultiStateChange((prev) => ({ ...prev, sendEmail: e.target.checked }))
                        }
                        className="ml-2 h-4 w-4"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
            {showSelects &&
              stateChangeOptions.map((option, index) => (
                <div key={option.id} className="flex gap-2 items-center justify-between mb-5">
                  <input
                    type="checkbox"
                    checked={option.checked}
                    onChange={() => handleCheckboxChange(option.id, "contractState")}
                    disabled={!(option.fromState && option.toState)}
                  />

                  <label className="text-gray-700">Pasa de</label>
                  <select
                    className="p-2 border rounded w-[40%]"
                    value={option.fromState}
                    onChange={(e) => {
                      const newFromState = e.target.value;

                      const updatedOptions = [...stateChangeOptions];
                      updatedOptions[index].fromState = newFromState;

                      const keys = updatedOptions.map(
                        (opt) => `STATE_CHANGE_${opt.fromState}_${opt.toState}`
                      );
                      const uniqueKeys = new Set(keys);

                      if (uniqueKeys.size !== keys.length) {
                        alert(
                          "Error: Esta combinación de 'Pasa de' y 'a' ya ha sido seleccionada para otra preferencia."
                        );
                      } else {
                        setStateChangeOptions(updatedOptions);
                      }
                    }}
                    disabled={option.checked}
                  >
                    <option value=""></option>
                    {states.map((estado) => (
                      <option key={estado.id} value={estado.name}>
                        {estado.name}
                      </option>
                    ))}
                  </select>

                  <label className="text-gray-700">a</label>
                  <select
                    className="p-2 border rounded w-[40%]"
                    value={option.toState}
                    onChange={(e) => {
                      const newToState = e.target.value;

                      const updatedOptions = [...stateChangeOptions];
                      updatedOptions[index].toState = newToState;

                      const keys = updatedOptions.map(
                        (opt) => `STATE_CHANGE_${opt.fromState}_${opt.toState}`
                      );
                      const uniqueKeys = new Set(keys);

                      if (uniqueKeys.size !== keys.length) {
                        alert(
                          "Error: Esta combinación de 'Pasa de' y 'a' ya ha sido seleccionada para otra preferencia."
                        );
                      } else {
                        setStateChangeOptions(updatedOptions);
                      }
                    }}
                    disabled={option.checked}
                  >
                    <option value=""></option>
                    {states.map((estado) => (
                      <option
                        key={estado.id}
                        value={estado.name}
                        disabled={estado.name === option.fromState}
                      >
                        {estado.name}
                      </option>
                    ))}
                  </select>

                  <div className={`${option.checked ? "flex" : "hidden"} items-center`}>
                    <label className="flex items-center text-sm text-gray-700">
                      Email:
                      <input
                        type="checkbox"
                        checked={option.sendEmail}
                        onChange={() => handleEmailCheckboxChange(option.id, true)}
                        className="ml-2"
                        disabled={!(option.fromState && option.toState)}
                      />
                    </label>
                  </div>
                </div>
              ))}
          </div>
          <button
            onClick={handleSave}
            className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
