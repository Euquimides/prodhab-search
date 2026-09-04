import type { FormSchema } from "./form-schema.types";
import { buildBaseDatosSections } from "./shared/baseDatosSections";

/**
 * Esquema del "Formulario para la inscripción del registro de la base de
 * datos (Organismos Públicos)", mapeado contra
 * `forms/FormularioparalaInscripciondelRegistrodelaBasedeDatosparaOrganismosPublicos.xlsx`
 * (Versión 2.1, vigente desde 27/04/2017 — distinta de la 2.2 de los
 * otros dos formularios, ver PRD sección 10 pregunta 5).
 */
export const organismosPublicosSchema: FormSchema = {
  id: "organismos-publicos",
  title: "Registro de Organismo Público",
  officialVersion: "2.1",
  officialEffectiveDate: "2017-04-27",
  sections: [
    {
      id: "datosOrganismo",
      number: "1.",
      title: "Datos del organismo",
      fields: [
        { id: "nombreInstitucion", label: "Nombre de institución", type: "text", required: true, maxLength: 150 },
        { id: "dependencia", label: "Dependencia", type: "text", maxLength: 120 },
        { id: "cedulaJuridica", label: "Cédula jurídica", type: "text", required: true, maxLength: 20 },
        {
          id: "naturaleza",
          label: "Naturaleza",
          type: "radio",
          required: true,
          options: [
            { value: "gobiernoCentral", label: "Gobierno Central" },
            { value: "gobiernoDescentralizado", label: "Gobierno descentralizado" },
            { value: "organoDesconcentrado", label: "Órgano desconcentrado" },
            { value: "institucionAutonoma", label: "Institución autónoma" },
            { value: "colegioProfesional", label: "Colegio profesional" },
            { value: "otro", label: "Otro" },
          ],
        },
      ],
    },
    {
      id: "datosRepresentante",
      number: "2.",
      title: "Datos del representante",
      fields: [
        { id: "apellidos", label: "Apellidos", type: "text", required: true, maxLength: 80 },
        { id: "nombres", label: "Nombres", type: "text", required: true, maxLength: 80 },
        {
          id: "tipoDocumento",
          label: "Tipo de documento",
          type: "radio",
          required: true,
          options: [
            { value: "CI", label: "Cédula de identidad" },
            { value: "otros", label: "Otros" },
          ],
        },
        {
          id: "tipoDocumentoEspecifique",
          label: "Especifique tipo de documento",
          type: "text",
          required: true,
          visibleWhen: { fieldId: "tipoDocumento", equals: "otros" },
        },
        { id: "nacionalidad", label: "Nacionalidad", type: "text", maxLength: 40 },
        { id: "correoElectronico", label: "Correo electrónico", type: "email", required: true },
        {
          id: "tipoRepresentacion",
          label: "Tipo de representación",
          type: "radio",
          required: true,
          options: [
            { value: "contractual", label: "Contractual" },
            { value: "legal", label: "Legal" },
            { value: "estatutaria", label: "Estatutaria" },
          ],
        },
        {
          id: "certificacionPermanencia",
          label: "¿Se adjunta certificación de permanencia?",
          type: "radio",
          required: true,
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        { id: "observaciones", label: "Observaciones", type: "textarea", maxLength: 400 },
      ],
    },
    {
      id: "direccionNotificacion",
      number: "3.",
      title: "Dirección a efectos de la notificación",
      description: "Completar también en caso de haber más representantes, o bien que el mismo se encuentre en otro país.",
      fields: [
        { id: "calle", label: "Calle", type: "text", required: true, maxLength: 120 },
        { id: "numero", label: "Número", type: "text", maxLength: 20 },
        { id: "distrito", label: "Distrito", type: "text", required: true, maxLength: 60 },
        { id: "canton", label: "Cantón", type: "text", required: true, maxLength: 60 },
        { id: "provincia", label: "Provincia", type: "text", required: true, maxLength: 60 },
        { id: "detalleDireccion", label: "Más detalles sobre la dirección", type: "textarea", maxLength: 300 },
        { id: "codigoPostal", label: "Código postal", type: "text", maxLength: 10 },
        { id: "correoElectronicoNotif", label: "Correo electrónico", type: "email" },
        { id: "telefono", label: "Teléfono", type: "tel" },
        { id: "fax", label: "Fax", type: "tel" },
        { id: "aclaracionFirma", label: "Aclaración de firma del representante", type: "text", maxLength: 120 },
        { id: "fechaFirma", label: "Fecha", type: "date", required: true },
        { id: "observacionesNotif", label: "Observación", type: "textarea", maxLength: 400 },
      ],
    },
    ...buildBaseDatosSections({
      startNumber: 4,
      personasSometidasLabel: "físicas",
      incluyeHipotecas: false,
      incluyeTelefonoCelularYOtros: false,
      incluyeHistorialCreditos: true,
    }),
  ],
};
