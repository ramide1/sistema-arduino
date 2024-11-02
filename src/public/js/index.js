const socket = io();

let loggedIn = false;

socket.on('enviarAlerta', (data) => {
    Swal.fire({
        title: data.message,
        icon: data.success ? 'success' : 'error',
        confirmButtonText: 'Aceptar'
    });
});

socket.on('loggedIn', (username) => {
    if (!loggedIn) {
        loggedIn = true;
        // Mostrar contenedor principal
        document.getElementById('mainContent').style.display = '';
        // Ocultar formulario de login
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('username').textContent = username;
    }
});

socket.on('loggedOut', () => {
    if (loggedIn) {
        loggedIn = false;
        // Ocultar contenedor principal
        document.getElementById('mainContent').style.display = 'none';
        // Mostrar formulario de login
        document.getElementById('loginForm').style.display = '';
        document.getElementById('username').textContent = '';
    }
});

socket.on('esperarConfirmacion', (esperar) => {
    if (loggedIn) {
        if (esperar) {
            const handleKeyPress = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                }
            };
            Swal.fire({
                title: 'Cargando...',
                text: 'Esperando confirmacion',
                icon: 'info',
                allowEscapeKey: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                    document.addEventListener('keydown', handleKeyPress);
                },
                willClose: () => {
                    document.removeEventListener('keydown', handleKeyPress);
                }
            });
        } else {
            Swal.close();
        }
    }
})

socket.on('enviarHuella', (data) => {
    if (loggedIn) {
        if (data.operacion == 0) {
            document.getElementById('btnCloseAgregar').click();
        } else {
            document.getElementById('btnCloseAvanzado').click();
        }
    }
});

socket.on('datosCliente', (data) => {
    if (loggedIn) {
        let textoHtml = `<ul class="list-group">`;
        // Crear un objeto Date a partir de la fecha recibida
        const actividadDate = new Date(data.actividad);
        // Formatear la fecha en español
        const fechaFormateada = actividadDate.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // Para usar el formato 24 horas
        });
        textoHtml += `
            <li class="list-group-item">
                <strong>Nombre:</strong> ${data.nombre}<br>
                <strong>Huella:</strong> ${data.huella != null ? data.huella : 'Esperando confirmacion'}<br>
                <strong>Actividad:</strong> ${fechaFormateada}
            </li>
        `;
        textoHtml += `</ul>`;
        document.getElementById('datosCliente').innerHTML = textoHtml;
    }
});

// Evento de envío del formulario de login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!loggedIn) {
        socket.emit('login', Object.fromEntries((new FormData(e.target))));
    }
});

document.getElementById('logoutButton').addEventListener('click', () => {
    if (loggedIn) {
        Swal.fire({
            title: "Cerrar Sesión",
            text: "¿Estás seguro de que deseas cerrar sesión?",
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            cancelButtonText: "No, cancelar!",
            confirmButtonText: "Si, borrar todo!"
        }).then((result) => {
            if (result.isConfirmed) {
                socket.emit('logout');
            }
        });
    }
});

// Evento de envío del formulario de agregar datos
document.getElementById('addDataForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (loggedIn) {
        socket.emit('add', Object.fromEntries((new FormData(e.target))));
    }
});

// Evento de envío del formulario de eliminar datos
document.getElementById('eliminarButton').addEventListener('click', () => {
    if (loggedIn) {
        socket.emit('delete', { nombre: document.getElementById('nombreEdit').value });
    }
});

document.getElementById('editButton').addEventListener('click', () => {
    if (loggedIn) {
        Swal.fire({
            title: 'Modificar Huella',
            text: 'Por favor, ingresa el número de huella:',
            icon: 'info',
            input: 'text',
            inputPlaceholder: 'Número de huella',
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            cancelButtonText: "No, cancelar!",
            confirmButtonText: "Si, borrar todo!",
            inputValidator: (value) => {
                if (!value) {
                    return 'Se necesita un número de huella';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                socket.emit('edit', { nombre: document.getElementById('nombreEdit').value, numero: result.value });
            }
        });
    }
});

document.getElementById('vaciarButton').addEventListener('click', () => {
    if (loggedIn) {
        Swal.fire({
            title: "Estas seguro?",
            text: "No se puede revertir esto!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            cancelButtonText: "No, cancelar!",
            confirmButtonText: "Si, borrar todo!"
        }).then((result) => {
            if (result.isConfirmed) {
                socket.emit('vaciar', { nombre: document.getElementById('nombreEdit').value });
            }
        });
    }
});

// Evento de envío del formulario de forzar cerradura
document.getElementById('forzar-cerradura').addEventListener('click', () => {
    if (loggedIn) {
        socket.emit('forzarCerradura', true);
    }
});