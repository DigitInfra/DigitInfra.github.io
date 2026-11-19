#!/usr/bin/env python3
"""Fictitious IFC4 models for the Guinea profile of the GIN²CO demo (roads, rural tracks, bridges, culverts, drifts).
Same rules as gen_models.py: worst element condition = asset condition; element costs (GNF) add up to the asset cost."""
import json, os, sys
import gen_models as G
from gen_models import B, dalot
from ifc_lib import Model

G.DES.update({
    "laterite": (["Tôle ondulée et légère perte de profil"], ["Ravinement, nids-de-poule, perte de matériau"],
                 ["Bourbiers et ornières profondes, plateforme impraticable en saison des pluies"],
                 ["Reprofilage léger", "Reprofilage lourd et rechargement en latérite", "Rechargement complet et traitement des points critiques"]),
    "terre": (["Profil irrégulier"], ["Ornières et zones d'eau stagnante"], ["Plateforme coupée par l'eau, passage impossible aux camions"],
              ["Reprofilage", "Reprofilage et apport de matériau", "Reconstruction de la plateforme et des fossés"]),
    "fosse": (["Dépôts ponctuels"], ["Fossé comblé sur 30 à 50 %"], ["Fossé effacé, l'eau ruisselle sur la plateforme"],
              ["Curage manuel", "Curage mécanisé et recalibrage", "Reprofilage et protection des fossés"]),
    "signal": (["Panneau délavé"], ["Panneau tordu ou illisible"], ["Panneau ou borne absents"],
               ["Nettoyage", "Redressement ou remplacement", "Pose d'une signalisation neuve"]),
    "armco": (["Corrosion superficielle en radier de buse"], ["Corrosion perforante, déformation de la section"],
              ["Ovalisation et effondrement partiel de la buse"],
              ["Protection anticorrosion du radier", "Chemisage béton du radier de buse", "Remplacement de la buse"]),
    "appui": (["Encrassement des appareils d'appui"], ["Déformation des appareils d'appui, joint dégradé"], ["Appareil d'appui écrasé ou déplacé"],
              ["Nettoyage", "Remplacement du joint et calage", "Vérinage et remplacement des appareils d'appui"]),
})
G.UNIT.update({"laterite": 0.8, "terre": 0.6, "fosse": 0.4, "signal": 0.15, "armco": 0.9, "appui": 0.7})
G.FAM.update({"laterite": "Chaussée", "terre": "Chaussée", "fosse": "Assainissement routier", "signal": "Équipement de sécurité",
              "armco": "Hydraulique", "appui": "Structure"})
G.MAT.update({"laterite": "Grave latéritique", "terre": "Terre naturelle compactée", "fosse": "Terre et maçonnerie",
              "signal": "Acier galvanisé", "armco": "Acier ondulé galvanisé", "appui": "Élastomère fretté"})


def access(M, x0, x1, w, z, surface="laterite", y0=0.0):
    """Approach embankment + running surface along X between x0 and x1."""
    M.element("IfcBuildingElementProxy", "Remblai d'accès", "RMB", [B(x0, y0, -0.6, x1 - x0, w, z + 0.6)], st="remblai",
              objtype="Remblai", kind="remblai", length=x1 - x0)


