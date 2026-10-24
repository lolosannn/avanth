#!/usr/bin/env python3
"""Buscador de clientes potenciales para Avanth.

Busca negocios de un rubro en una ciudad, revisa sus páginas web y arma una
página para revisar los prospectos, editar el mensaje y mandarlo a mano.
No envía nada por su cuenta.

Uso:
    python prospector.py gimnasio "Córdoba, Argentina"
    python prospector.py estetica "Palermo, Buenos Aires" --radio 3000
    python prospector.py --tag shop=florist florería "Rosario"

Solo usa la librería estándar de Python (3.9 o más nuevo).
"""

import argparse
import concurrent.futures
import html
import json
import os
import random
import re
import ssl
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from datetime import date
from pathlib import Path

BASE = Path(__file__).resolve().parent
USER_AGENT = "AvanthProspector/1.0 (+https://avanth.com.ar)"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
OVERPASS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
GOOGLE_PLACES = "https://places.googleapis.com/v1/places:searchText"
ANIO_ACTUAL = date.today().year


# ---------------------------------------------------------------- utilidades

def cargar_json(nombre):
    with open(BASE / nombre, encoding="utf-8") as f:
        return json.load(f)


def sin_acentos(texto):
    texto = unicodedata.normalize("NFD", texto.lower().strip())
    return "".join(c for c in texto if unicodedata.category(c) != "Mn")


def slug(texto):
    return re.sub(r"[^a-z0-9]+", "-", sin_acentos(texto)).strip("-")


def pedir(url, datos=None, headers=None, timeout=30):
    """Hace un pedido HTTP y devuelve (respuesta, cuerpo en bytes)."""
    h = {"User-Agent": USER_AGENT}
    h.update(headers or {})
    req = urllib.request.Request(url, data=datos, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r, r.read()


def log(msg):
    print(msg, file=sys.stderr, flush=True)


# ------------------------------------------------------------- buscar lugares

def geocodificar(ciudad):
    q = urllib.parse.urlencode({"q": ciudad, "format": "json", "limit": 1})
    _, cuerpo = pedir(f"{NOMINATIM}?{q}")
    res = json.loads(cuerpo)
    if not res:
        sys.exit(f"No encontré la ciudad «{ciudad}». Probá agregando la provincia o el país.")
    lugar = res[0]
    log(f"Ciudad: {lugar['display_name']}")
    return float(lugar["lat"]), float(lugar["lon"])


def buscar_osm(tags, lat, lon, radio):
    filtros = ""
    for tag in tags:
        k, v = tag.split("=", 1)
        filtros += f'  nwr["{k}"="{v}"]["name"](around:{radio},{lat},{lon});\n'
    consulta = f"[out:json][timeout:60];\n(\n{filtros});\nout center tags;"
    datos = urllib.parse.urlencode({"data": consulta}).encode()
    ultimo_error = None
    for servidor in OVERPASS:
        try:
            _, cuerpo = pedir(servidor, datos=datos, timeout=90)
            elementos = json.loads(cuerpo).get("elements", [])
            break
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            ultimo_error = e
            log(f"  {servidor} no respondió ({e}), pruebo con otro…")
    else:
        sys.exit(f"No pude consultar OpenStreetMap: {ultimo_error}")

    lugares = []
    for el in elementos:
        t = el.get("tags", {})
        calle = " ".join(x for x in [t.get("addr:street"), t.get("addr:housenumber")] if x)
        direccion = ", ".join(x for x in [calle, t.get("addr:city")] if x)
        lat_el = el.get("lat") or el.get("center", {}).get("lat")
        lon_el = el.get("lon") or el.get("center", {}).get("lon")
        lugares.append({
            "id": f"osm-{el['type']}-{el['id']}",
            "nombre": t.get("name", "").strip(),
            "direccion": direccion,
            "telefono": t.get("contact:whatsapp") or t.get("phone") or t.get("contact:phone") or t.get("contact:mobile") or "",
            "web": t.get("website") or t.get("contact:website") or t.get("url") or "",
            "instagram": t.get("contact:instagram") or "",
            "facebook": t.get("contact:facebook") or "",
            "email": t.get("email") or t.get("contact:email") or "",
            "mapa": f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(t.get('name', ''))}%20{lat_el},{lon_el}",
            "rating": None,
            "resenas": None,
            "fuente": "OpenStreetMap",
        })
    return lugares


