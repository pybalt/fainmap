import { useState } from 'react'

export function LoginForm() {
    const [studentId, setStudentId] = useState('')
    const [confirmStudentId, setConfirmStudentId] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validaciones
        if (studentId !== confirmStudentId) {
            setError('Los números de legajo no coinciden')
            return
        }

        if (!/^\d+$/.test(studentId)) {
            setError('El legajo debe contener solo números')
            return
        }

        if (!firstName.trim() || !lastName.trim()) {
            setError('El nombre y apellido son requeridos')
            return
        }

        try {
            // Aquí iría la lógica para verificar si el legajo existe
            // y crear la sesión del usuario
        } catch (err) {
            setError('Error al iniciar sesión')
            console.error(err)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-sm mx-auto mt-10">
            <div className="space-y-4">
                <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                        Número de Legajo
                    </label>
                    <input
                        type="text"
                        id="studentId"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="Ingresa tu número de legajo"
                    />
                </div>

                <div>
                    <label htmlFor="confirmStudentId" className="block text-sm font-medium text-gray-700">
                        Confirmar Legajo
                    </label>
                    <input
                        type="text"
                        id="confirmStudentId"
                        value={confirmStudentId}
                        onChange={(e) => setConfirmStudentId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="Confirma tu número de legajo"
                        autoComplete="off"
                    />
                </div>

                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        Nombre
                    </label>
                    <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="Ingresa tu nombre"
                    />
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Apellido
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="Ingresa tu apellido"
                    />
                </div>

                {error && (
                    <div className="text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Registrarse
                </button>
            </div>
        </form>
    )
}