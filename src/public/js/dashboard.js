const socket = io();

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
    setTimeout(() => {
        window.location.href = '/login';
    }, 2000);
});

document.getElementById('logoutButton').addEventListener('click', () => {
    Swal.fire({
        title: 'Cerrar Sesión',
        text: '¿Estás seguro de que deseas cerrar sesión?',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'No, cancelar!',
        confirmButtonText: 'Si, cerrar sesión!'
    }).then((result) => {
        if (result.isConfirmed) {
            socket.emit('logout');
        }
    });
});

document.getElementById('selectModule').addEventListener('click', () => {
    const selectedModule = document.getElementById('moduleSelect').value;
    if (selectedModule) {
        window.location.href = selectedModule
    } else {
        Swal.fire({
            title: 'Error',
            text: 'Por favor, selecciona un módulo.',
            icon: 'error'
        });
    }
})