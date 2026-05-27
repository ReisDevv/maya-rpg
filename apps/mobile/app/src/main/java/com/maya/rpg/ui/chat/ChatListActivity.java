package com.maya.rpg.ui.chat;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import com.google.android.material.button.MaterialButton;
import com.maya.rpg.R;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.exercises.ExercisePlanActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;
import com.maya.rpg.ui.schedule.ScheduleActivity;

import java.util.LinkedHashMap;
import java.util.Map;

public class ChatListActivity extends BaseAuthActivity {

    private static final String WHATSAPP_NUMBER = "5511999999999"; // substituir pelo número real da Maya

    private LinearLayout layoutMessages;
    private ScrollView scrollView;
    private EditText etMessage;
    private ImageButton btnSend;
    private LinearLayout layoutQuickReplies;

    private final Handler handler = new Handler(Looper.getMainLooper());

    // Mapa de palavra-chave → resposta do bot
    private static final Map<String, String> BOT_RESPONSES = new LinkedHashMap<>();
    static {
        BOT_RESPONSES.put("agendar",     "Para agendar uma consulta, acesse a aba de Agendamentos no menu inferior. Você pode escolher a data e o horário disponível da Dra. Maya.");
        BOT_RESPONSES.put("consulta",    "Consultas podem ser agendadas diretamente pelo aplicativo! Toque em Agendar Sessão no menu inferior.");
        BOT_RESPONSES.put("exercício",   "Seus exercícios e planos de fisioterapia estão disponíveis na aba Exercícios do menu inferior.");
        BOT_RESPONSES.put("exercicios",  "Seus exercícios e planos de fisioterapia estão disponíveis na aba Exercícios do menu inferior.");
        BOT_RESPONSES.put("dor",         "Se estiver sentindo dor intensa, entre em contato direto com a Dra. Maya pelo WhatsApp para orientação imediata.");
        BOT_RESPONSES.put("pagamento",   "Informações sobre pagamentos ficam disponíveis ao tocar em um agendamento na tela Minha Agenda.");
        BOT_RESPONSES.put("cancelar",    "Para cancelar uma consulta, entre em contato diretamente com a Dra. Maya pelo WhatsApp.");
        BOT_RESPONSES.put("historico",   "Seu histórico de consultas fica na tela Minha Agenda, na aba Histórico.");
        BOT_RESPONSES.put("histórico",   "Seu histórico de consultas fica na tela Minha Agenda, na aba Histórico.");
        BOT_RESPONSES.put("evolução",    "Acompanhe sua evolução na aba Evolução do menu inferior. Lá você vê estatísticas e conquistas do seu tratamento.");
        BOT_RESPONSES.put("evolucao",    "Acompanhe sua evolução na aba Evolução do menu inferior. Lá você vê estatísticas e conquistas do seu tratamento.");
        BOT_RESPONSES.put("whatsapp",    null); // tratado de forma especial
        BOT_RESPONSES.put("contato",     null); // tratado de forma especial
        BOT_RESPONSES.put("falar",       null); // tratado de forma especial
        BOT_RESPONSES.put("humano",      null); // tratado de forma especial
        BOT_RESPONSES.put("atendente",   null); // tratado de forma especial
    }

    // Perguntas rápidas exibidas como chips clicáveis
    private static final String[] QUICK_QUESTIONS = {
        "Como agendar uma consulta?",
        "Ver meus exercícios",
        "Informações sobre pagamento",
        "Falar com a Dra. Maya"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_list);

