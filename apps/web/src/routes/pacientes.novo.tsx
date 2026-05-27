import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, ShellTitle } from "@/components/app-shell";
import { PatientForm } from "@/components/patient-form";
import {
  emptyPatientForm,
  isPatientFormValid,
  patientFormToPayload,
  type PatientFormValues,
} from "@/lib/patient-form";
import { patientService } from "@/services/patient.service";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";

export const Route = createFileRoute("/pacientes/novo")({
  head: () => ({
    meta: [
      { title: "Novo paciente — Maya RPG" },
      { name: "description", content: "Cadastre um novo paciente na clínica." },
    ],
  }),
  component: NovoPaciente,
});

function NovoPaciente() {
  const [form, setForm] = useState<PatientFormValues>(emptyPatientForm);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => patientService.create(patientFormToPayload(form)),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente cadastrado com sucesso");
      navigate({ to: "/pacientes/$id", params: { id: created.id } });
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err) ?? "Erro ao cadastrar paciente");
    },
  });

  const handleSubmit = () => {
    if (!isPatientFormValid(form)) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createMutation.mutate();
  };

  return (
    <>
      <ShellTitle
        title="Novo paciente"
        subtitle="Cadastre os dados pessoais e a situação cadastral."
        actions={
          <Button variant="outline" asChild>
            <Link to="/pacientes">
              <ArrowLeft className="h-4 w-4" />
              Pacientes
            </Link>
          </Button>
        }
      />

      <PatientForm
        values={form}
        onChange={setForm}
        onSubmit={handleSubmit}
        submitLabel="Cadastrar paciente"
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
