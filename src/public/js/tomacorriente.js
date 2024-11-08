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

socket.on('Rt1', (status) => {
    if (status) {
        document.getElementById('indicatorR1').classList.add('red-background');
    } else {
        document.getElementById('indicatorR1').classList.remove('red-background');
    }
});

socket.on('Rt2', (status) => {
    if (status) {
        document.getElementById('indicatorR2').classList.add('red-background');
    } else {
        document.getElementById('indicatorR2').classList.remove('red-background');
    }
});

socket.on('GasesT1', (status) => {
    document.getElementById('gasesToggle1').checked = status;
});

socket.on('FuegoT1', (status) => {
    document.getElementById('fuegoToggle1').checked = status;
});

socket.on('GasesT2', (status) => {
    document.getElementById('gasesToggle2').checked = status;
});

socket.on('FuegoT2', (status) => {
    document.getElementById('fuegoToggle2').checked = status;
});

socket.on('tomacorrienteChanged', (data) => {
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
    document.getElementById('gasesToggle1').checked = data.gases1;
    document.getElementById('fuegoToggle1').checked = data.fuego1;
    document.getElementById('gasesToggle2').checked = data.gases2;
    document.getElementById('fuegoToggle2').checked = data.fuego2;
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
    socket.emit('checkboxToggle', { type: 'Rt1', status: !e.target.classList.contains('red-background') });
});

document.getElementById('indicatorR2').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'Rt2', status: !e.target.classList.contains('red-background') });
});

document.getElementById('gasesToggle1').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'GasesT1', status: e.target.checked });
});

document.getElementById('fuegoToggle1').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'FuegoT1', status: e.target.checked });
});

document.getElementById('gasesToggle2').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'GasesT2', status: e.target.checked });
});

document.getElementById('fuegoToggle2').addEventListener('click', (e) => {
    socket.emit('checkboxToggle', { type: 'FuegoT2', status: e.target.checked });
});