#!/usr/bin/env python3
"""Fictitious double-cell box culvert (dalot) in IFC4 with GIN2CO demo properties.
All data are invented for demonstration purposes."""
import math, sys
import ifcopenshell
import ifcopenshell.api as api
import ifcopenshell.guid

OUT = sys.argv[1]
m = api.run("project.create_file", version="IFC4")
proj = api.run("root.create_entity", m, ifc_class="IfcProject", name="GIN²CO — Démonstration (ouvrage fictif)")
units = [api.run("unit.add_si_unit", m, unit_type=t) for t in ("LENGTHUNIT", "AREAUNIT", "VOLUMEUNIT", "PLANEANGLEUNIT")]
api.run("unit.assign_unit", m, units=units)
ctx = api.run("context.add_context", m, context_type="Model")
body = api.run("context.add_context", m, context_type="Model", context_identifier="Body",
               target_view="MODEL_VIEW", parent=ctx)
site = api.run("root.create_entity", m, ifc_class="IfcSite", name="Site fictif — démonstration")
api.run("aggregate.assign_object", m, relating_object=proj, products=[site])

# ---------- styles
def style(name, rgb):
    s = api.run("style.add_style", m, name=name)
    api.run("style.add_surface_style", m, style=s, ifc_class="IfcSurfaceStyleShading",
            attributes={"SurfaceColour": {"Name": None, "Red": rgb[0], "Green": rgb[1], "Blue": rgb[2]}})
    return s
ST = {
    "beton": style("Béton armé", (0.70, 0.71, 0.72)),
    "enroch": style("Enrochement", (0.55, 0.50, 0.44)),
    "enrobe": style("Enrobé bitumineux", (0.22, 0.23, 0.25)),
    "acier": style("Acier galvanisé", (0.80, 0.82, 0.85)),
    "remblai": style("Grave latéritique", (0.66, 0.42, 0.28)),
}

def pt(*c): return m.createIfcCartesianPoint([float(v) for v in c])
def d3(*c): return m.createIfcDirection([float(v) for v in c])

def box(cls, name, code, x, y, z, dx, dy, dz, rot_deg=0.0, st="beton", ptype=None, objtype=None):
    """Box with origin corner at (x,y,z), size dx,dy,dz, rotated about local origin by rot_deg (Z)."""
    el = api.run("root.create_entity", m, ifc_class=cls, name=name, predefined_type=ptype)
    el.Tag = code
    if objtype:
        el.ObjectType = objtype
    a = math.radians(rot_deg)
    place = m.createIfcLocalPlacement(None, m.createIfcAxis2Placement3D(
        pt(x, y, z), d3(0, 0, 1), d3(math.cos(a), math.sin(a), 0)))
    el.ObjectPlacement = place
    prof = m.createIfcRectangleProfileDef("AREA", None,
        m.createIfcAxis2Placement2D(pt(dx / 2, dy / 2), None), float(dx), float(dy))
    solid = m.createIfcExtrudedAreaSolid(prof, m.createIfcAxis2Placement3D(pt(0, 0, 0), None, None),
                                         d3(0, 0, 1), float(dz))
    rep = m.createIfcShapeRepresentation(body, "Body", "SweptSolid", [solid])
    el.Representation = m.createIfcProductDefinitionShape(None, None, [rep])
    api.run("style.assign_representation_styles", m, shape_representation=rep, styles=[ST[st]])
    api.run("spatial.assign_container", m, relating_structure=site, products=[el])
    return el, dx * dy * dz

def props(el, vol, length, p):
    ps = api.run("pset.add_pset", m, product=el, name="Pset_GIN2CO_Patrimoine")
    api.run("pset.edit_pset", m, pset=ps, properties=p)
    q = api.run("pset.add_qto", m, product=el, name="Qto_GIN2CO_Quantites")
    api.run("pset.edit_qto", m, qto=q, properties={"Volume": round(vol, 2), "Longueur": round(length, 2)})

L = 10.0          # culvert length (along flow, Y)
W = 4.70          # outer width (X)
H = 1.50          # clear height
t = 0.25          # slab / outer wall thickness
INSP = "2026-09-15"

def base(fam, mat, year, etat, note, desordre, prio, cout, action):
    return {"Famille": fam, "Materiau": mat, "AnneeMiseEnService": year,
            "DateDerniereInspection": INSP, "Etat": {1: "Bon", 2: "Moyen", 3: "Dégradé", 4: "Critique"}[note], "NoteEtat": note,
            "Desordre": desordre, "PrioriteEntretien": prio,
            "CoutEstimeFCFA": cout, "ActionRecommandee": action}

items = []
# Radier
e, v = box("IfcSlab", "Radier", "DLT01-RAD", 0, 0, -t, W, L, t, ptype="BASESLAB")
props(e, v, L, base("Structure", "Béton armé", 2009, "Moyen", 2,
      "Ensablement d'environ 30 % de la section en cellule droite", "P2", 1_800_000,
      "Curage des deux cellules avant la saison des pluies"))
# Piédroits
for i, (x, th, nm, etat, note, des, prio, cout, act) in enumerate([
    (0.00, t,    "Piédroit gauche",  "Bon",   1, "Aucun désordre significatif", "P3", 0, "Surveillance courante"),
    (2.25, 0.20, "Piédroit central", "Moyen", 2, "Épaufrures en tête, armatures non apparentes", "P2", 650_000, "Ragréage localisé au mortier de réparation"),
    (4.45, t,    "Piédroit droit",   "Bon",   1, "Aucun désordre significatif", "P3", 0, "Surveillance courante"),
]):
    e, v = box("IfcWall", nm, f"DLT01-PD{i+1}", x, 0, 0, th, L, H, ptype="SOLIDWALL")
    props(e, v, L, base("Structure", "Béton armé", 2009, etat, note, des, prio, cout, act))
