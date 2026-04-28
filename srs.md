SRS — Portfolio Developer
# 🧩 Software Requirements Specification (SRS)
## Portfolio Developer — FilipaoVfx

---

## 1. 📌 Introducción

### 1.1 Propósito
Definir los requerimientos técnicos del portfolio interactivo.

### 1.2 Alcance
Aplicación web que presenta proyectos, narrativa técnica y experiencia interactiva.

---

## 2. 🏗 Arquitectura General

### Stack propuesto:

- Frontend: Astro + React
- Styling: TailwindCSS
- Deployment: Cloudflare Pages
- Backend opcional: Supabase
- Animaciones: Framer Motion

---

## 3. ⚙️ Requerimientos Funcionales

### RF1: Visualización de proyectos
- Mostrar 3 proyectos principales
- Cada uno con vista detallada

### RF2: Navegación interactiva
- Timeline / graph interactivo
- Click en nodos → navegación

### RF3: Render de contenido dinámico
- Markdown o JSON para proyectos

### RF4: Contacto
- Botón de contacto visible
- Links externos (GitHub, LinkedIn)

### RF5: Responsive design
- Desktop-first
- Adaptable a mobile

---

## 4. 🎨 Requerimientos de UI

### UI1: Glassmorphism (70%)
- backdrop-blur
- transparencias
- glow

### UI2: Neobrutalism (30%)
- bordes gruesos
- sombras duras
- layout rígido

### UI3: Interacciones
- hover → glow
- click → expansión de nodos

---

## 5. ⚡ Requerimientos No Funcionales

### RNF1: Performance
- Lighthouse > 90
- carga < 2s

### RNF2: SEO
- sitemap
- meta tags
- indexación en Google

### RNF3: Accesibilidad
- contraste adecuado
- navegación clara

### RNF4: Escalabilidad
- añadir proyectos sin romper UI

---

## 6. 🧠 Modelo de Datos

### Project

```json
{
  "title": "string",
  "description": "string",
  "stack": ["string"],
  "problem": "string",
  "solution": "string",
  "learnings": ["string"],
  "link": "string"
}
7. 🧩 Componentes
HeroSection
TimelineGraph
ProjectCard
ProjectDetail
Navbar
Footer
8. 🔌 Integraciones
GitHub API (opcional)
Supabase (opcional analytics o contenido)
9. 🔒 Seguridad
Sin datos sensibles
Sanitización de inputs (si aplica)
10. 🧪 Testing
UI testing básico
Performance testing
Cross-browser testing
11. 🚀 Deployment
Cloudflare Pages
CI/CD con GitHub Actions
12. 📈 Futuras Mejoras
Integración con agentes (OpenClaw)
Analytics de comportamiento
Modo “interactive demo” para proyectos
13. 🧠 Consideraciones Finales

El sistema debe ser:

Rápido
Intuitivo
Diferenciador

No es un sitio web, es una experiencia.