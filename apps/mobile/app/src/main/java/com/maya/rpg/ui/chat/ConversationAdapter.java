package com.maya.rpg.ui.chat;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.maya.rpg.R;
import com.maya.rpg.model.Conversation;
import java.util.List;

public class ConversationAdapter extends RecyclerView.Adapter<ConversationAdapter.ViewHolder> {

    private final List<Conversation> conversations;
    private final Context context;

    public ConversationAdapter(Context context, List<Conversation> conversations) {
        this.context = context;
        this.conversations = conversations;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_conversation, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Conversation item = conversations.get(position);
        holder.tvTitle.setText(item.getTitle());
        holder.tvLastMessage.setText("Toque para abrir");
        
        holder.tvStatus.setText("online");
        holder.tvTime.setText("Agora");
        holder.notificationDot.setVisibility(View.GONE); // Default hidden unless we have unread count

        // Placeholder for now
        holder.ivAvatar.setImageResource(R.drawable.img_perfil2);

        holder.itemView.setOnClickListener(v -> {
            Intent intent = new Intent(context, ChatActivity.class);
            intent.putExtra("conversation_id", item.getId());
            intent.putExtra("conversation_title", item.getTitle());
            context.startActivity(intent);
        });
    }

    @Override
    public int getItemCount() {
        return conversations.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        ImageView ivAvatar;
        TextView tvTitle, tvLastMessage, tvStatus, tvTime;
        View notificationDot;

        public ViewHolder(View itemView) {
            super(itemView);
            ivAvatar = itemView.findViewById(R.id.ivConversationAvatar);
            tvTitle = itemView.findViewById(R.id.tvConversationTitle);
            tvLastMessage = itemView.findViewById(R.id.tvLastMessage);
            tvStatus = itemView.findViewById(R.id.tvStatus);
            tvTime = itemView.findViewById(R.id.tvTime);
            notificationDot = itemView.findViewById(R.id.ivNotificationDot);
        }
    }
}
