CREATE TABLE Usuarios (
    Legajo INT PRIMARY KEY,
    Nombre VARCHAR(255),
    Apellido VARCHAR(255),
    -- Otros campos relevantes del usuario (email, contraseña, etc.)
);

CREATE TABLE Carreras (
    IdCarrera INT PRIMARY KEY,
    Nombre VARCHAR(255) UNIQUE
);

CREATE TABLE Materias (
    IdMateria INT PRIMARY KEY,
    Codigo VARCHAR(50) UNIQUE,
    Nombre VARCHAR(255)
);

-- Tabla intermedia para la relación muchos a muchos entre Carreras y Materias
CREATE TABLE CarrerasMaterias (
    IdCarrera INT,
    IdMateria INT,
    PRIMARY KEY (IdCarrera, IdMateria),
    FOREIGN KEY (IdCarrera) REFERENCES Carreras(IdCarrera),
    FOREIGN KEY (IdMateria) REFERENCES Materias(IdMateria)
);

-- Tabla para almacenar las correlativas (anteriores)
CREATE TABLE Correlativas (
    IdMateria INT,  -- Materia que tiene la correlativa
    IdCorrelativa INT, -- Materia correlativa
    PRIMARY KEY (IdMateria, IdCorrelativa),
    FOREIGN KEY (IdMateria) REFERENCES Materias(IdMateria),
    FOREIGN KEY (IdCorrelativa) REFERENCES Materias(IdMateria)
);


-- Tabla para registrar las materias aprobadas por cada usuario
CREATE TABLE MateriasAprobadas (
    Legajo INT,
    IdMateria INT,
    Nota DECIMAL(4,2), -- Opcional: Para almacenar la nota
    FechaAprobacion DATE, -- Opcional: Para almacenar la fecha de aprobación
    PRIMARY KEY (Legajo, IdMateria),
    FOREIGN KEY (Legajo) REFERENCES Usuarios(Legajo),
    FOREIGN KEY (IdMateria) REFERENCES Materias(IdMateria)
);



-- Indices (optimización de consultas)

CREATE INDEX idx_CarrerasMaterias_IdMateria ON CarrerasMaterias (IdMateria);
CREATE INDEX idx_Correlativas_IdCorrelativa ON Correlativas (IdCorrelativa);
CREATE INDEX idx_MateriasAprobadas_IdMateria ON MateriasAprobadas (IdMateria);



Explicación y Justificación del Diseño:

Usuarios: Almacena la información básica de los usuarios, con el Legajo como clave primaria.

Carreras: Almacena la información de las carreras. El nombre de la carrera se define como UNIQUE para evitar duplicados.

Materias: Almacena la información de las materias, con el Codigo como un identificador único y el Nombre.

CarrerasMaterias: Tabla crucial que implementa la relación muchos a muchos entre carreras y materias. Una carrera puede tener muchas materias, y una materia puede pertenecer a muchas carreras. La clave primaria compuesta asegura que no se repitan combinaciones carrera-materia.

Correlativas: También una relación muchos a muchos implementada con una tabla intermedia. Representa las correlativas anteriores. Para obtener las correlativas posteriores, se haría una consulta inversa en esta misma tabla. La columna IdMateria se refiere a la materia que requiere la correlativa, y IdCorrelativa es la materia que debe ser aprobada.

MateriasAprobadas: Registra qué materias ha aprobado cada usuario. La clave primaria compuesta evita que un usuario apruebe la misma materia dos veces (a menos que quieras registrar, por ejemplo, si recursó una materia). Se incluyen campos opcionales como Nota y FechaAprobacion que podrían ser útiles para el frontend.

Ventajas de este diseño:

Flexibilidad: Permite que una materia pertenezca a varias carreras y que tenga múltiples correlativas.

Eficiencia: Las tablas intermedias facilitan las consultas y el manejo de relaciones complejas.

Escalabilidad: El diseño es robusto y se adapta bien a un aumento en el número de usuarios, carreras o materias.

Normalización: Se reduce la redundancia de datos y se mejora la integridad.

Consultas de ejemplo:

Obtener las correlativas de una materia:

SELECT m2.Codigo, m2.Nombre
FROM Correlativas c
JOIN Materias m1 ON c.IdMateria = m1.IdMateria
JOIN Materias m2 ON c.IdCorrelativa = m2.IdMateria
WHERE m1.Codigo = '3.4.071'; --  Ejemplo: Correlativas de Programación I



Obtener las materias que puede cursar un usuario:

--  (Simplificado, habría que considerar otras condiciones como fechas, cupos, etc.)
SELECT m.Codigo, m.Nombre
FROM Materias m
WHERE m.IdMateria IN (SELECT IdCorrelativa FROM Correlativas WHERE IdMateria IN (SELECT IdMateria FROM MateriasAprobadas WHERE Legajo = 12345))
  AND m.IdMateria NOT IN (SELECT IdMateria FROM MateriasAprobadas WHERE Legajo = 12345);



Obtener el avance de un usuario en una carrera:

SELECT COUNT(ma.IdMateria) AS MateriasAprobadas, (SELECT COUNT(*) FROM CarrerasMaterias WHERE IdCarrera = 1) AS TotalMaterias -- Reemplazar 1 con el IdCarrera
FROM MateriasAprobadas ma
WHERE ma.Legajo = 12345  AND ma.IdMateria IN (SELECT IdMateria FROM CarrerasMaterias WHERE IdCarrera = 1);


