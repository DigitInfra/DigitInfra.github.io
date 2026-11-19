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

## Impact et assistant de requêtes

| Fichier | Rôle |
|---|---|
| `impact.py` | Exécuté par `gen_sig.py` : calcule pour chaque ouvrage l'impact (aire de desserte, flux agricoles depuis des bassins fictifs, surface et ménages protégés), l'efficacité actuelle et après réhabilitation, le verdict (suffisant ≥ 85 %, à renforcer, à compléter) et le complément chiffré. |
| `assistant.js` | Interpréteur de requêtes local (FR/EN, sans IA générative) : filtres sur les ouvrages, actions sur la carte (couches, couleurs, budget, poids), ouverture des maquettes et requêtes sur leurs éléments. |

## Démonstrateurs par zone

Chaque zone a sa page : `ginco-benin.html` (patrimoine urbain, FCFA) et `ginco-guinee.html` (routes et flux agricoles, GNF). La page `ginco.html` sert d'accueil et redirige les anciennes ancres `#demo` et `#sig` vers le Bénin. Les mêmes modules (`sig.js`, `viewer.js`, `assistant.js`) lisent le profil de zone dans `meta.zone` du fichier de données : devise, familles, sols, équipements, sources de financement et vocabulaire de l'assistant.

| Fichier | Rôle |
|---|---|
| `gen_sig_gn.py` | Génère `../gn/sig-data.json` : 25 ouvrages routiers fictifs, maille de 600 m, trafic, équipements, axes d'arrière-pays, bassins de production et marchés fictifs. Les flux agricoles suivent le réseau routier (plus court chemin pondéré sur un rendu OpenStreetMap z13). |
| `impact_gn.py` | Exécuté par `gen_sig_gn.py` : flux traversant chaque ouvrage, restrictions liées à l'état, jours de coupure (submersion, bourbiers), pertes après récolte, ménages agricoles reliés, efficacité, verdict et complément chiffré. |
| `gen_models_gn.py` | Génère `../gn/models/<code>.ifc` (pont à poutres, dalots, buse métallique, radier submersible, sections de route, pistes en latérite et en terre). Coûts en GNF, cohérents avec la carte. |

```bash
python3 gen_sig_gn.py ../gn/sig-data.json        # à lancer à côté de mosaic.png (tuiles z13)
python3 gen_models_gn.py ../gn/sig-data.json ../gn/models
```