def buscar_google(rubro, ciudad, clave, maximo):
    """Google Places (New) Text Search. Solo se usa si hay GOOGLE_PLACES_KEY."""
    campos = ",".join([
        "places.id", "places.displayName", "places.formattedAddress",
        "places.internationalPhoneNumber", "places.nationalPhoneNumber",
        "places.websiteUri", "places.googleMapsUri", "places.rating",
        "places.userRatingCount", "places.businessStatus", "nextPageToken",
    ])
    headers = {"Content-Type": "application/json", "X-Goog-Api-Key": clave, "X-Goog-FieldMask": campos}
    cuerpo = {"textQuery": f"{rubro} en {ciudad}", "languageCode": "es", "pageSize": 20}
    lugares = []
    while len(lugares) < maximo:
        try:
            _, res = pedir(GOOGLE_PLACES, datos=json.dumps(cuerpo).encode(), headers=headers)
        except urllib.error.HTTPError as e:
            sys.exit(f"Google Places devolvió un error: {e.code} {e.read().decode(errors='ignore')[:300]}")
        res = json.loads(res)
        for p in res.get("places", []):
            if p.get("businessStatus") not in (None, "OPERATIONAL"):
                continue
            lugares.append({
                "id": f"g-{p['id']}",
                "nombre": p.get("displayName", {}).get("text", ""),
                "direccion": p.get("formattedAddress", ""),
                "telefono": p.get("internationalPhoneNumber") or p.get("nationalPhoneNumber") or "",
                "web": p.get("websiteUri", ""),
                "instagram": "",
                "facebook": "",
                "email": "",
                "mapa": p.get("googleMapsUri", ""),
                "rating": p.get("rating"),
                "resenas": p.get("userRatingCount"),
                "fuente": "Google",
            })
        token = res.get("nextPageToken")
        if not token:
            break
        cuerpo["pageToken"] = token
        time.sleep(2)
    return lugares[:maximo]


def sin_duplicados(lugares):
    vistos, salida = set(), []
    for l in lugares:
        clave = sin_acentos(l["nombre"])
        if not clave or clave in vistos:
            continue
        vistos.add(clave)
        salida.append(l)
    return salida


# ----------------------------------------------------------- revisar la web

REDES_FALSAS = ("facebook.com", "instagram.com", "linktr.ee", "wa.me", "whatsapp.com")


