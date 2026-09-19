---
name: eldrim-combat
description: Protege e orienta qualquer alteração no combate do Ren 2.0 (HeroController, animações V8, 4 fases de carga, Arcano, hit stop e cancelamentos).
---

# ELDRIM: SISTEMA DE COMBATE & HERÓI REN

## 1. QUANDO DEVE SER USADA?
Esta Skill deve ser consultada obrigatoriamente antes de:
- Modificar qualquer aspecto do herói Ren (`HeroController.ts` e `AnimationManager.ts`).
- Alterar mecânicas de ataque normal, golpe carregado ou esquiva.
- Ajustar valores, custos ou regeneração do Arcano (Arcane Flow).
- Ajustar janelas de tempo, hit stop, caixas de colisão (hitboxes) ou invulnerabilidade.
- Integrar novos inimigos, chefes ou alvos interativos ao sistema de dano.

## 2. O QUE ELA PROTEGE?
- O game feel consolidado do **Combate do Ren 2.0**.
- A biomecânica corporal e animações anatômicas do **Ren V8** (48×64px, 160 frames).
- O ataque carregado em **4 fases progressivas** com consumo justo de Arcano.
- O sistema de cancelamento estrito por dano/esquiva via token `actionGeneration`.
- A integridade física de hitboxes separadas e da sombra estável e independente.

## 3. QUAL É O ESTADO ATUAL RELEVANTE?
- **Controlador Central:** `src/phaser/systems/HeroController.ts`. Unifica movimento, combate e física em todas as cenas.
- **Entidade do Herói:** Sprite único Phaser (`Phaser.Types.Physics.Arcade.SpriteWithDynamicBody`).
  - Atlas: `ren_spritesheet_v8` gerado por `RenV8Atlas.ts` (16 colunas × 10 linhas = 160 frames anatômicos).
  - Frame base: **48×64px**. Display em tela: **38×54px** (`setDisplaySize(38, 54)`).
  - Origem do sprite: `setOrigin(0.5, 0.72)`.
  - Hitbox física corporal: nos pés/base, `setSize(16, 12)`, `setOffset(16, 46)`.
  - Sombra: Imagem independente (`sombra_elipse_v6`) ancorada no solo em `(heroi.x, heroi.y + 12)` com profundidade `y - 1` (não oscila verticalmente com animações).
- **Estados da Máquina de Estados:**
  - Movimento: `idle` (4 dir × 4 frames), `walk` (4 dir × 8 frames com peso biomecânico), `dodge` (4 dir × 8 frames com rolamento acrobático).
  - Combate: `attack` (4 dir × 10 frames), `charged` (8 frames com giro 360°), `hurt` (4 dir × 4 frames com flash vermelho), `death` (6 frames).
- **Ataque Normal (Tecla Z):**
  - Antecipação: 0–40ms com travamento inercial.
  - Trajetória & Arco: Renderização geométrica em curva ciano/branca à frente do golpe.
  - Janela de Dano: 40–140ms via ativação da `hitboxAtaque` física Arcade posicionada à frente.
  - Recuperação: 140–240ms com desativação imediata da hitbox física.
- **Ataque Carregado (4 Fases Progressivas - Segurar Z):**
  - Fase 1 (0–300ms, Custo 0): Foco e postura; aura luminosa suave de 28px.
  - Fase 2 (300–700ms, Custo 2 Arcano): Partículas de orbe azul; corte energizado moderado.
  - Fase 3 (700–1200ms, Custo 5 Arcano): Efeito sonoro `playChargeReady` no milissegundo exato; aura de 68px; giro 360° com onda de choque de 48px.
  - Fase 4 (1200ms+, Custo 8 Arcano): Carga máxima celestial dourada; aura de 92px; onda de choque autônoma de 74px e dispersão de estilhaços.
- **Onda de Choque Independente:** Objeto visual desacoplado com expansão `EaseOutQuad`, rotação contínua e partículas emitidas em tempo real.
- **Arcane Flow:**
  - Valores ativos: `arcanoAtual = 20`, `arcanoMax = 20`.
  - Regeneração: 1.0 ponto por segundo (5% do teto base) fora de estados de carga ou dano.
  - Conexão: Sincronização direta com o HUD React via evento `fluxoArcano` no `eventBus`.
- **Hit Stop & Cancelamentos:**
  - Hit stop: Micro-pausa física não acumulativa de 35ms (golpe normal/dano) ou 60ms (carga máxima), controlada pela flag `hitStopAtivo`.
  - Cancelamento estrito: Ao sofrer dano (`HURT`), rolar (`DODGE`) ou morrer (`DEATH`), qualquer ação ou timer em andamento é invalidado imediatamente pelo incremento de `actionGeneration`.

## 4. QUAIS DECISÕES SÃO PROIBIDAS SEM AUTORIZAÇÃO?
- **PROIBIDO** alterar dimensões do Ren, voltar para sprites 24×32 ou desmembrar o corpo em múltiplos sprites soltos.
- **PROIBIDO** implementar automaticamente a progressão não autorizada de Arcano (20 → 30 → 40 → 50) durante tarefas não relacionadas.
- **PROIBIDO** adicionar novas habilidades mágicas, feitiços ou novos golpes sem solicitação expressa.
- **PROIBIDO** reescrever o sistema de combate dentro de cenas (`OverworldScene.ts`, `DungeonScene.ts`) em vez de manter no `HeroController.ts`.
- **PROIBIDO** remover o hit stop, o cancelamento por `actionGeneration` ou o arco geométrico da lâmina.
- **PROIBIDO** alterar custos ou velocidades de combate por preferência subjetiva.

## 5. QUAIS VERIFICAÇÕES DEVEM OCORRER ANTES DE UMA ALTERAÇÃO?
1. Inspecionar o método alvo em `src/phaser/systems/HeroController.ts`.
2. Verificar se o timer da ação respeita o token `actionGeneration`.
3. Confirmar que a hitbox física de ataque é desativada rigorosamente no fim da janela de dano.
4. Garantir que a sincronização com o `eventBus` transmita o estado real e não valores fictícios para o HUD.
5. Checar se a animação correspondente está registrada corretamente no `AnimationManager.ts`.

## 6. COMO VALIDAR UMA MUDANÇA?
1. **Compilação Estática:** `npm run lint` (`tsc --noEmit`) sem erros.
2. **Ciclo de Golpe:** Executar ataque normal e verificar: antecipação → curva visual → dano no alvo de teste → recuperação limpa.
3. **Ciclo de Carga:** Manter tecla Z e testar as 4 fases com os custos de 0, 2, 5 e 8 de Arcano.
4. **Teste de Cancelamento:** Iniciar um ataque ou carga e ser atingido por um espinho/projétil; confirmar que o golpe é interrompido instantaneamente sem timers fantasmas.
5. **HUD React:** Verificar se os corações e a barra de Arcano acompanham com precisão as ações em jogo.

## 7. QUAIS RISCOS DEVEM SER OBSERVADOS?
- "Hit stop stacking": permitir que múltiplos impactos rápidos congelem o herói indefinidamente (a flag `hitStopAtivo` protege contra isso).
- Dessincronização entre hitbox física e o frame visual da espada (manter offsets relativos à direção cardeal).
- Vazamento de custo de Arcano em golpes cancelados antes do disparo.
