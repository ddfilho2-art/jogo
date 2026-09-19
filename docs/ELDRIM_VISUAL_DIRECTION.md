# ELDRIM: ECOS DO PASSADO
## ESPECIFICAÇÃO DE DIREÇÃO VISUAL E LINGUAGEM ARTÍSTICA (V14)

---

### 1. CONTEXTO DO PROJETO & PRINCÍPIO CENTRAL

O **Eldrim: Ecos do Passado** é um Action RPG 2D top-down funcional desenvolvido em:
- **Engine:** Phaser 4.2.1 (Giedi) em modo WebGL nativo.
- **Arquitetura de Apresentação:** React 19 como shell/HUD externo via `eventBus.ts`.
- **Resolução Lógica Canônica:** 640×360 pixels (proporção widescreen 16:9).
- **Métricas do Mundo:** Grid canônico de 32×32 pixels, `pixelArt: true`, filtragem `Nearest`, `roundPixels: true`, escala `Scale.FIT` e alinhamento `CENTER_BOTH`.
- **Física e Gameplay:** Phaser Arcade Physics sem gravidade, `HeroController` com máquina de estados, hit stop não acumulativo e ataque carregado em 4 fases.

#### Princípio Central de Separação de Camadas
A transformação visual visa converter o jogo de **"protótipo técnico funcional"** para **"RPG 2D pixel art visualmente autoral, consistente e comercialmente apresentável"**.

Toda modernização visual ocorre exclusivamente na **CAMADA DE REPRESENTAÇÃO**. As camadas do projeto permanecem rigidamente separadas:
1. **Lógica:** Máquinas de estado, tempos de ataque, janelas de hit stop, custos de Arcano e corpos rígidos AABB. *(Inviolável)*.
2. **Semântica:** Zonas do mundo (`PATH`, `GRASS`, `FOREST`, `RIVER`, etc.) e validação de corredores pelo `GeographicEcosystem`. *(Inviolável)*.
3. **Representação Visual:** Spritesheets, tilesets, paletas de cores, quadros de animação e ordenação de profundidade (Y-sort). *(Foco desta especificação)*.
4. **Comportamento:** Vento multi-camada, trajetórias de insetos e ondulações do `EnvironmentalLifeSystem`. *(Preservado)*.
5. **Efeitos:** Emissão de partículas do `ParticleSystem` e overlay do `LightingSystem`. *(Preservado)*.

*Regra de Ouro:* Uma melhoria estética nunca deve alterar a caixa de colisão física, a velocidade de Ren ou as regras de combate sem aprovação arquitetural explícita.

---

### 2. ESTILO VISUAL: PIXEL ART 2D TOP-DOWN AUTORAL

O estilo do Eldrim é definido como **Pixel Art 2D Top-Down Contemporâneo de Alta Legibilidade**.
- **Identidade Própria:** Atmosfera sóbria, imersiva e naturalista, equilibrando o peso medieval-fantástico com toques sutis de mistério arcano.
- **Perspectiva:** Projeção top-down inclinada (~3/4 clássica), onde superfícies horizontais (terreno, água) são vistas de cima e elementos verticais (personagens, troncos, rochas, copas de árvores) exibem elevação frontal clara, permitindo leitura imediata de volume e profundidade.
- **Resolução de Renderização:** Rasterização estrita 1:1 na grade lógica de 640×360. Nenhum sprite ou efeito deve possuir sub-pixels ou resoluções mistas (*mixels*).

---

### 3. PRINCÍPIOS DE PIXEL ART DO PROJETO

Todo e qualquer asset visual criado para o Eldrim deve seguir rigorosamente:
1. **Pixels Deliberados:** Cada pixel colocado cumpre uma função óptica — contorno, volume, textura ou ponto de luz.
2. **Clusterização de Pixels (Pixel Clustering):** As formas e transições de cor devem ser compostas por blocos coesos de pixels agrupados, evitando ruído de pixels isolados (*stray pixels*) ou pontilhismo excessivo (*dithering* desordenado).
3. **Contornos Controlados (Selective Outlining / Sel-Out):** Linhas de contorno externas escuras para separar entidades móveis do fundo, porém suavizadas internamente com tons da própria paleta em vez de linhas pretas puras contínuas.
4. **Silhuetas Legíveis:** Sprites de personagens, inimigos e objetos devem ser instantaneamente reconhecíveis apenas por sua silhueta recortada em preto.
5. **Ausência de Filtros Suavizadores:** Proibido uso de anti-aliasing linear, desfoques gaussianos (blur) ou interpolação bilinear na GPU.
6. **Rejeição de Geometria Perfeita:** Elementos naturais (árvores, folhas, margens, rochas) devem possuir quebras orgânicas, assimetria intencional e irregularidade plástica.

