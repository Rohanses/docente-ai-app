const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const supabase = require('./supabaseClient');

// Directorios de datos (solo para recursos oficiales estáticos y logs)
const DATA_DIR = path.join(__dirname, '../data');
const OFFICIAL_DIR = path.join(__dirname, '../data/official_curriculum');
const CATALOGO_PATH = path.join(__dirname, '../data/db/catalogo.json');
const SEEDED_CONTENTS_PATH = path.join(__dirname, '../data/db/seeded_contents.json');

// Utilidad criptográfica (SHA-256)
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Inicializar base de datos (carpetas estáticas y RAG)
function initialize() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(OFFICIAL_DIR)) fs.mkdirSync(OFFICIAL_DIR, { recursive: true });

    try {
        initializeRAG();
    } catch (e) {
        console.error('Error inicializando RAG en initialize():', e);
    }
}

// === AUTENTICACIÓN Y USUARIOS ===

async function registerUser(email, password, name, nivel = 'General') {
    const emailLower = email.toLowerCase().trim();
    
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
        .from('avelino_users')
        .select('id')
        .eq('email', emailLower)
        .maybeSingle();

    if (checkError) throw checkError;
    if (existingUser) {
        throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    const newUser = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        email: emailLower,
        password: hashPassword(password),
        name: name.trim(),
        nivel: nivel,
        role: 'docente',
        credits: 5,
        created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
        .from('avelino_users')
        .insert([newUser]);

    if (insertError) throw insertError;

    // Registrar transacción de bienvenida
    await logTransaction(newUser.id, 'add', 5, 'Bono de bienvenida por registro');

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

async function authenticateUser(email, password) {
    const emailLower = email.toLowerCase().trim();
    const hash = hashPassword(password);

    const { data: user, error } = await supabase
        .from('avelino_users')
        .select('*')
        .eq('email', emailLower)
        .eq('password', hash)
        .maybeSingle();

    if (error) throw error;
    if (!user) {
        throw new Error('Credenciales incorrectas o usuario no encontrado.');
    }

    const { password: _, created_at, ...userWithoutPassword } = user;
    return {
        ...userWithoutPassword,
        createdAt: created_at
    };
}

async function getUserById(userId) {
    if (!userId) return null;
    const { data: user, error } = await supabase
        .from('avelino_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error || !user) return null;
    
    const { password: _, created_at, ...userWithoutPassword } = user;
    return {
        ...userWithoutPassword,
        createdAt: created_at
    };
}

// === HISTORIAL CRUD FILTRADO POR USUARIO ===

async function getHistory(userId) {
    try {
        const user = await getUserById(userId);
        if (!user) return [];

        let query = supabase.from('avelino_history').select('*');
        
        // El administrador ve todo, el docente solo lo suyo
        if (user.role !== 'admin') {
            query = query.eq('user_id', userId);
        }

        const { data: history, error } = await query.order('date', { ascending: false });
        if (error) throw error;

        return (history || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            date: item.date,
            type: item.type,
            title: item.title,
            metadata: item.metadata,
            content: item.content
        }));
    } catch (e) {
        console.error('Error leyendo historial desde Supabase:', e);
        return [];
    }
}

async function saveHistoryItem(userId, item) {
    try {
        const newItem = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            user_id: userId,
            date: new Date().toISOString(),
            type: item.type,
            title: item.title,
            metadata: item.metadata || {},
            content: item.content
        };

        const { error } = await supabase
            .from('avelino_history')
            .insert([newItem]);

        if (error) throw error;

        return {
            id: newItem.id,
            userId: newItem.user_id,
            date: newItem.date,
            type: newItem.type,
            title: newItem.title,
            metadata: newItem.metadata,
            content: newItem.content
        };
    } catch (e) {
        console.error('Error guardando historial en Supabase:', e);
        throw e;
    }
}

async function deleteHistoryItem(id) {
    try {
        const { error } = await supabase
            .from('avelino_history')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Error eliminando historial en Supabase:', e);
        throw e;
    }
}

// === GESTIÓN DE CRÉDITOS Y TRANSACCIONES ===

async function getTransactions() {
    try {
        const { data, error } = await supabase
            .from('avelino_transactions')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return (data || []).map(t => ({
            id: t.id,
            userId: t.user_id,
            userEmail: t.user_email,
            type: t.type,
            amount: t.amount,
            description: t.description,
            date: t.date
        }));
    } catch (e) {
        console.error('Error al obtener transacciones:', e);
        return [];
    }
}

async function logTransaction(userId, type, amount, description) {
    try {
        const user = await getUserById(userId);
        
        const newTransaction = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            user_id: userId,
            user_email: user ? user.email : 'desconocido',
            type: type,
            amount: amount,
            description: description,
            date: new Date().toISOString()
        };

        const { error } = await supabase
            .from('avelino_transactions')
            .insert([newTransaction]);

        if (error) throw error;
        return newTransaction;
    } catch (e) {
        console.error('Error guardando transacción en Supabase:', e);
    }
}

