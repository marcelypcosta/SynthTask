import ToolIntegrationCard from "@/components/connections/tool-integration-card";

export default function ConnectionsPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-neutral-800 mt-2">
          Conexões
        </h1>
        <p className="text-neutral-600">
          Conecte-se as suas ferramentas de gerenciamento de projetos.
        </p>
      </header>
      <div className="w-full flex flex-col gap-6">
        <div className="w-full">
          <h2 className="font-medium text-md mb-2">Ferramentas disponíveis</h2>
          <ToolIntegrationCard toolName="Jira" connected={false} />
        </div>
        <div className="w-full">
          <h2 className="font-medium text-md mb-2">Ferramentas conectadas</h2>
          <ToolIntegrationCard toolName="Trello" connected={true} />
        </div>
      </div>
    </>
  );
}
