# 🕒 Controle de Ponto - Gestão de Jornada Digital
> Gestão inteligente, ágil e em conformidade legal da jornada de trabalho.

![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-success?style=for-the-badge)

Uma aplicação desenvolvida para permitir que empresas de qualquer porte registrem, acompanhem e analisem a frequência de seus colaboradores de forma digital. A plataforma elimina a dependência de relógios de ponto físicos (REP), planilhas manuais e processos sujeitos a erros.

---

## 👩‍💻 Equipe e Autores

Projeto desenvolvido para a disciplina de **Projeto de Desenvolvimento I** da **UniSenac - Campus Pelotas**.

* **Angelo Fonseca** - Desenvolvedor [GitHub](https://github.com/angelofonseca)
* **Gian Garima** - Desenvolvedor - [GitHub](https://github.com/GianG-17)

**Orientação:** Prof. Bruna Ribeiro & Prof. Gladimir Catarino.

---

## 🔗 Links Principais
* 💻 **GitHub:** *https://github.com/GianG-17/Frameworks_Web*
* 🌐 **Deploy da Aplicação:** *https://frameworks-web-034l.onrender.com/auth/login*
* 🗂️ **Trello:** *https://trello.com/b/aX6doi72/controle-de-ponto-pd1*
* 📊 **Apresentação:** *https://canva.link/l2whdkiic5za996*

---

## 🎯 Contexto: Os Problemas que Resolvemos

1. **Planilhas Manuais:** O controle manual é lento, suscetível a erros de digitação e dificulta auditorias. Digitalizamos e automatizamos para garantir integridade e rastreabilidade.
2. **Falta de Visibilidade:** Gestores só descobrem atrasos e faltas dias depois. Nosso dashboard em tempo real permite ações imediatas baseadas em dados.
3. **Risco de Não Conformidade Legal:** A legislação (CLT e Portaria 671/MTE) exige registros auditáveis. Registramos os dados com timestamp do servidor para garantir segurança jurídica.
4. **Custo Elevado de Equipamentos:** Relógios eletrônicos (REP) possuem alto custo de aquisição e manutenção. Nossa solução funciona via web, eliminando a necessidade de hardware dedicado.

---

## 🧑‍🤝‍🧑 Público-Alvo e Personas

Nossa solução atende desde **Micro e Pequenas Empresas** (que buscam sair do controle manual) até **Empresas Médias** (que desejam modernizar a gestão sem investir em hardwares caros).

### 👨‍💼 Persona 1: José (Administrador)
* **Perfil:** Empresário, 40 anos, gerencia uma empresa com 45 funcionários.
* **Dor:** Perde horas semanais conferindo planilhas manualmente. Sofre com a falta de visibilidade sobre atrasos e horas extras, gerando erros na folha de pagamento e conflitos trabalhistas.
* **Necessidade:** Uma ferramenta centralizada que automatize registros, gere relatórios para o RH e ofereça um dashboard com a situação diária em tempo real.

### 👨‍💻 Persona 2: Gustavo (Colaborador)
* **Perfil:** Auxiliar Administrativo, 20 anos. Familiarizado com tecnologia e smartphones.
* **Dor:** Não sabe quantas horas trabalhou no mês ou como está seu banco de horas, dependendo sempre de solicitações demoradas ao RH.
* **Necessidade:** Uma solução acessível pelo celular para registrar o ponto rapidamente e consultar seu próprio histórico com transparência.

---

## ✨ Funcionalidades e Fluxos

* **Registro Manual:** Colaboradores registram o ponto via login e senha diretamente na plataforma.
* **Gestão de Ausências:** Envio e aprovação de justificativas de falta, abonos e gerenciamento de férias.
* **Análise em Tempo Real:** Dashboard para gestores com visão consolidada por equipe ou colaborador (presenças, atrasos, horas trabalhadas).

### 🔄 Fluxos Principais de Dados
1. **Cadastro:** `Empresas` ➔ `Usuários` ➔ `Colaboradores` ➔ Vinculação à `Jornada de Trabalho`.
2. **Registro de Ponto:** `Usuários` ➔ `Registros` (Entrada/Intervalo/Saída).
3. **Consolidação:** O sistema processa os registros e calcula o resumo diário (horas, atrasos) para alimentar relatórios e dashboards.

---

## 🛠️ Requisitos do Sistema

### Requisitos Funcionais
* Autenticação com perfis de Administrador e Colaborador.
* Registro de entrada, intervalo e saída do expediente.
* Visualização do histórico de batidas de ponto.
* Painel do Administrador para gerenciar funcionários, departamentos e jornadas.
* Módulo para gestão de férias e justificativas/abonos.
* Extração de relatórios gerenciais consolidados.

### Requisitos Não Funcionais
* Alta Performance e Usabilidade.
* Segurança: Armazenamento de senhas com hash **Bcrypt** e autenticação via **JWT Token** (com expiração).
* Confiabilidade: Registro de ponto utilizando o *timestamp* do servidor.

---

## 💻 Tecnologias Utilizadas

* **Framework Principal:** SvelteKit (Fullstack)
* **Segurança:** JSON Web Tokens (JWT) e Bcrypt
* **Documentação:** Swagger / OpenAPI

---

## 📊 Sistemas Similares (Benchmarking)

* **Pontomais:** Referência em gestão na nuvem com foco na facilidade de uso para o colaborador.
* **Tangerino:** Especialista em monitoramento de equipes externas e regimes de trabalho flexíveis.
* **Ahgora:** Focado em infraestrutura robusta e integração IoT para grandes empresas.
* **Nosso Diferencial:** O *Controle de Ponto* foca na ausência de fricção, trazendo uma interface limpa, fluxos rápidos e alto custo-benefício para pequenas e médias empresas que não precisam da complexidade (e do custo) dos sistemas enterprise.

---

## 💰 Monetização e Competitividade (SaaS)

O projeto adota um modelo de precificação simplificado com custo fixo mensal, destacando-se por ser 80% mais barato em relação à concorrência do mercado em 2026.

### 📊 Comparativo de Preços de Mercado (~45 colaboradores)

| Plataforma | Modelo de Cobrança | Custo Mensal Estimado |
| :--- | :--- | :--- |
| **Pontomais** | Por colab. / faixa (R$ 8 a R$ 15/cadastro) | R$ 275 a R$ 675 |
| **Tangerino / Sólides** | Por colab. + taxa (R$ 10 a R$ 25/cadastro) | R$ 450 a R$ 1.125|
| **Tique Taque** | Por colaborador (R$ 10 a R$ 20/cadastro) | R$ 450 a R$ 900 |
| **Controle Ponto** | **Custo fixo (Até 100 colaboradores)** | **R$ 99,90** |

---

### Credenciais de teste

| Usuário            | Identificador    | Senha    | Papel       |
| ------------------ | ---------------- | -------- | ----------- |
| Admin              | admin@teste.com  | Senha123 | admin       |
| Admin (CPF)        | 123.456.789-00   | Senha123 | admin       |
| Carlos Souza       | carlos@teste.com | Senha123 | colaborador |
| Carlos Souza (CPF) | 111.444.777-35   | Senha123 | colaborador |
| Teste              | teste@teste.com  | Senha123 | colaborador |

---