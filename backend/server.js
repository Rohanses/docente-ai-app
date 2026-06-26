require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const storageService = require('./services/storageService');
const geminiService = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 5000;

// Inicializar almacenamiento y RAG
storageService.initialize();

// Middlewares
app.use(cors());
app.use(express.json());

// Configurar multer con almacenamiento en memoria para entornos serverless (Vercel)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.md' || ext === '.txt') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de texto plano (.txt) o Markdown (.md).'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Middleware de validación de Administrador (asíncrono)
async function requireAdmin(req, res, next) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado. Falta cabecera x-user-id.' });
    }
    
    try {
        const user = await storageService.getUserById(userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
        }
        next();
    } catch (e) {
        res.status(500).json({ error: 'Error interno en la validación de administrador: ' + e.message });
    }
}

// === RUTAS DEL API ===

// --- Autenticación ---

app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, nivel } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (email, password, nombre).' });
    }
    try {
        const user = await storageService.registerUser(email, password, name, nivel);
        res.status(201).json(user);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (email, password).' });
    }
    try {
        const user = await storageService.authenticateUser(email, password);
        res.json(user);
    } catch (e) {
        res.status(401).json({ error: e.message });
    }
});

// --- Créditos del Usuario ---

app.post('/api/users/consume-credit', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const { amount, description } = req.body;
    
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado.' });
    }

    try {
        const newBalance = await storageService.consumeUserCredit(userId, amount || 1, description || 'Descarga de documento');
        res.json({ success: true, credits: newBalance });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get('/api/users/profile', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado.' });
    }
    
    try {
        const user = await storageService.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json(user);
    } catch (e) {
        res.status(500).json({ error: 'Error al recuperar perfil: ' + e.message });
    }
});

// --- Historial ---
app.get('/api/history', async (req, res) => {
    const userId = req.headers['x-user-id'] || req.query.userId;
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado. Se requiere x-user-id en cabeceras o query.' });
    }
    try {
        const history = await storageService.getHistory(userId);
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener el historial: ' + e.message });
    }
});

app.post('/api/history', async (req, res) => {
    const userId = req.headers['x-user-id'];
    const { type, title, metadata, content } = req.body;
    
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado.' });
    }
    if (!type || !title || !content) {
        return res.status(400).json({ error: 'Faltan campos obligatorios en el cuerpo del request.' });
    }
    
    try {
        const newItem = await storageService.saveHistoryItem(userId, { type, title, metadata, content });
        res.status(201).json(newItem);
    } catch (e) {
        res.status(500).json({ error: 'Error al guardar en el historial: ' + e.message });
    }
});

app.delete('/api/history/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await storageService.deleteHistoryItem(id);
        res.json({ success: true, message: 'Item eliminado del historial.' });
    } catch (e) {
        res.status(500).json({ error: 'Error al eliminar del historial: ' + e.message });
    }
});

// --- Documentos Base de Conocimiento ---
app.get('/api/documents', async (req, res) => {
    const userId = req.headers['x-user-id'];
    try {
        const official = storageService.listOfficialDocuments();
        const user = await storageService.listUserDocuments(userId);
        res.json({ official, user });
    } catch (e) {
        res.status(500).json({ error: 'Error al listar los documentos: ' + e.message });
    }
});

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado. Se requiere x-user-id en las cabeceras.' });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo.' });
        }
        
        // Convertir buffer en string utf-8
        const content = req.file.buffer.toString('utf8');
        const file = await storageService.saveUserDocument(userId, req.file.originalname, content);
        
        res.status(201).json({
            success: true,
            message: 'Archivo cargado con éxito y guardado en base de datos.',
            file
        });
    } catch (e) {
        res.status(500).json({ error: e.message || 'Error al cargar el archivo.' });
    }
});

app.delete('/api/documents/:name', async (req, res) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'No autorizado.' });
    }
    
    try {
        const { name } = req.params;
        const success = await storageService.deleteUserDocument(userId, name);
        if (success) {
            res.json({ success: true, message: 'Archivo eliminado con éxito.' });
        } else {
            res.status(404).json({ error: 'Archivo no encontrado en tu cuenta.' });
        }
    } catch (e) {
        res.status(500).json({ error: 'Error al eliminar el archivo: ' + e.message });
    }
});

