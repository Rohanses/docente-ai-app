const fs = require('fs');
const path = require('path');

const OFFICIAL_DIR = path.join(__dirname, 'data/official_curriculum');
const DB_DIR = path.join(__dirname, 'data/db');
const SEEDED_CONTENTS_PATH = path.join(DB_DIR, 'seeded_contents.json');
const CATALOGO_PATH = path.join(DB_DIR, 'catalogo.json');

const catalog = {
  niveles: [
    {
      id: 'eifc',
      nombre: 'Educación Inicial en Familia Comunitaria',
      sigla: 'EIFC',
      grados: [1, 2],
      usa_campos: true,
      usa_areas: false,
      archivo_fuente: 'planes-programas-inicial-2023.md'
    },
    {
      id: 'epcv',
      nombre: 'Educación Primaria Comunitaria Vocacional',
      sigla: 'EPCV',
      grados: [1, 2, 3, 4, 5, 6],
      usa_campos: true,
      usa_areas: true,
      archivo_fuente: 'planes-programas-primaria-2023.md'
    },
    {
      id: 'escp',
      nombre: 'Educación Secundaria Comunitaria Productiva',
      sigla: 'ESCP',
      grados: [1, 2, 3, 4, 5, 6],
      usa_campos: true,
      usa_areas: true,
      archivo_fuente: 'planes-programas-secundaria-2023.md'
    }
  ],
  trimestres: [1, 2, 3],
  campos: [
    { id: 'ccp', nombre: 'Cosmos y Pensamiento', siglas: ['CCP', 'CSCCP'] },
    { id: 'ccs', nombre: 'Comunidad y Sociedad', siglas: ['CCS', 'CSCCS'] },
    { id: 'cvtt', nombre: 'Vida Tierra Territorio', siglas: ['CVTT', 'CSCVTT'] },
    { id: 'cctp', nombre: 'Ciencia, Tecnología y Producción', siglas: ['CCTP', 'CSCCTP'] }
  ],
  areas_primaria: [
    { id: 'comunicacion', nombre: 'Comunicación y Lenguajes', campo: 'ccs' },
    { id: 'matematica', nombre: 'Matemática', campo: 'cctp' },
    { id: 'ciencias_sociales', nombre: 'Ciencias Sociales', campo: 'ccs' },
    { id: 'ed_fisica', nombre: 'Educación Física y Deportes', campo: 'ccs' },
    { id: 'ed_musical', nombre: 'Educación Musical', campo: 'ccs' },
    { id: 'artes_plasticas', nombre: 'Artes Plásticas y Visuales', campo: 'ccs' },
    { id: 'ciencias_naturales', nombre: 'Ciencias Naturales', campo: 'cvtt' },
    { id: 'valores', nombre: 'Valores, Espiritualidades y Religiones', campo: 'ccp' },
    { id: 'tecnica_tecnologica', nombre: 'Técnica Tecnológica', campo: 'cctp' }
  ],
  areas_secundaria: [
    { id: 'biologia', nombre: 'Ciencias Naturales: Biología – Geografía', campo: 'cvtt' },
    { id: 'fisica', nombre: 'Ciencias Naturales: Física', campo: 'cvtt' },
    { id: 'quimica', nombre: 'Ciencias Naturales: Química', campo: 'cvtt' },
    { id: 'comunicacion', nombre: 'Comunicación y Lenguajes: Lengua Castellana', campo: 'ccs' },
    { id: 'lengua_extranjera', nombre: 'Lengua Extranjera', campo: 'ccs' },
    { id: 'ciencias_sociales', nombre: 'Ciencias Sociales', campo: 'ccs' },
    { id: 'matematica', nombre: 'Matemática', campo: 'cctp' },
    { id: 'ed_fisica', nombre: 'Educación Física y Deportes', campo: 'ccs' },
    { id: 'ed_musical', nombre: 'Educación Musical', campo: 'ccs' },
    { id: 'artes_plasticas', nombre: 'Artes Plásticas y Visuales', campo: 'ccs' },
    { id: 'filosofia', nombre: 'Cosmovisiones Filosofía y Sicología', campo: 'ccp' },
    { id: 'valores', nombre: 'Valores Espiritualidad y Religiones', campo: 'ccp' },
    { id: 'tecnica_tecnologica', nombre: 'Técnica Tecnológica General', campo: 'cctp' }
  ]
};