def pont(M):
    S, Wd, zs = 16.0, 9.0, 4.0           # span, deck width, soffit level
    for k, x in enumerate((-1.2, 2 * S)):
        M.element("IfcFooting", f"Semelle de culée {'C0' if k == 0 else 'C1'}", f"SC{k}", [B(x - 0.6, -0.5, -2.2, 2.4, Wd + 1.0, 1.2)], ptype="PAD_FOOTING")
        M.element("IfcWall", f"Culée {'C0' if k == 0 else 'C1'}", f"CU{k}", [B(x, 0, -1.0, 1.2, Wd, zs + 1.1)], ptype="SOLIDWALL")
    M.element("IfcFooting", "Semelle de pile P1", "SP1", [B(S - 1.5, 1.0, -2.6, 3.0, Wd - 2.0, 1.2)], ptype="PAD_FOOTING")
    M.element("IfcColumn", "Pile P1 — fûts", "PI1", [("cyl", S, 2.5, -1.4, 0.6, zs - 1.0 + 1.4), ("cyl", S, Wd - 2.5, -1.4, 0.6, zs - 1.0 + 1.4)],
              ptype="COLUMN", length=zs + 0.4)
    M.element("IfcBeam", "Pile P1 — chevêtre", "CH1", [B(S - 0.8, 0.5, zs - 1.0, 1.6, Wd - 1.0, 1.0)], ptype="BEAM")
    for sp in range(2):
        x0 = sp * S
        M.element("IfcBeam", f"Poutres de la travée {sp + 1}", f"PT{sp + 1}", [B(x0, y, zs, S, 0.45, 1.1) for y in (1.0, 3.1, 5.2, 7.3)],
                  ptype="BEAM", length=S)
        M.element("IfcSlab", f"Hourdis de la travée {sp + 1}", f"HO{sp + 1}", [B(x0, 0, zs + 1.1, S, Wd, 0.22)], ptype="FLOOR", length=S)
    M.element("IfcBuildingElementProxy", "Appareils d'appui", "AA1", [B(x, y, zs - 0.08, 0.4, 0.45, 0.08) for x in (0.1, S - 0.5, S + 0.1, 2 * S - 0.5)
                                                                    for y in (1.0, 3.1, 5.2, 7.3)], st="equip", objtype="Appareil d'appui", kind="appui")
    top = zs + 1.32
    M.element("IfcSlab", "Chaussée sur ouvrage — couche de roulement", "CHS", [B(-1.2, 1.5, top, 2 * S + 2.4, Wd - 3.0, 0.08)], st="enrobe",
              ptype="USERDEFINED", objtype="Chaussée", kind="chaussee", length=2 * S)
    for k, y in enumerate((0.0, Wd - 1.5)):
        M.element("IfcSlab", f"Trottoir {'amont' if k == 0 else 'aval'}", f"TR{k + 1}", [B(-1.2, y, top, 2 * S + 2.4, 1.5, 0.25)], ptype="USERDEFINED",
                  objtype="Trottoir", kind="beton", length=2 * S)
        M.element("IfcRailing", f"Garde-corps {'amont' if k == 0 else 'aval'}", f"GC{k + 1}", [B(-1.2, y if k == 0 else Wd - 0.12, top + 0.25, 2 * S + 2.4, 0.12, 1.0)],
                  st="acier", ptype="GUARDRAIL", kind="metal", length=2 * S)
    M.element("IfcBuildingElementProxy", "Joints de chaussée", "JC1", [B(-0.05, 0, top, 0.1, Wd, 0.1), B(2 * S - 0.05, 0, top, 0.1, Wd, 0.1)],
              st="acier", objtype="Joint de chaussée", kind="appui")
    for k, x in enumerate((-6.0, 2 * S + 1.2)):
        M.element("IfcBuildingElementProxy", f"Enrochements de protection {'C0' if k == 0 else 'C1'}", f"EN{k + 1}", [B(x, -3.0, -1.6, 4.8, Wd + 6.0, 1.2)],
                  st="enroch", objtype="Enrochement", kind="hydro")
    M.element("IfcBuildingElementProxy", "Enrochements autour de la pile P1", "EN3", [B(S - 3.0, -1.0, -1.8, 6.0, Wd + 2.0, 0.8)], st="enroch",
              objtype="Enrochement", kind="hydro")
    access(M, -16.0, -1.2, Wd, top)
    access(M, 2 * S + 1.2, 2 * S + 16.0, Wd, top)
    M.element("IfcSlab", "Chaussée d'accès — couche de roulement", "CHA", [B(-16.0, 1.5, top, 14.8, Wd - 3.0, 0.08), B(2 * S + 1.2, 1.5, top, 14.8, Wd - 3.0, 0.08)],
              st="enrobe", ptype="USERDEFINED", objtype="Chaussée", kind="chaussee", length=30)


def buse(M):
    L, r = 12.0, 0.75
    M.element("IfcPipeSegment", "Buse métallique Ø1500", "BU1", [("pipe", 0, 0, r + 0.05, r, 0.012, L)], st="armco", ptype="CULVERT", kind="armco", length=L)
    for k, (nm, y) in enumerate((("Tête amont", -0.35), ("Tête aval", L))):
        M.element("IfcWall", nm, f"TE{k + 1}", [B(-2.2, y, -0.3, 4.4, 0.35, 2.1)], st="macon", ptype="SOLIDWALL", kind="macon")
        M.element("IfcSlab", f"Radier {'d’entrée' if k == 0 else 'de sortie'}", f"RA{k + 1}", [B(-2.2, y - 2.2 if k == 0 else y + 0.35, -0.35, 4.4, 2.2, 0.25)],
                  ptype="BASESLAB", kind="ensablement")
    M.element("IfcBuildingElementProxy", "Perré aval", "PE1", [B(-3.0, L + 2.6, -0.4, 6.0, 3.0, 0.35)], st="enroch", objtype="Perré", kind="hydro")
    access(M, -12.0, 12.0, L - 2.0, 2.0, y0=1.0)
    M.element("IfcSlab", "Plateforme en latérite", "PL1", [B(-12.0, 2.0, 2.0, 24.0, L - 4.0, 0.2)], st="laterite", ptype="USERDEFINED",
              objtype="Chaussée", kind="laterite", length=24)


