#!/usr/bin/env python3
"""Generate one fictitious IFC4 model per GIN²CO demo asset (except DLT01, built by make_dalot.py).
Element conditions and costs are derived from the asset record in sig-data.json:
- the worst element condition equals the asset condition;
- element costs add up exactly to the asset cost shown on the map."""
import json, math, os, random, sys
from ifc_lib import Model, ETAT, PRIO

DATA, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

DES = {
    "beton": (["Fissures fines inférieures à 0,3 mm", "Épaufrures localisées, armatures non apparentes"],
              ["Fissures ouvertes de 0,3 à 1 mm avec traces de rouille", "Éclatement du béton d'enrobage, armatures apparentes"],
              ["Armatures corrodées avec perte de section", "Fissuration traversante et déformation visible"],
              ["Ragréage et traitement des fissures", "Réparation du béton et passivation des armatures", "Renforcement ou reconstruction de l'élément"]),
    "hydro": (["Quelques blocs déplacés"], ["Affouillement localisé en pied"], ["Protection emportée, fosse d'érosion en aval"],
              ["Repositionnement des blocs", "Recharge en enrochement", "Reconstruction de la protection"]),
    "chaussee": (["Fissuration de surface"], ["Nids-de-poule et orniérage"], ["Affaissement au droit de l'ouvrage"],
                 ["Colmatage des fissures", "Purge et reprise localisée", "Reprise du corps de chaussée"]),
    "metal": (["Corrosion superficielle"], ["Corrosion avancée, fixations desserrées"], ["Élément arraché ou rompu"],
              ["Brossage et peinture anticorrosion", "Remplacement des fixations et traitement", "Remplacement de l'élément"]),
    "ensablement": (["Dépôts sur 10 à 20 % de la section"], ["Ensablement de 30 à 50 % de la section"],
                    ["Obstruction supérieure à 60 %, débordements en saison des pluies"],
                    ["Curage courant", "Curage mécanisé", "Curage d'urgence et désobstruction"]),
    "macon": (["Fissures capillaires, enduit dégradé"], ["Fissures structurelles, remontées d'humidité"],
              ["Pan de mur déstabilisé, risque d'effondrement local"],
              ["Reprise d'enduit et peinture", "Agrafage des fissures et traitement de l'humidité", "Démolition et reconstruction du pan de mur"]),
    "toiture": (["Tôles oxydées, fuites ponctuelles"], ["Infiltrations importantes, chéneaux percés"], ["Couverture arrachée sur une partie"],
                ["Remplacement ponctuel des tôles", "Réfection partielle de la couverture", "Réfection complète de la couverture"]),
    "equip": (["Usure, rendement en baisse"], ["Pannes répétées"], ["Hors service"],
              ["Maintenance préventive", "Révision complète", "Remplacement de l'équipement"]),
    "regard": (["Tampon fissuré"], ["Tampon manquant, échelons corrodés"], ["Cheminée effondrée"],
               ["Remplacement du tampon", "Reprise de la cheminée et des échelons", "Reconstruction du regard"]),
    "conduite": (["Dépôts et joints usés"], ["Fissures longitudinales, infiltrations"], ["Ovalisation et rupture partielle"],
                 ["Curage et reprise des joints", "Chemisage de la conduite", "Remplacement des buses"]),
}
UNIT = {"beton": 1.0, "hydro": 0.8, "chaussee": 0.9, "metal": 0.5, "ensablement": 0.6, "macon": 0.8,
        "toiture": 1.0, "equip": 1.3, "regard": 0.4, "conduite": 1.0, "remblai": 0.3}
FAM = {"beton": "Structure", "hydro": "Protection hydraulique", "chaussee": "Chaussée", "metal": "Équipement de sécurité",
       "ensablement": "Hydraulique", "macon": "Enveloppe", "toiture": "Couverture", "equip": "Équipement",
       "regard": "Hydraulique", "conduite": "Hydraulique", "remblai": "Chaussée"}

B = lambda x, y, z, dx, dy, dz: ("box", x, y, z, dx, dy, dz)


