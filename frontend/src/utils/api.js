const BASE_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // Obtener el ID de usuario activo guardado en localStorage
    const activeUserId = localStorage.getItem('avelino_user_id');
    
    // Configurar headers por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Agregar cabecera de autenticación x-user-id si existe
    if (activeUserId) {
        headers['x-user-id'] = activeUserId;
    }
    
    // Si pasamos FormData (para subida de archivos), eliminamos Content-Type
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Algo salió mal en el servidor.');
        }
        
        return data;
    } catch (error) {
        console.error(`Error en la petición API [${endpoint}]:`, error);
        throw error;
    }
}

const api = {
    // Autenticación
    login: (email, password) => request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    
    register: (email, password, name, nivel) => request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, nivel })
    }),
    
    getProfile: () => request('/api/users/profile'),

    consumeCredit: (amount = 1, description = 'Descarga de documento') => request('/api/users/consume-credit', {
        method: 'POST',
        body: JSON.stringify({ amount, description })
    }),

    // Historial
    getHistory: () => request('/api/history'),
    
    saveHistoryItem: (item) => request('/api/history', {
        method: 'POST',
        body: JSON.stringify(item)
    }),
    
    deleteHistoryItem: (id) => request(`/api/history/${id}`, {
        method: 'DELETE'
    }),

    // Documentos (Base de Conocimiento)
    getDocuments: () => request('/api/documents'),
    
    uploadDocument: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return request('/api/documents/upload', {
            method: 'POST',
            body: formData
        });
    },
    
    deleteDocument: (name) => request(`/api/documents/${name}`, {
        method: 'DELETE'
    }),

    // Generación IA
    generatePDC: (params, apiKey) => request('/api/generate/pdc', {
        method: 'POST',
        body: JSON.stringify({ params, apiKey })
    }),
    
    generateEvaluation: (params, apiKey) => request('/api/generate/evaluation', {
        method: 'POST',
        body: JSON.stringify({ params, apiKey })
    }),
    
    generateSelfEvaluation: (params, apiKey) => request('/api/generate/self-evaluation', {
        method: 'POST',
        body: JSON.stringify({ params, apiKey })
    }),

    // Administrador
    getAdminStats: () => request('/api/admin/stats'),
    
    getAdminUsers: () => request('/api/admin/users'),
    
    addAdminCredits: (targetUserId, amount, description) => request('/api/admin/add-credits', {
        method: 'POST',
        body: JSON.stringify({ targetUserId, amount, description })
    }),
    
    getAdminTransactions: () => request('/api/admin/transactions'),

    // Catálogo educativo oficial y RAG
    getCatalog: () => request('/api/catalog'),
    getSeededContent: (nivel, grado, area, trimestre) => request(`/api/catalog/seeded-content?nivel=${encodeURIComponent(nivel)}&grado=${encodeURIComponent(grado)}&area=${encodeURIComponent(area)}&trimestre=${encodeURIComponent(trimestre)}`)
};

export default api;
