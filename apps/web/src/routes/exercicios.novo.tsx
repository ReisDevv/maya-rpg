import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, ShellTitle, Field } from "@/components/app-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/utils";
import { exerciseService } from "@/services/exercise.service";
import { mediaService } from "@/services/media.service";
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

interface ImagePreview {
  file: File;
  objectUrl: string;
}

function NovoExercicio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async () => {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setUploading(true);
        try {
          imageUrls = await mediaService.uploadMultiple(images.map((i) => i.file));
        } finally {
          setUploading(false);
        }
      }
      return exerciseService.create({
        title,
        category: category as ExerciseCategory,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description,
        instructions,
        videoUrl: videoUrl || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      });
    },
    onSuccess: async () => {
      images.forEach((i) => URL.revokeObjectURL(i.objectUrl));
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = 10 - images.length;
    if (remaining <= 0) {
      toast.error("Máximo de 10 imagens atingido");
      return;
    }

    const accepted = files.slice(0, remaining).map((file) => ({
      file,
      objectUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...accepted]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].objectUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const isPending = createMutation.isPending || uploading;

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
                placeholder="https://youtube.com/embed/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Cole a URL de incorporação do YouTube ou Vimeo.
              </p>
            </Field>

            {videoUrl && (
              <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                <iframe
                  src={videoUrl}
                  className="h-full w-full"
                  allowFullScreen
                  title="Prévia do vídeo"
                />
              </div>
            )}

            <Field label={`Imagens da sequência${images.length > 0 ? ` (${images.length}/10)` : ""}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {images.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1.5 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 py-8 text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <UploadCloud className="h-7 w-7" />
                  <span className="text-xs">Clique para adicionar imagens</span>
                  <span className="text-xs opacity-60">JPG ou PNG · até 50 MB cada</span>
                </button>
              ) : (
                <div className="mt-1.5 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square">
                        <img
                          src={img.objectUrl}
                          alt={`Imagem ${i + 1}`}
                          className="h-full w-full rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/40 grid place-items-center text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to="/exercicios">Cancelar</Link>
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploading ? "Enviando imagens..." : "Salvando..."}
            </>
          ) : (
            "Salvar Exercício"
          )}
        </Button>
      </div>
    </>
  );
}