# ------------------------------------------------------------------ builders
def road_pack(M, cx, width, y0, y1, z, rails=True, xr=(-1.0, 1.0)):
    """Embankment + pavement crossing over the structure (road along X), optional guardrails."""
    span = 24
    M.element("IfcBuildingElementProxy", "Remblai technique", "RMB",
              [B(cx - span / 2, y0, -0.4, span, y1 - y0, z + 0.4)], st="remblai", objtype="Remblai", kind="remblai", length=span)
    M.element("IfcSlab", "Chaussée — couche de roulement", "CH1", [B(cx - span / 2, y0, z, span, y1 - y0, 0.08)],
              st="enrobe", ptype="USERDEFINED", objtype="Chaussée", kind="chaussee", length=span)
    if rails:
        for i, y in enumerate((y0, y1 - 0.15)):
            M.element("IfcRailing", f"Garde-corps {'amont' if i == 0 else 'aval'}", f"GC{i + 1}",
                      [B(xr[0], y, z + 0.08, xr[1] - xr[0], 0.15, 0.9)], st="acier", ptype="GUARDRAIL", kind="metal")


def dalot(M, n, b, h, L):
    t, ti = 0.25, 0.20
    W = 2 * t + n * b + (n - 1) * ti
    M.element("IfcSlab", "Radier", "RAD", [B(0, 0, -t, W, L, t)], ptype="BASESLAB", kind="ensablement")
    xs = [0] + [t + (k + 1) * b + k * ti for k in range(n - 1)] + [W - t]
    names = ["Piédroit gauche"] + [f"Piédroit intermédiaire {k + 1}" if n > 2 else "Piédroit central" for k in range(n - 1)] + ["Piédroit droit"]
    for k, (x, nm) in enumerate(zip(xs, names)):
        M.element("IfcWall", nm, f"PD{k + 1}", [B(x, 0, 0, t if k in (0, len(xs) - 1) else ti, L, h)], ptype="SOLIDWALL")
    M.element("IfcSlab", "Dalle supérieure", "DAL", [B(0, 0, h, W, L, t)], ptype="FLOOR")
    for k, (nm, x, y, ang) in enumerate([("Mur en aile amont gauche", 0, 0, 240), ("Mur en aile amont droit", W, 0, 300),
                                         ("Mur en aile aval gauche", 0, L, 120), ("Mur en aile aval droit", W, L, 60)]):
        M.element("IfcWall", nm, f"MA{k + 1}", [B(0, 0, -t, 2.6, t, h + 2 * t)], origin=(x, y, 0), rot=ang, ptype="SOLIDWALL")
    for k, (nm, y) in enumerate((("Perré amont", -3.0), ("Perré aval", L))):
        M.element("IfcBuildingElementProxy", nm, f"PE{k + 1}", [B(-1, y, -0.35, W + 2, 3.0, 0.35)], st="enroch",
                  objtype="Perré maçonné", kind="hydro")
    road_pack(M, W / 2, W + 2, 1.0, L - 1.0, h + t + 0.3, xr=(-1, W + 1))


def ponceau(M):
    L, r = 11.0, 0.5
    for k, x in enumerate((0.0, 1.4)):
        M.element("IfcPipeSegment", f"Buse Ø1000 n°{k + 1}", f"BU{k + 1}", [("pipe", x + r, 0, r + 0.1, r, 0.1, L)],
                  st="beton", ptype="CULVERT", kind="conduite", length=L)
    for k, (nm, y) in enumerate((("Tête amont", -0.3), ("Tête aval", L))):
        M.element("IfcWall", nm, f"TE{k + 1}", [B(-0.8, y, 0, 3.8, 0.3, 1.7)], ptype="SOLIDWALL")
        M.element("IfcSlab", f"Radier {'d’entrée' if k == 0 else 'de sortie'}", f"RA{k + 1}",
                  [B(-0.8, y - 2.0 if k == 0 else y + 0.3, -0.2, 3.8, 2.0, 0.2)], ptype="BASESLAB", kind="ensablement")
    M.element("IfcBuildingElementProxy", "Perré aval", "PE1", [B(-1.5, L + 2.3, -0.3, 5.2, 2.5, 0.3)], st="enroch",
              objtype="Perré maçonné", kind="hydro")
    road_pack(M, 1.4, 4, 1.5, L - 1.5, 1.7, rails=False)


