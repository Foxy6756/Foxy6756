/**
 * SERVIDOR HTTP NATIVO NODE.JS (BACKEND)
 * Flujo Cliente-Servidor y API REST JSON.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

function leerDatos() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error('Error al leer data.json:', error.message);
        return [];
    }
}

function guardarDatos(datos) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(datos, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error al escribir en data.json:', error.message);
        return false;
    }
}

const server = http.createServer((req, res) => {
    // Cabeceras CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    console.log(`[PETICIÓN RECIBIDA] ${req.method} ${pathname}`);

    // Endpoint REST JSON: GET /api/incidentes
    if (pathname === '/api/incidentes' && req.method === 'GET') {
        const incidentes = leerDatos();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
        res.end(JSON.stringify(incidentes));
        return;
    }

    // Endpoint REST JSON: POST /api/incidentes
    if (pathname === '/api/incidentes' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const nuevoIncidente = JSON.parse(body);
                const incidentes = leerDatos();
                incidentes.unshift(nuevoIncidente);
                guardarDatos(incidentes);

                res.writeHead(201, { 'Content-Type': 'application/json; charset=UTF-8' });
                res.end(JSON.stringify({
                    mensaje: 'Incidente registrado exitosamente en el servidor',
                    incidente: nuevoIncidente
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
                res.end(JSON.stringify({ error: 'Payload JSON inválido' }));
            }
        });
        return;
    }

    // Servidor de archivos estáticos (Frontend)
    let filePath = pathname === '/' ? '/index.html' : pathname;
    const safePath = path.join(__dirname, path.normalize(filePath));

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end(JSON.stringify({ error: 'Recurso no encontrado (404)' }));
            return;
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(safePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Servidor HTTP Node.js ejecutándose`);
    console.log(` Dirección: http://localhost:${PORT}`);
    console.log(` Endpoint JSON: http://localhost:${PORT}/api/incidentes`);
    console.log(`==================================================`);
});