        layoutMessages    = findViewById(R.id.layoutMessages);
        scrollView        = findViewById(R.id.scrollViewChat);
        etMessage         = findViewById(R.id.etMessage);
        btnSend           = findViewById(R.id.btnSend);
        layoutQuickReplies = findViewById(R.id.layoutQuickReplies);

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());

        setupBottomNav();
        showBotGreeting();
        setupQuickReplies();

        btnSend.setOnClickListener(v -> {
            String text = etMessage.getText().toString().trim();
            if (!text.isEmpty()) {
                etMessage.setText("");
                handleUserMessage(text);
            }
        });

        etMessage.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void afterTextChanged(Editable s) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                btnSend.setEnabled(!s.toString().trim().isEmpty());
                btnSend.setAlpha(s.toString().trim().isEmpty() ? 0.4f : 1.0f);
            }
        });
        btnSend.setEnabled(false);
        btnSend.setAlpha(0.4f);
    }

    private void showBotGreeting() {
        addBotMessage("Olá! 👋 Sou o assistente da Maya Fisioterapia. Como posso te ajudar hoje?");
    }

    private void setupQuickReplies() {
        layoutQuickReplies.removeAllViews();
        for (String question : QUICK_QUESTIONS) {
            MaterialButton chip = new MaterialButton(this,
                    null, com.google.android.material.R.attr.materialButtonOutlinedStyle);
            chip.setText(question);
            chip.setTextSize(12f);
            chip.setInsetTop(0);
            chip.setInsetBottom(0);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.setMargins(0, 0, dp(8), dp(8));
            chip.setLayoutParams(lp);
            chip.setOnClickListener(v -> {
                layoutQuickReplies.setVisibility(View.GONE);
                handleUserMessage(question);
            });
            layoutQuickReplies.addView(chip);
        }
    }

    private void handleUserMessage(String text) {
        addUserMessage(text);
        handler.postDelayed(() -> respondToMessage(text), 600);
    }

    private void respondToMessage(String text) {
        String lower = text.toLowerCase()
                .replace("ã", "a").replace("ç", "c").replace("é", "e")
                .replace("ê", "e").replace("ó", "o").replace("ô", "o")
                .replace("á", "a").replace("í", "i").replace("ú", "u");

        // Verifica se quer falar com humano / WhatsApp
        boolean wantsHuman = lower.contains("whatsapp") || lower.contains("contato")
                || lower.contains("falar") || lower.contains("humano")
                || lower.contains("atendente") || lower.contains("dra") || lower.contains("maya");

        if (wantsHuman) {
            addBotMessage("Claro! Você pode falar diretamente com a Dra. Maya pelo WhatsApp. Toque no botão abaixo:");
            addWhatsAppButton();
            return;
        }

        // Verifica atalhos de navegação
        if (lower.contains("exerc")) {
            addBotMessage(BOT_RESPONSES.get("exercício"));
            addNavigationButton("Ver Exercícios", () ->
                    startActivity(new Intent(this, ExercisePlanActivity.class)));
            return;
        }
        if (lower.contains("agend") || lower.contains("consul") || lower.contains("sessao") || lower.contains("sessão")) {
            addBotMessage(BOT_RESPONSES.get("agendar"));
            addNavigationButton("Agendar Sessão", () ->
                    startActivity(new Intent(this, ScheduleActivity.class)));
            return;
        }
        if (lower.contains("histor") || lower.contains("agenda")) {
            addBotMessage(BOT_RESPONSES.get("histórico"));
            addNavigationButton("Minha Agenda", () ->
                    startActivity(new Intent(this, com.maya.rpg.ui.schedule.AgendaActivity.class)));
            return;
        }
        if (lower.contains("pagamento") || lower.contains("valor") || lower.contains("preco") || lower.contains("preço")) {
            addBotMessage(BOT_RESPONSES.get("pagamento"));
            return;
        }
        if (lower.contains("dor") || lower.contains("dores")) {
            addBotMessage(BOT_RESPONSES.get("dor"));
            addWhatsAppButton();
            return;
        }
        if (lower.contains("evolucao") || lower.contains("evolução") || lower.contains("progress") || lower.contains("conquist")) {
            addBotMessage(BOT_RESPONSES.get("evolução"));
            addNavigationButton("Ver Evolução", () ->
                    startActivity(new Intent(this, EvolutionActivity.class)));
            return;
        }

        // Resposta genérica
        addBotMessage("Não entendi bem sua pergunta. Você pode usar os atalhos acima ou falar diretamente com a Dra. Maya pelo WhatsApp para um atendimento personalizado.");
        addWhatsAppButton();
    }

    private void addUserMessage(String text) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextSize(14f);
        tv.setTextColor(0xFFFFFFFF);
        tv.setBackgroundResource(R.drawable.bg_button_teal);
        int pad = dp(12);
        tv.setPadding(pad, dp(8), pad, dp(8));

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.gravity = Gravity.END;
        lp.setMargins(dp(48), dp(4), 0, dp(4));
        tv.setLayoutParams(lp);
        tv.setMaxWidth((int) (getResources().getDisplayMetrics().widthPixels * 0.75));

        layoutMessages.addView(tv);
        scrollToBottom();
    }

    private void addBotMessage(String text) {
        TextView tv = new TextView(this);
        tv.setText(text);
        tv.setTextSize(14f);
        tv.setTextColor(0xFF333333);
        tv.setBackgroundResource(R.drawable.bg_card_soft);
        int pad = dp(12);
        tv.setPadding(pad, dp(8), pad, dp(8));

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.gravity = Gravity.START;
        lp.setMargins(0, dp(4), dp(48), dp(4));
        tv.setLayoutParams(lp);
        tv.setMaxWidth((int) (getResources().getDisplayMetrics().widthPixels * 0.75));

        layoutMessages.addView(tv);
        scrollToBottom();
    }

    private void addNavigationButton(String label, Runnable action) {
        MaterialButton btn = new MaterialButton(this);
        btn.setText(label);
        btn.setTextSize(13f);
        btn.setInsetTop(0);
        btn.setInsetBottom(0);
        btn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF3EBAD2));

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, dp(40));
        lp.gravity = Gravity.START;
        lp.setMargins(0, dp(4), 0, dp(8));
        btn.setLayoutParams(lp);
        btn.setOnClickListener(v -> action.run());

        layoutMessages.addView(btn);
        scrollToBottom();
    }

    private void addWhatsAppButton() {
        MaterialButton btn = new MaterialButton(this);
        btn.setText("💬  Abrir WhatsApp");
        btn.setTextSize(13f);
        btn.setInsetTop(0);
        btn.setInsetBottom(0);
        btn.setBackgroundTintList(android.content.res.ColorStateList.valueOf(0xFF25D366));

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, dp(44));
        lp.gravity = Gravity.START;
        lp.setMargins(0, dp(4), 0, dp(8));
        btn.setLayoutParams(lp);
        btn.setOnClickListener(v -> openWhatsApp());

        layoutMessages.addView(btn);
        scrollToBottom();
    }

    private void openWhatsApp() {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://wa.me/" + WHATSAPP_NUMBER + "?text=Olá%2C%20vim%20pelo%20app%20Maya!"));
            startActivity(intent);
        } catch (Exception e) {
            android.widget.Toast.makeText(this, "WhatsApp não encontrado", android.widget.Toast.LENGTH_SHORT).show();
        }
    }

    private void scrollToBottom() {
        scrollView.post(() -> scrollView.fullScroll(ScrollView.FOCUS_DOWN));
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
    }

    private void setupBottomNav() {
        findViewById(R.id.navHome).setOnClickListener(v -> startActivity(new Intent(this, HomeActivity.class)));
        findViewById(R.id.navExercises).setOnClickListener(v -> startActivity(new Intent(this, ExercisePlanActivity.class)));
        findViewById(R.id.navSchedule).setOnClickListener(v -> startActivity(new Intent(this, ScheduleActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> startActivity(new Intent(this, EvolutionActivity.class)));
        findViewById(R.id.navMore).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }
}
