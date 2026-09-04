import type { FormField, FormSection } from "../form-schema.types";

/**
 * Las 12 secciones "Registro de Bases de Datos" (identificación de la BD
 * hasta declaración jurada) son ~idénticas entre los 3 formularios
 * oficiales de PRODHAB (ver `forms/*.xlsm`/`.xlsx`) — el PRD estima ~70%
 * de estructura compartida. Se generan aquí una sola vez y cada schema
 * de tipo de solicitante (`personas-fisicas`, `personas-juridicas`,
 * `organismos-publicos`) las antepone con sus propias secciones de
 * identificación (titular/empresa/organismo + representante).
 *
 * Las únicas diferencias reales entre los 3 Excel en este bloque:
 * - la etiqueta de "cantidad de personas sometidas al tratamiento"
 *   (el Excel de cada tipo pregunta por el tipo de persona *contraria*:
 *   Persona Física pregunta por jurídicas sometidas y viceversa).
 * - el detalle exacto de las opciones de "datos crediticios" y "datos de
 *   acceso restringido" (Organismos Públicos no tiene "Hipotecas" ni
 *   "Teléfono celular", pero sí "Historial de créditos").
 */
export interface BaseDatosSectionsOptions {
  /** Número de la primera de las 12 secciones (continúa la numeración del schema). */
  startNumber: number;
  /** Ej. "jurídicas" en el schema de Persona Física, "físicas" en los otros dos. */
  personasSometidasLabel: string;
  /** Persona Física y Persona Jurídica incluyen "Hipotecas" en datos crediticios. */
  incluyeHipotecas?: boolean;
  /** Persona Física y Persona Jurídica incluyen "Teléfono celular" y "Otros" en acceso restringido. */
  incluyeTelefonoCelularYOtros?: boolean;
  /** Organismos Públicos incluye "Historial de créditos" en acceso restringido. */
  incluyeHistorialCreditos?: boolean;
}

