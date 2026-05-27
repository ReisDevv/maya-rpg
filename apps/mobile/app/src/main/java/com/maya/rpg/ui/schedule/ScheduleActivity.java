package com.maya.rpg.ui.schedule;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.EditText;
import android.widget.GridLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.ContextCompat;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.Appointment;
import com.maya.rpg.model.AppointmentRequest;
import com.maya.rpg.model.AvailabilityResponse;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import com.applandeo.materialcalendarview.CalendarView;
import com.applandeo.materialcalendarview.EventDay;
import com.applandeo.materialcalendarview.listeners.OnDayClickListener;

public class ScheduleActivity extends BaseAuthActivity {

    private YearMonth visibleMonth = YearMonth.now();
    private LocalDate selectedDate = LocalDate.now();
    private String selectedHour;

    private CalendarView calendarView;
    private GridLayout gridHours;
    private EditText etNotes;
    private Set<String> reservedDates = new HashSet<>();
    private List<String> currentAvailableHours = new ArrayList<>();
    // maps "yyyy-MM-dd" -> set of occupied "HH:mm" for that day
    private java.util.Map<String, Set<String>> occupiedHoursByDate = new java.util.HashMap<>();
    private final Set<LocalDate> holidays = new HashSet<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_schedule);

        calendarView = findViewById(R.id.calendarView);
        gridHours = findViewById(R.id.gridHours);
        etNotes = findViewById(R.id.etNotes);

        initHolidays();
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        
        calendarView.setOnDayClickListener(eventDay -> {
            java.util.Calendar clickedCalendar = eventDay.getCalendar();
            selectedDate = LocalDate.of(
                clickedCalendar.get(java.util.Calendar.YEAR),
                clickedCalendar.get(java.util.Calendar.MONTH) + 1,
                clickedCalendar.get(java.util.Calendar.DAY_OF_MONTH)
            );
            selectedHour = null;
            renderHours();
        });

        findViewById(R.id.btnRequest).setOnClickListener(v -> requestAppointment());

        setupBottomNav();
        loadAvailability();
    }

    private void initHolidays() {
        int year = visibleMonth.getYear();
        holidays.add(LocalDate.of(year, 1, 1));   // Ano Novo
        holidays.add(LocalDate.of(year, 4, 21));  // Tiradentes
        holidays.add(LocalDate.of(year, 5, 1));   // Dia do Trabalho
        holidays.add(LocalDate.of(year, 9, 7));   // Independência
        holidays.add(LocalDate.of(year, 10, 12)); // Nsa Sra Aparecida
        holidays.add(LocalDate.of(year, 11, 2));  // Finados
        holidays.add(LocalDate.of(year, 11, 15)); // Proclamação da República
        holidays.add(LocalDate.of(year, 11, 20)); // Consciência Negra
        holidays.add(LocalDate.of(year, 12, 25)); // Natal
        
        List<java.util.Calendar> disabledDays = new ArrayList<>();
        for (LocalDate holiday : holidays) {
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.set(holiday.getYear(), holiday.getMonthValue() - 1, holiday.getDayOfMonth());
            disabledDays.add(cal);
        }
        calendarView.setDisabledDays(disabledDays);
    }

    private void loadAvailability() {
        String monthStr = visibleMonth.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        RetrofitClient.getApiService().getAppointmentAvailability(monthStr).enqueue(new Callback<AvailabilityResponse>() {
            @Override
            public void onResponse(Call<AvailabilityResponse> call, Response<AvailabilityResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    reservedDates.clear();
                    occupiedHoursByDate.clear();
                    List<EventDay> events = new ArrayList<>();

                    if (response.body().getReserved() != null) {
                        for (AvailabilityResponse.ReservedSlot slot : response.body().getReserved()) {
                            if (slot.getDateTime() != null && slot.getDateTime().length() >= 16) {
                                // dateTime comes as UTC ISO-8601; convert to Brasília for display
                                java.time.Instant instant = java.time.Instant.parse(
                                        slot.getDateTime().endsWith("Z") ? slot.getDateTime()
                                                : slot.getDateTime() + "Z");
                                ZonedDateTime zdt = instant.atZone(ZoneId.of("America/Sao_Paulo"));
                                String dateStr = zdt.toLocalDate().toString();
                                String hourStr = String.format(Locale.ROOT, "%02d:%02d",
                                        zdt.getHour(), zdt.getMinute());

                                reservedDates.add(dateStr);

                                Set<String> hours = occupiedHoursByDate.computeIfAbsent(
                                        dateStr, k -> new HashSet<>());
                                hours.add(hourStr);

                                LocalDate date = LocalDate.parse(dateStr);
                                java.util.Calendar cal = java.util.Calendar.getInstance();
                                cal.set(date.getYear(), date.getMonthValue() - 1, date.getDayOfMonth());
                                events.add(new EventDay(cal, R.drawable.bg_notification_circle));
                            }
                        }
                    }
                    calendarView.setEvents(events);

                    currentAvailableHours = response.body().getWorkingHours() != null
                            ? response.body().getWorkingHours() : new ArrayList<>();
                    renderHours();
                }
            }

            @Override
            public void onFailure(Call<AvailabilityResponse> call, Throwable t) {
                Toast.makeText(ScheduleActivity.this, "Erro ao carregar horários", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void renderHours() {
        gridHours.removeAllViews();

        String selectedDateStr = selectedDate.toString();
        Set<String> occupied = occupiedHoursByDate.getOrDefault(selectedDateStr, new HashSet<>());

        for (String hour : currentAvailableHours) {
            TextView tv = new TextView(this);
            tv.setGravity(Gravity.CENTER);
            tv.setPadding(dp(12), dp(8), dp(12), dp(8));
            tv.setTextSize(14);

            boolean isOccupied = occupied.contains(hour);
            boolean isSelected = hour.equals(selectedHour);

            if (isOccupied) {
                tv.setText(hour + "\nOcupado");
                tv.setBackgroundResource(R.drawable.bg_time_slot_occupied);
                tv.setTextColor(Color.GRAY);
                tv.setEnabled(false);
                // deselect if this slot just became occupied
                if (hour.equals(selectedHour)) selectedHour = null;
            } else {
                tv.setText(hour);
                tv.setBackgroundResource(isSelected ? R.drawable.bg_time_slot_selected : R.drawable.bg_time_slot_available);
                tv.setTextColor(isSelected ? Color.WHITE : Color.BLACK);
                tv.setOnClickListener(v -> {
                    selectedHour = hour;
                    renderHours();
                });
            }

            GridLayout.LayoutParams params = new GridLayout.LayoutParams();
            params.width = 0;
            params.columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f);
            params.setMargins(dp(4), dp(4), dp(4), dp(4));
            tv.setLayoutParams(params);
            gridHours.addView(tv);
        }
    }

    private void requestAppointment() {
        if (selectedHour == null) {
            Toast.makeText(this, "Selecione um horário", Toast.LENGTH_SHORT).show();
            return;
        }

        // Parse hour string like "14:00" into a Brasília-aware ZonedDateTime
        String[] parts = selectedHour.split(":");
        LocalTime time = LocalTime.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
        ZoneId brasiliaZone = ZoneId.of("America/Sao_Paulo");
        ZonedDateTime selectedZdt = ZonedDateTime.of(selectedDate, time, brasiliaZone);

        if (!selectedZdt.isAfter(ZonedDateTime.now(brasiliaZone))) {
            Toast.makeText(this, "Selecione um horário futuro", Toast.LENGTH_SHORT).show();
            return;
        }

        // Convert to UTC ISO-8601 for the API
        String fullDateTime = selectedZdt.withZoneSameInstant(ZoneId.of("UTC"))
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss'Z'"));

        AppointmentRequest req = new AppointmentRequest(
                fullDateTime,
                "RPG",
                etNotes.getText().toString()
        );

        RetrofitClient.getApiService().requestAppointment(req).enqueue(new Callback<Appointment>() {
            @Override
            public void onResponse(Call<Appointment> call, Response<Appointment> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(ScheduleActivity.this, "Solicitação enviada para aprovação da Maya!", Toast.LENGTH_LONG).show();
                    finish();
                } else {
                    String errorMsg = "Falha ao solicitar agendamento.";
                    try {
                        if (response.errorBody() != null) {
                            String body = response.errorBody().string();
                            org.json.JSONObject json = new org.json.JSONObject(body);
                            String msg = json.optString("message", null);
                            if (msg != null && !msg.isEmpty()) {
                                errorMsg = msg;
                            }
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(ScheduleActivity.this, errorMsg, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Appointment> call, Throwable t) {
                Toast.makeText(ScheduleActivity.this, "Erro de conexão: verifique sua internet", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void setupBottomNav() {
        findViewById(R.id.navHome).setOnClickListener(v -> startActivity(new Intent(this, HomeActivity.class)));
        findViewById(R.id.navExercises).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.exercises.ExercisePlanActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> startActivity(new Intent(this, EvolutionActivity.class)));
        findViewById(R.id.navMore).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
