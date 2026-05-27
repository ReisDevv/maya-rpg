package com.maya.rpg.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.ui.home.HomeActivity;

import java.util.Collections;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * Tela exibida no primeiro acesso para coletar o aceite de termos LGPD.
 * Sem o aceite, o paciente não consegue avançar para a Home.
 *
 * Implementa o requisito não funcional de privacidade/LGPD: minimização de
 * dados, consentimento explícito e cuidado com dados sensíveis de saúde.
 */
public class LgpdConsentActivity extends AppCompatActivity {

    private CheckBox cbLgpd;
    private Button btnAccept;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_lgpd_consent);

        cbLgpd = findViewById(R.id.cbLgpd);
        btnAccept = findViewById(R.id.btnAccept);

        // Button is always enabled so clicks reach the listener and show feedback.
        // Checkbox validation happens inside sendAcceptance().
        btnAccept.setEnabled(true);
        btnAccept.setOnClickListener(v -> sendAcceptance());
    }

    private void sendAcceptance() {
        if (!cbLgpd.isChecked()) {
            Toast.makeText(this, "Você precisa aceitar os termos para continuar.", Toast.LENGTH_SHORT).show();
            return;
        }

        btnAccept.setEnabled(false);
        btnAccept.setText("Salvando...");

        try {
            RetrofitClient.getApiService()
                    .acceptLgpd(Collections.emptyMap())
                    .enqueue(new Callback<Map<String, String>>() {
                @Override
                public void onResponse(Call<Map<String, String>> call,
                                       Response<Map<String, String>> response) {
                    if (isFinishing() || isDestroyed()) return;
                    if (response.isSuccessful()) {
                        TokenManager.saveLgpdAccepted(true);
                        proceedToHome();
                    } else {
                        btnAccept.setEnabled(true);
                        btnAccept.setText("Aceitar e continuar");
                        Toast.makeText(getApplicationContext(),
                                "Erro ao registrar aceite. Tente novamente.",
                                Toast.LENGTH_SHORT).show();
                    }
                }

                @Override
                public void onFailure(Call<Map<String, String>> call, Throwable t) {
                    if (isFinishing() || isDestroyed()) return;
                    btnAccept.setEnabled(true);
                    btnAccept.setText("Aceitar e continuar");
                    Toast.makeText(getApplicationContext(),
                            "Falha de conexão. Tente novamente.",
                            Toast.LENGTH_SHORT).show();
                }
            });
        } catch (Exception e) {
            android.util.Log.e("MayaLGPD", "Erro ao iniciar requisição de aceite LGPD", e);
            btnAccept.setEnabled(true);
            btnAccept.setText("Aceitar e continuar");
            Toast.makeText(this, "Erro inesperado. Tente novamente.", Toast.LENGTH_SHORT).show();
        }
    }

    private void proceedToHome() {
        Intent intent = new Intent(this, HomeActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    public void onBackPressed() {
        // LGPD obrigatória: sai do app em vez de retornar.
        Toast.makeText(this, "Aceite o termo para continuar.", Toast.LENGTH_SHORT).show();
    }
}
