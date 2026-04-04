<!--
  @page /auth/login
  @description Página de login — credenciais (email + senha).
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '@/components/ui/Button.svelte';
  import { authService } from '@/services/auth.service';
  import { setUser } from '@/store/auth.store';
  import { isValidEmail, isNotEmpty } from '@/utils/validators';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMsg = $state('');

  function validate(): string | null {
    if (!isNotEmpty(email) || !isNotEmpty(password)) return 'Preencha todos os campos.';
    if (!isValidEmail(email)) return 'E-mail inválido.';
    return null;
  }

  async function handleLogin() {
    const validationError = validate();
    if (validationError) {
      errorMsg = validationError;
      return;
    }

    loading = true;
    errorMsg = '';
    try {
      const { token, user } = await authService.login({ email, password });

      localStorage.setItem('auth_token', token);
      document.cookie = `auth_token=${token}; path=/; SameSite=Lax`;

      setUser(user);

      const target = user.role === 'admin' ? '/admin/dashboard' : '/colaborador/registro';
      await goto(target);
    } catch {
      errorMsg = 'Credenciais inválidas. Tente novamente.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="login-page">
  <div class="login-card">
    <h1>Ponto Digital</h1>
    <p>Acesse sua conta</p>

    {#if errorMsg}
      <div class="error" role="alert">{errorMsg}</div>
    {/if}

    <label>
      E-mail
      <input type="email" bind:value={email} placeholder="seu@email.com" />
    </label>

    <label>
      Senha
      <input type="password" bind:value={password} placeholder="••••••••" />
    </label>

    <Button variant="primary" {loading} onclick={handleLogin}>Entrar</Button>

    <a href="/auth/qrcode" class="qr-link">Registrar ponto via QR Code</a>
  </div>
</div>