---

### 4. ANTI-PADRÕES VISUAIS ("APARÊNCIA DE PROTÓTIPO")

Fica terminantemente proibido incorporar ou manter no pipeline visual os seguintes anti-padrões identificados nas fases de auditoria:
- **Círculos Matemáticos Perfeitos:** Árvores, arbustos ou pedras desenhados através de fórmulas trigonométricas (`ctx.arc`).
- **Retângulos e Blocos Primitivos:** Troncos, pontes e plataformas desenhados como caixas vetoriais sem textura de madeira ou talhe de pedra.
- **Sombras por Gradientes Radiais Esfumados:** Manchas circulares cinzentas criadas com `ctx.createRadialGradient()`.
- **Cenário Monolítico Estático:** Terrenos desenhados como ilustrações panorâmicas gigantes em arquivo único JPG (ex.: o atual backdrop estático de 768×512 do Vale), que impedem modularidade, causam artefatos de compressão e desassociam a arte visual da malha física.
- **Transições em Ângulos Retos de 90°:** Bordas de caminho, grama ou água cortadas rigidamente em quinas de blocos 32×32 sem autotiling de suavização.
- **Inimigos Geométricos Provisórios:** Cristais ou monstros feitos de triângulos monocromáticos inline de depuração.
- **Cores Flutuantes Desarmônicas:** Elementos com paletas de saturação química pura (`#00ff00`, `#ff0000`) convivendo com cenários terrosos.
- **Efeitos Visuais Desconectados:** Partículas ou feixes de luz excessivamente suaves que pareçam renderizados por engines 3D modernas em cima de sprites clássicos de pixel art.

---

### 5. PALETA FUNCIONAL DO PROJETO

A identidade cromática de Eldrim utiliza uma **paleta funcional indexada e regionalizável**, estruturada por papéis ópticos. As cores devem possuir contraste tonal balanceado e temperaturas coerentes.

#### A) Âncoras do Protagonista (Ren V8)
Para garantir contraste e integração com o mundo, os tons de Ren servem como referências do espectro do jogo:
- **Túnica Nobre:** Azul-petróleo profundo (`#0f766e`, `#115e59`, `#042f2e`) com realce turquesa (`#14b8a6`) e borda dourada (`#f59e0b`).
- **Vestimenta & Calças:** Cinza-ardósia escuro (`#1e293b`, `#0f172a`, `#334155`).
- **Couro & Calçados:** Marrom escuro curtido (`#451a03`, `#291003`, `#78350f`).
- **Aço & Energia Arcana:** Branco de titânio (`#f8fafc`), sombra de aço (`#94a3b8`), runa e arco translúcido ciano celeste (`#38bdf8`, `rgba(56, 189, 248, 0.75)`).

#### B) Papéis Cromáticos do Vale Verdejante (Bioma de Referência)
1. **Solo & Caminho (`PATH`):**
   - *Luz:* `#a38260` (terra batida ensolarada, poeira clara).
   - *Base:* `#7c5e42` (terra marrom quente compactada).
   - *Sombra / Ranhuras:* `#543b27` (fendas de terra e pegadas).
   - *Seixos:* `#b5aa9d` / `#7a7065` (pedregulhos rolados no solo).
2. **Vegetação & Gramado (`GRASS` & `FOREST`):**
   - *Realce de Copa / Luz Solar:* `#6bb354` (folhas iluminadas ao meio-dia).
   - *Base da Grama:* `#3e8338` (verde natural profundo, não radioativo).
   - *Sombra Vegetal:* `#24582b` (folhagem sob copas e declives).
   - *Sombra Profunda / Interior de Bosque:* `#14381e` (profundidade de copas densas).
3. **Madeira & Troncos (`WOOD`):**
   - *Casca Iluminada:* `#80593b` (musgo seco e cristas de tronco).
   - *Casca Base:* `#543821` (madeira envelhecida).
   - *Sombra de Fenda:* `#2e1c10` (raízes e reentrâncias).
