# Spikes Design System - Guía de Uso

## 📚 Descripción

Sistema de diseño neumórfico completo para la aplicación Spikes CRM/ERP. Incluye documentación detallada de todos los tokens de diseño, componentes y patrones de uso.

## 🎨 Archivos del Sistema

### 1. `design-system.html`
**Documentación completa del sistema de diseño**

Contiene:
- Introducción y principios de diseño
- Design Tokens (colores, tipografía, sombras, espaciado, border-radius)
- Documentación de todos los componentes
- Código de ejemplo para cada componente
- Guidelines de uso y mejores prácticas

**Acceso:**
- Desarrollo: `http://localhost:4000/design-system.html`
- Producción: `https://tudominio.com/design-system.html`

### 2. `showcase.html`
**Playground interactivo de componentes**

Contiene:
- Ejemplos interactivos de todos los componentes
- Casos de uso reales (Dashboard, Formularios, Cards, Tablas, Modales, Notificaciones)
- Componentes funcionales que puedes probar
- Navegación por secciones

**Acceso:**
- Desarrollo: `http://localhost:4000/showcase.html`
- Producción: `https://tudominio.com/showcase.html`

## 🎯 Características del Sistema

### Estilo Neumórfico
- Diseño moderno con profundidad y elegancia
- Sombras suaves que crean efectos de elevación y hundimiento
- Colores sutiles y transiciones smooth

### Responsive Design
- Adaptable a todos los tamaños de pantalla
- Mobile-first approach
- Componentes fluidos

### Modo Oscuro
- Soporte completo para tema oscuro
- Transiciones suaves entre temas
- Tokens de color específicos para cada modo

## 🎨 Design Tokens

### Colores

#### Primarios
```css
primary: #14b8a6      /* Teal 500 */
primary-dark: #0f766e  /* Teal 700 */
primary-light: #5eead4 /* Teal 300 */
```

#### Fondos
```css
background-light: #F0F2F5
background-dark: #1a1c23
card-dark: #2E3039
```

#### Estados
```css
success: #10b981  /* Green 500 */
warning: #f59e0b  /* Amber 500 */
danger: #ef4444   /* Red 500 */
info: #3b82f6     /* Blue 500 */
```

### Sombras Neumórficas

#### Elevadas (Raised)
```css
/* Default */
shadow-neumorphic-light: 3px 3px 6px #d9dbde, -3px -3px 6px #ffffff
shadow-neumorphic-dark: 3px 3px 6px #15171c, -3px -3px 6px #1f212a

/* Small */
shadow-neumorphic-light-sm: 2px 2px 4px #d9dbde, -2px -2px 4px #ffffff
shadow-neumorphic-dark-sm: 2px 2px 4px #15171c, -2px -2px 4px #1f212a

/* Large */
shadow-neumorphic-light-lg: 5px 5px 10px #d9dbde, -5px -5px 10px #ffffff
shadow-neumorphic-dark-lg: 5px 5px 10px #15171c, -5px -5px 10px #1f212a
```

#### Hundidas (Inset)
```css
shadow-neumorphic-inset-light: inset 3px 3px 6px #d5d7da, inset -3px -3px 6px #ffffff
shadow-neumorphic-inset-dark: inset 2px 2px 4px #15171c, inset -2px -2px 4px #1f212a
```

### Tipografía

**Fuente:** Poppins

**Escala de tamaños:**
```
text-xs: 12px
text-sm: 14px
text-base: 16px
text-lg: 18px
text-xl: 20px
text-2xl: 24px
text-3xl: 30px
text-4xl: 36px
text-5xl: 48px
```

**Pesos:**
```
font-light: 300
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
```

### Espaciado

Sistema basado en múltiplos de 4px (0.25rem):
```
p-1, m-1: 4px
p-2, m-2: 8px
p-3, m-3: 12px
p-4, m-4: 16px
p-6, m-6: 24px
p-8, m-8: 32px
```

### Border Radius

```css
rounded-sm: 0.5rem (8px)
rounded-md: 0.75rem (12px)
rounded-lg: 1rem (16px)
rounded-xl: 1.5rem (24px)
rounded-2xl: 2rem (32px)
rounded-full: 9999px
```

## 🧩 Componentes Principales

### 1. Cards

#### Card Elevada (Raised)
```html
<div class="neumorphic-card p-6">
  <h4 class="font-semibold text-slate-800 dark:text-slate-200 mb-2">Título</h4>
  <p class="text-sm text-slate-600 dark:text-slate-400">Contenido</p>
</div>
```

