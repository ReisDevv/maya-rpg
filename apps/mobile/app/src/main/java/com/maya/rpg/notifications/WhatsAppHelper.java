package com.maya.rpg.notifications;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.widget.Toast;

public class WhatsAppHelper {

    public static void sendReminder(Context context, String phone, String patientName) {
        if (phone == null || phone.trim().isEmpty()) {
            Toast.makeText(context, "Número de telefone não cadastrado.", Toast.LENGTH_SHORT).show();
            return;
        }

        String cleanPhone = phone.replaceAll("[^0-9+]", "");
        String message = "Olá " + patientName + "! 🏋️ Lembrete da Clínica Maya: "
                + "hora de realizar seus exercícios de RPG. Acesse o app para ver o plano!";

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setPackage("com.whatsapp");
            intent.setData(Uri.parse("https://wa.me/" + cleanPhone + "?text=" + Uri.encode(message)));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (isWhatsAppInstalled(context)) {
                context.startActivity(intent);
            } else {
                openWhatsAppWeb(context, cleanPhone, message);
            }
        } catch (Exception e) {
            openWhatsAppWeb(context, cleanPhone, message);
        }
    }

    public static void sendExerciseReminder(Context context, String phone, String exerciseName) {
        if (phone == null || phone.trim().isEmpty()) return;

        String cleanPhone = phone.replaceAll("[^0-9+]", "");
        String message = "🏋️ Seu exercício \"" + exerciseName + "\" está agendado para hoje! "
                + "Abra o app Maya RPG para registrar a execução.";

        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setPackage("com.whatsapp");
            intent.setData(Uri.parse("https://wa.me/" + cleanPhone + "?text=" + Uri.encode(message)));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (isWhatsAppInstalled(context)) {
                context.startActivity(intent);
            } else {
                openWhatsAppWeb(context, cleanPhone, message);
            }
        } catch (Exception e) {
            openWhatsAppWeb(context, cleanPhone, message);
        }
    }

    public static boolean isWhatsAppInstalled(Context context) {
        try {
            context.getPackageManager().getPackageInfo("com.whatsapp", PackageManager.GET_ACTIVITIES);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    private static void openWhatsAppWeb(Context context, String phone, String message) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://wa.me/" + phone + "?text=" + Uri.encode(message)));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(context, "Não foi possível abrir o WhatsApp.", Toast.LENGTH_SHORT).show();
        }
    }
}
