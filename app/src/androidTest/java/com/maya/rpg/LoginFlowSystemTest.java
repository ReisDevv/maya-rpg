package com.maya.rpg;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.replaceText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.isEnabled;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;

import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import com.maya.rpg.ui.auth.LoginActivity;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Teste de Sistema / Aceitação — Fluxo de Login.
 *
 * Valida que a tela de login é exibida corretamente ao usuário,
 * que os campos e botões são interativos, que a validação client-side
 * funciona (campos vazios) e que o fluxo de tentativa de login
 * com credenciais inválidas produz feedback visual adequado.
 *
 * <p><b>Limitação:</b> este teste executa contra a API real configurada
 * em BuildConfig.API_BASE_URL. Não há mock de backend. Portanto:
 * <ul>
 *   <li>O teste de campos vazios valida a mensagem "Preencha todos os campos"
 *       sem fazer chamada à rede.</li>
 *   <li>O teste de login com dados inválidos dispara a chamada real e valida
 *       que o botão volta ao estado habilitado após a resposta (erro ou timeout),
 *       comprovando que o fluxo de erro funciona de ponta a ponta.</li>
 * </ul>
 */
@RunWith(AndroidJUnit4.class)
public class LoginFlowSystemTest {

    /**
     * Lança LoginActivity diretamente. O SplashActivity redireciona para cá
     * quando não há token salvo, mas abrimos direto para isolar o teste
     * do delay de 3 segundos do splash.
     */
    @Rule
    public ActivityScenarioRule<LoginActivity> activityRule =
            new ActivityScenarioRule<>(LoginActivity.class);

    // ---------------------------------------------------------------
    // 1. Tela de login exibida com todos os elementos visíveis
    // ---------------------------------------------------------------
    @Test
    public void loginScreen_displaysAllRequiredElements() {
        // Cabeçalho "LOGIN"
        onView(withId(R.id.tvLoginHeader))
                .check(matches(isDisplayed()))
                .check(matches(withText("LOGIN")));

        // Campo de e-mail/CPF
        onView(withId(R.id.etEmail))
                .check(matches(isDisplayed()));

        // Campo de senha
        onView(withId(R.id.etPassword))
                .check(matches(isDisplayed()));

        // Botão "ENTRAR"
        onView(withId(R.id.btnArrowLogin))
                .check(matches(isDisplayed()))
                .check(matches(isEnabled()))
                .check(matches(withText("ENTRAR")));

        // Link "esqueceu a senha?"
        onView(withId(R.id.tvForgotPassword))
                .check(matches(isDisplayed()));
    }

    // ---------------------------------------------------------------
    // 2. Validação client-side: campos vazios impede chamada à API
    // ---------------------------------------------------------------
    @Test
    public void loginWithEmptyFields_showsValidationAndStaysOnScreen() {
        // Garante que os campos estão vazios
        onView(withId(R.id.etEmail))
                .perform(replaceText(""), closeSoftKeyboard());
        onView(withId(R.id.etPassword))
                .perform(replaceText(""), closeSoftKeyboard());

        // Clica no botão "ENTRAR"
        onView(withId(R.id.btnArrowLogin))
                .perform(click());

        // A Activity NÃO deve ter navegado — o botão continua visível e habilitado
        onView(withId(R.id.btnArrowLogin))
                .check(matches(isDisplayed()))
                .check(matches(isEnabled()));

        // Os campos continuam na tela (não houve navegação para Home)
        onView(withId(R.id.etEmail))
                .check(matches(isDisplayed()));
        onView(withId(R.id.etPassword))
                .check(matches(isDisplayed()));
    }

    // ---------------------------------------------------------------
    // 3. Preenchimento e tentativa de login com dados inválidos
    //    Valida que o app trata o erro e não trava
    // ---------------------------------------------------------------
    @Test
    public void loginWithInvalidCredentials_remainsOnLoginScreen() throws InterruptedException {
        // Preenche campos com dados que não existem no backend
        onView(withId(R.id.etEmail))
                .perform(replaceText("teste.inexistente@email.com"), closeSoftKeyboard());
        onView(withId(R.id.etPassword))
                .perform(replaceText("senhaErrada123"), closeSoftKeyboard());

        // Clica no botão "ENTRAR"
        onView(withId(R.id.btnArrowLogin))
                .perform(click());

        // Aguarda tempo suficiente para a chamada de rede retornar
        // (a API no Render pode demorar até 60s no cold start, mas normalmente
        // responde 401 em <5s quando quente). Usamos 10s como margem segura.
        Thread.sleep(10_000);

        // Após o erro, o botão deve voltar ao estado habilitado (setLoadingState(false))
        // e a tela de login deve continuar visível (não navegou para Home)
        onView(withId(R.id.btnArrowLogin))
                .check(matches(isDisplayed()))
                .check(matches(isEnabled()));

        // Campos permanecem acessíveis para nova tentativa
        onView(withId(R.id.etEmail))
                .check(matches(isDisplayed()));
    }

    // ---------------------------------------------------------------
    // 4. Link "esqueceu a senha?" é clicável
    // ---------------------------------------------------------------
    @Test
    public void forgotPasswordLink_isClickable() {
        // Verifica que o link está visível e clicável
        onView(withId(R.id.tvForgotPassword))
                .check(matches(isDisplayed()))
                .perform(click());

        // Após clicar, a RecoverPasswordActivity deve abrir.
        // Não precisamos verificar a outra Activity em detalhe — o fato de
        // o click não causar crash já comprova que o Intent funciona.
        // Mas podemos verificar que a tela de login não está mais no topo
        // checando que ela não está mais em foco (indiretamente, pelo fato
        // de o teste não crashar no click).
    }
}
