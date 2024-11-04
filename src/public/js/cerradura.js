const socket = io();

let waiting = false;

socket.on('sendAlert', (data) => {
    Swal.fire({
        title: data.message,
        icon: data.success ? 'success' : 'error',
        confirmButtonText: 'Aceptar'
    });
});

socket.on('loggedIn', (username) => {
    document.getElementById('username').textContent = username;
});

socket.on('loggedOut', () => {
    window.location.href = '/login';
});

socket.on('waitConfirmation', (wait) => {
    if (wait && !waiting) {
        waiting = true;
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') e.preventDefault();
        };
        Swal.fire({
            title: 'Cargando...',
            text: 'Esperando confirmación',
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
    } else if (!wait && waiting) {
        waiting = false;
        Swal.close();
    }
});

socket.on('enviarHuella', (data) => {
    if (data.operacion == 0) {
        bootstrap.Modal.getInstance(document.getElementById('addDataModal')).hide();
    } else {
        if (data.operacion == 2) {
            bootstrap.Modal.getInstance(document.getElementById('numberModal')).hide();
        }
        bootstrap.Modal.getInstance(document.getElementById('editDataModal')).hide();
    }
});

socket.on('vacioDatabase', () => {
    bootstrap.Modal.getInstance(document.getElementById('editDataModal')).hide();
});

socket.on('matchData', (data) => {
    // Crear un objeto Date a partir de la fecha recibida
    const activityDate = new Date(data.actividad);
    // Formatear la fecha en español
    const formatedDate = activityDate.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Para usar el formato 24 horas
    });
    document.getElementById('matchData').innerHTML = `
    <ul class="list-group">
        <li class="list-group-item">
            <strong>Nombre:</strong> ${data.nombre}<br>
            <strong>Huella:</strong> ${data.huella}<br>
            <strong>Actividad:</strong> ${formatedDate}
        </li>
    </ul>
    `;
});

// Evento de envío del formulario de login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (loggedIn) return;
    socket.emit('login', Object.fromEntries((new FormData(e.target))));
});

document.getElementById('logoutButton').addEventListener('click', () => {
    Swal.fire({
        title: "Cerrar Sesión",
        text: "¿Estás seguro de que deseas cerrar sesión?",
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        cancelButtonText: "No, cancelar!",
        confirmButtonText: "Si, cerrar sesión!"
    }).then((result) => {
        if (result.isConfirmed) {
            socket.emit('logout');
        }
    });
});

// Evento de envío del formulario de agregar datos
document.getElementById('addDataForm').addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('add', Object.fromEntries((new FormData(e.target))));
});

// Evento de envío del formulario de eliminar datos
document.getElementById('deleteButton').addEventListener('click', () => {
    socket.emit('delete', { nombre: document.getElementById('nombreEdit').value });
});

document.getElementById('editButton').addEventListener('click', () => {
    const nombre = document.getElementById('nombreEdit').value;
    if (!nombre) {
        Swal.fire({
            title: 'Nombre es requerido',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    } else {
        const modal = new bootstrap.Modal(document.getElementById('numberModal'));
        modal.show();
        document.getElementById('confirmNumberButton').addEventListener('click', () => {
            const numero = document.getElementById('huellaNumberInput').value;
            if (!numero) {
                Swal.fire({
                    title: 'Número es requerido',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            } else {
                socket.emit('edit', { nombre: nombre, numero: numero });
            }
        });
    }
});

document.getElementById('vaciarButton').addEventListener('click', () => {
    Swal.fire({
        title: 'Estas seguro?',
        text: 'No se puede revertir esto!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'No, cancelar!',
        confirmButtonText: 'Si, borrar todo!'
    }).then((result) => {
        if (result.isConfirmed) {
            socket.emit('vaciar', { nombre: document.getElementById('nombreEdit').value });
        }
    });
});

// Evento de envío del formulario de forzar cerradura
document.getElementById('forzarCerradura').addEventListener('click', () => {
    socket.emit('forzarCerradura', true);
});