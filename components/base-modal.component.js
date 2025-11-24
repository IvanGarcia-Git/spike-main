import { useEffect } from "react";

/**
 * BaseModal - Componente modal reutilizable con diseño neumórfico
 * Basado en el Design System de referencias
 *
 * @param {boolean} isOpen - Controla si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {string} title - Título del modal
 * @param {string} subtitle - Subtítulo opcional del modal
 * @param {React.ReactNode} children - Contenido del modal
 * @param {string} maxWidth - Ancho máximo del modal (default: "max-w-lg")
 * @param {boolean} showCloseButton - Mostrar botón de cerrar (default: true)
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
  showCloseButton = true,
}) {
  // Cerrar modal al presionar ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex justify-center items-center p-4 z-50 animate-fade-in"
      onClick={(e) => {
        // Cerrar al hacer click fuera del modal
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`modal-card w-full ${maxWidth} p-6 relative animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cerrar */}
        {showCloseButton && (
          <button
            className="absolute top-4 right-4 p-2 rounded-full neumorphic-button text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            onClick={onClose}
            type="button"
            aria-label="Cerrar modal"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-left mb-6">
            {title && (
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Contenido */}
        <div>{children}</div>
      </div>
    </div>
  );
}

/**
 * ModalActions - Componente para botones de acción del modal
 *
 * @param {React.ReactNode} children - Botones de acción
 * @param {string} alignment - Alineación de los botones (default: "end")
 */
export function ModalActions({ children, alignment = "end" }) {
  const alignmentClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
  };

  return (
    <div className={`flex gap-2 mt-6 ${alignmentClasses[alignment]}`}>
      {children}
    </div>
  );
}

/**
 * ModalButton - Botón estilizado para modales
 *
 * @param {string} variant - Variante del botón: "primary", "secondary", "danger", "ghost"
 * @param {React.ReactNode} children - Contenido del botón
 * @param {function} onClick - Función al hacer click
 * @param {string} type - Tipo del botón (default: "button")
 * @param {boolean} disabled - Si el botón está deshabilitado
 * @param {string} icon - Nombre del icono de Material Icons (opcional)
 */
export function ModalButton({
  variant = "primary",
  children,
  onClick,
  type = "button",
  disabled = false,
  icon = null,
}) {
  const variantClasses = {
    primary:
      "bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed font-semibold",
    secondary:
      "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold",
    danger:
      "bg-danger text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold",
    ghost:
      "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`neumorphic-button flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-200 ${variantClasses[variant]}`}
    >
      {icon && <span className="material-icons-outlined mr-2">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * ModalInput - Input estilizado para modales
 *
 * @param {string} label - Etiqueta del input
 * @param {string} type - Tipo de input (default: "text")
 * @param {string} id - ID del input
 * @param {string} value - Valor del input
 * @param {function} onChange - Función de cambio
 * @param {boolean} required - Si el campo es requerido
 * @param {string} placeholder - Placeholder del input
 */
export function ModalInput({
  label,
  type = "text",
  id,
  value,
  onChange,
  required = false,
  placeholder = "",
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label
          className="block text-slate-700 dark:text-slate-300 font-medium mb-2"
          htmlFor={id}
        >
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        {...props}
      />
    </div>
  );
}

/**
 * ModalTextarea - Textarea estilizado para modales
 */
export function ModalTextarea({
  label,
  id,
  value,
  onChange,
  required = false,
  placeholder = "",
  rows = 4,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label
          className="block text-slate-700 dark:text-slate-300 font-medium mb-2"
          htmlFor={id}
        >
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
        {...props}
      />
    </div>
  );
}

/**
 * ModalSelect - Select estilizado para modales
 */
export function ModalSelect({
  label,
  id,
  value,
  onChange,
  required = false,
  options = [],
  placeholder = "Seleccionar...",
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label
          className="block text-slate-700 dark:text-slate-300 font-medium mb-2"
          htmlFor={id}
        >
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 rounded-lg neumorphic-card-inset text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