function ensureDirs() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function cleanText(text) {
  if (!text) return '';
  return text.trim()
    .replace(/\s+/g, ' ');
}

// PARSE DE PRIMARIA (Grade -> Area -> Trimester)
function parsePrimaria(filePath, areasList) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Archivo no encontrado para Primaria: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const results = [];

  const gradeSplitRegex = /(?:4\.\d+\.\s+|2\.\d+\.\s+)?(Primer|Segundo|Tercer|Cuarto|Quinto|Sexto)\s+año\s+de\s+escolaridad/gi;
  const sections = [];
  let match;
  let lastIndex = 0;
  let lastGrade = '';

  while ((match = gradeSplitRegex.exec(content)) !== null) {
    if (lastGrade) {
      sections.push({
        grade: lastGrade,
        text: content.substring(lastIndex, match.index)
      });
    }
    lastGrade = match[1].toLowerCase();
    lastIndex = match.index;
  }
  if (lastGrade) {
    sections.push({
      grade: lastGrade,
      text: content.substring(lastIndex)
    });
  }

  const gradeMap = {
    'primer': 1, 'segundo': 2, 'tercer': 3, 'cuarto': 4, 'quinto': 5, 'sexto': 6
  };

  sections.forEach(section => {
    const gradeNum = gradeMap[section.grade];
    if (!gradeNum) return;

    areasList.forEach(area => {
      const escapedAreaName = area.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const areaRegex = new RegExp(`ÁREA DE SABERES Y CONOCIMIENTO[S]?\\s*:\\s*${escapedAreaName}`, 'i');
      const areaMatch = section.text.search(areaRegex);
      if (areaMatch === -1) return;

      let areaText = section.text.substring(areaMatch);
      const nextAreaMatch = areaText.substring(50).search(/(?:ÁREA|CAMPO) DE SABERES Y CONOCIMIENTO/i);
      if (nextAreaMatch !== -1) {
        areaText = areaText.substring(0, nextAreaMatch + 50);
      }

      let perfilSalida = '';
      const perfilMatch = areaText.match(/PERFIL DE SALIDA([\s\S]*?)CONTENIDOS/i);
      if (perfilMatch) {
        perfilSalida = cleanText(perfilMatch[1]);
      }

      const trimestres = [1, 2, 3];
      trimestres.forEach(trim => {
        let trimWord = trim === 1 ? 'Primer' : trim === 2 ? 'Segundo' : 'Tercer';
        const trimRegex = new RegExp(`${trimWord}\\s+trimestre`, 'i');
        const trimMatch = areaText.search(trimRegex);

        let contentsText = '';
        if (trimMatch !== -1) {
          let trimBlock = areaText.substring(trimMatch);
          const nextTrimWord = trim === 1 ? 'Segundo' : trim === 2 ? 'Tercer' : 'CAMPO';
          const nextTrimRegex = new RegExp(`(?:${nextTrimWord}\\s+trimestre|CAMPO DE SABERES|ÁREA DE SABERES)`, 'i');
          const nextTrimMatch = trimBlock.substring(30).search(nextTrimRegex);
          if (nextTrimMatch !== -1) {
            trimBlock = trimBlock.substring(0, nextTrimMatch + 30);
          }
          contentsText = trimBlock.replace(trimRegex, '');
        }

        const bullets = contentsText.split(/(?:•|-|\*)\s+/)
          .map(b => cleanText(b))
          .filter(b => b.length > 5);

        results.push({
          nivel: 'epcv',
          grado: gradeNum,
          area: area.id,
          trimestre: trim,
          perfil_salida: perfilSalida || `Desarrollo curricular en el área de ${area.nombre}`,
          contenidos: bullets.length > 0 ? bullets : ['Contenidos educativos oficiales.']
        });
      });
    });
  });

  return results;
}

