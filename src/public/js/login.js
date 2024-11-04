const socket = io();

socket.on('sendAlert', (data) => {
    Swal.fire({
        title: data.message,
        icon: data.success ? 'success' : 'error',
        confirmButtonText: 'Aceptar'
    });
});

socket.on('loggedIn', () => {
    window.location.href = '/dashboard';
});

// Evento de envío del formulario de login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    socket.emit('login', Object.fromEntries((new FormData(e.target))));
});