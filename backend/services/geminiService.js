const { GoogleGenerativeAI } = require('@google/generative-ai');
const storageService = require('./storageService');

// Inicializar el cliente de Gemini
function getGeminiClient(customApiKey) {
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('API Key de Gemini no encontrada. Por favor configúrala en el archivo .env o en los ajustes.');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
}

// Obtener el modelo
function getModel(customApiKey, modelName = 'gemini-1.5-flash') {
    const genAI = getGeminiClient(customApiKey);
    const activeModel = process.env.GEMINI_MODEL || modelName;
    return genAI.getGenerativeModel({ model: activeModel });
}

// === GENERACIÓN DE PDC ===
async function generatePDC(params, customApiKey) {
    const {
        nivel,
        grado,
        campo,
        area,
        trimestre,
        psp,
        objetivoHolistico,
        contenidos,
        metodologiasInnovadoras = 'Aprendizaje Cooperativo, Aula Invertida, Rutinas de Pensamiento',
        dificultadesEstudiantes = 'Estudiante 1: Dificultad en lectura comprensiva, Estudiante 2: TDAH leve'
    } = params;

    const model = getModel(customApiKey);
    
    // Obtener contexto curriculares base pasando trimestre
    const curriculumContext = storageService.getContextForAI(nivel, grado, area, trimestre);

    const prompt = `
Eres un asesor pedagógico experto en el Sistema Educativo Plurinacional (SEP) de Bolivia, con un profundo conocimiento del Modelo Educativo Sociocomunitario Productivo (MESCP) (Ley 070) y experto en las mejores metodologías y estrategias pedagógicas innovadoras a nivel mundial (como Aprendizaje Basado en Proyectos, Design Thinking, Aula Invertida, Gamificación, Rutinas de Pensamiento y enfoques neuroeducativos).

Tu tarea es redactar un PLAN DE DESARROLLO CURRICULAR (PDC) altamente profesional, contextualizado y detallado para el sistema boliviano, siguiendo estrictamente el formato oficial.

---
### DATOS DE ENTRADA DEL DOCENTE:
- **Nivel:** ${nivel}
- **Año de escolaridad (Grado):** ${grado}
- **Campo de Saberes:** ${campo}
- **Área (Materia):** ${area}
- **Trimestre:** ${trimestre}
- **Proyecto Socioproductivo (PSP) de la Unidad Educativa:** ${psp}
- **Objetivo Holístico sugerido o base:** ${objetivoHolistico}
- **Contenidos y Ejes Articuladores a desarrollar:** ${contenidos}
- **Metodologías Innovadoras/Experimentales Mundiales a incorporar:** ${metodologiasInnovadoras}
- **Casos para Adaptación Curricular:** ${dificultadesEstudiantes}

---
### INFORMACIÓN DE REFERENCIA DEL CURRÍCULO BASE Y TEXTOS (RAG):
${curriculumContext}

---
### REQUISITOS DE REDACCIÓN Y ESTRUCTURA DEL PDC:
1. **Objetivo Holístico:** Redáctalo en primera persona del plural (Fortalecemos..., desarrollando..., a través de..., para contribuir a...). Debe integrar de manera articulada las cuatro dimensiones:
   - **SER:** Valores sociocomunitarios y principios éticos.
   - **SABER:** Comprensión de conceptos y conocimientos.
   - **HACER:** Aplicación práctica, procedimientos, experimentación.
   - **DECIDIR:** Impacto transformador en la comunidad (articulado con la temática del PSP).
2. **Momentos Metodológicos:**
   - Redacta actividades ricas y detalladas. Explica cómo el docente guiará la clase.
   - Integra de forma explícita las Estrategias Innovadoras seleccionadas (${metodologiasInnovadoras}).
   - Para Primaria/Secundaria, organiza en 4 semanas.
   - Para Inicial, genera actividades de momentos directos (Práctica, Teoría, Valoración, Producción) sin estructura semanal.
3. **Recursos/Materiales:** Clasifícalos obligatoriamente en:
   - Analógicos
   - Producción de conocimientos
   - De la vida diaria
4. **Criterios de Evaluación:** Redáctalos en relación a los perfiles de salida y contenidos, orientados a: Ser, Saber, Hacer, Decidir.
5. **Adaptaciones Curriculares:**
   - Diseña adaptaciones detalladas para los casos mencionados (${dificultadesEstudiantes}).
   - Si es significativamente necesario, llena también el apartado de Adaptaciones Curriculares Significativas.

Debes devolver obligatoriamente un objeto JSON con el siguiente esquema estricto:

{
  "datosReferenciales": {
    "distrito": "Distrito Educativo",
    "unidadEducativa": "Unidad Educativa",
    "nivel": "${nivel}",
    "grado": "${grado}",
    "maestro": "Nombre del Maestro",
    "director": "Nombre del Director",
    "gestion": "2026",
    "trimestre": "${trimestre}",
    "fechaInicio": "2026-02-01",
    "fechaFin": "2026-03-01"
  },
  "objetivoHolisticoNivel": "El objetivo holístico del nivel...",
  "estructuraPDC": {
    "tipo": "${(nivel.toLowerCase().includes('inicial') || nivel.toLowerCase() === 'eifc') ? 'directo' : 'semanal'}",
    "areas": [
      {
        "nombreArea": "${area}",
        "objetivoAprendizaje": "Objetivo de aprendizaje o holístico del área...",
        "contenidos": [
          "Contenido 1...",
          "Contenido 2..."
        ],
        "semanas": [
          {
            "semana": 1,
            "periodos": 8,
            "momentos": {
              "practica": "Detalle del momento Práctica...",
              "teoria": "Detalle del momento Teoría...",
              "valoracion": "Detalle del momento Valoración...",
              "produccion": "Detalle del momento Producción..."
            },
            "recursos": {
              "analogicos": ["Recurso 1", "Recurso 2"],
              "produccion": ["Recurso 1"],
              "vida": ["Recurso 1"]
            },
            "criteriosEvaluacion": {
              "ser": "Criterio Ser...",
              "saber": "Criterio Saber...",
              "hacer": "Criterio Hacer...",
              "decidir": "Criterio Decidir..."
            }
          }
        ],
        "momentosDirectos": {
          "practica": "...",
          "teoria": "...",
          "valoracion": "...",
          "produccion": "..."
        },
        "recursosDirectos": {
          "analogicos": [],
          "produccion": [],
          "vida": []
        },
        "criteriosDirectos": {
          "ser": "...",
          "saber": "...",
          "hacer": "...",
          "decidir": "..."
        },
        "adaptacionesCurriculares": "Detalle de adaptaciones metodológicas generales..."
      }
    ]
  },
  "adaptacionesSignificativas": [
    {
      "estudiante": "Nombre/ID del Estudiante con dificultad",
      "discapacidad": "Descripción de dificultad/discapacidad",
      "contenido": "Contenido adaptado",
      "adaptacion": "Metodología de adaptación aplicada",
      "criterioEvaluacion": "Criterio de evaluación adaptado"
    }
  ]
}

Nota: Si el tipo es 'directo' (para Nivel Inicial), llena 'momentosDirectos', 'recursosDirectos' y 'criteriosDirectos', y deja 'semanas' vacío. Si el tipo es 'semanal' (para Primaria y Secundaria), llena la matriz de 'semanas' con las 4 semanas correspondientes, y deja vacíos los campos 'momentosDirectos', 'recursosDirectos' y 'criteriosDirectos'.
`;

    try {
        const response = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        return response.response.text();
    } catch (e) {
        console.error('Error generando PDC en Gemini:', e);
        throw e;
    }
}

