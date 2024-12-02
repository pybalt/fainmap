# FainMap

Mapa interactivo de materias para estudiantes de UADE.

## Contribuir con Nuevas Carreras

Para agregar una nueva carrera, crea un archivo JSON en el directorio `src/db/` siguiendo esta estructura. El nombre del archivo debe estar en minúsculas y usar guiones bajos para separar palabras (ejemplo: `ingenieria_informatica.json`).

```json
{
  "carrera": "Nombre de la Carrera",
  "plan": 1621,
  "año": 2021,
  "materias": [
    {
      "id": "código_único",
      "codigo": "código_materia",
      "nombre": "Nombre de la Materia",
      "correlativas": ["código_correlativa1", "código_correlativa2"],
      "año": 1,
      "cuatrimestre": 1
    }
  ]
}
```

### Estructura Requerida

Nombre del archivo:
- Debe estar en minúsculas
- Usar guiones bajos (_) para separar palabras
- Extensión .json
- Ejemplos válidos:
  - `ingenieria_informatica.json`
  - `licenciatura_en_gestion_it.json`
  - `tecnicatura_desarrollo_software.json`

Campos principales:
- `carrera`: Nombre completo de la carrera (string)
- `plan`: Número de plan de estudios (number)
- `año`: Año de vigencia del plan (number)

Cada materia debe contener:
- `id`: Identificador único de la materia (string)
- `codigo`: Código oficial de la materia en UADE (string)
- `nombre`: Nombre completo de la materia (string)
- `correlativas`: Array de códigos de materias correlativas (array de strings)
- `año`: Año sugerido en el plan de estudios (número del 1 al 5)
- `cuatrimestre`: Cuatrimestre sugerido (1 o 2)

### Ejemplo

```json
{
  "carrera": "Ingeniería En Informática",
  "plan": 1621,
  "año": 2021,
  "materias": [
    {
      "id": "algebra",
      "codigo": "MAT01",
      "nombre": "Álgebra y Geometría Analítica",
      "correlativas": [],
      "año": 1,
      "cuatrimestre": 1
    },
    {
      "id": "analisis1",
      "codigo": "MAT02",
      "nombre": "Análisis Matemático I",
      "correlativas": ["algebra"],
      "año": 1,
      "cuatrimestre": 2
    }
  ]
}
```

### Proceso de Contribución

1. Fork el repositorio
2. Crea un nuevo archivo JSON en `src/db/` con el nombre de la carrera
3. Asegúrate de que el archivo siga la estructura exacta del ejemplo
4. Crea un Pull Request con:
   - Nombre de la carrera
   - Número de plan y año
   - Fuente de la información (plan de estudios oficial)
   - Cualquier nota adicional relevante

### Validación Automática

El repositorio cuenta con un sistema de validación automática que se ejecuta en cada Pull Request. Este sistema verifica:

- Estructura del JSON
- Campos requeridos y sus tipos:
  - Carrera (string)
  - Plan (número)
  - Año (número válido)
  - Materias (array)
- IDs únicos
- Referencias válidas de correlativas
- Valores válidos para año y cuatrimestre

Si la validación falla, recibirás un comentario en tu PR con los errores específicos que debes corregir.

Para probar la validación localmente antes de crear el PR:

```bash
node scripts/validate-career-json.js src/db/tu_carrera.json
```

### Checklist de Validación

Antes de enviar tu PR, verifica que:
- [ ] El JSON es válido y está bien formateado
- [ ] El nombre de la carrera está correcto
- [ ] El número de plan es válido
- [ ] El año del plan es válido
- [ ] Todos los campos de las materias están presentes
- [ ] Los IDs son únicos
- [ ] Las correlativas referencian IDs existentes
- [ ] Los años están entre 1 y 9
- [ ] Los cuatrimestres son 1 o 2
- [ ] La validación automática pasa sin errores

¡Gracias por contribuir a FainMap!
