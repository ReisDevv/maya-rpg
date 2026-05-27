package com.maya.rpg.ui.evolution;

import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.content.ContextCompat;
import androidx.core.widget.TextViewCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.CheckInHistoryResponse;
import com.maya.rpg.model.MedicalRecord;
import com.maya.rpg.model.PaginatedResponse;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

import android.content.res.ColorStateList;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class EvolutionActivity extends BaseAuthActivity {

    private LineChart chartEvolution;
    private BarChart chartFrequency;
    private TextView tabPain, tabImprovement, tabFrequency;
    private RecyclerView rvReports;
    private LinearLayout layoutAchievements;
    private TextView tvReportsLabel;
    private List<CheckInHistoryResponse> checkInHistory = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_evolution);

        chartEvolution = findViewById(R.id.chartEvolution);
        chartFrequency = findViewById(R.id.chartFrequency);
        tabPain = findViewById(R.id.tabPain);
        tabImprovement = findViewById(R.id.tabImprovement);
        tabFrequency = findViewById(R.id.tabFrequency);
        rvReports = findViewById(R.id.rvReports);
        layoutAchievements = findViewById(R.id.layoutAchievements);
        tvReportsLabel = findViewById(R.id.tvReportsLabel);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        setupTabs();
        setupBottomNav();
        loadHistory();
        loadMedicalRecords();
    }

    // ─── DADOS ───────────────────────────────────────────────────────────────

    private void loadHistory() {
        RetrofitClient.getApiService().getMyHistory(200).enqueue(new Callback<PaginatedResponse<CheckInHistoryResponse>>() {
            @Override
            public void onResponse(Call<PaginatedResponse<CheckInHistoryResponse>> call,
                                   Response<PaginatedResponse<CheckInHistoryResponse>> response) {
                if (response.isSuccessful() && response.body() != null
                        && response.body().getData() != null) {
                    checkInHistory = response.body().getData();
                } else {
                    checkInHistory = new ArrayList<>();
                }
                showPainChart();
                renderAchievements();
            }

            @Override
            public void onFailure(Call<PaginatedResponse<CheckInHistoryResponse>> call, Throwable t) {
                checkInHistory = new ArrayList<>();
                showPainChart();
                renderAchievements();
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
                            List<MedicalRecord> records = response.body().getData();
                            renderMedicalRecords(records);
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

        // Ícone (emoji)
        TextView icon = new TextView(this);
        icon.setText(a.icon);
        icon.setTextSize(28);
        icon.setAlpha(a.unlocked ? 1f : 0.3f);
        LinearLayout.LayoutParams iconParams = new LinearLayout.LayoutParams(dp(48), dp(48));
        icon.setLayoutParams(iconParams);
        icon.setGravity(Gravity.CENTER);

        // Textos
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

        // Badge de desbloqueado
        TextView badge = new TextView(this);
        badge.setText(a.unlocked ? "✓" : "🔒");
        badge.setTextSize(16);
        badge.setGravity(Gravity.CENTER);

        row.addView(icon);
        row.addView(texts);
        row.addView(badge);
        return row;
    }

    private int calcWeekStreak() {
        if (checkInHistory == null || checkInHistory.isEmpty()) return 0;
        Calendar startOfWeek = Calendar.getInstance();
        startOfWeek.setFirstDayOfWeek(Calendar.MONDAY);
        startOfWeek.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);
        startOfWeek.set(Calendar.HOUR_OF_DAY, 0);
        startOfWeek.set(Calendar.MINUTE, 0);
        startOfWeek.set(Calendar.SECOND, 0);
        startOfWeek.set(Calendar.MILLISECOND, 0);

        java.util.Set<String> days = new java.util.HashSet<>();
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
        java.util.Set<String> days = new java.util.HashSet<>();
        for (CheckInHistoryResponse c : checkInHistory) {
            if (c.getExecutedAt() != null && c.getExecutedAt().length() >= 10)
                days.add(c.getExecutedAt().substring(0, 10));
        }
        return days.size();
    }

    // ─── GRÁFICOS ────────────────────────────────────────────────────────────

    private void setupTabs() {
        View.OnClickListener listener = v -> {
            resetTabs();
            TextView tv = (TextView) v;
            tv.setBackgroundResource(R.drawable.bg_tab_selected);
            tv.setTextColor(Color.WHITE);
            tv.setTypeface(null, Typeface.BOLD);
            TextViewCompat.setCompoundDrawableTintList(tv, ColorStateList.valueOf(Color.WHITE));
            if (v.getId() == R.id.tabPain) showPainChart();
            else if (v.getId() == R.id.tabImprovement) showImprovementChart();
            else showFrequencyChart();
        };
        tabPain.setOnClickListener(listener);
        tabImprovement.setOnClickListener(listener);
        tabFrequency.setOnClickListener(listener);
    }

    private void resetTabs() {
        int teal = ContextCompat.getColor(this, R.color.maya_dark_teal);
        for (TextView t : new TextView[]{tabPain, tabImprovement, tabFrequency}) {
            t.setBackgroundResource(R.drawable.bg_tab_unselected);
            t.setTextColor(teal);
            t.setTypeface(null, Typeface.NORMAL);
            TextViewCompat.setCompoundDrawableTintList(t, ColorStateList.valueOf(teal));
        }
    }

    private void showPainChart() {
        chartEvolution.setVisibility(View.VISIBLE);
        chartFrequency.setVisibility(View.GONE);

        if (checkInHistory.isEmpty()) { showEmptyChart(); return; }

        // Agrupa por mês e calcula média de dor
        Map<Integer, List<Integer>> byMonth = new TreeMap<>();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar cal = Calendar.getInstance();
        for (CheckInHistoryResponse c : checkInHistory) {
            if (c.getExecutedAt() == null) continue;
            try {
                java.util.Date d = sdf.parse(c.getExecutedAt().substring(0, 10));
                if (d == null) continue;
                cal.setTime(d);
                int m = cal.get(Calendar.MONTH);
                byMonth.computeIfAbsent(m, k -> new ArrayList<>()).add(c.getPainLevel());
            } catch (Exception ignored) {}
        }

        if (byMonth.isEmpty()) { showEmptyChart(); return; }

        List<Entry> entries = new ArrayList<>();
        for (Map.Entry<Integer, List<Integer>> e : byMonth.entrySet()) {
            float avg = 0;
            for (int v : e.getValue()) avg += v;
            avg /= e.getValue().size();
            entries.add(new Entry(e.getKey(), avg));
        }

        LineDataSet ds = new LineDataSet(entries, "Dor");
        ds.setColor(ContextCompat.getColor(this, R.color.maya_salmon));
        ds.setCircleColor(ContextCompat.getColor(this, R.color.maya_salmon));
        ds.setLineWidth(3f);
        ds.setDrawCircles(true);
        ds.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        ds.setDrawValues(false);
        styleLineChart(new LineData(ds));
    }

    private void showImprovementChart() {
        chartEvolution.setVisibility(View.VISIBLE);
        chartFrequency.setVisibility(View.GONE);

        if (checkInHistory.isEmpty()) { showEmptyChart(); return; }

        // Usa feelingLevel (bem-estar) por mês — mostra melhora de bem-estar
        Map<Integer, List<Integer>> byMonth = new TreeMap<>();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar cal = Calendar.getInstance();
        for (CheckInHistoryResponse c : checkInHistory) {
            if (c.getExecutedAt() == null) continue;
            try {
                java.util.Date d = sdf.parse(c.getExecutedAt().substring(0, 10));
                if (d == null) continue;
                cal.setTime(d);
                int m = cal.get(Calendar.MONTH);
                int feeling = c.getFeelingLevel() > 0 ? c.getFeelingLevel() : (5 - Math.min(c.getPainLevel() / 2, 4));
                byMonth.computeIfAbsent(m, k -> new ArrayList<>()).add(feeling);
            } catch (Exception ignored) {}
        }

        if (byMonth.isEmpty()) { showEmptyChart(); return; }

        List<Entry> entries = new ArrayList<>();
        for (Map.Entry<Integer, List<Integer>> e : byMonth.entrySet()) {
            float avg = 0;
            for (int v : e.getValue()) avg += v;
            avg /= e.getValue().size();
            entries.add(new Entry(e.getKey(), avg));
        }

        LineDataSet ds = new LineDataSet(entries, "Melhora");
        ds.setColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        ds.setCircleColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        ds.setLineWidth(3f);
        ds.setDrawCircles(true);
        ds.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        ds.setDrawValues(false);
        styleLineChart(new LineData(ds));
    }

    private void showFrequencyChart() {
        chartEvolution.setVisibility(View.GONE);
        chartFrequency.setVisibility(View.VISIBLE);

        if (checkInHistory.isEmpty()) { chartFrequency.clear(); chartFrequency.invalidate(); return; }

        Map<Integer, Integer> byDay = new HashMap<>();
        for (int d : new int[]{Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY,
                Calendar.THURSDAY, Calendar.FRIDAY, Calendar.SATURDAY, Calendar.SUNDAY}) {
            byDay.put(d, 0);
        }

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar cal = Calendar.getInstance();
        for (CheckInHistoryResponse c : checkInHistory) {
            if (c.getExecutedAt() == null) continue;
            try {
                java.util.Date d = sdf.parse(c.getExecutedAt().substring(0, 10));
                if (d == null) continue;
                cal.setTime(d);
                int day = cal.get(Calendar.DAY_OF_WEEK);
                byDay.merge(day, 1, Integer::sum);
            } catch (Exception ignored) {}
        }

        int[] order = {Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY,
                Calendar.THURSDAY, Calendar.FRIDAY, Calendar.SATURDAY, Calendar.SUNDAY};
        String[] labels = {"SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"};

        List<BarEntry> entries = new ArrayList<>();
        for (int i = 0; i < order.length; i++) {
            entries.add(new BarEntry(i, byDay.getOrDefault(order[i], 0)));
        }

        BarDataSet ds = new BarDataSet(entries, "Frequência");
        ds.setColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        ds.setDrawValues(false);

        BarData barData = new BarData(ds);
        barData.setBarWidth(0.5f);

        chartFrequency.setData(barData);
        chartFrequency.getDescription().setEnabled(false);
        chartFrequency.getLegend().setEnabled(false);
        chartFrequency.getAxisRight().setEnabled(false);
        chartFrequency.setNoDataText("Nenhum dado disponível");

        XAxis xAxis = chartFrequency.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setGranularity(1f);
        xAxis.setValueFormatter(new ValueFormatter() {
            @Override
            public String getFormattedValue(float value) {
                int i = (int) value;
                return (i >= 0 && i < labels.length) ? labels[i] : "";
            }
        });

        YAxis yAxis = chartFrequency.getAxisLeft();
        yAxis.setAxisMinimum(0f);
        yAxis.setGranularity(1f);
        yAxis.setDrawGridLines(true);
        chartFrequency.invalidate();
    }

    private void styleLineChart(LineData data) {
        chartEvolution.setData(data);
        chartEvolution.getDescription().setEnabled(false);
        chartEvolution.getLegend().setEnabled(false);
        chartEvolution.getAxisRight().setEnabled(false);
        chartEvolution.setNoDataText("Nenhum dado disponível");

        XAxis xAxis = chartEvolution.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setGranularity(1f);
        xAxis.setValueFormatter(new ValueFormatter() {
            private final String[] months = {"JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"};
            @Override
            public String getFormattedValue(float value) {
                int i = (int) value;
                return (i >= 0 && i < months.length) ? months[i] : "";
            }
        });

        YAxis yAxis = chartEvolution.getAxisLeft();
        yAxis.setAxisMinimum(0f);
        yAxis.setGranularity(1f);
        yAxis.setDrawGridLines(true);
        yAxis.setGridColor(Color.LTGRAY);
        chartEvolution.invalidate();
    }

    private void showEmptyChart() {
        chartEvolution.clear();
        chartEvolution.setNoDataText("Sem dados ainda — complete uma sessão!");
        chartEvolution.invalidate();
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

    // ─── UTILS ───────────────────────────────────────────────────────────────

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
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
