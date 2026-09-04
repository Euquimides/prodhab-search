import Footer from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { FormWizard } from "@/components/formularios/FormWizard";
import { PrivacyNotice } from "@/components/formularios/PrivacyNotice";
import { personasJuridicasSchema } from "@/schemas/personas-juridicas.schema";

export default function PersonasJuridicasFormPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <SiteHeader subtitle="Formularios · Persona jurídica" />

      <div className="mx-auto max-w-5xl px-6 py-8 md:py-12 flex-1 w-full">
        <PrivacyNotice />
        <FormWizard schema={personasJuridicasSchema} />
      </div>
      <Footer />
    </div>
  );
}