def radier(M):
    Lx, Ly = 30.0, 6.0
    M.element("IfcSlab", "Dalle du radier submersible", "RS1", [B(0, 0, -0.4, Lx, Ly, 0.4)], ptype="BASESLAB", kind="beton", length=Lx)
    for k, y in enumerate((-0.3, Ly)):
        M.element("IfcWall", f"Parafouille {'amont' if k == 0 else 'aval'}", f"PF{k + 1}", [B(0, y, -1.8, Lx, 0.3, 1.4)], ptype="SOLIDWALL", kind="hydro", length=Lx)
    M.element("IfcPipeSegment", "Buses de décharge Ø800 (étiage)", "BD1", [("pipe", x, 0, -0.85, 0.4, 0.08, Ly) for x in (9.0, 15.0, 21.0)],
              st="beton", ptype="CULVERT", kind="conduite", length=Ly)
    M.element("IfcBuildingElementProxy", "Enrochements aval anti-affouillement", "EN1", [B(-2, Ly + 0.3, -1.2, Lx + 4, 4.0, 0.8)], st="enroch",
              objtype="Enrochement", kind="hydro")
    for k, (x0, x1) in enumerate(((-18.0, 0.0), (Lx, Lx + 18.0))):
        M.element("IfcSlab", f"Rampe d'accès {'rive gauche' if k == 0 else 'rive droite'}", f"RP{k + 1}", [B(x0, 0.5, -0.2, x1 - x0, Ly - 1.0, 0.25)],
                  st="laterite", ptype="USERDEFINED", objtype="Chaussée", kind="laterite", length=18)
    M.element("IfcBuildingElementProxy", "Balises de crue et échelles limnimétriques", "BA1",
              [("cyl", x, y, 0, 0.08, 1.6) for x in (0.3, 7.5, 15, 22.5, Lx - 0.3) for y in (0.2, Ly - 0.2)], st="signal", objtype="Balise", kind="signal", length=1.6)


def chaussee(M, remblai=False):
    L, seg = 60.0, 20.0
    z = 2.6 if remblai else 0.0
    yc = 0.0
    if remblai:
        M.element("IfcBuildingElementProxy", "Remblai sur zone basse", "RMB",
                  [B(0, -6.5, -0.6, L, 18.2, 1.2), B(0, -5.0, 0.6, L, 15.2, 1.0), B(0, -3.5, 1.6, L, 12.2, 1.0)], st="remblai",
                  objtype="Remblai", kind="remblai", length=L)
        for k, (y0, ang) in enumerate(((-7.2, 0), (11.2, 0))):
            M.element("IfcBuildingElementProxy", f"Perré de talus {'amont' if k == 0 else 'aval'}", f"PE{k + 1}", [B(0, y0, -0.6, L, 0.7, 2.4)],
                      st="enroch", objtype="Perré", kind="hydro", length=L)
        for k, x in enumerate((15.0, 42.0)):
            M.element("IfcPipeSegment", f"Buse de décharge Ø1000 n°{k + 1}", f"BD{k + 1}", [("pipe", x, -7.0, 0.55, 0.5, 0.1, 18.6)],
                      st="beton", ptype="CULVERT", kind="conduite", length=18.6)
    for k in range(3):
        x = k * seg
        M.element("IfcSlab", f"Couche de roulement — tronçon {k + 1} (PK {k * 20}–{k * 20 + 20} m)", f"CR{k + 1}", [B(x, yc, z + 0.25, seg, 7.2, 0.06)],
                  st="enrobe", ptype="USERDEFINED", objtype="Couche de roulement", kind="chaussee", length=seg)
    M.element("IfcSlab", "Couche de base en grave latéritique", "CB1", [B(0, yc - 0.3, z, L, 7.8, 0.25)], st="laterite", ptype="USERDEFINED",
              objtype="Couche de base", kind="laterite", length=L)
    for k, y in enumerate((yc - 1.8, yc + 7.2)):
        M.element("IfcSlab", f"Accotement {'gauche' if k == 0 else 'droit'}", f"AC{k + 1}", [B(0, y, z, L, 1.8, 0.27)], st="laterite", ptype="USERDEFINED",
                  objtype="Accotement", kind="laterite", length=L)
    if not remblai:
        for k, y in enumerate((yc - 3.0, yc + 9.0)):
            M.element("IfcBuildingElementProxy", f"Fossé bétonné {'gauche' if k == 0 else 'droit'}", f"FO{k + 1}",
                      [B(0, y, -0.8, L, 1.2, 0.15), B(0, y, -0.8, L, 0.12, 0.8), B(0, y + 1.08, -0.8, L, 0.12, 0.8)], st="beton",
                      objtype="Fossé", kind="fosse", length=L)
    M.element("IfcRailing", "Glissière de sécurité", "GL1", [B(0, yc + 8.8, z + 0.27, L, 0.1, 0.75)], st="acier", ptype="GUARDRAIL", kind="metal", length=L)
    M.element("IfcBuildingElementProxy", "Panneaux de signalisation", "SI1", [("cyl", 5, yc - 1.4, z + 0.27, 0.05, 2.2), B(4.6, yc - 1.45, z + 2.0, 0.8, 0.05, 0.8),
                                                                            ("cyl", 55, yc + 8.4, z + 0.27, 0.05, 2.2), B(54.6, yc + 8.35, z + 2.0, 0.8, 0.05, 0.8)],
              st="signal", objtype="Signalisation verticale", kind="signal", length=2.2)


