import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Button, ShellTitle } from "@/components/app-shell";
import { PatientForm } from "@/components/patient-form";
import {
  isPatientFormValid,
  patientFormToPayload,
  patientToFormValues,
  type PatientFormValues,
} from "@/lib/patient-form";
import { patientService } from "@/services/patient.service";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";

export const Route = createFileRoute("/pacientes/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar paciente — Maya RPG" },
      { name: "description", content: "Atualize os dados cadastrais do paciente." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      return await patientService.getById(params.id);
    } catch {
      throw notFound();
    }
  },
  component: EditarPaciente,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="font-medium">Paciente não encontrado</p>
      <Button asChild variant="outline">
        <Link to="/pacientes">Voltar para pacientes</Link>
      </Button>
    </div>
  ),
});

function EditarPaciente() {
  const patient = Route.useLoaderData();
  const [form, setForm] = useState<PatientFormValues>(() => patientToFormValues(patient));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () => patientService.update(patient.id, patientFormToPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Dados do paciente atualizados");
      navigate({ to: "/pacientes/$id", params: { id: patient.id } });
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err) ?? "Erro ao atualizar paciente");
    },
  });

  const handleSubmit = () => {
    if (!isPatientFormValid(form)) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <>
      <ShellTitle
        title="Editar paciente"
        subtitle={patient.fullName}
        actions={
          <Button variant="outline" asChild>
            <Link to="/pacientes/$id" params={{ id: patient.id }}>
              <ArrowLeft className="h-4 w-4" />
              Detalhes
            </Link>
          </Button>
        }
      />

      <PatientForm
        values={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
        isSubmitting={updateMutation.isPending}
        cancelAction={
          <Button variant="outline" asChild>
            <Link to="/pacientes/$id" params={{ id: patient.id }}>
              <X className="h-4 w-4" />
              Cancelar
            </Link>
          </Button>
        }
      />
    </>
  );
}
