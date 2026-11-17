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
