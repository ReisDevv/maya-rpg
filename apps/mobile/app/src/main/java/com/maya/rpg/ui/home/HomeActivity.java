package com.maya.rpg.ui.home;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.TextView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.model.Appointment;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.exercises.ExercisePlanActivity;
import com.maya.rpg.ui.profile.ProfileActivity;
import com.maya.rpg.ui.chat.ChatListActivity;
import com.maya.rpg.ui.schedule.AgendaActivity;
import com.maya.rpg.ui.schedule.ScheduleActivity;

import com.maya.rpg.model.CheckInHistoryResponse;
import com.maya.rpg.model.NotificationItem;
import com.maya.rpg.model.PaginatedResponse;
import android.widget.ProgressBar;
import java.util.HashSet;
import java.util.Set;
import android.animation.ObjectAnimator;
import android.view.animation.DecelerateInterpolator;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.notifications.NotificationsActivity;
import java.text.SimpleDateFormat;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class HomeActivity extends BaseAuthActivity {
    private static final int REQUEST_POST_NOTIFICATIONS = 1001;
    private Calendar currentWeekCalendar;
    private List<TextView> dayTextViews;
    private int selectedDayIndex = -1;
    private List<Appointment> weekAppointments = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);
        requestNotificationPermissionIfNeeded();

        // O agendamento dos lembretes é centralizado em MayaApplication para evitar
        // duplicação de WorkRequests (WorkManager.enqueueUniquePeriodicWork garante
        // que só uma instância exista, mas mantemos a chamada num único lugar).

        String userName = TokenManager.getUserName();
        if (userName != null) {
            TextView tvUserName = findViewById(R.id.tvUserName);
            tvUserName.setText("Olá, " + userName.split(" ")[0]);
        }
        loadNextAppointment();
        loadEvolutionData();

        findViewById(R.id.notificationBell).setOnClickListener(v ->
                startActivity(new Intent(this, NotificationsActivity.class)));

        // 3. Configura Navegação para EXERCÍCIOS
        View.OnClickListener openExercises = v ->
                startActivity(new Intent(this, ExercisePlanActivity.class));
        findViewById(R.id.cardPostural).setOnClickListener(openExercises);
        findViewById(R.id.cardBalance).setOnClickListener(openExercises);
        findViewById(R.id.btnStartPostural).setOnClickListener(openExercises);
        findViewById(R.id.btnStartBalance).setOnClickListener(openExercises);
        findViewById(R.id.navExercises).setOnClickListener(openExercises);

        // 4. Configura Navegação para EVOLUÇÃO
        findViewById(R.id.cardEvolution).setOnClickListener(v ->
                startActivity(new Intent(this, EvolutionActivity.class))
        );
        findViewById(R.id.navEvolution).setOnClickListener(v ->
                startActivity(new Intent(this, EvolutionActivity.class))
        );

        // 5. Configura Navegação para PERFIL (clique no Avatar)
        findViewById(R.id.ivAvatar).setOnClickListener(v ->
                startActivity(new Intent(this, ProfileActivity.class))
        );

        // Home nav apenas scrolla para o topo ou não faz nada
        findViewById(R.id.navHome).setOnClickListener(v -> {
            // Já estamos na Home
        });

        findViewById(R.id.navMore).setOnClickListener(v -> {
            startActivity(new Intent(this, ProfileActivity.class));
        });

        findViewById(R.id.cardSchedule).setOnClickListener(v ->
                startActivity(new Intent(this, ScheduleActivity.class)));
        findViewById(R.id.cardChat).setOnClickListener(v ->
                startActivity(new Intent(this, ChatListActivity.class)));
        findViewById(R.id.cardAgenda).setOnClickListener(v ->
                startActivity(new Intent(this, AgendaActivity.class)));

        initCalendar();
        animateHomeEntrance();
    }

    private void animateHomeEntrance() {
        Animation slideUp = AnimationUtils.loadAnimation(this, R.anim.slide_up_fade_in);

        View header = findViewById(R.id.ivAvatar);
        View cardEvolution = findViewById(R.id.cardEvolution);
        View cardPostural = findViewById(R.id.cardPostural);
        View cardBalance = findViewById(R.id.cardBalance);
        View cardWeekSchedule = findViewById(R.id.cardWeekSchedule);
        View horizontalActions = findViewById(R.id.horizontalActions);

        // Animate views with increasing start offsets for a staggered cascade effect
        animateWithDelay(header, 0);
        animateWithDelay(cardEvolution, 80);
        animateWithDelay(cardPostural, 160);
        animateWithDelay(cardBalance, 160);
        animateWithDelay(cardWeekSchedule, 240);
        animateWithDelay(horizontalActions, 320);
    }

    private void animateWithDelay(View view, long delayMs) {
        if (view == null) return;
        view.setAlpha(0f);
        Animation anim = AnimationUtils.loadAnimation(this, R.anim.slide_up_fade_in);
        anim.setStartOffset(delayMs);
        anim.setFillAfter(true);
        anim.setAnimationListener(new Animation.AnimationListener() {
            @Override public void onAnimationStart(Animation a) { view.setAlpha(1f); }
            @Override public void onAnimationEnd(Animation a) {}
            @Override public void onAnimationRepeat(Animation a) {}
        });
        view.startAnimation(anim);
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadNextAppointment();
        fetchAppointmentsForCalendar();
        checkUnreadNotifications();
    }

    private void initCalendar() {
        currentWeekCalendar = Calendar.getInstance();
        currentWeekCalendar.setFirstDayOfWeek(Calendar.MONDAY);
        currentWeekCalendar.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);

        dayTextViews = new ArrayList<>();
        dayTextViews.add(findViewById(R.id.tvDay1));
        dayTextViews.add(findViewById(R.id.tvDay2));
        dayTextViews.add(findViewById(R.id.tvDay3));
        dayTextViews.add(findViewById(R.id.tvDay4));
        dayTextViews.add(findViewById(R.id.tvDay5));

        findViewById(R.id.ivSchedulePrev).setOnClickListener(v -> {
            currentWeekCalendar.add(Calendar.WEEK_OF_YEAR, -1);
            updateCalendarUI();
        });
        findViewById(R.id.ivScheduleNext).setOnClickListener(v -> {
            currentWeekCalendar.add(Calendar.WEEK_OF_YEAR, 1);
            updateCalendarUI();
        });

        updateCalendarUI();
    }

    private void updateCalendarUI() {
        Calendar tempCal = (Calendar) currentWeekCalendar.clone();
        SimpleDateFormat dayFormat = new SimpleDateFormat("EEE", new Locale("pt", "BR"));
        SimpleDateFormat numberFormat = new SimpleDateFormat("dd", Locale.getDefault());

        // Ao trocar de semana, desmarca seleção e esconde painel
        selectedDayIndex = -1;
        hideDayDetail();

        for (int i = 0; i < 5; i++) {
            TextView tv = dayTextViews.get(i);
            String dayName = dayFormat.format(tempCal.getTime()).toUpperCase().substring(0, 3);
            String dayNumber = numberFormat.format(tempCal.getTime());
            tv.setText(dayName + "\n" + dayNumber);
            tv.setBackground(null);
            tv.setTypeface(null, android.graphics.Typeface.NORMAL);

            final int dayIndex = i;
            tv.setClickable(true);
            tv.setFocusable(true);
            tv.setOnClickListener(v -> selectDay(dayIndex));

            tempCal.add(Calendar.DAY_OF_MONTH, 1);
        }

        fetchAppointmentsForCalendar();
    }

    private void selectDay(int index) {
        selectedDayIndex = index;
        // Redesenha destaques (mantém seleção)
        applyDayHighlights();
        showDayDetail(index);
    }

    private void fetchAppointmentsForCalendar() {
        String monthStr = new SimpleDateFormat("yyyy-MM", Locale.US).format(currentWeekCalendar.getTime());
        RetrofitClient.getApiService().getMyAppointments(monthStr).enqueue(new Callback<PaginatedResponse<Appointment>>() {
            @Override
            public void onResponse(Call<PaginatedResponse<Appointment>> call, Response<PaginatedResponse<Appointment>> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getData() != null) {
                    weekAppointments = response.body().getData();
                    applyDayHighlights();
                    if (selectedDayIndex >= 0) showDayDetail(selectedDayIndex);
                }
            }

            @Override
            public void onFailure(Call<PaginatedResponse<Appointment>> call, Throwable t) {}
        });
    }

    private void applyDayHighlights() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar tempCal = (Calendar) currentWeekCalendar.clone();

        for (int i = 0; i < 5; i++) {
            TextView tv = dayTextViews.get(i);
            String dayStr = sdf.format(tempCal.getTime());

            boolean isSelected = (i == selectedDayIndex);
            boolean hasAppointment = false;
            for (Appointment app : weekAppointments) {
                if (app.getDateTime() != null && localDateOf(app.getDateTime()).equals(dayStr)) {
                    hasAppointment = true;
                    break;
                }
            }

            if (isSelected) {
                tv.setBackgroundResource(R.drawable.bg_day_selected);
                tv.setTypeface(null, android.graphics.Typeface.BOLD);
                tv.setTextColor(android.graphics.Color.WHITE);
            } else if (hasAppointment) {
                tv.setBackgroundResource(R.drawable.bg_day_has_appointment);
                tv.setTypeface(null, android.graphics.Typeface.BOLD);
                tv.setTextColor(android.graphics.Color.BLACK);
            } else {
                tv.setBackground(null);
                tv.setTypeface(null, android.graphics.Typeface.NORMAL);
                tv.setTextColor(android.graphics.Color.BLACK);
            }

            tempCal.add(Calendar.DAY_OF_MONTH, 1);
        }
    }

    private void showDayDetail(int index) {
        android.widget.LinearLayout layoutDayDetail = findViewById(R.id.layoutDayDetail);
        View divider = findViewById(R.id.dividerDayDetail);
        TextView tvEmpty = findViewById(R.id.tvDayDetailEmpty);
        View cardAppt = findViewById(R.id.cardDayAppointment);
        TextView tvTime = findViewById(R.id.tvDayApptTime);
        TextView tvStatus = findViewById(R.id.tvDayApptStatus);
        TextView tvType = findViewById(R.id.tvDayApptType);

        if (layoutDayDetail == null) return;

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Calendar tempCal = (Calendar) currentWeekCalendar.clone();
        tempCal.add(Calendar.DAY_OF_MONTH, index);
        String dayStr = sdf.format(tempCal.getTime());

        Appointment found = null;
        for (Appointment app : weekAppointments) {
            if (app.getDateTime() != null && localDateOf(app.getDateTime()).equals(dayStr)) {
                found = app;
                break;
            }
        }

        divider.setVisibility(View.VISIBLE);
        layoutDayDetail.setVisibility(View.VISIBLE);

        if (found == null) {
            tvEmpty.setVisibility(View.VISIBLE);
            cardAppt.setVisibility(View.GONE);
        } else {
            tvEmpty.setVisibility(View.GONE);
            cardAppt.setVisibility(View.VISIBLE);

            // Horário em Brasília
            try {
                java.text.SimpleDateFormat inputFmt = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                inputFmt.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                Date d = inputFmt.parse(found.getDateTime());
                if (d == null) {
                    inputFmt = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                    inputFmt.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                    d = inputFmt.parse(found.getDateTime());
                }
                if (d != null) {
                    java.text.SimpleDateFormat timeFmt = new java.text.SimpleDateFormat("HH:mm", new Locale("pt", "BR"));
                    timeFmt.setTimeZone(java.util.TimeZone.getTimeZone("America/Sao_Paulo"));
                    tvTime.setText(timeFmt.format(d));
                }
            } catch (Exception ignored) {
                tvTime.setText("--:--");
            }

            // Status
            String status = found.getStatus() != null ? found.getStatus() : "";
            switch (status.toUpperCase()) {
                case "CONFIRMED": tvStatus.setText("✓ Confirmada"); tvStatus.setTextColor(android.graphics.Color.parseColor("#2E7D32")); break;
                case "PENDING":   tvStatus.setText("⏳ Aguardando confirmação"); tvStatus.setTextColor(android.graphics.Color.parseColor("#E65100")); break;
                case "CANCELLED": tvStatus.setText("✕ Cancelada"); tvStatus.setTextColor(android.graphics.Color.parseColor("#C62828")); break;
                default:          tvStatus.setText(status); tvStatus.setTextColor(android.graphics.Color.GRAY);
            }

            // Tipo
            tvType.setText("Sessão de " + (found.getDurationMinutes() > 0 ? found.getDurationMinutes() + " min" : "RPG"));
        }
    }

    private void hideDayDetail() {
        View divider = findViewById(R.id.dividerDayDetail);
        android.widget.LinearLayout layout = findViewById(R.id.layoutDayDetail);
        if (divider != null) divider.setVisibility(View.GONE);
        if (layout != null) layout.setVisibility(View.GONE);
    }

    // Converte ISO-8601 UTC para "yyyy-MM-dd" no fuso de Brasília
    private String localDateOf(String isoUtc) {
        try {
            java.text.SimpleDateFormat inputFmt = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            inputFmt.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            Date d = inputFmt.parse(isoUtc);
            if (d == null) {
                inputFmt = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                inputFmt.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                d = inputFmt.parse(isoUtc);
            }
            if (d != null) {
                java.text.SimpleDateFormat outFmt = new java.text.SimpleDateFormat("yyyy-MM-dd", Locale.US);
                outFmt.setTimeZone(java.util.TimeZone.getTimeZone("America/Sao_Paulo"));
                return outFmt.format(d);
            }
        } catch (Exception ignored) {}
        // fallback: primeiros 10 chars (funciona se já vier como data local)
        return isoUtc.length() >= 10 ? isoUtc.substring(0, 10) : isoUtc;
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return;
        }

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            return;
        }

        ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                REQUEST_POST_NOTIFICATIONS
        );
    }

    private void loadNextAppointment() {
        TextView tvNextAppointment = findViewById(R.id.tvNextAppointment);
        if (tvNextAppointment == null) return;

        RetrofitClient.getApiService().getMyUpcomingAppointments(1)
                .enqueue(new Callback<List<Appointment>>() {
                    @Override
                    public void onResponse(Call<List<Appointment>> call,
                                           Response<List<Appointment>> response) {
                        if (!response.isSuccessful() || response.body() == null || response.body().isEmpty()) {
                            tvNextAppointment.setText("Próxima consulta: nenhuma agendada");
                            return;
                        }

                        Appointment appointment = response.body().get(0);
                        String statusSuffix = "PENDING".equals(appointment.getStatus())
                                ? " (aguardando confirmação)" : "";
                        tvNextAppointment.setText("Próxima consulta: "
                                + formatAppointmentDate(appointment.getDateTime()) + statusSuffix);
                    }

                    @Override
                    public void onFailure(Call<List<Appointment>> call, Throwable t) {
                        tvNextAppointment.setText("Próxima consulta: indisponível offline");
                    }
                });
    }

    private void checkUnreadNotifications() {
        RetrofitClient.getApiService().getMyNotifications(20).enqueue(new Callback<PaginatedResponse<NotificationItem>>() {
            @Override
            public void onResponse(Call<PaginatedResponse<NotificationItem>> call,
                                   Response<PaginatedResponse<NotificationItem>> response) {
                if (isFinishing() || isDestroyed()) return;
                if (!response.isSuccessful() || response.body() == null) return;
                List<NotificationItem> all = response.body().getData();
                if (all == null) return;

                boolean hasUnread = false;
                for (NotificationItem n : all) {
                    if (!n.isRead()) { hasUnread = true; break; }
                }

                View badge = findViewById(R.id.notificationBadge);
                if (badge != null) {
                    badge.setVisibility(hasUnread ? View.VISIBLE : View.GONE);
                }
            }

            @Override
            public void onFailure(Call<PaginatedResponse<NotificationItem>> call, Throwable t) {}
        });
    }

    private String formatAppointmentDate(String value) {
        if (value == null || value.isEmpty()) return "data a confirmar";

        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            input.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            Date date = input.parse(value);
            if (date != null) {
                return new SimpleDateFormat("dd/MM 'às' HH:mm", Locale.getDefault()).format(date);
            }
        } catch (ParseException ignored) {
            try {
                SimpleDateFormat fallback = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                fallback.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                Date date = fallback.parse(value);
                if (date != null) {
                    return new SimpleDateFormat("dd/MM 'às' HH:mm", Locale.getDefault()).format(date);
                }
            } catch (ParseException ignoredAgain) {
                return value;
            }
        }

        return value;
    }

    private void loadEvolutionData() {
        ProgressBar pbEvolution = findViewById(R.id.pbEvolution);
        TextView tvDays = findViewById(R.id.tvDays);
        if (pbEvolution == null || tvDays == null) return;

        RetrofitClient.getApiService().getMyHistory().enqueue(new Callback<PaginatedResponse<CheckInHistoryResponse>>() {
            @Override
            public void onResponse(Call<PaginatedResponse<CheckInHistoryResponse>> call, Response<PaginatedResponse<CheckInHistoryResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    updateEvolutionUI(response.body().getData());
                }
            }

            @Override
            public void onFailure(Call<PaginatedResponse<CheckInHistoryResponse>> call, Throwable t) {
                // Manter valores padrão em caso de erro
            }
        });
    }

    private void updateEvolutionUI(List<CheckInHistoryResponse> history) {
        if (history == null) return;

        Calendar now = Calendar.getInstance();
        now.setFirstDayOfWeek(Calendar.MONDAY);
        now.set(Calendar.HOUR_OF_DAY, 0);
        now.set(Calendar.MINUTE, 0);
        now.set(Calendar.SECOND, 0);
        now.set(Calendar.MILLISECOND, 0);
        
        // Início da semana (Segunda-feira)
        Calendar startOfWeek = (Calendar) now.clone();
        startOfWeek.set(Calendar.DAY_OF_WEEK, Calendar.MONDAY);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
        Set<String> activeDays = new HashSet<>();

        for (CheckInHistoryResponse checkIn : history) {
            if (checkIn.getExecutedAt() != null) {
                try {
                    // O formato costuma ser ISO8601 (yyyy-MM-dd'T'HH:mm:ss.SSSZ)
                    String datePart = checkIn.getExecutedAt().substring(0, 10);
                    Date checkInDate = new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(datePart);
                    if (checkInDate != null && !checkInDate.before(startOfWeek.getTime())) {
                        activeDays.add(datePart);
                    }
                } catch (Exception ignored) {}
            }
        }

        int daysCount = activeDays.size();
        ProgressBar pbEvolution = findViewById(R.id.pbEvolution);
        TextView tvDays = findViewById(R.id.tvDays);

        if (tvDays != null) {
            tvDays.setText(daysCount + "\ndias");
        }

        if (pbEvolution != null) {
            // Meta de 3 dias
            int targetProgress = (int) ((daysCount / 3.0) * 100);
            if (targetProgress > 100) targetProgress = 100;
            
            // Animação da barra enchendo
            ObjectAnimator animation = ObjectAnimator.ofInt(pbEvolution, "progress", 0, targetProgress);
            animation.setDuration(1000); // 1 segundo de duração
            animation.setInterpolator(new DecelerateInterpolator());
            animation.start();
        }
    }
}