def caniveau(M):
    for k in range(6):
        x = k * 10.0
        M.element("IfcBuildingElementProxy", f"Tronçon {k + 1} (PK {k * 10}–{k * 10 + 10} m)", f"TR{k + 1}",
                  [B(x, 0, -0.15, 10, 1.4, 0.15), B(x, 0, 0, 10, 0.2, 0.8), B(x, 1.2, 0, 10, 0.2, 0.8)],
                  st="macon", objtype="Caniveau maçonné", kind="ensablement", length=10)
    for k, x in enumerate((8.0, 27.0, 46.0)):
        M.element("IfcSlab", f"Dalette de franchissement {k + 1}", f"DF{k + 1}", [B(x, -0.1, 0.8, 3.0, 1.6, 0.15)], ptype="FLOOR")
    for k, x in enumerate((19.0, 39.0)):
        M.element("IfcDistributionChamberElement", f"Avaloir {k + 1}", f"AV{k + 1}", [B(x, -1.1, -0.6, 1.0, 1.0, 1.4)],
                  ptype="INSPECTIONCHAMBER", kind="regard")
    M.element("IfcSlab", "Chaussée adjacente", "CH1", [B(0, -6.5, 0.72, 60, 6.3, 0.08)], st="enrobe", ptype="USERDEFINED",
              objtype="Chaussée", kind="chaussee", length=60)


def collecteur(M, b, h, n_seg=4, seg=25.0, outfall=False):
    t = 0.25
    for k in range(n_seg):
        x = k * seg
        M.element("IfcBuildingElementProxy", f"Cadre béton — tronçon {k + 1}", f"CB{k + 1}",
                  [B(x, 0, -t, seg, b + 2 * t, t), B(x, 0, 0, seg, t, h), B(x, b + t, 0, seg, t, h), B(x, 0, h, seg, b + 2 * t, t)],
                  objtype="Cadre béton", kind="ensablement" if k % 2 == 0 else "beton", length=seg)
    top = h + t
    depth = 1.6
    for k in range(n_seg - 1 if not outfall else n_seg - 1):
        x = (k + 1) * seg - 0.75
        y = (b + 2 * t) / 2 - 0.75
        M.element("IfcDistributionChamberElement", f"Regard de visite {k + 1}", f"RV{k + 1}",
                  [B(x, y, top, 1.5, 0.15, depth), B(x, y + 1.35, top, 1.5, 0.15, depth), B(x, y, top, 0.15, 1.5, depth),
                   B(x + 1.35, y, top, 0.15, 1.5, depth)], ptype="MANHOLE", kind="regard")
    M.element("IfcBuildingElementProxy", "Remblai de tranchée", "RMB", [B(0, -1.0, top, n_seg * seg, b + 2 * t + 2.0, depth)],
              st="remblai", objtype="Remblai", kind="remblai", length=n_seg * seg)
    return b + 2 * t, top


def exutoire(M):
    W, top = collecteur(M, 2.0, 1.6, n_seg=2, seg=20.0, outfall=True)
    X = 40.0
    M.element("IfcWall", "Mur de tête", "MT1", [B(X, -1.2, -0.5, 0.4, W + 2.4, top + 1.6)], ptype="SOLIDWALL")
    for k, (y, ang) in enumerate(((-1.2, -35), (W + 1.2, 35))):
        M.element("IfcWall", f"Mur en aile {'gauche' if k == 0 else 'droit'}", f"MA{k + 1}", [B(0, -0.15, -0.5, 4.0, 0.3, top + 1.0)],
                  origin=(X + 0.4, y, 0), rot=ang, ptype="SOLIDWALL")
    M.element("IfcSlab", "Radier de dissipation", "RD1", [B(X + 0.4, -1.2, -0.6, 6.0, W + 2.4, 0.35)], ptype="BASESLAB", kind="ensablement")
    M.element("IfcBuildingElementProxy", "Protection en enrochement", "EN1", [B(X + 6.4, -3.0, -0.7, 6.0, W + 6.0, 0.5)],
              st="enroch", objtype="Enrochement", kind="hydro")
    M.element("IfcBuildingElementProxy", "Clapet anti-retour", "CL1", [B(X - 0.05, 0.25, 0.1, 0.1, W - 0.5, 1.4)], st="equip",
              objtype="Clapet", kind="equip")
    M.element("IfcRailing", "Garde-corps du mur de tête", "GC1", [B(X, -1.2, top + 1.1, 0.1, W + 2.4, 1.0)], st="acier",
              ptype="GUARDRAIL", kind="metal")


