const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Directorios de datos
const DATA_DIR = path.join(__dirname, '../data');
const DB_DIR = path.join(__dirname, '../data/db');
const OFFICIAL_DIR = path.join(__dirname, '../data/official_curriculum');
const USER_DIR = path.join(__dirname, '../data/user_documents');
const MODELO_ORIGIN_DIR = path.join(__dirname, '../../../documentos_modelo');

// Rutas de archivos JSON
const USERS_PATH = path.join(DB_DIR, 'users.json');
const HISTORY_PATH = path.join(DB_DIR, 'history.json');
const TRANSACTIONS_PATH = path.join(DB_DIR, 'transactions.json');
const CATALOGO_PATH = path.join(DB_DIR, 'catalogo.json');
const SEEDED_CONTENTS_PATH = path.join(DB_DIR, 'seeded_contents.json');

// Utilidad criptográfica simple (SHA-256)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Inicializar base de datos
function initialize() {
    // Asegurar estructura de carpetas
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(OFFICIAL_DIR)) fs.mkdirSync(OFFICIAL_DIR, { recursive: true });
    if (!fs.existsSync(USER_DIR)) fs.mkdirSync(USER_DIR, { recursive: true });

    // Inicializar users.json
    if (!fs.existsSync(USERS_PATH)) {
        const defaultAdmin = {
            id: 'admin_root',
            email: 'admin@avelino.ia',
            password: hashPassword('admin123'),
            name: 'Administrador Avelino',
            role: 'admin',
            credits: 9999,
            createdAt: new Date().toISOString()
        };
        fs.writeFileSync(USERS_PATH, JSON.stringify([defaultAdmin], null, 2), 'utf8');
        console.log('users.json inicializado con administrador por defecto.');
    }

    // Inicializar history.json
    if (!fs.existsSync(HISTORY_PATH)) {
        // Si existía un db.json anterior de la versión monopersonal, podemos migrar sus datos a history.json
        const oldDbPath = path.join(__dirname, '../db.json');
        let initialHistory = [];
        
        if (fs.existsSync(oldDbPath)) {
            try {
                const oldData = JSON.parse(fs.readFileSync(oldDbPath, 'utf8'));
                // Migrar asociando los antiguos items al administrador por defecto
                initialHistory = (oldData.history || []).map(item => ({
                    ...item,
                    userId: 'admin_root'
                }));
                console.log(`Migrados ${initialHistory.length} elementos de planificación al nuevo history.json`);
                fs.unlinkSync(oldDbPath); // Eliminar db.json antiguo
            } catch (e) {
                console.error('Error migrando db.json antiguo:', e);
            }
        }
        
        fs.writeFileSync(HISTORY_PATH, JSON.stringify(initialHistory, null, 2), 'utf8');
        console.log('history.json inicializado.');
    }

    // Inicializar transactions.json
    if (!fs.existsSync(TRANSACTIONS_PATH)) {
        fs.writeFileSync(TRANSACTIONS_PATH, JSON.stringify([], null, 2), 'utf8');
        console.log('transactions.json inicializado.');
    }

    // Copiar archivos markdown de documentos_modelo a official_curriculum si no existen
    if (fs.existsSync(MODELO_ORIGIN_DIR)) {
        try {
            const files = fs.readdirSync(MODELO_ORIGIN_DIR);
            let copyCount = 0;
            files.forEach(file => {
                if (file.endsWith('.md') && file !== 'convert_pdf_to_md.py') {
                    const srcPath = path.join(MODELO_ORIGIN_DIR, file);
                    const destPath = path.join(OFFICIAL_DIR, file);
                    if (!fs.existsSync(destPath)) {
                        fs.copyFileSync(srcPath, destPath);
                        copyCount++;
                    }
                }
            });
            if (copyCount > 0) {
                console.log(`Copiados ${copyCount} archivos curriculares base a la carpeta oficial.`);
            }
        } catch (error) {
            console.error('Error al copiar archivos curriculares base:', error);
        }
    }
    
    try {
        initializeRAG();
    } catch (e) {
        console.error('Error inicializando RAG en initialize():', e);
    }
}