def piste(M, terre=False):
    L, seg, w = 60.0, 20.0, 6.0
    st, kind, lab = ("terre", "terre", "Plateforme en terre naturelle") if terre else ("laterite", "laterite", "Plateforme en latérite")
    for k in range(3):
        M.element("IfcSlab", f"{lab} — tronçon {k + 1} (PK {k * 20}–{k * 20 + 20} m)", f"PL{k + 1}", [B(k * seg, 0, 0, seg, w, 0.25)],
                  st=st, ptype="USERDEFINED", objtype="Chaussée", kind=kind, length=seg)
    for k, y in enumerate((-1.4, w + 0.2)):
        M.element("IfcBuildingElementProxy", f"Fossé en terre {'gauche' if k == 0 else 'droit'}", f"FO{k + 1}",
                  [B(0, y, -0.6, L if not terre else 28.0, 1.2, 0.12)], st="terre", objtype="Fossé", kind="fosse", length=L)
    xb = 33.0
    M.element("IfcPipeSegment", f"Buse de traversée Ø{600 if terre else 800}", "BU1", [("pipe", xb, -2.0, -0.2, 0.3 if terre else 0.4, 0.07, w + 4.0)],
              st="beton", ptype="CULVERT", kind="conduite", length=w + 4.0)
    for k, y in enumerate((-2.3, w + 2.0)):
        M.element("IfcWall", f"Tête de buse {'amont' if k == 0 else 'aval'}", f"TB{k + 1}", [B(xb - 1.2, y, -0.7, 2.4, 0.3, 1.0)], st="macon", ptype="SOLIDWALL",
                  kind="macon")
    if terre:
        M.element("IfcBuildingElementProxy", "Point critique — bourbier", "PC1", [B(44.0, 0.3, -0.05, 9.0, w - 0.6, 0.12)], st="terre", objtype="Point critique", kind="terre")
    else:
        M.element("IfcSlab", "Cassis bétonné", "CA1", [B(12.0, -0.2, -0.1, 3.0, w + 0.4, 0.2)], ptype="USERDEFINED", objtype="Cassis", kind="ensablement")
        M.element("IfcBuildingElementProxy", "Divergents de fossé", "DV1", [B(50.0, -4.0, -0.5, 1.0, 2.6, 0.12), B(50.0, w + 1.4, -0.5, 1.0, 2.6, 0.12)],
                  st="terre", objtype="Divergent", kind="fosse")
    M.element("IfcBuildingElementProxy", "Bornes kilométriques", "BK1", [B(1.0, -0.6, 0, 0.3, 0.2, 0.9), B(58.0, w + 0.4, 0, 0.3, 0.2, 0.9)], st="signal",
              objtype="Borne", kind="signal")


TYPES = {
    "Pont à poutres en béton armé": pont, "Buse métallique": buse, "Radier submersible": radier,
    "Dalot simple": lambda M: dalot(M, 1, 1.5, 1.0, 9.0), "Dalot double cellule": lambda M: dalot(M, 2, 2.0, 1.5, 10.0),
    "Section de route bitumée": lambda M: chaussee(M, False), "Section en remblai sur zone basse": lambda M: chaussee(M, True),
    "Piste en latérite": lambda M: piste(M, False), "Piste en terre": lambda M: piste(M, True),
}

if __name__ == "__main__":
    DATA, OUT = sys.argv[1], sys.argv[2]
    os.makedirs(OUT, exist_ok=True)
    data = json.load(open(DATA))
    for a in data["assets"]:
        M = Model(f"GIN²CO — {a['type']} {a['code']} (ouvrage fictif)", "Site fictif — démonstration")
        TYPES[a["type"]](M)
        for el, _, _, _ in M.elements:
            el.Tag = f"{a['code']}-{el.Tag}"
        vals = G.assign(a, M.elements, cost_key="CoutEstimeGNF", step=1_000_000)
        M.finish(os.path.join(OUT, f"{a['code']}.ifc"), vals)
        s = sum(v["CoutEstimeGNF"] for v in vals)
        print(f"{a['code']:6s} {a['type']:34s} n={len(vals):2d} worst={max(v['NoteEtat'] for v in vals)} note={a['note']} cost_ok={s == a['cout']}")
