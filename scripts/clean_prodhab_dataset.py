"""
Pipeline de limpieza para indice-resoluciones-prodhab.json.
Lee public/indice-resoluciones-prodhab.json, aplica las reglas de limpieza
y escribe:
  - public/indice-resoluciones-prodhab.json   (sobrescrito, dataset limpio)
  - scripts/reporte_de_cambios.json            (trazabilidad)
Uso: python scripts/clean_prodhab_dataset.py
"""
import json
import re
import collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "indice-resoluciones-prodhab.json"

CITA_RE = re.compile(r"(?i)resoluci[oó]n\s*(?:n[°ºo.]?\s*)?(\d+\s*-\s*\d{2,4})")
NOMBRE_RE = re.compile(r"\(?\s*[Nn][Oo][Mm][Bb][Rr][Ee]\s*0*(\d+)\s*\)?")

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "setiembre": 9, "septiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}
FECHA_HEADER_RE = re.compile(
    r"a las\s+(\d{1,2}:\d{2}(?::\d{2})?)\s+(?:horas\s+)?del\s+(\d{1,2})\s+de\s+(\w+)\s+de(?:l)?\s+(\d{4})",
    re.IGNORECASE,
)
LUGAR_RE = re.compile(r"(San Jos[eé]|[A-Z][a-záéíóúñ]+),?\s+a las\s+\d{1,2}:\d{2}", re.IGNORECASE)

_UP = "A-ZÁÉÍÓÚÑÜ"
_LO = "a-zñáéíóúü"
_TITULO = r"(?:Licda?|Lic|M[aá]ster|Dr|M\.Sc|Ing)\.?\s*"
_NOMBRE = rf"([{_UP}][{_LO}]+(?:\s+[{_UP}][{_LO}]+){{1,4}})"
FIRMANTE_RE = re.compile(
    rf"(?:{_TITULO})?{_NOMBRE}(?=\s+(?:Agencia|Departamento|PRODHAB|www|Direcci[oó]n))",
    re.IGNORECASE,
)
ELABORADO_RE = re.compile(rf"Elaborad[oa]\s*(?:por)?\.?:?\s*(?:{_TITULO})?{_NOMBRE}", re.IGNORECASE)


def normalize_cita(raw: str) -> str:
    return re.sub(r"\s*-\s*", "-", raw.strip())


def normalize_nombres(text: str) -> tuple[str, int]:
    count = 0

    def repl(m):
        nonlocal count
        canon = f"NOMBRE {int(m.group(1))}"
        if m.group(0) != canon:
            count += 1
        return canon

    return NOMBRE_RE.sub(repl, text), count


def infer_tipo_procedimiento(expediente: str):
    if not expediente:
        return None
    suffix = expediente.rsplit("-", 1)[-1].upper()
    if suffix in {"DEN", "DE", "REC"}:
        return suffix
    return None


def infer_fecha_lugar_hora(texto: str):
    fecha = lugar = hora = None
    m = FECHA_HEADER_RE.search(texto)
    if m:
        hora = m.group(1)[:5]
        dia, mes_nombre, anio = m.group(2), m.group(3).lower(), m.group(4)
        mes = MESES.get(mes_nombre)
        if mes:
            fecha = f"{anio}-{mes:02d}-{int(dia):02d}"
    lm = LUGAR_RE.search(texto)
    if lm:
        lugar = lm.group(1)
    return fecha, lugar, hora


def infer_recurso(por_tanto: str):
    pt = (por_tanto or "").lower()
    if "recurso de reconsideraci" in pt:
        return "reconsideracion"
    if "recurso de revocatoria" in pt:
        return "revocatoria"
    return "ninguno"


def infer_firmante_elaborado(texto_completo: str):
    tail = (texto_completo or "")[-900:]
    firmante = elaborado_por = None
    m = FIRMANTE_RE.search(tail)
    if m:
        firmante = m.group(1).strip()
    m2 = ELABORADO_RE.search(tail)
    if m2:
        elaborado_por = m2.group(1).strip()
    return firmante, elaborado_por