# Dalle supérieure
e, v = box("IfcSlab", "Dalle supérieure", "DLT01-DAL", 0, 0, H, W, L, t, ptype="FLOOR")
props(e, v, L, base("Structure", "Béton armé", 2009, "Moyen", 2,
      "Fissures longitudinales en intrados, ouverture inférieure à 0,3 mm", "P2", 1_200_000,
      "Injection des fissures et suivi de leur ouverture"))
# Murs en aile (30° d'ouverture)
WL = 3.0
wings = [
    ("Mur en aile amont gauche", "DLT01-MA1", 0.0, 0.0, 240, "Bon", 1, "Aucun désordre significatif", "P3", 0, "Surveillance courante"),
    ("Mur en aile amont droit",  "DLT01-MA2", W,   0.0, 300, "Bon", 1, "Aucun désordre significatif", "P3", 0, "Surveillance courante"),
    ("Mur en aile aval gauche",  "DLT01-MA3", 0.0, L,   120, "Critique", 4, "Affouillement en pied, basculement amorcé de 4 cm", "P1", 4_500_000, "Reprise en sous-œuvre et protection du pied par enrochement"),
    ("Mur en aile aval droit",   "DLT01-MA4", W,   L,   60, "Moyen", 3, "Fissure verticale traversante au droit du joint", "P2", 900_000, "Calfeutrement du joint et injection"),
]
for nm, code, x, y, ang, etat, note, des, prio, cout, act in wings:
    e, v = box("IfcWall", nm, code, x, y, -t, WL, t, H + 2 * t, rot_deg=ang, ptype="SOLIDWALL")
    props(e, v, WL, base("Structure", "Béton armé", 2009, etat, note, des, prio, cout, act))
# Perrés
e, v = box("IfcBuildingElementProxy", "Perré amont", "DLT01-PE1", -1.0, -3.0, -0.35, W + 2, 3.0, 0.35,
           st="enroch", objtype="Perré maçonné")
props(e, v, 3.0, base("Protection hydraulique", "Enrochement", 2009, "Bon", 1,
      "Quelques blocs déplacés, sans conséquence", "P3", 150_000, "Repositionnement des blocs"))
e, v = box("IfcBuildingElementProxy", "Perré aval", "DLT01-PE2", -1.0, L, -0.35, W + 2, 3.0, 0.35,
           st="enroch", objtype="Perré maçonné")
props(e, v, 3.0, base("Protection hydraulique", "Enrochement", 2009, "Critique", 4,
      "Perré emporté sur 40 % de la surface, fosse d'érosion en aval", "P1", 3_200_000,
      "Reconstruction du perré et création d'un bassin de dissipation"))
# Chaussée
e, v = box("IfcSlab", "Chaussée — couche de roulement", "DLT01-CH1", -8.0, 1.0, H + t + 0.30, W + 16, 8.0, 0.08,
           st="enrobe", ptype="USERDEFINED", objtype="Chaussée")
props(e, v, W + 16, base("Chaussée", "Enrobé bitumineux", 2018, "Moyen", 3,
      "Nids-de-poule et affaissement au droit de l'ouvrage", "P2", 2_100_000,
      "Purge, reprise du corps de chaussée et réfection de la couche de roulement"))
e, v = box("IfcBuildingElementProxy", "Remblai technique", "DLT01-RMB", -8.0, 1.0, H + t, W + 16, 8.0, 0.30,
           st="remblai", objtype="Remblai")
# add the two embankment shoulders (ground to road level) on both sides of the culvert
rep = e.Representation.Representations[0]
for x0, dx in ((-8.0, 8.0), (W, 8.0)):
    prof = m.createIfcRectangleProfileDef("AREA", None,
        m.createIfcAxis2Placement2D(pt(x0 + 8.0 + dx / 2, 4.0), None), dx, 8.0)
    rep.Items = list(rep.Items) + [m.createIfcExtrudedAreaSolid(prof,
        m.createIfcAxis2Placement3D(pt(0, 0, -(H + t)), None, None), d3(0, 0, 1), H + t)]
v += 2 * 8.0 * 8.0 * (H + t)
props(e, v, W + 16, base("Chaussée", "Grave latéritique", 2009, "Bon", 1,
      "Aucun désordre significatif", "P3", 0, "Surveillance courante"))
# Garde-corps
for i, y in enumerate([1.0, 8.85]):
    e, v = box("IfcRailing", f"Garde-corps {'amont' if i == 0 else 'aval'}", f"DLT01-GC{i+1}",
               -1.0, y, H + t + 0.38, W + 2, 0.15, 0.9, st="acier", ptype="GUARDRAIL")
    etat, note, des, prio, cout, act = (("Bon", 1, "Aucun désordre significatif", "P3", 0, "Surveillance courante")
        if i == 0 else ("Critique", 4, "Lisse arrachée sur 2 m suite à un choc de véhicule", "P1", 750_000,
                         "Remplacement de la lisse et des montants"))
    props(e, v, W + 2, base("Équipement de sécurité", "Acier galvanisé", 2015, etat, note, des, prio, cout, act))

m.write(OUT)
print("written", OUT, len(m.by_type("IfcProduct")), "products")