// === AUTHENTICATION Y USUARIOS ===

function getUsers() {
    try {
        if (!fs.existsSync(USERS_PATH)) return [];
        return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
    } catch (e) {
        return [];
    }
}

function saveUsers(usersList) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(usersList, null, 2), 'utf8');
}

function registerUser(email, password, name, nivel = 'General') {
    const users = getUsers();
    const emailLower = email.toLowerCase().trim();
    
    if (users.find(u => u.email.toLowerCase() === emailLower)) {
        throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    const newUser = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        email: emailLower,
        password: hashPassword(password),
        name: name.trim(),
        nivel: nivel,
        role: 'docente',
        credits: 5, // Bono de bienvenida
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Registrar transacción de bienvenida
    logTransaction(newUser.id, 'add', 5, 'Bono de bienvenida por registro');

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

function authenticateUser(email, password) {
    const users = getUsers();
    const emailLower = email.toLowerCase().trim();
    const hash = hashPassword(password);

    const user = users.find(u => u.email.toLowerCase() === emailLower && u.password === hash);
    if (!user) {
        throw new Error('Credenciales incorrectas o usuario no encontrado.');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

function getUserById(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

// === HISTORIAL CRUD FILTRADO POR USUARIO ===

function getHistory(userId) {
    try {
        if (!fs.existsSync(HISTORY_PATH)) return [];
        const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
        
        // El administrador puede ver todo, el docente solo lo suyo
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        if (user && user.role === 'admin') {
            return history;
        }
        
        return history.filter(item => item.userId === userId);
    } catch (e) {
        console.error('Error leyendo history.json:', e);
        return [];
    }
}

function saveHistoryItem(userId, item) {
    try {
        if (!fs.existsSync(HISTORY_PATH)) return null;
        const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
        
        const newItem = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            userId: userId,
            date: new Date().toISOString(),
            ...item
        };
        
        history.unshift(newItem);
        fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
        return newItem;
    } catch (e) {
        console.error('Error guardando en history.json:', e);
        throw e;
    }
}

function deleteHistoryItem(id) {
    try {
        if (!fs.existsSync(HISTORY_PATH)) return false;
        const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
        const filtered = history.filter(item => item.id !== id);
        fs.writeFileSync(HISTORY_PATH, JSON.stringify(filtered, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Error eliminando de history.json:', e);
        throw e;
    }
}

// === GESTIÓN DE CRÉDITOS Y TRANSACCIONES ===

function getTransactions() {
    try {
        if (!fs.existsSync(TRANSACTIONS_PATH)) return [];
        return JSON.parse(fs.readFileSync(TRANSACTIONS_PATH, 'utf8'));
    } catch (e) {
        return [];
    }
}

function logTransaction(userId, type, amount, description) {
    try {
        const transactions = getTransactions();
        const users = getUsers();
        const user = users.find(u => u.id === userId);
        
        const newTransaction = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            userId: userId,
            userEmail: user ? user.email : 'desconocido',
            type: type, // 'add' o 'consume'
            amount: amount,
            description: description,
            date: new Date().toISOString()
        };
        
        transactions.unshift(newTransaction);
        fs.writeFileSync(TRANSACTIONS_PATH, JSON.stringify(transactions, null, 2), 'utf8');
        return newTransaction;
    } catch (e) {
        console.error('Error guardando transacción:', e);
    }
}

function consumeUserCredit(userId, amount = 1, description = 'Descarga de documento') {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        throw new Error('Usuario no encontrado.');
    }
    
    const user = users[userIndex];
    
    // Si es administrador, no tiene límite de créditos
    if (user.role === 'admin') {
        logTransaction(userId, 'consume', amount, `${description} (Exento por Admin)`);
        return user.credits;
    }
    
    if (user.credits < amount) {
        throw new Error('Créditos insuficientes. Por favor, solicita más créditos a tu administrador.');
    }

    user.credits -= amount;
    users[userIndex] = user;
    saveUsers(users);

    logTransaction(userId, 'consume', amount, description);
    return user.credits;
}

function addUserCredits(userId, amount, description = 'Carga de créditos por administrador') {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        throw new Error('Usuario no encontrado.');
    }
    
    users[userIndex].credits += amount;
    saveUsers(users);

    logTransaction(userId, 'add', amount, description);
    return users[userIndex].credits;
}

// === HELPERS DE ADMINISTRADOR ===

function listAllUsers() {
    return getUsers().map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
}

function listAllTransactions() {
    return getTransactions();
}

function getSystemStats() {
    const users = getUsers();
    const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8') || '[]');
    const transactions = getTransactions();

    const teachers = users.filter(u => u.role === 'docente');
    const totalDownloads = transactions.filter(t => t.type === 'consume').reduce((acc, curr) => acc + curr.amount, 0);

    return {
        totalTeachers: teachers.length,
        totalGenerations: history.length,
        totalDownloads: totalDownloads,
        activeCredits: teachers.reduce((acc, curr) => acc + curr.credits, 0)
    };
}

// === DOCUMENTOS (KNOWLEDGE BASE) ===

function listOfficialDocuments() {
    try {
        if (!fs.existsSync(OFFICIAL_DIR)) return [];
        return fs.readdirSync(OFFICIAL_DIR)
            .filter(f => f.endsWith('.md'))
            .map(f => ({ name: f, type: 'official' }));
    } catch (e) {
        return [];
    }
}

function listUserDocuments() {
    try {
        if (!fs.existsSync(USER_DIR)) return [];
        return fs.readdirSync(USER_DIR)
            .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
            .map(f => ({ name: f, type: 'user' }));
    } catch (e) {
        return [];
    }
}

function deleteUserDocument(name) {
    try {
        const safeName = path.basename(name);
        const filePath = path.join(USER_DIR, safeName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (e) {
        console.error('Error al eliminar archivo de usuario:', e);
        throw e;
    }
}

function saveUserDocument(name, content) {
    try {
        const safeName = path.basename(name).replace(/\.[^/.]+$/, "") + ".md";
        const filePath = path.join(USER_DIR, safeName);
        fs.writeFileSync(filePath, content, 'utf8');
        return { name: safeName, type: 'user' };
    } catch (e) {
        console.error('Error guardando archivo de usuario:', e);
        throw e;
    }
}

function getCatalog() {
    try {
        if (!fs.existsSync(CATALOGO_PATH)) return { niveles: [], trimestres: [], campos: [], areas_primaria: [], areas_secundaria: [] };
        return JSON.parse(fs.readFileSync(CATALOGO_PATH, 'utf8'));
    } catch (e) {
        console.error('Error al leer catalogo.json:', e);
        return { niveles: [], trimestres: [], campos: [], areas_primaria: [], areas_secundaria: [] };
    }
}

function getSeededContent(nivel, grado, area, trimestre) {
    try {
        if (!fs.existsSync(SEEDED_CONTENTS_PATH)) return [];
        const contents = JSON.parse(fs.readFileSync(SEEDED_CONTENTS_PATH, 'utf8'));
        
        // Normalizar los parámetros para la búsqueda
        const targetNivel = (nivel || '').toLowerCase().trim();
        const targetGrado = parseInt(grado, 10);
        const targetArea = (area || '').toLowerCase().trim();
        const targetTrimestre = parseInt(trimestre, 10);
        
        // Filtrar
        return contents.filter(item => {
            const itemNivel = (item.nivel || '').toLowerCase().trim();
            const itemArea = (item.area || '').toLowerCase().trim();
            const itemGrado = parseInt(item.grado, 10);
            const itemTrimestre = parseInt(item.trimestre, 10);
            
            return itemNivel === targetNivel && 
                   itemGrado === targetGrado && 
                   itemArea === targetArea && 
                   itemTrimestre === targetTrimestre;
        });
    } catch (e) {
        console.error('Error al leer seeded_contents.json:', e);
        return [];
    }
}

let ragIndex = null;

function tokenize(text) {
    const stopwords = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'y', 'o', 'como', 'en', 'para', 
        'por', 'con', 'sin', 'sobre', 'este', 'esta', 'estos', 'estas', 'que', 'se', 'su', 'sus', 'es', 'son', 
        'lo', 'como', 'mas', 'pero', 'a', 'ante', 'bajo', 'cabe', 'contra', 'desde', 'durante', 'entre', 
        'hacia', 'hasta', 'mediante', 'segun', 'so', 'tras', 'versus', 'via', 'y', 'e', 'o', 'u'
    ]);
    return text.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quitar acentos
        .replace(/[^a-z0-9ñ]/g, " ")     // mantener solo letras y números
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopwords.has(word));
}

function initializeRAG() {
    console.log("Inicializando RAG in-memory...");
    const filesToIndex = [
        'lineamientos-curriculares-sep-2023.md',
        'reglamento-evaluacion-educacion-regular.md',
        'resolucion ministerial-0001-educacion-regular 2026.md'
    ];

    const chunks = [];
    const chunkSize = 1200; // caracteres
    const chunkOverlap = 300;

    filesToIndex.forEach(filename => {
        const filePath = path.join(OFFICIAL_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`Archivo para RAG no encontrado: ${filename}`);
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        let index = 0;
        while (index < content.length) {
            const chunkText = content.substring(index, index + chunkSize);
            chunks.push({
                source: filename,
                text: chunkText,
                tokens: tokenize(chunkText)
            });
            index += (chunkSize - chunkOverlap);
        }
    });

    if (chunks.length === 0) {
        console.warn("No se encontraron fragmentos para el RAG.");
        ragIndex = { chunks: [], idf: {} };
        return;
    }

    // Calcular IDF
    const totalDocs = chunks.length;
    const docFreqs = {};

    chunks.forEach(chunk => {
        const uniqueTokens = new Set(chunk.tokens);
        uniqueTokens.forEach(token => {
            docFreqs[token] = (docFreqs[token] || 0) + 1;
        });
    });

    const idf = {};
    for (const token in docFreqs) {
        idf[token] = Math.log(totalDocs / docFreqs[token]);
    }

    // Calcular vectores TF-IDF para cada chunk
    chunks.forEach(chunk => {
        const termFreqs = {};
        chunk.tokens.forEach(token => {
            termFreqs[token] = (termFreqs[token] || 0) + 1;
        });

        chunk.tfidf = {};
        for (const token in termFreqs) {
            chunk.tfidf[token] = (termFreqs[token] / chunk.tokens.length) * (idf[token] || 0);
        }
    });

    ragIndex = { chunks, idf };
    console.log(`RAG inicializado con ${chunks.length} fragmentos.`);
}

function searchGuidelines(query, topK = 4) {
    if (!ragIndex) {
        initializeRAG();
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0 || ragIndex.chunks.length === 0) {
        return [];
    }

    const scores = ragIndex.chunks.map(chunk => {
        let score = 0;
        queryTokens.forEach(token => {
            if (chunk.tfidf[token]) {
                score += chunk.tfidf[token];
            }
        });
        return { chunk, score };
    });

    // Ordenar y tomar los topK
    const results = scores
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(s => ({
            source: s.chunk.source,
            text: s.chunk.text,
            score: s.score
        }));

    return results;
}

function getContextForAI(nivel, grado, materia, trimestre) {
    let context = "";
    
    // 1. Plantilla Oficial
    let plantillaName = "";
    const nivelLower = (nivel || '').toLowerCase();
    if (nivelLower.includes('inicial') || nivelLower === 'eifc') {
        plantillaName = "PLANTILLA_PDC_INICIAL 2026.md";
    } else if (nivelLower.includes('primaria') || nivelLower === 'epcv') {
        plantillaName = "Plantilla PDC_Primaria 2026.md";
    } else {
        plantillaName = "Plantilla PDC_SEC_2026.md";
    }
    
    const plantillaPath = path.join(OFFICIAL_DIR, plantillaName);
    if (fs.existsSync(plantillaPath)) {
        context += `### ESTRUCTURA DE LA PLANTILLA OFICIAL DE PDC A SEGUIR:\n${fs.readFileSync(plantillaPath, 'utf8')}\n\n`;
    }
    
    // 2. Contenidos presembrados (Curriculum Oficial)
    const seeded = getSeededContent(nivel, grado, materia, trimestre);
    if (seeded && seeded.length > 0) {
        context += `### CONTENIDOS Y PERFILES DE SALIDA OFICIALES SUGERIDOS PARA ESTE TRIMESTRE:\n`;
        seeded.forEach(item => {
            context += `- Perfil de Salida: ${item.perfil_salida}\n`;
            context += `- Contenidos:\n`;
            (item.contenidos || []).forEach(c => {
                context += `  * ${c}\n`;
            });
        });
        context += `\n`;
    } else {
        // Fallback al parseador básico anterior si no se encuentra presembrado
        let planesName = "";
        if (nivelLower.includes('inicial') || nivelLower === 'eifc') {
            planesName = "planes-programas-inicial-2023.md";
        } else if (nivelLower.includes('primaria') || nivelLower === 'epcv') {
            planesName = "planes-programas-primaria-2023.md";
        } else {
            planesName = "planes-programas-secundaria-2023.md";
        }
        
        const planesPath = path.join(OFFICIAL_DIR, planesName);
        if (fs.existsSync(planesPath)) {
            try {
                const fullPlanes = fs.readFileSync(planesPath, 'utf8');
                context += `### PLANES Y PROGRAMAS CURRICULARES OFICIALES (EXTRACTO):\n${fullPlanes.substring(0, 50000)}\n\n`;
            } catch (e) {}
        }
    }

    // 3. RAG - Lineamientos Curriculares y de Evaluación
    const query = `${nivel} ${grado} ${materia} evaluacion PDC`;
    const searchResults = searchGuidelines(query, 4);
    if (searchResults && searchResults.length > 0) {
        context += `### NORMAS Y LINEAMIENTOS PEDAGÓGICOS OFICIALES APLICABLES (RAG):\n`;
        searchResults.forEach((res, i) => {
            context += `--- Fragmento ${i + 1} (Fuente: ${res.source}) ---\n${res.text}\n\n`;
        });
    }

    // 4. Archivos del usuario (PSP)
    if (fs.existsSync(USER_DIR)) {
        try {
            const userFiles = fs.readdirSync(USER_DIR);
            userFiles.forEach(uf => {
                const filePath = path.join(USER_DIR, uf);
                const content = fs.readFileSync(filePath, 'utf8');
                context += `### DOCUMENTO PERSONALIZADO DE LA UNIDAD EDUCATIVA (${uf}):\n${content}\n\n`;
            });
        } catch (e) {}
    }

    return context;
}

module.exports = {
    initialize,
    registerUser,
    authenticateUser,
    getUserById,
    getHistory,
    saveHistoryItem,
    deleteHistoryItem,
    consumeUserCredit,
    addUserCredits,
    listAllUsers,
    listAllTransactions,
    getSystemStats,
    listOfficialDocuments,
    listUserDocuments,
    deleteUserDocument,
    saveUserDocument,
    getContextForAI,
    getCatalog,
    getSeededContent,
    initializeRAG,
    searchGuidelines
};