// === GENERACIÓN DE EVALUACIONES ===
async function generateEvaluation(params, customApiKey) {
    const {
        nivel,
        grado,
        area,
        contenidos,
        tipoEvaluacion = 'Examen Escrito (Opción múltiple y preguntas de desarrollo)',
        numPreguntas = 5,
        criterioEvaluacion = 'Evaluar la comprensión crítica de los contenidos y su aplicación en la vida diaria',
        dificultad = 'Intermedio'
    } = params;

    const model = getModel(customApiKey);
    const curriculumContext = storageService.getContextForAI(nivel, grado, area, params.trimestre || 1);

    const prompt = `
Eres un docente experto en evaluación diagnóstica, formativa y sumativa en Bolivia, bajo el enfoque del MESCP y las tendencias globales de evaluación por competencias y pensamiento crítico.

Diseña una Evaluación Pedagógica profesional.

---
### DATOS DEL EXAMEN:
- **Nivel:** ${nivel}
- **Año de escolaridad (Grado):** ${grado}
- **Área (Materia):** ${area}
- **Contenidos Evaluados:** ${contenidos}
- **Tipo de Evaluación:** ${tipoEvaluacion}
- **Número de preguntas o secciones:** ${numPreguntas}
- **Criterio de Evaluación Principal:** ${criterioEvaluacion}
- **Nivel de Dificultad:** ${dificultad}

---
### CONTEXTO DE REFERENCIA:
${curriculumContext}

---
### REQUISITOS DEL DOCUMENTO GENERADO:
1. Diseña preguntas de alta calidad pedagógica. Evita la simple memorización mecánica; promueve el razonamiento, análisis y aplicación práctica de los conocimientos en la vida diaria.
2. Si es Examen Escrito, combina preguntas conceptuales y de desarrollo o análisis de casos relacionados con el contexto boliviano.
3. Si es una Rúbrica, crea una tabla detallada con criterios específicos (por ejemplo, alineados a las dimensiones Saber y Hacer) y niveles de desempeño (Excelente, Bueno, En desarrollo, Necesita apoyo) con descriptores claros.
4. Incluye solucionario para el docente al final.

Debes devolver obligatoriamente un objeto JSON con el siguiente esquema estricto:

{
  "datosEvaluacion": {
    "nivel": "${nivel}",
    "grado": "${grado}",
    "area": "${area}",
    "tema": "${contenidos}",
    "tipoEvaluacion": "${tipoEvaluacion}"
  },
  "instrucciones": "Texto con las instrucciones del examen o rúbrica...",
  "preguntas": [
    {
      "numero": 1,
      "tipo": "opcion_multiple", // o "desarrollo", "rubrica_criterio", "completar"
      "pregunta": "Enunciado de la pregunta o del criterio de la rúbrica...",
      "opciones": ["opción A", "opción B", "opción C", "opción D"], // opcional, vacío si no aplica
      "respuestaCorrecta": "Respuesta correcta o descriptor de corrección..."
    }
  ],
  "solucionario": "Detalles adicionales del solucionario y puntuaciones para el docente..."
}
`;

    try {
        const response = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        return response.response.text();
    } catch (e) {
        console.error('Error generando evaluación en Gemini:', e);
        throw e;
    }
}

