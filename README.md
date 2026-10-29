# Avanth Studio

Sitio estático de Avanth Studio: diseño web, automatización y software a medida.

- `index.html`: estructura de la página
- `styles.css`: estilos (colores y tipografías en `:root`)
- `script.js`: menú mobile, formulario y animaciones. **Completá `CONFIG` con tu email, WhatsApp y redes.** Para que los reels aparezcan solos en la sección Instagram, pegá el link del feed JSON de [Behold](https://behold.so) en `CONFIG.instagramFeed` (o cargalos a mano en `CONFIG.instagramReels`).
- `assets/logo.svg`: logo
- `admin.html`: panel de estadísticas (visitas y clics). Se configura en `analytics-config.js`; ver `supabase/README.md`.

## Publicar con GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → elegí la rama y la carpeta `/ (root)`.