// PARSE DE SECUNDARIA (Area -> Grade -> Trimester)
function parseSecundaria(filePath, areasList) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Archivo no encontrado para Secundaria: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const results = [];

  areasList.forEach(area => {
    // Buscar el área en secundaria
    // Formato de cabecera: "2.6. COMUNICACIÓN Y LENGUAJES: LENGUA CASTELLANA" o similar
    const escapedAreaName = area.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const areaRegex = new RegExp(`2\\s*\\.\\s*\\d+\\s*\\.\\s*${escapedAreaName}`, 'i');
    const areaMatch = content.search(areaRegex);
    if (areaMatch === -1) {
      // Intento alternativo de coincidencia simplificada
      const simpleRegex = new RegExp(escapedAreaName, 'i');
      const simpleMatch = content.search(simpleRegex);
      if (simpleMatch === -1) return;
    }

    let areaText = content.substring(areaMatch !== -1 ? areaMatch : 0);
    // Recortar hasta la siguiente área principal
    const nextAreaMatch = areaText.substring(100).search(/2\s*\\.\s*\\d+\s*\\.\s*/i);
    if (nextAreaMatch !== -1) {
      areaText = areaText.substring(0, nextAreaMatch + 100);
    }

    // Dentro de este bloque de área, buscar secciones por grado:
    // "DEL PRIMER AÑO DE ESCOLARIDAD", "DEL SEGUNDO AÑO...", etc.
    const gradeWords = ['PRIMER', 'SEGUNDO', 'TERCER', 'CUARTO', 'QUINTO', 'SEXTO'];
    gradeWords.forEach((gradeWord, index) => {
      const gradeNum = index + 1;
      const gradeRegex = new RegExp(`DEL\\s+${gradeWord}\\s+AÑO\\s+DE\\s+ESCOLARIDAD`, 'i');
      const gradeMatch = areaText.search(gradeRegex);
      if (gradeMatch === -1) return;

      let gradeBlock = areaText.substring(gradeMatch);
      // Recortar hasta el siguiente grado o fin de área
      const nextGradeWord = index < 5 ? gradeWords[index + 1] : '3\\s*\\.';
      const nextGradeRegex = new RegExp(`(?:DEL\\s+${nextGradeWord}\\s+AÑO|3\\s*\\.)`, 'i');
      const nextGradeMatch = gradeBlock.substring(50).search(nextGradeRegex);
      if (nextGradeMatch !== -1) {
        gradeBlock = gradeBlock.substring(0, nextGradeMatch + 50);
      }

      // Extraer perfil de salida
      let perfilSalida = '';
      const perfilMatch = gradeBlock.match(/PERFIL DE SALIDA([\s\S]*?)CONTENIDOS/i);
      if (perfilMatch) {
        perfilSalida = cleanText(perfilMatch[1]);
      }

      // Separar por trimestres
      const trimestres = [1, 2, 3];
      trimestres.forEach(trim => {
        let trimWord = trim === 1 ? 'Primer' : trim === 2 ? 'Segundo' : 'Tercer';
        const trimRegex = new RegExp(`${trimWord}\\s+trimestre`, 'i');
        const trimMatch = gradeBlock.search(trimRegex);

        let contentsText = '';
        if (trimMatch !== -1) {
          let trimBlock = gradeBlock.substring(trimMatch);
          const nextTrimWord = trim === 1 ? 'Segundo' : trim === 2 ? 'Tercer' : 'LECTURAS|PERFIL';
          const nextTrimRegex = new RegExp(`(?:${nextTrimWord}\\s+trimestre|LECTURAS|PERFIL)`, 'i');
          const nextTrimMatch = trimBlock.substring(30).search(nextTrimRegex);
          if (nextTrimMatch !== -1) {
            trimBlock = trimBlock.substring(0, nextTrimMatch + 30);
          }
          contentsText = trimBlock.replace(trimRegex, '');
        }

        const bullets = contentsText.split(/(?:•|-|\*|ͳ)\s+/)
          .map(b => cleanText(b))
          .filter(b => b.length > 5);

        results.push({
          nivel: 'escp',
          grado: gradeNum,
          area: area.id,
          trimestre: trim,
          perfil_salida: perfilSalida || `Desarrollo curricular en el área de ${area.nombre}`,
          contenidos: bullets.length > 0 ? bullets : ['Contenidos educativos oficiales para secundaria.']
        });
      });
    });
  });

  return results;
}

