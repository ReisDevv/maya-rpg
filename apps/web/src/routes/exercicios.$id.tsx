import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { exerciseService } from "@/services/exercise.service";
import { Card, Badge, Button, ShellTitle } from "@/components/app-shell";
import { ArrowLeft, Dumbbell, Video, Tag, CalendarDays, Clock, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoryLabelMap: Record<string, string> = {
  STRETCHING: "Alongamento",
  STRENGTHENING: "Fortalecimento",
  POSTURE: "Postura",
  BREATHING: "Respiração",
  MOBILITY: "Mobilidade",
  BALANCE: "Equilíbrio",
};

export const Route = createFileRoute("/exercicios/$id")({
  head: () => ({
    meta: [
      { title: "Exercício — Maya RPG" },
      { name: "description", content: "Detalhes do exercício." },
    ],
  }),
  loader: async ({ params }) => {
    try {
      return await exerciseService.getById(params.id);
    } catch {
      throw notFound();
    }
  },
  component: ExercicioDetalhe,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="font-medium">Exercício não encontrado</p>
      <Button asChild variant="outline">
        <Link to="/exercicios">Voltar para exercícios</Link>
      </Button>
    </div>
  ),
});

function ImageCarousel({ urls }: { urls: string[] }) {
  const [current, setCurrent] = useState(0);
  if (urls.length === 0) return null;

  return (
    <Card>
      <h4 className="font-display text-sm flex items-center gap-2">
        <Images className="h-4 w-4" /> Sequência de imagens
      </h4>
      <div className="mt-3 relative">
        <div className="aspect-video overflow-hidden rounded-xl bg-muted">
          <img
            src={urls[current]}
            alt={`Imagem ${current + 1} de ${urls.length}`}
            className="h-full w-full object-contain"
          />
        </div>
        {urls.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + urls.length) % urls.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % urls.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 shadow backdrop-blur hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="mt-2 flex justify-center gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`aspect-square overflow-hidden rounded-lg border-2 transition ${
              i === current ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </Card>
  );
}

function ExercicioDetalhe() {
  const e = Route.useLoaderData();

  return (
    <>
      <ShellTitle title={e.title} subtitle={categoryLabelMap[e.category] ?? e.category} />

      <div className="space-y-5">
        <Button asChild variant="ghost" className="-ml-2">
          <Link to="/exercicios">
            <ArrowLeft className="mr-1 h-4 w-4" /> Exercícios
          </Link>
        </Button>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="gold">{categoryLabelMap[e.category] ?? e.category}</Badge>
                {e.videoUrl && (
                  <Badge tone="primary">
                    <Video className="h-3 w-3" /> Vídeo
                  </Badge>
                )}
                {e.imageUrls && e.imageUrls.length > 0 && (
                  <Badge tone="primary">
                    <Images className="h-3 w-3" /> {e.imageUrls.length} {e.imageUrls.length === 1 ? "imagem" : "imagens"}
                  </Badge>
                )}
              </div>

              <h2 className="mt-4 font-display text-2xl">{e.title}</h2>

              {e.description && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Descrição
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground">{e.description}</p>
                </div>
              )}

              {e.instructions && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Instruções
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-line">
                    {e.instructions}
                  </p>
                </div>
              )}

              {e.tags && e.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tags
                  </h4>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {e.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        <Tag className="h-3 w-3" /> {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {e.imageUrls && e.imageUrls.length > 0 && (
              <ImageCarousel urls={e.imageUrls} />
            )}

            {e.videoUrl && (
              <Card>
                <h4 className="font-display text-sm flex items-center gap-2">
                  <Video className="h-4 w-4" /> Vídeo demonstrativo
                </h4>
                <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-muted">
                  <iframe
                    src={e.videoUrl}
                    className="h-full w-full"
                    allowFullScreen
                    title={e.title}
                  />
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-5">
            <Card>
              <h4 className="font-display text-sm">Informações</h4>
              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Dumbbell className="h-4 w-4" />
                  <span>{categoryLabelMap[e.category] ?? e.category}</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Criado em{" "}
                    {format(new Date(e.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Atualizado em{" "}
                    {format(new Date(e.updatedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