def revisar_web(lugar):
    """Agrega 'situacion' (sin_web, web_caida, web_mejorable, web_ok) y 'problemas'."""
    url = lugar["web"].strip()
    problemas = []
    if url and not url.startswith("http"):
        url = "http://" + url

    if not url or any(r in url for r in REDES_FALSAS):
        if url and "instagram.com" in url and not lugar["instagram"]:
            lugar["instagram"] = url
        if url and "facebook.com" in url and not lugar["facebook"]:
            lugar["facebook"] = url
        lugar["web"] = ""
        lugar["situacion"] = "sin_web"
        lugar["problemas"] = ["no tiene página web" + (" (solo redes sociales)" if url else "")]
        return lugar

    lugar["web"] = url
    inicio = time.time()
    try:
        try:
            r, cuerpo = pedir(url, timeout=15)
        except (ssl.SSLError, urllib.error.URLError) as e:
            if isinstance(e, urllib.error.HTTPError) or "CERTIFICATE" not in str(e).upper():
                raise
            problemas.append("el certificado de seguridad está vencido o mal configurado")
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
                cuerpo = r.read()
        demora = time.time() - inicio
        final = r.geturl()
    except urllib.error.HTTPError as e:
        lugar["situacion"] = "web_caida"
        lugar["problemas"] = [f"la página da error {e.code}"]
        return lugar
    except Exception as e:  # noqa: BLE001 - cualquier falla de red cuenta como caída
        lugar["situacion"] = "web_caida"
        motivo = "tarda demasiado en cargar" if "timed out" in str(e) else "no carga"
        lugar["problemas"] = [f"la página {motivo}"]
        return lugar

    texto = cuerpo[:600_000].decode("utf-8", errors="ignore")
    bajo = texto.lower()

    if not final.startswith("https://"):
        problemas.append("no tiene candado de seguridad (https), el navegador la marca como «no segura»")
    if 'name="viewport"' not in bajo and "name='viewport'" not in bajo:
        problemas.append("no está adaptada al celular")
    if demora > 4:
        problemas.append(f"tarda {demora:.0f} segundos en cargar")
    if len(cuerpo) < 1500 or re.search(r"(en construcci[oó]n|coming soon|under construction|parked|domain for sale)", bajo):
        problemas.append("parece estar en construcción o vacía")

    anios = [int(a) for a in re.findall(r"(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})", bajo)]
    if anios and max(anios) <= ANIO_ACTUAL - 3:
        problemas.append(f"el pie de página dice {max(anios)}, se ve desactualizada")
    if "wa.me/" not in bajo and "api.whatsapp.com" not in bajo and "whatsapp" not in bajo:
        problemas.append("no tiene botón de WhatsApp para contactar")
    if re.search(r"<(table|font|marquee|frameset)[\s>]", bajo) and 'name="viewport"' not in bajo:
        problemas.append("usa un diseño muy antiguo")

    if not lugar["instagram"]:
        m = re.search(r"instagram\.com/([A-Za-z0-9_.]{2,30})", texto)
        if m and m.group(1).lower() not in ("p", "explore", "accounts", "reel", "stories"):
            lugar["instagram"] = f"https://instagram.com/{m.group(1)}"
    if not lugar["email"]:
        m = re.search(r"mailto:([^\"'?>\s]+@[^\"'?>\s]+)", texto)
        if m:
            lugar["email"] = m.group(1)
    if not lugar["telefono"]:
        m = re.search(r"wa\.me/(\d{8,15})", texto)
        if m:
            lugar["telefono"] = "+" + m.group(1)

    # que solo le falte el botón de WhatsApp no alcanza para ofrecerle una web nueva
    importantes = [p for p in problemas if "WhatsApp" not in p]
    lugar["situacion"] = "web_mejorable" if importantes else "web_ok"
    lugar["problemas"] = problemas
    return lugar


PUNTAJE = {"sin_web": 90, "web_caida": 85, "web_mejorable": 50, "web_ok": 10}


