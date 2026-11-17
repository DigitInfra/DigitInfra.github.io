# Visionneuse GIN²CO — sources

Démonstration openBIM de la page `ginco.html` : un dalot **fictif** en IFC 4, lu dans le navigateur.

| Fichier | Rôle |
|---|---|
| `make_dalot.py` | Génère `../models/DLT01.ifc` (IfcOpenShell) avec le Pset `Pset_GIN2CO_Patrimoine` (données fictives) |
| `ifc_lib.py`, `gen_models.py` | Génèrent les 24 autres maquettes `../models/<code>.ifc` (15 types d'ouvrages). L'élément le plus dégradé porte l'état de l'ouvrage ; la somme des coûts des éléments est égale au coût affiché sur la carte. |
| `viewer.js` | Visionneuse : web-ifc (lecture IFC) + three.js (rendu), sélection, coloration, filtres, tableau triable |

## Reconstruire

```bash
pip install ifcopenshell
python3 make_dalot.py ../models/DLT01.ifc
python3 gen_models.py ../sig-data.json ../models

npm i web-ifc three esbuild
npx esbuild viewer.js --bundle --format=esm --minify --outfile=../gin2co-viewer.js
cp node_modules/web-ifc/web-ifc.wasm ../
```

Licences : three.js (MIT), web-ifc (MPL-2.0).

## SIG d'aide à la décision

| Fichier | Rôle |
|---|---|
| `gen_sig.py` | Génère `../sig-data.json` : 25 ouvrages fictifs, maille population / aléa inondation / géotechnique, points de trafic, équipements, volet financier. Les emplacements sont calés sur un rendu OpenStreetMap (z14) assemblé dans `mosaic.png` (terre / eau / voirie / zones humides) ; toutes les valeurs sont fictives. |
| `sig.js` | Carte Leaflet + fond OpenStreetMap : couches, score multicritère à poids réglables, enveloppe budgétaire, classement, lien vers la maquette 3D (DLT01). |

```bash
npm i leaflet
npx esbuild sig.js --bundle --format=esm --minify --outfile=../gin2co-sig.js
cp node_modules/leaflet/dist/leaflet.css ../
```

Licences : Leaflet (BSD-2-Clause). Fond de carte © contributeurs OpenStreetMap (ODbL).

## Liaison carte → 3D

Depuis la fiche d'un ouvrage sur la carte, « Voir en 3D » zoome sur l'ouvrage puis ouvre un panneau plein écran avec sa maquette. Les couches actives au moment du clic sont reprises : dans la scène (sol teinté, bloc géotechnique, lame d'eau de référence, étiquette de trafic, repères des équipements à moins de 500 m) et dans le panneau latéral (mini-carte et valeurs).
