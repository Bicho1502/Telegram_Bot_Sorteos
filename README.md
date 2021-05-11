[![@StreamSell_Bot](/img/ruleta.jpg?raw=true)](https://t.me/StreamSell_Bot)

# [@StreamSell_Bot](https://t.me/StreamSell_Bot) Código de bot de Telegram
Este es el código del bot de Telegram para la rifa que he creado. ¡Disfruta y siéntete libre de reutilizar!
# Instalación y lanzamiento local
1. Clona este repositorio: `git clone https://github.com/Bicho1502/Telegram_Bot_Sorteos`
2. Inicie la [base de datos de mongo](https://www.mongodb.com/) localmente
3. Cree `.env` con las variables de entorno que se enumeran a continuación
4. Ejecutar `yarn install` en la carpeta raíz
5. Ejecutar `yarn distribute`

¡Y deberías estar listo para comenzar! Siéntase libre de bifurcar y enviar solicitudes de extracción. ¡Gracias!

# Variables de entorno
* `TOKEN` - Token de bot de Telegram
* `USERNAME` - Nombre de usuario del bot de Telegram
* `MONGO` - URL de la base de datos mongo

Además, por favor, considere mirar `.env.sample`.

# Integración continua
Cualquier confirmación enviada al maestro se implementa en @StreamSell_Bot a través de [CI Ninja](https://github.com/backmeupplz/ci-ninja).

# Licencia
Utilícelo para cualquier propósito. Sería genial si pudiera dejar una nota sobre los desarrolladores originales. ¡Gracias!