export function buildBaseDatosSections(options: BaseDatosSectionsOptions): FormSection[] {
  const {
    startNumber,
    personasSometidasLabel,
    incluyeHipotecas = false,
    incluyeTelefonoCelularYOtros = false,
    incluyeHistorialCreditos = false,
  } = options;
  const n = (offset: number) => `${startNumber + offset}.`;

  return [
    {
      id: "identificacionBD",
      number: n(0),
      title: "Identificación de la Base de Datos",
      description:
        "Indique el nombre de la Base de Datos, archivos u otros medios similares autorizados y una breve descripción de la misma. Describa el tipo de base de datos aunque tenga a cargo más bases.",
      fields: [
        { id: "nombreBD", label: "Nombre", type: "text", required: true, maxLength: 150 },
        { id: "descripcionBD", label: "Descripción", type: "textarea", required: true, maxLength: 600 },
        { id: "observacionBD", label: "Observación", type: "textarea", maxLength: 300 },
      ],
    },
    {
      id: "ubicacionFisicaBD",
      number: n(1),
      title: "Ubicación física de la Base de Datos",
      description:
        "Indique el organismo, empresa, departamento u oficina donde se encuentra la Base de Datos y su dirección. Si la Base de Datos está en la nube, especifique en observaciones si es pública o privada, el nombre de la nube y su ubicación.",
      fields: [
        { id: "ubicCalle", label: "Calle", type: "text", required: true, maxLength: 120 },
        { id: "ubicNumero", label: "Número", type: "text", maxLength: 20 },
        { id: "ubicDistrito", label: "Distrito", type: "text", required: true, maxLength: 60 },
        { id: "ubicCanton", label: "Cantón", type: "text", required: true, maxLength: 60 },
        { id: "ubicProvincia", label: "Provincia", type: "text", required: true, maxLength: 60 },
        { id: "ubicDetalleDireccion", label: "Más detalles sobre la dirección", type: "textarea", maxLength: 300 },
        { id: "ubicCorreoElectronico", label: "Correo electrónico", type: "email" },
        { id: "ubicTelefono", label: "Teléfono", type: "tel" },
        { id: "ubicFax", label: "Fax", type: "tel" },
        {
          id: "ubicacionEsTercero",
          label: "¿La ubicación corresponde a un tercero?",
          type: "radio",
          required: true,
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "existenUbicacionesAlternas",
          label: "¿Existen ubicaciones alternativas o secundarias?",
          type: "radio",
          required: true,
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "ubicacionesAlternas",
          label: "Ubicaciones alternativas",
          type: "repeatableGroup",
          minItems: 1,
          maxItems: 3,
          visibleWhen: { fieldId: "existenUbicacionesAlternas", equals: "si" },
          fields: [
            { id: "direccion", label: "Dirección completa", type: "text", required: true, maxLength: 200 },
            { id: "ciudad", label: "Ciudad", type: "text", required: true, maxLength: 60 },
            { id: "pais", label: "País", type: "text", required: true, maxLength: 60 },
          ],
        },
        { id: "observacionesUbicacion", label: "Observaciones", type: "textarea", maxLength: 400 },
      ],
    },
    {
      id: "terceroTratamiento",
      number: n(2),
      title: "Identificación de un tercero que realiza el tratamiento",
      description: "Completar únicamente si un tercero realiza el tratamiento de la Base de Datos por cuenta del responsable.",
      fields: [
        {
          id: "tipoTercero",
          label: "El tercero es",
          type: "radio",
          options: [
            { value: "organismoPublico", label: "Organismo público" },
            { value: "empresaPrivada", label: "Empresa privada" },
          ],
        },
        {
          id: "organismoNombre",
          label: "Nombre del organismo",
          type: "text",
          required: true,
          visibleWhen: { fieldId: "tipoTercero", equals: "organismoPublico" },
        },
        {
          id: "organismoDependencia",
          label: "Dependencia",
          type: "text",
          visibleWhen: { fieldId: "tipoTercero", equals: "organismoPublico" },
        },
        {
          id: "empresaRazonSocial",
          label: "Nombre o razón social",
          type: "text",
          required: true,
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
        },
        {
          id: "empresaTipoDocumento",
          label: "Tipo de documento",
          type: "radio",
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
          options: [
            { value: "CI", label: "Cédula jurídica" },
            { value: "otros", label: "Otros" },
          ],
        },
        {
          id: "empresaNumeroDocumento",
          label: "N.° de documento",
          type: "text",
          required: true,
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
        },
        {
          id: "empresaActividadPrincipal",
          label: "Actividad principal",
          type: "text",
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
        },
        {
          id: "empresaRepresentanteApellidos",
          label: "Apellidos del representante",
          type: "text",
          maxLength: 80,
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
        },
        {
          id: "empresaRepresentanteNombres",
          label: "Nombre del representante",
          type: "text",
          maxLength: 80,
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
        },
        {
          id: "empresaRepresentanteTipoDocumento",
          label: "Tipo de documento del representante",
          type: "radio",
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
          options: [
            { value: "CI", label: "Cédula de identidad" },
            { value: "otros", label: "Otros" },
          ],
        },
        {
          id: "empresaRepresentanteTipoDocumentoEspecifique",
          label: "Especifique tipo de documento del representante",
          type: "text",
          visibleWhen: { fieldId: "empresaRepresentanteTipoDocumento", equals: "otros" },
        },
        {
          id: "empresaRepresentanteNumeroDocumento",
          label: "N.° de documento del representante",
          type: "text",
          maxLength: 20,
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
        },
        {
          id: "empresaRepresentanteNacionalidad",
          label: "Nacionalidad del representante",
          type: "text",
          maxLength: 40,
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
        },
        {
          id: "empresaRepresentanteCorreo",
          label: "Correo electrónico del representante",
          type: "email",
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
        },
        {
          id: "empresaRepresentanteTipoRepresentacion",
          label: "Tipo de representación",
          type: "radio",
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
          options: [
            { value: "contractual", label: "Contractual" },
            { value: "legal", label: "Legal" },
            { value: "estatutaria", label: "Estatutaria" },
          ],
        },
        {
          id: "terceroAportaListadoContratos",
          label:
            "¿Se aporta listado de los contratos y cuentas de ficheros, así como la estimación pecuniaria de cada uno de esos contratos?",
          type: "radio",
          visibleWhen: { fieldId: "tipoTercero", equals: "empresaPrivada" },
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        // Ubicación física del tercero: los 3 Excel piden la misma dirección
        // para el organismo público y para la empresa privada, así que va una
        // sola vez sin condicionar por `tipoTercero`.
        { id: "terceroCalle", label: "Ubicación física del tercero: calle", type: "text", maxLength: 120 },
        { id: "terceroNumero", label: "Ubicación física del tercero: número", type: "text", maxLength: 20 },
        { id: "terceroDistrito", label: "Ubicación física del tercero: distrito", type: "text", maxLength: 60 },
        { id: "terceroCanton", label: "Ubicación física del tercero: cantón", type: "text", maxLength: 60 },
        { id: "terceroProvincia", label: "Ubicación física del tercero: provincia", type: "text", maxLength: 60 },
        { id: "observacionesTercero", label: "Observaciones", type: "textarea", maxLength: 400 },
      ],
    },
    {
      id: "contactoTecnico",
      number: n(3),
      title: "Datos del contacto técnico de la Base de Datos",
      fields: [
        { id: "contactoApellidos", label: "Apellidos", type: "text", required: true, maxLength: 80 },
        { id: "contactoNombre", label: "Nombre", type: "text", required: true, maxLength: 80 },
        {
          id: "contactoTipoDocumento",
          label: "Tipo de documento",
          type: "radio",
          options: [
            { value: "CI", label: "Cédula de identidad" },
            { value: "otros", label: "Otros" },
          ],
        },
        { id: "contactoNumeroDocumento", label: "N.° de documento", type: "text", maxLength: 20 },
        { id: "contactoNacionalidad", label: "Nacionalidad", type: "text", maxLength: 40 },
        { id: "contactoCorreo", label: "Correo electrónico", type: "email", required: true },
        { id: "contactoTelefono", label: "Teléfono", type: "tel", required: true },
        {
          id: "contactoDependeDe",
          label: "El técnico es dependiente de",
          type: "radio",
          options: [
            { value: "titular", label: "Titular" },
            { value: "tercero", label: "Tercero" },
          ],
        },
        { id: "contactoObservaciones", label: "Observaciones", type: "textarea", maxLength: 400 },
      ],
    },
    {
      id: "servicioEjercicioDerechos",
      number: n(4),
      title: "Servicio o unidad donde se pueden ejercer los derechos",
      fields: [
        { id: "servicioContacto", label: "Contacto", type: "text", required: true, maxLength: 120 },
        { id: "servicioCalle", label: "Calle", type: "text", maxLength: 120 },
        { id: "servicioNumero", label: "Número", type: "text", maxLength: 20 },
        { id: "servicioDistrito", label: "Distrito", type: "text", maxLength: 60 },
        { id: "servicioCanton", label: "Cantón", type: "text", maxLength: 60 },
        { id: "servicioProvincia", label: "Provincia", type: "text", maxLength: 60 },
        { id: "servicioDetalleDireccion", label: "Más detalles sobre la dirección", type: "textarea", maxLength: 300 },
        { id: "servicioCodigoPostal", label: "Código postal", type: "text", maxLength: 10 },
        { id: "servicioTelefono", label: "Teléfono", type: "tel" },
        { id: "servicioCorreo", label: "Correo electrónico", type: "email", required: true },
        { id: "servicioFax", label: "Fax", type: "tel" },
      ],
    },
    {
      id: "informacionEstadistica",
      number: n(5),
      title: "Información estadística",
      fields: [
        {
          id: "poseeInformacionEstadistica",
          label: "¿Posee información estadística?",
          type: "radio",
          required: true,
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "cantidadEjerciciosAcceso",
          label: "Cantidad de titulares que hayan ejercido el derecho de acceso",
          type: "text",
          maxLength: 10,
          visibleWhen: { fieldId: "poseeInformacionEstadistica", equals: "si" },
        },
        {
          id: "cantidadCancelacionesPago",
          label: "Cantidad de cancelaciones por cumplimiento de la obligación de pago, si corresponde",
          type: "text",
          maxLength: 10,
          visibleWhen: { fieldId: "poseeInformacionEstadistica", equals: "si" },
        },
      ],
    },
    {
      id: "ejercicioDerechosTitulares",
      number: n(6),
      title: "Ejercicio de los derechos de los titulares del dato",
      description: "Indicar los medios a través de los cuales las personas pueden acceder, rectificar, actualizar y suprimir sus datos.",
      fields: [
        {
          id: "mediosEjercicioDerechos",
          label: "Medios disponibles",
          type: "checkboxGroup",
          required: true,
          options: [
            { value: "personalmente", label: "Personalmente" },
            { value: "notaEscrita", label: "Nota escrita" },
            { value: "correoElectronico", label: "Correo electrónico" },
            { value: "postalTelegrafico", label: "Medio postal o telegráfico" },
            { value: "telefonicamente", label: "Telefónicamente" },
            { value: "internet", label: "Internet" },
            { value: "otros", label: "Otros" },
          ],
        },
        {
          id: "mediosEjercicioDerechosOtrosEspecifique",
          label: "Especifique otro medio",
          type: "text",
          required: true,
          visibleWhen: { fieldId: "mediosEjercicioDerechos", equals: "otros" },
        },
        {
          id: "requerimientosTitular",
          label: "Requerimientos que debe cumplir el titular para incluir, modificar o suprimir los datos",
          type: "textarea",
          maxLength: 500,
        },
      ],
    },
    {
      id: "datosSometidos",
      number: n(7),
      title: "Datos sometidos al tratamiento en la Base de Datos",
      description:
        "Seleccione una, varias o todas las categorías de información incluida en la Base de Datos, según las subcategorías del Excel oficial (acceso público, crediticios, acceso restringido, sensibles).",
      fields: [
        { id: "cantidadDatos", label: "Cantidad de datos (indique el número)", type: "text", maxLength: 10 },
        {
          id: "cantidadPersonasSometidas",
          label: `Cantidad de personas ${personasSometidasLabel} sometidas al tratamiento`,
          type: "text",
          maxLength: 10,
        },
        {
          id: "datosAccesoPublico",
          label: "Datos personales de acceso público",
          type: "checkboxGroup",
          options: [
            { value: "cedula", label: "Cédula de identidad" },
            { value: "nombresApellidos", label: "Nombres y apellidos" },
            { value: "direccionReferencia", label: "Dirección de referencia" },
            { value: "propiedades", label: "Propiedades" },
            { value: "telefonoResidencial", label: "Teléfono residencial" },
            { value: "firma", label: "Firma" },
            { value: "estadoCivil", label: "Datos de estado civil" },
            { value: "sexo", label: "Sexo" },
            { value: "fechaNacimiento", label: "Fecha de nacimiento" },
            { value: "sociedadesAnonimas", label: "Pertenencia a sociedades anónimas" },
            { value: "nacionalidad", label: "Nacionalidad" },
            { value: "edad", label: "Edad" },
            { value: "otros", label: "Otros" },
          ],
        },
        {
          id: "datosAccesoPublicoOtrosEspecifique",
          label: "Aclare otros (acceso público)",
          type: "text",
          visibleWhen: { fieldId: "datosAccesoPublico", equals: "otros" },
        },
        {
          id: "datosCrediticios",
          label: "Datos crediticios",
          type: "checkboxGroup",
          options: [
            { value: "operacionesIncumplidas", label: "Operaciones incumplidas" },
            { value: "operacionesCanceladasAtraso", label: "Operaciones canceladas o extinguidas con atraso" },
            { value: "creditos", label: "Créditos" },
            ...(incluyeHipotecas ? [{ value: "hipotecas", label: "Hipotecas" }] : []),
          ],
        },
        {
          id: "datosAccesoRestringido",
          label: "Datos de acceso restringido",
          type: "checkboxGroup",
          options: [
            { value: "seguros", label: "Bases de datos de seguros" },
            ...(incluyeTelefonoCelularYOtros ? [{ value: "telefonoCelular", label: "Teléfono celular" }] : []),
            { value: "correoElectronico", label: "Correo electrónico" },
            { value: "direccionFisica", label: "Dirección física" },
            { value: "datosBancarios", label: "Datos bancarios" },
            ...(incluyeHistorialCreditos ? [{ value: "historialCreditos", label: "Historial de créditos" }] : []),
            { value: "informacionSalarial", label: "Información salarial" },
            { value: "informacionLaboral", label: "Información laboral" },
            ...(incluyeTelefonoCelularYOtros ? [{ value: "otros", label: "Otros" }] : []),
          ],
        },
        // La opción "otros" solo existe cuando incluyeTelefonoCelularYOtros;
        // sin ella este campo nunca sería visible.
        ...(incluyeTelefonoCelularYOtros
          ? ([
              {
                id: "datosAccesoRestringidoOtrosEspecifique",
                label: "Aclare otros (acceso restringido)",
                type: "text",
                visibleWhen: { fieldId: "datosAccesoRestringido", equals: "otros" },
              },
            ] as FormField[])
          : []),
        {
          id: "datosSensibles",
          label: "Datos sensibles",
          type: "checkboxGroup",
          options: [
            { value: "salud", label: "Salud" },
            { value: "vidaSexual", label: "Vida sexual" },
            { value: "religiosos", label: "Religiosos" },
            { value: "politicos", label: "Políticos" },
            { value: "biologicos", label: "Biológicos" },
            { value: "controlesBiometricos", label: "Controles biométricos" },
            { value: "certificadoFirmaElectronica", label: "Certificado de firma electrónica" },
            { value: "sindicales", label: "Sindicales" },
            { value: "origenRacialEtnico", label: "Origen racial o étnico" },
            { value: "telecomunicaciones", label: "Telecomunicaciones" },
            { value: "marketingPublicidad", label: "Marketing y publicidad" },
            { value: "fotografia", label: "Fotografía" },
            { value: "imagenVoz", label: "Imagen / voz" },
            { value: "otros", label: "Otros" },
          ],
        },
        {
          id: "datosSensiblesOtrosEspecifique",
          label: "Aclare otros (datos sensibles)",
          type: "text",
          visibleWhen: { fieldId: "datosSensibles", equals: "otros" },
        },
        { id: "observacionesDatosSometidos", label: "Observaciones", type: "textarea", maxLength: 400 },
      ],
    },
    {
      id: "procedimientoObtencion",
      number: n(8),
      title: "Procedimiento de obtención y tratamiento de datos",
      fields: [
        {
          id: "procedimientosObtencion",
          label: "Procedimientos habituales de obtención",
          type: "checkboxGroup",
          options: [
            { value: "formularios", label: "Formularios" },
            { value: "transmisionElectronica", label: "Transmisión electrónica" },
            { value: "encuestas", label: "Encuestas" },
            { value: "telemarketing", label: "Telemarketing" },
            { value: "entrevistasPersonales", label: "Entrevistas personales" },
            { value: "referenciasComerciales", label: "Referencias comerciales y/o personales" },
            { value: "convenios", label: "Convenios / contratos con otras empresas o instituciones (aportar contratos)" },
            { value: "noAplica", label: "No aplica" },
          ],
        },
        { id: "observacionesProcedimiento", label: "Observaciones", type: "textarea", maxLength: 400 },
        {
          id: "procedenciaDatos",
          label: "Procedencia de los datos",
          type: "checkboxGroup",
          options: [
            { value: "interesadoRepresentante", label: "Proporcionado por el interesado o su representante legal" },
            { value: "otrasPersonas", label: "Otras personas físicas o jurídicas distintas del afectado o su representante" },
            { value: "fuentesPublicas", label: "Fuentes públicas de información" },
            { value: "registrosPublicos", label: "Registros públicos" },
            { value: "institucionesPublicas", label: "Instituciones públicas" },
            { value: "empresasPrivadas", label: "Empresas privadas" },
            { value: "afiliadosBD", label: "Afiliados de la Base de Datos" },
          ],
        },
        { id: "procedenciaDatosAclare", label: "Aclarar procedencia (registros públicos, instituciones, empresas)", type: "textarea", maxLength: 400 },
        { id: "observacionesProcedencia", label: "Observaciones", type: "textarea", maxLength: 400 },
        {
          id: "soporteObtencion",
          label: "Soporte utilizado para la obtención",
          type: "checkboxGroup",
          options: [
            { value: "papel", label: "Papel" },
            { value: "informaticoMagnetico", label: "Soporte informático / magnético" },
            { value: "viaTelematica", label: "Vía telemática" },
            { value: "otros", label: "Otros" },
          ],
        },
        { id: "soporteObtencionOtrosEspecifique", label: "Aclare otro soporte", type: "text", visibleWhen: { fieldId: "soporteObtencion", equals: "otros" } },
        { id: "tiempoConservacion", label: "Tiempo de conservación de los datos colectados", type: "textarea", maxLength: 300 },
        { id: "finalidadTratamiento", label: "Finalidad de los datos tratados", type: "textarea", required: true, maxLength: 600 },
        {
          id: "realizaComunicaciones",
          label: "¿Realiza comunicaciones de datos?",
          type: "radio",
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "tipoComunicacion",
          label: "Comunicación de datos",
          type: "radio",
          visibleWhen: { fieldId: "realizaComunicaciones", equals: "si" },
          options: [
            { value: "gratuita", label: "Gratuita" },
            { value: "onerosa", label: "Onerosa" },
          ],
        },
        {
          id: "categoriasDestinatarios",
          label: "Categorías de destinatarios",
          type: "checkboxGroup",
          visibleWhen: { fieldId: "realizaComunicaciones", equals: "si" },
          options: [
            { value: "asociados", label: "Asociados" },
            { value: "socios", label: "Socios" },
          ],
        },
        {
          id: "cesionPorConvenio",
          label: "¿Cesión de datos por convenio o contrato?",
          type: "radio",
          visibleWhen: { fieldId: "realizaComunicaciones", equals: "si" },
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        { id: "observacionesComunicaciones", label: "Observaciones", type: "textarea", maxLength: 400 },
        {
          id: "realizaTransferenciasInternacionales",
          label: "¿Realiza transferencias internacionales?",
          type: "radio",
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "paisesDestinoInternacional",
          label: "País(es) de destino de los datos",
          type: "text",
          visibleWhen: { fieldId: "realizaTransferenciasInternacionales", equals: "si" },
        },
        { id: "observacionesTransferenciaInternacional", label: "Observaciones", type: "textarea", maxLength: 300, visibleWhen: { fieldId: "realizaTransferenciasInternacionales", equals: "si" } },
        {
          id: "realizaTransferenciasNacionales",
          label: "¿Realiza transferencias nacionales?",
          type: "radio",
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "paisesDestinoNacional",
          label: "País(es) de destino de los datos",
          type: "text",
          visibleWhen: { fieldId: "realizaTransferenciasNacionales", equals: "si" },
        },
        { id: "observacionesTransferenciaNacional", label: "Observaciones", type: "textarea", maxLength: 300, visibleWhen: { fieldId: "realizaTransferenciasNacionales", equals: "si" } },
      ],
    },
    {
      id: "medidasSeguridad",
      number: n(9),
      title: "Medidas de seguridad",
      fields: [
        {
          id: "adoptaMedidasSeguridad",
          label: "¿Adopta medidas de seguridad?",
          type: "radio",
          required: true,
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "tipoMedidas",
          label: "Las medidas adoptadas son",
          type: "checkboxGroup",
          visibleWhen: { fieldId: "adoptaMedidasSeguridad", equals: "si" },
          options: [
            { value: "fisicas", label: "Físicas" },
            { value: "logicas", label: "Lógicas" },
          ],
        },
        {
          id: "politicasSeguridad",
          label: "Políticas de seguridad",
          type: "checkboxGroup",
          options: [
            { value: "protocoloSeguridad", label: "Dispone de un protocolo de seguridad" },
            { value: "procedimientosDocumentados", label: "Documenta los procedimientos de acceso y tratamiento de la información" },
            { value: "funcionesDocumentadas", label: "Documenta las funciones y obligaciones del personal" },
            { value: "responsableSeguridad", label: "Existe un responsable de seguridad" },
            { value: "capacitacionPersonal", label: "Realiza procesos de capacitación al personal responsable" },
            { value: "controlPeriodico", label: "Realiza control periódico del cumplimiento de las políticas" },
            { value: "listadoProtocoloLey8968", label: "Cuenta con listado de protocolo según Reglamento a la Ley 8968" },
            { value: "adjuntaProtocolo", label: "Adjunta documentos de protocolo" },
            { value: "codigoTipo", label: "Cuenta o se ha adherido a un código tipo" },
          ],
        },
        {
          id: "auditorias",
          label: "Auditorías",
          type: "checkboxGroup",
          options: [
            { value: "realizaAuditorias", label: "Realiza auditorías del sistema de información periódicamente" },
            { value: "auditoresExternos", label: "Auditores externos" },
            { value: "auditoresInternos", label: "Auditores internos" },
            { value: "atiendeCorrecciones", label: "Atiende las correcciones realizadas por los auditores" },
            { value: "emiteInformes", label: "Emite informes al responsable de la Base de Datos" },
            { value: "disponeInspeccionProdhab", label: "Dispone a inspección de la Base de Datos por PRODHAB" },
          ],
        },
        {
          id: "respaldos",
          label: "Respaldos",
          type: "checkboxGroup",
          options: [
            { value: "procedimientoRespaldoSeguro", label: "Dispone de un procedimiento de respaldo seguro" },
            { value: "respaldoMismoLugar", label: "Realiza respaldos en el mismo lugar donde están los servidores" },
            { value: "respaldoLugarDiferente", label: "Realiza respaldos en un lugar diferente al de los equipos" },
            { value: "respaldoDiario", label: "Respaldo diario" },
            { value: "respaldoSemanal", label: "Respaldo semanal" },
            { value: "respaldoMensual", label: "Respaldo mensual" },
            { value: "verificaRespaldos", label: "Verifica la realización de respaldos y la recuperación de datos" },
            { value: "recuperaAlMomentoExacto", label: "Permite recuperar los datos al momento exacto de la pérdida o destrucción" },
          ],
        },
        {
          id: "controlRegistroAcceso",
          label: "Control y registro de acceso",
          type: "checkboxGroup",
          options: [
            { value: "nivelesSeguridad", label: "Posee diferentes niveles de seguridad según funciones" },
            { value: "usuarioContrasena", label: "Acceso a la información mediante usuario y contraseña" },
            { value: "identificacionInequivoca", label: "Identificación inequívoca de usuarios con contraseñas que se actualizan periódicamente" },
            { value: "controlAccesosNoAutorizados", label: "Controla accesos no autorizados" },
            { value: "registroAccesos", label: "Registro de accesos y modificaciones (usuario, hora, tipo, objetivo, tarea)" },
            { value: "conservaVersiones", label: "Conserva versiones de registros ante cada modificación" },
            { value: "controlAccesoFisico", label: "Controla el acceso físico a los locales donde están los sistemas" },
            { value: "accesoRemotoSeguro", label: "El acceso remoto mantiene las medidas de seguridad del acceso local" },
          ],
        },
        {
          id: "transferenciaDatosSeguridad",
          label: "Transferencia de datos",
          type: "checkboxGroup",
          options: [{ value: "datosCifrados", label: "Los datos se transmiten cifrados" }],
        },
        { id: "destinatariosTransferencia", label: "Detalle destinatarios de la(s) transferencia(s) de datos personales", type: "textarea", maxLength: 400 },
        {
          id: "soporteMantenimiento",
          label: "Soporte, mantenimiento y pruebas",
          type: "checkboxGroup",
          options: [
            { value: "accesoRestringido", label: "Las bases de datos tienen acceso restringido" },
            { value: "controlEntradaSalidaSoporte", label: "Control de entrada y salida de personal que realiza soporte" },
            { value: "medidasPruebas", label: "Medidas de seguridad para pruebas al realizar soporte" },
          ],
        },
        { id: "observacionesMedidasSeguridad", label: "Observaciones", type: "textarea", maxLength: 500 },
      ],
    },
    {
      id: "descripcionTecnica",
      number: n(10),
      title: "Descripción técnica de la Base de Datos",
      fields: [
        {
          id: "soporteRegistro",
          label: "Soporte utilizado para registrar los datos",
          type: "checkboxGroup",
          required: true,
          options: [
            { value: "manual", label: "Manual" },
            { value: "informatizado", label: "Informatizado" },
            { value: "otros", label: "Otros" },
          ],
        },
        { id: "soporteRegistroOtrosEspecifique", label: "Describa brevemente otro soporte", type: "text", visibleWhen: { fieldId: "soporteRegistro", equals: "otros" } },
        { id: "descripcionGeneralSistema", label: "Descripción general del sistema de información", type: "textarea", required: true, maxLength: 600 },
        {
          id: "componentesSistema",
          label: "Componentes",
          type: "checkboxGroup",
          options: [
            { value: "servidoresCentrales", label: "Servidores centrales" },
            { value: "ordenadoresPersonales", label: "Ordenadores personales" },
            { value: "otros", label: "Otros" },
          ],
        },
        { id: "componentesSistemaOtrosEspecifique", label: "Describa brevemente otros componentes", type: "text", visibleWhen: { fieldId: "componentesSistema", equals: "otros" } },
        {
          id: "existenConexionesRemotas",
          label: "¿Existen conexiones remotas?",
          type: "radio",
          options: [
            { value: "si", label: "Sí" },
            { value: "no", label: "No" },
          ],
        },
        {
          id: "tipoConexion",
          label: "Tipo de conexión",
          type: "radio",
          visibleWhen: { fieldId: "existenConexionesRemotas", equals: "si" },
          options: [
            { value: "redCorporativa", label: "Red corporativa" },
            { value: "intranet", label: "Intranet" },
            { value: "internet", label: "Internet" },
          ],
        },
        {
          id: "urlPaginaWeb",
          label: "En caso de tratarse de una página web, indicar URL",
          type: "text",
          maxLength: 200,
          visibleWhen: { fieldId: "tipoConexion", equals: "internet" },
        },
      ],
    },
    {
      id: "declaracionJurada",
      number: n(11),
      title: "Declaración jurada",
      description:
        "Al completar este formulario declara bajo fe de juramento que la información suministrada es verdadera. Cualquier falsedad o inexactitud faculta a PRODHAB a revocar la inscripción, sin perjuicio de las sanciones penales y administrativas correspondientes.",
      fields: [
        { id: "firmaAclaracion", label: "Aclaración de firma", type: "text", required: true, maxLength: 120 },
        { id: "fechaDeclaracion", label: "Fecha", type: "date", required: true },
        { id: "observacionesFinales", label: "Observaciones", type: "textarea", maxLength: 500 },
      ],
    },
  ];
}
