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

socket.on('R1', (status) => {
    if (status) {
        document.getElementById('indicatorR1').classList.add('red-background');
    } else {
        document.getElementById('indicatorR1').classList.remove('red-background');
    }
});

socket.on('R2', (status) => {
    if (status) {
        document.getElementById('indicatorR2').classList.add('red-background');
    } else {
        document.getElementById('indicatorR2').classList.remove('red-background');
    }
});

socket.on('Presencia', (status) => {
    document.getElementById('presenciaToggle').checked = status;
});

socket.on('Gases', (status) => {
    document.getElementById('gasesToggle').checked = status;
});

socket.on('Fuego', (status) => {
    document.getElementById('fuegoToggle').checked = status;
});

socket.on('ambientalChanged', (data) => {
    document.getElementById('ppmValue').innerText = data.ppm;
    document.getElementById('temperatureValue').innerText = data.temperatura + '°C';
    document.getElementById('humidityValue').innerText = data.humedad + '%';
    document.getElementById('presenciaToggle').checked = data.presencia;
    document.getElementById('gasesToggle').checked = data.gases;
    document.getElementById('fuegoToggle').checked = data.fuego;
    if (data.r1) {
        document.getElementById('indicatorR1').classList.add('red-background');
    } else {
        document.getElementById('indicatorR1').classList.remove('red-background');
    }
    if (data.r2) {
        document.getElementById('indicatorR2').classList.add('red-background');
    } else {
        document.getElementById('indicatorR2').classList.remove('red-background');
    }
    if (data.alertaGases) {
        Swal.fire({
            title: data.alertaFuego ? 'Alerta de Fuego' : 'Alerta de Gases',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
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

document.getElementById('indicatorR1').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'R1', status: !e.target.classList.contains('red-background') });
});

document.getElementById('indicatorR2').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'R2', status: !e.target.classList.contains('red-background') });
});

document.getElementById('presenciaToggle').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'Presencia', status: e.target.checked });
});

document.getElementById('gasesToggle').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'Gases', status: e.target.checked });
});

document.getElementById('fuegoToggle').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'Fuego', status: e.target.checked });
});