#### Card Hundida (Inset)
```html
<div class="neumorphic-card-inset p-6">
  <h4 class="font-semibold text-slate-800 dark:text-slate-200 mb-2">Título</h4>
  <p class="text-sm text-slate-600 dark:text-slate-400">Contenido</p>
</div>
```

### 2. Botones

#### Botón Primario
```html
<button class="px-6 py-3 rounded-lg bg-primary text-white font-semibold neumorphic-button">
  Click Me
</button>
```

#### Botón Neumórfico
```html
<button class="px-6 py-3 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400">
  Default
</button>

<!-- Active State -->
<button class="px-6 py-3 rounded-lg neumorphic-button active font-medium text-primary">
  Active
</button>
```

#### Icon Button
```html
<button class="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center text-slate-600 dark:text-slate-400">
  <span class="material-icons-outlined">search</span>
</button>
```

### 3. Inputs

#### Text Input
```html
<input
  type="text"
  placeholder="Placeholder..."
  class="w-full neumorphic-card-inset px-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
/>
```

#### Input con Icono
```html
<div class="relative">
  <span class="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
    search
  </span>
  <input
    type="text"
    class="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:outline-none bg-transparent text-slate-800 dark:text-slate-200"
  />
</div>
```

### 4. Progress Bars

```html
<!-- Simple Progress Bar -->
<div class="neumorphic-progress-track h-2.5">
  <div class="bg-primary h-full rounded-full" style="width: 75%"></div>
</div>

<!-- Progress Bar con Etiqueta -->
<div class="neumorphic-progress-track h-4">
  <div class="bg-primary h-full rounded-full flex items-center justify-center text-white text-xs font-bold" style="width: 86%">
    86%
  </div>
</div>
```

### 5. Tabs

```html
<!-- Active Tab -->
<button class="px-5 py-2 rounded-lg neumorphic-button active font-semibold text-primary">
  Tab 1
</button>

<!-- Inactive Tab -->
<button class="px-5 py-2 rounded-lg neumorphic-button font-medium text-slate-600 dark:text-slate-400">
  Tab 2
</button>
```

### 6. Modales

```html
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div class="modal-card p-6 w-full max-w-md">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
        Título del Modal
      </h2>
      <button class="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>

    <!-- Content -->
    <p class="text-slate-600 dark:text-slate-400 mb-6">
      Contenido del modal...
    </p>

    <!-- Actions -->
    <div class="flex gap-3">
      <button class="flex-1 neumorphic-button px-6 py-3 rounded-lg bg-primary text-white font-semibold">
        Confirmar
      </button>
      <button class="flex-1 neumorphic-button px-6 py-3 rounded-lg text-slate-600 dark:text-slate-400 font-semibold">
        Cancelar
      </button>
    </div>
  </div>
</div>
```

### 7. Tablas

```html
<table class="w-full text-left">
  <thead class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
    <tr>
      <th class="p-3">Nombre</th>
      <th class="p-3">Email</th>
    </tr>
  </thead>
  <tbody>
    <tr class="table-row-divider">
      <td class="p-3 font-medium text-slate-800 dark:text-slate-200">John Doe</td>
      <td class="p-3 text-slate-600 dark:text-slate-400">john@example.com</td>
    </tr>
  </tbody>
</table>
```

## 📋 Classes Utility Personalizadas

### Clases Neumórficas

```css
.neumorphic-card             /* Card elevada */
.neumorphic-card-inset       /* Card hundida */
.neumorphic-button           /* Botón con efecto hover */
.neumorphic-button.active    /* Estado activo del botón */
.neumorphic-progress-track   /* Track de progreso */
.modal-card                  /* Modal con sombra oscura sin resplandor */
.table-row-divider          /* Divisor de filas de tabla */
```

## ✅ Mejores Prácticas

### ✓ Hacer

1. **Usar fondos coincidentes**
   ```html
   <!-- Correcto -->
   <div class="bg-background-light dark:bg-background-dark">
     <div class="neumorphic-card p-6">...</div>
   </div>
   ```

2. **Mantener espaciado consistente**
   ```html
   <!-- Usar el sistema de espaciado -->
   <div class="p-6 mb-4 space-y-3">
   ```

3. **Implementar estados hover/active**
   ```html
   <button class="neumorphic-button hover:text-primary transition-colors">
   ```

### ✗ Evitar

1. **No usar sombras sobre fondos incorrectos**
   ```html
   <!-- Incorrecto - fondo blanco con sombra para #F0F2F5 -->
   <div class="bg-white">
     <div class="neumorphic-card">...</div>
   </div>
   ```

