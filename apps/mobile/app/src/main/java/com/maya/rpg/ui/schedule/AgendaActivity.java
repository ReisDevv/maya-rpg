package com.maya.rpg.ui.schedule;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.content.ContextCompat;
import com.google.android.material.bottomsheet.BottomSheetDialog;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.Appointment;
import com.maya.rpg.model.PaginatedResponse;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AgendaActivity extends BaseAuthActivity {

    private LinearLayout layoutAppointments;
    private String currentFilter = "upcoming";
    private TextView tabAll, tabUpcoming, tabHistory;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_agenda);

        layoutAppointments = findViewById(R.id.layoutAppointments);
        tabAll      = findViewById(R.id.tabAll);
        tabUpcoming = findViewById(R.id.tabUpcoming);
        tabHistory  = findViewById(R.id.tabHistory);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        tabAll.setOnClickListener(v      -> setFilter("all"));
        tabUpcoming.setOnClickListener(v -> setFilter("upcoming"));
        tabHistory.setOnClickListener(v  -> setFilter("history"));

        setupBottomNav();
        setFilter("upcoming");
    }

    private void setFilter(String filter) {
        this.currentFilter = filter;

        tabAll.setBackgroundResource(0);
        tabAll.setTextColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        tabAll.setTypeface(null, android.graphics.Typeface.NORMAL);

        tabUpcoming.setBackgroundResource(0);
        tabUpcoming.setTextColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        tabUpcoming.setTypeface(null, android.graphics.Typeface.NORMAL);

        tabHistory.setBackgroundResource(0);
        tabHistory.setTextColor(ContextCompat.getColor(this, R.color.maya_dark_teal));
        tabHistory.setTypeface(null, android.graphics.Typeface.NORMAL);

        TextView selected = filter.equals("history") ? tabHistory
                          : filter.equals("upcoming") ? tabUpcoming
                          : tabAll;
        selected.setBackgroundResource(R.drawable.bg_tab_selected);
        selected.setTextColor(Color.WHITE);
        selected.setTypeface(null, android.graphics.Typeface.BOLD);

        loadAppointments();
    }

    private void loadAppointments() {
        renderLoading();
        RetrofitClient.getApiService().getMyAppointments(currentFilter)
                .enqueue(new Callback<PaginatedResponse<Appointment>>() {
                    @Override
                    public void onResponse(Call<PaginatedResponse<Appointment>> call,
                                           Response<PaginatedResponse<Appointment>> response) {
                        if (response.isSuccessful() && response.body() != null
                                && response.body().getData() != null
                                && !response.body().getData().isEmpty()) {
                            renderAppointments(response.body().getData());
                        } else {
                            renderEmpty(emptyMessage());
                        }
                    }

                    @Override
                    public void onFailure(Call<PaginatedResponse<Appointment>> call, Throwable t) {
                        renderEmpty("Erro ao carregar agenda. Verifique sua conexão.");
                    }
                });
    }

    private String emptyMessage() {
        if ("upcoming".equals(currentFilter)) return "Nenhuma consulta futura agendada.";
        if ("history".equals(currentFilter))  return "Nenhum histórico encontrado.";
        return "Sua agenda está vazia.";
    }

    private void renderLoading() {
        layoutAppointments.removeAllViews();
        TextView tv = new TextView(this);
        tv.setText("Carregando...");
        tv.setPadding(0, 60, 0, 0);
        tv.setGravity(android.view.Gravity.CENTER);
        tv.setTextColor(Color.GRAY);
        layoutAppointments.addView(tv);
    }

    private void renderAppointments(List<Appointment> list) {
        layoutAppointments.removeAllViews();
        for (Appointment app : list) {
            View row = makeAppointmentRow(app);
            layoutAppointments.addView(row);
        }
    }

    private View makeAppointmentRow(Appointment app) {
        View row = getLayoutInflater().inflate(R.layout.item_appointment_card, layoutAppointments, false);
        View pill        = row.findViewById(R.id.statusPill);
        TextView tvDate  = row.findViewById(R.id.tvAppointmentDateTime);
        TextView tvStatus = row.findViewById(R.id.tvStatus);
        TextView tvPrice = row.findViewById(R.id.tvPrice);

        tvDate.setText(formatAppointmentDate(app.getDateTime()));

        String status = app.getStatus() != null ? app.getStatus().toLowerCase() : "pending";

        if (status.contains("done") || status.contains("completed") || status.contains("realizado")) {
            pill.setBackgroundResource(R.drawable.bg_pill_blue);
            tvStatus.setText("✓ Realizado");
            tvStatus.setTextColor(Color.parseColor("#4FC3F7"));
        } else if (status.contains("cancel")) {
            pill.setBackgroundResource(R.drawable.bg_pill_red);
            tvStatus.setText("✕ Cancelado");
            tvStatus.setTextColor(Color.parseColor("#E57373"));
        } else if (status.contains("confirmed")) {
            pill.setBackgroundResource(R.drawable.bg_pill_green);
            tvStatus.setText("✓ Confirmado");
            tvStatus.setTextColor(Color.parseColor("#81C784"));
        } else {
            pill.setBackgroundResource(R.drawable.bg_pill_yellow);
            tvStatus.setText("⏳ Aguardando confirmação");
            tvStatus.setTextColor(Color.parseColor("#FFB300"));
        }

        if (app.getPrice() != null) {
            tvPrice.setText(String.format(new Locale("pt", "BR"), "R$%.0f", app.getPrice()));
        } else {
            tvPrice.setVisibility(View.GONE);
        }

        row.setOnClickListener(v -> showAppointmentDetail(app));
        return row;
    }

    private void showAppointmentDetail(Appointment app) {
        BottomSheetDialog sheet = new BottomSheetDialog(this);
        View view = LayoutInflater.from(this).inflate(R.layout.dialog_appointment_detail, null);

        TextView tvSheetDate    = view.findViewById(R.id.tvSheetDate);
        TextView tvSheetStatus  = view.findViewById(R.id.tvSheetStatus);
        TextView tvSheetPayment = view.findViewById(R.id.tvSheetPayment);
        TextView tvSheetPrice   = view.findViewById(R.id.tvSheetPrice);
        TextView tvSheetNotes   = view.findViewById(R.id.tvSheetNotes);
        View     rowNotes       = view.findViewById(R.id.rowNotes);

        tvSheetDate.setText(formatAppointmentDate(app.getDateTime()));

        String status = app.getStatus() != null ? app.getStatus().toLowerCase() : "pending";
        if (status.contains("done") || status.contains("completed")) {
            tvSheetStatus.setText("✓ Realizado");
            tvSheetStatus.setTextColor(Color.parseColor("#4FC3F7"));
        } else if (status.contains("cancel")) {
            tvSheetStatus.setText("✕ Cancelado");
            tvSheetStatus.setTextColor(Color.parseColor("#E57373"));
        } else if (status.contains("confirmed")) {
            tvSheetStatus.setText("✓ Confirmado");
            tvSheetStatus.setTextColor(Color.parseColor("#81C784"));
        } else {
            tvSheetStatus.setText("⏳ Aguardando confirmação");
            tvSheetStatus.setTextColor(Color.parseColor("#FFB300"));
        }

        // Pagamento
        if (app.getPrice() != null) {
            tvSheetPrice.setText(String.format(new Locale("pt", "BR"), "R$%.0f", app.getPrice()));
        } else {
            tvSheetPrice.setText("A definir");
        }

        String method = app.getPaymentMethod();
        if (method == null || method.isEmpty()) {
            tvSheetPayment.setText("Método: A definir");
        } else if (method.equalsIgnoreCase("pix")) {
            tvSheetPayment.setText("Método: Pix");
        } else if (method.toLowerCase().contains("card") || method.toLowerCase().contains("cart")) {
            tvSheetPayment.setText("Método: Cartão");
        } else if (method.equalsIgnoreCase("cash") || method.equalsIgnoreCase("dinheiro")) {
            tvSheetPayment.setText("Método: Dinheiro");
        } else {
            tvSheetPayment.setText("Método: " + method);
        }

        // Observações
        if (app.getNotes() != null && !app.getNotes().isEmpty()) {
            tvSheetNotes.setText(app.getNotes());
            rowNotes.setVisibility(View.VISIBLE);
        } else {
            rowNotes.setVisibility(View.GONE);
        }

        view.findViewById(R.id.btnCloseSheet).setOnClickListener(v -> sheet.dismiss());

        sheet.setContentView(view);
        sheet.show();
    }

    private void renderEmpty(String msg) {
        layoutAppointments.removeAllViews();
        TextView tv = new TextView(this);
        tv.setText(msg);
        tv.setPadding(0, 60, 0, 0);
        tv.setGravity(android.view.Gravity.CENTER);
        tv.setTextColor(Color.GRAY);
        layoutAppointments.addView(tv);
    }

    private String formatAppointmentDate(String value) {
        if (value == null || value.isEmpty()) return "Data a confirmar";
        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            input.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            Date date = input.parse(value);
            if (date != null) {
                SimpleDateFormat output = new SimpleDateFormat("HH:mm - EEE, dd MMM yyyy", new Locale("pt", "BR"));
                output.setTimeZone(java.util.TimeZone.getTimeZone("America/Sao_Paulo"));
                return output.format(date);
            }
        } catch (ParseException ignored) {}
        // tenta sem milissegundos
        try {
            SimpleDateFormat input2 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
            input2.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            Date date = input2.parse(value);
            if (date != null) {
                SimpleDateFormat output = new SimpleDateFormat("HH:mm - EEE, dd MMM yyyy", new Locale("pt", "BR"));
                output.setTimeZone(java.util.TimeZone.getTimeZone("America/Sao_Paulo"));
                return output.format(date);
            }
        } catch (ParseException ignored) {}
        return value;
    }

    private void setupBottomNav() {
        findViewById(R.id.navHome).setOnClickListener(v -> startActivity(new Intent(this, HomeActivity.class)));
        findViewById(R.id.navExercises).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.exercises.ExercisePlanActivity.class)));
        findViewById(R.id.navSchedule).setOnClickListener(v -> startActivity(new Intent(this, ScheduleActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> startActivity(new Intent(this, EvolutionActivity.class)));
        findViewById(R.id.navMore).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }
}
