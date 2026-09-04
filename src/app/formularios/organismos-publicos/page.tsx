import Footer from "@/components/Footer";
import { SiteHeader } from "@/components/SiteHeader";
import { FormWizard } from "@/components/formularios/FormWizard";
import { PrivacyNotice } from "@/components/formularios/PrivacyNotice";
import { organismosPublicosSchema } from "@/schemas/organismos-publicos.schema";

export default function OrganismosPublicosFormPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <SiteHeader subtitle="Formularios · Organismo público" />

      <div className="mx-auto max-w-5xl px-6 py-8 md:py-12 flex-1 w-full">
        <PrivacyNotice />
        <FormWizard schema={organismosPublicosSchema} />
      </div>
      <Footer />
    </div>
  );
}
