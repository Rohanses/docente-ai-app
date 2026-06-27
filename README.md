# Avelino.IA 🇧🇴

Avelino.IA es un asistente pedagógico inteligente diseñado para maestras y maestros del Sistema Educativo Plurinacional (SEP) de Bolivia. Su objetivo principal es optimizar la planificación curricular, las evaluaciones y la autoevaluación de los estudiantes, alineándose estrictamente con el **Modelo Educativo Sociocomunitario Productivo (MESCP)** y los lineamientos de la **Ley 070 Avelino Siñani - Elizardo Pérez**.

---

## 🚀 Características Principales

*   **Generación de PDC (Plan de Desarrollo Curricular):** Crea planes de clase estructurados (semanales o directos para Inicial) alineados al Currículo Base y el Proyecto Socioproductivo (PSP) de la unidad educativa.
*   **Generador de Evaluaciones:** Diseña exámenes escritos, rúbricas analíticas o preguntas de desarrollo contextualizadas con solucionario integrado.
*   **Fichas de Autoevaluación:** Genera fichas reflexivas en primera persona para evaluar las dimensiones del **SER** (valores) y **DECIDIR** (toma de decisiones e impacto del PSP).
*   **Sistema de Créditos y Exportación:** Permite la visualización gratuita ilimitada de documentos y el consumo de 1 crédito al exportar a formatos descargables como Microsoft Word (`.docx`) y PDF.
*   **Base de Conocimientos Local:** Utiliza documentos curriculares oficiales precargados de Bolivia (Planes y Programas, Lineamientos, Reglamentos) para contextualizar las respuestas de la IA.

---

## 🛠️ Stack Tecnológico

El proyecto está organizado en una arquitectura monorrepósito dividida en dos componentes principales:

### 🖥️ Frontend (`frontend/`)
*   **Tecnología Principal:** React (iniciado con Vite)
*   **Estilos:** CSS Vanilla premium con diseño adaptable, tema oscuro y efectos glassmorphism.
*   **Exportación:** `docx` para generar documentos Word y `html2canvas` / `jspdf` para PDF.
*   **Iconografía:** `lucide-react`

### ⚙️ Backend (`backend/`)
*   **Tecnología Principal:** Node.js + Express
*   **Integración de IA:** SDK Oficial de Google Gemini (`@google/generative-ai`)
*   **Modelo Utilizado:** `gemini-1.5-flash` (configurable en entorno)
*   **Base de Datos:** Sistema de almacenamiento local basado en archivos JSON en `backend/data/db/` (`users.json`, `history.json`, `transactions.json`) para una máxima portabilidad y compatibilidad en Windows.

---

## 📦 Estructura del Proyecto

```text
docente-ai-app/
├── backend/                   # Servidor Express e integración con Gemini
│   ├── data/
│   │   ├── db/                # Base de datos local en formato JSON
│   │   └── official_curriculum/ # Currículo base y planes de estudio oficiales
│   ├── services/              # Lógica de Gemini y persistencia de datos
│   ├── server.js              # Punto de entrada del servidor
│   └── .env.example           # Configuración de variables de entorno de ejemplo
├── frontend/                  # Aplicación cliente React
│   ├── src/
│   │   ├── components/        # Componentes de la interfaz (Planner, Evaluator, etc.)
│   │   └── utils/             # Funciones utilitarias de exportación y llamadas API
│   ├── index.html
│   └── vite.config.js
└── README.md                  # Documentación del proyecto (este archivo)
```

---

## ⚙️ Instalación y Configuración

### Requisitos Previos
*   Node.js (v18 o superior)
*   Una API Key de Google Gemini (puedes obtenerla en [Google AI Studio](https://aistudio.google.com/))

### 1. Clonar el repositorio
```bash
git clone https://github.com/Rohanses/docente-ai-app.git
cd docente-ai-app
```

### 2. Configurar el Backend
1. Entra a la carpeta de backend:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` basado en `.env.example` o configura el tuyo:
   ```env
   PORT=5000
   GEMINI_API_KEY=tu_gemini_api_key_aqui
   GEMINI_MODEL=gemini-1.5-flash
   ```
4. Inicializa o siembra los datos iniciales de catálogo (opcional):
   ```bash
   npm run seed
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *(El servidor correrá en `http://localhost:5000`)*

### 3. Configurar el Frontend
1. Desde la raíz del proyecto, ingresa a la carpeta frontend:
   ```bash
   cd ../frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
   *(El cliente estará disponible en `http://localhost:5173`)*

---

## 🇧🇴 Enfoque Pedagógico MESCP
El desarrollo curricular en **Avelino.IA** cumple estrictamente con las directrices bolivianas:
1.  **Objetivo Holístico:** Integra las dimensiones del **Ser** (valores), **Saber** (conocimientos), **Hacer** (práctica/producción) y **Decidir** (incidencia social).
2.  **Momentos Metodológicos:**
    *   **Práctica:** Contacto directo con la realidad y experimentación.
    *   **Teoría:** Conceptualización y análisis crítico.
    *   **Valoración:** Reflexión comunitaria y ética.
    *   **Producción:** Creación de un producto tangible o intangible.
3.  **Recursos:** Clasificados en Analógicos, Producción de Conocimientos y De la Vida Diaria.
