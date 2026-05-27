package com.maya.rpg.ui.exercises;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.gson.Gson;
import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.db.OfflineManager;
import com.maya.rpg.model.FullPrescriptionsResponse;
import com.maya.rpg.model.Prescription;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ExercisePlanActivity extends BaseAuthActivity {

    private RecyclerView rvPrescriptions;
    private ConstraintLayout skeletonLayout;
    private ConstraintLayout layoutEmpty;
    private ConstraintLayout layoutOfflineBanner;
    private EditText etSearch;
    private PrescriptionAdapter adapter;
    private List<Prescription> allPrescriptions = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_exercise_plan);

        rvPrescriptions = findViewById(R.id.rvPrescriptions);
        skeletonLayout = findViewById(R.id.skeletonLayout);
        layoutEmpty = findViewById(R.id.layoutEmpty);
        layoutOfflineBanner = findViewById(R.id.layoutOfflineBanner);
        etSearch = findViewById(R.id.etSearch);

        adapter = new PrescriptionAdapter(new ArrayList<>(), prescription -> {
            Intent intent = new Intent(this, ExerciseDetailActivity.class);
            intent.putExtra("prescription_json", new Gson().toJson(prescription));
            startActivity(intent);
        });

        rvPrescriptions.setLayoutManager(new LinearLayoutManager(this));
        rvPrescriptions.setAdapter(adapter);

        setupBottomNav();

        etSearch.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void afterTextChanged(Editable s) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterPrescriptions(s.toString());
            }
        });

        loadPrescriptions();
    }

    private void showLoading(boolean isLoading) {
        if (isLoading) {
            rvPrescriptions.setVisibility(View.GONE);
            layoutEmpty.setVisibility(View.GONE);
            layoutOfflineBanner.setVisibility(View.GONE);
            skeletonLayout.setVisibility(View.VISIBLE);

            Animation pulse = AnimationUtils.loadAnimation(this, R.anim.shimmer_pulse);
            skeletonLayout.startAnimation(pulse);
        } else {
            skeletonLayout.clearAnimation();
            skeletonLayout.setVisibility(View.GONE);
        }
    }

    private void showEmptyState() {
        layoutEmpty.setVisibility(View.VISIBLE);
        rvPrescriptions.setVisibility(View.GONE);
        layoutOfflineBanner.setVisibility(View.GONE);
    }

    private void loadPrescriptions() {
        String patientId = TokenManager.getPatientId();
        if (patientId == null) {
            Toast.makeText(this, "Paciente não identificado", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        showLoading(true);

        RetrofitClient.getApiService()
                .getMyFullPrescriptions()
                .enqueue(new Callback<FullPrescriptionsResponse>() {
                    @Override
                    public void onResponse(Call<FullPrescriptionsResponse> call,
                                           Response<FullPrescriptionsResponse> response) {
                        
                        showLoading(false);

                        if (response.isSuccessful() && response.body() != null) {
                            allPrescriptions = response.body().getData();
                            android.util.Log.d("MayaPlan", "Prescrições recebidas: " + (allPrescriptions != null ? allPrescriptions.size() : "null"));
                            
                            if (allPrescriptions == null || allPrescriptions.isEmpty()) {
                                showEmptyState();
                            } else {
                                OfflineManager.cachePrescriptions(
                                        ExercisePlanActivity.this, patientId, allPrescriptions);
                                adapter.updateList(allPrescriptions);
                                rvPrescriptions.setVisibility(View.VISIBLE);
                            }
                        } 
                        else if (response.code() == 404) {
                            android.util.Log.w("MayaPlan", "404: Nenhuma prescrição encontrada para o paciente logado");
                            showEmptyState();
                        }
                        else if (response.code() == 401) {
                            android.util.Log.e("MayaPlan", "401: Token inválido ou expirado. Redirecionando para login.");
                            TokenManager.clearAll();
                            startActivity(new Intent(ExercisePlanActivity.this,
                                    com.maya.rpg.ui.auth.LoginActivity.class));
                            finishAffinity();
                        }
                        else if (response.code() == 403) {
                            android.util.Log.e("MayaPlan", "403: Acesso negado para GET /prescriptions/me/full");
                            loadFromCache(patientId);
                        }
                        else {
                            try {
                                String errorBody = response.errorBody() != null ? response.errorBody().string() : "sem body";
                                android.util.Log.e("MayaPlan", "Erro HTTP " + response.code() + ": " + errorBody);
                            } catch (Exception e) {
                                android.util.Log.e("MayaPlan", "Erro HTTP " + response.code() + " (body ilegível)");
                            }
                            loadFromCache(patientId);
                        }
                    }

                    @Override
                    public void onFailure(Call<FullPrescriptionsResponse> call, Throwable t) {
                        showLoading(false);
                        android.util.Log.e("MayaPlan", "Falha de rede ou parse JSON ao carregar prescrições. Causa: " + t.getClass().getSimpleName() + " - " + t.getMessage(), t);
                        // Erro real de rede (SocketTimeout, NoRouteToHost) ou falha de desserialização
                        loadFromCache(patientId);
                    }
                });
    }

    private void loadFromCache(String patientId) {
        Handler mainHandler = new Handler(Looper.getMainLooper());
        OfflineManager.loadCachedPrescriptions(this, patientId, mainHandler, cached -> {
            if (cached != null && !cached.isEmpty()) {
                allPrescriptions = cached;
                adapter.updateList(allPrescriptions);
                layoutOfflineBanner.setVisibility(View.VISIBLE);
                rvPrescriptions.setVisibility(View.VISIBLE);
                layoutEmpty.setVisibility(View.GONE);
            } else {
                showEmptyState();
                Toast.makeText(this,
                        "Sem conexão e sem cache local disponível.", Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setupBottomNav() {
        findViewById(R.id.navHome).setOnClickListener(v -> {
            startActivity(new Intent(this, HomeActivity.class));
            finish();
        });
        findViewById(R.id.navExercises).setOnClickListener(v -> {
            // Already here
        });
        findViewById(R.id.navEvolution).setOnClickListener(v -> {
            startActivity(new Intent(this, EvolutionActivity.class));
        });
        findViewById(R.id.navMore).setOnClickListener(v -> {
            startActivity(new Intent(this, ProfileActivity.class));
        });
    }

    private void filterPrescriptions(String query) {
        if (query.isEmpty()) {
            adapter.updateList(allPrescriptions);
            layoutEmpty.setVisibility(View.GONE);
            rvPrescriptions.setVisibility(View.VISIBLE);
            return;
        }
        List<Prescription> filtered = allPrescriptions.stream()
                .filter(p -> p.getTitle().toLowerCase().contains(query.toLowerCase()))
                .collect(Collectors.toList());
        adapter.updateList(filtered);
        
        if (filtered.isEmpty()) {
            layoutEmpty.setVisibility(View.VISIBLE);
            rvPrescriptions.setVisibility(View.GONE);
        } else {
            layoutEmpty.setVisibility(View.GONE);
            rvPrescriptions.setVisibility(View.VISIBLE);
        }
    }
}
