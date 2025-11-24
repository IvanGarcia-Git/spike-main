# Guía de Implementación de Modales con Diseño Neumórfico

## Resumen

Se ha implementado un sistema de modales reutilizable con diseño neumórfico basado en el Design System de la aplicación. Este sistema incluye:

1. **BaseModal**: Componente base de modal con estilos neumórficos
2. **Componentes auxiliares**: ModalActions, ModalButton, ModalInput, ModalTextarea, ModalSelect
3. **Estilos consistentes**: Integrados con Tailwind y el sistema de diseño existente

## Componente BaseModal

### Props

```jsx
<BaseModal
  isOpen={boolean}           // Controla si el modal está abierto
  onClose={function}         // Función para cerrar el modal
  title={string}             // Título del modal
  subtitle={string}          // Subtítulo opcional
  maxWidth={string}          // Ancho máximo (default: "max-w-lg")
  showCloseButton={boolean}  // Mostrar botón X (default: true)
>
  {children}                 // Contenido del modal
</BaseModal>
```

### Características

- ✅ Overlay con backdrop blur
- ✅ Cierre al presionar ESC
- ✅ Cierre al hacer click fuera del modal
- ✅ Botón de cerrar en esquina superior derecha
- ✅ Animaciones de entrada (fade-in y slide-up)
- ✅ Soporte para dark mode
- ✅ Diseño neumórfico consistente
- ✅ Previene scroll del body cuando está abierto

## Componentes Auxiliares

### ModalActions

Contenedor para botones de acción al final del modal.

```jsx
<ModalActions alignment="end">  // "start", "center", "end", "between"
  <ModalButton>Cancelar</ModalButton>
  <ModalButton variant="primary">Guardar</ModalButton>
</ModalActions>
```

### ModalButton

Botones estilizados para modales con 4 variantes.

```jsx
<ModalButton
  variant="primary"   // "primary", "secondary", "danger", "ghost"
  onClick={handleClick}
  type="button"       // "button", "submit"
  disabled={false}
  icon="save"         // Material Icons name (opcional)
>
  Guardar
</ModalButton>
```

**Variantes:**
- `primary`: Botón principal (color primary/teal)
- `secondary`: Botón secundario (gris)
- `danger`: Botón de peligro (rojo)
- `ghost`: Botón con borde transparente

### ModalInput

Input estilizado con diseño neumórfico.

```jsx
<ModalInput
  label="Nombre"
  type="text"
  id="name"
  value={value}
  onChange={handleChange}
  required={true}
  placeholder="Introduce tu nombre"
/>
```

### ModalTextarea

Textarea estilizado con diseño neumórfico.

```jsx
<ModalTextarea
  label="Descripción"
  id="description"
  value={value}
  onChange={handleChange}
  rows={4}
  required={false}
  placeholder="Escribe una descripción"
/>
```

### ModalSelect

Select estilizado con diseño neumórfico.

```jsx
<ModalSelect
  label="Estado"
  id="status"
  value={selectedValue}
  onChange={handleChange}
  options={[
    { value: "1", label: "Opción 1" },
    { value: "2", label: "Opción 2" }
  ]}
  placeholder="Selecciona una opción"
  required={true}
/>
```

## Guía de Migración

### Paso 1: Importar el componente

```jsx
import BaseModal, {
  ModalActions,
  ModalButton,
  ModalInput,
  ModalTextarea,
  ModalSelect
} from "./base-modal.component";
```

### Paso 2: Reemplazar estructura del modal

**Antes:**
```jsx
<div className="fixed inset-0 bg-black bg-opacity-60 ...">
  <div className="bg-white p-6 rounded-lg ...">
    <h2>Título</h2>
    {/* contenido */}
  </div>
</div>
```

**Después:**
```jsx
<BaseModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Título"
  subtitle="Subtítulo opcional"
>
  {/* contenido */}
</BaseModal>
```

### Paso 3: Reemplazar inputs

**Antes:**
```jsx
<div className="mb-4">
  <label className="block text-black mb-2">Nombre</label>
  <input
    type="text"
    className="w-full px-4 py-2 rounded bg-background"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
</div>
```

**Después:**
```jsx
<ModalInput
  label="Nombre"
  type="text"
  id="name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  required
/>
```

### Paso 4: Reemplazar botones

**Antes:**
```jsx
<div className="flex justify-end">
  <button className="bg-red-600 text-white px-4 py-2">Cancelar</button>
  <button className="bg-blue-600 text-white px-4 py-2">Guardar</button>
</div>
```

**Después:**
```jsx
<ModalActions>
  <ModalButton variant="ghost" onClick={handleCancel}>
    Cancelar
  </ModalButton>
  <ModalButton variant="primary" type="submit" icon="save">
    Guardar
  </ModalButton>
</ModalActions>
```

