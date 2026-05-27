package com.maya.rpg.ui.exercises;

import android.content.Intent;
import android.os.Bundle;

import com.maya.rpg.R;
import com.maya.rpg.ui.BaseAuthActivity;
import com.maya.rpg.ui.evolution.EvolutionActivity;

public class CheckInSuccessActivity extends BaseAuthActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_checkin_success);
        findViewById(R.id.btnDone).setOnClickListener(v -> finish());
        findViewById(R.id.btnViewEvolution).setOnClickListener(v -> {
            startActivity(new Intent(this, EvolutionActivity.class));
            finish();
        });
    }
}
