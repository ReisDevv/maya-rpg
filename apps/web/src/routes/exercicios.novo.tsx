import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, ShellTitle, Field } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";
import { exerciseService } from "@/services/exercise.service";
import { ExerciseCategory } from "@/types";

export const Route = createFileRoute("/exercicios/novo")({
  head: () => ({
    meta: [
      { title: "Novo Exercício — Maya RPG" },
      { name: "description", content: "Cadastre um novo exercício na biblioteca da clínica." },
    ],
  }),
  component: NovoExercicio,
});

const categoryOptions = [
  { value: ExerciseCategory.STRETCHING, label: "Alongamento" },
  { value: ExerciseCategory.STRENGTHENING, label: "Fortalecimento" },
  { value: ExerciseCategory.POSTURE, label: "Postura" },
  { value: ExerciseCategory.BREATHING, label: "Respiração" },
  { value: ExerciseCategory.MOBILITY, label: "Mobilidade" },
  { value: ExerciseCategory.BALANCE, label: "Equilíbrio" },
];

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary";

function NovoExercicio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      exerciseService.create({
        title,
        category: category as ExerciseCategory,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description,
        instructions,
        videoUrl: videoUrl || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exercises"] });
      toast.success("Exercício salvo");
      navigate({ to: "/exercicios" });
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err) ?? "Erro ao salvar exercício");
    },
  });

  const onSubmit = () => {
    if (!title || !category || !instructions) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createMutation.mutate();
  };

  return (
    <>
      <ShellTitle
        title="Novo Exercício"
        subtitle="Cadastre um exercício para usar em prescrições."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-display text-lg">Informações Gerais</h3>
          <div className="mt-4 space-y-4">
            <Field label="Título do Exercício">
              <input
                className={inputCls}
                placeholder="Ex: Alongamento de cadeia posterior"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tags">
                <input
                  className={inputCls}
                  placeholder="postura, cervical, lombar..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Descrição Curta">
              <input
                className={inputCls}
                placeholder="Resumo em uma linha"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field label="Instruções Detalhadas">
              <textarea
                className={inputCls + " min-h-[140px]"}
                placeholder="Passo a passo da execução…"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg">Mídias e Vídeos</h3>
          <div className="mt-4 space-y-4">
            <Field label="URL do vídeo">
              <input
                className={inputCls}
                placeholder="https://"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </Field>
            <Field label="Imagens da sequência">
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/40 grid place-items-center text-muted-foreground"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </div>
                ))}
              </div>
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to="/exercicios">Cancelar</Link>
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Salvando..." : "Salvar Exercício"}
        </Button>
      </div>
    </>
  );
}
