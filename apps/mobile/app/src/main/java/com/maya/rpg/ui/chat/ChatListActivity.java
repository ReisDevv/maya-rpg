package com.maya.rpg.ui.chat;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.Conversation;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;
import com.maya.rpg.ui.exercises.ExercisePlanActivity;
import com.maya.rpg.ui.home.HomeActivity;
import com.maya.rpg.ui.profile.ProfileActivity;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

public class ChatListActivity extends BaseAuthActivity {
    private RecyclerView rvConversations;
    private EditText etSearch;
    private List<Conversation> allConversations = new ArrayList<>();
    private ConversationAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat_list);
        rvConversations = findViewById(R.id.rvConversations);
        etSearch = findViewById(R.id.etSearch);
        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
        setupBottomNav();

        rvConversations.setLayoutManager(new LinearLayoutManager(this));

        etSearch.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                filterConversations(s.toString().trim().toLowerCase());
            }
        });

        loadConversations();
    }

    private void loadConversations() {
        RetrofitClient.getApiService().getChatConversations()
                .enqueue(new Callback<List<Conversation>>() {
                    @Override
                    public void onResponse(Call<List<Conversation>> call, Response<List<Conversation>> response) {
                        if (response.isSuccessful() && response.body() != null) {
                            allConversations = response.body();
                            filterConversations(etSearch.getText() != null ? etSearch.getText().toString().trim().toLowerCase() : "");
                        } else {
                            renderEmpty();
                        }
                    }

                    @Override
                    public void onFailure(Call<List<Conversation>> call, Throwable t) {
                        renderEmpty();
                    }
                });
    }

    private void filterConversations(String query) {
        List<Conversation> filtered = new ArrayList<>();
        for (Conversation c : allConversations) {
            if (query.isEmpty() || (c.getTitle() != null && c.getTitle().toLowerCase().contains(query))) {
                filtered.add(c);
            }
        }
        
        adapter = new ConversationAdapter(this, filtered);
        rvConversations.setAdapter(adapter);
    }

    private void renderEmpty() {
        rvConversations.setAdapter(null);
    }

    private void setupBottomNav() {
        findViewById(R.id.navHome).setOnClickListener(v -> startActivity(new Intent(this, HomeActivity.class)));
        findViewById(R.id.navExercises).setOnClickListener(v -> startActivity(new Intent(this, ExercisePlanActivity.class)));
        findViewById(R.id.navSchedule).setOnClickListener(v -> startActivity(new Intent(this, com.maya.rpg.ui.schedule.ScheduleActivity.class)));
        findViewById(R.id.navEvolution).setOnClickListener(v -> startActivity(new Intent(this, EvolutionActivity.class)));
        findViewById(R.id.navMore).setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density);
    }
}