def puntuar(lugar):
    p = PUNTAJE[lugar["situacion"]]
    if lugar["situacion"] == "web_mejorable":
        p += min(len(lugar["problemas"]) * 8, 30)
    if lugar["telefono"]:
        p += 5
    if lugar.get("resenas"):
        p += min(lugar["resenas"] // 50, 5)  # negocio con movimiento
    lugar["puntaje"] = min(p, 100)
    return lugar


# ------------------------------------------------------------------ mensajes

def numero_whatsapp(telefono, codigo_pais):
    """Convierte un teléfono al formato de wa.me. Para Argentina agrega el 9 y saca el 15."""
    if not telefono:
        return ""
    telefono = telefono.split(";")[0]
    d = re.sub(r"\D", "", telefono)
    if not d:
        return ""
    if d.startswith("00"):
        d = d[2:]
    if codigo_pais == "54":
        if d.startswith("54"):
            d = d[2:]
        d = d.lstrip("0")
        if d.startswith("9") and len(d) == 11:
            d = d[1:]
        # 351 15 1234567 -> 351 1234567 (el 15 va después del código de área)
        for largo_area in (2, 3, 4):
            if len(d) == 12 and d[largo_area:largo_area + 2] == "15":
                d = d[:largo_area] + d[largo_area + 2:]
                break
        return "549" + d if len(d) == 10 else ""
    return d if d.startswith(codigo_pais) else codigo_pais + d.lstrip("0")


def armar_mensaje(lugar, rubro, plantillas, config):
    variantes = plantillas[lugar["situacion"]]
    # en el mensaje van solo los dos problemas más importantes; la lista completa queda en la página
    problemas = lugar["problemas"][:2]
    if len(problemas) > 1:
        problema = ", ".join(problemas[:-1]) + " y " + problemas[-1]
    else:
        problema = problemas[0] if problemas else ""
    datos = {
        "nombre": lugar["nombre"], "rubro": rubro, "problema": problema,
        "tu_nombre": config["tu_nombre"], "agencia": config["agencia"],
        "web_agencia": config["web_agencia"],
    }
    return random.choice(variantes).format(**datos)


# -------------------------------------------------------------------- salida

def generar_pagina(prospectos, rubro, ciudad, config, destino):
    plantilla = (BASE / "plantilla_revision.html").read_text(encoding="utf-8")
    datos = json.dumps({
        "rubro": rubro, "ciudad": ciudad, "fecha": date.today().isoformat(),
        "limite": config["limite_diario_recomendado"], "prospectos": prospectos,
    }, ensure_ascii=False).replace("</", "<\\/")
    pagina = plantilla.replace("__DATOS__", datos).replace("__TITULO__", html.escape(f"{rubro} en {ciudad}"))
    destino.write_text(pagina, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Busca clientes potenciales y te arma los mensajes para revisar.")
    parser.add_argument("rubro", help="por ejemplo: gimnasio, estetica, restaurante (ver rubros.json)")
    parser.add_argument("ciudad", help='por ejemplo: "Córdoba, Argentina"')
    parser.add_argument("--radio", type=int, help="radio de búsqueda en metros desde el centro de la ciudad")
    parser.add_argument("--max", type=int, help="cantidad máxima de negocios")
    parser.add_argument("--tag", action="append", help="tag de OpenStreetMap a mano, por ejemplo shop=florist")
    parser.add_argument("--incluir-web-ok", action="store_true", help="incluir también negocios con web en buen estado")
    parser.add_argument("--no-abrir", action="store_true", help="no abrir la página al terminar")
    args = parser.parse_args()

    config = cargar_json("config.json")
    rubros = {sin_acentos(k): v for k, v in cargar_json("rubros.json").items()}
    plantillas = cargar_json("plantillas.json")
    radio = args.radio or config["radio_metros"]
    maximo = args.max or config["max_resultados"]

    clave_google = os.environ.get("GOOGLE_PLACES_KEY", "").strip()
    if clave_google:
        log(f"Buscando «{args.rubro}» en {args.ciudad} con Google Places…")
        lugares = buscar_google(args.rubro, args.ciudad, clave_google, maximo)
    else:
        tags = args.tag or rubros.get(sin_acentos(args.rubro))
        if not tags:
            sys.exit(f"No conozco el rubro «{args.rubro}». Agregalo en rubros.json o usá --tag (ej: --tag shop=florist).\n"
                     f"Rubros disponibles: {', '.join(sorted(rubros))}")
        lat, lon = geocodificar(args.ciudad)
        log(f"Buscando «{args.rubro}» en OpenStreetMap (radio {radio} m)…")
        lugares = buscar_osm(tags, lat, lon, radio)

    lugares = sin_duplicados(lugares)[:maximo]
    log(f"Encontré {len(lugares)} negocios. Revisando sus webs…")

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
        revisados = list(ex.map(revisar_web, lugares))

    prospectos = []
    for l in revisados:
        if l["situacion"] == "web_ok" and not args.incluir_web_ok:
            continue
        puntuar(l)
        l["whatsapp"] = numero_whatsapp(l["telefono"], config["codigo_pais"])
        l["mensaje"] = armar_mensaje(l, args.rubro, plantillas, config)
        prospectos.append(l)
    prospectos.sort(key=lambda l: -l["puntaje"])

    carpeta = BASE / "resultados"
    carpeta.mkdir(exist_ok=True)
    nombre = f"{date.today().isoformat()}-{slug(args.rubro)}-{slug(args.ciudad)}"
    (carpeta / f"{nombre}.json").write_text(json.dumps(prospectos, ensure_ascii=False, indent=2), encoding="utf-8")
    destino = carpeta / f"{nombre}.html"
    generar_pagina(prospectos, args.rubro, args.ciudad, config, destino)

    conteo = {s: sum(1 for p in prospectos if p["situacion"] == s) for s in PUNTAJE}
    log(f"\nListo: {len(prospectos)} prospectos "
        f"({conteo['sin_web']} sin web, {conteo['web_caida']} con la web caída, {conteo['web_mejorable']} con web mejorable).")
    log(f"Abrí esta página para revisarlos: {destino}")
    if not args.no_abrir:
        webbrowser.open(destino.as_uri())


if __name__ == "__main__":
    main()
