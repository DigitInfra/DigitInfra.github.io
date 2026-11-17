# Visionneuse GIN²CO — sources

Démonstration openBIM de la page `ginco.html` : un dalot **fictif** en IFC 4, lu dans le navigateur.

| Fichier | Rôle |
|---|---|
| `make_dalot.py` | Génère `../dalot-demo.ifc` (IfcOpenShell) avec le Pset `Pset_GIN2CO_Patrimoine` (données fictives) |
| `viewer.js` | Visionneuse : web-ifc (lecture IFC) + three.js (rendu), sélection, coloration, filtres, tableau triable |

## Reconstruire

```bash
pip install ifcopenshell
python3 make_dalot.py ../dalot-demo.ifc

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