4. **Pedras & Penhascos (`CLIFF` & `ROCKS`):**
   - *Plano Superior Iluminado:* `#9ba3af` (pedra clara lavada por chuva).
   - *Plano Vertical Base:* `#626c79` (granito cinza azulado).
   - *Fendas e Sombra Oclusa:* `#3a414b` (rachaduras rochosas profundas).
   - *Musgo de Rocha:* `#4b6a38` (incrustação biológica nas bases).
5. **Água & Correnteza (`RIVER` & `SHALLOW_WATER`):**
   - *Espuma / Crista de Onda:* `#e0f4ff` (arrebentação e corredeira).
   - *Água Rasa / Remanso:* `#4fa3c7` (transparência de margem com areia).
   - *Água Corrente Média:* `#2b6e94` (leito principal do rio).
   - *Água Profunda:* `#174361` (abismo aquático escuro).
6. **Sombras de Cenário (Pixel Art):**
   - *Cor Base:* Tom azul-petróleo/índigo escuro com transparência calculada (`rgba(15, 23, 42, 0.45)`), garantindo que as sombras esfriem o terreno em vez de apenas escurecê-lo artificialmente com cinza sujo.

---

### 6. ARQUITETURA DO TERRENO EM 6 CAMADAS DE COMPOSIÇÃO

O terreno de Eldrim abandona o modelo de ilustração estática única para operar em uma estrutura em camadas hierárquicas compatível com o motor de Tilemaps do Phaser:

```
[CAMADA 6: FOREGROUND / CANOPY] ─── Folhagens do dossel superior (Depth 10000)
             ▲
[CAMADA 5: OBJECTS / Y-SORT] ───── Árvores, Rochas, Inimigos, Ren V8 (Depth Y dinâmico)
             ▲
[CAMADA 4: GROUND DETAILS] ─────── Flores, folhas caídas, seixos soltos, juncos (Depth 16-20)
             ▲
[CAMADA 3: TRANSITIONS] ────────── Autotiling de grama sobre terra, areia sobre água (Depth 3)
             ▲
[CAMADA 2: GROUND VARIATION] ──── Mechas de grama, ranhuras de solo, manchas úmidas (Depth 2)
             ▲
[CAMADA 1: GROUND BASE] ────────── Grid 32×32 contínuo de solo primordial (Depth 1)
```

