"""Small helper layer over IfcOpenShell to build fictitious GIN²CO asset models (IFC4, metres)."""
import math
import ifcopenshell
import ifcopenshell.api as api

ETAT = {1: "Bon", 2: "Moyen", 3: "Dégradé", 4: "Critique"}
PRIO = {1: "P3", 2: "P2", 3: "P2", 4: "P1"}

STYLES = {
    "beton": (0.70, 0.71, 0.72), "enroch": (0.55, 0.50, 0.44), "enrobe": (0.22, 0.23, 0.25),
    "acier": (0.80, 0.82, 0.85), "remblai": (0.66, 0.42, 0.28), "macon": (0.86, 0.80, 0.70),
    "toit": (0.55, 0.20, 0.16), "tole": (0.62, 0.66, 0.70), "bois": (0.55, 0.38, 0.22),
    "pvc": (0.30, 0.45, 0.70), "equip": (0.20, 0.45, 0.60), "carrelage": (0.85, 0.85, 0.82),
}


class Model:
    def __init__(self, project_name, site_name):
        m = api.run("project.create_file", version="IFC4")
        self.m = m
        self.proj = api.run("root.create_entity", m, ifc_class="IfcProject", name=project_name)
        units = [api.run("unit.add_si_unit", m, unit_type=t) for t in ("LENGTHUNIT", "AREAUNIT", "VOLUMEUNIT", "PLANEANGLEUNIT")]
        api.run("unit.assign_unit", m, units=units)
        ctx = api.run("context.add_context", m, context_type="Model")
        self.body = api.run("context.add_context", m, context_type="Model", context_identifier="Body",
                            target_view="MODEL_VIEW", parent=ctx)
        self.site = api.run("root.create_entity", m, ifc_class="IfcSite", name=site_name)
        api.run("aggregate.assign_object", m, relating_object=self.proj, products=[self.site])
        self.styles = {}
        self.elements = []   # (entity, volume, length, kind)

    def style(self, key):
        if key not in self.styles:
            s = api.run("style.add_style", self.m, name=key)
            r, g, b = STYLES[key]
            api.run("style.add_surface_style", self.m, style=s, ifc_class="IfcSurfaceStyleShading",
                    attributes={"SurfaceColour": {"Name": None, "Red": r, "Green": g, "Blue": b}})
            self.styles[key] = s
        return self.styles[key]

    def pt(self, *c):
        return self.m.createIfcCartesianPoint([float(v) for v in c])

    def d3(self, *c):
        return self.m.createIfcDirection([float(v) for v in c])

    def _solid_box(self, x, y, z, dx, dy, dz):
        m = self.m
        prof = m.createIfcRectangleProfileDef("AREA", None, m.createIfcAxis2Placement2D(self.pt(x + dx / 2, y + dy / 2), None),
                                              float(dx), float(dy))
        return m.createIfcExtrudedAreaSolid(prof, m.createIfcAxis2Placement3D(self.pt(0, 0, z), None, None),
                                            self.d3(0, 0, 1), float(dz)), dx * dy * dz

    def _solid_pipe_y(self, x, y, z, r_out, thick, length):
        """Hollow circular pipe whose axis runs along +Y starting at (x, y, z) (z = axis height)."""
        m = self.m
        prof = m.createIfcCircleHollowProfileDef("AREA", None, m.createIfcAxis2Placement2D(self.pt(0, 0), None),
                                                 float(r_out), float(thick))
        pos = m.createIfcAxis2Placement3D(self.pt(x, y, z), self.d3(0, 1, 0), self.d3(1, 0, 0))
        vol = math.pi * (r_out ** 2 - (r_out - thick) ** 2) * length
        return m.createIfcExtrudedAreaSolid(prof, pos, self.d3(0, 0, 1), float(length)), vol

    def _solid_cyl_z(self, x, y, z, r, h):
        m = self.m
        prof = m.createIfcCircleProfileDef("AREA", None, m.createIfcAxis2Placement2D(self.pt(x, y), None), float(r))
        return m.createIfcExtrudedAreaSolid(prof, m.createIfcAxis2Placement3D(self.pt(0, 0, z), None, None),
                                            self.d3(0, 0, 1), float(h)), math.pi * r * r * h

    def element(self, cls, name, tag, parts, origin=(0, 0, 0), rot=0.0, st="beton", ptype=None, objtype=None,
                kind="beton", length=None):
        """parts: list of ('box', x,y,z,dx,dy,dz) | ('pipe', x,y,z,r,t,L) | ('cyl', x,y,z,r,h) in local coords."""
        m = self.m
        el = api.run("root.create_entity", m, ifc_class=cls, name=name, predefined_type=ptype)
        el.Tag = tag
        if objtype:
            el.ObjectType = objtype
        a = math.radians(rot)
        el.ObjectPlacement = m.createIfcLocalPlacement(None, m.createIfcAxis2Placement3D(
            self.pt(*origin), self.d3(0, 0, 1), self.d3(math.cos(a), math.sin(a), 0)))
        items, vol = [], 0.0
        for p in parts:
            if p[0] == "box":
                s, v = self._solid_box(*p[1:])
            elif p[0] == "pipe":
                s, v = self._solid_pipe_y(*p[1:])
            else:
                s, v = self._solid_cyl_z(*p[1:])
            items.append(s); vol += v
        rep = m.createIfcShapeRepresentation(self.body, "Body", "SweptSolid", items)
        el.Representation = m.createIfcProductDefinitionShape(None, None, [rep])
        api.run("style.assign_representation_styles", m, shape_representation=rep, styles=[self.style(st)])
        api.run("spatial.assign_container", m, relating_structure=self.site, products=[el])
        if length is None:
            length = max(max(p[4], p[5]) if p[0] == "box" else p[6] if p[0] == "pipe" else p[5] for p in parts)
        self.elements.append((el, vol, length, kind))
        return el

    def finish(self, path, values):
        """values: list aligned with self.elements of dicts for Pset_GIN2CO_Patrimoine."""
        m = self.m
        for (el, vol, length, _), p in zip(self.elements, values):
            ps = api.run("pset.add_pset", m, product=el, name="Pset_GIN2CO_Patrimoine")
            api.run("pset.edit_pset", m, pset=ps, properties=p)
            q = api.run("pset.add_qto", m, product=el, name="Qto_GIN2CO_Quantites")
            api.run("pset.edit_qto", m, qto=q, properties={"Volume": round(vol, 2), "Longueur": round(length, 2)})
        m.write(path)
