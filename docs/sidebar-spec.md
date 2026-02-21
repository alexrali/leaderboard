# Especificación del Sidebar — Leaderboard App

> Documento de referencia para el desarrollo del sidebar. Actualizar al agregar, modificar o eliminar opciones.
> Última revisión: 2026-02-21

---

## Estructura General

El sidebar utiliza **shadcn/ui Sidebar** (`variant="sidebar"`, `collapsible="icon"`) con soporte para:
- Colapso a modo solo-icono (`collapsible="icon"`)
- Modo móvil con sheet overlay (breakpoint < 768px)
- Estado persistido en cookie: `sidebar_state`
- Atajo de teclado: `Ctrl/Cmd + B`

---

## Opciones del Sidebar

### Cabecera (Header)
| Campo       | Valor actual       | Notas                          |
|-------------|-------------------|--------------------------------|
| Icono       | `Trophy`          | 40x40px, rounded-2xl           |
| Título      | "Leaderboard"     | Oculto en modo colapsado       |
| Subtítulo   | "Sprint 24"       | Dinámico en el futuro          |

---

### Navegación Principal

#### 1. Panel
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Panel              |
| Icono         | `LayoutDashboard` |
| Clave sección | `dashboard`       |
| Estado        | ✅ Activo          |
| Tooltip       | Panel              |
| Subitems      | Ninguno            |
| Contenido     | `SectionTabs` (vista de pestañas con todas las secciones) |

#### 2. Almacén *(grupo colapsable)*
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Almacén            |
| Icono         | `Package`         |
| Estado        | ✅ Activo (abierto por defecto) |
| Tooltip       | Almacén            |

**Subitems del Almacén:**

| Etiqueta (ES)        | Clave sección   | Estado    | Badge | Contenido renderizado      |
|----------------------|----------------|-----------|-------|---------------------------|
| Resumen Semanal      | `overview`     | ✅ Activo | —     | `WeeklyOverview`          |
| Métricas Generales   | `metrics`      | ✅ Activo | 7 (primario) | `GeneralMetrics`  |
| Progreso del Día     | `day-progress` | ✅ Activo | —     | `DayProgressSection`      |
| Recursos             | `resources`    | ✅ Activo | 6 (success) | `ResourcesDetail`   |

#### 3. Inventario *(grupo colapsable)*
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Inventario         |
| Icono         | `ClipboardList`   |
| Estado        | 🔲 Placeholder     |
| Tooltip       | Inventario         |

**Subitems de Inventario:**

| Etiqueta (ES) | Clave sección       | Estado               |
|---------------|---------------------|----------------------|
| Stock         | `inventory-stock`   | 🔲 Sin implementar  |
| Movimientos   | `inventory-moves`   | 🔲 Sin implementar  |

---

#### 4. Autoservicio *(grupo colapsable)*
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Autoservicio       |
| Icono         | `ShoppingCart`    |
| Estado        | 🔲 Placeholder     |
| Tooltip       | Autoservicio       |

**Subitems de Autoservicio:**

| Etiqueta (ES)   | Clave sección        | Estado               |
|-----------------|----------------------|----------------------|
| Punto de Venta  | `self-pos`           | 🔲 Sin implementar  |
| Pedidos         | `self-orders`        | 🔲 Sin implementar  |

---

#### 5. Distribución *(grupo colapsable)*
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Distribución       |
| Icono         | `Truck`           |
| Estado        | 🔲 Placeholder     |
| Tooltip       | Distribución       |

**Subitems de Distribución:**

| Etiqueta (ES) | Clave sección       | Estado               |
|---------------|---------------------|----------------------|
| Rutas         | `dist-routes`       | 🔲 Sin implementar  |
| Entregas      | `dist-deliveries`   | 🔲 Sin implementar  |

---

#### 7. Equipo *(grupo colapsable)*
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Equipo             |
| Icono         | `Users`           |
| Estado        | 🔲 Placeholder (sin funcionalidad) |
| Tooltip       | Equipo             |

**Subitems del Equipo:**

| Etiqueta (ES) | Clave sección | Estado               |
|---------------|--------------|----------------------|
| Miembros      | `team-members` | 🔲 Sin implementar  |
| Roles         | `team-roles`   | 🔲 Sin implementar  |

#### 8. Reportes
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Reportes           |
| Icono         | `FileText`        |
| Clave sección | `reports`         |
| Estado        | 🔲 Placeholder (sin funcionalidad) |
| Tooltip       | Reportes           |
| Subitems      | Ninguno            |

#### 9. Analítica *(grupo colapsable)*
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Analítica          |
| Icono         | `TrendingUp`      |
| Estado        | 🔲 Placeholder (sin funcionalidad) |
| Tooltip       | Analítica          |

**Subitems de Analítica:**

| Etiqueta (ES) | Clave sección      | Estado               |
|---------------|--------------------|----------------------|
| Rendimiento   | `analytics-perf`   | 🔲 Sin implementar  |
| Tendencias    | `analytics-trends` | 🔲 Sin implementar  |

