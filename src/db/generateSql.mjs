import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function generateSQL() {
    try {
        // Leer el archivo JSON
        const jsonPath = path.join(__dirname, 'ing-informatica.json');
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

        let sql = '';

        // Limpiar datos existentes
        sql += `-- Limpiar datos existentes\n`;
        sql += `DELETE FROM Prerequisites;\n`;
        sql += `DELETE FROM CareerSubjects;\n`;
        sql += `DELETE FROM Subjects;\n`;
        sql += `DELETE FROM Careers;\n\n`;

        // Insertar la carrera
        sql += `-- Insertar la carrera\n`;
        sql += `INSERT INTO Careers (CareerId, Name)\n`;
        sql += `VALUES (${jsonData.plan}, '${jsonData.carrera}');\n\n`;

        // Insertar las materias
        sql += `-- Insertar las materias\n`;
        sql += `INSERT INTO Subjects (Code, Name) VALUES\n`;
        const subjectValues = jsonData.materias.map(subject => 
            `('${subject.codigo}', '${subject.nombre.replace(/'/g, "''")}')`
        );
        sql += subjectValues.join(',\n') + ';\n\n';

        // Insertar las relaciones carrera-materia con año y cuatrimestre sugeridos
        sql += `-- Insertar relaciones carrera-materia\n`;
        sql += `INSERT INTO CareerSubjects (CareerId, SubjectId, suggested_year, suggested_quarter)\n`;
        sql += `SELECT ${jsonData.plan}, s.SubjectId, v.suggested_year, v.suggested_quarter\n`;
        sql += `FROM Subjects s\n`;
        sql += `CROSS JOIN LATERAL (\n`;
        sql += `  VALUES\n`;
        
        const careerSubjectValues = jsonData.materias.map(subject => 
            `('${subject.codigo}', ${subject.año_sugerido}, ${subject.cuatrimestre_sugerido})`
        );
        
        sql += careerSubjectValues.join(',\n') + '\n';
        sql += `) AS v(code, suggested_year, suggested_quarter)\n`;
        sql += `WHERE s.Code = v.code;\n\n`;

        // Insertar las correlativas
        sql += `-- Insertar correlativas\n`;
        sql += `INSERT INTO Prerequisites (SubjectId, PrerequisiteId)\n`;
        sql += `SELECT s1.SubjectId, s2.SubjectId\n`;
        sql += `FROM Subjects s1\n`;
        sql += `CROSS JOIN LATERAL (\n`;
        sql += `  VALUES\n`;

        const prerequisiteValues = jsonData.materias
            .filter(subject => subject.correlativas_anteriores.length > 0)
            .map(subject => {
                return subject.correlativas_anteriores.map(prereq => 
                    `('${subject.codigo}', '${prereq}')`
                );
            })
            .flat();

        if (prerequisiteValues.length > 0) {
            sql += prerequisiteValues.join(',\n') + '\n';
        }

        sql += `) AS prereqs(subject_code, prereq_code)\n`;
        sql += `JOIN Subjects s2 ON s2.Code = prereqs.prereq_code\n`;
        sql += `WHERE s1.Code = prereqs.subject_code;\n`;

        // Escribir el SQL en un archivo
        const sqlPath = path.join(__dirname, 'seed.sql');
        fs.writeFileSync(sqlPath, sql);

        console.log('SQL generado exitosamente en seed.sql');
    } catch (error) {
        console.error('Error generando SQL:', error);
    }
}

generateSQL();