async function consumeUserCredit(userId, amount = 1, description = 'Descarga de documento') {
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('Usuario no encontrado.');
    }
    
    // Si es administrador, no tiene límite de créditos
    if (user.role === 'admin') {
        await logTransaction(userId, 'consume', amount, `${description} (Exento por Admin)`);
        return user.credits;
    }
    
    if (user.credits < amount) {
        throw new Error('Créditos insuficientes. Por favor, solicita más créditos a tu administrador.');
    }

    const newCredits = user.credits - amount;

    const { error } = await supabase
        .from('avelino_users')
        .update({ credits: newCredits })
        .eq('id', userId);

    if (error) throw error;

    await logTransaction(userId, 'consume', amount, description);
    return newCredits;
}

async function addUserCredits(userId, amount, description = 'Carga de créditos por administrador') {
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('Usuario no encontrado.');
    }
    
    const newCredits = user.credits + amount;

    const { error } = await supabase
        .from('avelino_users')
        .update({ credits: newCredits })
        .eq('id', userId);

    if (error) throw error;

    await logTransaction(userId, 'add', amount, description);
    return newCredits;
}

// === HELPERS DE ADMINISTRADOR ===

async function listAllUsers() {
    const { data, error } = await supabase
        .from('avelino_users')
        .select('id, email, name, nivel, role, credits, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        nivel: u.nivel,
        role: u.role,
        credits: u.credits,
        createdAt: u.created_at
    }));
}

async function listAllTransactions() {
    return await getTransactions();
}

async function getSystemStats() {
    try {
        // Obtener cantidad de docentes
        const { count: totalTeachers, error: errTeachers } = await supabase
            .from('avelino_users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'docente');

        if (errTeachers) throw errTeachers;

        // Obtener cantidad de generaciones
        const { count: totalGenerations, error: errHistory } = await supabase
            .from('avelino_history')
            .select('*', { count: 'exact', head: true });

        if (errHistory) throw errHistory;

        // Obtener suma de descargas
        const { data: consumeTx, error: errTx } = await supabase
            .from('avelino_transactions')
            .select('amount')
            .eq('type', 'consume');

        if (errTx) throw errTx;
        const totalDownloads = (consumeTx || []).reduce((acc, curr) => acc + curr.amount, 0);

        // Obtener créditos activos
        const { data: usersCredits, error: errCredits } = await supabase
            .from('avelino_users')
            .select('credits')
            .eq('role', 'docente');

        if (errCredits) throw errCredits;
        const activeCredits = (usersCredits || []).reduce((acc, curr) => acc + curr.credits, 0);

        return {
            totalTeachers: totalTeachers || 0,
            totalGenerations: totalGenerations || 0,
            totalDownloads: totalDownloads,
            activeCredits: activeCredits
        };
    } catch (e) {
        console.error('Error al compilar estadísticas desde Supabase:', e);
        return {
            totalTeachers: 0,
            totalGenerations: 0,
            totalDownloads: 0,
            activeCredits: 0
        };
    }
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

async function listUserDocuments(userId) {
    try {
        if (!userId) return [];
        const { data, error } = await supabase
            .from('avelino_user_documents')
            .select('name')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(f => ({ name: f.name, type: 'user' }));
    } catch (e) {
        console.error('Error al listar documentos en Supabase:', e);
        return [];
    }
}

async function deleteUserDocument(userId, name) {
    try {
        if (!userId) return false;
        const { error } = await supabase
            .from('avelino_user_documents')
            .delete()
            .eq('user_id', userId)
            .eq('name', name);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Error al eliminar archivo de Supabase:', e);
        throw e;
    }
}

async function saveUserDocument(userId, name, content) {
    try {
        if (!userId) throw new Error('Se requiere x-user-id para guardar documentos.');
        const safeName = path.basename(name).replace(/\.[^/.]+$/, "") + ".md";
        const documentId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

        // Si ya existe un documento con ese nombre para este usuario, lo actualizamos
        const { data: existingDoc } = await supabase
            .from('avelino_user_documents')
            .select('id')
            .eq('user_id', userId)
            .eq('name', safeName)
            .maybeSingle();

        if (existingDoc) {
            const { error } = await supabase
                .from('avelino_user_documents')
                .update({ content })
                .eq('id', existingDoc.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('avelino_user_documents')
                .insert([{
                    id: documentId,
                    user_id: userId,
                    name: safeName,
                    content: content
                }]);
            if (error) throw error;
        }

        return { name: safeName, type: 'user' };
    } catch (e) {
        console.error('Error guardando archivo de usuario en Supabase:', e);
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
        
        const targetNivel = (nivel || '').toLowerCase().trim();
        const targetGrado = parseInt(grado, 10);
        const targetArea = (area || '').toLowerCase().trim();
        const targetTrimestre = parseInt(trimestre, 10);
        
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
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9ñ]/g, " ")     
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
    const chunkSize = 1200; 
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

async function getContextForAI(nivel, grado, materia, trimestre, userId) {
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

    // 4. Archivos del usuario desde Supabase (específico de su cuenta)
    if (userId) {
        try {
            const { data: userDocs, error } = await supabase
                .from('avelino_user_documents')
                .select('name, content')
                .eq('user_id', userId);
            
            if (!error && userDocs && userDocs.length > 0) {
                userDocs.forEach(doc => {
                    context += `### DOCUMENTO PERSONALIZADO DE LA UNIDAD EDUCATIVA (${doc.name}):\n${doc.content}\n\n`;
                });
            }
        } catch (e) {
            console.error('Error al cargar documentos del RAG desde Supabase:', e);
        }
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
