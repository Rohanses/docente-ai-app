# Reglas y Directrices de Desarrollo (Avelino.IA)

Este archivo contiene las directrices, estilos de diseño y reglas pedagógicas que rigen el desarrollo y las consultas de Inteligencia Artificial para el proyecto **Avelino.IA**.

---

## 🛠️ Directrices Técnicas del Proyecto

### 1. Arquitectura Full-Stack
- **Frontend (React + Vite):**
  - Ubicación: `frontend/`
  - Librerías clave: `lucide-react` (iconos), `html2canvas` & `jspdf` (PDF), `docx` (Word).
  - Estilos: Vanilla CSS premium (en `frontend/src/index.css`) con variables de diseño para tema claro/oscuro y glassmorphism. **Evitar ad-hoc utilities si no son consistentes con los tokens globales.**
- **Backend (Node.js + Express):**
  - Ubicación: `backend/`
  - Librerías clave: `@google/generative-ai` (Gemini SDK), `multer` (gestión de subida de archivos).
  - Base de Datos: Estructurada en archivos JSON bajo `backend/data/db/` (`users.json`, `history.json`, `transactions.json`) para mantener portabilidad absoluta y evitar problemas de compilación binaria en Windows.

### 2. Integración de la IA (Gemini API)
- El backend carga la clave API de la variable `GEMINI_API_KEY` en el archivo `.env` o la recibe dinámicamente desde el cliente en la cabecera/cuerpo del request.
- Modelo por defecto: `gemini-1.5-flash` (configurable en `.env` mediante `GEMINI_MODEL`).
- Los prompts de IA deben nutrirse de los documentos curriculares pre-cargados en la carpeta `backend/data/official_curriculum/` combinados con los Proyecto Socioproductivo (PSP) subidos por los docentes en `backend/data/user_documents/`.

### 3. Lógica del Sistema de Créditos
- La generación en pantalla de borradores de PDC o Exámenes es **gratuita** e ilimitada.
- Las acciones de **Exportación** (descargar Word, imprimir PDF o copiar formato al portapapeles) consumen **1 crédito**.
- Si el rol de usuario es `'admin'`, las exportaciones son siempre gratuitas.
- El saldo se debita llamando al endpoint `POST /api/users/consume-credit` antes de que el frontend realice la descarga.

---

## 🇧🇴 Reglas Curriculares y Pedagógicas (MESCP - Bolivia)

Cualquier cambio o generación de contenidos curriculares por la IA debe alinearse con la **Ley 070 Avelino Siñani - Elizardo Pérez** y el **Modelo Educativo Sociocomunitario Productivo (MESCP)**:

### 1. Estructura del Plan de Desarrollo Curricular (PDC)
- **Datos Referenciales:** Unidad Educativa, Nivel (Inicial, Primaria, Secundaria), Año de escolaridad, Campo de saberes, Área, Trimestre, Temática del PSP.
- **Objetivo Holístico:** Redactado en primera persona del plural, integrando armónicamente las cuatro dimensiones (Ser, Saber, Hacer, Decidir).
- **Momentos Metodológicos (Secuencia Didáctica):**
  - **Práctica:** Partir de la experiencia, de la experimentación o contacto directo con la realidad.
  - **Teoría:** Análisis crítico, conceptualización e investigación científica.
  - **Valoración:** Reflexión ética, social, comunitaria y cuidado de la Madre Tierra.
  - **Producción:** Elaboración del producto final tangible o intangible.
- **Recursos/Materiales:** Clasificados en *Analógicos*, *De producción de conocimientos* y *De la vida diaria*.
- **Criterios de Evaluación:** Evaluaciones específicas de los momentos metodológicos vinculadas a las dimensiones (SER, SABER, HACER y DECIDIR).
- **Adaptaciones Curriculares:** Apoyos específicos para estudiantes con dificultades de aprendizaje o discapacidades (TDH, TEA, etc.) sin aislarlos del grupo.

### 2. Autoevaluación
- Enfocada como un proceso metacognitivo donde el estudiante reflexiona honestamente y valora cuantitativamente su comportamiento y compromiso escolar:
  - **SER:** Valores sociocomunitarios y de convivencia pacífica.
  - **DECIDIR:** Impacto de sus decisiones, pensamiento crítico y contribución al PSP familiar/escolar.