// --- Catálogo y RAG ---

app.get('/api/catalog', (req, res) => {
    try {
        const catalog = storageService.getCatalog();
        res.json(catalog);
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener el catálogo educativo: ' + e.message });
    }
});

app.get('/api/catalog/seeded-content', (req, res) => {
    const { nivel, grado, area, trimestre } = req.query;
    if (!nivel || !grado || !area || !trimestre) {
        return res.status(400).json({ error: 'Faltan parámetros obligatorios en la query (nivel, grado, area, trimestre).' });
    }
    try {
        const content = storageService.getSeededContent(nivel, grado, area, trimestre);
        res.json(content);
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener el contenido presembrado: ' + e.message });
    }
});

app.get('/api/rag/search', (req, res) => {
    const { query, topK } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Falta el parámetro obligatorio query.' });
    }
    try {
        const results = storageService.searchGuidelines(query, parseInt(topK) || 4);
        res.json(results);
    } catch (e) {
        res.status(500).json({ error: 'Error en la búsqueda RAG: ' + e.message });
    }
});

// --- Rutas del Administrador ---

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
        const stats = await storageService.getSystemStats();
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: 'Error al recuperar estadísticas globales: ' + e.message });
    }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await storageService.listAllUsers();
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Error al listar usuarios: ' + e.message });
    }
});

app.post('/api/admin/add-credits', requireAdmin, async (req, res) => {
    const { targetUserId, amount, description } = req.body;
    if (!targetUserId || amount === undefined) {
        return res.status(400).json({ error: 'Faltan parámetros obligatorios (targetUserId, amount).' });
    }
    try {
        const newBalance = await storageService.addUserCredits(targetUserId, parseInt(amount), description || 'Carga manual de créditos');
        res.json({ success: true, userId: targetUserId, newCredits: newBalance });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get('/api/admin/transactions', requireAdmin, async (req, res) => {
    try {
        const list = await storageService.listAllTransactions();
        res.json(list);
    } catch (e) {
        res.status(500).json({ error: 'Error al listar transacciones: ' + e.message });
    }
});

// --- Generación con IA ---

app.post('/api/generate/pdc', async (req, res) => {
    const { apiKey, params } = req.body;
    if (!params || !params.nivel || !params.grado || !params.contenidos) {
        return res.status(400).json({ error: 'Faltan parámetros de entrada obligatorios (nivel, grado, contenidos).' });
    }

    try {
        // Enlazar ID de usuario para aislamiento de documentos RAG
        params.userId = req.headers['x-user-id'];
        const result = await geminiService.generatePDC(params, apiKey);
        res.json({ content: result });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al generar el PDC: ' + e.message });
    }
});

app.post('/api/generate/evaluation', async (req, res) => {
    const { apiKey, params } = req.body;
    if (!params || !params.nivel || !params.grado || !params.contenidos) {
        return res.status(400).json({ error: 'Faltan parámetros de entrada obligatorios (nivel, grado, contenidos).' });
    }

    try {
        params.userId = req.headers['x-user-id'];
        const result = await geminiService.generateEvaluation(params, apiKey);
        res.json({ content: result });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al generar la evaluación: ' + e.message });
    }
});

app.post('/api/generate/self-evaluation', async (req, res) => {
    const { apiKey, params } = req.body;
    if (!params || !params.nivel || !params.grado) {
        return res.status(400).json({ error: 'Faltan parámetros de entrada obligatorios (nivel, grado).' });
    }

    try {
        params.userId = req.headers['x-user-id'];
        const result = await geminiService.generateSelfEvaluation(params, apiKey);
        res.json({ content: result });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al generar la autoevaluación: ' + e.message });
    }
});

// Servir frontend en producción local (Vercel maneja esto nativamente, pero dejamos el soporte para cuando se corra localmente)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    });
}

// Iniciar servidor solo si es ejecutado directamente
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor de Apoyo Docente corriendo en http://localhost:${PORT}`);
    });
}

module.exports = app;
