package com.maya.rpg.ui.evolution;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.core.content.ContextCompat;
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
import androidx.core.widget.TextViewCompat;
import android.content.res.ColorStateList;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.CheckInHistoryResponse;
import com.maya.rpg.model.PaginatedResponse;
import com.maya.rpg.ui.BaseAuthActivity;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.util.ArrayList;
import java.util.List;

public class EvolutionActivity extends BaseAuthActivity {

    private LineChart chartEvolution;
    private BarChart chartFrequency;
    private TextView tabPain, tabImprovement, tabFrequency;
    private RecyclerView rvReports;
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

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        setupTabs();
        setupReports();
        setupBottomNav();
        
        loadHistory();
    }

    private void loadHistory() {
        RetrofitClient.getApiService().getMyHistory().enqueue(new Callback<PaginatedResponse<CheckInHistoryResponse>>() {
            @Override
            public void onResponse(Call<PaginatedResponse<CheckInHistoryResponse>> call, Response<PaginatedResponse<CheckInHistoryResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    checkInHistory = response.body().getData();
                    showPainChart(); // Initial view
                } else {
                    clearCharts();
                }
            }

            @Override
            public void onFailure(Call<PaginatedResponse<CheckInHistoryResponse>> call, Throwable t) {
                clearCharts();
            }
        });
    }

    private void clearCharts() {
        chartEvolution.clear();
        chartFrequency.clear();
        chartEvolution.setNoDataText("");
        chartFrequency.setNoDataText("");
        chartEvolution.invalidate();
        chartFrequency.invalidate();
    }

    private void setupTabs() {
        View.OnClickListener listener = v -> {
            resetTabs();
            TextView tv = (TextView) v;
            tv.setBackgroundResource(R.drawable.bg_tab_selected);
            tv.setTextColor(Color.WHITE);
            tv.setTypeface(null, android.graphics.Typeface.BOLD);
            TextViewCompat.setCompoundDrawableTintList(tv, ColorStateList.valueOf(Color.WHITE));

            if (v.getId() == R.id.tabPain) showPainChart();
            else if (v.getId() == R.id.tabImprovement) showImprovementChart();
            else if (v.getId() == R.id.tabFrequency) showFrequencyChart();
        };

        tabPain.setOnClickListener(listener);
        tabImprovement.setOnClickListener(listener);
        tabFrequency.setOnClickListener(listener);
    }

    private void resetTabs() {
        TextView[] tabs = {tabPain, tabImprovement, tabFrequency};
        int tealColor = ContextCompat.getColor(this, R.color.maya_dark_teal);
        for (TextView t : tabs) {
            t.setBackgroundResource(R.drawable.bg_tab_unselected);
            t.setTextColor(tealColor);
            t.setTypeface(null, android.graphics.Typeface.NORMAL);
            TextViewCompat.setCompoundDrawableTintList(t, ColorStateList.valueOf(tealColor));
        }
    }

    private void showPainChart() {
        chartEvolution.setVisibility(View.VISIBLE);
        chartFrequency.setVisibility(View.GONE);

        if (checkInHistory == null || checkInHistory.isEmpty()) {
            clearCharts();
            return;
        }

        Map<Integer, List<Integer>> painByMonth = new TreeMap<>();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar cal = Calendar.getInstance();

        for (CheckInHistoryResponse checkIn : checkInHistory) {
            if (checkIn.getExecutedAt() != null) {
                try {
                    java.util.Date parsedDate = sdf.parse(checkIn.getExecutedAt().substring(0, 10));
                    if (parsedDate != null) {
                        cal.setTime(parsedDate);
                        int month = cal.get(Calendar.MONTH);
                        if (!painByMonth.containsKey(month)) {
                            painByMonth.put(month, new ArrayList<>());
                        }
                        List<Integer> list = painByMonth.get(month);
                        if (list != null) {
                            list.add(checkIn.getPainLevel());
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        List<Entry> entries = new ArrayList<>();
        for (Map.Entry<Integer, List<Integer>> entry : painByMonth.entrySet()) {
            float sumPain = 0;
            for (int p : entry.getValue()) sumPain += p;
            float avgPain = sumPain / entry.getValue().size();
            entries.add(new Entry(entry.getKey(), avgPain));
        }

        if (entries.isEmpty()) {
            clearCharts();
            return;
        }

        LineDataSet dataSet = new LineDataSet(entries, "Dor");
        dataSet.setColor(ContextCompat.getColor(this, R.color.maya_salmon));
        dataSet.setLineWidth(3f);
        dataSet.setDrawCircles(true);
        dataSet.setCircleColor(ContextCompat.getColor(this, R.color.maya_salmon));
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        dataSet.setDrawValues(false);

        styleChart(new LineData(dataSet));
    }

    private void showImprovementChart() {
        chartEvolution.setVisibility(View.VISIBLE);
        chartFrequency.setVisibility(View.GONE);

        if (checkInHistory == null || checkInHistory.isEmpty()) {
            clearCharts();
            return;
        }

        // Simulating improvement: inversed pain or a constant trend if data exists
        List<Entry> entries = new ArrayList<>();
        // In reality, improvement could be a specific field or derived. 
        // Here we'll show a positive trend if pain is decreasing.
        // For now, let's just map data points to show "activity"
        for (int i = 0; i < Math.min(checkInHistory.size(), 6); i++) {
            entries.add(new Entry(i, 5 - checkInHistory.get(i).getPainLevel()));
        }

        if (entries.isEmpty()) {
            clearCharts();
            return;
        }

        LineDataSet dataSet = new LineDataSet(entries, "Melhora");
        dataSet.setColor(ContextCompat.getColor(this, R.color.maya_blue_text));
        dataSet.setLineWidth(3f);
        dataSet.setDrawCircles(true);
        dataSet.setCircleColor(ContextCompat.getColor(this, R.color.maya_blue_text));
        dataSet.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        dataSet.setDrawValues(false);

        styleChart(new LineData(dataSet));
    }

    private void showFrequencyChart() {
        chartEvolution.setVisibility(View.GONE);
        chartFrequency.setVisibility(View.VISIBLE);

        if (checkInHistory == null || checkInHistory.isEmpty()) {
            clearCharts();
            return;
        }

        Map<Integer, Integer> freqByDay = new HashMap<>();
        freqByDay.put(Calendar.MONDAY, 0);
        freqByDay.put(Calendar.TUESDAY, 0);
        freqByDay.put(Calendar.WEDNESDAY, 0);
        freqByDay.put(Calendar.THURSDAY, 0);
        freqByDay.put(Calendar.FRIDAY, 0);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar cal = Calendar.getInstance();

        for (CheckInHistoryResponse checkIn : checkInHistory) {
            if (checkIn.getExecutedAt() != null) {
                try {
                    java.util.Date parsedDate = sdf.parse(checkIn.getExecutedAt().substring(0, 10));
                    if (parsedDate != null) {
                        cal.setTime(parsedDate);
                        int day = cal.get(Calendar.DAY_OF_WEEK);
                        if (freqByDay.containsKey(day)) {
                            freqByDay.compute(day, (k, v) -> (v == null ? 0 : v) + 1);
                        }
                    }
                } catch (Exception ignored) {}
            }
        }

        List<BarEntry> entries = new ArrayList<>();
        entries.add(new BarEntry(0, freqByDay.get(Calendar.MONDAY)));
        entries.add(new BarEntry(1, freqByDay.get(Calendar.TUESDAY)));
        entries.add(new BarEntry(2, freqByDay.get(Calendar.WEDNESDAY)));
        entries.add(new BarEntry(3, freqByDay.get(Calendar.THURSDAY)));
        entries.add(new BarEntry(4, freqByDay.get(Calendar.FRIDAY)));

        BarDataSet dataSet = new BarDataSet(entries, "Frequência");
        dataSet.setColor(ContextCompat.getColor(this, R.color.maya_salmon));
        dataSet.setDrawValues(false);

        BarData barData = new BarData(dataSet);
        barData.setBarWidth(0.5f);

        chartFrequency.setData(barData);
        chartFrequency.getDescription().setEnabled(false);
        chartFrequency.getLegend().setEnabled(false);
        chartFrequency.getAxisRight().setEnabled(false);
        chartFrequency.setNoDataText("");
        
        XAxis xAxis = chartFrequency.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(false);
        xAxis.setGranularity(1f);
        xAxis.setValueFormatter(new ValueFormatter() {
            private final String[] days = {"SEG", "TER", "QUA", "QUI", "SEX"};
            @Override
            public String getFormattedValue(float value) {
                int index = (int) value;
                if (index >= 0 && index < days.length) return days[index];
                return "";
            }
        });

        YAxis yAxis = chartFrequency.getAxisLeft();
        yAxis.setAxisMinimum(0f);
        yAxis.setGranularity(1f);
        yAxis.setDrawGridLines(true);

        chartFrequency.invalidate();
    }

    private void styleChart(LineData data) {
        chartEvolution.setData(data);
        chartEvolution.getDescription().setEnabled(false);
        chartEvolution.getLegend().setEnabled(false);
        chartEvolution.getAxisRight().setEnabled(false);
        chartEvolution.setNoDataText("");
        
        XAxis xAxis = chartEvolution.getXAxis();
        xAxis.setPosition(XAxis.XAxisPosition.BOTTOM);
        xAxis.setDrawGridLines(true);
        xAxis.setGridColor(Color.LTGRAY);
        xAxis.setDrawLabels(true); // Ensure month labels are drawn
        xAxis.setValueFormatter(new ValueFormatter() {
            private final String[] months = {"JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"};
            @Override
            public String getFormattedValue(float value) {
                int index = (int) value;
                if (index >= 0 && index < months.length) return months[index];
                return "";
            }
        });

        YAxis yAxis = chartEvolution.getAxisLeft();
        yAxis.setLabelCount(5, true);
        yAxis.setDrawGridLines(true);
        yAxis.setGridColor(Color.LTGRAY);
        yAxis.setDrawLabels(true);

        yAxis.setValueFormatter(new ValueFormatter() {
            @Override
            public String getFormattedValue(float value) {
                return ""; 
            }
        });

        chartEvolution.setRendererLeftYAxis(new IconYAxisRenderer(
                chartEvolution.getViewPortHandler(),
                chartEvolution.getAxisLeft(),
                chartEvolution.getTransformer(YAxis.AxisDependency.LEFT),
                this
        ));

        chartEvolution.invalidate();
    }

    private void setupReports() {
        // Removendo dados mockados e deixando campo vazio caso não venha da API
        List<ReportAdapter.ReportItem> items = new ArrayList<>();
        // Futura integração: RetrofitClient.getApiService().getPatientReports()...

        ReportAdapter adapter = new ReportAdapter(items);
        rvReports.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        rvReports.setAdapter(adapter);
    }

    private void setupBottomNav() {
        findViewById(R.id.navEvolution).setAlpha(1.0f);
        findViewById(R.id.navHome).setOnClickListener(v -> { startActivity(new Intent(this, HomeActivity.class)); finish(); });
        findViewById(R.id.navExercises).setOnClickListener(v -> { startActivity(new Intent(this, com.maya.rpg.ui.exercises.ExercisePlanActivity.class)); finish(); });
        findViewById(R.id.navSchedule).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.schedule.ScheduleActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> {});
        findViewById(R.id.navMore).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }
}
