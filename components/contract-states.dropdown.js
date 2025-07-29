import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createPopper } from "@popperjs/core";

export default function ContractStatesDropdown({
  contractStates,
  contractStateId,
  onStateChange,
  isEditable,
}) {
  const [selectedState, setSelectedState] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const currentState = contractStates.find(
      (state) => state.id === contractStateId
    );
    setSelectedState(currentState || {});
  }, [contractStateId, contractStates]);

  // Inicializa Popper.js
  useEffect(() => {
    if (isDropdownOpen && buttonRef.current && dropdownRef.current) {
      createPopper(buttonRef.current, dropdownRef.current, {
        placement: "bottom-start",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
        ],
      });
    }
  }, [isDropdownOpen]);

  // Maneja clics fuera para cerrar el dropdown, se deja en dos UseEffect separados para no hacerlo más lioso
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Verifica si el clic ocurre fuera del dropdown o del botón
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleStateChange = (newState) => {
    if (!isEditable) return;
    setSelectedState(newState);
    onStateChange(newState);
    setIsDropdownOpen(false);
  };

  const openDropdown = () => {
    if (!isEditable) return;
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div className="relative w-full dropdown-container">
      <button
        ref={buttonRef}
        className="flex justify-center items-center px-4 py-2 bg-backgroundHoverBold rounded-md text-black w-full"
        onClick={openDropdown}
      >
        <span
          className="inline-block w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: selectedState?.colorHex }}
        ></span>
        {selectedState?.name || "Selecciona un estado"}
      </button>

      {isDropdownOpen &&
        createPortal(
          <ul
            ref={dropdownRef}
            className="bg-background border border-gray-600 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {contractStates.length > 0 ? (
              contractStates.map((state) => (
                <li
                  key={state.id}
                  className={`flex items-center px-4 py-2 cursor-pointer hover:bg-backgroundHoverBold text-black ${
                    state.id === selectedState?.id
                      ? "bg-backgroundHoverBold"
                      : ""
                  }`}
                  onClick={() => handleStateChange(state)}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: state.colorHex }}
                  ></span>
                  {state.name}
                </li>
              ))
            ) : (
              <li className="text-gray-400 px-4 py-2">
                No hay estados disponibles
              </li>
            )}
          </ul>,
          document.body
        )}
    </div>
  );
}
