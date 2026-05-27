package com.maya.rpg.ui.schedule;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.ContextCompat;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.Appointment;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import com.maya.rpg.model.PaginatedResponse;

import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AgendaActivity extends BaseAuthActivity {

    private LinearLayout layoutAppointments;
    private String currentFilter = "all";
    private TextView tabAll, tabUpcoming, tabHistory;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_agenda);

        layoutAppointments = findViewById(R.id.layoutAppointments);
        tabAll = findViewById(R.id.tabAll);
        tabUpcoming = findViewById(R.id.tabUpcoming);
        tabHistory = findViewById(R.id.tabHistory);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        View.OnClickListener tabListener = v -> {
            if (v.getId() == R.id.tabAll) setFilter("all");
            else if (v.getId() == R.id.tabUpcoming) setFilter("upcoming");
            else if (v.getId() == R.id.tabHistory) setFilter("history");
        };

        tabAll.setOnClickListener(tabListener);
        tabUpcoming.setOnClickListener(tabListener);
        tabHistory.setOnClickListener(tabListener);

        setupBottomNav();
        loadAppointments();
    }

    private void setFilter(String filter) {
        this.currentFilter = filter;
        
        // Reset tabs
        tabAll.setBackgroundResource(0);
        tabAll.setTextColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        tabAll.setTypeface(null, android.graphics.Typeface.NORMAL);
        
        tabUpcoming.setBackgroundResource(0);
        tabUpcoming.setTextColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        tabUpcoming.setTypeface(null, android.graphics.Typeface.NORMAL);
        
        tabHistory.setBackgroundResource(0);
        tabHistory.setTextColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        tabHistory.setTypeface(null, android.graphics.Typeface.NORMAL);

        // Highlight selected
        TextView selected = tabAll;
        if (filter.equals("upcoming")) selected = tabUpcoming;
        else if (filter.equals("history")) selected = tabHistory;
        
        selected.setBackgroundResource(R.drawable.bg_tab_selected);
        selected.setTextColor(Color.WHITE);
        selected.setTypeface(null, android.graphics.Typeface.BOLD);

        loadAppointments();
    }

    private void loadAppointments() {
        RetrofitClient.getApiService().getMyAppointments(currentFilter).enqueue(new Callback<PaginatedResponse<Appointment>>() {
            @Override
            public void onResponse(Call<PaginatedResponse<Appointment>> call, Response<PaginatedResponse<Appointment>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    renderAppointments(response.body().getData());
                } else {
                    renderEmpty("Nenhum agendamento encontrado.");
                }
            }

            @Override
            public void onFailure(Call<PaginatedResponse<Appointment>> call, Throwable t) {
                renderEmpty("Erro ao carregar agenda.");
            }
        });
    }

    private void renderAppointments(List<Appointment> list) {
        layoutAppointments.removeAllViews();
        if (list.isEmpty()) {
            renderEmpty("Sua agenda está vazia.");
            return;
        }

        // Fake some statuses for demonstration if they come empty/null
        for (Appointment app : list) {
            layoutAppointments.addView(makeAppointmentRow(app));
        }
    }

    private View makeAppointmentRow(Appointment app) {
        View row = getLayoutInflater().inflate(R.layout.item_appointment_card, layoutAppointments, false);
        View pill = row.findViewById(R.id.statusPill);
        TextView tvDate = row.findViewById(R.id.tvAppointmentDateTime);
        TextView tvStatus = row.findViewById(R.id.tvStatus);
        TextView tvPrice = row.findViewById(R.id.tvPrice);

        tvDate.setText(formatAppointmentDate(app.getDateTime()));
        
        String status = app.getStatus() != null ? app.getStatus().toLowerCase() : "confirmed";
        if (status.contains("done") || status.contains("realizado")) {
            pill.setBackgroundResource(R.drawable.bg_pill_blue);
            tvStatus.setText("✓ Realizado");
            tvStatus.setTextColor(Color.parseColor("#4FC3F7"));
            tvPrice.setText("R$150");
        } else if (status.contains("cancel")) {
            pill.setBackgroundResource(R.drawable.bg_pill_red);
            tvStatus.setText("✕ Cancelado");
            tvStatus.setTextColor(Color.parseColor("#E57373"));
            tvPrice.setText("R$150");
        } else {
            pill.setBackgroundResource(R.drawable.bg_pill_green);
            tvStatus.setText("✓ Confirmado");
            tvStatus.setTextColor(Color.parseColor("#81C784"));
            tvPrice.setText("R$250");
        }

        return row;
    }

    private void renderEmpty(String msg) {
        layoutAppointments.removeAllViews();
        TextView tv = new TextView(this);
        tv.setText(msg);
        tv.setPadding(0, 50, 0, 0);
        tv.setGravity(android.view.Gravity.CENTER);
        layoutAppointments.addView(tv);
    }

    private String formatAppointmentDate(String value) {
        if (value == null || value.isEmpty()) return "Data a confirmar";
        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            input.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            Date date = input.parse(value);
            if (date != null) {
                return new SimpleDateFormat("HH:mm - EEE, dd MMM", new Locale("pt", "BR")).format(date);
            }
        } catch (ParseException e) {
            return value;
        }
        return value;
    }

    private void setupBottomNav() {
        findViewById(R.id.navHome).setOnClickListener(v -> startActivity(new Intent(this, HomeActivity.class)));
        findViewById(R.id.navExercises).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.exercises.ExercisePlanActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> startActivity(new Intent(this, EvolutionActivity.class)));
        findViewById(R.id.navMore).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }
}
