# Prospector de Avanth

Busca negocios de un rubro en una ciudad, revisa sus páginas web y te arma una página para elegir a quién escribirle. **No manda nada solo**: cada botón abre WhatsApp (o copia el texto para Instagram) y el mensaje lo mandás vos. Así no te bloquean la cuenta.

## Qué necesitás

Python 3.9 o más nuevo. No hay que instalar nada más.

## Cómo se usa

Desde esta carpeta:

```
python prospector.py gimnasio "Córdoba, Argentina"
python prospector.py estetica "Palermo, Buenos Aires" --radio 3000
python prospector.py --tag shop=florist florerias "Rosario"
```

Al terminar se abre una página en `resultados/` con los prospectos ordenados por prioridad:

- **Sin web** y **web caída**: los más calientes.
- **Web mejorable**: no anda bien en el celular, no tiene https, se ve vieja, tarda en cargar, etc.
- Los que tienen la web bien no aparecen, salvo que agregues `--incluir-web-ok` (les ofrece automatizaciones).

En la página podés editar cada mensaje, corregir el número, elegir, descartar y marcar como enviado. Lo que hacés queda guardado en tu navegador, así no le escribís dos veces al mismo. También podés descargar todo en CSV.

## Para que no te bloqueen

- No pases de unos 20 mensajes por día desde un número nuevo (la página te avisa).
- Cambiá algo de cada mensaje antes de mandarlo. El bot ya alterna entre varias versiones.
- Si alguien te dice que no, no insistas.
- Revisá que el número sea un celular: OpenStreetMap a veces trae teléfonos fijos, que no tienen WhatsApp.

## Personalizar

- `config.json`: tu nombre, la web de la agencia, el radio de búsqueda y el límite diario.
- `plantillas.json`: los mensajes. Hay varias versiones por situación y podés usar `{nombre}`, `{rubro}`, `{problema}`, `{tu_nombre}`, `{agencia}` y `{web_agencia}`.
- `rubros.json`: qué busca cada rubro en OpenStreetMap. Los tags están en https://wiki.openstreetmap.org/wiki/Map_features

## De dónde saca los datos

Por defecto usa **OpenStreetMap**, que es gratis y no pide cuenta. Tiene menos negocios cargados que Google Maps, sobre todo en ciudades chicas.

Si querés más resultados, podés usar **Google Places**: creá una clave en Google Cloud (pide tarjeta, pero tiene un uso mensual gratis que alcanza para bastantes búsquedas; revisá los precios antes) y corré:

```
GOOGLE_PLACES_KEY=tu_clave python prospector.py gimnasio "Córdoba, Argentina"
```

En Windows (PowerShell): `$env:GOOGLE_PLACES_KEY="tu_clave"; python prospector.py ...`
