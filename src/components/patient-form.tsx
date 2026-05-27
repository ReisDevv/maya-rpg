import { Link } from "@tanstack/react-router";
import type { FormEvent, ReactNode } from "react";
import { Calendar, Check, IdCard, Mail, Phone, Save, StickyNote, UserRound, X } from "lucide-react";
import { Button, Card, Field } from "@/components/app-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCpf, formatPhone, onlyDigits } from "@/lib/input-masks";
import { PatientStatus } from "@/types";
import type { PatientFormValues } from "@/lib/patient-form";

const statusOptions = [
  { value: PatientStatus.ACTIVE, label: "Ativo" },
  { value: PatientStatus.PENDING, label: "Pendente" },
  { value: PatientStatus.INACTIVE, label: "Inativo" },
];

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60";

const textareaCls =
  "min-h-[130px] w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60";

export function PatientForm({
  values,
  onChange,
  onSubmit,
  submitLabel,
  submittingLabel = "Salvando...",
  isSubmitting,
  cancelAction,
}: {
  values: PatientFormValues;
  onChange: (values: PatientFormValues) => void;
  onSubmit: () => void;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  cancelAction?: ReactNode;
}) {
  const update = <Key extends keyof PatientFormValues>(key: Key, value: PatientFormValues[Key]) => {
    onChange({ ...values, [key]: value });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 text-primary">
            <UserRound className="h-4 w-4" />
            <h3 className="font-display text-lg">Dados pessoais</h3>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Nome completo">
                <input
                  className={inputCls}
                  value={values.fullName}
                  onChange={(event) => update("fullName", event.target.value)}
                  placeholder="Nome completo"
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </Field>
            </div>

            <Field label="CPF">
              <div className="relative">
                <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={inputCls + " pl-10"}
                  value={formatCpf(values.cpf)}
                  onChange={(event) => update("cpf", onlyDigits(event.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  disabled={isSubmitting}
                />
              </div>
            </Field>

            <Field label="Data de nascimento">
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={inputCls + " pl-10"}
                  type="date"
                  value={values.birthDate}
                  onChange={(event) => update("birthDate", event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </Field>

            <Field label="E-mail">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={inputCls + " pl-10"}
                  type="email"
                  value={values.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="email@exemplo.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
            </Field>

            <Field label="Telefone">
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className={inputCls + " pl-10"}
                  value={formatPhone(values.phone)}
                  onChange={(event) => update("phone", onlyDigits(event.target.value))}
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  inputMode="tel"
                  disabled={isSubmitting}
                />
              </div>
            </Field>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2 text-primary">
              <Check className="h-4 w-4" />
              <h3 className="font-display text-lg">Status</h3>
            </div>

            <div className="mt-4">
              <Field label="Situação cadastral">
                <Select
                  value={values.status}
                  onValueChange={(value) => update("status", value as PatientStatus)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-primary">
              <StickyNote className="h-4 w-4" />
              <h3 className="font-display text-lg">Observações</h3>
            </div>

            <div className="mt-4">
              <textarea
                className={textareaCls}
                value={values.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Observações clínicas ou administrativas"
                disabled={isSubmitting}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {cancelAction ?? (
          <Button variant="outline" asChild>
            <Link to="/pacientes">
              <X className="h-4 w-4" />
              Cancelar
            </Link>
          </Button>
        )}
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