1. **Camada 1 (Ground Base):** Base contínua que preenche 100% da área do bioma (grama esmeralda no Vale, areia fina em Kaal, pedra úmida no Charco).
2. **Camada 2 (Ground Variation):** Variações sutis do mesmo material (tiles com pequenas imperfeições, tufos de grama mais densos) para quebrar a sensação de repetição matemática.
3. **Camada 3 (Transitions):** Regras de autotiling orgânico (compostos de Wang tiles de 47 variações) conectando materiais diferentes: bordas de grama adentrando o caminho de terra, areia molhada contornando o rio.
4. **Camada 4 (Ground Details):** Decorações rasas sem colisão física (folhas secas caídas, pétalas, pedrinhas arredondadas, poças d'água rasas).
5. **Camada 5 (Objects / Y-Sort):** Todos os elementos que possuem altura e base física no solo. O ponto de contato inferior determina a ordenação de renderização (`depth = base_y`).
6. **Camada 6 (Foreground / Canopy):** Galhos suspensos e copas superiores de árvores massivas situadas acima da cabeça de Ren, gerando sensação de imersão sob a floresta.

---

### 7. TRANSIÇÕES DE TERRENO: SISTEMA ORGÂNICO 32×32

- **Rejeição do Corte Quadrado:** Toda fronteira entre dois materiais de terreno (ex.: Grama e Caminho de Terra) deve utilizar mechas irregulares de transição.
- **Clusters de Intrusão:** A grama avança sobre a terra em pequenos tufos triangulares e agrupamentos de 2 a 5 pixels, criando o aspecto de vegetação rasteira que invade naturalmente a trilha.
- **Compatibilidade com o Grid:** Embora cada tile lógico meça 32×32 pixels, as transições devem ser projetadas para que o conjunto de 4 a 8 tiles vizinhos forme contornos curvos suaves e críveis.

---

### 8. VEGETAÇÃO, ARBUSTOS E FLORES

- **Arbustos Pequenos e Médios (32×32 e 48×32):**
  - Desenhados com 3 níveis claros de valor cromático: massa superior iluminada, miolo intermediário e base escura de contato com o solo.
  - Devem possuir folhas recortadas na silhueta externa, evitando contornos perfeitamente ovais.
- **Flores Silvestres:**
  - Agrupamentos pequenos (1 a 3 botões florais por tufo de 16×16).
  - Cores controladas: Margaridas brancas/amarelas e botões azuis celestes (ecoando a energia de Eldrim).
  - Devem ser passíveis de deflexão e emissão de partículas ao contato do `EnvironmentalLifeSystem`.

---

### 9. ESPECIFICAÇÃO DAS ÁRVORES

As árvores são os pilares de verticalidade e escala do mundo de Eldrim.

```
                  ┌───────────────────────┐
                  │    COPA SUPERIOR      │
                  │  (Massas de folhagem  │
                  │  clusterizada em 3D)  │
                  └───────────┬───────────┘
                              │
                  ┌───────────┴───────────┐
                  │    TRONCO ROBUSTO     │
                  │  (Casca e fissuras)   │
                  └───────────┬───────────┘
                              ▼
        ═════════════════════════════════════════  [SOLO / CONTATO]
                  ▲                       ▲
                  │                       │
          [COLISOR FÍSICO]         [SOMBRA PROJETADA]
          (16×12 px no solo)       (Elipse pixel art em 45°)
```

1. **Estrutura Multi-Tile:**
   - **Árvore Média do Vale:** 64×96 pixels (ocupa 2×3 tiles lógicos).
   - **Árvore Grande Ancestral:** 96×128 ou 128×144 pixels (ocupa 3×4 ou 4×4 tiles lógicos).
2. **Ponto de Ancoragem e Y-Sort:**
   - A âncora lógica (`origin`) deve estar estritamente na base do tronco onde as raízes penetram a terra (`originX: 0.5`, `originY: 0.88 - 0.92`).
   - O Y-sort do Phaser utiliza essa coordenada de base para que Ren possa caminhar tanto na frente quanto atrás da árvore com oclusão correta.
3. **Colisor Físico:**
   - A colisão física é restrita estritamente ao tronco inferior (caixa AABB de aproximadamente 20×14 pixels), deixando as copas livres de colisão aérea.
4. **Volume da Copa:**
   - A copa é estruturada em massas de folhas (*leaf clusters*) dispostas em camadas, simulando a iluminação zenital vinda do topo/esquerda.
   - A borda é recortada com recortes naturais de folhas, compatível com a oscilação angular senoidal do vento controlada pelo `EnvironmentalLifeSystem`.

---

### 10. ROCHAS E PENHASCOS

- **Volume Facetado:** As rochas devem ter planos geométricos angulares que simulam fraturas geológicas naturais de granito, com faces iluminadas voltadas para o topo e faces sombreadas voltadas para a direita/baixo.
- **Base Integrada:** Rochas nunca repousam como recortes soltos sobre a grama; a base deve apresentar pequenas pedras soltas, acúmulo de terra e tufos de musgo que amarram o objeto ao terreno.
- **Dimensões Padronizadas:**
  - *Rocha Pequena (Seixo de Caminho):* 16×16 pixels (sem colisão).
  - *Rocha Média (Obstáculo de Relevo):* 32×32 pixels (colisão de 24×14 px).
  - *Formação Rochosa Massiva (Penhasco):* 64×64 ou 64×96 pixels (colisão de base).

---

### 11. ÁGUA E CORRENTEZA

A água do rio e do lago possui papel central no Vale Verdejante:
1. **Diferenciação Visual de Profundidade:**
   - **Margem / Água Rasa:** Translúcida, deixando visíveis os seixos e a areia do fundo com tonalidade turquesa suave (`#4fa3c7`).
   - **Água Corrente Central:** Azul médio dinâmico (`#2b6e94`) com linhas horizontais e mechas em tons de espuma clara marcando a direção do fluxo.
   - **Água Profunda:** Azul marinho escuro profundo (`#174361`) que sinaliza perigo/intransponibilidade física.
2. **Padrão de Correnteza:**
   - Micro-ondas em pixel art espaçadas e desenhadas em loop de 3 a 4 frames para conferir movimento contínuo sem distrair os olhos do jogador.
   - [DECISÃO VISUAL FUTURA]: Avaliar se a animação do rio será executada por tilesets animados de 4 frames ou por sprites de ripple sincronizados via sistema de vida ambiental.
3. **Margem e Praia Fluvial:**
   - Areia molhada escura formando uma faixa orgânica de 8 a 16 pixels entre o gramado e o leito aquático, adornada com juncos e pedregulhos polidos.

---

### 12. SISTEMA DE SOMBRAS EM PIXEL ART

As sombras devem abandonar qualquer gradiente radial cinzento contínuo:
1. **Linguagem de Projeção:**
   - Projeção elíptica suave e levemente deslocada na direção sudeste (simulando sol matinal suave a noroeste).
   - Formas com bordas pixeladas recortadas e sem borrões.
2. **Paleta de Sombra:**
   - As sombras usam uma cor tonalizada com azul escuro/petróleo (`#0f172a` com opacidade em torno de 40% a 50%), resfriando as cores do solo sobre o qual se projetam em vez de manchá-lo de cinza neutro.
3. **Sombra do Herói Ren (Protegida):**
   - Imagem elíptica autônoma ancorada em `heroi.y + 12` com profundidade `heroi.y - 1`.
   - Dimensão aproximada: 24×10 pixels.
   - Preservar rigorosamente a ancoragem no solo para que não oscile verticalmente com as passadas de Ren.

---

### 13. ILUMINAÇÃO ATMOSFÉRICA (LIGHTINGSYSTEM)

O sistema de iluminação atual do Phaser (`LightingSystem.ts`) é plenamente eficiente e será mantido como a autoridade técnica.
- **Diretriz de Atmosfera:** O overlay deve atuar como uma camada de ambientação cromática e hora do dia (ex.: clareira ensolarada com feixes dourados, caverna escura com azul profundo).
- **Sem Bloom Exagerado:** Não utilizar borrões que estourem os limites dos sprites ou descaracterizem os contornos de pixel art.
- **Integração de Combate:** Os círculos de carga de Ren (Fases 1 a 4) devem manter seus raios exatos (28px, 48px, 68px, 92px) e blend modes aditivos, servindo como feedback funcional de gameplay.

---

### 14. EFEITOS E PARTÍCULAS EM PIXEL ART

As partículas emitidas pelo `ParticleSystem.ts` devem ser visualmente desenhadas como pequenas peças de pixel art:
- **Poeira de Esquiva:** Pufes de poeira de 6×6 px com 2 tons de bege claro que se expandem e dissipam rapidamente.
- **Folhas Flutuantes:** Pequenos sprites de 4×4 e 6×6 px em forma de losangos recortados verdes e âmbar, girando suavemente na brisa.
- **Gotas de Água / Respingos:** Pixels brilhantes ciano/brancos emitidos radialmente ao pisar na margem.
- **Faíscas de Impacto:** Pequenas estrelas de 5×5 px com núcleo branco e pontas amarelas emitidas durante o golpe normal e ataque carregado.

---

### 15. HARMONIZAÇÃO COM O PROTAGONISTA REN V8

Ren V8 é o elemento central e imutável do gameplay de Eldrim:
- **Respeito às Proporções Canônicas:** Ren mede **48×64 pixels** de frame base e é exibido em tela em **38×54 pixels**.
- **Pivô:** `setOrigin(0.5, 0.72)`.
- **Hitbox Físico:** 16×12 pixels nos pés.
- **Objetivo da Reconstrução:** Ren já possui excelente resolução e expressividade anatômica (160 frames com pose, recuo, impacto e marcha balanceada). A reconstrução do mundo elevará a qualidade do cenário para que Ren se sinta perfeitamente integrado a ele, e não uma figura detalhada sobreposta a um fundo simplificado.

---

### 16. PROFUNDIDADE E COMPOSIÇÃO VISUAL

A sensação de profundidade top-down deve ser alcançada através de técnicas ópticas rigorosas:
1. **Y-Sorting Estrito:** Entidades com menor coordenada Y são desenhadas atrás; entidades com maior coordenada Y são desenhadas na frente.
2. **Sobreposição em Três Planos:**
   - *Plano de Fundo:* Terreno, caminhos, flores rasas e sombras de solo.
   - *Plano de Ação:* Ren, inimigos, troncos de árvores, rochas médias e alvos de combate.
   - *Plano Superior (Dossel):* Copas de grandes carvalhos e trepadeiras suspensas em depth 10000 que passam à frente da câmera.
3. **Contraste de Valor e Saturação:** O caminho e as áreas de trânsito possuem saturação levemente mais controlada para que os personagens e os efeitos de ataque saltem aos olhos do jogador com legibilidade imediata.

---

### 17. DENSIDADE VISUAL E ZONAS DE LEITURA

Para proteger o gameplay de interferências visuais, o cenário adota 3 zonas de densidade:
- **Zona de Baixa Densidade (Corredores e Caminhos):** Caminho navegável prioritário (corredores Norte-Sul e Leste-Oeste do `GeographicEcosystem`). Solo limpo, poucos seixos soltos e zero obstáculos físicos para permitir combate e esquiva fluidos.
- **Zona de Média Densidade (Clareiras e Margens):** Pradaria aberta com tufos de grama, flores silvestres, pedras decorativas e arbustos espaçados.
- **Zona de Alta Densidade (Bosques e Bordas de Bioma):** Bordas intransponíveis do mapa onde árvores sobrepostas, raízes salientes, densas folhagens e sombras profundas criam barreiras naturais críveis sem necessidade de paredes artificiais.

---

### 18. VARIAÇÃO VISUAL SEM REDUNDÂNCIA DE ASSETS

Para evitar repetições visuais sem inflar o consumo de memória com centenas de texturas:
- **Variação por Conjuntos Modulares:** 2 a 3 variantes de árvores médias, 2 variantes de árvores grandes e 3 variantes de rochas já são suficientes para montar um mapa complexo se distribuídas de forma assimétrica.
- **Espelhamento Seletivo:** Inversão horizontal (`flipX = true`) em sprites de rochas e arbustos para dobrar a variedade perceptiva sem custo adicional de textura.
- **Rotação Suave:** Rotação angular em pequenos ângulos aplicada exclusivamente em folhas no chão e flores isoladas.

---

### 19. ESPECIFICAÇÃO TÉCNICA PADRÃO PARA NOVOS ASSETS

Todo asset que vier a ser implementado nas fases seguintes deverá cumprir a seguinte ficha técnica:

| Campo | Descrição Obrigatória |
|---|---|
| **Nome / Chave** | Identificador único em minúsculas (ex.: `tree_oak_medium_v1`, `rock_granite_large_v1`). |
| **Função** | Elemento de terreno, obstáculo físico, decoração rasa ou dossel superior. |
| **Tamanho Lógico (Grid)** | Quantidade de tiles 32×32 ocupados na malha de colisão (ex.: 1×1, 2×2, 3×4 tiles). |
| **Dimensão Real do Sprite** | Largura e altura exatas em pixels (ex.: 64×96 px). |
| **Ponto de Ancoragem (Origin)** | Coordenadas normalizadas do pivô (ex.: `0.5, 0.9` para árvores; `0.5, 0.5` para decorações). |
| **Camada / Depth** | Faixa de renderização (`Ground 1-3`, `Ground Detail 16-20`, `Y-Sort dinâmico`, `Canopy 10000`). |
| **Colisor Físico Arcade** | Dimensões `setSize(w, h)` e offsets `setOffset(x, y)` relativos à base no solo. |
| **Y-Sort?** | `Sim` (para entidades que se elevam do solo) ou `Não` (para solo e dossel). |
| **Animação?** | Estático, Tween senoidal pelo código ou Frames em loop (quantidade de frames e FPS). |
| **Paleta Funcional** | Conjunto de cores indexadas do bioma correspondente. |

---

### 20. COERÊNCIA GLOBAL ENTRE BIOMAS DE ELDRIM

Embora o Vale Verdejante seja o ambiente de referência pioneiro, a mesma filosofia visual governará todos os biomas do jogo:
- **Vale Verdejante:** Tons verdes esmeralda, terra marrom quente, rios cristalinos e atmosfera matinal límpida.
- **Charco Sombrio:** Tons musgo pantanoso, água verde-oliva turva, cipós decrépitos e névoa difusa.
- **Terras Geladas:** Brancos nevados, pedras azuis ardósia, pinheiros pontiagudos e tempestade de neve contínua.
- **Deserto de Kaal:** Areias douradas quentes, cânions de arenito avermelhado e miragens térmicas sutis.
- **Cidadela Cinzenta / Criptas:** Pedras talhadas cinza basalto, calhas de ferro, tochas e sombras agudas.

*Regra de Unidade:* Todos os biomas compartilham a mesma escala (32×32), a mesma resolução (640×360), o mesmo tratamento de contorno, as mesmas regras de sombra e a compatibilidade direta com a escala anatômica de Ren V8.

---

### 21. DIRETRIZ PRIORITÁRIA PARA O VALE VERDEJANTE

O Vale Verdejante é o piloto da nova direção visual. A sua reconstrução visual futura deverá executar os seguintes marcos:
1. **Transição do Fundo:** Aposentadoria gradual do backdrop monolítico estático `terrain_benchmark_v6_raw` (JPG de 768×512) e implementação do **Tilemap de 4 Camadas** (Solo Base, Variações, Transições de Margem/Caminho e Decorações).
2. **Substituição dos Elementos Circulares:** Substituição das árvores e rochas geradas por círculos Canvas2D (`BenchmarkV6Atlas.ts`) por spritesheets de pixel art desenhados em blocos orgânicos.
3. **Margem Viva do Rio:** Delimitação nítida e orgânica do rio com faixa de areia úmida e pedras de transição, mantendo intacta a área proibida de árvores terrestres (`x >= 490 && y >= 180`).
4. **Preservação dos Corredores Navegáveis:** Os corredores Norte-Sul (`x: 348-420`) e Leste-Oeste (`y: 226-286`) devem ser mantidos 100% transitáveis e visualmente evidentes como caminhos de terra batida limpa.

---

### 22. CHECKLIST DE QUALIDADE E APROVAÇÃO VISUAL

Antes de aprovar qualquer futuro asset ou cena reconstruída, o desenvolvedor ou agente deve submetê-lo às 12 perguntas de aprovação:

1. **Autoria:** O asset parece desenhado intencionalmente pixel a pixel ou parece uma primitiva gerada matematicamente?
2. **Resolução:** O asset funciona com nitidez absoluta na resolução lógica de 640×360 sem mixels?
3. **Silhueta:** A silhueta recortada em preto do objeto é clara e facilmente decifrável?
4. **Clusters:** As gradações de cor formam blocos orgânicos coesos ou há ruído de pixels avulsos?
5. **Paleta:** As cores utilizadas pertencem à paleta funcional do bioma ou há saturações gratuitas?
6. **Harmonia com Ren:** O asset conversa visualmente com Ren V8 sem parecer de outro jogo?
7. **Sombras:** A sombra projetada respeita a linguagem angular pixelada em vez de borrões cinzas radiais?
8. **Iluminação:** A iluminação obedece à direção predominante do bioma sem bloom excessivo?
9. **Y-Sorting:** O ponto de ancoragem e a profundidade visual funcionam corretamente quando Ren passa na frente e atrás do elemento?
10. **Colisão Real:** O colisor físico Arcade está restrito estritamente à base de contato com o chão?
11. **Legibilidade de Combate:** A presença do asset no cenário polui ou prejudica a leitura do ataque normal, golpe carregado ou esquiva de Ren?
12. **Status de Acabamento:** O elemento transmite a sensação de um jogo comercialmente polido ou de um placeholder de depuração?

---

### 23. NOTAÇÃO DE DECISÕES EM ABERTO (`[DECISÃO VISUAL FUTURA]`)

Para garantir transparência técnica, os seguintes pontos permanecem abertos para validação na etapa prática de implementação:
- `[DECISÃO VISUAL FUTURA - TILEMAP WATER]`: Decidir se a água do rio será animada por uma tira de 4 tiles ciclando a 6 FPS ou através de sprites translúcidos de correnteza com deslocamento UV.
- `[DECISÃO VISUAL FUTURA - ARQUIVO DE ATLAS]`: Decidir se os novos tiles e árvores serão consolidados em arquivos PNG estáticos na pasta `src/assets/` ou mantidos em renderizadores de textura dedicados em TypeScript compatíveis com a arquitetura do Phaser.
- `[DECISÃO VISUAL FUTURA - INIMIGOS DO VALE]`: Definir o conceito temático definitivo para os inimigos provisórios (atualmente Cristal Corrompido e Espinho Rastejante), transformando-os em criaturas florestais nativas com animações completas de Idle e Hurt.
