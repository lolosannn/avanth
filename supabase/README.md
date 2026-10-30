# Panel de estadísticas (admin.html)

El sitio registra visitas, secciones vistas y clics en Supabase, y `admin.html` los muestra.
Para ver cómo queda con datos de ejemplo: `admin.html?demo`.

## Configuración (una sola vez, ~10 minutos)

1. **Crear el proyecto:** entrá a [supabase.com](https://supabase.com), creá una cuenta y un proyecto nuevo (plan gratis).
2. **Crear las tablas:** en el proyecto, *SQL Editor → New query*, pegá todo `supabase/schema.sql` y tocá *Run*.
   - El panel solo lo pueden ver los emails cargados en la tabla `admins` (viene con `avanth.studio@gmail.com`).
     Para sumar otro: `insert into admins (email) values ('otro@mail.com');`
3. **Crear tu usuario:** *Authentication → Users → Add user → Create new user*, con el mismo email y una contraseña.
   Marcá *Auto Confirm User*.
4. **Cerrar registros:** *Authentication → Sign In / Providers* → desactivá *Allow new users to sign up*.
5. **Conectar el sitio:** *Project Settings → API*, copiá *Project URL* y la key *anon public* en `analytics-config.js`.

Listo: entrá a `tusitio.com/admin.html` con tu email y contraseña.

## Problemas al ingresar

- **"El email no está confirmado":** el usuario se creó sin *Auto Confirm User*. En *SQL Editor*, corré:
  `update auth.users set email_confirmed_at = now() where email = 'avanth.studio@gmail.com';`
- **Olvidaste la contraseña:** en *SQL Editor*, corré (cambiando la contraseña):
  `update auth.users set encrypted_password = crypt('NuevaContraseña', gen_salt('bf')) where email = 'avanth.studio@gmail.com';`

## Qué se registra

- **Visitas:** cada vez que se abre la página, con el sitio de origen y si es celular o computadora.
- **Secciones vistas:** cada sección cuenta una vez por visita si queda en pantalla al menos 1 segundo.
- **Clics:** links y botones (incluye WhatsApp, email, Instagram y videos de proyectos), con la sección donde están.

No se guardan datos personales: cada visitante se identifica con un código aleatorio guardado en su navegador.
Tus propias visitas no se cuentan desde el navegador en el que abriste el panel.