// === GENERACIÓN DE AUTOEVALUACIONES ===
async function generateSelfEvaluation(params, customApiKey) {
    const {
        nivel,
        grado,
        area,
        temaTrimestre = 'Valores y contenidos del trimestre',
        numCriterios = 4
    } = params;

    const model = getModel(customApiKey);
    const curriculumContext = storageService.getContextForAI(nivel, grado, area, params.trimestre || 1);

    const prompt = `
Eres un docente y psicólogo educativo boliviano, experto en evaluación cualitativa y el proceso de autoevaluación reflexiva de las y los estudiantes bajo el MESCP. En el modelo boliviano, la autoevaluación es un proceso metacognitivo de reflexión honesta del estudiante sobre su desarrollo en dos dimensiones fundamentales:
- **SER:** Práctica de valores sociocomunitarios (responsabilidad, respeto, complementariedad, honestidad).
- **DECIDIR:** Impacto de sus decisiones, pensamiento crítico, compromiso con la comunidad, la Madre Tierra y su Proyecto Socioproductivo (PSP).

Diseña una Ficha de Autoevaluación didáctica, atractiva y reflexiva para el estudiante.

---
### DATOS DEL DOCUMENTO:
- **Nivel:** ${nivel}
- **Año de escolaridad (Grado):** ${grado}
- **Área (Materia):** ${area}
- **Contenidos/Tema del Trimestre:** ${temaTrimestre}
- **Cantidad de Criterios por Dimensión:** ${numCriterios}

---
### CONTEXTO DE REFERENCIA:
${curriculumContext}

---
### REQUISITOS DEL DOCUMENTO:
1. Mensaje motivador breve en lenguaje sencillo que explique la importancia de autoevaluarse con honestidad.
2. Afirmaciones reflexivas del SER redactadas en primera persona del singular.
3. Afirmaciones reflexivas del DECIDIR redactadas en primera persona del singular relacionadas con la toma de decisiones críticas, la aplicación de lo aprendido y su contribución frente a la temática del PSP.
4. Preguntas metacognitivas abiertas para profundizar.

Debes devolver obligatoriamente un objeto JSON con el siguiente esquema estricto:

{
  "datosFicha": {
    "nivel": "${nivel}",
    "grado": "${grado}",
    "area": "${area}",
    "trimestre": "Trimestre correspondiente"
  },
  "introduccion": "Mensaje motivador breve e inspirador...",
  "criteriosSer": [
    {
      "id": 1,
      "criterio": "Afirmación reflexiva sobre el SER en primera persona (ej. Comparto mis materiales con empatía...)"
    }
  ],
  "criteriosDecidir": [
    {
      "id": 1,
      "criterio": "Afirmación reflexiva sobre el DECIDIR en primera persona (ej. Aplico lo aprendido para reciclar en casa...)"
    }
  ],
  "preguntasMetacognitivas": [
    "¿Qué es lo que más me gustó aprender este trimestre?",
    "¿En qué aspectos considero que debo mejorar?"
  ]
}
`;

    try {
        const response = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        return response.response.text();
    } catch (e) {
        console.error('Error generando autoevaluación en Gemini:', e);
        throw e;
    }
}

module.exports = {
    generatePDC,
    generateEvaluation,
    generateSelfEvaluation
};