// PARSE DE INICIAL
function parseInicial(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Archivo no encontrado para Inicial: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const results = [];

  const gradeSplitRegex = /(?:2\.[12]\.\s+)?(Primer|Segundo)\s+año\s+de\s+escolaridad/gi;
  const sections = [];
  let match;
  let lastIndex = 0;
  let lastGrade = '';

  while ((match = gradeSplitRegex.exec(content)) !== null) {
    if (lastGrade) {
      sections.push({
        grade: lastGrade,
        text: content.substring(lastIndex, match.index)
      });
    }
    lastGrade = match[1].toLowerCase();
    lastIndex = match.index;
  }
  if (lastGrade) {
    sections.push({
      grade: lastGrade,
      text: content.substring(lastIndex)
    });
  }

  const gradeMap = { 'primer': 1, 'segundo': 2 };

  sections.forEach(section => {
    const gradeNum = gradeMap[section.grade];
    if (!gradeNum) return;

    catalog.campos.forEach(campo => {
      const campoRegex = new RegExp(`CAMPO DE SABERES Y CONOCIMIENTOS\\s+${campo.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      const campoMatch = section.text.search(campoRegex);
      if (campoMatch === -1) return;

      let campoText = section.text.substring(campoMatch);
      const nextCampoMatch = campoText.substring(50).search(/CAMPO DE SABERES Y CONOCIMIENTOS/i);
      if (nextCampoMatch !== -1) {
        campoText = campoText.substring(0, nextCampoMatch + 50);
      }

      const trimestres = [1, 2, 3];
      trimestres.forEach(trim => {
        let contentsText = '';
        if (trim === 1) {
          const secondTrimMatch = campoText.search(/SEGUNDO TRIMESTRE/i);
          contentsText = secondTrimMatch !== -1 ? campoText.substring(0, secondTrimMatch) : campoText;
        } else if (trim === 2) {
          const secondTrimMatch = campoText.search(/SEGUNDO TRIMESTRE/i);
          const thirdTrimMatch = campoText.search(/TERCER TRIMESTRE/i);
          if (secondTrimMatch !== -1) {
            contentsText = thirdTrimMatch !== -1 ? campoText.substring(secondTrimMatch, thirdTrimMatch) : campoText.substring(secondTrimMatch);
          }
        } else {
          const thirdTrimMatch = campoText.search(/TERCER TRIMESTRE/i);
          if (thirdTrimMatch !== -1) {
            contentsText = campoText.substring(thirdTrimMatch);
          }
        }

        const bullets = contentsText.split(/\n+/)
          .map(b => cleanText(b))
          .filter(b => b.length > 10 && !b.toUpperCase().includes('TRIMESTRE') && !b.toUpperCase().includes('CAMPO DE SABERES'));

        results.push({
          nivel: 'eifc',
          grado: gradeNum,
          area: campo.id,
          trimestre: trim,
          perfil_salida: `Desarrollo holístico en el campo ${campo.nombre}`,
          contenidos: bullets.length > 0 ? bullets : ['Contenidos educativos sugeridos para el trimestre.']
        });
      });
    });
  });

  return results;
}

function main() {
  console.log('Iniciando presembrado de contenidos curriculares (seeding)...');
  ensureDirs();

  const allSeededContent = [];

  // 1. Inicial (EIFC)
  const inicialFile = path.join(OFFICIAL_DIR, catalog.niveles[0].archivo_fuente);
  console.log(`Parseando Inicial desde: ${inicialFile}...`);
  const inicialContents = parseInicial(inicialFile);
  allSeededContent.push(...inicialContents);
  console.log(`Inicial: ${inicialContents.length} registros cargados.`);

  // 2. Primaria (EPCV)
  const primariaFile = path.join(OFFICIAL_DIR, catalog.niveles[1].archivo_fuente);
  console.log(`Parseando Primaria desde: ${primariaFile}...`);
  const primariaContents = parsePrimaria(primariaFile, catalog.areas_primaria);
  allSeededContent.push(...primariaContents);
  console.log(`Primaria: ${primariaContents.length} registros cargados.`);

  // 3. Secundaria (ESCP)
  const secundariaFile = path.join(OFFICIAL_DIR, catalog.niveles[2].archivo_fuente);
  console.log(`Parseando Secundaria desde: ${secundariaFile}...`);
  const secundariaContents = parseSecundaria(secundariaFile, catalog.areas_secundaria);
  allSeededContent.push(...secundariaContents);
  console.log(`Secundaria: ${secundariaContents.length} registros cargados.`);

  // Guardar datos
  fs.writeFileSync(SEEDED_CONTENTS_PATH, JSON.stringify(allSeededContent, null, 2), 'utf8');
  fs.writeFileSync(CATALOGO_PATH, JSON.stringify(catalog, null, 2), 'utf8');

  console.log(`\nPresembrado completado con éxito!`);
  console.log(`Catálogo guardado en: ${CATALOGO_PATH}`);
  console.log(`Contenidos presembrados guardados en: ${SEEDED_CONTENTS_PATH} (${allSeededContent.length} registros en total).`);
}

if (require.main === module) {
  main();
}
