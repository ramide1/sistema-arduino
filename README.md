# Sistema Arduino

Este proyecto es un sistema de control de huellas dactilares desarrollado con Node.js, Express y Socket.IO para la comunicación en tiempo real entre el servidor y varias placas como ESP8266 y ESP32. El sistema permite la autenticación de usuarios, la gestión de huellas dactilares, y la interacción con sensores ambientales y actuadores.

## Tabla de Contenidos
- [Instalación y Configuración](#instalación-y-configuración)
- [Puesta en Marcha](#puesta-en-marcha)
- [Variables de Entorno](#variables-de-entorno)
- [Eventos de Socket.IO](#eventos-de-socketio)
- [Estructura de Archivos](#estructura-de-archivos)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

---

## Instalación y Configuración

### Requisitos
- [Docker](https://docs.docker.com/get-docker/)
- [Node.js y npm](https://nodejs.org/) (si deseas ejecutarlo sin Docker)

### Clonar el Repositorio
```bash
git clone https://github.com/ramide1/sistema_arduino.git
cd sistema_arduino
```

### Crear el Archivo `.env`

Crea un archivo `.env` en la raíz del proyecto y agrega las siguientes variables de entorno para la configuración del sistema:

```plaintext
SESSION_SECRET="prueba"
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="root"
DB_NAME="sistema_arduino"
DB_TYPE="mysql"
DB_PORT="3306"
APP_PORT="3000"
ACCESS_USERS="Usuario1, Usuario2"
MASTER_KEYS="prueba1234, prueba123"
WAIT_TIMEOUT="60"
COOKIE_TIMEOUT="60"
```

### Docker Compose

El proyecto incluye un archivo `docker-compose.yml` que configura el entorno con dos servicios:
- **web**: El servidor Node.js que ejecuta la API y Socket.IO.
- **db**: Un contenedor de base de datos MariaDB para almacenar la información de huellas dactilares y usuarios.

Para ejecutar el proyecto con Docker, utiliza el siguiente comando:

```bash
docker compose up -d
```

Esto levantará el servidor en `http://localhost:3000` (o en el puerto especificado en `APP_PORT`).

## Puesta en Marcha

Con Docker:
```bash
docker compose up -d
```

Sin Docker:
1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor:
   ```bash
   npm start
   ```

El servidor estará disponible en el puerto configurado (`3000` por defecto).

## Variables de Entorno

Estas son las variables de entorno necesarias para el funcionamiento del sistema:

- `SESSION_SECRET`: Clave secreta para la sesión.
- `DB_HOST`: Dirección del host de la base de datos.
- `DB_USER`: Usuario de la base de datos.
- `DB_PASSWORD`: Contraseña de la base de datos.
- `DB_NAME`: Nombre de la base de datos.
- `DB_TYPE`: Tipo de base de datos (e.g., `mysql`).
- `DB_PORT`: Puerto de la base de datos.
- `APP_PORT`: Puerto donde se ejecutará la aplicación.
- `ACCESS_USERS`: Lista de usuarios autorizados, separados por coma.
- `MASTER_KEYS`: Lista de claves maestras para los usuarios, separadas por coma.
- `WAIT_TIMEOUT`: Tiempo de espera en segundos antes de cancelar operaciones en espera (por defecto, `60` segundos).
- `COOKIE_TIMEOUT`: Tiempo de expiración de las cookies de sesión en segundos.

## Eventos de Socket.IO

A continuación se detallan los eventos de Socket.IO que escucha el servidor:

### Eventos de Conexión

- **connection**: Inicia la conexión con el cliente y verifica si el usuario está autenticado.
- **disconnect**: Indica que un cliente se ha desconectado.

### Eventos de Autenticación

- **login**: Recibe `username` y `password` para autenticación. Verifica si el usuario está autorizado.
- **logout**: Cierra la sesión del usuario actual.

### Eventos de Gestión de Huellas Dactilares

- **add**: Crea una nueva entrada de huella dactilar en la base de datos. Espera confirmación del dispositivo.
- **delete**: Elimina una huella dactilar de la base de datos según el nombre proporcionado.
- **edit**: Modifica una huella dactilar existente.
- **vaciar**: Vacía la base de datos de todas las huellas dactilares.

### Eventos de Confirmación

- **confirmacionHuella**: Confirma la operación de huella dactilar y actualiza el estado en la base de datos.
- **confirmacionVaciar**: Vacía la base de datos y envía un mensaje de confirmación.
- **matchHuella**: Actualiza la actividad de la huella encontrada.

### Otros Eventos

- **AmbientalSensores**: Envía los datos de los sensores ambientales al cliente.
- **AmbientalSwitches**: Envía el estado de los interruptores ambientales.
- **checkboxToggle**: Cambia el estado de un checkbox (ejemplo de actuador o control remoto).
- **forzarCerradura**: Fuerza el cierre de la cerradura.

## Contribuciones

Si deseas contribuir a este proyecto, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz un commit (`git commit -m 'Agrega nueva funcionalidad'`).
4. Sube tus cambios (`git push origin feature/nueva-funcionalidad`).
5. Abre un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT. Para más detalles, consulta el archivo [LICENSE](LICENSE) en el repositorio.

--- 
