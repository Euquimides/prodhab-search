import { describe, it, expect } from "vitest";
import { buildBaseDatosSections } from "./baseDatosSections";
import type { CheckboxGroupField } from "../form-schema.types";

describe("buildBaseDatosSections", () => {
  it("numbers the 12 sections sequentially starting at startNumber", () => {
    const sections = buildBaseDatosSections({ startNumber: 3, personasSometidasLabel: "jurídicas" });
    expect(sections).toHaveLength(12);
    expect(sections[0].number).toBe("3.");
    expect(sections[11].number).toBe("14.");
    expect(sections.map((s) => s.id)).toEqual([
      "identificacionBD",
      "ubicacionFisicaBD",
      "terceroTratamiento",
      "contactoTecnico",
      "servicioEjercicioDerechos",
      "informacionEstadistica",
      "ejercicioDerechosTitulares",
      "datosSometidos",
      "procedimientoObtencion",
      "medidasSeguridad",
      "descripcionTecnica",
      "declaracionJurada",
    ]);
  });

  it("interpolates the personasSometidasLabel into the datosSometidos section", () => {
    const sections = buildBaseDatosSections({ startNumber: 4, personasSometidasLabel: "físicas" });
    const datosSometidos = sections.find((s) => s.id === "datosSometidos")!;
    const field = datosSometidos.fields.find((f) => f.id === "cantidadPersonasSometidas")!;
    expect(field.label).toContain("físicas");
  });

  it("includes Hipotecas only when incluyeHipotecas is true", () => {
    const withHipotecas = buildBaseDatosSections({ startNumber: 3, personasSometidasLabel: "x", incluyeHipotecas: true });
    const without = buildBaseDatosSections({ startNumber: 3, personasSometidasLabel: "x", incluyeHipotecas: false });

    const optionsOf = (sections: ReturnType<typeof buildBaseDatosSections>) => {
      const datosSometidos = sections.find((s) => s.id === "datosSometidos")!;
      const field = datosSometidos.fields.find((f) => f.id === "datosCrediticios") as CheckboxGroupField;
      return field.options.map((o) => o.value);
    };

    expect(optionsOf(withHipotecas)).toContain("hipotecas");
    expect(optionsOf(without)).not.toContain("hipotecas");
  });

  it("swaps Teléfono celular/Otros for Historial de créditos in acceso restringido per form type", () => {
    const fisicaLike = buildBaseDatosSections({
      startNumber: 3,
      personasSometidasLabel: "x",
      incluyeTelefonoCelularYOtros: true,
    });
    const organismoLike = buildBaseDatosSections({
      startNumber: 4,
      personasSometidasLabel: "x",
      incluyeHistorialCreditos: true,
    });

    const optionsOf = (sections: ReturnType<typeof buildBaseDatosSections>) => {
      const datosSometidos = sections.find((s) => s.id === "datosSometidos")!;
      const field = datosSometidos.fields.find((f) => f.id === "datosAccesoRestringido") as CheckboxGroupField;
      return field.options.map((o) => o.value);
    };

    expect(optionsOf(fisicaLike)).toEqual(expect.arrayContaining(["telefonoCelular", "otros"]));
    expect(optionsOf(fisicaLike)).not.toContain("historialCreditos");

    expect(optionsOf(organismoLike)).toContain("historialCreditos");
    expect(optionsOf(organismoLike)).not.toEqual(expect.arrayContaining(["telefonoCelular"]));
  });
});
