const fs = require('fs');
const path = require('path');

function validateCareerJson(filePath) {
  try {
    // Validar nombre del archivo
    const fileName = path.basename(filePath, '.json');
    if (!/^[a-z]+(_[a-z]+)*$/.test(fileName)) {
      return ['El nombre del archivo debe estar en minúsculas y usar guiones bajos para separar palabras (ejemplo: ingenieria_informatica)'];
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    const errors = [];

    // Validar estructura básica
    if (!data.carrera || typeof data.carrera !== 'string') {
      errors.push('El campo "carrera" es requerido y debe ser un string');
    }

    if (!data.plan || typeof data.plan !== 'number') {
      errors.push('El campo "plan" es requerido y debe ser un número');
    }

    if (!data.año || typeof data.año !== 'number' || data.año < 1900 || data.año > new Date().getFullYear()) {
      errors.push('El campo "año" es requerido y debe ser un número válido entre 1900 y el año actual');
    }

    if (!Array.isArray(data.materias)) {
      errors.push('El campo "materias" es requerido y debe ser un array');
      return errors;
    }

    // Validar materias
    const ids = new Set();
    data.materias.forEach((materia, index) => {
      // Validar campos requeridos
      if (!materia.id || typeof materia.id !== 'string') {
        errors.push(`Materia ${index + 1}: El campo "id" es requerido y debe ser un string`);
      }
      if (!materia.codigo || typeof materia.codigo !== 'string') {
        errors.push(`Materia ${index + 1}: El campo "codigo" es requerido y debe ser un string`);
      }
      if (!materia.nombre || typeof materia.nombre !== 'string') {
        errors.push(`Materia ${index + 1}: El campo "nombre" es requerido y debe ser un string`);
      }
      if (!Array.isArray(materia.correlativas)) {
        errors.push(`Materia ${index + 1}: El campo "correlativas" debe ser un array`);
      }
      if (typeof materia.año !== 'number' || materia.año < 1 || materia.año > 9) {
        errors.push(`Materia ${index + 1}: El campo "año" debe ser un número entre 1 y 9`);
      }
      if (typeof materia.cuatrimestre !== 'number' || ![1, 2].includes(materia.cuatrimestre)) {
        errors.push(`Materia ${index + 1}: El campo "cuatrimestre" debe ser 1 o 2`);
      }

      // Validar IDs únicos
      if (ids.has(materia.id)) {
        errors.push(`ID duplicado encontrado: ${materia.id}`);
      }
      ids.add(materia.id);
    });

    // Validar referencias de correlativas
    data.materias.forEach((materia, index) => {
      if (Array.isArray(materia.correlativas)) {
        materia.correlativas.forEach(correlativa => {
          if (!ids.has(correlativa)) {
            errors.push(`Materia ${index + 1}: Correlativa "${correlativa}" no existe`);
          }
        });
      }
    });

    return errors;
  } catch (error) {
    return [`Error al procesar el archivo: ${error.message}`];
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Por favor proporciona la ruta al archivo JSON');
    process.exit(1);
  }

  const filePath = args[0];
  const errors = validateCareerJson(filePath);

  if (errors.length > 0) {
    console.error('Errores encontrados:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  } else {
    console.log('Validación exitosa ✅');
    process.exit(0);
  }
}

module.exports = validateCareerJson; 