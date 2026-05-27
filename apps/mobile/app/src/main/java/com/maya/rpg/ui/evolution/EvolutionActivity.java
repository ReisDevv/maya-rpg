package com.maya.rpg.ui.evolution;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.db.AppDatabase;
import com.maya.rpg.db.entity.ExerciseSession;
import com.maya.rpg.model.CheckInHistoryResponse;
import com.maya.rpg.model.MedicalRecord;
import com.maya.rpg.model.PaginatedResponse;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EvolutionActivity extends BaseAuthActivity {

    private TextView tvPainAvg, tvTrend, tvTrendLabel, tvFeelingAvg;
    private TextView tvTotalSessions, tvSessionsLabel, tvHeatmapStreak;
    private LinearLayout layoutHeatmap, layoutAchievements;
    private RecyclerView rvReports;
    private TextView tvReportsLabel;
    private List<CheckInHistoryResponse> checkInHistory = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_evolution);

        tvPainAvg = findViewById(R.id.tvPainAvg);
        tvTrend = findViewById(R.id.tvTrend);
        tvTrendLabel = findViewById(R.id.tvTrendLabel);
        tvFeelingAvg = findViewById(R.id.tvFeelingAvg);
        tvTotalSessions = findViewById(R.id.tvTotalSessions);
        tvSessionsLabel = findViewById(R.id.tvSessionsLabel);
        tvHeatmapStreak = findViewById(R.id.tvHeatmapStreak);
        layoutHeatmap = findViewById(R.id.layoutHeatmap);
        layoutAchievements = findViewById(R.id.layoutAchievements);
        rvReports = findViewById(R.id.rvReports);
        tvReportsLabel = findViewById(R.id.tvReportsLabel);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        setupBottomNav();
        loadHistoryLocal(); // mostra dados locais imediatamente
        loadHistoryFromApi(); // substitui com dados da API quando chegar
        loadMedicalRecords();
    }

    // ─── DADOS ───────────────────────────────────────────────────────────────

    // Lê do Room local para exibição imediata (inclui sessões ainda não sincronizadas)
    private void loadHistoryLocal() {
        String patientId = TokenManager.getPatientId();
        if (patientId == null) return;

        Executors.newSingleThreadExecutor().execute(() -> {
            AppDatabase db = AppDatabase.getInstance(this);
            List<ExerciseSession> sessions = db.exerciseSessionDao().getByPatient(patientId);

            // Converte ExerciseSession → CheckInHistoryResponse para reutilizar a lógica de render
            List<CheckInHistoryResponse> localHistory = new ArrayList<>();
            SimpleDateFormat isoFmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            isoFmt.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));

            for (ExerciseSession s : sessions) {
                CheckInHistoryResponse c = new CheckInHistoryResponse();
                c.setPainLevel(s.getPainLevel());
                c.setFeelingLevel(s.getFeelingLevel());
                c.setExecutedAt(isoFmt.format(new Date(s.getCompletedAt())));
                localHistory.add(c);
            }

            runOnUiThread(() -> {
                if (isFinishing() || isDestroyed()) return;
                if (!localHistory.isEmpty() && checkInHistory.isEmpty()) {
                    checkInHistory = localHistory;
                    renderStats();
                    renderHeatmap();
                    renderAchievements();
                }
            });
        });
    }

    // Busca da API e atualiza com dados oficiais (inclui histórico completo)
    private void loadHistoryFromApi() {
        RetrofitClient.getApiService().getMyHistory(200).enqueue(new Callback<PaginatedResponse<CheckInHistoryResponse>>() {
            @Override
            public void onResponse(Call<PaginatedResponse<CheckInHistoryResponse>> call,
                                   Response<PaginatedResponse<CheckInHistoryResponse>> response) {
                if (response.isSuccessful() && response.body() != null
                        && response.body().getData() != null
                        && !response.body().getData().isEmpty()) {
                    checkInHistory = response.body().getData();
                    renderStats();
                    renderHeatmap();
                    renderAchievements();
                }
                // Se API retornar vazio e local já renderizou, mantém o que tem
            }

            @Override
            public void onFailure(Call<PaginatedResponse<CheckInHistoryResponse>> call, Throwable t) {
                // Mantém dados locais se já foram carregados
                if (checkInHistory.isEmpty()) {
                    renderStats();
                    renderHeatmap();
                    renderAchievements();
                }
            }
        });
    }

    private void loadMedicalRecords() {
        RetrofitClient.getApiService().getMyMedicalRecords().enqueue(
                new Callback<PaginatedResponse<MedicalRecord>>() {
                    @Override
                    public void onResponse(Call<PaginatedResponse<MedicalRecord>> call,
                                           Response<PaginatedResponse<MedicalRecord>> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            renderMedicalRecords(response.body().getData());
                        } else {
                            tvReportsLabel.setVisibility(View.GONE);
                            rvReports.setVisibility(View.GONE);
                        }
                    }

                    @Override
                    public void onFailure(Call<PaginatedResponse<MedicalRecord>> call, Throwable t) {
                        tvReportsLabel.setVisibility(View.GONE);
                        rvReports.setVisibility(View.GONE);
                    }
                });
    }

    // ─── CARDS DE ESTATÍSTICAS ────────────────────────────────────────────────

    private void renderStats() {
        if (checkInHistory.isEmpty()) {
            tvPainAvg.setText("–");
            tvTrend.setText("–");
            tvTrendLabel.setText("sem dados ainda");
            tvFeelingAvg.setText("–");
            tvTotalSessions.setText("0");
            tvSessionsLabel.setText("complete a primeira sessão!");
            return;
        }

        // Dor média geral
        double painSum = 0;
        int painCount = 0;
        for (CheckInHistoryResponse c : checkInHistory) {
            painSum += c.getPainLevel();
            painCount++;
        }
        double painAvg = painSum / painCount;
        tvPainAvg.setText(String.format(Locale.US, "%.1f", painAvg / 10.0 * 10)); // 0-10
        // Cor da dor: verde se <= 4, amarelo se <= 7, vermelho se > 7
        int painColor = painAvg <= 40 ? Color.parseColor("#2E7D32")
                : painAvg <= 70 ? Color.parseColor("#F57C00")
                : Color.parseColor("#C62828");
        tvPainAvg.setTextColor(painColor);

        // Tendência: compara primeira metade vs segunda metade
        int half = checkInHistory.size() / 2;
        if (half > 0) {
            // Lista vem mais recente primeiro (desc) — segunda metade = mais antigo
            List<CheckInHistoryResponse> recent = checkInHistory.subList(0, half);
            List<CheckInHistoryResponse> older = checkInHistory.subList(half, checkInHistory.size());
            double recentPain = 0, olderPain = 0;
            for (CheckInHistoryResponse c : recent) recentPain += c.getPainLevel();
            for (CheckInHistoryResponse c : older) olderPain += c.getPainLevel();
            recentPain /= recent.size();
            olderPain /= older.size();
            double diff = olderPain - recentPain; // positivo = melhorou (dor caiu)
            int pct = (int) Math.abs(diff / Math.max(olderPain, 1) * 100);
            if (diff > 5) {
                tvTrend.setText("↓ " + pct + "%");
                tvTrend.setTextColor(Color.parseColor("#2E7D32"));
                tvTrendLabel.setText("dor reduzindo ✓");
                tvTrendLabel.setTextColor(Color.parseColor("#2E7D32"));
            } else if (diff < -5) {
                tvTrend.setText("↑ " + pct + "%");
                tvTrend.setTextColor(Color.parseColor("#C62828"));
                tvTrendLabel.setText("dor aumentando");
                tvTrendLabel.setTextColor(Color.parseColor("#C62828"));
            } else {
                tvTrend.setText("→");
                tvTrend.setTextColor(Color.parseColor("#F57C00"));
                tvTrendLabel.setText("estável");
                tvTrendLabel.setTextColor(Color.GRAY);
            }
        } else {
            tvTrend.setText("–");
            tvTrendLabel.setText("poucas sessões");
        }

        // Feeling médio
        double feelSum = 0;
        int feelCount = 0;
        for (CheckInHistoryResponse c : checkInHistory) {
            if (c.getFeelingLevel() > 0) { feelSum += c.getFeelingLevel(); feelCount++; }
        }
        if (feelCount > 0) {
            double feelAvg = feelSum / feelCount;
            tvFeelingAvg.setText(String.format(Locale.US, "%.1f", feelAvg));
            int feelColor = feelAvg >= 4 ? Color.parseColor("#2E7D32")
                    : feelAvg >= 3 ? Color.parseColor("#F57C00")
                    : Color.parseColor("#C62828");
            tvFeelingAvg.setTextColor(feelColor);
        } else {
            tvFeelingAvg.setText("–");
        }

        // Total de sessões
        tvTotalSessions.setText(String.valueOf(checkInHistory.size()));
        int weeks = calcWeekStreak();
        tvSessionsLabel.setText(weeks > 0 ? "🔥 " + weeks + " dias esta semana" : "check-ins registrados");
    }

    // ─── HEATMAP ──────────────────────────────────────────────────────────────

    private void renderHeatmap() {
        layoutHeatmap.removeAllViews();

        // Monta mapa de datas com contagem de check-ins
        Map<String, Integer> countByDate = new HashMap<>();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        for (CheckInHistoryResponse c : checkInHistory) {
            if (c.getExecutedAt() == null || c.getExecutedAt().length() < 10) continue;
            String date = c.getExecutedAt().substring(0, 10);
            countByDate.merge(date, 1, Integer::sum);
        }

        // Últimas 10 semanas — de segunda a domingo
        Calendar cal = Calendar.getInstance();
        cal.setFirstDayOfWeek(Calendar.MONDAY);
        cal.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
        cal.add(Calendar.WEEK_OF_YEAR, -9); // 10 semanas atrás (inclui a atual)
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        String today = sdf.format(Calendar.getInstance().getTime());

        int cellSizeDp = dp(20);
        int gapDp = dp(3);

        for (int week = 0; week < 10; week++) {
            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
            rowParams.setMargins(0, 0, 0, gapDp);
            row.setLayoutParams(rowParams);

            for (int day = 0; day < 7; day++) {
                String dateStr = sdf.format(cal.getTime());
                int count = countByDate.getOrDefault(dateStr, 0);
                boolean isFuture = dateStr.compareTo(today) > 0;

                View cell = new View(this);
                LinearLayout.LayoutParams cellParams = new LinearLayout.LayoutParams(0, cellSizeDp, 1f);
                cellParams.setMargins(gapDp / 2, 0, gapDp / 2, 0);
                cell.setLayoutParams(cellParams);

                if (isFuture) {
                    cell.setBackgroundResource(R.drawable.bg_heatmap_0);
                    cell.setAlpha(0.3f);
                } else if (count == 0) {
                    cell.setBackgroundResource(R.drawable.bg_heatmap_0);
                } else if (count == 1) {
                    cell.setBackgroundResource(R.drawable.bg_heatmap_1);
                } else if (count <= 3) {
                    cell.setBackgroundResource(R.drawable.bg_heatmap_2);
                } else {
                    cell.setBackgroundResource(R.drawable.bg_heatmap_3);
                }

                row.addView(cell);
                cal.add(Calendar.DAY_OF_MONTH, 1);
            }

            layoutHeatmap.addView(row);
        }

        // Streak no canto superior direito
        int streak = calcWeekStreak();
        tvHeatmapStreak.setText(streak > 0 ? "🔥 " + streak + " dias esta semana" : "");
    }

    // ─── LAUDOS ──────────────────────────────────────────────────────────────

    private void renderMedicalRecords(List<MedicalRecord> records) {
        if (records == null || records.isEmpty()) {
            tvReportsLabel.setVisibility(View.GONE);
            rvReports.setVisibility(View.GONE);
            return;
        }
        tvReportsLabel.setVisibility(View.VISIBLE);
        rvReports.setVisibility(View.VISIBLE);

        List<ReportAdapter.ReportItem> items = new ArrayList<>();
        for (MedicalRecord r : records) {
            String title = r.getChiefComplaint() != null ? r.getChiefComplaint() : "Avaliação";
            String body = r.getClinicalNotes() != null ? r.getClinicalNotes() : "";
            if (r.getTreatmentPlan() != null && !r.getTreatmentPlan().isEmpty()) {
                body += (body.isEmpty() ? "" : "\n") + "Plano: " + r.getTreatmentPlan();
            }
            items.add(new ReportAdapter.ReportItem(title, body, formatRecordDate(r.getDate())));
        }

        ReportAdapter adapter = new ReportAdapter(items);
        rvReports.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        rvReports.setAdapter(adapter);
    }

    private String formatRecordDate(String raw) {
        if (raw == null) return "";
        try {
            java.util.Date d = new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(raw.substring(0, 10));
            if (d != null) return new SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(d);
        } catch (Exception ignored) {}
        return raw;
    }

    // ─── CONQUISTAS ──────────────────────────────────────────────────────────

    private void renderAchievements() {
        layoutAchievements.removeAllViews();

        int totalSessions = checkInHistory.size();
        int weekStreak = calcWeekStreak();
        int totalDays = calcUniqueDays();

        Achievement[] achievements = {
            new Achievement("🔥", "Primeira sessão", "Completou seu primeiro treino", totalSessions >= 1),
            new Achievement("⚡", "5 treinos", "Completou 5 sessões", totalSessions >= 5),
            new Achievement("🏅", "Streak semanal", "Treinou pelo menos 3 dias esta semana", weekStreak >= 3),
            new Achievement("💪", "10 treinos", "Completou 10 sessões no total", totalSessions >= 10),
            new Achievement("🌟", "Dedicação", "Treinou em 5 dias diferentes", totalDays >= 5),
            new Achievement("🏆", "Campeão mensal", "30 sessões concluídas", totalSessions >= 30),
        };

        for (Achievement a : achievements) {
            layoutAchievements.addView(makeAchievementRow(a));
        }
    }

    private View makeAchievementRow(Achievement a) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        int pad = dp(12);
        row.setPadding(pad, dp(10), pad, dp(10));

        int bgColor = a.unlocked ? 0xFFE8F5F0 : 0xFFF5F5F5;
        row.setBackgroundColor(bgColor);

        LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        rowParams.setMargins(0, 0, 0, dp(8));
        row.setLayoutParams(rowParams);

        TextView icon = new TextView(this);
        icon.setText(a.icon);
        icon.setTextSize(28);
        icon.setAlpha(a.unlocked ? 1f : 0.3f);
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(dp(48), dp(48));
        icon.setLayoutParams(iconParams);
        icon.setGravity(Gravity.CENTER);

        LinearLayout texts = new LinearLayout(this);
        texts.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams textsParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        textsParams.setMarginStart(dp(12));
        texts.setLayoutParams(textsParams);

        TextView title = new TextView(this);
        title.setText(a.title);
        title.setTextSize(14);
        title.setTypeface(null, Typeface.BOLD);
        title.setTextColor(a.unlocked ? Color.BLACK : Color.GRAY);

        TextView desc = new TextView(this);
        desc.setText(a.description);
        desc.setTextSize(12);
        desc.setTextColor(Color.GRAY);

        texts.addView(title);
        texts.addView(desc);

        TextView badge = new TextView(this);
        badge.setText(a.unlocked ? "✓" : "🔒");
        badge.setTextSize(16);
        badge.setGravity(Gravity.CENTER);

        row.addView(icon);
        row.addView(texts);
        row.addView(badge);
        return row;
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────

    private int calcWeekStreak() {
        if (checkInHistory == null || checkInHistory.isEmpty()) return 0;
        Calendar startOfWeek = Calendar.getInstance();
        startOfWeek.setFirstDayOfWeek(Calendar.MONDAY);
        startOfWeek.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
        startOfWeek.set(Calendar.HOUR_OF_DAY, 0);
        startOfWeek.set(Calendar.MINUTE, 0);
        startOfWeek.set(Calendar.SECOND, 0);
        startOfWeek.set(Calendar.MILLISECOND, 0);

        Set<String> days = new HashSet<>();
        for (CheckInHistoryResponse c : checkInHistory) {
            if (c.getExecutedAt() == null) continue;
            try {
                String dp = c.getExecutedAt().substring(0, 10);
                java.util.Date d = new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(dp);
                if (d != null && !d.before(startOfWeek.getTime())) days.add(dp);
            } catch (Exception ignored) {}
        }
        return days.size();
    }

    private int calcUniqueDays() {
        if (checkInHistory == null) return 0;
        Set<String> days = new HashSet<>();
        for (CheckInHistoryResponse c : checkInHistory) {
            if (c.getExecutedAt() != null && c.getExecutedAt().length() >= 10)
                days.add(c.getExecutedAt().substring(0, 10));
        }
        return days.size();
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
    }

    // ─── BOTTOM NAV ──────────────────────────────────────────────────────────

    private void setupBottomNav() {
        findViewById(R.id.navEvolution).setAlpha(1.0f);
        findViewById(R.id.navHome).setOnClickListener(v -> { startActivity(new Intent(this, HomeActivity.class)); finish(); });
        findViewById(R.id.navExercises).setOnClickListener(v -> { startActivity(new Intent(this, com.maya.rpg.ui.exercises.ExercisePlanActivity.class)); finish(); });
        findViewById(R.id.navSchedule).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.schedule.ScheduleActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> {});
        findViewById(R.id.navMore).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }

    // ─── INNER CLASSES ───────────────────────────────────────────────────────

    private static class Achievement {
        final String icon, title, description;
        final boolean unlocked;
        Achievement(String icon, String title, String description, boolean unlocked) {
            this.icon = icon; this.title = title;
            this.description = description; this.unlocked = unlocked;
        }
    }
}