def bassin(M):
    Lx, Ly, H = 40.0, 25.0, 3.0
    M.element("IfcSlab", "Radier du bassin", "RAD", [B(0, 0, -0.3, Lx, Ly, 0.3)], ptype="BASESLAB", kind="ensablement")
    walls = [("Paroi nord", B(0, Ly - 0.3, 0, Lx, 0.3, H)), ("Paroi sud", B(0, 0, 0, Lx, 0.3, H)),
             ("Paroi ouest", B(0, 0, 0, 0.3, Ly, H)), ("Paroi est", B(Lx - 0.3, 0, 0, 0.3, Ly, H))]
    for k, (nm, p) in enumerate(walls):
        M.element("IfcWall", nm, f"PA{k + 1}", [p], ptype="SOLIDWALL")
    M.element("IfcBuildingElementProxy", "Ouvrage d'entrée", "OE1", [B(-3.0, 9.5, -0.3, 3.0, 6.0, 2.2)], objtype="Ouvrage d'entrée")
    M.element("IfcBuildingElementProxy", "Déversoir de sécurité", "DV1", [B(16.0, Ly, 0, 8.0, 2.0, 2.2)], objtype="Déversoir")
    M.element("IfcBuildingElementProxy", "Ouvrage de vidange", "OV1", [B(Lx, 10.5, -0.3, 2.5, 4.0, 1.5)], objtype="Vidange", kind="equip")
    M.element("IfcPipeSegment", "Conduite de vidange Ø600", "CV1", [("pipe", Lx + 2.5 + 0.0, 12.5, 0.3, 0.3, 0.06, 8.0)],
              origin=(0, 0, 0), st="pvc", ptype="RIGIDSEGMENT", kind="conduite", length=8.0)
    M.element("IfcSlab", "Rampe d'accès pour curage", "RP1", [B(4.0, -6.0, 0, 6.0, 6.0, 0.2)], ptype="USERDEFINED",
              objtype="Rampe", kind="chaussee")
    for k, (nm, p) in enumerate((("Clôture nord", B(-4, Ly + 4, 0, Lx + 8, 0.08, 2.0)), ("Clôture sud", B(-4, -8, 0, Lx + 8, 0.08, 2.0)),
                                  ("Clôture ouest", B(-4, -8, 0, 0.08, Ly + 12, 2.0)), ("Clôture est", B(Lx + 12, -8, 0, 0.08, Ly + 12, 2.0)))):
        M.element("IfcRailing", nm, f"CL{k + 1}", [p], st="acier", ptype="USERDEFINED", objtype="Clôture", kind="metal")


def station(M):
    M.element("IfcSlab", "Bâche — radier", "BR1", [B(0, 0, -4.3, 6, 5, 0.3)], ptype="BASESLAB", kind="ensablement")
    M.element("IfcWall", "Bâche — voiles", "BV1", [B(0, 0, -4.0, 6, 0.3, 4.3), B(0, 4.7, -4.0, 6, 0.3, 4.3),
                                                    B(0, 0, -4.0, 0.3, 5, 4.3), B(5.7, 0, -4.0, 0.3, 5, 4.3)], ptype="SOLIDWALL")
    M.element("IfcSlab", "Dalle de couverture de la bâche", "BD1", [B(0, 0, 0.3, 6, 5, 0.25)], ptype="FLOOR")
    for k, x in enumerate((1.8, 4.2)):
        M.element("IfcPump", f"Pompe submersible {k + 1}", f"PO{k + 1}", [("cyl", x, 2.5, -3.9, 0.45, 1.3)], st="equip",
                  ptype="SUBMERSIBLEPUMP", kind="equip", length=1.3)
    M.element("IfcPipeSegment", "Conduite de refoulement Ø300", "CR1", [("pipe", 3.0, 5.0, -0.6, 0.16, 0.02, 14.0)], st="pvc",
              ptype="RIGIDSEGMENT", kind="conduite", length=14.0)
    M.element("IfcSlab", "Local technique — dallage", "LD1", [B(8, 0, 0, 6, 5, 0.2)], ptype="FLOOR")
    M.element("IfcWall", "Local technique — murs", "LM1", [B(8, 0, 0.2, 6, 0.2, 2.8), B(8, 4.8, 0.2, 6, 0.2, 2.8),
                                                         B(8, 0, 0.2, 0.2, 5, 2.8), B(13.8, 0, 0.2, 0.2, 5, 2.8)],
              st="macon", ptype="SOLIDWALL", kind="macon")
    M.element("IfcSlab", "Local technique — toiture", "LT1", [B(7.6, -0.4, 3.0, 6.8, 5.8, 0.12)], st="tole", ptype="ROOF", kind="toiture")
    M.element("IfcBuildingElementProxy", "Armoire électrique et groupe électrogène", "GE1", [B(9, 1, 0.2, 2.5, 1.2, 1.5)], st="equip",
              objtype="Groupe électrogène", kind="equip")
    M.element("IfcRailing", "Clôture d'enceinte", "CL1", [B(-3, -3, 0, 20, 0.08, 2.0), B(-3, 8, 0, 20, 0.08, 2.0),
                                                        B(-3, -3, 0, 0.08, 11, 2.0), B(17, -3, 0, 0.08, 11, 2.0)],
              st="acier", ptype="USERDEFINED", objtype="Clôture", kind="metal")


