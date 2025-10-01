const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();

// Configuración de CORS para producción
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'https://chequeos.grupozafra.com.ar',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Configuración de la conexión a MySQL usando variables de entorno
const CM = mysql.createConnection({
    host: process.env.DB_HOST || '192.168.0.222',   
    user: process.env.DB_USER || 'root1',
    password: process.env.DB_PASSWORD || 'Lava3005$%&',
    database: process.env.DB_NAME || 'chequeos_maquinas',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 0
});

CM.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL.');
});

// Ruta para obtener los tipos de Máquinas
app.get('/api/tipos-maquinas', (req, res) => {
    CM.query('SELECT idTipoMaquina, tipoMaquina FROM tipos_maquinas', (err, results) => {
        if (err) {
            console.error('Error fetching tipos de máquinas:', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Ruta para obtener los modelos de máquinas por tipo
app.get('/api/modelos-maquinas/:idTipoMaquina', (req, res) => {
    const { idTipoMaquina } = req.params;
    CM.query('SELECT idModelo, modelo FROM modelos_maquinas WHERE idTipoMaquina = ?', [idTipoMaquina], (err, results) => {
        if (err) {
            console.error('Error fetching modelos de máquinas:', err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Ruta para obtener Chequeos de Modelos de Máquinas
app.get('/api/chequeos-maquina/:idModeloMaquina', (req, res) => {
    const { idModeloMaquina } = req.params;
    console.log('ID del modelo recibido:', idModeloMaquina);
    CM.query(`
        SELECT tipos_chequeos.idTipoChequeo, tipos_chequeos.tipo 
        FROM modelosmaquinas_chequeos
        INNER JOIN tipos_chequeos ON modelosmaquinas_chequeos.idTipo_Chequeo = tipos_chequeos.idTipoChequeo 
        WHERE modelosmaquinas_chequeos.idModeloMaquina = ?`, [idModeloMaquina], (err, results) => {
        if (err) {
            console.error('Error fetching chequeos de máquinas:', err);
            return res.status(500).send(err);
        }
        // Intentar sumar Chequeo General Maquina, id=2 (Neumáticos), id=3 (Inyectores, Turbo y Aftercooler) e id=7 (Informe General Tractor) si existen en tipos_chequeos
        // El id=7 solo se incluye si el modelo pertenece a un tractor (idTipoMaquina=4)
        CM.query('SELECT idTipoMaquina FROM modelos_maquinas WHERE idModelo = ?', [idModeloMaquina], (err3, tipoResult) => {
          if (err3) {
            console.error('Error obteniendo tipo de máquina:', err3);
            return res.status(500).send(err3);
          }
          
          const esTractor = tipoResult && tipoResult.length > 0 && tipoResult[0].idTipoMaquina === 4;
          const tiposExtra = esTractor ? 'OR idTipoChequeo = 7' : '';
          
          CM.query(`SELECT idTipoChequeo, tipo FROM tipos_chequeos WHERE tipo = ? OR idTipoChequeo = 2 OR idTipoChequeo = 3 ${tiposExtra}`, ['Chequeo General Maquina'], (err2, extraRows) => {
            if (err2) {
                console.error('Error fetching chequeo general:', err2);
                return res.status(500).send(err2);
            }
            let merged = Array.isArray(results) ? [...results] : [];
            if (Array.isArray(extraRows) && extraRows.length > 0) {
                for (const row of extraRows) {
                    const already = merged.some(r => r.idTipoChequeo === row.idTipoChequeo);
                    if (!already) merged.push(row);
                }
            }
            console.log('Resultados de la consulta (incluyendo General si aplica):', merged);
            res.json(merged);
        });
    });
    });
});

// Ruta para obtener Chequeos por Tipo de Máquina (sin modelo específico)
app.get('/api/chequeos-tipo-maquina/:idTipoMaquina', (req, res) => {
    const { idTipoMaquina } = req.params;
    console.log('ID del tipo de máquina recibido:', idTipoMaquina);
    
    // Si es tractor (idTipoMaquina=4), incluir el Informe General Tractor
    if (Number(idTipoMaquina) === 4) {
        CM.query('SELECT idTipoChequeo, tipo FROM tipos_chequeos WHERE idTipoChequeo = 7', (err, results) => {
            if (err) {
                console.error('Error fetching informe general tractor:', err);
                return res.status(500).send(err);
            }
            console.log('Resultados para tractor:', results);
            res.json(results);
        });
    } else {
        // Para otros tipos de máquinas, devolver array vacío
        res.json([]);
    }
});

// Ruta para obtener el chequeo general para un modelo específico
app.get('/api/chequeo-general/:idModeloMaquina', (req, res) => {
    // Ignoramos idModeloMaquina porque el general aplica a todos; devolvemos el registro real
    CM.query('SELECT idTipoChequeo, tipo FROM tipos_chequeos WHERE tipo = ? LIMIT 1', ['Chequeo General Maquina'], (err, results) => {
        if (err) {
            console.error('Error obteniendo Chequeo General Maquina:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        if (!results || results.length === 0) {
            return res.json([]);
        }
        return res.json(results);
    });
});

// Obtener el idTipoChequeo para "Chequeo General Maquina"
app.get('/api/tipo-chequeo-general', (req, res) => {
    CM.query('SELECT idTipoChequeo, tipo FROM tipos_chequeos WHERE tipo = ? LIMIT 1', ['Chequeo General Maquina'], (err, results) => {
        if (err) {
            console.error('Error obteniendo tipo chequeo general:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ message: 'Tipo Chequeo General no encontrado' });
        }
        return res.json(results[0]);
    });
});

// Endpoint temporal para verificar todos los tipos de chequeos disponibles
app.get('/api/tipos-chequeos', (req, res) => {
    CM.query('SELECT idTipoChequeo, tipo FROM tipos_chequeos ORDER BY idTipoChequeo', (err, results) => {
        if (err) {
            console.error('Error obteniendo tipos de chequeos:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        console.log('Tipos de chequeos disponibles:', results);
        return res.json(results);
    });
});

// Crear una sesión de chequeo y devolver idSesion
app.post('/api/sesiones', (req, res) => {
    console.log('POST /api/sesiones body:', req.body);
    const {
        legajo,
        idTipoChequeo,
        cliente,
        hora_maquina,
        serie_maquina,
        fecha,
        temp_durante_la_prueba,
        modelo_maquina,
        cor_involucrada,
        num_servicio,
        fechaInicio,
        fechaFin
    } = req.body;

    if (legajo === undefined || legajo === null || idTipoChequeo === undefined || idTipoChequeo === null) {
        return res.status(400).json({ message: 'legajo e idTipoChequeo son requeridos' });
    }

    const proceedInsert = () => {
        const sql = `INSERT INTO sesiones
            (legajo, idTipoChequeo, cliente, hora_maquina, serie_maquina, fecha, temp_durante_la_prueba, modelo_maquina, cor_involucrada, num_servicio, fechaInicio, fechaFin)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
        const values = [
            legajo,
            idTipoChequeo,
            cliente || null,
            hora_maquina || null,
            serie_maquina || null,
            fecha || null,
            temp_durante_la_prueba || null,
            modelo_maquina || null,
            cor_involucrada || null,
            num_servicio || null,
            fechaInicio || null,
            fechaFin || null
        ];

        CM.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error creando sesión:', err);
                return res.status(500).json({ message: 'Error al crear sesión' });
            }
            const idSesion = result && result.insertId ? result.insertId : null;
            if (!idSesion) {
                return res.status(500).json({ message: 'No se obtuvo id de sesión' });
            }
            return res.json({ idSesion });
        });
    };

    // Validar existencia de modelo_maquina si viene informado
    if (modelo_maquina !== undefined && modelo_maquina !== null) {
        CM.query('SELECT 1 FROM modelos_maquinas WHERE idModelo = ? LIMIT 1', [modelo_maquina], (chkErr, chkRows) => {
            if (chkErr) {
                console.error('Error validando modelo_maquina:', chkErr);
                return res.status(500).json({ message: 'Error del servidor' });
            }
            if (!chkRows || chkRows.length === 0) {
                return res.status(400).json({ message: 'Modelo de máquina inválido' });
            }
            proceedInsert();
        });
    } else {
        proceedInsert();
    }
});

// Guardar respuestas en lote para una sesión
app.post('/api/respuestas', (req, res) => {
    const { respuestas } = req.body; // [{idPregunta,idSesion,respuesta,fechaRespuesta}]
    if (!Array.isArray(respuestas) || respuestas.length === 0) {
        return res.status(400).json({ message: 'No hay respuestas para guardar' });
    }

    // Construcción segura de placeholders para inserción múltiple
    const placeholders = respuestas.map(() => '(?,?,?,?)').join(',');
    const flatValues = [];
    for (const r of respuestas) {
        const { idPregunta, idSesion, respuesta, fechaRespuesta } = r;
        if (!idPregunta || !idSesion) {
            return res.status(400).json({ message: 'idPregunta e idSesion son requeridos en cada respuesta' });
        }
        flatValues.push(idPregunta, idSesion, respuesta ?? null, fechaRespuesta ?? null);
    }

    const sql = `INSERT INTO respuestas (idPregunta, idSesion, respuesta, fechaRespuesta) VALUES ${placeholders}`;
    CM.query(sql, flatValues, (err, result) => {
        if (err) {
            console.error('Error guardando respuestas:', err);
            return res.status(500).json({ message: 'Error al guardar respuestas' });
        }
        return res.json({ affectedRows: result.affectedRows || 0 });
    });
});

// Ruta para login de usuarios
app.post('/api/login', (req, res) => {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }

    CM.query(
        `SELECT legajo, apellido, nombre FROM usuarios
         WHERE usuario = ? AND contrasena = ?`,
        [usuario, contrasena],
        (err, results) => {
            if (err) {
                console.error('Error ejecutando login:', err);
                return res.status(500).json({ message: 'Error del servidor' });
            }

            if (!results || results.length === 0) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            const user = results[0];
            return res.json(user);
        }
    );
});

// Obtener datos de una sesión específica
app.get('/api/sesiones/:idSesion', (req, res) => {
    const { idSesion } = req.params;
    const sql = `
        SELECT s.*, tc.tipo AS tipoChequeo, mm.modelo, tm.tipoMaquina
        FROM sesiones s
        LEFT JOIN tipos_chequeos tc ON tc.idTipoChequeo = s.idTipoChequeo
        LEFT JOIN modelos_maquinas mm ON mm.idModelo = s.modelo_maquina
        LEFT JOIN tipos_maquinas tm ON tm.idTipoMaquina = mm.idTipoMaquina
        WHERE s.idSesion = ?
        LIMIT 1`;
    CM.query(sql, [Number(idSesion)], (err, rows) => {
        if (err) {
            console.error('Error obteniendo sesión:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Sesión no encontrada' });
        }
        return res.json(rows[0]);
    });
});

// Obtener respuestas de una sesión
app.get('/api/sesiones/:idSesion/respuestas', (req, res) => {
    const { idSesion } = req.params;
    const sql = `
        SELECT 
            s.cliente,
            s.hora_maquina,
            s.serie_maquina,
            s.fecha,
            s.temp_durante_la_prueba,
            s.modelo_maquina,
            s.cor_involucrada,
            s.num_servicio,
            r.idPregunta,
            p.pregunta,
            r.respuesta,
            r.fechaRespuesta
        FROM respuestas r
        INNER JOIN preguntas p ON p.idPregunta = r.idPregunta
        INNER JOIN sesiones s ON s.idSesion = r.idSesion
        WHERE s.idSesion = ?
        ORDER BY r.idPregunta`;
    CM.query(sql, [Number(idSesion)], (err, rows) => {
        if (err) {
            console.error('Error obteniendo respuestas:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        return res.json(rows || []);
    });
});
// Historial de chequeos con filtros (todos opcionales)
app.get('/api/historial-chequeos', (req, res) => {
    const { idTipoMaquina, idModelo, serie, idTipoChequeo, cliente, desde, hasta } = req.query;

    const where = [];
    const params = [];

    if (idTipoChequeo) { where.push('s.idTipoChequeo = ?'); params.push(Number(idTipoChequeo)); }
    if (cliente) { where.push('s.cliente LIKE ?'); params.push(`%${cliente}%`); }
    if (serie) { where.push('s.serie_maquina LIKE ?'); params.push(`%${serie}%`); }
    if (desde) { where.push('(s.fecha >= ? OR s.fechaInicio >= ?)'); params.push(desde, desde); }
    if (hasta) { where.push('(s.fecha <= ? OR s.fechaFin <= ?)'); params.push(hasta, hasta); }
    if (idModelo) { where.push('s.modelo_maquina = ?'); params.push(Number(idModelo)); }
    if (idTipoMaquina) {
        // Si es Tractor (4) incluir también sesiones del Informe General Tractor (idTipoChequeo = 7)
        const t = Number(idTipoMaquina);
        if (t === 4) {
            where.push('(mm.idTipoMaquina = ? OR s.idTipoChequeo = 7)');
            params.push(t);
        } else {
            where.push('mm.idTipoMaquina = ?');
            params.push(t);
        }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
        SELECT s.idSesion, s.fecha, s.fechaInicio, s.fechaFin, s.cliente, s.legajo, s.serie_maquina,
               tc.tipo AS tipoChequeo, tm.tipoMaquina, mm.modelo
        FROM sesiones s
        LEFT JOIN tipos_chequeos tc ON tc.idTipoChequeo = s.idTipoChequeo
        LEFT JOIN modelos_maquinas mm ON mm.idModelo = s.modelo_maquina
        LEFT JOIN tipos_maquinas tm ON tm.idTipoMaquina = mm.idTipoMaquina
        ${whereSql}
        ORDER BY COALESCE(s.fecha, s.fechaInicio) DESC, s.idSesion DESC
        LIMIT 500`;

    CM.query(sql, params, (err, rows) => {
        if (err) {
            console.error('Error obteniendo historial:', err);
            return res.status(500).json({ message: 'Error del servidor' });
        }
        return res.json(rows || []);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
