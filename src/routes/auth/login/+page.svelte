<!--
  @page /auth/login
  @description Página de login — admin por email, colaborador por CPF.
-->
<script lang="ts">
  import { goto } from '$app/navigation';
  import Button from '@/components/ui/Button.svelte';
  import { authService } from '@/services/auth.service';
  import { setUser } from '@/store/auth.store';
  import { isValidEmail, isValidCpf, isNotEmpty, formatCpfInput } from '@/utils/validators';

  type LoginTab = 'admin' | 'colaborador';

  let activeTab = $state<LoginTab>('colaborador');
  let identifier = $state('');
  let password = $state('');
  let loading = $state(false);
  let errorMsg = $state('');
  let cpfError = $state('');

  function handleTabChange(tab: LoginTab): void {
    activeTab = tab;
    identifier = '';
    password = '';
    errorMsg = '';
    cpfError = '';
  }

  function handleCpfInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    const raw = input.value;

    // Bloqueia qualquer letra — só permite dígitos, pontos e hífen
    if (/[a-zA-Z]/.test(raw)) {
      cpfError = 'O CPF deve conter apenas números.';
    } else {
      cpfError = '';
    }

    identifier = formatCpfInput(raw);
  }

  function validate(): string | null {
    if (!isNotEmpty(identifier) || !isNotEmpty(password)) return 'Preencha todos os campos.';

    if (activeTab === 'admin' && !isValidEmail(identifier)) return 'E-mail inválido.';
    if (activeTab === 'colaborador' && !isValidCpf(identifier)) return 'CPF inválido.';

    return null;
  }

  async function handleLogin(): Promise<void> {
    if (cpfError) return;

    const validationError = validate();
    if (validationError) {
      errorMsg = validationError;
      return;
    }

    loading = true;
    errorMsg = '';
    try {
      const { token, user } = await authService.login({ identifier, password });

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

<svelte:head>
  <title>Login — Ponto Digital</title>
</svelte:head>

<div class="login-page">
  <form
    class="login-card"
    onsubmit={(e) => { e.preventDefault(); handleLogin(); }}
  >
    <h1>Ponto Digital</h1>
    <p>Acesse sua conta</p>

    <div class="tabs" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'colaborador'}
        class="tab"
        class:tab--active={activeTab === 'colaborador'}
        onclick={() => handleTabChange('colaborador')}
      >
        Colaborador
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'admin'}
        class="tab"
        class:tab--active={activeTab === 'admin'}
        onclick={() => handleTabChange('admin')}
      >
        Administrador
      </button>
    </div>

    {#if errorMsg}
      <div class="error" role="alert" aria-live="assertive">{errorMsg}</div>
    {/if}

    {#if activeTab === 'admin'}
      <div class="field">
        <label for="identifier">E-mail</label>
        <input
          id="identifier"
          type="email"
          bind:value={identifier}
          placeholder="seu@email.com"
          autocomplete="email"
          aria-required="true"
        />
      </div>
    {:else}
      <div class="field">
        <label for="identifier">CPF</label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          oninput={handleCpfInput}
          placeholder="000.000.000-00"
          inputmode="numeric"
          maxlength="14"
          autocomplete="username"
          aria-required="true"
          aria-invalid={cpfError ? 'true' : 'false'}
          aria-describedby={cpfError ? 'cpf-erro' : undefined}
        />
        {#if cpfError}
          <span id="cpf-erro" class="field-error" role="alert" aria-live="polite">
            {cpfError}
          </span>
        {/if}
      </div>
    {/if}

    <div class="field">
      <label for="password">Senha</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="current-password"
        aria-required="true"
      />
    </div>

    <Button type="submit" variant="primary" {loading}>Entrar</Button>

    <a href="/auth/qrcode" class="qr-link">Registrar ponto via QR Code</a>
  </form>
</div>

<style>
  .login-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #f1f5f9;
  }

  .login-card {
    background: #fff;
    padding: 2.5rem;
    border-radius: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .login-card h1 {
    font-size: 1.5rem;
    color: #0f172a;
    text-align: center;
    margin: 0;
  }

  .login-card p {
    text-align: center;
    color: #64748b;
    margin: 0 0 0.5rem;
  }

  .tabs {
    display: flex;
    gap: 0;
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .tab {
    flex: 1;
    padding: 0.625rem;
    border: none;
    background: #f8fafc;
    color: #64748b;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 150ms ease;
  }

  .tab--active {
    background: var(--color-primary, #2563eb);
    color: #fff;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #334155;
  }

  input {
    padding: 0.625rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 1rem;
    outline: none;
    transition: border-color 150ms ease;
  }

  input:focus {
    border-color: var(--color-primary, #2563eb);
  }

  input[aria-invalid='true'] {
    border-color: #dc2626;
  }

  .field-error {
    font-size: 0.8rem;
    color: #dc2626;
  }

  .error {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-align: center;
    font-size: 0.875rem;
  }

  .qr-link {
    text-align: center;
    color: var(--color-primary, #2563eb);
    font-size: 0.875rem;
    text-decoration: none;
  }

  .qr-link:hover {
    text-decoration: underline;
  }
</style>