def building(M, label, Lx, Ly, levels=1, gallery=True, annex=None, ox=0.0, oy=0.0, tag="A", roof_st="tole"):
    hl = 3.2
    pre = f"{label} — " if label else ""
    M.element("IfcFooting", f"{pre}Fondations", f"{tag}FO", [B(ox - 0.2, oy - 0.2, -0.8, Lx + 0.4, 0.6, 0.6),
                                                             B(ox - 0.2, oy + Ly - 0.4, -0.8, Lx + 0.4, 0.6, 0.6),
                                                             B(ox - 0.2, oy, -0.8, 0.6, Ly, 0.6), B(ox + Lx - 0.4, oy, -0.8, 0.6, Ly, 0.6)],
              ptype="STRIP_FOOTING")
    M.element("IfcSlab", f"{pre}Dallage", f"{tag}DA", [B(ox, oy, -0.2, Lx, Ly, 0.35)], ptype="FLOOR", st="carrelage")
    H = hl * levels
    M.element("IfcWall", f"{pre}Façade principale", f"{tag}MF", [B(ox, oy, 0.15, Lx, 0.2, H)], st="macon", ptype="SOLIDWALL", kind="macon")
    M.element("IfcWall", f"{pre}Façade arrière", f"{tag}MR", [B(ox, oy + Ly - 0.2, 0.15, Lx, 0.2, H)], st="macon", ptype="SOLIDWALL", kind="macon")
    M.element("IfcWall", f"{pre}Pignons", f"{tag}MP", [B(ox, oy, 0.15, 0.2, Ly, H), B(ox + Lx - 0.2, oy, 0.15, 0.2, Ly, H)],
              st="macon", ptype="SOLIDWALL", kind="macon")
    nref = max(1, int(Lx // 9))
    M.element("IfcWall", f"{pre}Murs de refend", f"{tag}MI",
              [B(ox + (k + 1) * Lx / (nref + 1), oy, 0.15, 0.15, Ly, H) for k in range(nref)], st="macon", ptype="SOLIDWALL", kind="macon")
    for lv in range(1, levels):
        M.element("IfcSlab", f"{pre}Plancher haut R+{lv - 1}", f"{tag}P{lv}", [B(ox, oy - (2.5 if gallery else 0), lv * hl, Lx, Ly + (2.5 if gallery else 0), 0.2)],
                  ptype="FLOOR")
    if gallery:
        cols = [B(ox + x, oy - 2.5, 0.15, 0.25, 0.25, H) for x in [i * (Lx - 0.25) / max(1, int(Lx // 4)) for i in range(int(Lx // 4) + 1)]]
        M.element("IfcColumn", f"{pre}Poteaux de galerie", f"{tag}PG", cols, ptype="COLUMN")
        if levels > 1:
            M.element("IfcRailing", f"{pre}Garde-corps de coursive", f"{tag}GC", [B(ox, oy - 2.5, hl + 0.2, Lx, 0.08, 1.0)],
                      st="acier", ptype="BALUSTRADE", kind="metal")
    M.element("IfcSlab", f"{pre}Toiture", f"{tag}TO", [B(ox - 0.6, oy - (3.1 if gallery else 0.6), H + 0.15, Lx + 1.2, Ly + (3.7 if gallery else 1.2), 0.15)],
              st=roof_st, ptype="ROOF", kind="toiture")


def clot(M, x0, y0, x1, y1):
    M.element("IfcRailing", "Clôture", "CLO", [B(x0, y0, 0, x1 - x0, 0.15, 2.0), B(x0, y1, 0, x1 - x0, 0.15, 2.0),
                                               B(x0, y0, 0, 0.15, y1 - y0, 2.0), B(x1, y0, 0, 0.15, y1 - y0 + 0.15, 2.0)],
              st="acier", ptype="USERDEFINED", objtype="Clôture", kind="metal")


def latrines(M, x, y):
    M.element("IfcBuildingElementProxy", "Bloc sanitaire", "BS1", [B(x, y, 0, 8, 3, 2.6)], st="macon", objtype="Bloc sanitaire", kind="macon")


def ecole(M):
    building(M, "", 27, 8)
    latrines(M, 32, 6)
    clot(M, -6, -10, 44, 16)


def college(M):
    building(M, "", 32, 9, levels=2)
    latrines(M, 37, 7)
    clot(M, -6, -11, 50, 18)


def sante(M):
    building(M, "Bloc consultations", 20, 10, tag="C")
    building(M, "Maternité", 16, 9, ox=24, oy=0, tag="M")
    M.element("IfcSlab", "Auvent de liaison", "AUV", [B(20, 2, 3.4, 4, 4, 0.12)], st="tole", ptype="ROOF", kind="toiture")
    M.element("IfcBuildingElementProxy", "Château d'eau", "CE1", [("cyl", -6, 5, 0, 0.25, 7.0), ("cyl", -6, 5, 7.0, 1.6, 2.4)],
              st="equip", objtype="Château d'eau", kind="equip", length=9.4)
    clot(M, -10, -9, 46, 17)


def mairie(M):
    building(M, "", 24, 12, levels=2, roof_st="toit")
    M.element("IfcSlab", "Parvis", "PAR", [B(-4, -12, -0.1, 32, 9, 0.12)], ptype="USERDEFINED", objtype="Parvis", kind="chaussee")
    M.element("IfcBuildingElementProxy", "Mât et emmarchement", "MAT", [B(10, -6, 0, 4, 2.5, 0.45), ("cyl", 12, -9, 0, 0.08, 9.0)],
              st="acier", objtype="Emmarchement", kind="metal")


def marche(M):
    Lx, Ly = 40.0, 24.0
    M.element("IfcSlab", "Dallage du marché", "DAL", [B(0, 0, -0.2, Lx, Ly, 0.3)], ptype="FLOOR")
    for r, y in enumerate((0.0, Ly / 2 - 0.15, Ly - 0.3)):
        M.element("IfcColumn", f"File de poteaux {'ABC'[r]}", f"PF{r + 1}", [B(x, y, 0.1, 0.3, 0.3, 5.0) for x in [i * 6.6 for i in range(7)]],
                  ptype="COLUMN")
    M.element("IfcBeam", "Charpente métallique", "CHA", [B(i * 6.6, 0, 5.1, 0.25, Ly, 0.35) for i in range(7)] +
              [B(0, y, 5.1, Lx, 0.2, 0.3) for y in (0, Ly / 2, Ly - 0.2)], st="acier", ptype="BEAM", kind="metal")
    for k, (nm, y) in enumerate((("Couverture — pan sud", -1.0), ("Couverture — pan nord", Ly / 2))):
        M.element("IfcSlab", nm, f"CO{k + 1}", [B(-1, y, 5.45 + (0.4 if k else 0), Lx + 2, Ly / 2 + 1, 0.1)], st="tole", ptype="ROOF", kind="toiture")
    for k, y in enumerate((3.0, 9.0, 15.0, 20.0)):
        M.element("IfcBuildingElementProxy", f"Rangée d'étals {k + 1}", f"ET{k + 1}", [B(x, y, 0.1, 5.0, 1.2, 0.9) for x in (1.5, 8.1, 14.7, 21.3, 27.9, 34.5)],
                  st="carrelage", objtype="Étals maçonnés", kind="macon")
    M.element("IfcBuildingElementProxy", "Caniveau périphérique", "CP1", [B(-1.2, -1.2, -0.5, Lx + 2.4, 0.6, 0.5), B(-1.2, Ly + 0.6, -0.5, Lx + 2.4, 0.6, 0.5)],
              st="macon", objtype="Caniveau", kind="ensablement")


TYPES = {
    "Dalot simple": lambda M: dalot(M, 1, 1.5, 1.0, 9.0), "Dalot double cellule": lambda M: dalot(M, 2, 2.0, 1.5, 10.0),
    "Dalot triple cellule": lambda M: dalot(M, 3, 2.5, 2.0, 12.0), "Ponceau": ponceau, "Caniveau maçonné": caniveau,
    "Collecteur principal": lambda M: collecteur(M, 2.0, 1.6), "Collecteur secondaire": lambda M: collecteur(M, 1.2, 1.0),
    "Exutoire": exutoire, "Bassin de rétention": bassin, "Station de relevage": station, "École primaire": ecole,
    "Collège": college, "Centre de santé": sante, "Mairie d’arrondissement": mairie, "Marché couvert": marche,
}
MAT = {"beton": "Béton armé", "hydro": "Enrochement", "chaussee": "Enrobé bitumineux", "metal": "Acier galvanisé",
       "ensablement": "Béton armé", "macon": "Maçonnerie de parpaings", "toiture": "Tôle bac acier", "equip": "Équipement électromécanique",
       "regard": "Béton armé", "conduite": "Béton armé", "remblai": "Grave latéritique"}


def assign(asset, elements):
    rng = random.Random(asset["code"])
    N = asset["note"]
    n = len(elements)
    kinds = [k for (_, _, _, k) in elements]
    notes = []
    for k in kinds:
        if k == "remblai":
            notes.append(1)
        else:
            notes.append(max(1, min(N, round(N - abs(rng.gauss(0.7, 0.9))))))
    cand = [i for i, k in enumerate(kinds) if k != "remblai"]
    rng.shuffle(cand)
    for i in cand[: (2 if N == 4 else 1)]:
        notes[i] = N
    # cost split (sums exactly to the asset cost)
    total = asset["cout"]
    w = [((nt - 1) ** 1.6) * UNIT[k] * (1 + math.log1p(v)) for nt, (_, v, _, k) in zip(notes, elements)]
    preventive = sum(w) == 0
    if preventive:
        w = [UNIT[k] * (1 + math.log1p(v)) if k != "remblai" else 0 for (_, v, _, k) in elements]
    raw = [total * x / sum(w) for x in w]
    costs = [int(round(c / 50000.0)) * 50000 for c in raw]
    i_max = max(range(n), key=lambda i: costs[i])
    costs[i_max] += total - sum(costs)
    vals = []
    for i, ((el, vol, length, k), nt, c) in enumerate(zip(elements, notes, costs)):
        if nt == 1:
            des, act = "Aucun désordre significatif", ("Entretien préventif programmé" if c else "Surveillance courante")
        else:
            d = DES[k if k in DES else "beton"]
            des = rng.choice(d[nt - 2]); act = d[3][nt - 2]
        vals.append({"Famille": FAM[k], "Materiau": MAT[k], "AnneeMiseEnService": asset["annee"],
                     "DateDerniereInspection": asset["inspection"] + "-15", "Etat": ETAT[nt], "NoteEtat": nt,
                     "Desordre": des, "PrioriteEntretien": PRIO[nt], "CoutEstimeFCFA": int(c), "ActionRecommandee": act})
    return vals


data = json.load(open(DATA))
for a in data["assets"]:
    if a["code"] == "DLT01":
        continue
    M = Model(f"GIN²CO — {a['type']} {a['code']} (ouvrage fictif)", "Site fictif — démonstration")
    TYPES[a["type"]](M)
    for el, _, _, _ in M.elements:
        el.Tag = f"{a['code']}-{el.Tag}"
    vals = assign(a, M.elements)
    M.finish(os.path.join(OUT, f"{a['code']}.ifc"), vals)
    s = sum(v["CoutEstimeFCFA"] for v in vals)
    print(f"{a['code']:6s} {a['type']:26s} n={len(vals):2d} worst={max(v['NoteEtat'] for v in vals)} note={a['note']} cost_ok={s == a['cout']}")
