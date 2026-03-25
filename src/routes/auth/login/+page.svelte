<!--
  @page /auth/login
  @description Página de login — credenciais (email + senha).
-->
<script lang="ts">
  import Button from '@/components/ui/Button.svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMsg = $state('');

  async function handleLogin() {
    loading = true;
    errorMsg = '';
    try {
      // TODO: chamar authService.login({ email, password })
      console.log('Login:', { email, password });
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
