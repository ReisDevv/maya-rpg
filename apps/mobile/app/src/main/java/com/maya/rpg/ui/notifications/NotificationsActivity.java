package com.maya.rpg.ui.notifications;

import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.NotificationItem;
import com.maya.rpg.model.PaginatedResponse;
import com.maya.rpg.ui.BaseAuthActivity;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class NotificationsActivity extends BaseAuthActivity {

    private LinearLayout layoutNotifications;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_notifications);

        layoutNotifications = findViewById(R.id.layoutNotifications);
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        loadNotifications();
    }

    private void loadNotifications() {
        RetrofitClient.getApiService().getMyNotifications(50)
                .enqueue(new Callback<PaginatedResponse<NotificationItem>>() {
                    @Override
                    public void onResponse(Call<PaginatedResponse<NotificationItem>> call,
                                           Response<PaginatedResponse<NotificationItem>> response) {
                        if (isFinishing() || isDestroyed()) return;
                        if (!response.isSuccessful() || response.body() == null) {
                            showEmpty();
                            return;
                        }
                        List<NotificationItem> items = response.body().getData();
                        if (items == null || items.isEmpty()) {
                            showEmpty();
                            return;
                        }
                        renderNotifications(items);

                        // Marca todas como lidas ao abrir a tela
                        RetrofitClient.getApiService()
                                .markAllNotificationsRead(Collections.emptyMap())
                                .enqueue(new Callback<Void>() {
                                    @Override public void onResponse(Call<Void> c, Response<Void> r) {}
                                    @Override public void onFailure(Call<Void> c, Throwable t) {}
                                });
                    }

                    @Override
                    public void onFailure(Call<PaginatedResponse<NotificationItem>> call, Throwable t) {
                        if (!isFinishing()) showEmpty();
                    }
                });
    }

    private void renderNotifications(List<NotificationItem> items) {
        layoutNotifications.removeAllViews();
        for (NotificationItem item : items) {
            View row = getLayoutInflater().inflate(R.layout.item_notification, layoutNotifications, false);

            TextView tvTitle = row.findViewById(R.id.tvNotifTitle);
            TextView tvBody = row.findViewById(R.id.tvNotifBody);
            TextView tvDate = row.findViewById(R.id.tvNotifDate);
            View dot = row.findViewById(R.id.viewUnreadDot);

            tvTitle.setText(item.getTitle());
            tvBody.setText(item.getBody() != null ? item.getBody() : "");
            tvDate.setText(formatDate(item.getCreatedAt()));
            dot.setVisibility(item.isRead() ? View.GONE : View.VISIBLE);

            layoutNotifications.addView(row);
        }
    }

    private void showEmpty() {
        layoutNotifications.removeAllViews();
        TextView tv = new TextView(this);
        tv.setText("Nenhuma notificação por aqui ainda.");
        tv.setPadding(0, 80, 0, 0);
        tv.setGravity(android.view.Gravity.CENTER);
        tv.setTextColor(0xFF9E9E9E);
        tv.setTextSize(15);
        layoutNotifications.addView(tv);
    }

    private String formatDate(String iso) {
        if (iso == null || iso.isEmpty()) return "";
        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            input.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
            Date d = input.parse(iso);
            if (d != null) {
                return new SimpleDateFormat("dd/MM 'às' HH:mm", new Locale("pt", "BR")).format(d);
            }
        } catch (ParseException e) {
            try {
                SimpleDateFormat fallback = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
                fallback.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                Date d = fallback.parse(iso);
                if (d != null) {
                    return new SimpleDateFormat("dd/MM 'às' HH:mm", new Locale("pt", "BR")).format(d);
                }
            } catch (ParseException ignored) {}
        }
        return "";
    }
}
