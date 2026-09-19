---
name: eldrim-world
description: Orienta alterações no mundo, biomas, relevo e sistemas ecológicos dinâmicos (EnvironmentalLifeSystem, GeographicEcosystem, zonas semânticas).
---

# ELDRIM: MUNDO & SISTEMAS AMBIENTAIS

## 1. QUANDO DEVE SER USADA?
Esta Skill deve ser consultada obrigatoriamente antes de:
- Adicionar ou reposicionar elementos de cenário (árvores, rochas, rios, pontes, vegetação).
- Criar novos mapas, biomas ou expandir a cena de Overworld (`src/phaser/scenes/OverworldScene.ts`).
- Alterar parâmetros do ecossistema geográfico (`src/phaser/systems/GeographicEcosystem.ts`).
- Modificar o sistema de vida ambiental (`src/phaser/systems/EnvironmentalLifeSystem.ts`), iluminação regional (`LightingSystem.ts`) ou partículas climáticas (`ParticleSystem.ts`).

## 2. O QUE ELA PROTEGE?
- A integridade da **semântica geográfica** do mundo de Eldrim.
- A fluidez do **corredor navegável principal** de Ren (livre de colisores acidentais).
- A separação lógica estrita entre elementos terrestres e massas aquáticas.
- A riqueza do ecossistema vivo (vento multi-camada, insetos, correnteza, interação com folhagem).
- Os limites naturais críveis de cada bioma, eliminando barreiras artificiais de depuração.

## 3. QUAL É O ESTADO ATUAL RELEVANTE?
- **Zonas Semânticas Consolidadas (`GeographicEcosystem.ts`):**
  - `PATH`: Corredor navegável livre com prioridade máxima.
    - Eixo Norte-Sul: `x` de 348 a 420; `y` de 0 a 512.
    - Eixo Leste-Oeste: `x` de 0 a 470; `y` de 226 a 286.
  - `GRASS`: Pradaria aberta, clareiras, flores silvestres e gramados.
  - `FOREST`: Bosque denso com copas entrelaçadas, sombra profunda e cogumelos.
  - `RIVER_BANK`: Margem de transição com solo úmido, seixos e juncos/canas.
  - `SHALLOW_WATER`: Água rasa com vitórias-régias, lírios e reflexos sutis.
  - `RIVER`: Leito de água corrente profunda com ondas, correnteza e espuma (`x >= 490`, `y >= 180` no Vale).
  - `DEEP_WATER`: Água de alta profundidade.
  - `CLIFF`: Paredões rochosos e encostas com musgo.
  - `TRANSITION`: Faixas de amortecimento entre clareiras e floresta densa.
- **Validação Geográfica Ativa:**
  - O método `GeographicEcosystem.validarPosicionamento(...)` barra estritamente:
    1. Árvores terrestres dentro do rio ou lago.
    2. Árvores ou rochas bloqueadoras sobre os corredores `CORREDOR_NS` e `CORREDOR_EO`.
    3. Vegetação aquática fora de zonas de água ou margem.
- **Sistemas Ambientais Ativos:**
  - `EnvironmentalLifeSystem`:
    - Vento Multi-camada: Cada árvore possui fase, força e frequência de oscilação independentes (`windPhase`, `windStrength`, `windSpeed`). As copas balançam sem deslocar as raízes.
    - Fluxo de Água: Correnteza contínua com vetores locais, anéis concêntricos de ondulação e folhas flutuantes que viajam pelo rio.
    - Insetos e Fauna: Borboletas e vaga-lumes autônomos com trajetórias curvas senoidais, bater de asas e ciclo de vida com reposicionamento periódico.
    - Interação Física: Arbustos e flores sofrem deflexão elástica ao contato de Ren e soltam partículas de pétalas/folhas retornando com amortecimento.
    - Interação com Água: Ren emite anéis de água e respingos translúcidos ao pisar na margem.
  - `LightingSystem`: Atmosfera e névoa para 7 biomas (`valeVerdejante`, `charcoSombrio`, `terrasGeladas`, `desertoKaal`, `penhascosPedra`, `ruinasSubmersas`, `cidadelaCinzenta`) e iluminação dinâmica ao redor de Ren.
  - `ParticleSystem`: Chuva de folhas no Vale, nevasca nas Terras Geladas e tempestade de areia no Deserto Kaal.

## 4. QUAIS DECISÕES SÃO PROIBIDAS SEM AUTORIZAÇÃO?
- **PROIBIDO** colocar árvores terrestres dentro de rios ou lagos.
- **PROIBIDO** obstruir os corredores de trânsito livre de Ren (`CORREDOR_NS` e `CORREDOR_EO`).
- **PROIBIDO** reintroduzir muralhas de blocos de tijolo artificiais de depuração em biomas naturais.
- **PROIBIDO** substituir sistemas ambientais funcionais por novas bibliotecas ou shaders sob pretexto de "modernização".
- **PROIBIDO** sincronizar artificialmente todas as árvores em um único ciclo idêntico de vento.
- **PROIBIDO** alterar a semântica de colisão do terreno ao realizar meros ajustes estéticos.

## 5. QUAIS VERIFICAÇÕES DEVEM OCORRER ANTES DE UMA ALTERAÇÃO?
Antes de modificar o mapa ou criar novos cenários, diferenciar estritamente:
1. **Semântica:** Qual é a zona (`PATH`, `RIVER`, etc.) e a regra de colisão daquela área?
2. **Representação Visual:** Quais sprites ou tiles representam o relevo sem violar a semântica?
3. **Comportamento:** Há correnteza, vento ou colisão AABB associada?
4. **Efeitos Ambientais:** Quais partículas, iluminação ou insetos operam na camada superior?
*Sempre validar coordenadas com `GeographicEcosystem.validarPosicionamento()` antes de instanciar novos elementos.*

## 6. COMO VALIDAR UMA MUDANÇA?
1. **Linter & Build:** Assegurar que `npm run lint` e `npm run build` passam sem alertas.
2. **Navegação Livre:** Caminhar com Ren por toda a extensão dos corredores Norte-Sul e Leste-Oeste, garantindo zero travamentos de colisão.
3. **Inspeção Visual Ribeirinha:** Checar a margem do rio e constatar a presença da faixa de transição úmida sem invasão de árvores terrestres.
4. **Naturalidade Ambiental:** Observar as copas das árvores e confirmar oscilação dessincronizada e orgânica sob o vento.

## 7. QUAIS RISCOS DEVEM SER OBSERVADOS?
- "Dead ends" ou gargalos invisíveis no mapa que prendam o jogador atrás de rochas com colisão estática.
- Spawns excessivos de insetos ou partículas contínuas que causem queda de frames (manter limites de `maxParticles`).
- Conflitos de profundidade (Y-sorting) entre troncos colidentes e a camada aérea do dossel florestal (`canopy`).
