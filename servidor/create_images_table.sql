-- Crear tabla para almacenar información de imágenes subidas
CREATE TABLE IF NOT EXISTS imagenes_chequeos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    tamanio INT NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_id_sesion (id_sesion),
    INDEX idx_fecha_subida (fecha_subida)
);

-- Tabla para documentos PDF asociados a sesiones
CREATE TABLE IF NOT EXISTS documentos_chequeos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_sesion VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    tamanio INT NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_id_sesion_docs (id_sesion),
    INDEX idx_fecha_docs (fecha_subida)
);
