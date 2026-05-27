package com.maya.rpg.ui.chat;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.ChatMessage;
import com.maya.rpg.model.MessageRequest;
import com.maya.rpg.ui.BaseAuthActivity;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChatActivity extends BaseAuthActivity {
    private String conversationId;
    private LinearLayout layoutMessages;
    private ScrollView scrollMessages;
    private EditText etMessage;
    private Handler pollHandler = new Handler(Looper.getMainLooper());
    private static final long POLL_INTERVAL_MS = 15000;

    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            loadMessages();
            pollHandler.postDelayed(this, POLL_INTERVAL_MS);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);
        conversationId = getIntent().getStringExtra("conversation_id");
        String title = getIntent().getStringExtra("conversation_title");

        layoutMessages = findViewById(R.id.layoutMessages);
        scrollMessages = findViewById(R.id.scrollMessages);
        etMessage = findViewById(R.id.etMessage);
        ((TextView) findViewById(R.id.tvTitle)).setText(title != null ? title : "Mensagens");

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        findViewById(R.id.btnSend).setOnClickListener(v -> sendMessage());
        loadMessages();
    }

    @Override
    protected void onResume() {
        super.onResume();
        pollHandler.postDelayed(pollRunnable, POLL_INTERVAL_MS);
    }

    @Override
    protected void onPause() {
        super.onPause();
        pollHandler.removeCallbacks(pollRunnable);
    }

    private void loadMessages() {
        if (conversationId == null) return;
        RetrofitClient.getApiService().getChatMessages(conversationId)
                .enqueue(new Callback<List<ChatMessage>>() {
                    @Override
                    public void onResponse(Call<List<ChatMessage>> call, Response<List<ChatMessage>> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            renderMessages(response.body());
                        }
                    }

                    @Override
                    public void onFailure(Call<List<ChatMessage>> call, Throwable t) {
                        Toast.makeText(ChatActivity.this, "Mensagens indisponíveis offline.", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void renderMessages(List<ChatMessage> messages) {
        layoutMessages.removeAllViews();
        for (ChatMessage message : messages) {
            addBubble(message.getBody(), "PATIENT".equals(message.getSenderRole()));
        }
        scrollMessages.post(() -> scrollMessages.fullScroll(ScrollView.FOCUS_DOWN));
    }

    private void addBubble(String body, boolean mine) {
        TextView bubble = new TextView(this);
        bubble.setText(body);
        bubble.setTextSize(15);
        bubble.setTextColor(mine ? 0xFFFFFFFF : 0xFF000000);
        bubble.setBackgroundResource(mine ? R.drawable.bg_chat_out : R.drawable.bg_chat_in);
        bubble.setPadding(dp(14), dp(10), dp(14), dp(10));

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(0, 0, 0, dp(10));
        params.gravity = mine ? Gravity.END : Gravity.START;
        params.width = (int) (getResources().getDisplayMetrics().widthPixels * 0.72f);
        bubble.setLayoutParams(params);
        layoutMessages.addView(bubble);
    }

    private void sendMessage() {
        String body = etMessage.getText() != null ? etMessage.getText().toString().trim() : "";
        if (body.isEmpty()) return;
        etMessage.setText("");
        RetrofitClient.getApiService().sendChatMessage(conversationId, new MessageRequest(body))
                .enqueue(new Callback<ChatMessage>() {
                    @Override
                    public void onResponse(Call<ChatMessage> call, Response<ChatMessage> response) {
                        if (response.isSuccessful()) {
                            loadMessages();
                        } else {
                            Toast.makeText(ChatActivity.this, "Não foi possível enviar.", Toast.LENGTH_SHORT).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<ChatMessage> call, Throwable t) {
                        Toast.makeText(ChatActivity.this, "Mensagem não enviada offline.", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
    }
}