## Ejemplos Completos

### Ejemplo 1: Modal Simple

```jsx
export default function SimpleModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Registro"
      subtitle="Completa la información"
    >
      <ModalInput
        label="Nombre"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <ModalActions>
        <ModalButton variant="ghost" onClick={onClose}>
          Cancelar
        </ModalButton>
        <ModalButton variant="primary" onClick={onSave} icon="save">
          Guardar
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
```

### Ejemplo 2: Modal con Formulario

```jsx
export default function FormModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    description: "",
    status: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Usuario"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <ModalInput
            label="Nombre"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <ModalInput
            label="Email"
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        <ModalSelect
          label="Estado"
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          options={[
            { value: "active", label: "Activo" },
            { value: "inactive", label: "Inactivo" }
          ]}
          required
        />

        <ModalTextarea
          label="Descripción"
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={4}
        />

        <ModalActions>
          <ModalButton variant="ghost" onClick={onClose}>
            Cancelar
          </ModalButton>
          <ModalButton variant="primary" type="submit" icon="person_add">
            Crear Usuario
          </ModalButton>
        </ModalActions>
      </form>
    </BaseModal>
  );
}
```

### Ejemplo 3: Modal de Confirmación

```jsx
export default function ConfirmModal({ isOpen, onClose, onConfirm, message }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Acción"
      maxWidth="max-w-md"
    >
      <p className="text-slate-700 dark:text-slate-300 mb-6">
        {message}
      </p>

      <ModalActions>
        <ModalButton variant="ghost" onClick={onClose}>
          Cancelar
        </ModalButton>
        <ModalButton variant="danger" onClick={onConfirm} icon="delete">
          Eliminar
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
```

## Modales Migrados

- ✅ `new-task.modal.js` - Completamente migrado con tabs
- ✅ `change-state.modal.js` - Completamente migrado

## Modales Pendientes de Migración

Los siguientes modales necesitan ser migrados al nuevo sistema:

1. `calendar-details-day.modal.js`
2. `change-channel.modal.js`
3. `communication.modal.js`
4. `confirm-create-contract.modal.js`
5. `contract-new-event.modal.js`
6. `contracts-documents.modal.js`
7. `contracts-type.modal.js`
8. `group-link.modal.js`
9. `edit-and-create-leadSheet.modal.js`
10. `group-users.modal.js`
11. `new-communication.modal.js`
12. `new-campaign.modal.js`
13. `new-rate.modal.js`
14. `renew-contract.modal.js`
15. `send-task.modal.js`
16. `task-detail.modal.js`
17. `comparativas/nueva-comparativa.modal.js`
18. `edit-and-create-group.modal.js`
19. `email-reset-password.modal.js`
20. `new-user.modal.js`

## Personalización

### Iconos de Material Icons

Los botones pueden incluir iconos de Material Icons:

```jsx
<ModalButton icon="save">Guardar</ModalButton>
<ModalButton icon="delete">Eliminar</ModalButton>
<ModalButton icon="add">Crear</ModalButton>
<ModalButton icon="edit">Editar</ModalButton>
```

Lista completa: https://fonts.google.com/icons

### Anchos de Modal

Usa las clases de Tailwind para el ancho máximo:

- `max-w-sm` - Pequeño (384px)
- `max-w-md` - Mediano (448px)
- `max-w-lg` - Grande (512px) - **Default**
- `max-w-xl` - Extra grande (576px)
- `max-w-2xl` - 2X grande (672px)
- `max-w-3xl` - 3X grande (768px)

### Estilos Personalizados

Si necesitas estilos adicionales, usa las clases de Tailwind directamente:

```jsx
<BaseModal ...>
  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-4">
    Contenido especial
  </div>
</BaseModal>
```

## Compatibilidad con React Select

Para usar React Select con estilos neumórficos:

```jsx
import Select from "react-select";

<Select
  options={options}
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
```

## Notas Importantes

1. **Material Icons**: Asegúrate de que la fuente de Material Icons esté cargada en `globals.css` (ya está incluida)

2. **Z-Index**: Los modales usan `z-50` por defecto. Si necesitas más, ajusta en el componente

3. **Scroll**: El scroll del body se bloquea automáticamente cuando el modal está abierto

4. **Animaciones**: Las animaciones ya están definidas en `tailwind.config.js`:
   - `animate-fade-in`
   - `animate-slide-up`

5. **Dark Mode**: Todos los componentes tienen soporte completo para dark mode

## Recursos

- **Tailwind Config**: `/spike-main/tailwind.config.js`
- **Global CSS**: `/spike-main/app/globals.css`
- **Referencia HTML**: `/references/comparativa-modal.html`
- **BaseModal**: `/spike-main/components/base-modal.component.js`
