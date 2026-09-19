---
name: eldrim-architecture
description: Documenta e orienta decisões sobre a arquitetura do Eldrim (Phaser 4.2.1, separação React/Phaser, EventBus, cenas, sistemas e governança).
---

# ELDRIM: ARQUITETURA DE SISTEMAS & GOVERNANÇA

## 1. QUANDO DEVE SER USADA?
Esta Skill deve ser consultada obrigatoriamente antes de:
- Criar ou alterar cenas Phaser (`src/phaser/scenes/`).
- Adicionar ou modificar comunicação entre Phaser e React.
- Modificar o loop do jogo, inicialização ou configurações em `src/phaser/config.ts`.
- Introduzir novos subsistemas, serviços ou dependências no projeto.
- Tratar, inspecionar ou refatorar código legado.

## 2. O QUE ELA PROTEGE?
- A autoridade exclusiva do **Phaser 4.2.1** sobre o runtime do jogo, física, câmera, colisões e renderização em tempo real.
- O papel do **React 19** estritamente como casca (shell), apresentação de HUD e container de iframe.
- O desacoplamento total via `src/phaser/eventBus.ts` (`EventEmitter`).
- A integridade dos sistemas centrais consolidados, impedindo duplicações funcionais.
- O isolamento do código Canvas2D legado para impedir seu retorno acidental ao runtime.

## 3. QUAL É O ESTADO ATUAL RELEVANTE?
- **Engine Oficial:** Phaser 4.2.1 (Giedi), renderizador WebGL, loop em 60 FPS, física Arcade sem gravidade.
- **Camada de Interface:** React 19 em `src/App.tsx` e `src/components/PhaserGame.tsx`. Escuta eventos de status (vida, arcano, bioma) do `eventBus` apenas para atualizar o HUD visual.
- **Cenas do Jogo:**
  - `BootScene`: Gera texturas/atlases procedurais em GPU, registra animações e invoca o Overworld.
  - `SplashScene` & `TituloScene`: Fluxo de abertura e tela de título.
  - `CinematicaScene`: Introdução narrativa.
  - `OverworldScene`: Mundo aberto com Y-sorting, tilemaps dinâmicos, alvos de combate e sistemas ecológicos.
  - `DungeonScene`: Masmorras com arquitetura compartilhada via `HeroController`.
  - `PauseScene`: Pausa limpa preservando estado da cena ativa.
- **Sistemas Centrais Existentes:**
  - `HeroController`: Autoridade única sobre movimento, inputs, animações, física e combate de Ren.
  - `AnimationManager`: Registro e execução dos frames do spritesheet V8.
  - `EnvironmentalLifeSystem`: Vento, correnteza, folhas, insetos voadores e interações orgânicas.
  - `GeographicEcosystem`: Validação semântica de zonas e corredor navegável.
  - `LightingSystem`: Overlay 2D via `Phaser.GameObjects.Graphics` com blend modes aditivos.
  - `ParticleSystem`: Emissores de faíscas, poeira, estilhaços e clima regional.
- **Código Legado (Inativo):** 18 arquivos legados (`GameCanvas.tsx`, `combat.ts`, `dungeonEngine.ts`, `heroSprite.ts`, etc.) permanecem preservados no repositório, mas estão 100% desconectados do runtime do Phaser.

## 4. QUAIS DECISÕES SÃO PROIBIDAS SEM AUTORIZAÇÃO?
- **PROIBIDO** transferir qualquer controle de game loop, física, movimentação ou combate para componentes React.
- **PROIBIDO** fazer downgrade para Phaser 3 ou tentar "migrar" o projeto (o runtime já opera estavelmente em Phaser 4.2.1).
- **PROIBIDO** reativar código Canvas2D legado ou loops baseados em `requestAnimationFrame`.
- **PROIBIDO** instalar novas dependências npm ou alterar versões de pacotes sem necessidade técnica comprovada.
- **PROIBIDO** criar sistemas paralelos para funcionalidades que já possuem sistema oficial (ex.: criar novo sistema de partículas ou física própria em vez de usar os existentes).
- **PROIBIDO** comunicar diretamente componentes React com instâncias internas de cenas sem passar pelo `eventBus`.

## 5. QUAIS VERIFICAÇÕES DEVEM OCORRER ANTES DE UMA ALTERAÇÃO?
Antes de qualquer alteração arquitetural, o desenvolvedor ou agente DEVE responder obrigatoriamente:
1. *"Isso já existe no projeto?"*
2. *"Estou duplicando uma responsabilidade já atendida por um sistema existente?"*
3. *"Estou reintroduzindo uma solução histórica ou legado já superado?"*
4. *"Qual componente atualmente é a autoridade sobre esse comportamento?"*
5. *"Qual comportamento existente pode ser quebrado por esta alteração?"*
6. *"Existe uma alteração menor e menos invasiva que resolva o problema?"*

## 6. COMO VALIDAR UMA MUDANÇA?
1. **Verificação Estática:** Executar `npm run lint` (`tsc --noEmit`) para assegurar zero erros de tipagem.
2. **Verificação de Compilação:** Executar `npm run build` (`vite build`) para garantir empacotamento completo.
3. **Verificação em Tempo de Execução:** Confirmar que o Phaser inicializa sem erros no console, a taxa de quadros se mantém estável e o `eventBus` sincroniza o HUD sem engasgos.
4. **Processo Obrigatório:** `AUDITAR → PLANEJAR → ISOLAR → IMPLEMENTAR → VALIDAR → DOCUMENTAR`.

## 7. QUAIS RISCOS DEVEM SER OBSERVADOS?
- Vazamento de referências de cenas destruídas em ouvintes do `eventBus` (sempre limpar ouvintes com `off` no shutdown da cena).
- Execução redundante de lógica física no React que dispute autoridade com o `HeroController`.
- Conflitos de importação entre arquivos de masmorras legadas e cenas ativas do Phaser.
