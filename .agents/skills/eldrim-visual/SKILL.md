---
name: eldrim-visual
description: Orienta a reconstrução visual do Eldrim (resolução 640x360, tiles 32x32, Ren V8, separação estrita entre Lógica e Representação).
---

# ELDRIM: DIRETRIZES VISUAIS & SEPARAÇÃO DE CAMADAS

## 1. QUANDO DEVE SER USADA?
Esta Skill deve ser consultada obrigatoriamente antes de:
- Integrar novos spritesheets, tilesets, ilustrações ou assets de arte finais.
- Ajustar iluminação, paletas de cores, shaders, partículas ou pós-processamento.
- Modificar dimensões de exibição, escalas, câmeras ou enquadramento de tela.
- Atualizar ou refatorar a apresentação visual de qualquer cenário, objeto ou personagem.

## 2. O QUE ELA PROTEGE?
- A **configuração visual canônica** do projeto (640×360, widescreen 16:9, tiles 32×32).
- A separação rigorosa entre **Lógica** (mecânicas invioláveis) e **Representação** (estética e renderização).
- A nitidez do pixel art autêntico através da filtragem Nearest e proporção inteira de pixels.
- A integridade do protagonista Ren V8 (160 frames, proporções anatômicas).
- A estabilidade dos sistemas visuais nativos já operantes no Phaser 4.2.1.

## 3. QUAL É O ESTADO ATUAL RELEVANTE?
- **Configuração Gráfica Protegida (`src/phaser/config.ts`):**
  - Resolução Lógica: **640×360 pixels**.
  - Proporção de Tela: **16:9** widescreen nativo.
  - Dimensão dos Tiles: **32×32 pixels**.
  - Scale Mode: `Phaser.Scale.FIT`.
  - Alinhamento: `autoCenter: Phaser.Scale.CENTER_BOTH`.
  - Pixel Art: `pixelArt: true` (força `NEAREST` filtering na GPU).
  - Alinhamento de Pixel: `roundPixels: true`.
  - Renderizador: `Phaser.WEBGL`.
- **Dimensões e Atlas do Protagonista Ren:**
  - Atlas: `RenV8Atlas.ts` (16 colunas × 10 linhas = 160 frames).
  - Dimensão do frame: **48×64 pixels**.
  - Dimensão de exibição em jogo: **38×54 pixels** (`setDisplaySize(38, 54)`).
  - Ponto de ancoragem (origem): `(0.5, 0.72)`.
- **Arquitetura de Iluminação & Partículas:**
  - `LightingSystem`: Overlay 2D renderizado com `Phaser.GameObjects.Graphics` e blend mode `ADD`, desenhado sobre depth 9990 com resposta a 7 biomas e 4 fases de carga de Ren.
  - `ParticleSystem`: Emissores configurados diretamente com a sintaxe moderna `scene.add.particles(...)`.
- **Separação Fundamental de Camadas:**
  - **LÓGICA:** Máquina de estados, regras de dano, custos de Arcano, tempos de hit stop, corpos rígidos AABB e velocidades de movimentação.
  - **REPRESENTAÇÃO:** Spritesheets, texturas, animações, luzes, emissores de partículas e paletas de cores.

## 4. QUAIS DECISÕES SÃO PROIBIDAS SEM AUTORIZAÇÃO?
- **PROIBIDO** reverter a resolução para formatos históricos:
  - Não retornar para **256×224** (resolução 8:7 antiga).
  - Não retornar para **384×216** (resolução 16:9 antiga de testes).
  - Não retornar para tiles **16×16** ou **24×24**.
- **PROIBIDO** recriar Ren como personagem simplificado de **24×32** pixels.
- **PROIBIDO** alterar regras de combate ou física durante tarefas de melhoria puramente visual.
- **PROIBIDO** fazer downgrade do motor para Phaser 3.
- **PROIBIDO** substituir sistemas existentes funcionais (como o `LightingSystem`) por novos RenderNodes ou pipelines do Phaser 4 apenas por novidade técnica, sem benefício comprovado.
- **PROIBIDO** converter o `ParticleSystem` moderno de volta para a arquitetura antiga `ParticleEmitterManager` do Phaser 3.
- **PROIBIDO** reativar renderizadores Canvas2D legados.

## 5. QUAIS VERIFICAÇÕES DEVEM OCORRER ANTES DE UMA ALTERAÇÃO?
Antes de modificar qualquer aspecto visual, perguntar:
1. *"Esta alteração afeta apenas a REPRESENTAÇÃO visual ou está alterando a LÓGICA de gameplay?"*
2. *"A dimensão do novo asset respeita o grid de 32×32 ou a anatomia de 48×64 de Ren?"*
3. *"A textura utiliza filtragem Nearest sem borramento bilinear acidental?"*
4. *"A nova arte respeita a paleta e iluminação atmosférica do bioma ativo?"*
5. *"Os limites de colisão física e hitboxes foram preservados intactos?"*

## 6. COMO VALIDAR UMA MUDANÇA?
1. **Compilação e Tipagem:** Executar `npm run lint` (`tsc --noEmit`) e confirmar zero erros.
2. **Build de Produção:** Executar `npm run build` (`vite build`) e verificar que os novos assets são empacotados corretamente.
3. **Inspeção de Escala:** Abrir o jogo em tela cheia e em janela reduzida; verificar se a proporção 16:9 se mantém sem distorção e sem linhas borradas de pixel art.
4. **Inspeção de Gameplay:** Realizar um ciclo completo de movimento, esquiva e ataque para atestar que a física e as caixas de colisão permanecem 100% inalteradas.

## 7. QUAIS RISCOS DEVEM SER OBSERVADOS?
- Alteração inadvertida do ponto de pivô (`origin`) de Ren ao importar novas animações, deslocando o contato da sombra e da hitbox física com o chão.
- Queda de taxa de quadros (FPS) por empilhamento desnecessário de overlays gráficos em resoluções altas.
- Perda de nitidez do pixel art causada por desativação acidental de `pixelArt: true` ou má calibração de zoom de câmera.
