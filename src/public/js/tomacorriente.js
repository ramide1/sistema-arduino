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

socket.on('habilitarHorario1', (data) => {
    document.getElementById('horarioToggle1').checked = data.status;
    document.getElementById('desde1').value = data.horaInicio + ':' + data.minutoInicio;
    document.getElementById('hasta1').value = data.horaFin + ':' + data.minutoFin;
});

socket.on('habilitarHorario2', (data) => {
    document.getElementById('horarioToggle2').checked = data.status;
    document.getElementById('desde2').value = data.horaInicio + ':' + data.minutoInicio;
    document.getElementById('hasta2').value = data.horaFin + ':' + data.minutoFin;
});

socket.on('ambientalChanged', (data) => {
    if (data.alertaGases) {
        if (data.alertaFuego) {
            if (data.fuego) {
                Swal.fire({
                    title: 'Alerta de Fuego',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
                if (document.getElementById('fuegoToggle1').checked) {
                    socket.emit('checkboxToggle', { type: 'alertaGases1', status: 1 });
                }
                if (document.getElementById('fuegoToggle2').checked) {
                    socket.emit('checkboxToggle', { type: 'alertaGases2', status: 1 });
                }
            }
        } else {
            if (data.gases) {
                Swal.fire({
                    title: 'Alerta de Gases',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
                if (document.getElementById('gasesToggle1').checked) {
                    socket.emit('checkboxToggle', { type: 'alertaGases1', status: 0 });
                }
                if (document.getElementById('gasesToggle2').checked) {
                    socket.emit('checkboxToggle', { type: 'alertaGases2', status: 0 });
                }
            }
        }
    }
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

document.getElementById('horarioToggle1').addEventListener('click', (e) => {
    if (document.getElementById('desde1').value && document.getElementById('hasta1').value) {
        const [horadesde, minutodesde] = document.getElementById('desde1').value.split(':');
        const [horahasta, minutohasta] = document.getElementById('hasta1').value.split(':');
        socket.emit('checkboxToggle', { type: 'habilitarHorario1', status: { status: e.target.checked, horaInicio: horadesde, horaFin: horahasta, minutoInicio: minutodesde, minutoFin: minutohasta } });
    }
});

document.getElementById('horarioToggle2').addEventListener('click', (e) => {
    if (document.getElementById('desde2').value && document.getElementById('hasta2').value) {
        const [horadesde, minutodesde] = document.getElementById('desde2').value.split(':');
        const [horahasta, minutohasta] = document.getElementById('hasta2').value.split(':');
        socket.emit('checkboxToggle', { type: 'habilitarHorario2', status: { status: e.target.checked, horaInicio: horadesde, horaFin: horahasta, minutoInicio: minutodesde, minutoFin: minutohasta } });
    }
});

['desde1', 'hasta1', 'desde2', 'hasta2'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('keydown', (e) => {
        e.preventDefault();
    });
    input.addEventListener('click', (e) => {
        e.target.showPicker();
    });
});