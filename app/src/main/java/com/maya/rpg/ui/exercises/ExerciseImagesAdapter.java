package com.maya.rpg.ui.exercises;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.maya.rpg.R;

import java.util.List;

/**
 * Adapter do ViewPager2 que renderiza a sequência de imagens de um exercício.
 * Usa Glide para carregar URLs remotas com cache transparente.
 */
public class ExerciseImagesAdapter extends RecyclerView.Adapter<ExerciseImagesAdapter.ImageHolder> {

    private final List<String> imageUrls;

    public ExerciseImagesAdapter(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    @NonNull
    @Override
    public ImageHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_exercise_image, parent, false);
        return new ImageHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ImageHolder holder, int position) {
        Glide.with(holder.imageView.getContext())
                .load(imageUrls.get(position))
                .into(holder.imageView);
    }

    @Override
    public int getItemCount() {
        return imageUrls != null ? imageUrls.size() : 0;
    }

    static class ImageHolder extends RecyclerView.ViewHolder {
        final ImageView imageView;

        ImageHolder(@NonNull View itemView) {
            super(itemView);
            imageView = itemView.findViewById(R.id.ivExercisePage);
        }
    }
}
