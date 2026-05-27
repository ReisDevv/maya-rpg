import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, Button, EmptyState, ShellTitle } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Search, Dumbbell, Video, Tag } from "lucide-react";
import { exerciseService } from "@/services/exercise.service";
import { ExerciseCategory } from "@/types";

export const Route = createFileRoute("/exercicios")({
  head: () => ({
    meta: [
      { title: "Exercícios — Maya RPG" },
      {
        name: "description",
        content: "Biblioteca de exercícios da clínica organizados por categoria e tratamento.",
      },
    ],
  }),
  component: ExerciciosLayout,
});

function ExerciciosLayout() {
  const matchRoute = useMatchRoute();
  const isChild =
    matchRoute({ to: "/exercicios/novo" }) ||
    matchRoute({ to: "/exercicios/$id" });
  if (isChild) return <Outlet />;
  return <ExerciciosPage />;
}

const categoryOptions = [
  { value: "", label: "Todas" },
  { value: ExerciseCategory.STRETCHING, label: "Alongamento" },
  { value: ExerciseCategory.STRENGTHENING, label: "Fortalecimento" },
  { value: ExerciseCategory.POSTURE, label: "Postura" },
  { value: ExerciseCategory.BREATHING, label: "Respiração" },
  { value: ExerciseCategory.MOBILITY, label: "Mobilidade" },
  { value: ExerciseCategory.BALANCE, label: "Equilíbrio" },
];

const categoryLabelMap: Record<string, string> = {
  STRETCHING: "Alongamento",
  STRENGTHENING: "Fortalecimento",
  POSTURE: "Postura",
  BREATHING: "Respiração",
  MOBILITY: "Mobilidade",
  BALANCE: "Equilíbrio",
};

function ExerciciosPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => exerciseService.getAll({ page: 1, pageSize: 100 }),
  });

  const exercicios = (data?.data ?? []).filter((e) => {
    const qLower = q.toLowerCase();
    const matchesQ =
      !q ||
      e.title.toLowerCase().includes(qLower) ||
      (e.description?.toLowerCase().includes(qLower) ?? false) ||
      (e.instructions?.toLowerCase().includes(qLower) ?? false) ||
      (e.tags?.some((t) => t.toLowerCase().includes(qLower)) ?? false);
    const matchesCat = !cat || e.category === cat;
    return matchesQ && matchesCat;
  });

  return (
    <>
      <ShellTitle
        title="Banco de exercícios"
        subtitle="Catálogo clínico com instruções, vídeos e sequências de imagens."
        actions={
          <Button variant="primary" asChild>
            <Link to="/exercicios/novo">
              <Plus className="h-4 w-4" /> Novo exercício
            </Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <Card>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título, descrição, instruções ou tag…"
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-background p-1">
              {categoryOptions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCat(c.value)}
                  className={
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition " +
                    (cat === c.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : exercicios.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Nenhum exercício cadastrado"
            description="Crie o primeiro exercício para começar a montar prescrições."
            action={
              <Button variant="primary" asChild>
                <Link to="/exercicios/novo">
                  <Plus className="h-4 w-4" /> Novo exercício
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {exercicios.map((e) => (
              <Card key={e.id} className="group flex flex-col">
                <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-gradient-hero">
                  <div className="absolute inset-0 grid place-items-center text-primary/40">
                    <Dumbbell className="h-12 w-12" />
                  </div>
                  <StatusBadge status="Ativo" />
                  {e.videoUrl && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[10px] backdrop-blur">
                      <Video className="h-3 w-3" /> Vídeo
                    </span>
                  )}
                </div>
                <Badge tone="gold">{categoryLabelMap[e.category] ?? e.category}</Badge>
                <h3 className="mt-2 font-display text-lg">{e.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
                {e.tags && e.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {e.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        <Tag className="h-3 w-3" /> {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>Atualizado {new Date(e.updatedAt).toLocaleDateString("pt-BR")}</span>
                  <Link
                    to="/exercicios/$id"
                    params={{ id: e.id }}
                    className="font-medium text-primary hover:underline"
                  >
                    Ver detalhes →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
