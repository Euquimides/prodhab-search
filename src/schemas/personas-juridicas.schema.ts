import type { FormSchema, SimpleField } from "./form-schema.types";
import { buildBaseDatosSections } from "./shared/baseDatosSections";

/**
 * Esquema del "Formulario para la inscripción del registro de la base de
 * datos (Personas Jurídicas)", mapeado contra
 * `forms/FormularioparalaInscripcionRegistrodelaBasedeDatosparaPersonasJuridicas.xlsm`
 * (Versión 2.2, vigente desde 27/04/2017).
 *
 * ponytail: el Excel oficial tiene hasta 3 bloques de firma/aclaración/
 * fecha en la sección de dirección de notificación (uno por
 * representante adicional). Aquí se deja un único bloque de firma y se
 * cubre la multiplicidad de representantes con el repeatableGroup
 * `otrosRepresentantes` de la sección 2 — mismo dato legal relevante
 * (quiénes representan a la empresa), sin triplicar campos de firma que
 * en la práctica se completan a mano fuera de este asistente.
 */
const otrosRepresentantesFields: SimpleField[] = [
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
  { id: "nacionalidad", label: "Nacionalidad", type: "text", maxLength: 40 },
  { id: "correoElectronico", label: "Correo electrónico", type: "email", required: true },
  {
    id: "tipoRepresentacion",
    label: "Tipo de representación",
    type: "radio",
    options: [
      { value: "contractual", label: "Contractual" },
      { value: "legal", label: "Legal" },
      { value: "estatutaria", label: "Estatutaria" },
    ],
  },
  {
    id: "certificacionNotarial",
    label: "¿Se adjunta certificación notarial?",
    type: "radio",
    options: [
      { value: "si", label: "Sí" },
      { value: "no", label: "No" },
    ],
  },
];

export const personasJuridicasSchema: FormSchema = {
  id: "personas-juridicas",
  title: "Registro de Persona Jurídica",
  officialVersion: "2.2",
  officialEffectiveDate: "2017-04-27",
  sections: [
    {
      id: "datosEmpresa",
      number: "1.",
      title: "Datos de la empresa",
      fields: [
        { id: "razonSocial", label: "Nombre o razón social", type: "text", required: true, maxLength: 150 },
        {
          id: "tipoDocumentoEmpresa",
          label: "Tipo de documento",
          type: "radio",
          required: true,
          options: [
            { value: "CI", label: "Cédula jurídica" },
            { value: "otros", label: "Otros" },
          ],
        },
        {
          id: "tipoDocumentoEmpresaEspecifique",
          label: "Especifique tipo de documento",
          type: "text",
          required: true,
          visibleWhen: { fieldId: "tipoDocumentoEmpresa", equals: "otros" },
        },
        { id: "numeroDocumento", label: "Número de documento", type: "text", required: true, maxLength: 20 },
        { id: "actividadPrincipal", label: "Actividad principal", type: "text", maxLength: 120 },
        { id: "correoElectronicoEmpresa", label: "Correo electrónico", type: "email", required: true },
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
          id: "certificacionNotarial",
          label: "¿Se adjunta certificación notarial?",
          type: "radio",
          required: true,
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        { id: "observaciones", label: "Observaciones", type: "textarea", maxLength: 400 },
        {
          id: "otrosRepresentantes",
          label: "Otros representantes (si la empresa tiene más de uno)",
          type: "repeatableGroup",
          maxItems: 2,
          fields: otrosRepresentantesFields,
        },
      ],
    },
    {
      id: "direccionNotificacion",
      number: "3.",
      title: "Dirección a efectos de la notificación",
      description: "Completar también si la casa matriz se encuentra en otro país.",
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
        { id: "observacionesNotif", label: "Observaciones", type: "textarea", maxLength: 400 },
      ],
    },
    ...buildBaseDatosSections({
      startNumber: 4,
      personasSometidasLabel: "físicas",
      incluyeHipotecas: true,
      incluyeTelefonoCelularYOtros: true,
    }),
  ],
};