2. **No mezclar estilos de sombras**
   ```html
   <!-- Incorrecto -->
   <div class="shadow-lg neumorphic-card">...</div>
   ```

3. **No abusar del contraste**
   - El neumorfismo requiere sutileza
   - Evita colores muy brillantes o muy oscuros

4. **No anidar muchos niveles**
   ```html
   <!-- Evitar -->
   <div class="neumorphic-card">
     <div class="neumorphic-card">
       <div class="neumorphic-card">...</div>
     </div>
   </div>
   ```

## 🌓 Implementación del Modo Oscuro

### HTML
```html
<!-- Toggle en JavaScript -->
<button onclick="toggleDarkMode()">
  <span id="theme-icon" class="material-icons-outlined">dark_mode</span>
</button>
```

### JavaScript
```javascript
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const icon = document.getElementById('theme-icon');
  icon.textContent = document.documentElement.classList.contains('dark')
    ? 'light_mode'
    : 'dark_mode';
}
```

### CSS Clases
Usar el prefijo `dark:` para estilos del modo oscuro:
```html
<div class="text-slate-800 dark:text-slate-100">
  <p class="text-slate-600 dark:text-slate-400">Texto secundario</p>
</div>
```

## 🔧 Configuración de Tailwind

Para usar estos componentes en tu proyecto Next.js, asegúrate de tener esta configuración en `tailwind.config.js`:

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#14b8a6',
        'primary-dark': '#0f766e',
        'primary-light': '#5eead4',
        'background-light': '#F0F2F5',
        'background-dark': '#1a1c23',
        // ... otros colores
      },
      boxShadow: {
        'neumorphic-light': '3px 3px 6px #d9dbde, -3px -3px 6px #ffffff',
        'neumorphic-dark': '3px 3px 6px #15171c, -3px -3px 6px #1f212a',
        // ... otras sombras
      },
      borderRadius: {
        DEFAULT: '1rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1.25rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
    }
  }
}
```

Y en `globals.css`:

```css
.neumorphic-card {
  @apply bg-background-light dark:bg-background-dark shadow-neumorphic-light dark:shadow-neumorphic-dark rounded-xl transition-all duration-300;
}

.neumorphic-card-inset {
  @apply bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark rounded-xl transition-all duration-300;
}

.neumorphic-button {
  @apply shadow-neumorphic-light dark:shadow-neumorphic-dark hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all duration-200;
}

.neumorphic-button.active {
  @apply shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark;
}

.neumorphic-progress-track {
  @apply bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark rounded-full overflow-hidden;
}

.table-row-divider {
  border-top: 1px solid #E2E4E7;
}

.dark .table-row-divider {
  border-top: 1px solid #252830;
}

/* Modal specific styles */
.modal-card {
  background: #F0F2F5;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
  border-radius: 1rem;
}

.dark .modal-card {
  background: #1a1c23;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

## 📖 Recursos Adicionales

### Iconos
- **Material Icons Outlined**: https://fonts.google.com/icons
- Importar en HTML: `<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">`

### Fuentes
- **Poppins**: https://fonts.google.com/specimen/Poppins
- Importar en HTML: `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">`

## 🎓 Aprende Más

1. **Explora el Design System**: Abre `design-system.html` para ver la documentación completa
2. **Juega con el Showcase**: Abre `showcase.html` para ver componentes interactivos
3. **Revisa el código fuente**: Todos los archivos están bien comentados
4. **Experimenta**: Crea tus propios componentes siguiendo los patrones establecidos

## 📝 Versiones

- **v1.1** - Mejoras en efectos y sombras (Actual)
  - Eliminado color secundario amarillo
  - Reemplazado resplandor de inputs por efecto neumórfico puro (sin `focus:ring`)
  - Reemplazadas sombras de modales con sombra oscura sin resplandor blanco
  - Nueva clase `.modal-card` para modales con sombras mejoradas

- **v1.0** - Sistema de diseño inicial con componentes principales
  - Cards (elevadas e inset)
  - Botones (primarios, neumórficos, icon buttons)
  - Inputs y formularios
  - Tabs y navegación
  - Tablas
  - Modales
  - Progress bars
  - Modo oscuro completo

## 🤝 Contribuciones

Para agregar nuevos componentes o mejorar los existentes:

1. Sigue el patrón de diseño neumórfico establecido
2. Asegúrate de que funcione en modo claro y oscuro
3. Documenta el componente en `design-system.html`
4. Agrega un ejemplo interactivo en `showcase.html`
5. Actualiza este README con el nuevo componente

---

**© 2025 Spikes CRM/ERP - Design System v1.0**

Construido con ❤️ y Tailwind CSS