#### 10. Sprints
| Propiedad     | Valor              |
|---------------|-------------------|
| Etiqueta      | Sprints            |
| Icono         | `ShoppingBag`     |
| Clave sección | `sprints`         |
| Estado        | 🔲 Placeholder (sin funcionalidad) |
| Tooltip       | Sprints            |
| Subitems      | Ninguno            |

---

### Pie de Página (Footer)

| Etiqueta (ES)  | Icono         | Clave sección | Estado                          |
|----------------|--------------|---------------|---------------------------------|
| Configuración  | `Settings`   | `settings`    | 🔲 Sin implementar              |
| Ayuda          | `HelpCircle` | `help`        | 🔲 Sin implementar              |

**Perfil de usuario:**
| Campo       | Valor actual    | Estado               |
|-------------|----------------|----------------------|
| Avatar      | Fallback "SC"  | 🔲 Hardcodeado       |
| Nombre      | "Sarah Chen"   | 🔲 Hardcodeado       |
| Cargo       | "Ingeniero Líder" | 🔲 Hardcodeado    |
| Cerrar sesión | `LogOut` icon | 🔲 Sin handler       |

---

## Restricciones y Reglas

1. **Solo el grupo "Marcador"** tiene funcionalidad completa con `onSectionChange`.
2. Los demás grupos/items son placeholders visuales — no deben activar ningún efecto hasta implementarse.
3. El sidebar colapsa a modo icono: ocultar textos con `group-data-[collapsible=icon]:hidden`.
4. En modo colapsado, el avatar se centra con `group-data-[collapsible=icon]:justify-center`.
5. El botón "Cerrar sesión" se oculta en modo colapsado.
6. Los badges usan `SidebarMenuBadge` — deben posicionarse **dentro del `SidebarMenuSubItem`**, no dentro del botón.
7. El color `success` debe estar definido en `globals.css` para el badge de Recursos.

---

## Variables CSS requeridas

Definir en `:root` de `globals.css`:
```css
--success: oklch(0.645 0.17 142);         /* verde */
--success-foreground: oklch(0.985 0 0);
--warning: oklch(0.75 0.14 75);           /* ámbar */
--warning-foreground: oklch(0.145 0 0);
--info: oklch(0.625 0.17 240);            /* azul */
--info-foreground: oklch(0.985 0 0);
```

---

## Componentes shadcn/ui utilizados

| Componente              | Propósito                         |
|-------------------------|-----------------------------------|
| `Sidebar`               | Contenedor principal              |
| `SidebarHeader`         | Cabecera con logo/marca           |
| `SidebarContent`        | Área scrollable de navegación     |
| `SidebarFooter`         | Área fija inferior                |
| `SidebarGroup`          | Agrupador de sección              |
| `SidebarGroupContent`   | Contenido del grupo               |
| `SidebarMenu`           | Lista de ítems (`<ul>`)           |
| `SidebarMenuItem`       | Ítem de lista (`<li>`)            |
| `SidebarMenuButton`     | Botón interactivo principal       |
| `SidebarMenuBadge`      | Badge con contador                |
| `SidebarMenuSub`        | Lista de subitems anidados        |
| `SidebarMenuSubItem`    | Subítem (`<li>` anidado)          |
| `SidebarMenuSubButton`  | Botón de subítem                  |
| `SidebarSeparator`      | Divisor visual                    |
| `Collapsible`           | Wrapper para grupos expandibles   |
| `CollapsibleTrigger`    | Activador del colapso             |
| `CollapsibleContent`    | Contenido colapsable              |
| `Avatar` / `AvatarFallback` | Perfil de usuario             |

---

## Estado del Sidebar: Mapa de secciones activas

```
activeSection (string) → Componente renderizado en SidebarInset
────────────────────────────────────────────────────────────
"overview"     → WeeklyOverview
"metrics"      → GeneralMetrics
"day-progress" → DayProgressSection
"resources"    → ResourcesDetail
"dashboard"    → SectionTabs
────────────────────────────────────────────────────────────
Otros valores → Sin render (secciones futuras)
```

---

## Roadmap / Secciones por implementar

- [ ] `team-members` — Lista de miembros del equipo
- [ ] `team-roles` — Gestión de roles
- [ ] `reports` — Reportes exportables
- [ ] `analytics-perf` — Gráficas de rendimiento
- [ ] `analytics-trends` — Tendencias históricas
- [ ] `sprints` — Gestión y vista de sprints
- [ ] `settings` — Configuración de la app
- [ ] `help` — Documentación / ayuda
- [ ] Perfil de usuario dinámico (desde Supabase auth)
- [ ] Logout funcional

---

## Íconos requeridos (lucide-react)

`LayoutDashboard`, `Trophy`, `ChevronDown`, `Package`, `ClipboardList`, `ShoppingCart`,
`Truck`, `Users`, `FileText`, `ShoppingBag`, `TrendingUp`, `Settings`, `HelpCircle`, `LogOut`