def main():
    data = json.loads(SRC.read_text(encoding="utf-8"))
    recs = data["datos"]

    report = {
        "total_citas_agregadas": 0,
        "duplicados_resueltos": [],
        "anomimizacion_corregida": 0,
        "nulos_imputados": collections.Counter(),
        "errores_irresolubles": [],
    }

    # --- 2. Duplicados: agrupar por numero de resolucion ---
    by_res = collections.defaultdict(list)
    for r in recs:
        by_res[r["metadatos"]["resolucion"]].append(r)

    renames = {}  # id -> nuevo numero de resolucion
    to_drop = set()

    for numero, group in by_res.items():
        if len(group) < 2:
            continue
        a, b = group[0], group[1]
        exact_dup = (
            a["metadatos"]["expediente"] == b["metadatos"]["expediente"]
            and a["metadatos"]["fecha"] == b["metadatos"]["fecha"]
            and a["texto"] == b["texto"]
        )
        if exact_dup:
            to_drop.add(b["id"])
            report["duplicados_resueltos"].append(
                {"tipo": "exacto_eliminado", "numero": numero, "id_eliminado": b["id"]}
            )
        else:
            suffixes = "ABCDEFGH"
            for i, rec in enumerate(group):
                nuevo = f"{numero}-{suffixes[i]}"
                renames[rec["id"]] = nuevo
                rec["metadatos"]["resolucion"] = nuevo
            report["duplicados_resueltos"].append(
                {"tipo": "colision_renombrada", "numero_original": numero,
                 "ids": [(r["id"], renames[r["id"]]) for r in group]}
            )

    if to_drop:
        recs = [r for r in recs if r["id"] not in to_drop]
        data["datos"] = recs

    # mapa numero_original -> [numeros_nuevos] para actualizar citas que apuntaban a colisiones
    cita_rename_map = {}
    for numero, group in by_res.items():
        if len(group) < 2:
            continue
        if group[0]["id"] in renames:
            cita_rename_map[numero] = [renames[r["id"]] for r in group]

    # --- 1. resoluciones_citadas: extraccion + normalizacion + filtrado + rename ---
    for r in data["datos"]:
        m = r["metadatos"]
        texto_scan = r.get("texto", "")
        encontradas = {normalize_cita(x) for x in CITA_RE.findall(texto_scan)}

        propio_norm = re.sub(r"-[A-H]$", "", m["resolucion"])
        encontradas.discard(propio_norm)
        encontradas.discard(m["resolucion"])

        # expandir citas que ahora corresponden a resoluciones renombradas por colision
        expandido = set()
        for c in encontradas:
            if c in cita_rename_map:
                expandido.update(cita_rename_map[c])
            else:
                expandido.add(c)
        encontradas = expandido

        existentes = set(m.get("resoluciones_citadas") or [])
        existentes_norm = {normalize_cita(x) for x in existentes}
        nuevas = encontradas - existentes_norm
        if nuevas:
            report["total_citas_agregadas"] += len(nuevas)
        m["resoluciones_citadas"] = sorted(existentes_norm | encontradas)

    # --- 3. Anonimizacion ---
    for r in data["datos"]:
        m = r["metadatos"]
        for campo in ("denunciante", "denunciado"):
            if m.get(campo):
                nuevo, n = normalize_nombres(m[campo])
                if n:
                    m[campo] = nuevo
                    report["anomimizacion_corregida"] += n
        for sec in ("resultando", "considerando", "por_tanto"):
            if r["secciones"].get(sec):
                nuevo, n = normalize_nombres(r["secciones"][sec])
                if n:
                    r["secciones"][sec] = nuevo
                    report["anomimizacion_corregida"] += n
        if r.get("texto"):
            nuevo, n = normalize_nombres(r["texto"])
            if n:
                r["texto"] = nuevo
                report["anomimizacion_corregida"] += n

    # --- 4. Nulos ---
    for r in data["datos"]:
        m = r["metadatos"]
        texto = r.get("texto", "")
        por_tanto = r["secciones"].get("por_tanto", "")

        if not m.get("tipo_procedimiento"):
            val = infer_tipo_procedimiento(m.get("expediente", ""))
            m["tipo_procedimiento"] = val if val else "No especificado"
            report["nulos_imputados"]["tipo_procedimiento"] += 1
            if not val:
                report["errores_irresolubles"].append({"id": r["id"], "campo": "tipo_procedimiento"})

        need_fecha = not m.get("fecha")
        need_lugar = not m.get("lugar")
        need_hora = not m.get("hora")
        if need_fecha or need_lugar or need_hora:
            fecha, lugar, hora = infer_fecha_lugar_hora(texto)
            if need_fecha:
                if fecha:
                    m["fecha"] = fecha
                    report["nulos_imputados"]["fecha"] += 1
                else:
                    m["fecha"] = "Fecha no especificada"
                    report["errores_irresolubles"].append({"id": r["id"], "campo": "fecha"})
            if need_lugar:
                m["lugar"] = lugar if lugar else "No especificado"
                report["nulos_imputados"]["lugar"] += 1
            if need_hora:
                m["hora"] = hora if hora else "No especificado"
                report["nulos_imputados"]["hora"] += 1

        if not m.get("recurso_disponible"):
            m["recurso_disponible"] = infer_recurso(por_tanto)
            report["nulos_imputados"]["recurso_disponible"] += 1

        if not m.get("firmante") or not m.get("elaborado_por"):
            firmante, elaborado_por = infer_firmante_elaborado(texto)
            if not m.get("firmante"):
                m["firmante"] = firmante if firmante else "No especificado"
                report["nulos_imputados"]["firmante"] += 1
                if not firmante:
                    report["errores_irresolubles"].append({"id": r["id"], "campo": "firmante"})
            if not m.get("elaborado_por"):
                m["elaborado_por"] = elaborado_por if elaborado_por else "No especificado"
                report["nulos_imputados"]["elaborado_por"] += 1
                if not elaborado_por and re.search(r"[Ee]laborad[oa]\s*(?:por)?\.?:?", texto[-900:]):
                    report["errores_irresolubles"].append({"id": r["id"], "campo": "elaborado_por"})

        for campo in ("denunciante", "denunciado"):
            if not m.get(campo):
                m[campo] = "No especificado"
                report["nulos_imputados"][campo] += 1

    # --- 5. Validacion estructural ---
    for r in data["datos"]:
        m = r["metadatos"]
        anio_from_res = re.search(r"-(\d{4})(?:-[A-H])?$", m["resolucion"])
        if anio_from_res and m.get("anio") and int(anio_from_res.group(1)) != m["anio"]:
            report["errores_irresolubles"].append(
                {"id": r["id"], "campo": "anio", "detalle": f"resolucion={m['resolucion']} anio={m['anio']}"}
            )
        if m.get("archivo_origen") and not m["archivo_origen"].startswith("http"):
            report["errores_irresolubles"].append({"id": r["id"], "campo": "archivo_origen"})
        claves_esperadas = {"id", "titulo", "metadatos", "secciones", "texto", "vector"}
        if set(r.keys()) != claves_esperadas:
            report["errores_irresolubles"].append({"id": r["id"], "campo": "estructura"})

    data["metadatos"]["total_registros"] = len(data["datos"])

    report["nulos_imputados"] = dict(report["nulos_imputados"])

    SRC.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (ROOT / "scripts" / "reporte_de_cambios.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("OK. Registros:", len(data["datos"]))
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
