import React, { useEffect, useRef, useState } from 'react';
import {
  getGeladasObstaculos,
  isHeroiNaNeve,
  isHeroiNoGeloLiso,
  isHeroiNoGeloFino,
  renderTerrenoTerrasGeladas,
  renderCasasGelida,
  renderFogueiraCentral,
  renderLanternaPerdida,
  renderNPCsGelida,
  renderNevascaTerrasGeladas,
  LANTERNA_PERDIDA_POS,
  ENTRADA_CAVERNA_CRISTAL_OVERWORLD,
  renderEntradaCavernaCristal,
} from '../terrasGeladas';
import {
  HERO_BASE_SPEED,
  HERO_SWAMP_SPEED,
  HERO_COLOR,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MAP_HEIGHT,
  MAP_WIDTH,
  PALETA_VALE,
  PALETA_CHARCO,
  TILE_SIZE,
} from '../constants';
import {
  CHARCO_ARVORES,
  CHARCO_PEDRAS,
  CHARCO_JUNCOS,
  JUNCOTURVO_CASAS,
  JUNCOTURVO_DOCA,
  JUNCOTURVO_BARCO,
  NPC_ESCRIBA_IVO,
  NPC_MERCADOR_JUNCO,
  LOJA_JUNCO_HITBOX,
  LOJA_JUNCO_ITENS,
  ArvorePantanoInfo,
  isHeroiNaAguaRasa,
  getCharcoObstaculos,
  renderTerrenoCharco,
  renderCasasJuncoturvo,
  renderArvorePantano,
  renderNevoaCharco,
  renderCaixaDialogo,
  renderInterfaceLoja,
  renderAreaCovilAfogado,
} from '../charcoSombrio';
import {
  COLETAVEL_VIDA,
  PONTE_VALE,
  RIO_SEGMENTOS,
  VALE_ARVORES,
  VALE_PONTOS_GANCHO,
  BAU_ILHA_BOSQUE,
  ARVORE_CRIPTA,
  ENTRADA_CRIPTA_HITBOX,
  getValeObstaculos,
  renderArvore,
  renderArvoreCripta,
  renderEntradaCripta,
  renderColetavelVida,
  renderTerrenoVale,
  renderBauIlha,
  ArvoreInfo,
} from '../valeVerdejante';
import {
  CriptaState,
  criarCriptaGuardiao,
  atualizarCripta,
  renderizarCripta,
  interagirAcaoCripta,
} from '../criptaEngine';
import {
  CovilAfogadoState,
  criarCovilAfogado,
  atualizarFisicaCovilAfogado,
  renderizarCovilAfogado,
  interagirAcaoCovilAfogado,
} from '../covilAfogadoEngine';
import {
  atualizarBumerangueGlobal,
  renderizarBumerangue,
  ALAVANCA_CHARCO_REMOTE,
  PONTE_CHARCO_OVERWORLD,
  ENTRADA_COVIL_AFOGADO_OVERWORLD,
} from '../bumerangueEngine';
import {
  dispararGanchoDeVinha,
  atualizarGancho,
  renderizarGancho,
  renderizarPontoGancho,
  criarGanchoAnimInicial,
} from '../hookEngine';
import {
  Dungeon,
  criarDungeonTesteSantuario,
  interagirAcaoDungeon,
  atualizarFisicaDungeon,
  renderDungeon,
} from '../dungeonEngine';
import {
  criarDungeonAguasTurvas,
  criarChefeMarejanteInicial,
  criarBumerangueAnimInicial,
  criarPlataformasIniciaisDungeon,
  dispararBumerangue,
  atualizarPlataformasAfundando,
  atualizarBumerangue,
  atualizarInimigosAguasTurvas,
  atualizarChefeMarejante,
  atualizarProjeteisAgua,
  aplicarDanoChefeMarejante,
  renderDungeonAguasTurvas,
} from '../santuarioAguasTurvas';
import {
  atualizarSantuarioGeloEterno,
  renderizarSantuarioGeloEterno,
  criarDungeonGeloEternoInicial,
  criarChefeGlaciusInicial,
} from '../santuarioGeloEterno';
import {
  atualizarDesertoKaal,
  renderizarDesertoKaal,
  renderizarEfeitoCalorDeserto,
  criarInimigosDesertoInicial,
  OBSTACULOS_DESERTO_KAAL,
} from '../desertoKaal';
import {
  atualizarSantuarioChamas,
  renderizarSantuarioChamas,
  criarDungeonChamasInicial,
  criarChefeAshraInicial,
} from '../santuarioChamas';
import {
  atualizarTumbaEnterrada,
  renderizarTumbaEnterrada,
  criarTumbaEnterradaInicial,
} from '../tumbaEnterradaEngine';
import {
  dispararBotasPassoGlacial,
  atualizarBotasEEfeitoAgua,
  renderizarEfeitoGeloAgua,
} from '../botasEngine';
import {
  CavernaCristalState,
  criarCavernaCristalInicial,
  atualizarCavernaCristal,
  renderizarCavernaCristal,
} from '../cavernaCristalEngine';
import { soundManager } from '../soundEffects';
import { renderizarHeroiRen } from '../heroSprite';
import {
  atualizarHeroiCombate,
  atualizarInimigos,
  atualizarParticulas,
  criarChefeRaizarcaInicial,
  criarInimigosValeIniciais,
  dispararGolpeEspada,
  renderizarEspada,
  renderizarCargaEspada,
  gerarExplosaoParticulas,
  renderizarInimigos,
  renderizarParticulas,
} from '../combat';
import {
  Direcao,
  EstadoJogo,
  GameState,
  ItemSecundarioId,
  PausaSubtela,
  Retangulo,
} from '../types';

function checkAABB(a: Retangulo, b: Retangulo): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Função de interpolação não linear (Ease-in-out cosseno suave)
function easeInOut(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return (1 - Math.cos(clamped * Math.PI)) / 2;
}

// Fade-in de 0.5s, permanece 1.5s, fade-out de 0.5s (total 2.5s)
function getSplashOpacity(elapsedSeconds: number): number {
  if (elapsedSeconds < 0.5) {
    // Fade-in não linear 0.0s -> 0.5s
    return easeInOut(elapsedSeconds / 0.5);
  } else if (elapsedSeconds < 2.0) {
    // Permanece 1.5s (0.5s -> 2.0s)
    return 1.0;
  } else if (elapsedSeconds < 2.5) {
    // Fade-out não linear 2.0s -> 2.5s
    return 1.0 - easeInOut((elapsedSeconds - 2.0) / 0.5);
  } else {
    return 0.0;
  }
}

// Renderiza o emblema geométrico e o texto da tela de Splash
function renderSplash(ctx: CanvasRenderingContext2D, elapsedSeconds: number) {
  // Fundo #0a0a0a conforme especificação
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const opacity = getSplashOpacity(elapsedSeconds);
  if (opacity <= 0.001) return;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  const cx = LOGICAL_WIDTH / 2; // 128
  const cy = 90;

  // 1. Triângulo Estilizado (Geometria Pura)
  const triW = 64;
  const triH = 58;
  const topY = cy - triH / 2 - 2;
  const bottomY = cy + triH / 2 - 2;
  const leftX = cx - triW / 2;
  const rightX = cx + triW / 2;

  // Fundo interno escuro do emblema
  ctx.beginPath();
  ctx.moveTo(cx, topY + 7);
  ctx.lineTo(rightX - 6, bottomY - 3);
  ctx.lineTo(leftX + 6, bottomY - 3);
  ctx.closePath();
  ctx.fillStyle = '#14120f';
  ctx.fill();

  // Borda principal do triângulo (âmbar dourado / 16-bit)
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(rightX, bottomY);
  ctx.lineTo(leftX, bottomY);
  ctx.closePath();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Borda interna decorativa sutil
  ctx.beginPath();
  ctx.moveTo(cx, topY + 9);
  ctx.lineTo(rightX - 8, bottomY - 5);
  ctx.lineTo(leftX + 8, bottomY - 5);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Detalhe geométrico no ápice (losango rúnico)
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(cx, topY - 7);
  ctx.lineTo(cx + 3, topY - 4);
  ctx.lineTo(cx, topY - 1);
  ctx.lineTo(cx - 3, topY - 4);
  ctx.closePath();
  ctx.fill();

  // 2. Chama Estilizada no Interior (composta por formas puras)
  // Camada exterior da chama: laranja vibrante
  ctx.beginPath();
  ctx.moveTo(cx, cy - 16);
  ctx.bezierCurveTo(cx + 12, cy - 6, cx + 18, cy + 12, cx + 11, bottomY - 10);
  ctx.bezierCurveTo(cx + 5, bottomY - 6, cx - 5, bottomY - 6, cx - 11, bottomY - 10);
  ctx.bezierCurveTo(cx - 18, cy + 12, cx - 12, cy - 6, cx, cy - 16);
  ctx.closePath();
  ctx.fillStyle = '#ea580c';
  ctx.fill();

  // Camada média da chama: ouro quente
  ctx.beginPath();
  ctx.moveTo(cx, cy - 10);
  ctx.bezierCurveTo(cx + 8, cy - 1, cx + 11, cy + 11, cx + 7, bottomY - 11);
  ctx.bezierCurveTo(cx + 3, bottomY - 8, cx - 3, bottomY - 8, cx - 7, bottomY - 11);
  ctx.bezierCurveTo(cx - 11, cy + 11, cx - 8, cy - 1, cx, cy - 10);
  ctx.closePath();
  ctx.fillStyle = '#f59e0b';
  ctx.fill();

  // Núcleo interno da chama: amarelo luminoso
  ctx.beginPath();
  ctx.moveTo(cx, cy - 3);
  ctx.bezierCurveTo(cx + 4, cy + 4, cx + 6, cy + 10, cx + 3, bottomY - 12);
  ctx.bezierCurveTo(cx + 1, bottomY - 10, cx - 1, bottomY - 10, cx - 3, bottomY - 12);
  ctx.bezierCurveTo(cx - 6, cy + 10, cx - 4, cy + 4, cx, cy - 3);
  ctx.closePath();
  ctx.fillStyle = '#fef08a';
  ctx.fill();

  // Faísca geométrica superior
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(cx - 1, cy - 22, 2, 3);

  // 3. Texto "Um jogo por D. Filho" sincronizado com o fade do emblema
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Um jogo por D. Filho', cx, 156);

  // Linhas ornamentais laterais do texto
  ctx.fillStyle = 'rgba(217, 119, 6, 0.5)';
  ctx.fillRect(cx - 68, 156, 12, 1);
  ctx.fillRect(cx + 56, 156, 12, 1);

  ctx.restore();
}

// Renderiza o fundo do Vale Verdejante ao entardecer com 3 camadas de parallax leve
function renderValeEntardecerParallax(
  ctx: CanvasRenderingContext2D,
  timer: number,
  arvoresOffset: number
) {
  // Camada 1: Céu com gradiente #2d1b4e -> #e8935a
  const sky = ctx.createLinearGradient(0, 0, 0, 142);
  sky.addColorStop(0, '#2d1b4e');
  sky.addColorStop(1, '#e8935a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, 142);

  // 4-5 "estrelas" (pontos brancos) piscando em ciclos independentes de 2-4s
  const STARS = [
    { x: 36, y: 18, period: 2.2, phase: 0.3 },
    { x: 94, y: 12, period: 3.4, phase: 1.5 },
    { x: 154, y: 26, period: 2.7, phase: 0.8 },
    { x: 218, y: 16, period: 3.9, phase: 2.1 },
    { x: 126, y: 38, period: 2.5, phase: 1.2 },
  ];

  STARS.forEach((star) => {
    const cycle = ((timer + star.phase) % star.period) / star.period;
    // Onda senoidal para pulsação orgânica de brilho
    const brightness = 0.15 + 0.85 * ((Math.sin(cycle * Math.PI * 2) + 1) / 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${brightness.toFixed(2)})`;
    ctx.fillRect(star.x, star.y, 2, 2);
    // Cruz de difração de luz quando o brilho atinge o pico
    if (brightness > 0.8) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(brightness * 0.4).toFixed(2)})`;
      ctx.fillRect(star.x - 1, star.y, 4, 2);
      ctx.fillRect(star.x, star.y - 1, 2, 4);
    }
  });

  // Camada 2: Silhuetas de montanhas paradas (2 cordilheiras sobrepostas)
  // Cordilheira distante (mais alta, tom arroxeado crepuscular)
  ctx.fillStyle = '#381f3d';
  ctx.beginPath();
  ctx.moveTo(0, 142);
  ctx.lineTo(0, 84);
  ctx.lineTo(34, 68);
  ctx.lineTo(66, 88);
  ctx.lineTo(108, 62);
  ctx.lineTo(142, 82);
  ctx.lineTo(182, 58);
  ctx.lineTo(218, 80);
  ctx.lineTo(256, 68);
  ctx.lineTo(256, 142);
  ctx.closePath();
  ctx.fill();

  // Cordilheira média (silhueta mais escura)
  ctx.fillStyle = '#25142b';
  ctx.beginPath();
  ctx.moveTo(0, 142);
  ctx.lineTo(0, 106);
  ctx.lineTo(44, 86);
  ctx.lineTo(82, 108);
  ctx.lineTo(132, 80);
  ctx.lineTo(172, 104);
  ctx.lineTo(224, 88);
  ctx.lineTo(256, 102);
  ctx.lineTo(256, 142);
  ctx.closePath();
  ctx.fill();

  // Chão da base do Vale Verdejante
  ctx.fillStyle = '#0d1511';
  ctx.fillRect(0, 154, LOGICAL_WIDTH, 70);

  // Linha de cume do chão
  ctx.strokeStyle = '#18271f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 154);
  ctx.lineTo(LOGICAL_WIDTH, 154);
  ctx.stroke();

  // Camada 3: Silhuetas de árvores que se movem a 5px/s para a esquerda em loop contínuo
  const baseX = -arvoresOffset;
  const trees = [
    { x: 10, h: 28, w: 14 },
    { x: 28, h: 40, w: 18 },
    { x: 48, h: 24, w: 12 },
    { x: 66, h: 36, w: 16 },
    { x: 90, h: 44, w: 20 },
    { x: 114, h: 28, w: 14 },
    { x: 132, h: 38, w: 16 },
    { x: 154, h: 46, w: 22 },
    { x: 180, h: 32, w: 14 },
    { x: 200, h: 42, w: 18 },
    { x: 222, h: 26, w: 12 },
    { x: 242, h: 36, w: 16 },
  ];

  for (let copy = 0; copy < 2; copy++) {
    const shift = baseX + copy * 256;
    trees.forEach((t) => {
      const tx = shift + t.x;
      const ty = 154;

      // Pinheiro do Vale Verdejante
      ctx.fillStyle = '#14211a';
      ctx.beginPath();
      ctx.moveTo(tx, ty - t.h);
      ctx.lineTo(tx + t.w / 2, ty);
      ctx.lineTo(tx - t.w / 2, ty);
      ctx.closePath();
      ctx.fill();

      // Destaque de copa interna
      ctx.fillStyle = '#101a14';
      ctx.beginPath();
      ctx.moveTo(tx, ty - t.h + 8);
      ctx.lineTo(tx + (t.w / 2 - 2), ty);
      ctx.lineTo(tx - (t.w / 2 - 2), ty);
      ctx.closePath();
      ctx.fill();
    });
  }
}

// Renderiza a tela de Título completa (fundo parallax, logo flutuante, submenu ou Start e Opções)
function renderTitulo(ctx: CanvasRenderingContext2D, state: GameState) {
  // 1. Fundo Vale Verdejante com 3 camadas de parallax
  renderValeEntardecerParallax(ctx, state.tituloTimer, state.arvoresOffset);

  const cx = LOGICAL_WIDTH / 2; // 128

  // 2. Logo "ELDRIM" flutuando em onda senoidal (amplitude 3px, período 2s)
  const logoBaseY = 46;
  const logoY = logoBaseY + Math.sin(state.tituloTimer * (2 * Math.PI / 2.0)) * 3;

  ctx.font = 'bold 28px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Sombra de profundidade 16-bit
  ctx.fillStyle = '#120b18';
  ctx.fillText('ELDRIM', cx + 2, logoY + 2);

  // Borda inferior dourada
  ctx.fillStyle = '#78350f';
  ctx.fillText('ELDRIM', cx, logoY + 1);

  // Corpo dourado
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('ELDRIM', cx, logoY);

  // Brilho superior
  ctx.fillStyle = '#fef08a';
  ctx.fillText('ELDRIM', cx, logoY - 1);

  // Subtítulo acompanhando a flutuação
  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#fed7aa';
  ctx.fillText('ECOS DO PASSADO', cx, logoY + 20);

  // Divisor rúnico elegante
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 44, logoY + 29);
  ctx.lineTo(cx + 44, logoY + 29);
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(cx - 2, logoY + 28, 4, 3);

  // 3. Renderização condicional: Tela de Opções vs. Submenu vs. "Aperte START"
  if (state.tituloTelaOpcoes) {
    // TELA DE OPÇÕES
    const boxW = 196;
    const boxH = 96;
    const boxX = cx - boxW / 2;
    const boxY = 112;

    // Moldura do menu de opções
    ctx.fillStyle = 'rgba(11, 16, 22, 0.94)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    // Cantos decorados 16-bit
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(boxX - 1, boxY - 1, 3, 3);
    ctx.fillRect(boxX + boxW - 2, boxY - 1, 3, 3);
    ctx.fillRect(boxX - 1, boxY + boxH - 2, 3, 3);
    ctx.fillRect(boxX + boxW - 2, boxY + boxH - 2, 3, 3);

    // Cabeçalho
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('— OPÇÕES —', cx, boxY + 12);

    // Opção 0: Volume (0-100%, passo 10)
    const isVolActive = state.opcaoSelecionada === 0;
    const volBarsCount = Math.round(state.volume / 10);
    const volBarStr = '■'.repeat(volBarsCount) + '□'.repeat(10 - volBarsCount);

    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = isVolActive ? '#fef08a' : '#cbd5e1';
    const volCursor = isVolActive ? '▶ ' : '  ';
    ctx.fillText(`${volCursor}Volume: < ${state.volume}% >`, boxX + 12, boxY + 30);

    ctx.font = '8px monospace';
    ctx.fillStyle = isVolActive ? '#38bdf8' : '#64748b';
    ctx.fillText(`   [${volBarStr}]`, boxX + 12, boxY + 41);

    // Opção 1: Controles (remapeamento básico funcional)
    const isControlsActive = state.opcaoSelecionada === 1;
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = isControlsActive ? '#fef08a' : '#cbd5e1';
    const ctrlCursor = isControlsActive ? '▶ ' : '  ';
    ctx.fillText(`${ctrlCursor}Teclas: WASD / Z / X / Enter`, boxX + 12, boxY + 58);

    ctx.font = '8px "Courier New", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('   [Esquema Padrão Ativo]', boxX + 12, boxY + 68);

    // Opção 2: Voltar
    const isBackActive = state.opcaoSelecionada === 2;
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = isBackActive ? '#fef08a' : '#94a3b8';
    const backCursor = isBackActive ? '▶ ' : '  ';
    ctx.fillText(`${backCursor}◄ Voltar ao Menu`, boxX + 12, boxY + 84);

    // Rodapé de instruções das opções
    ctx.textAlign = 'center';
    ctx.font = '8px "Courier New", monospace';
    ctx.fillStyle = '#f97316';
    ctx.fillText('◄/► Ajusta • Z/X Volta', cx, 218);
  } else if (state.tituloSubmenuAberto) {
    // SUBMENU PRINCIPAL (Novo Jogo / Continuar / Opções)
    const boxW = 136;
    const boxH = 68;
    const boxX = cx - boxW / 2;
    const boxY = 126;

    ctx.fillStyle = 'rgba(11, 16, 22, 0.94)';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

    // Cantos decorados
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(boxX - 1, boxY - 1, 3, 3);
    ctx.fillRect(boxX + boxW - 2, boxY - 1, 3, 3);
    ctx.fillRect(boxX - 1, boxY + boxH - 2, 3, 3);
    ctx.fillRect(boxX + boxW - 2, boxY + boxH - 2, 3, 3);

    const opcoes = [
      { id: 0, label: 'Novo Jogo', habilitado: true },
      { id: 1, label: 'Continuar', habilitado: state.temSave },
      { id: 2, label: 'Opções', habilitado: true },
    ];

    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'left';

    opcoes.forEach((op, idx) => {
      const isSelected = state.tituloMenuIndex === idx;
      const posY = boxY + 18 + idx * 17;

      if (isSelected) {
        // Cursor indicador
        ctx.fillStyle = '#fbbf24';
        ctx.fillText('▶', boxX + 10, posY);
      }

      if (!op.habilitado) {
        // Desabilitado (cinza)
        ctx.fillStyle = '#475569';
      } else if (isSelected) {
        ctx.fillStyle = '#fef08a';
      } else {
        ctx.fillStyle = '#cbd5e1';
      }

      ctx.fillText(op.label, boxX + 24, posY);
    });

    // Rodapé de atalhos
    ctx.textAlign = 'center';
    ctx.font = '8px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('▲/▼ Navega • Z Confirma • X Fecha', cx, 218);
  } else {
    // TEXTO "Aperte START" PISCANTE (visível 0.6s, invisível 0.4s)
    const cycle = state.tituloTimer % 1.0;
    const isVisible = cycle < 0.6;

    if (isVisible) {
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('APERTE START', cx, 144);
    }

    // Instrução sutil do botão de confirmação
    ctx.font = '8px "Courier New", monospace';
    ctx.fillStyle = '#fed7aa';
    ctx.fillText('[ Pressione Z ou Enter ]', cx, 164);

    // Rodapé discreto de versão
    ctx.font = '8px "Courier New", monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('Lâmina de Eldrim • 16-bit RPG', cx, 216);
  }
}

// Definição dos 5 quadros narrativos da Cinemática com seus respectivos textos
const CINEMATICA_QUADROS = [
  {
    titulo: 'QUADRO I / V',
    texto: 'Há muito tempo, seis Relicários mantêm as estações de Eldrim em equilíbrio.',
  },
  {
    titulo: 'QUADRO II / V',
    texto: 'Um guardião chamado Thorne desertou de seu posto, buscando apagar o tempo.',
  },
  {
    titulo: 'QUADRO III / V',
    texto: 'Um a um, os Relicários começam a perder sua luz.',
  },
  {
    titulo: 'QUADRO IV / V',
    texto: 'Nas vilas, o inverno chega fora de hora, e o medo cresce.',
  },
  {
    titulo: 'QUADRO V / V',
    texto: 'Ren, jovem aprendiz, recebe a espada da família — e uma missão maior do que imaginava.',
  },
];

// Helper para quebra de texto em linhas sem cortar palavras
function wrapTextLines(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Helper para obter as linhas visíveis do efeito máquina de escrever (1 letra a cada 40ms)
function getTypewriterLines(
  fullText: string,
  visibleChars: number,
  maxCharsPerLine: number
): { lines: string[]; isComplete: boolean } {
  const allLines = wrapTextLines(fullText, maxCharsPerLine);
  const result: string[] = [];
  let remaining = visibleChars;

  for (const line of allLines) {
    if (remaining <= 0) break;
    if (remaining >= line.length) {
      result.push(line);
      remaining -= (line.length + 1); // desconta espaço entre quebras
    } else {
      result.push(line.slice(0, remaining));
      remaining = 0;
    }
  }

  return {
    lines: result,
    isComplete: visibleChars >= fullText.length,
  };
}

// Quadro 1: 6 pontos de luz num mapa estilizado de Eldrim
// Fundo: oceano cartográfico com linhas náuticas e relevo continental
// Destaque: 6 Relicários reluzentes conectados em equilíbrio celestial
function renderQuadro1(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, timer: number) {
  // 1 Elemento de Fundo: Mar cartográfico e continentes estilizados
  ctx.fillStyle = '#08131d';
  ctx.fillRect(ox, oy, w, h);

  // Grade cartográfica náutica sutil
  ctx.strokeStyle = '#12263a';
  ctx.lineWidth = 1;
  for (let x = ox + 24; x < ox + w; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, oy);
    ctx.lineTo(x, oy + h);
    ctx.stroke();
  }
  for (let y = oy + 20; y < oy + h; y += 26) {
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + w, y);
    ctx.stroke();
  }

  // Rosa dos ventos estilizada
  const rvx = ox + 22;
  const rvy = oy + 22;
  ctx.strokeStyle = '#1e3d54';
  ctx.beginPath();
  ctx.moveTo(rvx - 8, rvy); ctx.lineTo(rvx + 8, rvy);
  ctx.moveTo(rvx, rvy - 8); ctx.lineTo(rvx, rvy + 8);
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(rvx - 1, rvy - 9, 3, 3); // Marcação Norte

  // Terras de Eldrim em blocos geométricos 16-bit
  ctx.fillStyle = '#14281e';
  ctx.fillRect(ox + 44, oy + 38, 140, 56);
  ctx.fillRect(ox + 60, oy + 26, 108, 72);
  ctx.fillRect(ox + 80, oy + 18, 72, 82);
  ctx.strokeStyle = '#224634';
  ctx.strokeRect(ox + 44, oy + 38, 140, 56);

  // 1 Elemento de Destaque: Os 6 Relicários mantendo as estações em harmonia
  const RELICARIOS = [
    { x: ox + 116, y: oy + 82, cor: '#4ade80' }, // Vale Verdejante
    { x: ox + 68, y: oy + 76, cor: '#2dd4bf' },  // Charco Sombrio
    { x: ox + 116, y: oy + 26, cor: '#93c5fd' }, // Terras Geladas
    { x: ox + 164, y: oy + 54, cor: '#fbbf24' }, // Deserto de Kaal
    { x: ox + 64, y: oy + 38, cor: '#f59e0b' },  // Penhascos de Pedra
    { x: ox + 148, y: oy + 86, cor: '#c084fc' }, // Ruínas Submersas
  ];

  // Feixes dourados de harmonia conectando os 6 relicários
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < RELICARIOS.length; i++) {
    const r1 = RELICARIOS[i];
    const r2 = RELICARIOS[(i + 1) % RELICARIOS.length];
    ctx.moveTo(r1.x, r1.y);
    ctx.lineTo(r2.x, r2.y);
  }
  ctx.stroke();

  // Desenho dos 6 orbes pulsantes com halos concêntricos
  RELICARIOS.forEach((r, idx) => {
    const pulse = 1 + 0.3 * Math.sin(timer * 3.5 + idx * 1.05);
    ctx.strokeStyle = r.cor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 5 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(r.x - 1, r.y - 1, 3, 3);
    ctx.fillStyle = r.cor;
    ctx.fillRect(r.x - 2, r.y, 5, 1);
    ctx.fillRect(r.x, r.y - 2, 1, 5);
  });
}

// Quadro 2: Silhueta encapuzada de Thorne de costas
// Fundo: Céu tempestuoso arroxeado e muralhas sombrias da Cidadela
// Destaque: Silhueta imponente de Thorne com capa rasgada e aura escura
function renderQuadro2(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, timer: number) {
  // 1 Elemento de Fundo: Céu tempestuoso e muralhas da Cidadela Cinzenta
  const skyGrad = ctx.createLinearGradient(ox, oy, ox, oy + h);
  skyGrad.addColorStop(0, '#130c1c');
  skyGrad.addColorStop(0.6, '#261533');
  skyGrad.addColorStop(1, '#0e0b14');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(ox, oy, w, h);

  // Lua opaca velada por bruma
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(ox + 48, oy + 32, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(38, 21, 51, 0.7)';
  ctx.fillRect(ox + 30, oy + 24, 38, 8);

  // Muralhas da Cidadela no horizonte com ameias
  ctx.fillStyle = '#161720';
  ctx.fillRect(ox + 20, oy + 54, 28, 62);
  ctx.fillRect(ox + 184, oy + 48, 32, 68);
  ctx.fillRect(ox + 18, oy + 50, 8, 5);
  ctx.fillRect(ox + 30, oy + 50, 8, 5);
  ctx.fillRect(ox + 42, oy + 50, 8, 5);
  ctx.fillRect(ox, oy + 76, w, 40);

  // 1 Elemento de Destaque: Silhueta encapuzada de Thorne de costas
  const tx = ox + w / 2;
  const ty = oy + 64;

  // Distorção temporal ao redor de Thorne
  const auraR = 24 + Math.sin(timer * 4) * 2.5;
  ctx.fillStyle = 'rgba(88, 28, 135, 0.22)';
  ctx.beginPath();
  ctx.arc(tx, ty + 12, auraR, 0, Math.PI * 2);
  ctx.fill();

  // Silhueta escura de Thorne
  ctx.fillStyle = '#08070d';
  // Capuz pontiagudo
  ctx.beginPath();
  ctx.moveTo(tx, ty - 20);
  ctx.lineTo(tx + 9, ty - 2);
  ctx.lineTo(tx - 9, ty - 2);
  ctx.closePath();
  ctx.fill();

  // Manto drapeado esvoaçando com vento para a esquerda
  const wind = Math.sin(timer * 5) * 3;
  ctx.beginPath();
  ctx.moveTo(tx - 9, ty - 2);
  ctx.lineTo(tx + 9, ty - 2);
  ctx.lineTo(tx + 22, ty + 46);
  ctx.lineTo(tx - 26 + wind, ty + 46);
  ctx.closePath();
  ctx.fill();

  // Cajado/arma espectral cinzenta
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tx + 14, ty + 10);
  ctx.lineTo(tx + 24, ty + 46);
  ctx.stroke();

  // Runa temporal purpúrea pulsando sutilmente na capa
  ctx.fillStyle = '#c084fc';
  ctx.fillRect(tx - 1, ty + 14, 2, 2);
}

// Quadro 3: 1 dos 6 pontos de luz apagando com partículas caindo
// Fundo: Altar do Santuário rúnico sob penumbra
// Destaque: Orbe central rachado perdendo a luz com partículas caindo em cascata
function renderQuadro3(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, timer: number) {
  // 1 Elemento de Fundo: Santuário ancestral com pilares em penumbra
  ctx.fillStyle = '#080c13';
  ctx.fillRect(ox, oy, w, h);

  // Pilares de pedra ancestral
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(ox + 24, oy + 16, 20, 84);
  ctx.fillRect(ox + w - 44, oy + 16, 20, 84);
  ctx.fillStyle = '#162030';
  ctx.fillRect(ox + 18, oy + 12, w - 36, 10);

  // Outros relicários menores enfraquecidos ao fundo
  const outros = [
    { x: ox + 50, y: oy + 50, cor: '#334155' },
    { x: ox + 76, y: oy + 38, cor: '#475569' },
    { x: ox + w - 76, y: oy + 38, cor: '#475569' },
    { x: ox + w - 50, y: oy + 50, cor: '#334155' },
  ];
  outros.forEach((o) => {
    ctx.fillStyle = o.cor;
    ctx.fillRect(o.x - 2, o.y - 2, 4, 4);
  });

  // Base do altar de pedra
  const ax = ox + w / 2;
  const ay = oy + 82;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(ax - 32, ay, 64, 24);
  ctx.fillRect(ax - 22, ay - 14, 44, 14);

  // 1 Elemento de Destaque: Relicário central apagando e partículas caindo
  const orbeY = ay - 32;
  const fadeCycle = (timer * 2.2) % 3;
  const isDying = fadeCycle > 1.2;

  // Orbe rachado em cinza opaco
  ctx.fillStyle = isDying ? '#334155' : '#78350f';
  ctx.beginPath();
  ctx.arc(ax, orbeY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Rachaduras escuras no orbe
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ax - 6, orbeY - 6);
  ctx.lineTo(ax + 2, orbeY + 1);
  ctx.lineTo(ax - 2, orbeY + 8);
  ctx.stroke();

  // Partículas geométricas caindo continuamente simulando a perda da essência
  for (let i = 0; i < 24; i++) {
    const px = ax - 16 + ((i * 13 + 5) % 32);
    const py = orbeY + ((timer * 36 + i * 9) % 52);
    const alpha = Math.max(0, 1 - (py - orbeY) / 50);
    ctx.fillStyle = i % 2 === 0
      ? `rgba(251, 191, 36, ${alpha.toFixed(2)})`
      : `rgba(148, 163, 184, ${alpha.toFixed(2)})`;
    ctx.fillRect(px, py, 2, 2);
  }
}

// Quadro 4: Casinha simples com neve caindo fora de contexto
// Fundo: Colinas e árvores verdejantes de verão sob céu tempestuoso cinzento
// Destaque: Casinha de aldeia com telhado nevado e flocos de neve pixelados anormais
function renderQuadro4(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, timer: number) {
  // 1 Elemento de Fundo: Céu de tempestade gélida sobre colinas verdes
  const skyGrad = ctx.createLinearGradient(ox, oy, ox, oy + 60);
  skyGrad.addColorStop(0, '#1a222c');
  skyGrad.addColorStop(1, '#273444');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(ox, oy, w, 60);

  // Colinas verdes viçosas de verão
  ctx.fillStyle = '#1a3327';
  ctx.beginPath();
  ctx.arc(ox + 40, oy + 94, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12261d';
  ctx.beginPath();
  ctx.arc(ox + 200, oy + 98, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1b3425';
  ctx.fillRect(ox, oy + 76, w, 40);

  // Árvores de copa verde de verão
  ctx.fillStyle = '#1f4d38';
  ctx.beginPath();
  ctx.arc(ox + 36, oy + 62, 16, 0, Math.PI * 2);
  ctx.arc(ox + 196, oy + 66, 18, 0, Math.PI * 2);
  ctx.fill();

  // 1 Elemento de Destaque: Casinha rústica e neve caindo fora de contexto
  const hx = ox + 106;
  const hy = oy + 62;

  // Paredes de madeira
  ctx.fillStyle = '#451a03';
  ctx.fillRect(hx - 20, hy, 40, 26);

  // Telhado inclinado
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(hx, hy - 16);
  ctx.lineTo(hx + 28, hy + 2);
  ctx.lineTo(hx - 28, hy + 2);
  ctx.closePath();
  ctx.fill();

  // Chaminé com fumaça
  ctx.fillStyle = '#292524';
  ctx.fillRect(hx + 12, hy - 22, 6, 12);
  ctx.fillStyle = 'rgba(214, 211, 209, 0.4)';
  ctx.fillRect(hx + 13, hy - 26, 4, 3);
  ctx.fillRect(hx + 15, hy - 31, 5, 4);

  // Camada de neve no telhado
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(hx, hy - 17);
  ctx.lineTo(hx + 27, hy);
  ctx.lineTo(hx + 25, hy + 2);
  ctx.lineTo(hx, hy - 14);
  ctx.lineTo(hx - 25, hy + 2);
  ctx.lineTo(hx - 27, hy);
  ctx.closePath();
  ctx.fill();

  // Janela com luz acolhedora que vacila
  const flicker = 0.8 + 0.2 * Math.sin(timer * 8);
  ctx.fillStyle = `rgba(251, 191, 36, ${flicker.toFixed(2)})`;
  ctx.fillRect(hx - 12, hy + 8, 8, 8);
  ctx.strokeStyle = '#292524';
  ctx.strokeRect(hx - 12, hy + 8, 8, 8);

  // Porta
  ctx.fillStyle = '#292524';
  ctx.fillRect(hx + 3, hy + 10, 9, 16);

  // Flocos de neve fora de época caindo sobre o cenário
  for (let i = 0; i < 35; i++) {
    const sx = ox + ((i * 17 + timer * 8) % w);
    const sy = oy + ((timer * 22 + i * 11) % h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
}

// Quadro 5: Silhueta entregando uma espada a outra silhueta menor
// Fundo: Interior em alvenaria com janela em arco dando para o entardecer
// Destaque: Ancião passando a reluzente Lâmina de Eldrim para o jovem Ren
function renderQuadro5(ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number, timer: number) {
  // 1 Elemento de Fundo: Câmara de pedra e janela em arco
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(ox, oy, w, h);

  // Janela em arco para o entardecer
  const jx = ox + w / 2;
  const jy = oy + 24;
  const jw = 54;
  const jh = 46;

  const windowSky = ctx.createLinearGradient(0, jy, 0, jy + jh);
  windowSky.addColorStop(0, '#312e81');
  windowSky.addColorStop(0.6, '#ea580c');
  windowSky.addColorStop(1, '#fef08a');
  ctx.fillStyle = windowSky;
  ctx.fillRect(jx - jw / 2, jy, jw, jh);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.strokeRect(jx - jw / 2, jy, jw, jh);

  // Tocha na parede
  ctx.fillStyle = '#78350f';
  ctx.fillRect(ox + 18, oy + 42, 4, 16);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(ox + 17, oy + 38, 6, 6);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(ox + 19, oy + 36, 2, 4);

  // Chão da câmara
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(ox, oy + 86, w, 30);

  // 1 Elemento de Destaque: As duas silhuetas e a Lâmina de Eldrim
  // Silhueta do Ancião (à esquerda, mais alto)
  const ax = ox + 68;
  const ay = oy + 86;
  ctx.fillStyle = '#020617';
  ctx.fillRect(ax - 5, ay - 46, 10, 10);
  ctx.beginPath();
  ctx.moveTo(ax - 6, ay - 36);
  ctx.lineTo(ax + 8, ay - 36);
  ctx.lineTo(ax + 14, ay);
  ctx.lineTo(ax - 12, ay);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(ax + 4, ay - 28, 16, 4);

  // LÂMINA DE ELDRIM (reluzindo entre os dois)
  const sx = ox + 104;
  const sy = ay - 28;

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(sx - 2, sy - 5, 4, 11);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(sx - 7, sy - 1, 5, 3);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(sx + 2, sy - 2, 28, 5);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx + 2, sy);
  ctx.lineTo(sx + 30, sy);
  ctx.stroke();

  // Partículas de brilho na lâmina
  const sparkle = Math.sin(timer * 6);
  if (sparkle > 0) {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sx + 14, sy - 6, 2, 2);
    ctx.fillRect(sx + 24, sy + 5, 2, 2);
  }

  // Silhueta de Ren (à direita, menor)
  const rx = ox + 158;
  const ry = ay;
  ctx.fillStyle = '#020617';
  ctx.fillRect(rx - 4, ry - 38, 9, 9);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(rx - 5, ry - 35, 3, 2);
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.moveTo(rx - 5, ry - 28);
  ctx.lineTo(rx + 6, ry - 28);
  ctx.lineTo(rx + 10, ry);
  ctx.lineTo(rx - 8, ry);
  ctx.closePath();
  ctx.fill();
  // Braços de Ren estendidos para acolher a espada
  ctx.fillRect(rx - 16, ry - 26, 12, 3);
  ctx.fillRect(rx - 18, ry - 28, 4, 4);
}

// Renderizador principal da CINEMATICA (5 quadros com ilustrações geométricas e máquina de escrever 40ms)
function renderCinematica(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#06090e';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const quadroIdx = Math.max(0, Math.min(CINEMATICA_QUADROS.length - 1, state.cinematicaQuadro));
  const quadro = CINEMATICA_QUADROS[quadroIdx];

  // 1. ÁREA DA ILUSTRAÇÃO (232x114px)
  const iluX = 12;
  const iluY = 10;
  const iluW = 232;
  const iluH = 114;

  ctx.save();
  ctx.beginPath();
  ctx.rect(iluX, iluY, iluW, iluH);
  ctx.clip();

  if (quadroIdx === 0) {
    renderQuadro1(ctx, iluX, iluY, iluW, iluH, state.cinematicaQuadroTimer);
  } else if (quadroIdx === 1) {
    renderQuadro2(ctx, iluX, iluY, iluW, iluH, state.cinematicaQuadroTimer);
  } else if (quadroIdx === 2) {
    renderQuadro3(ctx, iluX, iluY, iluW, iluH, state.cinematicaQuadroTimer);
  } else if (quadroIdx === 3) {
    renderQuadro4(ctx, iluX, iluY, iluW, iluH, state.cinematicaQuadroTimer);
  } else {
    renderQuadro5(ctx, iluX, iluY, iluW, iluH, state.cinematicaQuadroTimer);
  }

  ctx.restore();

  // Moldura dourada da ilustração
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(iluX + 0.5, iluY + 0.5, iluW - 1, iluH - 1);

  // Cantos decorados 16-bit
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(iluX - 1, iluY - 1, 3, 3);
  ctx.fillRect(iluX + iluW - 2, iluY - 1, 3, 3);
  ctx.fillRect(iluX - 1, iluY + iluH - 2, 3, 3);
  ctx.fillRect(iluX + iluW - 2, iluY + iluH - 2, 3, 3);

  // 2. CAIXA DE TEXTO NARRATIVO (232x74px)
  const boxX = 12;
  const boxY = 130;
  const boxW = 232;
  const boxH = 74;

  ctx.fillStyle = 'rgba(9, 13, 20, 0.96)';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  // Cantos da caixa de diálogo
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(boxX - 1, boxY - 1, 3, 3);
  ctx.fillRect(boxX + boxW - 2, boxY - 1, 3, 3);
  ctx.fillRect(boxX - 1, boxY + boxH - 2, 3, 3);
  ctx.fillRect(boxX + boxW - 2, boxY + boxH - 2, 3, 3);

  // Título / Número do Quadro
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(quadro.titulo, boxX + 10, boxY + 7);

  // Efeito Máquina de Escrever: 1 letra a cada 40ms (0.040s)
  const totalChars = Math.floor(state.cinematicaQuadroTimer / 0.040);
  const fullText = quadro.texto;
  const isTypingComplete = totalChars >= fullText.length;

  const typewriterData = getTypewriterLines(fullText, totalChars, 34);

  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#f1f5f9';

  typewriterData.lines.forEach((line, lineIdx) => {
    const lineY = boxY + 20 + lineIdx * 14;
    ctx.fillText(line, boxX + 10, lineY);
  });

  // Cursor piscante ou seta de avanço
  if (!isTypingComplete) {
    const blink = Math.sin(state.cinematicaQuadroTimer * 12) > 0;
    if (blink && typewriterData.lines.length > 0) {
      const lastLineIdx = typewriterData.lines.length - 1;
      const lastLine = typewriterData.lines[lastLineIdx];
      const lastLineY = boxY + 20 + lastLineIdx * 14;
      const charWidth = 5.4;
      const cursorX = boxX + 10 + lastLine.length * charWidth;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cursorX, lastLineY + 1, 4, 8);
    }
  } else {
    // Texto completo: indicador de avanço piscando
    const blinkArrow = Math.sin(state.cinematicaQuadroTimer * 6) > 0;
    if (blinkArrow) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.fillText('▶', boxX + boxW - 14, boxY + boxH - 12);
    }
  }

  // 3. RODAPÉ DE COMANDOS
  ctx.textAlign = 'center';
  ctx.font = '8px "Courier New", monospace';
  ctx.fillStyle = '#94a3b8';
  if (isTypingComplete) {
    ctx.fillText('[Z] Avançar  •  [ENTER] Pular Tudo', LOGICAL_WIDTH / 2, 214);
  } else {
    ctx.fillText('[Z] Acelerar  •  [ENTER] Pular Tudo', LOGICAL_WIDTH / 2, 214);
  }
}

// Transição ao fim da Cinemática: herói na entrada sul do Vale Verdejante
function irParaOverworldEntradaVale(state: GameState) {
  state.estadoAtual = EstadoJogo.OVERWORLD;
  // Posição de entrada do Vale Verdejante (sul do mapa, caminho aberto)
  state.heroi.x = 248;
  state.heroi.y = 384;
  state.heroi.direcao = 'cima';
  state.heroi.velocidade = HERO_BASE_SPEED;
  // Centraliza a câmera no herói
  state.camera.x = Math.max(0, Math.min(MAP_WIDTH - LOGICAL_WIDTH, state.heroi.x - LOGICAL_WIDTH / 2));
  state.camera.y = Math.max(0, Math.min(MAP_HEIGHT - LOGICAL_HEIGHT, state.heroi.y - LOGICAL_HEIGHT / 2));
}

// Lógica de avanço de quadro da Cinemática via tecla Z
function avancarCinematica(state: GameState) {
  const currentQuadro = CINEMATICA_QUADROS[state.cinematicaQuadro];
  const charsCount = Math.floor(state.cinematicaQuadroTimer / 0.040);
  const isTypingComplete = charsCount >= currentQuadro.texto.length;

  if (!isTypingComplete) {
    // Se ainda está digitando, Z completa o texto do quadro imediatamente
    state.cinematicaQuadroTimer = currentQuadro.texto.length * 0.040;
  } else {
    // Se já completou o texto, Z avança para o próximo quadro
    if (state.cinematicaQuadro < CINEMATICA_QUADROS.length - 1) {
      state.cinematicaQuadro += 1;
      state.cinematicaQuadroTimer = 0;
    } else {
      // Fim do 5º quadro -> vai para o Overworld na entrada do Vale Verdejante
      irParaOverworldEntradaVale(state);
    }
  }
}

// ============================================================================
// HUD & MENU DE PAUSA (OVERWORLD & DUNGEON)
// ============================================================================

// Nomes e descrições dos itens de progressão para o inventário
const ITENS_INFO: Record<ItemSecundarioId, { nome: string; regiao: string }> = {
  gancho_vinha: { nome: 'Gancho de Vinha', regiao: 'Vale Verdejante' },
  bumerangue_mares: { nome: 'Bumerangue das Marés', regiao: 'Charco Sombrio' },
  botas_glaciais: { nome: 'Botas de Passo Glacial', regiao: 'Terras Geladas' },
  manopla_ignea: { nome: 'Manopla Ígnea', regiao: 'Deserto de Kaal' },
  talisma_terra: { nome: 'Talismã da Terra', regiao: 'Penhascos de Pedra' },
  lanterna_sombras: { nome: 'Lanterna das Sombras', regiao: 'Ruínas Submersas' },
};

// Renderiza o ícone 16x16 do item secundário equipado (ou tracejado se nenhum)
function renderIconeItemSecundario(
  ctx: CanvasRenderingContext2D,
  itemId: ItemSecundarioId | null,
  x: number,
  y: number,
  cooldownTimer?: number
) {
  const size = 16;
  if (!itemId) {
    // Vazio / tracejado se nenhum item equipado
    ctx.save();
    ctx.fillStyle = 'rgba(10, 15, 24, 0.75)';
    ctx.fillRect(x, y, size, size);

    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    ctx.restore();

    // Rótulo discreto central indicando a tecla de uso secundário
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', x + size / 2, y + size / 2);
    return;
  }

  // Fundo e moldura 16-bit com cantos dourados para item equipado
  ctx.fillStyle = '#090d16';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

  // Cantos decorados 1px
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x, y, 1, 1);
  ctx.fillRect(x + size - 1, y, 1, 1);
  ctx.fillRect(x, y + size - 1, 1, 1);
  ctx.fillRect(x + size - 1, y + size - 1, 1, 1);

  // Ícones em pixel art 16x16 de acordo com o item equipado
  if (itemId === 'gancho_vinha') {
    // Gancho de Vinha: vinha verde sinuosa e ponta metálica
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + 7, y + 8, 4, Math.PI * 0.4, Math.PI * 1.8);
    ctx.stroke();
    // Ponta metálica do gancho
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(x + 10, y + 4, 3, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + 11, y + 7, 2, 2);
  } else if (itemId === 'bumerangue_mares') {
    // Bumerangue das Marés: arco turquesa aerodinâmico
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 13);
    ctx.lineTo(x + 9, y + 4);
    ctx.lineTo(x + 13, y + 11);
    ctx.stroke();
    ctx.fillStyle = '#a5f3fc';
    ctx.fillRect(x + 8, y + 3, 2, 2);
  } else if (itemId === 'botas_glaciais') {
    // Botas de Passo Glacial: bota azul com orla de gelo
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x + 5, y + 4, 5, 5);
    ctx.fillRect(x + 4, y + 8, 8, 4);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(x + 10, y + 9, 2, 3);
    ctx.fillRect(x + 5, y + 3, 5, 1);
  } else if (itemId === 'manopla_ignea') {
    // Manopla Ígnea: manopla rubra com faísca de fogo
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 4, y + 6, 8, 6);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 6, y + 3, 4, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 7, y + 4, 2, 2);
  } else if (itemId === 'talisma_terra') {
    // Talismã da Terra: medalhão de pedra circular com runa
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(x + 8, y + 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + 7, y + 6, 2, 4);
    ctx.fillRect(x + 6, y + 7, 4, 2);
  } else if (itemId === 'lanterna_sombras') {
    // Lanterna das Sombras: moldura de ferro com luz violeta
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 5, y + 4, 6, 8);
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(x + 6, y + 6, 4, 4);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 7, y + 2, 2, 2);
  }

  // Indicador de Recarga / Cooldown
  if (cooldownTimer && cooldownTimer > 0) {
    const fillH = Math.ceil(size * Math.min(1.0, cooldownTimer / 1.2));
    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    ctx.fillRect(x, y + (size - fillH), size, fillH);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
  }
}

// Renderiza o HUD completo (Vida em losangos, Fluxo Arcano 60x6px e Item Secundário 16x16)
function renderHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();

  // Fundo sutil translúcido sob os indicadores superiores esquerdos
  const vidaW = state.vidaMax * 11;
  const barArcanoX = 10 + vidaW + 4;
  const hudLeftW = barArcanoX + 60 + 4;

  ctx.fillStyle = 'rgba(6, 11, 18, 0.78)';
  ctx.fillRect(4, 3, hudLeftW, 16);
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.lineWidth = 1;
  ctx.strokeRect(4.5, 3.5, hudLeftW - 1, 15);

  // 1. CANTO SUPERIOR ESQUERDO: N losangos representando "Fragmentos de Vida"
  // (N = vida máxima atual; preenchido = vida atual, contorno = perdida)
  for (let i = 0; i < state.vidaMax; i++) {
    const cx = 11 + i * 11;
    const cy = 11;
    const preenchido = i < Math.floor(state.vidaAtual);

    ctx.beginPath();
    ctx.moveTo(cx, cy - 4.5); // topo
    ctx.lineTo(cx + 4.5, cy); // direita
    ctx.lineTo(cx, cy + 4.5); // base
    ctx.lineTo(cx - 4.5, cy); // esquerda
    ctx.closePath();

    if (preenchido) {
      // Losango preenchido (Fragmento de Vida ativo) — Vermelho rubi vibrante
      ctx.fillStyle = '#e11d48';
      ctx.fill();

      // Borda sutil de contraste
      ctx.strokeStyle = '#9f1239';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ponto de brilho 16-bit specular
      ctx.fillStyle = '#fecdd3';
      ctx.fillRect(cx - 1, cy - 2, 2, 2);
    } else {
      // Contorno apenas (Fragmento de Vida perdido)
      ctx.fillStyle = '#090e17';
      ctx.fill();

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Centro escuro fosco
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
  }

  // 2. BARRA DE "FLUXO ARCANO" AO LADO (60x6px, enche a 5%/s até o máximo atual)
  const barArcanoY = 8;
  const barArcanoW = 60;
  const barArcanoH = 6;

  // Trilho / Fundo da barra
  ctx.fillStyle = '#060c15';
  ctx.fillRect(barArcanoX, barArcanoY, barArcanoW, barArcanoH);

  // Preenchimento proporcional ao arcano atual
  const arcanoRatio = Math.max(0, Math.min(1, state.arcanoAtual / state.arcanoMax));
  const fillW = Math.round(barArcanoW * arcanoRatio);

  if (fillW > 0) {
    // Gradiente / preenchimento azul ciano arcano
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(barArcanoX, barArcanoY, fillW, barArcanoH);

    // Linha superior de brilho luminosa
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(barArcanoX, barArcanoY, fillW, 1);

    // Ponto mais brilhante no início da barra
    if (fillW > 2) {
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(barArcanoX, barArcanoY + 1, Math.min(fillW, 8), 1);
    }
  }

  // Borda da barra de Fluxo Arcano
  ctx.strokeStyle = '#1e3a5f';
  ctx.lineWidth = 1;
  ctx.strokeRect(barArcanoX + 0.5, barArcanoY + 0.5, barArcanoW - 1, barArcanoH - 1);

  // 3. INDICADOR DE CHAVES NO HUD (se em DUNGEON ou se possuir chaves)
  if (
    state.estadoAtual === EstadoJogo.DUNGEON ||
    state.dungeonChavesPequenas > 0 ||
    state.dungeonTemChaveChefe
  ) {
    const keyHudX = barArcanoX + barArcanoW + 6;
    const keyHudY = 3;
    const keyHudW = state.dungeonTemChaveChefe ? 44 : 28;

    ctx.fillStyle = 'rgba(6, 11, 18, 0.78)';
    ctx.fillRect(keyHudX, keyHudY, keyHudW, 16);
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(keyHudX + 0.5, keyHudY + 0.5, keyHudW - 1, 15);

    // Ícone da Chave Pequena
    const kx = keyHudX + 5;
    const ky = keyHudY + 8;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(kx, ky, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(kx, ky, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(kx + 1, ky - 1, 4, 1.5);
    ctx.fillRect(kx + 3, ky + 0.5, 1.5, 1.5);

    // Contador de Chaves Pequenas
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = state.dungeonChavesPequenas > 0 ? '#fef08a' : '#64748b';
    ctx.fillText(`${state.dungeonChavesPequenas}`, kx + 7, ky + 0.5);

    // Ícone da Chave Grande do Chefe (se obtida)
    if (state.dungeonTemChaveChefe) {
      const ckX = keyHudX + 24;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ckX, ky, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(ckX - 1, ky - 1, 2, 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(ckX + 2, ky - 1, 5, 2);
      ctx.fillRect(ckX + 5, ky + 1, 2, 2);
    }
  }

  // 4. CANTO SUPERIOR DIREITO: Ícone 16x16 do Item Secundário equipado
  const itemBoxX = LOGICAL_WIDTH - 16 - 8; // 232
  const itemBoxY = 4;

  // Fundo sutil atrás do ícone do item secundário
  ctx.fillStyle = 'rgba(6, 11, 18, 0.78)';
  ctx.fillRect(itemBoxX - 2, itemBoxY - 1, 20, 21);
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.85)';
  ctx.lineWidth = 1;
  ctx.strokeRect(itemBoxX - 1.5, itemBoxY - 0.5, 19, 20);

  renderIconeItemSecundario(ctx, state.itemEquipado, itemBoxX, itemBoxY, state.botasCooldownTimer);

  // Rótulo da tecla secundária [X] abaixo da caixa
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = state.itemEquipado ? '#38bdf8' : '#64748b';
  ctx.fillText('X', itemBoxX + 8, itemBoxY + 18);

  ctx.restore();
}

// ============================================================================
// AUXILIARES DE CARTOGRAFIA & ÍCONES DO MENU DE PAUSA (16-BIT)
// ============================================================================

// Criação da grade inicial de áreas visitadas do Vale Verdejante (9 colunas x 8 linhas)
function criarAreasVisitadasValeIniciais(): boolean[][] {
  const matriz: boolean[][] = [];
  for (let c = 0; c < 9; c++) {
    matriz[c] = [];
    for (let r = 0; r < 8; r++) {
      matriz[c][r] = false;
    }
  }
  // Ponto de partida inicial de Ren (col 4, row 6 no Vilarejo de Pedraverde) e arredores
  matriz[4][6] = true;
  matriz[4][7] = true;
  matriz[3][6] = true;
  matriz[5][6] = true;
  return matriz;
}

// Criação da grade inicial de áreas visitadas do Charco Sombrio (9 colunas x 8 linhas)
function criarAreasVisitadasCharcoIniciais(): boolean[][] {
  const matriz: boolean[][] = [];
  for (let c = 0; c < 9; c++) {
    matriz[c] = [];
    for (let r = 0; r < 8; r++) {
      matriz[c][r] = false;
    }
  }
  // Vilarejo de Juncoturvo (col 4, row 4) e caminho sul de chegada (col 4, row 7)
  matriz[4][3] = true;
  matriz[4][4] = true;
  matriz[3][4] = true;
  matriz[5][4] = true;
  matriz[4][7] = true;
  return matriz;
}

// Criação da grade inicial de áreas visitadas de Terras Geladas (9 colunas x 8 linhas)
function criarAreasVisitadasGeladasIniciais(): boolean[][] {
  const matriz: boolean[][] = [];
  for (let c = 0; c < 9; c++) {
    matriz[c] = [];
    for (let r = 0; r < 8; r++) {
      matriz[c][r] = false;
    }
  }
  // Vilarejo Gélida (col 4, row 4) e caminho leste de chegada (col 8, row 4)
  matriz[4][3] = true;
  matriz[4][4] = true;
  matriz[3][4] = true;
  matriz[5][4] = true;
  matriz[8][4] = true;
  return matriz;
}

// Renderiza o ícone de Bomba 16-bit clássica (esfera preta, reflexo specular e pavio com faísca)
function renderIconeBomba(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 1, y + 2, 6, 6);
  ctx.fillRect(x + 2, y + 1, 4, 8);

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x + 2, y + 3, 2, 2);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 3, y + 1, 2, 1);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 5, y, 1, 2);

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 6, y - 1, 2, 2);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + 7, y, 1, 1);
}

// Renderiza ícone diferenciado para Vilarejo (casinha com telhado inclinado e porta)
function renderIconeVilarejo(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x + 3, y, 2, 1);
  ctx.fillRect(x + 2, y + 1, 4, 1);
  ctx.fillRect(x + 1, y + 2, 6, 1);
  ctx.fillRect(x, y + 3, 8, 1);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(x + 1, y + 4, 6, 4);

  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 3, y + 5, 2, 3);

  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 5, y, 1, 2);
}

// Renderiza ícone diferenciado para Entrada de Santuário (templo com colunas e frontão rúnico)
function renderIconeSantuario(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#10b981';
  ctx.fillRect(x + 2, y, 4, 1);
  ctx.fillRect(x + 1, y + 1, 6, 1);
  ctx.fillRect(x, y + 2, 8, 1);

  ctx.fillStyle = '#34d399';
  ctx.fillRect(x + 3, y + 1, 2, 1);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(x + 1, y + 3, 2, 4);
  ctx.fillRect(x + 5, y + 3, 2, 4);

  ctx.fillStyle = '#022c22';
  ctx.fillRect(x + 3, y + 3, 2, 4);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x, y + 7, 8, 1);
}

// Renderiza ícone diferenciado para Catacumba / Cripta (arco subterrâneo com estela rúnica turquesa)
function renderIconeCatacumba(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 1, y, 6, 2);
  ctx.fillRect(x, y + 2, 8, 5);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 2, y + 3, 4, 4);

  ctx.fillStyle = '#34d399';
  ctx.fillRect(x + 3, y + 1, 2, 2);
  ctx.fillRect(x + 2, y + 2, 4, 1);

  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(x + 3, y + 4, 2, 1);
}

// Renderiza ícone diferenciado para a Forja Ancestral (bigorna de ferro e faísca âmbar)
function renderIconeForja(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x, y + 2, 8, 2);
  ctx.fillRect(x + 2, y + 4, 4, 2);
  ctx.fillRect(x + 1, y + 6, 6, 2);

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(x + 4, y, 2, 2);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(x + 3, y + 1, 1, 1);
}

// Renderiza os 6 Relicários Elementais (preenchido com cores vivas ou em silhueta tracejada cinza)
function renderIconeRelicario(
  ctx: CanvasRenderingContext2D,
  tipo: 'raiz' | 'mares' | 'gelo' | 'chamas' | 'terra' | 'sombras',
  obtido: boolean,
  x: number,
  y: number,
  size = 16
) {
  ctx.save();
  if (obtido) {
    const coresFundo: Record<string, string> = {
      raiz: '#064e3b',
      mares: '#0c4a6e',
      gelo: '#164e63',
      chamas: '#7f1d1d',
      terra: '#713f12',
      sombras: '#581c87',
    };
    const coresPrimarias: Record<string, string> = {
      raiz: '#34d399',
      mares: '#38bdf8',
      gelo: '#a5f3fc',
      chamas: '#f97316',
      terra: '#fbbf24',
      sombras: '#c084fc',
    };

    ctx.fillStyle = coresFundo[tipo] || '#0f172a';
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x, y, 1, 1);
    ctx.fillRect(x + size - 1, y, 1, 1);
    ctx.fillRect(x, y + size - 1, 1, 1);
    ctx.fillRect(x + size - 1, y + size - 1, 1, 1);

    ctx.fillStyle = coresPrimarias[tipo] || '#ffffff';

    if (tipo === 'raiz') {
      ctx.fillRect(x + 7, y + 3, 2, 10);
      ctx.fillRect(x + 4, y + 5, 3, 2);
      ctx.fillRect(x + 9, y + 7, 3, 2);
      ctx.fillRect(x + 5, y + 9, 2, 2);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(x + 7, y + 2, 2, 2);
    } else if (tipo === 'mares') {
      ctx.fillRect(x + 7, y + 3, 2, 2);
      ctx.fillRect(x + 6, y + 5, 4, 3);
      ctx.fillRect(x + 5, y + 8, 6, 3);
      ctx.fillRect(x + 6, y + 11, 4, 2);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(x + 6, y + 7, 2, 2);
    } else if (tipo === 'gelo') {
      ctx.fillRect(x + 7, y + 3, 2, 10);
      ctx.fillRect(x + 3, y + 7, 10, 2);
      ctx.fillRect(x + 5, y + 5, 2, 2);
      ctx.fillRect(x + 9, y + 5, 2, 2);
      ctx.fillRect(x + 5, y + 9, 2, 2);
      ctx.fillRect(x + 9, y + 9, 2, 2);
    } else if (tipo === 'chamas') {
      ctx.fillRect(x + 7, y + 2, 2, 3);
      ctx.fillRect(x + 5, y + 5, 5, 3);
      ctx.fillRect(x + 4, y + 8, 7, 4);
      ctx.fillRect(x + 5, y + 12, 5, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 6, y + 7, 3, 4);
    } else if (tipo === 'terra') {
      ctx.fillRect(x + 4, y + 4, 8, 8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 6, y + 6, 4, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 7, y + 7, 2, 2);
    } else if (tipo === 'sombras') {
      ctx.fillRect(x + 4, y + 4, 8, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 6, y + 4, 6, 6);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(x + 4, y + 5, 3, 6);
    }
  } else {
    // Silhueta tracejada cinza para relicário não obtido
    ctx.fillStyle = '#080d16';
    ctx.fillRect(x, y, size, size);

    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + size / 2, y + size / 2);
  }
  ctx.restore();
}

// Subtela de Pausa: Mapa (Miniatura 8x8px por sala/área visitada com ícones diferenciados)
function renderSubtelaMapa(ctx: CanvasRenderingContext2D, state: GameState) {
  const winW = 224;
  const winH = 172;
  const winX = Math.round((LOGICAL_WIDTH - winW) / 2); // 16
  const winY = Math.round((LOGICAL_HEIGHT - winH) / 2); // 26

  // Moldura 16-bit da janela de mapa
  ctx.fillStyle = '#080d16';
  ctx.fillRect(winX, winY, winW, winH);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);

  // Cantos decorados dourados
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(winX - 1, winY - 1, 3, 3);
  ctx.fillRect(winX + winW - 2, winY - 1, 3, 3);
  ctx.fillRect(winX - 1, winY + winH - 2, 3, 3);
  ctx.fillRect(winX + winW - 2, winY + winH - 2, 3, 3);

  // Identifica se está em DUNGEON (ou pausado a partir dela)
  const ehDungeon =
    state.estadoAtual === EstadoJogo.DUNGEON ||
    state.estadoAnterior === EstadoJogo.DUNGEON;

  // --------------------------------------------------------------------------
  // CASO 1: DUNGEON (Cripta do Guardião Adormecido)
  // --------------------------------------------------------------------------
  if (ehDungeon && state.dungeonTipoAtivo === 'cripta') {
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#10b981';
    ctx.fillText('— CRIPTA DO GUARDIÃO ADORMECIDO —', winX + winW / 2, winY + 8);

    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#34d399';
    ctx.fillText('Catacumba Secreta do Vale Verdejante • 3 Câmaras', winX + winW / 2, winY + 20);

    const mapBoxX = winX + 16;
    const mapBoxY = winY + 34;
    const mapBoxW = winW - 32;
    const mapBoxH = 92;

    ctx.fillStyle = '#0a101a';
    ctx.fillRect(mapBoxX, mapBoxY, mapBoxW, mapBoxH);
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapBoxX + 0.5, mapBoxY + 0.5, mapBoxW - 1, mapBoxH - 1);

    const salasCriptaInfo = [
      { id: 'cripta_sala_3_recompensa', label: 'CÂMARA DO GUARDIÃO', sub: '+1 Fragmento de Vida ★' },
      { id: 'cripta_sala_2_combate', label: 'GALERIA DAS SOMBRAS', sub: 'Combate Desafiador ⚔' },
      { id: 'cripta_sala_1_puzzle', label: 'CÂMARA DOS SELOS', sub: 'Entrada & Puzzle dos Selos ⬡' },
    ];

    const cRoomW = 128;
    const cRoomH = 20;
    const cGapY = 8;
    const cStartX = mapBoxX + (mapBoxW - cRoomW) / 2;
    const cStartY = mapBoxY + 8;

    salasCriptaInfo.forEach((s, idx) => {
      const ry = cStartY + idx * (cRoomH + cGapY);
      const visitada = state.salasVisitadasCripta && state.salasVisitadasCripta[s.id];
      const ehAtual = state.dungeonSalaAtualId === s.id;

      // Retângulos 8x8px compondo a sala
      ctx.fillStyle = visitada ? '#cbd5e1' : '#0f172a';
      ctx.fillRect(cStartX, ry, cRoomW, cRoomH);

      ctx.strokeStyle = ehAtual ? '#38bdf8' : visitada ? '#94a3b8' : '#334155';
      ctx.lineWidth = ehAtual ? 1.5 : 1;
      ctx.strokeRect(cStartX + 0.5, ry + 0.5, cRoomW - 1, cRoomH - 1);

      if (visitada) {
        ctx.font = 'bold 7px "Courier New", monospace';
        ctx.fillStyle = ehAtual ? '#0284c7' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(s.label, cStartX + cRoomW / 2, ry + 3);

        ctx.font = '6px "Courier New", monospace';
        ctx.fillStyle = '#475569';
        ctx.fillText(s.sub, cStartX + cRoomW / 2, ry + 11);
      } else {
        ctx.font = '6px "Courier New", monospace';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.fillText('??? [Área Não Visitada]', cStartX + cRoomW / 2, ry + 7);
      }

      // Ícone piscante na posição atual do herói
      if (ehAtual) {
        const piscarHeroi = Math.floor((state.pausaTimer || Date.now() / 250) * 4) % 2 === 0;
        if (piscarHeroi) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cStartX + 12, ry + cRoomH / 2, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Conexão vertical
      if (idx < 2) {
        ctx.fillStyle = visitada ? '#34d399' : '#1e293b';
        ctx.fillRect(cStartX + cRoomW / 2 - 2, ry + cRoomH, 4, cGapY);
      }
    });

    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#a7f3d0';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Upgrade Permanente: ${state.criptaUpgradeColetado ? '★ COLETADO (+1 Vida Máx)' : '○ Selado no Baú Ancestral'}`,
      winX + winW / 2,
      winY + winH - 22
    );
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('[Z] ou [X] Retornar ao Menu', winX + winW / 2, winY + winH - 10);
    return;
  }

  // --------------------------------------------------------------------------
  // CASO 2: DUNGEON (Santuário da Raiz Antiga)
  // --------------------------------------------------------------------------
  if (ehDungeon) {
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('— PLANTA DO SANTUÁRIO —', winX + winW / 2, winY + 8);

    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#86efac';
    ctx.fillText('Santuário da Raiz Antiga • Câmaras em Grade 3x3', winX + winW / 2, winY + 20);

    const dMapW = 108;
    const dMapH = 84;
    const dStartX = winX + 16;
    const dStartY = winY + 34;

    ctx.fillStyle = '#0a101a';
    ctx.fillRect(dStartX, dStartY, dMapW, dMapH);
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 1;
    ctx.strokeRect(dStartX + 0.5, dStartY + 0.5, dMapW - 1, dMapH - 1);

    const roomW = 32;
    const roomH = 24;
    const gapX = 3;
    const gapY = 3;

    const salasGrid = [
      ['sala_0_0_cripta', 'sala_1_0_chefe', 'sala_2_0_altar'],
      ['sala_0_1_tesouro', 'sala_1_1_centro', 'sala_2_1_fosso'],
      ['sala_0_2_jardim', 'sala_1_2_atrio', 'sala_2_2_cripta'],
    ];

    for (let gy = 0; gy < 3; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        const sid = salasGrid[gy][gx];
        const rx = dStartX + 3 + gx * (roomW + gapX);
        const ry = dStartY + 3 + gy * (roomH + gapY);

        const visitada = state.salasVisitadasDungeon && state.salasVisitadasDungeon[sid];
        const ehAtual = state.dungeonSalaAtualId === sid;

        // Bloco da câmara: cinza claro se visitada, escuro se não
        ctx.fillStyle = visitada ? '#cbd5e1' : '#0f172a';
        ctx.fillRect(rx, ry, roomW, roomH);

        ctx.strokeStyle = ehAtual ? '#38bdf8' : visitada ? '#94a3b8' : '#1e293b';
        ctx.lineWidth = ehAtual ? 1.5 : 1;
        ctx.strokeRect(rx + 0.5, ry + 0.5, roomW - 1, roomH - 1);

        // Ícones especiais nas câmaras
        if (visitada) {
          if (sid === 'sala_1_2_atrio') {
            ctx.fillStyle = '#10b981';
            ctx.font = '6px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ENTRADA', rx + roomW / 2, ry + roomH / 2 - 2);
          } else if (sid === 'sala_1_0_chefe') {
            ctx.fillStyle = state.chefeRaizarca && state.chefeRaizarca.derrotado ? '#10b981' : '#ef4444';
            ctx.font = 'bold 6px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(state.chefeRaizarca && state.chefeRaizarca.derrotado ? 'RELICÁRIO' : 'CHEFE ⚔', rx + roomW / 2, ry + roomH / 2 - 2);
          } else if (sid === 'sala_0_1_tesouro') {
            ctx.fillStyle = '#f59e0b';
            ctx.font = '6px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GANCHO', rx + roomW / 2, ry + roomH / 2 - 2);
          }
        }

        // Ícone piscante na posição do herói
        if (ehAtual) {
          const piscarHeroi = Math.floor((state.pausaTimer || Date.now() / 250) * 4) % 2 === 0;
          if (piscarHeroi) {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(rx + roomW / 2, ry + roomH / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    }

    // Painel lateral de status do Santuário
    const dPanelX = winX + 132;
    const dPanelY = winY + 34;

    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('STATUS DA DUNGEON', dPanelX, dPanelY + 6);

    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Chaves Pequenas: ${state.dungeonChavesPequenas ?? 0}`, dPanelX, dPanelY + 22);
    ctx.fillText(`• Chave Raizarca: ${state.dungeonTemChaveChefe ? '★ Sim' : '○ Não'}`, dPanelX, dPanelY + 34);

    ctx.fillStyle = state.chefeRaizarca && state.chefeRaizarca.derrotado ? '#4ade80' : '#f87171';
    ctx.fillText(`• Raizarca: ${state.chefeRaizarca && state.chefeRaizarca.derrotado ? 'Vencido 🌿' : 'Vivo ⚔'}`, dPanelX, dPanelY + 48);

    ctx.fillStyle = state.dungeonItemObtido ? '#38bdf8' : '#94a3b8';
    ctx.fillText(`• Relíquia: ${state.dungeonItemObtido ? 'Gancho Obtido' : '○ Na Câmara'}`, dPanelX, dPanelY + 62);

    ctx.font = '7px "Courier New", monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText('[Z] ou [X] Retornar ao Menu', winX + winW / 2, winY + winH - 10);
    return;
  }

  // --------------------------------------------------------------------------
  // CASO 3: OVERWORLD (Vale Verdejante ou Charco Sombrio - Grade 9x8)
  // --------------------------------------------------------------------------
  const ehCharco = state.regiaoAtual === 'charco';

  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = ehCharco ? '#a3e635' : '#fbbf24';
  ctx.fillText(
    ehCharco ? '— MAPA: CHARCO SOMBRIO —' : '— MAPA: VALE VERDEJANTE —',
    winX + winW / 2,
    winY + 8
  );

  ctx.font = '7px "Courier New", monospace';
  ctx.fillStyle = ehCharco ? '#22d3ee' : '#38bdf8';
  ctx.fillText(
    ehCharco
      ? 'Região 2 • Pântano & Vilarejo Juncoturvo'
      : 'Região 1 • Vale Central & Vilarejo de Pedraverde',
    winX + winW / 2,
    winY + 20
  );

  const gridStartX = winX + 14;
  const gridStartY = winY + 34;
  const colCount = 9;
  const rowCount = 8;
  const rectSize = 8;
  const rectGap = 1;
  const mapGridW = colCount * rectSize + (colCount - 1) * rectGap; // 80px
  const mapGridH = rowCount * rectSize + (rowCount - 1) * rectGap; // 71px

  // Fundo da área de cartografia
  ctx.fillStyle = ehCharco ? '#0a1410' : '#060b12';
  ctx.fillRect(gridStartX - 2, gridStartY - 2, mapGridW + 4, mapGridH + 4);
  ctx.strokeStyle = ehCharco ? '#1f3a2c' : '#1e3a5f';
  ctx.lineWidth = 1;
  ctx.strokeRect(gridStartX - 1.5, gridStartY - 1.5, mapGridW + 3, mapGridH + 3);

  if (!state.areasVisitadasVale) {
    state.areasVisitadasVale = criarAreasVisitadasValeIniciais();
  }
  if (!state.areasVisitadasCharco) {
    state.areasVisitadasCharco = criarAreasVisitadasCharcoIniciais();
  }

  const matrizVisitadas = ehCharco ? state.areasVisitadasCharco : state.areasVisitadasVale;
  let totalVisitadas = 0;

  for (let c = 0; c < colCount; c++) {
    for (let r = 0; r < rowCount; r++) {
      const rx = gridStartX + c * (rectSize + rectGap);
      const ry = gridStartY + r * (rectSize + rectGap);
      const visitada = Boolean(matrizVisitadas && matrizVisitadas[c] && matrizVisitadas[c][r]);

      if (visitada) {
        totalVisitadas++;
        if (ehCharco) {
          // Charco Sombrio: Tom verde-oliva musgoso (#5c6b47)
          ctx.fillStyle = '#5c6b47';
          ctx.fillRect(rx, ry, rectSize, rectSize);

          ctx.strokeStyle = '#3a4a3a';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(rx + 0.25, ry + 0.25, rectSize - 0.5, rectSize - 0.5);

          // Água rasa do pântano (~40% do mapa, matiz azul-turvo #1f2f3a)
          const ehAguaPantanosa =
            (c <= 2 && r <= 2) ||
            (c >= 6 && r <= 2) ||
            (c >= 5 && r >= 3 && r <= 5) ||
            (c <= 2 && r >= 5);
          if (ehAguaPantanosa) {
            ctx.fillStyle = '#1f2f3a';
            ctx.fillRect(rx + 1, ry + 1, rectSize - 2, rectSize - 2);
          }

          // Doca de madeira (col 5, row 4)
          if (c === 5 && r === 4) {
            ctx.fillStyle = '#6d4323';
            ctx.fillRect(rx + 1, ry + 2, 6, 4);
          }
        } else {
          // Vale Verdejante: Retângulo 8x8px cinza-claro se visitada
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(rx, ry, rectSize, rectSize);

          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(rx + 0.25, ry + 0.25, rectSize - 0.5, rectSize - 0.5);

          // Percurso do Rio no Vale (azul sobre a área cinza-clara)
          const ehRio =
            (c === 7 && r <= 2) ||
            (c === 6 && (r >= 1 && r <= 3)) ||
            (c === 5 && (r >= 3 && r <= 7));
          if (ehRio) {
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(rx + 2, ry, 4, rectSize);
          }

          // Ponte de Pedraverde (col 5, row 4)
          if (c === 5 && r === 4) {
            ctx.fillStyle = '#b45309';
            ctx.fillRect(rx + 1, ry + 2, 6, 4);
          }
        }
      } else {
        // Retângulo 8x8px escuro/oculto se não visitada
        ctx.fillStyle = ehCharco ? '#0a100d' : '#0a0f18';
        ctx.fillRect(rx, ry, rectSize, rectSize);

        ctx.strokeStyle = ehCharco ? '#16241b' : '#1e293b';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(rx + 0.25, ry + 0.25, rectSize - 0.5, rectSize - 0.5);
      }
    }
  }

  if (ehCharco) {
    // Ícones diferenciados de Charco Sombrio:
    // Vilarejo Juncoturvo (col 4, row 4)
    const vilX = gridStartX + 4 * (rectSize + rectGap);
    const vilY = gridStartY + 4 * (rectSize + rectGap);
    renderIconeVilarejo(ctx, vilX, vilY);

    // Santuário das Águas Turvas (col 4, row 0)
    const sanX = gridStartX + 4 * (rectSize + rectGap);
    const sanY = gridStartY + 0 * (rectSize + rectGap);
    renderIconeSantuario(ctx, sanX, sanY);

    // Covil Afogado (Catacumba) (col 1, row 2)
    const catX = gridStartX + 1 * (rectSize + rectGap);
    const catY = gridStartY + 2 * (rectSize + rectGap);
    renderIconeCatacumba(ctx, catX, catY);
  } else {
    // Ícones diferenciados do Vale Verdejante:
    // Vilarejo de Pedraverde (col 4, row 6)
    const vilX = gridStartX + 4 * (rectSize + rectGap);
    const vilY = gridStartY + 6 * (rectSize + rectGap);
    renderIconeVilarejo(ctx, vilX, vilY);

    // Entrada do Santuário da Raiz Antiga (col 4, row 0)
    const sanX = gridStartX + 4 * (rectSize + rectGap);
    const sanY = gridStartY + 0 * (rectSize + rectGap);
    renderIconeSantuario(ctx, sanX, sanY);

    // Entrada da Catacumba - Cripta do Guardião (col 1, row 1)
    const catX = gridStartX + 1 * (rectSize + rectGap);
    const catY = gridStartY + 1 * (rectSize + rectGap);
    renderIconeCatacumba(ctx, catX, catY);

    // Forja Ancestral (col 7, row 1)
    const forX = gridStartX + 7 * (rectSize + rectGap);
    const forY = gridStartY + 1 * (rectSize + rectGap);
    renderIconeForja(ctx, forX, forY);
  }

  // Ícone piscante na posição atual do herói Ren
  const heroNormX = Math.min(
    gridStartX + mapGridW - 2,
    Math.max(gridStartX + 2, gridStartX + (state.heroi.x / state.mapaLargura) * mapGridW)
  );
  const heroNormY = Math.min(
    gridStartY + mapGridH - 2,
    Math.max(gridStartY + 2, gridStartY + (state.heroi.y / state.mapaAltura) * mapGridH)
  );

  const piscarHeroi = Math.floor((state.pausaTimer || Date.now() / 250) * 4) % 2 === 0;
  if (piscarHeroi) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(heroNormX, heroNormY - 4);
    ctx.lineTo(heroNormX + 4, heroNormY);
    ctx.lineTo(heroNormX, heroNormY + 4);
    ctx.lineTo(heroNormX - 4, heroNormY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(heroNormX - 1, heroNormY - 1, 2, 2);
  }

  // Painel lateral de legenda cartográfica
  const panelX = winX + 104;
  const panelY = winY + 34;

  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('LEGENDA CARTOGRÁFICA', panelX, panelY + 6);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(panelX, panelY + 14, 6, 6);
  ctx.font = '6px "Courier New", monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Ren (Posição Atual)', panelX + 10, panelY + 19);

  if (ehCharco) {
    renderIconeVilarejo(ctx, panelX, panelY + 24);
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Vilarejo Juncoturvo', panelX + 10, panelY + 29);

    renderIconeSantuario(ctx, panelX, panelY + 34);
    ctx.fillStyle = '#86efac';
    ctx.fillText('Santuário Águas Turvas', panelX + 10, panelY + 39);

    renderIconeCatacumba(ctx, panelX, panelY + 44);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('Covil Afogado', panelX + 10, panelY + 49);

    // Ícone da Doca
    ctx.fillStyle = '#6d4323';
    ctx.fillRect(panelX, panelY + 54, 6, 6);
    ctx.fillStyle = '#fcd34d';
    ctx.fillText('Doca & Barco', panelX + 10, panelY + 59);
  } else {
    renderIconeVilarejo(ctx, panelX, panelY + 24);
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Vilarejo Pedraverde', panelX + 10, panelY + 29);

    renderIconeSantuario(ctx, panelX, panelY + 34);
    ctx.fillStyle = '#86efac';
    ctx.fillText('Santuário Raiz Antiga', panelX + 10, panelY + 39);

    renderIconeCatacumba(ctx, panelX, panelY + 44);
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('Cripta do Guardião', panelX + 10, panelY + 49);

    renderIconeForja(ctx, panelX, panelY + 54);
    ctx.fillStyle = '#fcd34d';
    ctx.fillText('Forja (Fragmento I)', panelX + 10, panelY + 59);
  }

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelX, panelY + 68);
  ctx.lineTo(panelX + 102, panelY + 68);
  ctx.stroke();

  const pctExplorado = Math.round((totalVisitadas / (colCount * rowCount)) * 100);
  ctx.font = 'bold 6px "Courier New", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Explorado: ${totalVisitadas}/72 (${pctExplorado}%)`, panelX, panelY + 76);

  const barW = 100;
  const barH = 3;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(panelX, panelY + 80, barW, barH);
  ctx.fillStyle = '#34d399';
  ctx.fillRect(panelX, panelY + 80, Math.round((totalVisitadas / 72) * barW), barH);

  ctx.font = '7px "Courier New", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Posição: (${Math.round(state.heroi.x)}, ${Math.round(state.heroi.y)}) • Tela [${state.telaAtualX},${state.telaAtualY}]`,
    winX + winW / 2,
    winY + winH - 22
  );
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('[Z] ou [X] Retornar ao Menu', winX + winW / 2, winY + winH - 10);
}

// Subtela de Pausa: Inventário Completo 16-Bit
function renderSubtelaInventario(ctx: CanvasRenderingContext2D, state: GameState) {
  const winW = 224;
  const winH = 172;
  const winX = Math.round((LOGICAL_WIDTH - winW) / 2); // 16
  const winY = Math.round((LOGICAL_HEIGHT - winH) / 2); // 26

  // Moldura 16-bit da janela de inventário
  ctx.fillStyle = '#080d16';
  ctx.fillRect(winX, winY, winW, winH);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);

  // Cantos decorados dourados
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(winX - 1, winY - 1, 3, 3);
  ctx.fillRect(winX + winW - 2, winY - 1, 3, 3);
  ctx.fillRect(winX - 1, winY + winH - 2, 3, 3);
  ctx.fillRect(winX + winW - 2, winY + winH - 2, 3, 3);

  // 1. Cabeçalho
  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('— INVENTÁRIO —', winX + winW / 2, winY + 7);

  // Status de Recursos no topo (Selos e Bombas)
  ctx.font = '7px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(`Selos: ${state.selos} ⬡`, winX + 12, winY + 20);

  // Contador de Bombas à direita
  const bombaBoxX = winX + winW - 74;
  const bombaBoxY = winY + 19;
  renderIconeBomba(ctx, bombaBoxX, bombaBoxY - 1);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`Bombas: ${state.bombas ?? 10}/${state.bombasMax ?? 20}`, bombaBoxX + 12, bombaBoxY + 1);

  // 2. Grade de Itens Secundários Equipáveis (Slot X)
  const itensIds: ItemSecundarioId[] = [
    'gancho_vinha',
    'bumerangue_mares',
    'botas_glaciais',
    'manopla_ignea',
    'talisma_terra',
    'lanterna_sombras',
  ];

  const slotW = 22;
  const slotH = 22;
  const slotGap = 6;
  const totalSlotsW = 6 * slotW + 5 * slotGap; // 162px
  const startX = winX + Math.round((winW - totalSlotsW) / 2); // 31
  const slotY = winY + 33;

  const selIdx = state.pausaInventarioIndex ?? 0;
  const selItem = itensIds[selIdx];

  // Garante registro de itens obtidos
  if (!state.itensSecundariosObtidos) {
    state.itensSecundariosObtidos = {
      gancho_vinha: true,
      bumerangue_mares: false,
      botas_glaciais: false,
      manopla_ignea: false,
      talisma_terra: false,
      lanterna_sombras: false,
    };
  }

  itensIds.forEach((id, idx) => {
    const sx = startX + idx * (slotW + slotGap);
    const isEquipped = state.itemEquipado === id;
    const isSelected = selIdx === idx;
    const isObtained = Boolean(state.itensSecundariosObtidos && state.itensSecundariosObtidos[id]);

    ctx.fillStyle = isSelected ? '#1e293b' : '#0f172a';
    ctx.fillRect(sx, slotY, slotW, slotH);

    // Borda do slot
    if (isSelected) {
      // Cursor dourado com piscar sutil
      const piscarCursor = Math.floor((state.pausaTimer || Date.now() / 250) * 4) % 2 === 0;
      ctx.strokeStyle = piscarCursor ? '#fbbf24' : '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx + 0.5, slotY + 0.5, slotW - 1, slotH - 1);

      // Seta indicadora dourada sobre o slot
      ctx.fillStyle = '#fbbf24';
      ctx.font = '7px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▼', sx + slotW / 2, slotY - 3);
    } else {
      ctx.strokeStyle = isEquipped ? '#38bdf8' : '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, slotY + 0.5, slotW - 1, slotH - 1);
    }

    // Renderiza ícone do item se obtido, ou silhueta se não obtido
    if (isObtained) {
      renderIconeItemSecundario(ctx, id, sx + 3, slotY + 3);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx + 4, slotY + 4, slotW - 8, slotH - 8);
      ctx.font = 'bold 8px "Courier New", monospace';
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.fillText('?', sx + slotW / 2, slotY + slotH / 2 - 4);
    }

    // Tag "X" no canto do slot se o item estiver equipado no slot secundário
    if (isEquipped) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(sx + slotW - 7, slotY, 7, 7);
      ctx.font = 'bold 5px "Courier New", monospace';
      ctx.fillStyle = '#020617';
      ctx.textAlign = 'center';
      ctx.fillText('X', sx + slotW - 3.5, slotY + 5.5);
    }
  });

  // Linha de detalhe do item selecionado pelo cursor
  const infoSel = ITENS_INFO[selItem];
  const isSelEquipped = state.itemEquipado === selItem;
  const isSelObtained = Boolean(state.itensSecundariosObtidos && state.itensSecundariosObtidos[selItem]);

  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  if (isSelObtained) {
    ctx.fillStyle = isSelEquipped ? '#38bdf8' : '#fbbf24';
    ctx.fillText(
      `${infoSel.nome} ${isSelEquipped ? '★ [EQUIPADO NO SLOT X]' : ''}`,
      winX + winW / 2,
      winY + 60
    );
    ctx.font = '6px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    if (selItem === 'gancho_vinha') {
      ctx.fillText('Alcance 64px • Puxa Ren até argolas douradas e aciona alavancas', winX + winW / 2, winY + 69);
    } else {
      ctx.fillText(`Relíquia ancestral • Origem: Santuário de ${infoSel.regiao}`, winX + winW / 2, winY + 69);
    }
  } else {
    ctx.fillStyle = '#64748b';
    ctx.fillText(`??? [Item Não Descoberto - Região: ${infoSel.regiao}]`, winX + winW / 2, winY + 60);
    ctx.font = '6px "Courier New", monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('Explore o santuário da região para recuperar este artefato ancestral.', winX + winW / 2, winY + 69);
  }

  // Linha divisória horizontal
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(winX + 12, winY + 77);
  ctx.lineTo(winX + winW - 12, winY + 77);
  ctx.stroke();

  // 3. Seção: Itens-Chave Obtidos
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('ITENS-CHAVE OBTIDOS', winX + 12, winY + 82);

  // Lista de badges de itens-chave
  const chavesY = winY + 93;
  const badges = [
    { label: 'Lâmina de Eldrim', obtido: true, cor: '#38bdf8' },
    {
      label: `Chave Raizarca`,
      obtido: Boolean(state.dungeonTemChaveChefe),
      cor: '#f59e0b',
    },
    {
      label: `Chaves: ${state.dungeonChavesPequenas ?? 0}`,
      obtido: (state.dungeonChavesPequenas ?? 0) > 0,
      cor: '#a3e635',
    },
    {
      label: 'Coríon Guardião',
      obtido: Boolean(state.criptaUpgradeColetado),
      cor: '#34d399',
    },
  ];

  let curBadgeX = winX + 12;
  badges.forEach((b) => {
    const bw = ctx.measureText(b.label).width + 8;
    ctx.fillStyle = b.obtido ? '#0f172a' : '#070b10';
    ctx.fillRect(curBadgeX, chavesY, bw, 11);

    ctx.strokeStyle = b.obtido ? b.cor : '#334155';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(curBadgeX + 0.5, chavesY + 0.5, bw - 1, 10);

    ctx.font = '6px "Courier New", monospace';
    ctx.fillStyle = b.obtido ? b.cor : '#475569';
    ctx.fillText(b.label, curBadgeX + 4, chavesY + 3);

    curBadgeX += bw + 4;
  });

  // Linha divisória horizontal
  ctx.strokeStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(winX + 12, winY + 110);
  ctx.lineTo(winX + winW - 12, winY + 110);
  ctx.stroke();

  // 4. Seção: 6 Relicários Elementais (Santuários Vencidos)
  // Cada santuário vencido preenche 1 ícone; os demais ficam em silhueta tracejada cinza
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('RELICÁRIOS ELEMENTAIS (06 SANTUÁRIOS)', winX + 12, winY + 114);

  // Status de cada um dos 6 relicários
  const relicariosConfig: {
    tipo: 'raiz' | 'mares' | 'gelo' | 'chamas' | 'terra' | 'sombras';
    nome: string;
    obtido: boolean;
  }[] = [
    {
      tipo: 'raiz',
      nome: 'Raiz',
      obtido: Boolean(
        (state.relicariosObtidos && state.relicariosObtidos.raiz) ||
          (state.chefeRaizarca && state.chefeRaizarca.derrotado)
      ),
    },
    {
      tipo: 'mares',
      nome: 'Marés',
      obtido: Boolean(state.relicariosObtidos && state.relicariosObtidos.mares),
    },
    {
      tipo: 'gelo',
      nome: 'Gelo',
      obtido: Boolean(state.relicariosObtidos && state.relicariosObtidos.gelo),
    },
    {
      tipo: 'chamas',
      nome: 'Chamas',
      obtido: Boolean(state.relicariosObtidos && state.relicariosObtidos.chamas),
    },
    {
      tipo: 'terra',
      nome: 'Pedra',
      obtido: Boolean(state.relicariosObtidos && state.relicariosObtidos.terra),
    },
    {
      tipo: 'sombras',
      nome: 'Sombras',
      obtido: Boolean(state.relicariosObtidos && state.relicariosObtidos.sombras),
    },
  ];

  const relSize = 16;
  const relGap = 16;
  const totalRelW = 6 * relSize + 5 * relGap; // 176px
  const relStartX = winX + Math.round((winW - totalRelW) / 2); // 24
  const relY = winY + 126;

  let totalRelicarios = 0;
  relicariosConfig.forEach((rel, i) => {
    const rx = relStartX + i * (relSize + relGap);
    if (rel.obtido) totalRelicarios++;

    // Renderiza o relicário preenchido ou silhueta tracejada cinza
    renderIconeRelicario(ctx, rel.tipo, rel.obtido, rx, relY, relSize);

    // Nome elemental abaixo do relicário
    ctx.font = '5px "Courier New", monospace';
    ctx.fillStyle = rel.obtido ? '#fef08a' : '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(rel.nome, rx + relSize / 2, relY + relSize + 2);
  });

  // Contador de Relicários no topo direito da seção
  ctx.font = '6px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = totalRelicarios > 0 ? '#34d399' : '#64748b';
  ctx.fillText(`${totalRelicarios} / 6 Restaurados`, winX + winW - 12, winY + 114);

  // 5. Rodapé com Instruções de Navegação e Ação
  ctx.font = '7px "Courier New", monospace';
  ctx.fillStyle = isSelObtained
    ? isSelEquipped
      ? '#f87171'
      : '#4ade80'
    : '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText(
    isSelObtained
      ? isSelEquipped
        ? '[Z] Desequipar do Slot [X]'
        : '[Z] Equipar no Slot [X]'
      : '[Item Ainda Bloqueado]',
    winX + winW / 2,
    winY + winH - 18
  );

  ctx.font = '6px "Courier New", monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('[◀ / ▶] Escolher Item  •  [Z] Equipar  •  [X] Voltar', winX + winW / 2, winY + winH - 8);
}

// Subtela de Pausa: Itens-chave (Placeholder estilizado a ser preenchido no Prompt 12)
function renderSubtelaItensChave(ctx: CanvasRenderingContext2D, _state: GameState) {
  const winW = 216;
  const winH = 156;
  const winX = Math.round((LOGICAL_WIDTH - winW) / 2);
  const winY = Math.round((LOGICAL_HEIGHT - winH) / 2);

  ctx.fillStyle = '#080d16';
  ctx.fillRect(winX, winY, winW, winH);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);

  // Cantos decorados
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(winX - 1, winY - 1, 3, 3);
  ctx.fillRect(winX + winW - 2, winY - 1, 3, 3);
  ctx.fillRect(winX - 1, winY + winH - 2, 3, 3);
  ctx.fillRect(winX + winW - 2, winY + winH - 2, 3, 3);

  // Título
  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('— ITENS-CHAVE & RELÍQUIAS —', winX + winW / 2, winY + 8);

  // 1. Fragmentos de Forja da Lâmina de Eldrim (0 / 3)
  ctx.font = '8px "Courier New", monospace';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('Fragmentos da Forja: 0 / 3', winX + winW / 2, winY + 24);

  // 3 Losangos dourados indicando os 3 fragmentos da forja
  for (let i = 0; i < 3; i++) {
    const fx = winX + winW / 2 - 24 + i * 24;
    const fy = winY + 42;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fx, fy - 6);
    ctx.lineTo(fx + 6, fy);
    ctx.lineTo(fx, fy + 6);
    ctx.lineTo(fx - 6, fy);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.fill();
  }

  // 2. Relicários das 6 Regiões (0 / 6)
  ctx.font = '8px "Courier New", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('Relicários Estacionais: 0 / 6 Restaurados', winX + winW / 2, winY + 62);

  ctx.font = '7px "Courier New", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Raiz Antiga • Águas Turvas • Gelo Eterno', winX + winW / 2, winY + 76);
  ctx.fillText('Chamas • Pedra Viva • Sombras', winX + winW / 2, winY + 88);

  // Lore / instrução
  ctx.fillStyle = '#64748b';
  ctx.fillText('Restaure os 6 Relicários para quebrar a magia de Thorne.', winX + winW / 2, winY + 104);

  // Rodapé
  ctx.font = '7px "Courier New", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('[Gestão de itens-chave no Prompt 12]', winX + winW / 2, winY + winH - 24);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('[Z] ou [X] Retornar ao Menu', winX + winW / 2, winY + winH - 12);
}

// Opções do menu de pausa
const PAUSA_OPCOES = ['Mapa', 'Inventário', 'Itens-chave', 'Voltar'];

// Renderizador do Menu de Pausa (escurece o fundo a 60% e desenha 4 opções ou subtela)
function renderMenuPausa(ctx: CanvasRenderingContext2D, state: GameState) {
  // 1. Escurece o fundo a 60% de opacidade
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  // Se estiver em uma das subtelas (placeholder)
  if (state.pausaSubtela === 'mapa') {
    renderSubtelaMapa(ctx, state);
    return;
  }
  if (state.pausaSubtela === 'inventario') {
    renderSubtelaInventario(ctx, state);
    return;
  }
  if (state.pausaSubtela === 'itens_chave') {
    renderSubtelaItensChave(ctx, state);
    return;
  }

  // 2. Menu principal de pausa: janela 16-bit centralizada
  const winW = 126;
  const winH = 118;
  const winX = Math.round((LOGICAL_WIDTH - winW) / 2); // 65
  const winY = Math.round((LOGICAL_HEIGHT - winH) / 2); // 53

  // Fundo escuro com borda dourada
  ctx.fillStyle = '#0b1320';
  ctx.fillRect(winX, winY, winW, winH);

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(winX + 0.5, winY + 0.5, winW - 1, winH - 1);

  // Cantos decorados 16-bit
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(winX - 1, winY - 1, 3, 3);
  ctx.fillRect(winX + winW - 2, winY - 1, 3, 3);
  ctx.fillRect(winX - 1, winY + winH - 2, 3, 3);
  ctx.fillRect(winX + winW - 2, winY + winH - 2, 3, 3);

  // Título da Janela de Pausa
  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('— PAUSA —', winX + winW / 2, winY + 8);

  // Divisória sutil
  ctx.strokeStyle = '#1e3a5f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(winX + 12, winY + 22);
  ctx.lineTo(winX + winW - 12, winY + 22);
  ctx.stroke();

  // 4 Opções em coluna: Mapa, Inventário, Itens-chave, Voltar
  const startY = winY + 30;
  const lineHeight = 16;

  PAUSA_OPCOES.forEach((opcao, idx) => {
    const isSelected = idx === state.pausaMenuIndex;
    const optY = startY + idx * lineHeight;

    if (isSelected) {
      // Fundo destacado sutil
      ctx.fillStyle = 'rgba(30, 58, 138, 0.45)';
      ctx.fillRect(winX + 8, optY - 2, winW - 16, 14);

      // Cursor piscante
      ctx.font = 'bold 8px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('▶', winX + 12, optY + 1);

      ctx.fillStyle = '#fef08a';
    } else {
      ctx.fillStyle = '#94a3b8';
    }

    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(opcao, winX + 24, optY + 1);
  });

  // Rodapé de instruções
  ctx.font = '7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.fillText('[▲▼] Mover   [Z] Selecionar', winX + winW / 2, winY + winH - 18);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('[ENTER] Retomar Jogo', winX + winW / 2, winY + winH - 9);
}

// Renderizador da tela de GAME OVER
function renderGameOver(ctx: CanvasRenderingContext2D, animTime: number) {
  ctx.fillStyle = '#060a10';
  ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

  const pulse = Math.sin(animTime * 3) * 0.2 + 0.8;

  // Emblema sombrio
  ctx.strokeStyle = `rgba(239, 68, 68, ${pulse.toFixed(2)})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(LOGICAL_WIDTH / 2 - 18, 50, 36, 36);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(LOGICAL_WIDTH / 2, 56);
  ctx.lineTo(LOGICAL_WIDTH / 2 + 12, 68);
  ctx.lineTo(LOGICAL_WIDTH / 2, 80);
  ctx.lineTo(LOGICAL_WIDTH / 2 - 12, 68);
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f87171';
  ctx.fillText('FRAGILIDADE DO DESTINO', LOGICAL_WIDTH / 2, 106);

  ctx.font = '7px "Courier New", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Os Fragmentos de Vida de Ren se dissiparam.', LOGICAL_WIDTH / 2, 122);
  ctx.fillText('O eco dos Santuários ainda clama por um herói...', LOGICAL_WIDTH / 2, 134);

  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('[Z] ou [ENTER] Despertar Novamente', LOGICAL_WIDTH / 2, 168);
}

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Escala inteira calculada para a tela
  const [scale, setScale] = useState<number>(2);

  // Mapa de teclas pressionadas (usando event.code)
  const keysRef = useRef<Record<string, boolean>>({});

  // Instância do Motor de Dungeon persistida em useRef
  const dungeonRef = useRef<Dungeon>(criarDungeonTesteSantuario());

  // Instância do Santuário das Águas Turvas (Charco Sombrio)
  const dungeonAguasRef = useRef<Dungeon>(criarDungeonAguasTurvas());

  // Instância da Cripta do Guardião Adormecido (Dungeon Opcional do Vale Verdejante)
  const criptaRef = useRef<CriptaState>(criarCriptaGuardiao());

  // Instância da Catacumba Covil Afogado (Dungeon Opcional do Charco Sombrio)
  const covilAfogadoRef = useRef<CovilAfogadoState>(criarCovilAfogado());

  // Instância da Catacumba Caverna de Cristal (Dungeon Opcional de Terras Geladas)
  const cavernaCristalRef = useRef<CavernaCristalState>(criarCavernaCristalInicial());

  // GameState em useRef — nunca no useState para evitar re-render a cada frame
  const gameStateRef = useRef<GameState>({
    estadoAtual: EstadoJogo.SPLASH,
    estadoAnterior: EstadoJogo.OVERWORLD,
    splashTimer: 0,
    tituloTimer: 0,
    tituloSubmenuAberto: false,
    tituloMenuIndex: 0,
    tituloTelaOpcoes: false,
    opcaoSelecionada: 0,
    volume: 80,
    arvoresOffset: 0,
    cinematicaTimer: 0,
    cinematicaQuadro: 0,
    cinematicaQuadroTimer: 0,
    temSave: Boolean(typeof window !== 'undefined' && localStorage.getItem('eldrim_save')),
    heroi: {
      x: 376, // Posição inicial no caminho central sul do Vale Verdejante (Tela [1, 2])
      y: 540,
      w: 16,
      h: 16,
      direcao: 'cima',
      velocidade: HERO_BASE_SPEED,
      atacando: false,
      ataqueTimer: 0,
      ataqueHitbox: null,
      iframes: 0,
      knockbackTimer: 0,
      knockbackVx: 0,
      knockbackVy: 0,
      carregandoGolpe: false,
      cargaGolpeTimer: 0,
      golpePronto: false,
      ataqueCarregado: false,
    },
    camera: {
      x: 376 + 8 - LOGICAL_WIDTH / 2,
      y: 540 + 8 - LOGICAL_HEIGHT / 2,
    },
    mapaLargura: MAP_WIDTH,
    mapaAltura: MAP_HEIGHT,
    obstaculos: getValeObstaculos(false),

    // Overworld & Navegação 3x3 (Vale Verdejante: 768x672px e Charco Sombrio: 768x672px)
    regiaoAtual: 'vale',
    charcoFogOffset: 0,
    dialogoAtivo: null,
    lojaAtiva: null,
    areasVisitadasVale: criarAreasVisitadasValeIniciais(),
    areasVisitadasCharco: criarAreasVisitadasCharcoIniciais(),
    areasVisitadasGeladas: criarAreasVisitadasGeladasIniciais(),
    telaAtualX: 1, // Começa na tela central sul (1, 2)
    telaAtualY: 2,
    transicaoFadeTimer: 0,
    coletavelVidaColetado: false,

    // Cripta do Guardião Adormecido (Dungeon Secreta Opcional do Vale)
    arvoreCriptaDestruida: false,
    criptaUpgradeColetado: false,
    dungeonTipoAtivo: 'santuario',
    blocoEmpurrandoTimer: 0,

    // Dados do HUD & Combate/Magia
    vidaAtual: 3,
    vidaMax: 3,
    arcanoAtual: 20,
    arcanoMax: 20,
    itemEquipado: null,
    selos: 0,
    bombas: 5,
    bombasMax: 10,
    itensSecundariosObtidos: {
      gancho_vinha: false,
      bumerangue_mares: false,
      botas_gelo: false,
      manopla_ignea: false,
      talisma_terra: false,
      lanterna_sombras: false,
    },
    relicariosObtidos: {
      raiz: false,
      mares: false,
      gelo: false,
      chamas: false,
      terra: false,
      sombras: false,
    },

    // Motor de Dungeon (Santuários)
    dungeonSalaAtualId: 'sala_1_2_atrio',
    dungeonChavesPequenas: 0,
    dungeonTemChaveChefe: false,
    dungeonTransicaoTimer: 0,
    dungeonItemObtido: undefined,
    salasVisitadasDungeon: { sala_1_2_atrio: true },
    salasVisitadasCripta: {},
    salasVisitadasAguasTurvas: { aguas_entrada: true },
    salasVisitadasCovilAfogado: { covil_entrada: true },
    alavancaCharcoPonteAtivada: false,
    covilAfogadoUpgradeColetado: false,
    plataformasDungeon: criarPlataformasIniciaisDungeon(),

    // Combate, Inimigos e Chefe Raizarca
    inimigosVale: criarInimigosValeIniciais(),
    particulas: [],
    projeteis: [],
    projeteisAgua: [],
    chefeRaizarca: criarChefeRaizarcaInicial(),
    chefeMarejante: criarChefeMarejanteInicial(),

    // Estado do Menu de Pausa
    pausaMenuIndex: 0,
    pausaSubtela: 'menu',
    pausaInventarioIndex: 0,
    pausaTimer: 0,

    // Gancho de Vinha, Bumerangue das Marés & Ilha Secreta
    ganchoAnim: criarGanchoAnimInicial(),
    bumerangueAnim: criarBumerangueAnimInicial(),
    bauIlhaBosqueAberto: false,
  });

  // Cálculo da escala inteira (integer scaling) responsiva
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 16;
      const availableW = Math.max(LOGICAL_WIDTH, rect.width - padding * 2);
      const availableH = Math.max(LOGICAL_HEIGHT, rect.height - padding * 2);

      const maxScaleW = Math.floor(availableW / LOGICAL_WIDTH);
      const maxScaleH = Math.floor(availableH / LOGICAL_HEIGHT);
      const calculatedScale = Math.max(1, Math.min(maxScaleW, maxScaleH));

      setScale(calculatedScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Processador central de input para máquina de estados
  const handleGameInput = (code: string, isDown: boolean) => {
    const state = gameStateRef.current;

    if (isDown) {
      // 1. ESTADO SPLASH: qualquer tecla pula direto para TITULO
      if (state.estadoAtual === EstadoJogo.SPLASH) {
        state.estadoAtual = EstadoJogo.TITULO;
        state.splashTimer = 0;
        state.tituloTimer = 0;
        state.tituloSubmenuAberto = false;
        state.tituloTelaOpcoes = false;
        return;
      }

      // 2. ESTADO TITULO:
      if (state.estadoAtual === EstadoJogo.TITULO) {
        // TELA DE OPÇÕES ABERTA
        if (state.tituloTelaOpcoes) {
          if (code === 'ArrowUp' || code === 'KeyW') {
            state.opcaoSelecionada = (state.opcaoSelecionada + 3 - 1) % 3;
            return;
          }
          if (code === 'ArrowDown' || code === 'KeyS') {
            state.opcaoSelecionada = (state.opcaoSelecionada + 1) % 3;
            return;
          }
          if (code === 'ArrowLeft' || code === 'KeyA') {
            if (state.opcaoSelecionada === 0) {
              state.volume = Math.max(0, state.volume - 10);
            }
            return;
          }
          if (code === 'ArrowRight' || code === 'KeyD') {
            if (state.opcaoSelecionada === 0) {
              state.volume = Math.min(100, state.volume + 10);
            }
            return;
          }
          if (code === 'KeyZ' || code === 'Enter') {
            if (state.opcaoSelecionada === 2) {
              state.tituloTelaOpcoes = false;
            }
            return;
          }
          if (code === 'KeyX' || code === 'Escape') {
            state.tituloTelaOpcoes = false;
            return;
          }
          return;
        }

        // SUBMENU PRINCIPAL ABERTO (Novo Jogo / Continuar / Opções)
        if (state.tituloSubmenuAberto) {
          if (code === 'ArrowUp' || code === 'KeyW') {
            state.tituloMenuIndex = (state.tituloMenuIndex + 3 - 1) % 3;
            return;
          }
          if (code === 'ArrowDown' || code === 'KeyS') {
            state.tituloMenuIndex = (state.tituloMenuIndex + 1) % 3;
            return;
          }
          if (code === 'KeyZ' || code === 'Enter') {
            if (state.tituloMenuIndex === 0) {
              // "Novo Jogo" -> CINEMATICA (começa do quadro 0)
              state.estadoAtual = EstadoJogo.CINEMATICA;
              state.cinematicaTimer = 0;
              state.cinematicaQuadro = 0;
              state.cinematicaQuadroTimer = 0;
            } else if (state.tituloMenuIndex === 1) {
              // "Continuar" (desabilitado se não houver save)
              if (state.temSave) {
                state.estadoAtual = EstadoJogo.OVERWORLD;
              }
            } else if (state.tituloMenuIndex === 2) {
              // "Opções" -> tela simples de opções
              state.tituloTelaOpcoes = true;
              state.opcaoSelecionada = 0;
            }
            return;
          }
          if (code === 'KeyX' || code === 'Escape') {
            // Fecha submenu e retorna para o "Aperte START"
            state.tituloSubmenuAberto = false;
            return;
          }
          return;
        }

        // TELA DE TÍTULO COM "Aperte START" PISCANTE
        if (['KeyZ', 'Enter', 'Space', 'ArrowUp', 'ArrowDown'].includes(code)) {
          // Z ou Enter abre submenu com opções
          state.tituloSubmenuAberto = true;
          state.tituloMenuIndex = 0;
          return;
        }
        return;
      }

      // 3. ESTADO CINEMATICA: Z avança quadro (ou completa texto); Enter pula tudo para o OVERWORLD
      if (state.estadoAtual === EstadoJogo.CINEMATICA) {
        if (code === 'Enter') {
          irParaOverworldEntradaVale(state);
          return;
        }
        if (code === 'KeyZ' || code === 'Space') {
          avancarCinematica(state);
          return;
        }
        return;
      }

      // Interceptação de Diálogo Ativo (Escriba Ivo em Juncoturvo)
      if (state.dialogoAtivo && state.dialogoAtivo.ativo) {
        const dlg = state.dialogoAtivo;
        if (code === 'KeyZ' || code === 'Space' || code === 'Enter') {
          const textoAtual = dlg.falas[dlg.falaAtualIndex] || '';
          if (!dlg.falaConcluida) {
            // Pula efeito de digitação
            dlg.caracteresVisiveis = textoAtual.length;
            dlg.falaConcluida = true;
          } else {
            // Avança para a próxima fala ou conclui o diálogo
            if (dlg.falaAtualIndex < dlg.falas.length - 1) {
              dlg.falaAtualIndex++;
              dlg.caracteresVisiveis = 0;
              dlg.timerTypewriter = 0;
              dlg.falaConcluida = false;
              soundManager.playMenuMove();
            } else {
              state.dialogoAtivo = null;
              soundManager.playMenuSelect();
            }
          }
        } else if (code === 'KeyX' || code === 'Escape') {
          state.dialogoAtivo = null;
          soundManager.playMenuSelect();
        }
        return;
      }

      // Interceptação de Loja Ativa (Empório de Juncoturvo)
      if (state.lojaAtiva && state.lojaAtiva.ativa) {
        const loja = state.lojaAtiva;
        if (code === 'ArrowUp' || code === 'KeyW') {
          loja.itemSelecionadoIndex = (loja.itemSelecionadoIndex + 3 - 1) % 3;
          soundManager.playMenuMove();
          return;
        }
        if (code === 'ArrowDown' || code === 'KeyS') {
          loja.itemSelecionadoIndex = (loja.itemSelecionadoIndex + 1) % 3;
          soundManager.playMenuMove();
          return;
        }
        if (code === 'KeyZ' || code === 'Space' || code === 'Enter') {
          if (loja.itemSelecionadoIndex === 0) {
            // Frasco de Seiva (20 Selos)
            if (state.selos >= 20) {
              state.selos -= 20;
              state.vidaAtual = Math.min(state.vidaMax, state.vidaAtual + 3);
              loja.mensagemFeedback = 'Frasco adquirido! Vida restaurada.';
              loja.mensagemFeedbackTimer = 2.0;
              soundManager.playShopBuy();
            } else {
              loja.mensagemFeedback = 'Selos insuficientes! (Custa 20 Selos)';
              loja.mensagemFeedbackTimer = 1.6;
              soundManager.playShopError();
            }
          } else if (loja.itemSelecionadoIndex === 1) {
            // Pacote de Bombas (30 Selos)
            if (state.selos >= 30) {
              state.selos -= 30;
              loja.mensagemFeedback = 'Pacote de 5 Bombas adquirido!';
              loja.mensagemFeedbackTimer = 2.0;
              soundManager.playShopBuy();
            } else {
              loja.mensagemFeedback = 'Selos insuficientes! (Custa 30 Selos)';
              loja.mensagemFeedbackTimer = 1.6;
              soundManager.playShopError();
            }
          } else {
            // Opção 3: Sair da Loja
            state.lojaAtiva = null;
            soundManager.playMenuSelect();
          }
          return;
        }
        if (code === 'KeyX' || code === 'Escape') {
          state.lojaAtiva = null;
          soundManager.playMenuSelect();
          return;
        }
        return;
      }

      // 4. ESTADO OVERWORLD & DUNGEON: Enter abre pausa, Z desfere espada ou interage, X usa item secundário (Gancho de Vinha)
      if (
        state.estadoAtual === EstadoJogo.OVERWORLD ||
        state.estadoAtual === EstadoJogo.DUNGEON
      ) {
        if (code === 'Enter') {
          state.estadoAnterior = state.estadoAtual;
          state.estadoAtual = EstadoJogo.PAUSA;
          state.pausaMenuIndex = 0;
          state.pausaSubtela = 'menu';
          return;
        }

        // Uso do Item Secundário no slot [X] (Gancho de Vinha / Bumerangue das Marés)
        if (code === 'KeyX') {
          if (state.itemEquipado === 'gancho_vinha') {
            const dung = state.dungeonTipoAtivo === 'aguas_turvas' ? dungeonAguasRef.current : dungeonRef.current;
            dispararGanchoDeVinha(state, dung);
            return;
          } else if (state.itemEquipado === 'bumerangue_mares') {
            dispararBumerangue(state);
            return;
          } else if (state.itemEquipado === 'botas_glaciais') {
            dispararBotasPassoGlacial(state);
            return;
          } else {
            // Nenhum item ou outro item secundário
            soundManager.playHookError();
            return;
          }
        }

        // Ação / Ataque da Lâmina de Eldrim com Z ou Espaço:
        if (code === 'KeyZ' || code === 'Space') {
          // Checagem de interações com NPCs em Charco Sombrio (Escriba Ivo e Loja)
          if (state.estadoAtual === EstadoJogo.OVERWORLD && state.regiaoAtual === 'charco') {
            const distIvoX = Math.abs((state.heroi.x + 8) - (NPC_ESCRIBA_IVO.x + 7));
            const distIvoY = Math.abs((state.heroi.y + 8) - (NPC_ESCRIBA_IVO.y + 8));
            if (distIvoX <= 28 && distIvoY <= 28) {
              state.dialogoAtivo = {
                ativo: true,
                npcNome: NPC_ESCRIBA_IVO.nome,
                npcCargo: NPC_ESCRIBA_IVO.cargo,
                falas: NPC_ESCRIBA_IVO.falas,
                falaAtualIndex: 0,
                caracteresVisiveis: 0,
                timerTypewriter: 0,
                falaConcluida: false,
              };
              soundManager.playMenuSelect();
              return;
            }

            const heroHit: Retangulo = {
              x: state.heroi.x - 6,
              y: state.heroi.y - 6,
              w: state.heroi.w + 12,
              h: state.heroi.h + 12,
            };
            if (checkAABB(heroHit, LOJA_JUNCO_HITBOX)) {
              state.lojaAtiva = {
                ativa: true,
                nomeLoja: 'Empório de Juncoturvo',
                itemSelecionadoIndex: 0,
                itens: LOJA_JUNCO_ITENS,
              };
              soundManager.playMenuSelect();
              return;
            }
          }

          // Checagem de interações com NPCs em Terras Geladas (Guarda Kell e Loja de Gélida)
          if (state.estadoAtual === EstadoJogo.OVERWORLD && state.regiaoAtual === 'geladas') {
            // 1. Guarda Kell (350, 324)
            const distKellX = Math.abs((state.heroi.x + 8) - 358);
            const distKellY = Math.abs((state.heroi.y + 8) - 332);
            if (distKellX <= 28 && distKellY <= 28) {
              const status = state.questLanternaStatus || 'nao_iniciada';

              if (status === 'nao_iniciada') {
                state.questLanternaStatus = 'em_andamento';
                state.dialogoAtivo = {
                  ativo: true,
                  npcNome: 'Guarda Kell',
                  npcCargo: 'Sentinela de Gélida',
                  falas: [
                    'O vento das Terras Geladas congela as mãos de qualquer um...',
                    'Perdi minha valiosa Lanterna na neve profunda a sudoeste daqui.',
                    'Se você a encontrar na neve e me trouxer de volta, darei 20 Selos!',
                  ],
                  falaAtualIndex: 0,
                  caracteresVisiveis: 0,
                  timerTypewriter: 0,
                  falaConcluida: false,
                };
              } else if (status === 'em_andamento') {
                if (state.lanternaPerdidaColetada) {
                  state.questLanternaStatus = 'concluida';
                  state.selos += 20;
                  state.notificacaoTexto = '+20 SELOS! RECOMPENSA DE GUARDA KELL!';
                  state.notificacaoTimer = 3.0;
                  soundManager.playChestOpen();
                  state.dialogoAtivo = {
                    ativo: true,
                    npcNome: 'Guarda Kell',
                    npcCargo: 'Sentinela de Gélida',
                    falas: [
                      'Minha Lanterna! Você a encontrou no meio da nevasca!',
                      'Muito obrigado, Ren! Tome estes 20 Selos por sua coragem.',
                      'Que a chama desta lanterna proteja seus passos!',
                    ],
                    falaAtualIndex: 0,
                    caracteresVisiveis: 0,
                    timerTypewriter: 0,
                    falaConcluida: false,
                  };
                } else {
                  state.dialogoAtivo = {
                    ativo: true,
                    npcNome: 'Guarda Kell',
                    npcCargo: 'Sentinela de Gélida',
                    falas: [
                      'Ainda não encontrou a Lanterna?',
                      'Ela caiu nas dunas de neve profunda lá no canto sudoeste.',
                    ],
                    falaAtualIndex: 0,
                    caracteresVisiveis: 0,
                    timerTypewriter: 0,
                    falaConcluida: false,
                  };
                }
              } else {
                state.dialogoAtivo = {
                  ativo: true,
                  npcNome: 'Guarda Kell',
                  npcCargo: 'Sentinela de Gélida',
                  falas: [
                    'Obrigado novamente por recuperar minha lanterna, Ren!',
                    'Mantenha-se aquecido perto da fogueira do vilarejo.',
                  ],
                  falaAtualIndex: 0,
                  caracteresVisiveis: 0,
                  timerTypewriter: 0,
                  falaConcluida: false,
                };
              }
              soundManager.playMenuSelect();
              return;
            }

            // 2. Loja de Provisões do Mercador Varek (480, 260)
            const heroHit: Retangulo = {
              x: state.heroi.x - 6,
              y: state.heroi.y - 6,
              w: state.heroi.w + 12,
              h: state.heroi.h + 12,
            };
            const lojaVarekHitbox: Retangulo = { x: 480, y: 260, w: 50, h: 44 };
            if (checkAABB(heroHit, lojaVarekHitbox)) {
              state.lojaAtiva = {
                ativa: true,
                nomeLoja: 'Provisões de Gélida',
                itemSelecionadoIndex: 0,
                itens: [
                  {
                    id: 'cura_gelida',
                    nome: 'Frasco de Seiva',
                    descricao: 'Restaura +1 Fragmento de Vida',
                    preco: 15,
                    icone: 'cura',
                  },
                  {
                    id: 'bomba_gelida',
                    nome: 'Pacote de Bombas',
                    descricao: 'Aumenta +5 bombas',
                    preco: 20,
                    icone: 'bomba',
                  },
                ],
              };
              soundManager.playMenuSelect();
              return;
            }
          }

          if (!state.heroi.atacando && !state.heroi.carregandoGolpe) {
            // Enquanto o bumerangue está no ar, o herói não pode atacar com a espada
            if (state.bumerangueAnim && state.bumerangueAnim.ativo) {
              return;
            }
            state.heroi.carregandoGolpe = true;
            state.heroi.cargaGolpeTimer = 0;
            state.heroi.golpePronto = false;
          }
          return;
        }
      }

      // ESTADO GAMEOVER: Z ou Enter ressuscita Ren com vida cheia
      if (state.estadoAtual === EstadoJogo.GAMEOVER) {
        if (code === 'KeyZ' || code === 'Enter' || code === 'Space') {
          state.vidaAtual = state.vidaMax;
          state.arcanoAtual = state.arcanoMax;
          state.heroi.iframes = 1.0;
          state.heroi.knockbackTimer = 0;
          state.heroi.atacando = false;
          state.heroi.ataqueTimer = 0;
          state.heroi.ataqueHitbox = null;
          if (state.estadoAnterior === EstadoJogo.DUNGEON) {
            state.estadoAtual = EstadoJogo.DUNGEON;
            state.dungeonSalaAtualId = 'sala_1_2_atrio';
            state.heroi.x = 120;
            state.heroi.y = 180;
            state.heroi.direcao = 'cima';
          } else {
            state.estadoAtual = EstadoJogo.OVERWORLD;
            state.heroi.x = 376;
            state.heroi.y = 540;
            state.heroi.direcao = 'cima';
            state.telaAtualX = 1;
            state.telaAtualY = 2;
          }
          return;
        }
        return;
      }

      // 5. ESTADO PAUSA: Enter fecha, setas navegam, Z confirma, X volta
      if (state.estadoAtual === EstadoJogo.PAUSA) {
        // Enter sempre fecha a pausa diretamente e retorna ao jogo
        if (code === 'Enter') {
          state.estadoAtual = state.estadoAnterior || EstadoJogo.OVERWORLD;
          state.pausaSubtela = 'menu';
          return;
        }

        // Se estiver em uma subtela (Mapa, Inventário, Itens-chave):
        if (state.pausaSubtela !== 'menu') {
          if (state.pausaSubtela === 'inventario') {
            const itensIds: ItemSecundarioId[] = [
              'gancho_vinha',
              'bumerangue_mares',
              'botas_glaciais',
              'manopla_ignea',
              'talisma_terra',
              'lanterna_sombras',
            ];
            if (code === 'ArrowLeft' || code === 'KeyA') {
              state.pausaInventarioIndex = (state.pausaInventarioIndex + 5) % 6;
              soundManager.playMenuMove();
              return;
            }
            if (code === 'ArrowRight' || code === 'KeyD') {
              state.pausaInventarioIndex = (state.pausaInventarioIndex + 1) % 6;
              soundManager.playMenuMove();
              return;
            }
            if (code === 'KeyZ' || code === 'Space') {
              const selItem = itensIds[state.pausaInventarioIndex];
              if (state.itemEquipado === selItem) {
                state.itemEquipado = null; // desequipar
              } else {
                state.itemEquipado = selItem; // equipar no slot secundário [X]
              }
              soundManager.playMenuSelect();
              return;
            }
          }

          if (
            code === 'KeyX' ||
            code === 'Escape' ||
            (state.pausaSubtela !== 'inventario' && (code === 'KeyZ' || code === 'Space'))
          ) {
            state.pausaSubtela = 'menu';
            return;
          }
          return;
        }

        // Navegação nas 4 opções do menu principal de pausa:
        if (code === 'ArrowUp' || code === 'KeyW') {
          state.pausaMenuIndex = (state.pausaMenuIndex + 4 - 1) % 4;
          return;
        }
        if (code === 'ArrowDown' || code === 'KeyS') {
          state.pausaMenuIndex = (state.pausaMenuIndex + 1) % 4;
          return;
        }
        if (code === 'KeyZ' || code === 'Space') {
          if (state.pausaMenuIndex === 0) {
            state.pausaSubtela = 'mapa';
          } else if (state.pausaMenuIndex === 1) {
            state.pausaSubtela = 'inventario';
          } else if (state.pausaMenuIndex === 2) {
            state.pausaSubtela = 'itens_chave';
          } else if (state.pausaMenuIndex === 3) {
            // "Voltar" -> fecha a pausa e retorna ao jogo
            state.estadoAtual = state.estadoAnterior || EstadoJogo.OVERWORLD;
            state.pausaSubtela = 'menu';
          }
          return;
        }
        if (code === 'KeyX' || code === 'Escape') {
          state.estadoAtual = state.estadoAnterior || EstadoJogo.OVERWORLD;
          state.pausaSubtela = 'menu';
          return;
        }
        return;
      }
    }

    if (!isDown) {
      if (code === 'KeyZ' || code === 'Space') {
        if (state.dialogoAtivo?.ativo || state.lojaAtiva?.ativa) {
          state.heroi.carregandoGolpe = false;
          state.heroi.cargaGolpeTimer = 0;
          state.heroi.golpePronto = false;
          return;
        }

        if (
          state.estadoAtual === EstadoJogo.OVERWORLD ||
          state.estadoAtual === EstadoJogo.DUNGEON
        ) {
          if (state.heroi.carregandoGolpe) {
            // Se o bumerangue estiver no ar, cancela o golpe de espada
            if (state.bumerangueAnim && state.bumerangueAnim.ativo) {
              state.heroi.carregandoGolpe = false;
              state.heroi.cargaGolpeTimer = 0;
              state.heroi.golpePronto = false;
              return;
            }

            const golpeCarregado = state.heroi.golpePronto;

            if (golpeCarregado) {
              // 1. Dispara o Golpe Carregado (dano dobrado 2, knockback 28, brilho especial)
              dispararGolpeEspada(state.heroi, true);

              // 2. Destruição de obstáculos especiais (Árvore Ancestral da Cripta no Vale [0,0])
              if (
                state.estadoAtual === EstadoJogo.OVERWORLD &&
                !state.arvoreCriptaDestruida &&
                state.telaAtualX === 0 &&
                state.telaAtualY === 0
              ) {
                const arvoreCaixa: Retangulo = {
                  x: ARVORE_CRIPTA.x + 6,
                  y: ARVORE_CRIPTA.y + 12,
                  w: 20,
                  h: 20,
                };
                if (state.heroi.ataqueHitbox && checkAABB(state.heroi.ataqueHitbox, arvoreCaixa)) {
                  state.arvoreCriptaDestruida = true;
                  state.obstaculos = getValeObstaculos(true);
                  soundManager.playObstacleBreak();
                  gerarExplosaoParticulas(state.particulas, ARVORE_CRIPTA.x + 16, ARVORE_CRIPTA.y + 16, '#8b5a2b', 14);
                  gerarExplosaoParticulas(state.particulas, ARVORE_CRIPTA.x + 16, ARVORE_CRIPTA.y + 16, '#10b981', 10);
                  gerarExplosaoParticulas(state.particulas, ARVORE_CRIPTA.x + 16, ARVORE_CRIPTA.y + 16, '#38bdf8', 8);
                  state.notificacaoTexto = 'ÁRVORE ANCESTRAL DESTRUÍDA! CRIPTA REVELADA';
                  state.notificacaoTimer = 3.0;
                }
              }
            } else {
              // Soltou antes de 1.0s: tenta primeiro interações de contexto
              let interagiu = false;

              // Baú da ilha do bosque
              if (state.estadoAtual === EstadoJogo.OVERWORLD && !state.bauIlhaBosqueAberto) {
                const dx = Math.abs(state.heroi.x + 8 - (BAU_ILHA_BOSQUE.x + 8));
                const dy = Math.abs(state.heroi.y + 8 - (BAU_ILHA_BOSQUE.y + 8));
                if (dx <= 22 && dy <= 22) {
                  state.bauIlhaBosqueAberto = true;
                  state.selos += BAU_ILHA_BOSQUE.selos;
                  soundManager.playChestOpen();
                  interagiu = true;
                }
              }

              // Interações na Dungeon (Cripta, Santuário da Raiz, Santuário das Águas ou Covil Afogado)
              if (!interagiu && state.estadoAtual === EstadoJogo.DUNGEON) {
                if (state.dungeonTipoAtivo === 'cripta') {
                  interagiu = interagirAcaoCripta(criptaRef.current, state);
                } else if (state.dungeonTipoAtivo === 'aguas_turvas') {
                  interagiu = interagirAcaoDungeon(dungeonAguasRef.current, state);
                } else if (state.dungeonTipoAtivo === 'covil_afogado') {
                  interagiu = interagirAcaoCovilAfogado(covilAfogadoRef.current, state);
                } else {
                  interagiu = interagirAcaoDungeon(dungeonRef.current, state);
                }
              }

              // Se não interagiu, desfere o golpe normal de espada
              if (!interagiu) {
                dispararGolpeEspada(state.heroi, false);

                // Dano de espada no Chefe Marejante se estiver emerso e na sala do chefe
                if (
                  state.estadoAtual === EstadoJogo.DUNGEON &&
                  state.dungeonTipoAtivo === 'aguas_turvas' &&
                  state.dungeonSalaAtualId === 'aguas_chefe_marejante'
                ) {
                  aplicarDanoChefeMarejante(state);
                }

                // Feedback tátil se acertar a árvore ancestral com golpe comum
                if (
                  state.estadoAtual === EstadoJogo.OVERWORLD &&
                  !state.arvoreCriptaDestruida &&
                  state.telaAtualX === 0 &&
                  state.telaAtualY === 0
                ) {
                  const arvoreCaixa: Retangulo = {
                    x: ARVORE_CRIPTA.x + 6,
                    y: ARVORE_CRIPTA.y + 12,
                    w: 20,
                    h: 20,
                  };
                  if (state.heroi.ataqueHitbox && checkAABB(state.heroi.ataqueHitbox, arvoreCaixa)) {
                    soundManager.playClank();
                    state.notificacaoTexto = 'A casca resiste... Segure [Z] por 1s para carregar!';
                    state.notificacaoTimer = 2.0;
                  }
                }
              }
            }

            // Reseta flags de carregamento
            state.heroi.carregandoGolpe = false;
            state.heroi.cargaGolpeTimer = 0;
            state.heroi.golpePronto = false;
          }
        }
      }
    }

    // Atualiza estado de tecla contínua (usado na física do OVERWORLD)
    keysRef.current[code] = isDown;
  };

  // Listeners de Input no window usando event.code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevenir rolagem da página ao interagir com o jogo
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Space',
          'Enter',
        ].includes(e.code)
      ) {
        e.preventDefault();
      }

      handleGameInput(e.code, true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      handleGameInput(e.code, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop principal em um único useEffect via requestAnimationFrame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    let animationFrameId: number;
    let lastTime: number | null = null;

    const gameLoop = (currentTime: number) => {
      if (lastTime === null) {
        lastTime = currentTime;
      }

      // DeltaTime em segundos, clampado a 0.1s máximo
      const rawDt = (currentTime - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.1);
      lastTime = currentTime;

      const state = gameStateRef.current;
      const keys = keysRef.current;
      const heroi = state.heroi;

      // ==========================================
      // ESTADO: SPLASH
      // ==========================================
      if (state.estadoAtual === EstadoJogo.SPLASH) {
        state.splashTimer += dt;
        // Ao fim de 2.5s avança automaticamente para TITULO
        if (state.splashTimer >= 2.5) {
          state.estadoAtual = EstadoJogo.TITULO;
          state.splashTimer = 0;
          state.tituloTimer = 0;
          state.tituloSubmenuAberto = false;
          state.tituloTelaOpcoes = false;
        }

        renderSplash(ctx, state.splashTimer);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // ==========================================
      // ESTADO: TITULO
      // ==========================================
      if (state.estadoAtual === EstadoJogo.TITULO) {
        state.tituloTimer += dt;
        // Silhuetas de árvores movem-se a 5px/s para a esquerda em loop contínuo
        state.arvoresOffset = (state.arvoresOffset + 5 * dt) % 256;

        renderTitulo(ctx, state);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // ==========================================
      // ESTADO: CINEMATICA
      // ==========================================
      if (state.estadoAtual === EstadoJogo.CINEMATICA) {
        state.cinematicaTimer += dt;
        state.cinematicaQuadroTimer += dt;
        renderCinematica(ctx, state);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // ==========================================
      // ESTADO: OVERWORLD (Vale Verdejante 768x672)
      // ==========================================
      if (state.estadoAtual === EstadoJogo.OVERWORLD) {
        // Incremento do tempo de carga da Lâmina de Eldrim ao segurar Z (1.0s para carregar)
        if (heroi.carregandoGolpe && (keys['KeyZ'] || keys['Space'])) {
          heroi.cargaGolpeTimer = (heroi.cargaGolpeTimer || 0) + dt;
          if (heroi.cargaGolpeTimer >= 1.0 && !heroi.golpePronto) {
            heroi.golpePronto = true;
            soundManager.playChargeReady();
          }
        }

        // Barra de "Fluxo Arcano": enche a 5%/s até o máximo atual (20 no início)
        const regenArcanoPorSegundo = state.arcanoMax * 0.05;
        state.arcanoAtual = Math.min(
          state.arcanoMax,
          state.arcanoAtual + regenArcanoPorSegundo * dt
        );

        // Atualização da física e animação do Gancho de Vinha e Botas de Passo Glacial
        atualizarGancho(state, dt);
        atualizarBotasEEfeitoAgua(state, dt);
        const puxandoGancho =
          state.ganchoAnim &&
          state.ganchoAnim.ativo &&
          state.ganchoAnim.fase === 'puxando';

        // Velocidade adaptativa: em água rasa no Charco Sombrio reduz para 50px/s (HERO_SWAMP_SPEED)
        // Se estiver sobre gelo congelado pelas Botas de Passo Glacial, mantém velocidade firme!
        const sobreGeloCongelado = Boolean(
          state.aguaCongeladaTiles?.some(
            (t) =>
              t.timer > 0 &&
              heroi.x + 8 >= t.x &&
              heroi.x + 8 <= t.x + t.w &&
              heroi.y + 14 >= t.y &&
              heroi.y + 14 <= t.y + t.h
          )
        );
        if (state.regiaoAtual === 'charco' && isHeroiNaAguaRasa(heroi.x, heroi.y) && !sobreGeloCongelado) {
          heroi.velocidade = HERO_SWAMP_SPEED;
        } else {
          heroi.velocidade = HERO_BASE_SPEED;
        }

        // Animação contínua da névoa do Charco Sombrio
        state.charcoFogOffset = (state.charcoFogOffset || 0) + 10 * dt;

        // Atualização de Typewriter de Diálogo
        if (state.dialogoAtivo && state.dialogoAtivo.ativo) {
          const dlg = state.dialogoAtivo;
          if (!dlg.falaConcluida) {
            dlg.timerTypewriter += dt;
            const falaTexto = dlg.falas[dlg.falaAtualIndex] || '';
            const caracteresDesejados = Math.floor(dlg.timerTypewriter * 30);
            if (caracteresDesejados > dlg.caracteresVisiveis) {
              dlg.caracteresVisiveis = Math.min(caracteresDesejados, falaTexto.length);
              if (dlg.caracteresVisiveis < falaTexto.length && dlg.caracteresVisiveis % 3 === 0) {
                soundManager.playTextBeep();
              }
            }
            if (dlg.caracteresVisiveis >= falaTexto.length) {
              dlg.falaConcluida = true;
            }
          }
        }

        // Atualização de Feedback da Loja
        if (state.lojaAtiva && state.lojaAtiva.ativa) {
          if (state.lojaAtiva.mensagemFeedbackTimer && state.lojaAtiva.mensagemFeedbackTimer > 0) {
            state.lojaAtiva.mensagemFeedbackTimer -= dt;
            if (state.lojaAtiva.mensagemFeedbackTimer <= 0) {
              state.lojaAtiva.mensagemFeedback = undefined;
            }
          }
        }

        let inputX = 0;
        let inputY = 0;

        const congeladoPorUI =
          Boolean(state.dialogoAtivo && state.dialogoAtivo.ativo) ||
          Boolean(state.lojaAtiva && state.lojaAtiva.ativa);

        if (!puxandoGancho && !congeladoPorUI) {
          if (keys['ArrowUp'] || keys['KeyW']) inputY -= 1;
          if (keys['ArrowDown'] || keys['KeyS']) inputY += 1;
          if (keys['ArrowLeft'] || keys['KeyA']) inputX -= 1;
          if (keys['ArrowRight'] || keys['KeyD']) inputX += 1;
        }

        // Normalização diagonal para velocidade constante
        if (inputX !== 0 && inputY !== 0) {
          const invSqrt2 = 0.70710678; // 1 / sqrt(2)
          inputX *= invSqrt2;
          inputY *= invSqrt2;
        }
        heroi.andando = (inputX !== 0 || inputY !== 0);

        // Atualizar direção olhando para onde está se movendo
        if (!puxandoGancho && !congeladoPorUI) {
          if (keys['ArrowUp'] || keys['KeyW']) heroi.direcao = 'cima';
          else if (keys['ArrowDown'] || keys['KeyS']) heroi.direcao = 'baixo';
          else if (keys['ArrowLeft'] || keys['KeyA']) heroi.direcao = 'esquerda';
          else if (keys['ArrowRight'] || keys['KeyD']) heroi.direcao = 'direita';
        }

        // Lógica de velocidade do terreno e física especial de Terras Geladas e Charco Sombrio
        if (state.regiaoAtual === 'charco' && isHeroiNaAguaRasa(heroi.x, heroi.y) && !sobreGeloCongelado) {
          heroi.velocidade = HERO_SWAMP_SPEED; // 64px/s no pântano
        } else if (state.regiaoAtual === 'geladas') {
          const naNeve = isHeroiNaNeve(heroi.x, heroi.y);
          const noGeloLiso = isHeroiNoGeloLiso(heroi.x, heroi.y);
          const blocoGeloFino = isHeroiNoGeloFino(heroi.x, heroi.y);

          // Velocidade na neve
          if (naNeve) {
            heroi.velocidade = 70; // Redução para 70px/s
          } else {
            heroi.velocidade = HERO_BASE_SPEED; // 96px/s
          }

          // Deslizamento no Gelo Liso (0.4s de inércia ao soltar teclas)
          if (noGeloLiso) {
            if (inputX !== 0 || inputY !== 0) {
              heroi.deslizamentoVx = inputX * heroi.velocidade;
              heroi.deslizamentoVy = inputY * heroi.velocidade;
              heroi.deslizamentoTimer = 0.4;
            } else if (heroi.deslizamentoTimer && heroi.deslizamentoTimer > 0) {
              inputX = (heroi.deslizamentoVx || 0) / heroi.velocidade;
              inputY = (heroi.deslizamentoVy || 0) / heroi.velocidade;
              heroi.deslizamentoTimer -= dt;
            }
          } else {
            heroi.deslizamentoTimer = 0;
          }

          // Gelo Fino: Quebra sem Botas Glaciais
          const temBotasGlaciais =
            state.itemEquipado === 'botas_glaciais' ||
            Boolean(state.itensSecundariosObtidos?.botas_glaciais);

          if (blocoGeloFino && !temBotasGlaciais && (!heroi.iframes || heroi.iframes <= 0)) {
            blocoGeloFino.quebrado = true;
            soundManager.playWaterSplash();
            state.vidaAtual = Math.max(0, state.vidaAtual - 1);
            heroi.iframes = 1.0;
            // Respawn no início da tela atual
            heroi.x = Math.floor(heroi.x / LOGICAL_WIDTH) * LOGICAL_WIDTH + 120;
            heroi.y = Math.floor(heroi.y / LOGICAL_HEIGHT) * LOGICAL_HEIGHT + 180;
            state.notificacaoTexto = 'GELO FINO RACHOU! EXIGE BOTAS GLACIAIS!';
            state.notificacaoTimer = 2.5;
          }

          // Coleta da Lanterna Perdida
          if (!state.lanternaPerdidaColetada) {
            const heroHitBox: Retangulo = { x: heroi.x, y: heroi.y, w: heroi.w, h: heroi.h };
            if (checkAABB(heroHitBox, LANTERNA_PERDIDA_POS)) {
              state.lanternaPerdidaColetada = true;
              soundManager.playChestOpen();
              state.notificacaoTexto = 'ENCONTROU A LANTERNA PERDIDA NA NEVE!';
              state.notificacaoTimer = 3.0;
            }
          }
        } else {
          heroi.velocidade = HERO_BASE_SPEED; // 96px/s padrão no Vale Verdejante
        }

        const moveDistanceX = inputX * heroi.velocidade * dt;
        const moveDistanceY = inputY * heroi.velocidade * dt;

        // Movimentação com resolução AABB separada em X
        if (moveDistanceX !== 0) {
          const targetX = Math.max(
            0,
            Math.min(heroi.x + moveDistanceX, state.mapaLargura - heroi.w)
          );
          const testBoxX: Retangulo = {
            x: targetX,
            y: heroi.y,
            w: heroi.w,
            h: heroi.h,
          };

          const colidiuX = state.obstaculos.some((obs) => checkAABB(testBoxX, obs));
          if (!colidiuX) {
            heroi.x = targetX;
          }
        }

        // Movimentação com resolução AABB separada em Y (permite deslizar na parede)
        if (moveDistanceY !== 0) {
          const targetY = Math.max(
            0,
            Math.min(heroi.y + moveDistanceY, state.mapaAltura - heroi.h)
          );
          const testBoxY: Retangulo = {
            x: heroi.x,
            y: targetY,
            w: heroi.w,
            h: heroi.h,
          };

          const colidiuY = state.obstaculos.some((obs) => checkAABB(testBoxY, obs));
          if (!colidiuY) {
            heroi.y = targetY;
          }
        }

        // Transição entre regiões: Vale Verdejante e Charco Sombrio (conectadas pela borda norte do Vale / borda sul do Charco)
        // Atravessar a borda norte do Vale leva à borda sul do Charco (e vice-versa), mantendo a posição relativa do herói no eixo perpendicular (X).
        if (state.regiaoAtual === 'vale' && heroi.y <= 4 && inputY < 0) {
          state.regiaoAtual = 'charco';
          state.obstaculos = getCharcoObstaculos();
          heroi.y = state.mapaAltura - heroi.h - 10;
          state.telaAtualX = Math.min(2, Math.max(0, Math.floor((heroi.x + heroi.w / 2) / LOGICAL_WIDTH)));
          state.telaAtualY = 2;
          state.transicaoFadeTimer = 0.35;
          state.notificacaoTexto = 'CHARCO SOMBRIO • VILAREJO JUNCOTURVO';
          state.notificacaoTimer = 2.5;
          soundManager.playDoorOpen();
        } else if (state.regiaoAtual === 'charco' && heroi.y >= state.mapaAltura - heroi.h - 4 && inputY > 0) {
          state.regiaoAtual = 'vale';
          state.obstaculos = getValeObstaculos(state.arvoreCriptaDestruida);
          heroi.y = 8;
          state.telaAtualX = Math.min(2, Math.max(0, Math.floor((heroi.x + heroi.w / 2) / LOGICAL_WIDTH)));
          state.telaAtualY = 0;
          state.transicaoFadeTimer = 0.35;
          state.notificacaoTexto = 'VALE VERDEJANTE';
          state.notificacaoTimer = 2.5;
          soundManager.playDoorOpen();
        } else if (state.regiaoAtual === 'charco' && heroi.x <= 4 && inputX < 0) {
          // Atravessar a borda oeste do Charco leva à borda leste de Terras Geladas
          state.regiaoAtual = 'geladas';
          state.obstaculos = getGeladasObstaculos();
          heroi.x = state.mapaLargura - heroi.w - 10;
          state.telaAtualX = 2;
          state.telaAtualY = Math.min(2, Math.max(0, Math.floor((heroi.y + heroi.h / 2) / LOGICAL_HEIGHT)));
          state.transicaoFadeTimer = 0.35;
          state.notificacaoTexto = 'TERRAS GELADAS • VILAREJO GÉLIDA';
          state.notificacaoTimer = 2.5;
          soundManager.playDoorOpen();
        } else if (state.regiaoAtual === 'geladas' && heroi.x >= state.mapaLargura - heroi.w - 4 && inputX > 0) {
          // Atravessar a borda leste de Terras Geladas volta à borda oeste do Charco
          state.regiaoAtual = 'charco';
          state.obstaculos = getCharcoObstaculos(state.alavancaCharcoPonteAtivada);
          heroi.x = 10;
          state.telaAtualX = 0;
          state.telaAtualY = Math.min(2, Math.max(0, Math.floor((heroi.y + heroi.h / 2) / LOGICAL_HEIGHT)));
          state.transicaoFadeTimer = 0.35;
          state.notificacaoTexto = 'CHARCO SOMBRIO';
          state.notificacaoTimer = 2.5;
          soundManager.playDoorOpen();
        } else if (state.regiaoAtual === 'charco' && heroi.x >= state.mapaLargura - heroi.w - 4 && inputX > 0) {
          // Atravessar a borda leste do Charco leva à borda oeste do Deserto de Kaal
          state.regiaoAtual = 'kaal';
          state.obstaculos = OBSTACULOS_DESERTO_KAAL;
          heroi.x = 10;
          state.telaAtualX = 0;
          state.telaAtualY = Math.min(2, Math.max(0, Math.floor((heroi.y + heroi.h / 2) / LOGICAL_HEIGHT)));
          state.transicaoFadeTimer = 0.35;
          state.notificacaoTexto = 'DESERTO DE KAAL • OÁSIS DE KAAL';
          state.notificacaoTimer = 2.5;
          soundManager.playDoorOpen();
        } else if (state.regiaoAtual === 'kaal' && heroi.x <= 4 && inputX < 0) {
          // Atravessar a borda oeste de Kaal volta à borda leste do Charco
          state.regiaoAtual = 'charco';
          state.obstaculos = getCharcoObstaculos(state.alavancaCharcoPonteAtivada);
          heroi.x = state.mapaLargura - heroi.w - 10;
          state.telaAtualX = 2;
          state.telaAtualY = Math.min(2, Math.max(0, Math.floor((heroi.y + heroi.h / 2) / LOGICAL_HEIGHT)));
          state.transicaoFadeTimer = 0.35;
          state.notificacaoTexto = 'CHARCO SOMBRIO';
          state.notificacaoTimer = 2.5;
          soundManager.playDoorOpen();
        }

        // Atualização de áreas visitadas na cartografia da região atual
        if (state.regiaoAtual === 'geladas') {
          if (!state.areasVisitadasGeladas) {
            state.areasVisitadasGeladas = criarAreasVisitadasGeladasIniciais();
          }
          const colMap = Math.min(8, Math.max(0, Math.floor((heroi.x / state.mapaLargura) * 9)));
          const rowMap = Math.min(7, Math.max(0, Math.floor((heroi.y / state.mapaAltura) * 8)));
          if (state.areasVisitadasGeladas[colMap]) {
            state.areasVisitadasGeladas[colMap][rowMap] = true;
          }
        } else if (state.regiaoAtual === 'charco') {
          if (!state.areasVisitadasCharco) {
            state.areasVisitadasCharco = criarAreasVisitadasCharcoIniciais();
          }
          const colMap = Math.min(8, Math.max(0, Math.floor((heroi.x / state.mapaLargura) * 9)));
          const rowMap = Math.min(7, Math.max(0, Math.floor((heroi.y / state.mapaAltura) * 8)));
          if (state.areasVisitadasCharco[colMap]) {
            state.areasVisitadasCharco[colMap][rowMap] = true;
          }
        } else {
          if (!state.areasVisitadasVale) {
            state.areasVisitadasVale = criarAreasVisitadasValeIniciais();
          }
          const colMap = Math.min(8, Math.max(0, Math.floor((heroi.x / state.mapaLargura) * 9)));
          const rowMap = Math.min(7, Math.max(0, Math.floor((heroi.y / state.mapaAltura) * 8)));
          if (state.areasVisitadasVale[colMap]) {
            state.areasVisitadasVale[colMap][rowMap] = true;
          }
        }

        // Atualização de combate do Herói (Lâmina de Eldrim, iframes, knockback)
        const limitesOverworld = {
          minX: 0,
          maxX: state.mapaLargura,
          minY: 0,
          maxY: state.mapaAltura,
        };
        atualizarHeroiCombate(heroi, dt, state.obstaculos, limitesOverworld);

        // Atualização dos inimigos do Vale Verdejante (Espinho Rastejante & Vagalume Sombrio)
        if (state.inimigosVale && state.inimigosVale.length > 0) {
          atualizarInimigos(
            state.inimigosVale,
            heroi,
            state.obstaculos,
            limitesOverworld,
            state,
            dt
          );
        }

        // Atualização da Região 4 (Deserto de Kaal)
        if (state.regiaoAtual === 'kaal') {
          atualizarDesertoKaal(state, dt);
        }

        // Atualização de partículas do combate
        atualizarParticulas(state.particulas, dt);

        // Checagem de derrota no Overworld
        if (state.vidaAtual <= 0) {
          state.estadoAnterior = EstadoJogo.OVERWORLD;
          state.estadoAtual = EstadoJogo.GAMEOVER;
          soundManager.playHeroHurt();
        }

        // 1. Checar colisão com o Coletável de Vida (+1 Vida Máxima)
        if (!state.coletavelVidaColetado) {
          const heroHitbox: Retangulo = {
            x: heroi.x,
            y: heroi.y,
            w: heroi.w,
            h: heroi.h,
          };
          if (checkAABB(heroHitbox, COLETAVEL_VIDA)) {
            state.coletavelVidaColetado = true;
            state.vidaMax += 1;
            state.vidaAtual = Math.min(state.vidaMax, state.vidaAtual + 1);
            state.notificacaoTexto = '+1 FRAGMENTO DE VIDA!';
            state.notificacaoTimer = 2.5;
            soundManager.playItemGet();
          }
        }

        // 2. Entrada no Santuário da Raiz Antiga (Portal Norte no topo do Vale: Tela [1, 0])
        if (
          state.regiaoAtual === 'vale' &&
          state.telaAtualX === 1 &&
          state.telaAtualY === 0 &&
          heroi.y <= 16 &&
          heroi.x >= 352 &&
          heroi.x <= 416
        ) {
          state.estadoAtual = EstadoJogo.DUNGEON;
          state.dungeonTipoAtivo = 'santuario';
          state.dungeonSalaAtualId = 'sala_1_atrio';
          state.heroi.x = 120;
          state.heroi.y = 180;
          state.heroi.direcao = 'cima';
          state.dungeonTransicaoTimer = 0.15;
          soundManager.playDoorOpen();
        }

        // 2b. Entrada no Santuário das Águas Turvas (Portal Norte no Charco Sombrio: Tela [1, 0])
        if (
          state.regiaoAtual === 'charco' &&
          state.telaAtualX === 1 &&
          state.telaAtualY === 0 &&
          heroi.y <= 24 &&
          heroi.x >= 352 &&
          heroi.x <= 416
        ) {
          state.estadoAtual = EstadoJogo.DUNGEON;
          state.dungeonTipoAtivo = 'aguas_turvas';
          state.dungeonSalaAtualId = 'aguas_entrada';
          state.heroi.x = 120;
          state.heroi.y = 180;
          state.heroi.direcao = 'cima';
          state.dungeonTransicaoTimer = 0.2;
          soundManager.playDoorOpen();
          state.notificacaoTexto = 'SANTUÁRIO DAS ÁGUAS TURVAS';
          state.notificacaoTimer = 2.5;
        }

        // 2c. Entrada na Catacumba Covil Afogado (Charco Nordeste: Tela [2, 0])
        if (
          state.regiaoAtual === 'charco' &&
          state.telaAtualX === 2 &&
          state.telaAtualY === 0
        ) {
          state.obstaculos = getCharcoObstaculos(state.alavancaCharcoPonteAtivada);
          const heroHitbox: Retangulo = {
            x: heroi.x,
            y: heroi.y,
            w: heroi.w,
            h: heroi.h,
          };
          if (checkAABB(heroHitbox, ENTRADA_COVIL_AFOGADO_OVERWORLD)) {
            state.estadoAtual = EstadoJogo.DUNGEON;
            state.dungeonTipoAtivo = 'covil_afogado';
            covilAfogadoRef.current.salaAtualId = 'covil_entrada';
            heroi.x = 120;
            heroi.y = 180;
            heroi.direcao = 'cima';
            covilAfogadoRef.current.transicaoTimer = 0.25;
            soundManager.playDoorOpen();
            state.notificacaoTexto = 'CATACUMBA: COVIL AFOGADO';
            state.notificacaoTimer = 2.5;
          }
        }

        // 2c-1. Entrada na Cripta do Guardião Adormecido (Bosque Noroeste: Tela [0, 0])
        if (
          state.regiaoAtual === 'vale' &&
          state.telaAtualX === 0 &&
          state.telaAtualY === 0 &&
          state.arvoreCriptaDestruida
        ) {
          const heroHitbox: Retangulo = {
            x: heroi.x,
            y: heroi.y,
            w: heroi.w,
            h: heroi.h,
          };
          if (checkAABB(heroHitbox, ENTRADA_CRIPTA_HITBOX)) {
            state.estadoAtual = EstadoJogo.DUNGEON;
            state.dungeonTipoAtivo = 'cripta';
            criptaRef.current.salaAtualId = 'cripta_sala_1_puzzle';
            criptaRef.current.transicaoTimer = 0.25;
            heroi.x = 120;
            heroi.y = 180;
            heroi.direcao = 'cima';
            soundManager.playDoorOpen();
            state.notificacaoTexto = 'CATACUMBA: CRIPTA DO GUARDIÃO ADORMECIDO';
            state.notificacaoTimer = 2.5;
          }
        }

        // 2c-2. Entrada na Caverna de Cristal (Platô Glacial do Sul em Terras Geladas: Tela [2, 2])
        if (
          state.regiaoAtual === 'geladas' &&
          state.telaAtualX === 2 &&
          state.telaAtualY === 2
        ) {
          const heroHitbox: Retangulo = {
            x: heroi.x,
            y: heroi.y,
            w: heroi.w,
            h: heroi.h,
          };
          if (checkAABB(heroHitbox, ENTRADA_CAVERNA_CRISTAL_OVERWORLD)) {
            state.estadoAtual = EstadoJogo.DUNGEON;
            state.dungeonTipoAtivo = 'caverna_cristal';
            cavernaCristalRef.current.salaAtualId = 'cristal_sala_1';
            cavernaCristalRef.current.transicaoTimer = 0.25;
            heroi.x = 120;
            heroi.y = 180;
            heroi.direcao = 'cima';
            soundManager.playDoorOpen();
            state.notificacaoTexto = 'CATACUMBA: CAVERNA DE CRISTAL';
            state.notificacaoTimer = 2.5;
          }
        }

        // 2d. Entrada no Santuário do Gelo Eterno (Norte de Terras Geladas: Tela [1, 0])
        if (
          state.regiaoAtual === 'geladas' &&
          state.telaAtualX === 1 &&
          state.telaAtualY === 0 &&
          heroi.y <= 24 &&
          heroi.x >= 352 &&
          heroi.x <= 416
        ) {
          state.estadoAtual = EstadoJogo.DUNGEON;
          state.dungeonTipoAtivo = 'gelo_eterno';
          (state as any).dungeonGeloState = criarDungeonGeloEternoInicial();
          state.heroi.x = 120;
          state.heroi.y = 180;
          state.heroi.direcao = 'cima';
          soundManager.playDoorOpen();
          state.notificacaoTexto = 'SANTUÁRIO DO GELO ETERNO';
          state.notificacaoTimer = 2.5;
        }

        // 2e. Entrada no Santuário das Chamas (Norte de Deserto de Kaal: Tela [1, 0])
        if (
          state.regiaoAtual === 'kaal' &&
          state.telaAtualX === 1 &&
          state.telaAtualY === 0 &&
          heroi.y <= 24 &&
          heroi.x >= 352 &&
          heroi.x <= 416
        ) {
          state.estadoAtual = EstadoJogo.DUNGEON;
          state.dungeonTipoAtivo = 'santuario_chamas';
          (state as any).santuarioChamasState = criarDungeonChamasInicial();
          state.heroi.x = 120;
          state.heroi.y = 180;
          state.heroi.direcao = 'cima';
          soundManager.playDoorOpen();
          state.notificacaoTexto = 'SANTUÁRIO DAS CHAMAS';
          state.notificacaoTimer = 2.5;
        }

        // 2f. Entrada na Tumba Enterrada (Sudoeste de Deserto de Kaal: Tela [0, 2])
        if (
          state.regiaoAtual === 'kaal' &&
          state.telaAtualX === 0 &&
          state.telaAtualY === 2 &&
          heroi.x >= 56 &&
          heroi.x <= 104 &&
          heroi.y >= 472 &&
          heroi.y <= 512
        ) {
          state.estadoAtual = EstadoJogo.DUNGEON;
          state.dungeonTipoAtivo = 'tumba_enterrada';
          (state as any).tumbaEnterradaState = criarTumbaEnterradaInicial();
          state.heroi.x = 120;
          state.heroi.y = 180;
          state.heroi.direcao = 'cima';
          soundManager.playDoorOpen();
          state.notificacaoTexto = 'TUMBA ENTERRADA';
          state.notificacaoTimer = 2.5;
        }

        // Bumerangue das Marés no Overworld
        if (state.bumerangueAnim && state.bumerangueAnim.ativo) {
          atualizarBumerangueGlobal(
            state.bumerangueAnim,
            state.heroi,
            undefined,
            state.obstaculos,
            state,
            dt
          );
        }

        // 3. Transição fade de 0.3s ao mudar de tela dentro do mapa 3x3 (256x224 cada tela)
        const novaTelaX = Math.min(
          2,
          Math.max(0, Math.floor((heroi.x + heroi.w / 2) / LOGICAL_WIDTH))
        );
        const novaTelaY = Math.min(
          2,
          Math.max(0, Math.floor((heroi.y + heroi.h / 2) / LOGICAL_HEIGHT))
        );

        if (novaTelaX !== state.telaAtualX || novaTelaY !== state.telaAtualY) {
          state.telaAtualX = novaTelaX;
          state.telaAtualY = novaTelaY;
          state.transicaoFadeTimer = 0.3; // Dispara fade de 0.3s
        }

        if (state.transicaoFadeTimer > 0) {
          state.transicaoFadeTimer = Math.max(0, state.transicaoFadeTimer - dt);
        }

        // 4. Atualização da Câmera (centraliza o herói clampada aos limites de 768x672)
        let camX = heroi.x + heroi.w / 2 - LOGICAL_WIDTH / 2;
        let camY = heroi.y + heroi.h / 2 - LOGICAL_HEIGHT / 2;

        const maxCamX = Math.max(0, state.mapaLargura - LOGICAL_WIDTH);
        const maxCamY = Math.max(0, state.mapaAltura - LOGICAL_HEIGHT);

        camX = Math.max(0, Math.min(camX, maxCamX));
        camY = Math.max(0, Math.min(camY, maxCamY));

        state.camera.x = camX;
        state.camera.y = camY;

        // RENDERIZAÇÃO OVERWORLD (Vale Verdejante ou Charco Sombrio)
        ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

        ctx.save();
        const roundCamX = Math.round(state.camera.x);
        const roundCamY = Math.round(state.camera.y);
        ctx.translate(-roundCamX, -roundCamY);

        if (state.regiaoAtual === 'geladas') {
          // 1. Renderizar Terreno de Neve, Gelo Liso e Gelo Fino de Terras Geladas
          renderTerrenoTerrasGeladas(ctx, roundCamX, roundCamY, state.tituloTimer);

          // 2. Renderizar Estruturas de Vilarejo Gélida e Entrada da Caverna de Cristal
          renderCasasGelida(ctx, roundCamX, roundCamY, state.tituloTimer);
          renderFogueiraCentral(ctx, roundCamX, roundCamY, state.tituloTimer);
          renderLanternaPerdida(ctx, roundCamX, roundCamY, state.tituloTimer, state.lanternaPerdidaColetada);
          renderNPCsGelida(ctx, roundCamX, roundCamY, state.tituloTimer, state.questLanternaStatus);
          renderEntradaCavernaCristal(ctx, roundCamX, roundCamY);
          renderizarEfeitoGeloAgua(ctx, state, roundCamX, roundCamY);

          // 3. Renderizar Herói Ren
          renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);

          // 4. Nevasca Suave
          renderNevascaTerrasGeladas(ctx, state.tituloTimer);
        } else if (state.regiaoAtual === 'kaal') {
          // Renderizar Deserto de Kaal
          renderizarDesertoKaal(ctx, state, roundCamX, roundCamY);

          // Renderizar o Herói Ren em Kaal
          renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);
        } else if (state.regiaoAtual === 'charco') {
          // 1. Terreno do Charco Sombrio (Água rasa ~40%, ilhas de lama escura, caminhos de pedra, juncos e doca)
          renderTerrenoCharco(
            ctx,
            roundCamX,
            roundCamY,
            LOGICAL_WIDTH,
            LOGICAL_HEIGHT,
            state.tituloTimer
          );
          renderizarEfeitoGeloAgua(ctx, state, roundCamX, roundCamY);

          // 2. Y-Sorting: Árvores Retorcidas do Pântano e Herói Ren
          const visibleCharcoTrees = CHARCO_ARVORES.filter(
            (t) =>
              t.x + t.w >= roundCamX - 16 &&
              t.x <= roundCamX + LOGICAL_WIDTH + 16 &&
              t.y + t.h >= roundCamY - 16 &&
              t.y <= roundCamY + LOGICAL_HEIGHT + 16
          );

          interface DrawCharcoItem {
            tipo: 'arvore_pantano' | 'heroi';
            baseY: number;
            arvorePantano?: ArvorePantanoInfo;
          }

          const drawCharcoItems: DrawCharcoItem[] = visibleCharcoTrees.map((t) => ({
            tipo: 'arvore_pantano',
            baseY: t.y + 36,
            arvorePantano: t,
          }));

          drawCharcoItems.push({
            tipo: 'heroi',
            baseY: heroi.y + heroi.h,
          });

          drawCharcoItems.sort((a, b) => a.baseY - b.baseY);

          drawCharcoItems.forEach((item) => {
            if (item.tipo === 'arvore_pantano' && item.arvorePantano) {
              renderArvorePantano(ctx, item.arvorePantano, state.tituloTimer);
            } else if (item.tipo === 'heroi') {
              renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);
            }
          });

          // 3. Vilarejo Juncoturvo (3 casas, doca de madeira, NPC Escriba Ivo e Mercador Gorren)
          renderCasasJuncoturvo(ctx, roundCamX, roundCamY, state.tituloTimer);

          // 4. Área do Covil Afogado na Ilhota Nordeste (Canal, Ponte de Madeira, Alavanca Remota & Arco em Ruínas)
          renderAreaCovilAfogado(
            ctx,
            roundCamX,
            roundCamY,
            state.tituloTimer,
            state.alavancaCharcoPonteAtivada,
            heroi.x,
            heroi.y
          );
        } else {
          // Renderizar Chão e Rio do Vale Verdejante
          renderTerrenoVale(
            ctx,
            roundCamX,
            roundCamY,
            LOGICAL_WIDTH,
            LOGICAL_HEIGHT,
            state.tituloTimer
          );
          renderizarEfeitoGeloAgua(ctx, state, roundCamX, roundCamY);

          // Renderizar Entrada da Cripta escavada no solo (se a árvore foi destruída com golpe carregado)
          if (state.arvoreCriptaDestruida) {
            renderEntradaCripta(ctx, state.tituloTimer);
          }

          // Renderizar Coletável de Vida se ainda não coletado
          if (!state.coletavelVidaColetado) {
            renderColetavelVida(ctx, COLETAVEL_VIDA, state.tituloTimer);
          }

          // Y-Sorting: Árvores e Herói
          const visibleTrees = VALE_ARVORES.filter(
            (t) =>
              t.x + t.w >= roundCamX - 16 &&
              t.x <= roundCamX + LOGICAL_WIDTH + 16 &&
              t.y + t.h >= roundCamY - 16 &&
              t.y <= roundCamY + LOGICAL_HEIGHT + 16
          );

          interface DrawItem {
            tipo: 'arvore' | 'heroi' | 'arvore_cripta';
            baseY: number;
            arvore?: ArvoreInfo;
          }

          const drawItems: DrawItem[] = visibleTrees.map((tree) => ({
            tipo: 'arvore',
            baseY: tree.y + 32,
            arvore: tree,
          }));

          // Árvore Ancestral da Cripta (só entra no Y-sorting se ainda não foi derrubada)
          if (
            !state.arvoreCriptaDestruida &&
            ARVORE_CRIPTA.x + ARVORE_CRIPTA.w >= roundCamX - 16 &&
            ARVORE_CRIPTA.x <= roundCamX + LOGICAL_WIDTH + 16 &&
            ARVORE_CRIPTA.y + ARVORE_CRIPTA.h >= roundCamY - 16 &&
            ARVORE_CRIPTA.y <= roundCamY + LOGICAL_HEIGHT + 16
          ) {
            drawItems.push({
              tipo: 'arvore_cripta',
              baseY: ARVORE_CRIPTA.y + 32,
            });
          }

          drawItems.push({
            tipo: 'heroi',
            baseY: heroi.y + heroi.h,
          });

          drawItems.sort((a, b) => a.baseY - b.baseY);

          drawItems.forEach((item) => {
            if (item.tipo === 'arvore' && item.arvore) {
              renderArvore(ctx, item.arvore);
            } else if (item.tipo === 'arvore_cripta') {
              renderArvoreCripta(ctx, state.tituloTimer);
            } else if (item.tipo === 'heroi') {
              renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);
            }
          });

          // Renderizar Inimigos do Vale Verdejante
          renderizarInimigos(ctx, state.inimigosVale, 0, 0, state.tituloTimer);

          // Renderizar Pontos de Gancho (#c9a24b) do Vale Verdejante
          VALE_PONTOS_GANCHO.forEach((pg) => {
            renderizarPontoGancho(ctx, pg, 0, 0, state.tituloTimer);
          });

          // Renderizar Baú Secundário da Ilha Secreta no Bosque Ocidental
          renderBauIlha(ctx, 0, 0, state.bauIlhaBosqueAberto, state.tituloTimer);
        }

        // Renderizar o golpe da Lâmina de Eldrim (ativo por 200ms)
        renderizarEspada(ctx, heroi);

        // Renderizar brilho e runas crescentes ao segurar o golpe
        renderizarCargaEspada(ctx, heroi, state.tituloTimer);

        // Renderizar o Gancho de Vinha em ação (linha de cipó e ponta de ferro)
        renderizarGancho(ctx, state, 0, 0);

        // Renderizar o Bumerangue das Marés em voo
        if (state.bumerangueAnim && state.bumerangueAnim.ativo) {
          renderizarBumerangue(ctx, state.bumerangueAnim, 0, 0);
        }

        // Renderizar partículas do combate
        renderizarParticulas(ctx, state.particulas);

        ctx.restore();

        // Efeito de calor ondulante no topo da tela no Deserto de Kaal
        if (state.regiaoAtual === 'kaal') {
          renderizarEfeitoCalorDeserto(ctx, state.tituloTimer);
        }

        // Névoa misteriosa contínua do Charco Sombrio (#cccccc a 15% de opacidade em deslocamento contínuo)
        if (state.regiaoAtual === 'charco') {
          renderNevoaCharco(ctx, state.charcoFogOffset || 0, state.tituloTimer);
        }

        // Transição fade de 0.3s ao cruzar telas
        if (state.transicaoFadeTimer > 0) {
          const progresso = 1 - state.transicaoFadeTimer / 0.3;
          const alpha = Math.sin(progresso * Math.PI) * 0.9;
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
          ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        }
      }

      // ==========================================
      // ESTADO: DUNGEON (Santuário da Raiz Antiga / Cripta do Guardião)
      // ==========================================
      if (state.estadoAtual === EstadoJogo.DUNGEON) {
        // Incremento do tempo de carga da Lâmina de Eldrim na dungeon
        if (heroi.carregandoGolpe && (keys['KeyZ'] || keys['Space'])) {
          heroi.cargaGolpeTimer = (heroi.cargaGolpeTimer || 0) + dt;
          if (heroi.cargaGolpeTimer >= 1.0 && !heroi.golpePronto) {
            heroi.golpePronto = true;
            soundManager.playChargeReady();
          }
        }

        // Checagem de derrota na dungeon
        if (state.vidaAtual <= 0) {
          state.estadoAnterior = EstadoJogo.DUNGEON;
          state.estadoAtual = EstadoJogo.GAMEOVER;
          soundManager.playHeroHurt();
        }
        // Barra de "Fluxo Arcano": enche a 5%/s até o máximo atual (20 no início)
        const regenArcanoPorSegundo = state.arcanoMax * 0.05;
        state.arcanoAtual = Math.min(
          state.arcanoMax,
          state.arcanoAtual + regenArcanoPorSegundo * dt
        );

        // Atualização da física e animação do Gancho de Vinha na Dungeon
        atualizarGancho(state, dt);
        const puxandoGanchoDungeon =
          state.ganchoAnim &&
          state.ganchoAnim.ativo &&
          state.ganchoAnim.fase === 'puxando';

        let inputX = 0;
        let inputY = 0;

        if (!puxandoGanchoDungeon) {
          if (keys['ArrowUp'] || keys['KeyW']) inputY -= 1;
          if (keys['ArrowDown'] || keys['KeyS']) inputY += 1;
          if (keys['ArrowLeft'] || keys['KeyA']) inputX -= 1;
          if (keys['ArrowRight'] || keys['KeyD']) inputX += 1;
        }

        if (inputX !== 0 && inputY !== 0) {
          const invSqrt2 = 0.70710678;
          inputX *= invSqrt2;
          inputY *= invSqrt2;
        }
        heroi.andando = (inputX !== 0 || inputY !== 0);

        if (!puxandoGanchoDungeon) {
          if (keys['ArrowUp'] || keys['KeyW']) heroi.direcao = 'cima';
          else if (keys['ArrowDown'] || keys['KeyS']) heroi.direcao = 'baixo';
          else if (keys['ArrowLeft'] || keys['KeyA']) heroi.direcao = 'esquerda';
          else if (keys['ArrowRight'] || keys['KeyD']) heroi.direcao = 'direita';
        }

        heroi.x += inputX * heroi.velocidade * dt;
        heroi.y += inputY * heroi.velocidade * dt;

        // Roteamento de Dungeon: Cripta do Guardião vs Santuário da Raiz Antiga
        if (state.dungeonTipoAtivo === 'cripta') {
          const salaAtual = criptaRef.current.salas[criptaRef.current.salaAtualId];
          const obsCripta = salaAtual ? salaAtual.obstaculos : [];
          const limitesCripta = { minX: 16, maxX: 240, minY: 16, maxY: 208 };
          atualizarHeroiCombate(heroi, dt, obsCripta, limitesCripta);

          // Atualização da lógica da Cripta (puzzle de blocos, combate, baú)
          atualizarCripta(criptaRef.current, state, dt, () => {
            // Callback de saída para o Vale Verdejante (escadaria sul da Sala 1)
            state.estadoAtual = EstadoJogo.OVERWORLD;
            state.dungeonTipoAtivo = 'santuario';
            heroi.x = ARVORE_CRIPTA.x + 8;
            heroi.y = ARVORE_CRIPTA.y + 36;
            heroi.direcao = 'baixo';
            state.telaAtualX = 0;
            state.telaAtualY = 0;
            const maxCamX = Math.max(0, state.mapaLargura - LOGICAL_WIDTH);
            const maxCamY = Math.max(0, state.mapaAltura - LOGICAL_HEIGHT);
            state.camera.x = Math.max(0, Math.min(heroi.x + 8 - LOGICAL_WIDTH / 2, maxCamX));
            state.camera.y = Math.max(0, Math.min(heroi.y + 8 - LOGICAL_HEIGHT / 2, maxCamY));
            state.transicaoFadeTimer = 0.3;
            state.obstaculos = getValeObstaculos(state.arvoreCriptaDestruida);
            soundManager.playDoorOpen();
          });

          // Renderização da sala atual da Cripta
          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          renderizarCripta(ctx, criptaRef.current, state, state.tituloTimer);

          // Renderizar o Herói Ren
          renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);

          // Renderizar golpe e carga da espada
          renderizarEspada(ctx, heroi);
          renderizarCargaEspada(ctx, heroi, state.tituloTimer);

          // Renderizar gancho e partículas
          renderizarGancho(ctx, state, 0, 0);
          renderizarParticulas(ctx, state.particulas);
        } else if (state.dungeonTipoAtivo === 'aguas_turvas') {
          // ===================================================================
          // SANTUÁRIO DAS ÁGUAS TURVAS (CHARCO SOMBRIO)
          // ===================================================================
          const dung = dungeonAguasRef.current;

          // Atualização da física da dungeon (salas, portas trancadas, pontes, alavancas, baús, transições)
          atualizarFisicaDungeon(dung, state, dt, () => {
            // Saída da Dungeon para o Charco Sombrio (porta sul da entrada)
            state.estadoAtual = EstadoJogo.OVERWORLD;
            state.regiaoAtual = 'charco';
            state.telaAtualX = 1;
            state.telaAtualY = 0;
            state.heroi.x = 384;
            state.heroi.y = 48;
            state.heroi.direcao = 'baixo';
            const maxCamX = Math.max(0, state.mapaLargura - LOGICAL_WIDTH);
            const maxCamY = Math.max(0, state.mapaAltura - LOGICAL_HEIGHT);
            state.camera.x = Math.max(0, Math.min(state.heroi.x + 8 - LOGICAL_WIDTH / 2, maxCamX));
            state.camera.y = Math.max(0, Math.min(state.heroi.y + 8 - LOGICAL_HEIGHT / 2, maxCamY));
            state.transicaoFadeTimer = 0.3;
            soundManager.playDoorOpen();
          });

          // 1. Atualizar plataformas que afundam (mecânica única: 1s pisou, 3s afunda, 2s vazia)
          atualizarPlataformasAfundando(
            state.plataformasDungeon,
            state.heroi,
            dt,
            state.dungeonSalaAtualId,
            () => {
              // Herói caiu na água profunda! Leva 1 de dano, som de splash, iframes e é recolocado seguro
              state.vidaAtual = Math.max(0, state.vidaAtual - 1);
              state.heroi.iframes = 0.8;
              soundManager.playWaterSplash();
              state.heroi.x = 120;
              state.heroi.y = 180;
              if (state.vidaAtual <= 0) {
                state.estadoAtual = EstadoJogo.GAMEOVER;
                soundManager.playHeroHurt();
              }
            }
          );

          // 2. Atualizar Bumerangue das Marés em voo
          atualizarBumerangue(
            state.bumerangueAnim,
            state.heroi,
            dung,
            state.dungeonSalaAtualId,
            state,
            dt
          );

          // 3. Atualizar Inimigos da Sala (Sapo-Lodo e Libélula Turva)
          const salaAtual = dung.salas[state.dungeonSalaAtualId];
          if (salaAtual && salaAtual.inimigos && salaAtual.inimigos.length > 0) {
            atualizarInimigosAguasTurvas(
              salaAtual.inimigos,
              state.heroi,
              dt,
              state
            );
          }

          // 4. Chefe Marejante (na Sala-Chefe: Covil do Marejante)
          if (state.dungeonSalaAtualId === 'aguas_chefe_marejante') {
            state.chefeMarejante.ativo = true;
            atualizarChefeMarejante(state, dt);
            atualizarProjeteisAgua(state.projeteisAgua, state.heroi, state, dt);

            // Dano de espada contínuo durante o golpe se o chefe estiver emerso
            if (state.heroi.atacando && state.heroi.ataqueHitbox) {
              aplicarDanoChefeMarejante(state);
            }
          }

          // 5. Renderização completa da dungeon
          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          renderDungeonAguasTurvas(ctx, dung, state, state.tituloTimer);
          renderizarCargaEspada(ctx, heroi, state.tituloTimer);

          if (state.bumerangueAnim && state.bumerangueAnim.ativo) {
            renderizarBumerangue(ctx, state.bumerangueAnim, 0, 0);
          }
        } else if (state.dungeonTipoAtivo === 'covil_afogado') {
          // ===================================================================
          // CATACUMBA SECRETA: COVIL AFOGADO (CHARCO SOMBRIO)
          // ===================================================================
          const covil = covilAfogadoRef.current;

          // Física da catacumba (salas, ilhas de pedra, esferas de cristal, portas trancadas)
          atualizarFisicaCovilAfogado(covil, state, dt, () => {
            // Saída do Covil Afogado para o Charco Sombrio (Ilhota Nordeste: Tela [2,0])
            state.estadoAtual = EstadoJogo.OVERWORLD;
            state.regiaoAtual = 'charco';
            state.telaAtualX = 2;
            state.telaAtualY = 0;
            state.heroi.x = 724;
            state.heroi.y = 88;
            state.heroi.direcao = 'baixo';
            const maxCamX = Math.max(0, state.mapaLargura - LOGICAL_WIDTH);
            const maxCamY = Math.max(0, state.mapaAltura - LOGICAL_HEIGHT);
            state.camera.x = Math.max(0, Math.min(state.heroi.x + 8 - LOGICAL_WIDTH / 2, maxCamX));
            state.camera.y = Math.max(0, Math.min(state.heroi.y + 8 - LOGICAL_HEIGHT / 2, maxCamY));
            state.transicaoFadeTimer = 0.3;
            state.obstaculos = getCharcoObstaculos(state.alavancaCharcoPonteAtivada);
            soundManager.playDoorOpen();
          });

          // Atualizar Bumerangue se em voo na Catacumba
          if (state.bumerangueAnim && state.bumerangueAnim.ativo) {
            const salaAtual = covil.salas[covil.salaAtualId];
            const obsCovil = salaAtual ? salaAtual.obstaculos : [];
            atualizarBumerangueGlobal(
              state.bumerangueAnim,
              state.heroi,
              salaAtual ? salaAtual.inimigos : undefined,
              obsCovil,
              state,
              dt,
              {
                onAtivarAlavanca: () => {
                  if (covil.salaAtualId === 'covil_sala_puzzles' && !covil.alavancaRemotaAtivada) {
                    covil.alavancaRemotaAtivada = true;
                    soundManager.playLeverSwitch();
                    soundManager.playDoorOpen();
                    state.notificacaoTexto = 'SISTEMA DE DRENAGEM ATIVADO!';
                    state.notificacaoTimer = 2.5;
                  }
                },
              }
            );
          }

          // Renderização completa da catacumba
          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          renderizarCovilAfogado(ctx, covil, state, state.tituloTimer);
          renderizarCargaEspada(ctx, heroi, state.tituloTimer);

          if (state.bumerangueAnim && state.bumerangueAnim.ativo) {
            renderizarBumerangue(ctx, state.bumerangueAnim, 0, 0);
          }
        } else if (state.dungeonTipoAtivo === 'gelo_eterno') {
          // ===================================================================
          // SANTUÁRIO DO GELO ETERNO (TERRAS GELADAS)
          // ===================================================================
          atualizarSantuarioGeloEterno(state, dt);

          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          renderizarSantuarioGeloEterno(ctx, state);

          // Renderizar o Herói Ren
          renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);

          renderizarEspada(ctx, heroi);
          renderizarCargaEspada(ctx, heroi, state.tituloTimer);
          renderizarParticulas(ctx, state.particulas);
        } else if (state.dungeonTipoAtivo === 'santuario_chamas') {
          // ===================================================================
          // SANTUÁRIO DAS CHAMAS (DESERTO DE KAAL - REGIÃO 4)
          // ===================================================================
          atualizarSantuarioChamas(state, dt);

          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          renderizarSantuarioChamas(ctx, state);

          // Renderizar o Herói Ren
          renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);

          renderizarEspada(ctx, heroi);
          renderizarCargaEspada(ctx, heroi, state.tituloTimer);
          renderizarParticulas(ctx, state.particulas);
        } else if (state.dungeonTipoAtivo === 'tumba_enterrada') {
          // ===================================================================
          // CATACUMBA OPCIONAL: TUMBA ENTERRADA (DESERTO DE KAAL)
          // ===================================================================
          atualizarTumbaEnterrada(state, dt);

          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          renderizarTumbaEnterrada(ctx, state);

          // Renderizar o Herói Ren
          renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);

          renderizarEspada(ctx, heroi);
          renderizarCargaEspada(ctx, heroi, state.tituloTimer);
          renderizarParticulas(ctx, state.particulas);
        } else if (state.dungeonTipoAtivo === 'caverna_cristal') {
          // ===================================================================
          // CATACUMBA OPCIONAL: CAVERNA DE CRISTAL (TERRAS GELADAS)
          // ===================================================================
          const caverna = cavernaCristalRef.current;
          const salaAtual = caverna.salas[caverna.salaAtualId];
          const obsCristal = salaAtual ? salaAtual.obstaculos : [];
          const limitesCristal = { minX: 16, maxX: 240, minY: 16, maxY: 208 };
          atualizarHeroiCombate(heroi, dt, obsCristal, limitesCristal);

          atualizarCavernaCristal(caverna, state, dt, () => {
            // Callback de saída da Caverna de Cristal para Terras Geladas (Tela [2, 2])
            state.estadoAtual = EstadoJogo.OVERWORLD;
            state.regiaoAtual = 'geladas';
            state.telaAtualX = 2;
            state.telaAtualY = 2;
            heroi.x = 640;
            heroi.y = 510;
            heroi.direcao = 'baixo';
            const maxCamX = Math.max(0, state.mapaLargura - LOGICAL_WIDTH);
            const maxCamY = Math.max(0, state.mapaAltura - LOGICAL_HEIGHT);
            state.camera.x = Math.max(0, Math.min(heroi.x + 8 - LOGICAL_WIDTH / 2, maxCamX));
            state.camera.y = Math.max(0, Math.min(heroi.y + 8 - LOGICAL_HEIGHT / 2, maxCamY));
            state.transicaoFadeTimer = 0.3;
            soundManager.playDoorOpen();
          });

          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          renderizarCavernaCristal(ctx, caverna, state, state.tituloTimer);
          renderizarHeroiRen(ctx, heroi, !!heroi.andando, state.tituloTimer);
          renderizarEspada(ctx, heroi);
          renderizarCargaEspada(ctx, heroi, state.tituloTimer);
          renderizarParticulas(ctx, state.particulas);
        } else {
          // Atualização da física da dungeon (salas, portas trancadas, pontes, alavancas, baús, transições)
          atualizarFisicaDungeon(dungeonRef.current, state, dt, () => {
            // Callback de saída da Dungeon para o Vale Verdejante (porta sul da Sala 1)
            state.estadoAtual = EstadoJogo.OVERWORLD;
            state.heroi.x = 376;
            state.heroi.y = 48;
            state.heroi.direcao = 'baixo';
            state.camera.x = 376 + 8 - LOGICAL_WIDTH / 2;
            state.camera.y = 48 + 8 - LOGICAL_HEIGHT / 2;
            state.transicaoFadeTimer = 0.3;
            soundManager.playDoorOpen();
          });

          // Renderização da sala da dungeon (sem scroll dentro da sala, corte de sala fixa 256x224)
          ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
          renderDungeon(ctx, dungeonRef.current, state, state.tituloTimer);
          renderizarCargaEspada(ctx, heroi, state.tituloTimer);

          // Renderizar o Gancho de Vinha em ação na Dungeon
          renderizarGancho(ctx, state, 0, 0);
        }
      }

      // Decrementa temporizador de notificação visual
      if (state.notificacaoTimer && state.notificacaoTimer > 0) {
        state.notificacaoTimer = Math.max(0, state.notificacaoTimer - dt);
        if (state.notificacaoTimer <= 0) {
          state.notificacaoTexto = undefined;
        }
      }

      // Renderizar HUD em coordenadas de tela fixas (OVERWORLD, DUNGEON e PAUSA)
      if (
        state.estadoAtual === EstadoJogo.OVERWORLD ||
        state.estadoAtual === EstadoJogo.DUNGEON ||
        state.estadoAtual === EstadoJogo.PAUSA
      ) {
        renderHUD(ctx, state);
      }

      // Banner de notificação visual ao coletar itens especiais
      if (state.notificacaoTexto && state.notificacaoTimer && state.notificacaoTimer > 0) {
        const bannerW = 164;
        const bannerH = 16;
        const bannerX = Math.round((LOGICAL_WIDTH - bannerW) / 2);
        const bannerY = 28;

        ctx.fillStyle = 'rgba(8, 13, 22, 0.92)';
        ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        ctx.strokeRect(bannerX + 0.5, bannerY + 0.5, bannerW - 1, bannerH - 1);

        ctx.font = 'bold 7px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fef08a';
        ctx.fillText(`★ ${state.notificacaoTexto} ★`, bannerX + bannerW / 2, bannerY + bannerH / 2);
      }

      // Renderizar Caixa de Diálogo (Escriba Ivo / NPCs) se ativa
      if (state.dialogoAtivo && state.dialogoAtivo.ativo) {
        renderCaixaDialogo(ctx, state.dialogoAtivo, state.tituloTimer);
      }

      // Renderizar Interface de Loja (Empório de Juncoturvo) se ativa
      if (state.lojaAtiva && state.lojaAtiva.ativa) {
        renderInterfaceLoja(ctx, state.lojaAtiva, state.selos, state.tituloTimer);
      }

      // Se estiver em PAUSA, renderiza o menu de pausa sobreposto (60% escuro + opções ou subtela)
      if (state.estadoAtual === EstadoJogo.PAUSA) {
        renderMenuPausa(ctx, state);
      }

      // Se estiver em GAMEOVER, renderiza a tela de derrota
      if (state.estadoAtual === EstadoJogo.GAMEOVER) {
        renderGameOver(ctx, state.tituloTimer);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Helper para controles virtuais de toque/mouse
  const setVirtualKey = (code: string, pressed: boolean) => {
    handleGameInput(code, pressed);
  };

  // Funções utilitárias para testes/demonstrações rápidas
  const restartSplash = () => {
    gameStateRef.current.estadoAtual = EstadoJogo.SPLASH;
    gameStateRef.current.splashTimer = 0;
    gameStateRef.current.tituloTimer = 0;
    gameStateRef.current.tituloSubmenuAberto = false;
    gameStateRef.current.tituloTelaOpcoes = false;
  };

  const restartCinematica = () => {
    gameStateRef.current.estadoAtual = EstadoJogo.CINEMATICA;
    gameStateRef.current.cinematicaTimer = 0;
    gameStateRef.current.cinematicaQuadro = 0;
    gameStateRef.current.cinematicaQuadroTimer = 0;
  };

  const togglePause = () => {
    const s = gameStateRef.current;
    if (s.estadoAtual === EstadoJogo.PAUSA) {
      s.estadoAtual = s.estadoAnterior || EstadoJogo.OVERWORLD;
      s.pausaSubtela = 'menu';
    } else if (
      s.estadoAtual === EstadoJogo.OVERWORLD ||
      s.estadoAtual === EstadoJogo.DUNGEON
    ) {
      s.estadoAnterior = s.estadoAtual;
      s.estadoAtual = EstadoJogo.PAUSA;
      s.pausaMenuIndex = 0;
      s.pausaSubtela = 'menu';
    }
  };

  const causarDanoTeste = () => {
    const s = gameStateRef.current;
    s.vidaAtual = Math.max(0, s.vidaAtual - 1);
  };

  const curarVidaTeste = () => {
    const s = gameStateRef.current;
    s.vidaAtual = Math.min(s.vidaMax, s.vidaAtual + 1);
  };

  const gastarArcanoTeste = () => {
    const s = gameStateRef.current;
    s.arcanoAtual = Math.max(0, s.arcanoAtual - 5);
  };

  const alternarItemTeste = () => {
    const s = gameStateRef.current;
    const itensDisponiveis: (ItemSecundarioId | null)[] = [
      null,
      'gancho_vinha',
      'bumerangue_mares',
      'botas_glaciais',
      'manopla_ignea',
      'talisma_terra',
      'lanterna_sombras',
    ];
    const currentIndex = itensDisponiveis.indexOf(s.itemEquipado);
    const nextIndex = (currentIndex + 1) % itensDisponiveis.length;
    s.itemEquipado = itensDisponiveis[nextIndex];
  };

  const warpParaPonte = () => {
    const s = gameStateRef.current;
    s.heroi.x = 440;
    s.heroi.y = 336;
    s.heroi.direcao = 'direita';
    s.telaAtualX = 1;
    s.telaAtualY = 1;
    s.transicaoFadeTimer = 0.3;
  };

  const warpParaColetavel = () => {
    const s = gameStateRef.current;
    s.heroi.x = 590;
    s.heroi.y = 336;
    s.heroi.direcao = 'direita';
    s.telaAtualX = 2;
    s.telaAtualY = 1;
    s.transicaoFadeTimer = 0.3;
  };

  const warpParaForja = () => {
    const s = gameStateRef.current;
    s.heroi.x = 550;
    s.heroi.y = 90;
    s.heroi.direcao = 'direita';
    s.telaAtualX = 2;
    s.telaAtualY = 0;
    s.transicaoFadeTimer = 0.3;
  };

  const warpParaInicio = () => {
    const s = gameStateRef.current;
    s.heroi.x = 376;
    s.heroi.y = 540;
    s.heroi.direcao = 'cima';
    s.telaAtualX = 1;
    s.telaAtualY = 2;
    s.transicaoFadeTimer = 0.3;
  };

  const entrarSantuarioTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonSalaAtualId = 'sala_1_2_atrio';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.15;
    soundManager.playDoorOpen();
  };

  const sairSantuarioTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.OVERWORLD;
    s.heroi.x = 376;
    s.heroi.y = 64;
    s.heroi.direcao = 'baixo';
    s.camera.x = 376 + 8 - LOGICAL_WIDTH / 2;
    s.camera.y = 64 + 8 - LOGICAL_HEIGHT / 2;
    s.transicaoFadeTimer = 0.3;
    soundManager.playDoorOpen();
  };

  const resetarDungeonTeste = () => {
    dungeonRef.current = criarDungeonTesteSantuario();
    const s = gameStateRef.current;
    s.dungeonSalaAtualId = 'sala_1_2_atrio';
    s.dungeonChavesPequenas = 0;
    s.dungeonTemChaveChefe = false;
    s.dungeonItemObtido = undefined;
    s.chefeRaizarca = criarChefeRaizarcaInicial();
    s.projeteis = [];
    s.particulas = [];
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.notificacaoTexto = 'DUNGEON REINICIADA!';
    s.notificacaoTimer = 2;
  };

  const irParaChefeTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonSalaAtualId = 'sala_1_0_chefe';
    s.chefeRaizarca = criarChefeRaizarcaInicial();
    s.projeteis = [];
    s.particulas = [];
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.15;
    s.notificacaoTexto = 'COVIL DE RAIZARCA!';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const atacarEspadaTeste = () => {
    dispararGolpeEspada(gameStateRef.current.heroi);
  };

  const darChavePequenaTeste = () => {
    const s = gameStateRef.current;
    s.dungeonChavesPequenas += 1;
    soundManager.playKeyCollect();
  };

  const darChaveChefeTeste = () => {
    const s = gameStateRef.current;
    s.dungeonTemChaveChefe = true;
    soundManager.playItemGet();
  };

  const equiparGanchoTeste = () => {
    const s = gameStateRef.current;
    s.itemEquipado = 'gancho_vinha';
    soundManager.playMenuSelect();
    s.notificacaoTexto = 'GANCHO DE VINHA EQUIPADO [X]';
    s.notificacaoTimer = 2;
  };

  const warpParaIlhaBosque = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.OVERWORLD;
    s.itemEquipado = 'gancho_vinha';
    s.heroi.x = 160;
    s.heroi.y = 328;
    s.heroi.direcao = 'esquerda';
    s.telaAtualX = 0;
    s.telaAtualY = 1;
    s.camera.x = Math.max(0, Math.min(s.heroi.x + 8 - LOGICAL_WIDTH / 2, s.mapaLargura - LOGICAL_WIDTH));
    s.camera.y = Math.max(0, Math.min(s.heroi.y + 8 - LOGICAL_HEIGHT / 2, s.mapaAltura - LOGICAL_HEIGHT));
    s.transicaoFadeTimer = 0.3;
    s.notificacaoTexto = 'VÃO 3-TILES & GANCHO DE VINHA!';
    s.notificacaoTimer = 2.5;
  };

  const irParaFossoDungeon = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonSalaAtualId = 'sala_2_1_fosso';
    s.itemEquipado = 'gancho_vinha';
    s.heroi.x = 48;
    s.heroi.y = 80;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.15;
    s.notificacaoTexto = 'SALA DO FOSSO & ALAVANCA!';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const irParaArvoreCripta = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.OVERWORLD;
    s.heroi.x = 80;
    s.heroi.y = 136;
    s.heroi.direcao = 'cima';
    s.telaAtualX = 0;
    s.telaAtualY = 0;
    s.camera.x = 0;
    s.camera.y = 0;
    s.transicaoFadeTimer = 0.3;
    s.notificacaoTexto = 'CLAREIRA DA CRIPTA (SEGURE [Z] POR 1s)';
    s.notificacaoTimer = 3.0;
  };

  const irParaCriptaSala1 = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'cripta';
    s.arvoreCriptaDestruida = true;
    s.obstaculos = getValeObstaculos(true);
    criptaRef.current.salaAtualId = 'cripta_sala_1_puzzle';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    criptaRef.current.transicaoTimer = 0.25;
    soundManager.playDoorOpen();
    s.notificacaoTexto = 'CRIPTA: SALA 1 (PUZZLE DE 2 BLOCOS)';
    s.notificacaoTimer = 2.5;
  };

  const irParaCavernaCristal = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'caverna_cristal';
    cavernaCristalRef.current.salaAtualId = 'cristal_sala_1';
    s.itemEquipado = 'botas_glaciais';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    cavernaCristalRef.current.transicaoTimer = 0.25;
    soundManager.playDoorOpen();
  };

  const irParaCriptaSala2 = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'cripta';
    s.arvoreCriptaDestruida = true;
    s.obstaculos = getValeObstaculos(true);
    criptaRef.current.salaAtualId = 'cripta_sala_2_combate';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    criptaRef.current.transicaoTimer = 0.25;
    soundManager.playDoorOpen();
    s.notificacaoTexto = 'CRIPTA: SALA 2 (4 ESPINHOS + 2 VAGALUMES)';
    s.notificacaoTimer = 2.5;
  };

  const irParaCriptaSala3 = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'cripta';
    s.arvoreCriptaDestruida = true;
    s.obstaculos = getValeObstaculos(true);
    criptaRef.current.salaAtualId = 'cripta_sala_3_recompensa';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    criptaRef.current.transicaoTimer = 0.25;
    soundManager.playDoorOpen();
    s.notificacaoTexto = 'CRIPTA: SALA 3 (BAÚ DO GUARDIÃO)';
    s.notificacaoTimer = 2.5;
  };

  const irParaCovilAfogadoTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'covil_afogado';
    covilAfogadoRef.current.salaAtualId = 'covil_entrada';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.2;
    s.itemEquipado = 'bumerangue_mares';
    s.itensSecundariosObtidos.bumerangue_mares = true;
    s.notificacaoTexto = 'CATACUMBA: COVIL AFOGADO';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const irParaCovilPuzzlesTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'covil_afogado';
    covilAfogadoRef.current.salaAtualId = 'covil_sala_puzzles';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.2;
    s.itemEquipado = 'bumerangue_mares';
    s.itensSecundariosObtidos.bumerangue_mares = true;
    s.notificacaoTexto = 'SALA DOS CRISTAIS & ALAVANCA REMOTA';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const irParaCovilBauTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'covil_afogado';
    covilAfogadoRef.current.salaAtualId = 'covil_sala_bau_secreto';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.2;
    s.itemEquipado = 'bumerangue_mares';
    s.itensSecundariosObtidos.bumerangue_mares = true;
    s.notificacaoTexto = 'CÂMARA DO BAÚ SECRETO';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const irParaOverworldAlavancaCovil = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.OVERWORLD;
    s.regiaoAtual = 'charco';
    s.telaAtualX = 2;
    s.telaAtualY = 0;
    s.heroi.x = 620;
    s.heroi.y = 110;
    s.heroi.direcao = 'direita';
    s.camera.x = 768 - LOGICAL_WIDTH;
    s.camera.y = 0;
    s.itemEquipado = 'bumerangue_mares';
    s.itensSecundariosObtidos.bumerangue_mares = true;
    s.obstaculos = getCharcoObstaculos(s.alavancaCharcoPonteAtivada);
    s.notificacaoTexto = 'CANAL DO COVIL AFOGADO [LANCE O BUMERANGUE DA MARGEM (X)]';
    s.notificacaoTimer = 3.5;
  };

  const entrarSantuarioAguasTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'aguas_turvas';
    s.dungeonSalaAtualId = 'aguas_entrada';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.2;
    s.itemEquipado = 'bumerangue_mares';
    s.itensSecundariosObtidos.bumerangue_mares = true;
    s.notificacaoTexto = 'SANTUÁRIO DAS ÁGUAS TURVAS';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const irParaPuzzlePlataformasTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'aguas_turvas';
    s.dungeonSalaAtualId = 'aguas_puzzle_1';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.2;
    s.notificacaoTexto = 'PUZZLE 1: PLATAFORMAS QUE AFUNDAM';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const irParaPuzzleAlavancaTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'aguas_turvas';
    s.dungeonSalaAtualId = 'aguas_puzzle_2';
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.2;
    s.itemEquipado = 'bumerangue_mares';
    s.itensSecundariosObtidos.bumerangue_mares = true;
    s.notificacaoTexto = 'PUZZLE 2: ALAVANCA REMOTA [X]';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const irParaChefeMarejanteTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'aguas_turvas';
    s.dungeonSalaAtualId = 'aguas_chefe_marejante';
    s.chefeMarejante = criarChefeMarejanteInicial();
    s.chefeMarejante.ativo = true;
    s.projeteisAgua = [];
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    s.dungeonTransicaoTimer = 0.2;
    s.itemEquipado = 'bumerangue_mares';
    s.itensSecundariosObtidos.bumerangue_mares = true;
    s.notificacaoTexto = 'COVIL DO MAREJANTE!';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const equiparBumerangueTeste = () => {
    const s = gameStateRef.current;
    s.itemEquipado = 'bumerangue_mares';
    s.itensSecundariosObtidos.bumerangue_mares = true;
    soundManager.playMenuSelect();
    s.notificacaoTexto = 'BUMERANGUE DAS MARÉS EQUIPADO [X]';
    s.notificacaoTimer = 2.0;
  };

  const golpearCarregadoTeste = () => {
    const s = gameStateRef.current;
    dispararGolpeEspada(s.heroi, true);
    if (
      s.estadoAtual === EstadoJogo.OVERWORLD &&
      !s.arvoreCriptaDestruida &&
      s.telaAtualX === 0 &&
      s.telaAtualY === 0
    ) {
      const arvoreCaixa: Retangulo = {
        x: ARVORE_CRIPTA.x + 6,
        y: ARVORE_CRIPTA.y + 12,
        w: 20,
        h: 20,
      };
      if (s.heroi.ataqueHitbox && checkAABB(s.heroi.ataqueHitbox, arvoreCaixa)) {
        s.arvoreCriptaDestruida = true;
        s.obstaculos = getValeObstaculos(true);
        soundManager.playObstacleBreak();
        gerarExplosaoParticulas(s.particulas, ARVORE_CRIPTA.x + 16, ARVORE_CRIPTA.y + 16, '#8b5a2b', 14);
        gerarExplosaoParticulas(s.particulas, ARVORE_CRIPTA.x + 16, ARVORE_CRIPTA.y + 16, '#10b981', 10);
        gerarExplosaoParticulas(s.particulas, ARVORE_CRIPTA.x + 16, ARVORE_CRIPTA.y + 16, '#38bdf8', 8);
        s.notificacaoTexto = 'ÁRVORE ANCESTRAL DESTRUÍDA! CRIPTA REVELADA';
        s.notificacaoTimer = 3.0;
      }
    }
  };

  const warpParaCharcoSombrio = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.OVERWORLD;
    s.regiaoAtual = 'charco';
    s.obstaculos = getCharcoObstaculos();
    s.heroi.x = 376;
    s.heroi.y = 336; // Em frente à doca e Escriba Ivo em Juncoturvo
    s.heroi.direcao = 'baixo';
    s.telaAtualX = 1;
    s.telaAtualY = 1;
    s.camera.x = Math.max(0, Math.min(s.heroi.x + 8 - LOGICAL_WIDTH / 2, s.mapaLargura - LOGICAL_WIDTH));
    s.camera.y = Math.max(0, Math.min(s.heroi.y + 8 - LOGICAL_HEIGHT / 2, s.mapaAltura - LOGICAL_HEIGHT));
    s.transicaoFadeTimer = 0.35;
    s.notificacaoTexto = 'CHARCO SOMBRIO • JUNCOTURVO';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const abrirDialogoIvoTeste = () => {
    const s = gameStateRef.current;
    s.dialogoAtivo = {
      ativo: true,
      npcNome: NPC_ESCRIBA_IVO.nome,
      npcCargo: NPC_ESCRIBA_IVO.cargo,
      falas: NPC_ESCRIBA_IVO.falas,
      falaAtualIndex: 0,
      caracteresVisiveis: 0,
      timerTypewriter: 0,
      falaConcluida: false,
    };
    soundManager.playMenuSelect();
  };

  const abrirLojaJuncoTeste = () => {
    const s = gameStateRef.current;
    s.lojaAtiva = {
      ativa: true,
      nomeLoja: 'Empório de Juncoturvo',
      itemSelecionadoIndex: 0,
      itens: LOJA_JUNCO_ITENS,
    };
    soundManager.playMenuSelect();
  };

  const warpParaTerrasGeladas = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.OVERWORLD;
    s.regiaoAtual = 'geladas';
    s.obstaculos = getGeladasObstaculos();
    s.heroi.x = 376;
    s.heroi.y = 330; // Perto da fogueira em Vilarejo Gélida
    s.heroi.direcao = 'baixo';
    s.telaAtualX = 1;
    s.telaAtualY = 1;
    s.camera.x = Math.max(0, Math.min(s.heroi.x + 8 - LOGICAL_WIDTH / 2, s.mapaLargura - LOGICAL_WIDTH));
    s.camera.y = Math.max(0, Math.min(s.heroi.y + 8 - LOGICAL_HEIGHT / 2, s.mapaAltura - LOGICAL_HEIGHT));
    s.transicaoFadeTimer = 0.35;
    s.notificacaoTexto = 'TERRAS GELADAS • VILAREJO GÉLIDA';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const warpParaLanternaNeveTeste = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.OVERWORLD;
    s.regiaoAtual = 'geladas';
    s.obstaculos = getGeladasObstaculos();
    s.heroi.x = 80;
    s.heroi.y = 540; // Perto da Lanterna Perdida
    s.heroi.direcao = 'esquerda';
    s.telaAtualX = 0;
    s.telaAtualY = 2;
    s.camera.x = Math.max(0, Math.min(s.heroi.x + 8 - LOGICAL_WIDTH / 2, s.mapaLargura - LOGICAL_WIDTH));
    s.camera.y = Math.max(0, Math.min(s.heroi.y + 8 - LOGICAL_HEIGHT / 2, s.mapaAltura - LOGICAL_HEIGHT));
    s.transicaoFadeTimer = 0.35;
    s.notificacaoTexto = 'LANTERNA PERDIDA NA NEVE';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const equiparBotasGlaciaisTeste = () => {
    const s = gameStateRef.current;
    s.itemEquipado = 'botas_glaciais';
    s.itensSecundariosObtidos.botas_glaciais = true;
    soundManager.playMenuSelect();
    s.notificacaoTexto = 'BOTAS DE PASSO GLACIAL EQUIPADAS [X]';
    s.notificacaoTimer = 2.0;
  };

  const irParaSantuarioGeloEterno = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'gelo_eterno';
    (s as any).dungeonGeloState = criarDungeonGeloEternoInicial();
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    soundManager.playDoorOpen();
    s.notificacaoTexto = 'SANTUÁRIO DO GELO ETERNO';
    s.notificacaoTimer = 2.5;
  };

  const irParaChefeGlacius = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'gelo_eterno';
    const dung = criarDungeonGeloEternoInicial();
    dung.salaAtualId = 'sala_6_chefe';
    (s as any).dungeonGeloState = dung;
    s.chefeGlacius = criarChefeGlaciusInicial();
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    soundManager.playDoorOpen();
    s.notificacaoTexto = 'ARENA DE GLACIUS, O GUARDIÃO GLACIAL';
    s.notificacaoTimer = 2.5;
  };

  const warpParaDesertoKaal = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.OVERWORLD;
    s.regiaoAtual = 'kaal';
    s.obstaculos = OBSTACULOS_DESERTO_KAAL;
    s.heroi.x = 380;
    s.heroi.y = 300;
    s.heroi.direcao = 'baixo';
    s.telaAtualX = 1;
    s.telaAtualY = 1;
    s.camera.x = Math.max(0, Math.min(s.heroi.x + 8 - LOGICAL_WIDTH / 2, s.mapaLargura - LOGICAL_WIDTH));
    s.camera.y = Math.max(0, Math.min(s.heroi.y + 8 - LOGICAL_HEIGHT / 2, s.mapaAltura - LOGICAL_HEIGHT));
    s.transicaoFadeTimer = 0.35;
    s.notificacaoTexto = 'DESERTO DE KAAL • OÁSIS DE KAAL';
    s.notificacaoTimer = 2.5;
    soundManager.playDoorOpen();
  };

  const equiparManoplaIgneaTeste = () => {
    const s = gameStateRef.current;
    s.itemEquipado = 'manopla_ignea';
    s.itensSecundariosObtidos.manopla_ignea = true;
    soundManager.playMenuSelect();
    s.notificacaoTexto = 'MANOPLA ÍGNEA EQUIPADA [X]';
    s.notificacaoTimer = 2.0;
  };

  const irParaSantuarioChamas = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'santuario_chamas';
    (s as any).santuarioChamasState = criarDungeonChamasInicial();
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    soundManager.playDoorOpen();
    s.notificacaoTexto = 'SANTUÁRIO DAS CHAMAS';
    s.notificacaoTimer = 2.5;
  };

  const irParaChefeAshra = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'santuario_chamas';
    const dung = criarDungeonChamasInicial();
    dung.salaAtualId = 'sala_6_chefe';
    (s as any).santuarioChamasState = dung;
    s.ashraBossState = criarChefeAshraInicial();
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    soundManager.playDoorOpen();
    s.notificacaoTexto = 'ARENA DE ASHRA, O ESPÍRITO DO FOGO';
    s.notificacaoTimer = 2.5;
  };

  const irParaTumbaEnterrada = () => {
    const s = gameStateRef.current;
    s.estadoAtual = EstadoJogo.DUNGEON;
    s.dungeonTipoAtivo = 'tumba_enterrada';
    (s as any).tumbaEnterradaState = criarTumbaEnterradaInicial();
    s.heroi.x = 120;
    s.heroi.y = 180;
    s.heroi.direcao = 'cima';
    soundManager.playDoorOpen();
    s.notificacaoTexto = 'CATACUMBA: TUMBA ENTERRADA';
    s.notificacaoTimer = 2.5;
  };

  const adicionarSelosTeste = () => {
    const s = gameStateRef.current;
    s.selos += 50;
    soundManager.playItemGet();
    s.notificacaoTexto = '+50 SELOS ADICIONADOS!';
    s.notificacaoTimer = 1.8;
  };

  const abrirMapaPausaTeste = () => {
    const s = gameStateRef.current;
    if (s.estadoAtual !== EstadoJogo.PAUSA) {
      s.estadoAnterior = s.estadoAtual;
      s.estadoAtual = EstadoJogo.PAUSA;
    }
    s.pausaMenuIndex = 0;
    s.pausaSubtela = 'mapa';
    soundManager.playMenuSelect();
  };

  const abrirInventarioPausaTeste = () => {
    const s = gameStateRef.current;
    if (s.estadoAtual !== EstadoJogo.PAUSA) {
      s.estadoAnterior = s.estadoAtual;
      s.estadoAtual = EstadoJogo.PAUSA;
    }
    s.pausaMenuIndex = 1;
    s.pausaSubtela = 'inventario';
    soundManager.playMenuSelect();
  };

  return (
    <div
      ref={containerRef}
      id="game-container"
      className="relative flex flex-col items-center justify-center w-full h-full min-h-screen bg-[#0d1117] text-slate-200 select-none overflow-hidden p-2"
    >
      {/* Moldura do Canvas com Escala Inteira Exata */}
      <div
        id="canvas-frame"
        className="relative flex items-center justify-center bg-black rounded-sm shadow-2xl border border-slate-800"
        style={{
          width: `${LOGICAL_WIDTH * scale}px`,
          height: `${LOGICAL_HEIGHT * scale}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          id="eldrim-canvas"
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          onClick={() => {
            handleGameInput('KeyZ', true);
            setTimeout(() => handleGameInput('KeyZ', false), 50);
          }}
          style={{
            width: `${LOGICAL_WIDTH * scale}px`,
            height: `${LOGICAL_HEIGHT * scale}px`,
            imageRendering: 'pixelated',
          }}
          className="block cursor-pointer"
        />

        {/* Informação sutil da escala no canto superior */}
        <div
          id="scale-badge"
          className="absolute top-2 right-2 text-[10px] font-mono bg-black/70 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/60 pointer-events-none"
        >
          {scale}x ({LOGICAL_WIDTH * scale}x{LOGICAL_HEIGHT * scale})
        </div>
      </div>

      {/* Barra de controle inferior informativa e botões de apoio */}
      <div
        id="controls-info-bar"
        className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400"
      >
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
          <span className="text-slate-500">Mover:</span>
          <span className="text-slate-200 font-semibold">WASD / Setas</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
          <span className="text-slate-500">Ação/Confirmar:</span>
          <span className="text-slate-200 font-semibold">Z</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
          <span className="text-slate-500">Secundário:</span>
          <span className="text-slate-200 font-semibold">X</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded border border-slate-800">
          <span className="text-slate-500">Pausa/Menu:</span>
          <span className="text-slate-200 font-semibold">Enter</span>
        </div>
        <button
          id="btn-replay-splash"
          type="button"
          onClick={restartSplash}
          className="flex items-center gap-1 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 px-2.5 py-1.5 rounded border border-amber-800/60 transition cursor-pointer text-[11px]"
          title="Ver animação da Splash Screen novamente"
        >
          <span>↺</span> Ver Splash
        </button>
        <button
          id="btn-replay-cinematica"
          type="button"
          onClick={restartCinematica}
          className="flex items-center gap-1 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 px-2.5 py-1.5 rounded border border-sky-800/60 transition cursor-pointer text-[11px]"
          title="Ver os 5 quadros narrativos da cinemática"
        >
          <span>▶</span> Ver Cinemática
        </button>
      </div>

      {/* Painel de Testes do HUD e Menu de Pausa */}
      <div
        id="hud-test-tools"
        className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <button
          id="btn-toggle-pause"
          type="button"
          onClick={togglePause}
          className="flex items-center gap-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 px-2.5 py-1 rounded border border-amber-600/40 transition cursor-pointer"
          title="Abrir ou fechar menu de pausa (Enter)"
        >
          <span>⏸</span> Pausar [ENTER]
        </button>
        <button
          id="btn-open-mapa"
          type="button"
          onClick={abrirMapaPausaTeste}
          className="flex items-center gap-1 bg-sky-950/60 hover:bg-sky-900/70 text-sky-300 px-2.5 py-1 rounded border border-sky-700/60 transition cursor-pointer"
          title="Abrir diretamente a subtela de Mapa com cartografia 9x8px e herói piscante"
        >
          <span>🗺</span> Subtela Mapa
        </button>
        <button
          id="btn-open-inventario"
          type="button"
          onClick={abrirInventarioPausaTeste}
          className="flex items-center gap-1 bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 px-2.5 py-1 rounded border border-indigo-700/60 transition cursor-pointer"
          title="Abrir diretamente o Inventário com itens secundários, bombas, itens-chave e 6 Relicários"
        >
          <span>🎒</span> Subtela Inventário
        </button>
        <button
          id="btn-add-selos"
          type="button"
          onClick={adicionarSelosTeste}
          className="flex items-center gap-1 bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 px-2 py-1 rounded border border-yellow-700/60 transition cursor-pointer"
          title="Adicionar +50 Selos para compras na loja"
        >
          <span>🪙</span> +50 Selos
        </button>
        <button
          id="btn-test-damage"
          type="button"
          onClick={causarDanoTeste}
          className="flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 px-2 py-1 rounded border border-rose-800/50 transition cursor-pointer"
          title="Reduzir 1 Fragmento de Vida para testar contorno"
        >
          <span>💔</span> -1 Vida
        </button>
        <button
          id="btn-test-heal"
          type="button"
          onClick={curarVidaTeste}
          className="flex items-center gap-1 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 px-2 py-1 rounded border border-emerald-800/50 transition cursor-pointer"
          title="Restaurar 1 Fragmento de Vida"
        >
          <span>💚</span> +1 Vida
        </button>
        <button
          id="btn-test-arcano"
          type="button"
          onClick={gastarArcanoTeste}
          className="flex items-center gap-1 bg-sky-950/40 hover:bg-sky-900/50 text-sky-300 px-2 py-1 rounded border border-sky-800/50 transition cursor-pointer"
          title="Consumir 5 de Fluxo Arcano para ver regeneração 5%/s"
        >
          <span>✨</span> -5 Arcano
        </button>
        <button
          id="btn-test-item"
          type="button"
          onClick={alternarItemTeste}
          className="flex items-center gap-1 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded border border-indigo-800/50 transition cursor-pointer"
          title="Alternar item secundário equipado (Gancho, Bumerangue, Botas, etc.)"
        >
          <span>⚔</span> Alternar Item [X]
        </button>
        <button
          id="btn-equip-gancho"
          type="button"
          onClick={equiparGanchoTeste}
          className="flex items-center gap-1 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 px-2 py-1 rounded border border-amber-800/50 transition cursor-pointer"
          title="Equipar imediatamente o Gancho de Vinha no slot [X]"
        >
          <span>⚓</span> Gancho [X]
        </button>
        <button
          id="btn-test-sword"
          type="button"
          onClick={atacarEspadaTeste}
          className="flex items-center gap-1 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 px-2.5 py-1 rounded border border-cyan-800/60 transition cursor-pointer"
          title="Golpear com a Lâmina de Eldrim (Hitbox 10x10px por 200ms) [Z]"
        >
          <span>🗡</span> Atacar [Z]
        </button>
        <button
          id="btn-test-charged-slash"
          type="button"
          onClick={golpearCarregadoTeste}
          className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1 rounded border border-amber-500/50 transition cursor-pointer font-bold"
          title="Desferir Golpe Carregado (2x dano, knockback 28px, destrói a Árvore Ancestral da Cripta)"
        >
          <span>⚡</span> Golpe Carregado [Segurar Z 1s]
        </button>
      </div>

      {/* Painel de Navegação Rápida no Vale Verdejante (3x3 Telas: 768x672px) */}
      <div
        id="vale-navigation-tools"
        className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <span>🗺</span> Vale 3x3:
        </span>
        <button
          id="btn-warp-arvore-cripta"
          type="button"
          onClick={irParaArvoreCripta}
          className="flex items-center gap-1 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded border border-emerald-600/70 transition cursor-pointer text-[11px]"
          title="Ir para a Clareira da Árvore Ancestral da Cripta (Tela [0,0])"
        >
          <span>🌳</span> Árvore Ancestral [0,0]
        </button>
        <button
          id="btn-warp-ponte"
          type="button"
          onClick={warpParaPonte}
          className="flex items-center gap-1 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 px-2 py-0.5 rounded border border-amber-800/50 transition cursor-pointer text-[11px]"
          title="Ir para a Ponte de Madeira de 32px (Tela [1,1])"
        >
          <span>🌉</span> Ponte 32px
        </button>
        <button
          id="btn-warp-coletavel"
          type="button"
          onClick={warpParaColetavel}
          className="flex items-center gap-1 bg-yellow-950/40 hover:bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded border border-yellow-800/50 transition cursor-pointer text-[11px]"
          title="Ir para o Coletável de Vida (+1 Vida Máxima) na Clareira Sagrada (Tela [2,1])"
        >
          <span>💎</span> Coletável de Vida
        </button>
        <button
          id="btn-warp-ilha"
          type="button"
          onClick={warpParaIlhaBosque}
          className="flex items-center gap-1 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/60 transition cursor-pointer text-[11px]"
          title="Teletransportar para o Vão de 3 Tiles e Ilha Secreta com Baú (Tela [0,1])"
        >
          <span>🏝</span> Vão & Ilha (Gancho)
        </button>
        <button
          id="btn-warp-forja"
          type="button"
          onClick={warpParaForja}
          className="flex items-center gap-1 bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50 transition cursor-pointer text-[11px]"
          title="Ir para o Rio Largo de 48px e Altar do Fragmento de Forja 1 (Tela [2,0])"
        >
          <span>🌊</span> Rio Largo 48px (Forja I)
        </button>
        <button
          id="btn-warp-inicio"
          type="button"
          onClick={warpParaInicio}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition cursor-pointer text-[11px]"
          title="Voltar ao Ponto de Início no Sul do Vale (Tela [1,2])"
        >
          <span>⛳</span> Entrada Sul
        </button>
      </div>

      {/* Painel de Navegação de Terras Geladas (Região 3: Vilarejo Gélida, Neve, Gelo Liso & Quest Guarda Kell) */}
      <div
        id="geladas-navigation-tools"
        className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <span className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
          <span>❄</span> Terras Geladas (Região 3):
        </span>
        <button
          id="btn-warp-geladas"
          type="button"
          onClick={warpParaTerrasGeladas}
          className="flex items-center gap-1 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-200 px-2.5 py-0.5 rounded border border-cyan-600/70 transition cursor-pointer text-[11px]"
          title="Teletransportar para a Fogueira do Vilarejo Gélida nas Terras Geladas"
        >
          <span>🔥</span> Ir a Vilarejo Gélida
        </button>
        <button
          id="btn-warp-lanterna"
          type="button"
          onClick={warpParaLanternaNeveTeste}
          className="flex items-center gap-1 bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 px-2.5 py-0.5 rounded border border-amber-700/60 transition cursor-pointer text-[11px]"
          title="Ir para o local da Lanterna Perdida na Neve (Tela [0,2])"
        >
          <span>🏮</span> Lanterna na Neve
        </button>
        <button
          id="btn-equip-botas"
          type="button"
          onClick={equiparBotasGlaciaisTeste}
          className="flex items-center gap-1 bg-blue-950/60 hover:bg-blue-900/70 text-blue-200 px-2.5 py-0.5 rounded border border-blue-600/60 transition cursor-pointer text-[11px]"
          title="Equipar Botas de Passo Glacial (Previne queda no Gelo Fino)"
        >
          <span>👢</span> Botas Glaciais
        </button>
        <button
          id="btn-caverna-cristal"
          type="button"
          onClick={irParaCavernaCristal}
          className="flex items-center gap-1 bg-cyan-900/80 hover:bg-cyan-800/90 text-cyan-100 px-2.5 py-0.5 rounded border border-cyan-500/80 transition cursor-pointer text-[11px]"
          title="Entrar na Catacumba Caverna de Cristal (3 salas, gelo fino, corujas e baú de vida)"
        >
          <span>💎</span> Caverna de Cristal
        </button>
        <button
          id="btn-santuario-gelo"
          type="button"
          onClick={irParaSantuarioGeloEterno}
          className="flex items-center gap-1 bg-sky-950/70 hover:bg-sky-900/80 text-sky-200 px-2.5 py-0.5 rounded border border-sky-600/70 transition cursor-pointer text-[11px]"
          title="Entrar no Santuário do Gelo Eterno (Dungeon da Região 3)"
        >
          <span>❄</span> Santuário do Gelo
        </button>
        <button
          id="btn-chefe-glacius"
          type="button"
          onClick={irParaChefeGlacius}
          className="flex items-center gap-1 bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 px-2.5 py-0.5 rounded border border-indigo-600/70 transition cursor-pointer text-[11px]"
          title="Teletransportar para a Arena do Chefe Glacius"
        >
          <span>👑</span> Chefe Glacius
        </button>
      </div>

      {/* Painel de Navegação do Deserto de Kaal (Região 4: Oásis, Santuário das Chamas, Manopla Ígnea & Chefe Ashra) */}
      <div
        id="kaal-navigation-tools"
        className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <span className="text-[11px] text-orange-400 font-semibold flex items-center gap-1">
          <span>🔥</span> Deserto de Kaal (Região 4):
        </span>
        <button
          id="btn-warp-kaal"
          type="button"
          onClick={warpParaDesertoKaal}
          className="flex items-center gap-1 bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 px-2.5 py-0.5 rounded border border-amber-600/70 transition cursor-pointer text-[11px]"
          title="Teletransportar para o Oásis de Kaal no Deserto"
        >
          <span>🌴</span> Oásis de Kaal
        </button>
        <button
          id="btn-equip-manopla"
          type="button"
          onClick={equiparManoplaIgneaTeste}
          className="flex items-center gap-1 bg-orange-950/70 hover:bg-orange-900/80 text-orange-200 px-2.5 py-0.5 rounded border border-orange-600/70 transition cursor-pointer text-[11px]"
          title="Equipar Manopla Ígnea (Empurra blocos vulcânicos e atiça chamas) [X]"
        >
          <span>🥊</span> Manopla Ígnea
        </button>
        <button
          id="btn-santuario-chamas"
          type="button"
          onClick={irParaSantuarioChamas}
          className="flex items-center gap-1 bg-red-950/70 hover:bg-red-900/80 text-red-200 px-2.5 py-0.5 rounded border border-red-600/70 transition cursor-pointer text-[11px]"
          title="Entrar no Santuário das Chamas (Dungeon de Kaal)"
        >
          <span>🏺</span> Santuário Chamas
        </button>
        <button
          id="btn-chefe-ashra"
          type="button"
          onClick={irParaChefeAshra}
          className="flex items-center gap-1 bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 px-2.5 py-0.5 rounded border border-rose-600/70 transition cursor-pointer text-[11px]"
          title="Teletransportar para a Arena do Chefe Ashra"
        >
          <span>🔥</span> Chefe Ashra
        </button>
        <button
          id="btn-tumba-enterrada"
          type="button"
          onClick={irParaTumbaEnterrada}
          className="flex items-center gap-1 bg-stone-900 hover:bg-stone-800 text-amber-300 px-2.5 py-0.5 rounded border border-amber-700/60 transition cursor-pointer text-[11px]"
          title="Entrar na Catacumba Opcional: Tumba Enterrada"
        >
          <span>🗿</span> Tumba Enterrada
        </button>
      </div>

      {/* Painel de Navegação e Interações do Charco Sombrio & Vilarejo Juncoturvo */}
      <div
        id="charco-navigation-tools"
        className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <span className="text-[11px] text-lime-400 font-semibold flex items-center gap-1">
          <span>🌾</span> Charco Sombrio (Região 2):
        </span>
        <button
          id="btn-warp-charco"
          type="button"
          onClick={warpParaCharcoSombrio}
          className="flex items-center gap-1 bg-lime-950/70 hover:bg-lime-900/80 text-lime-200 px-2.5 py-0.5 rounded border border-lime-700/70 transition cursor-pointer text-[11px]"
          title="Teletransportar para a Doca de Juncoturvo no Charco Sombrio"
        >
          <span>🌾</span> Ir a Juncoturvo
        </button>
        <button
          id="btn-falar-escriba-ivo"
          type="button"
          onClick={abrirDialogoIvoTeste}
          className="flex items-center gap-1 bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 px-2.5 py-0.5 rounded border border-amber-700/60 transition cursor-pointer text-[11px]"
          title="Abrir o diálogo do Escriba Ivo sobre a lore dos 6 Relicários (máquina de escrever)"
        >
          <span>📜</span> Conversar c/ Escriba Ivo
        </button>
        <button
          id="btn-abrir-loja-junco"
          type="button"
          onClick={abrirLojaJuncoTeste}
          className="flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 px-2.5 py-0.5 rounded border border-emerald-700/60 transition cursor-pointer text-[11px]"
          title="Abrir a Loja de Juncoturvo (Frasco de Seiva e Bombas por Selos)"
        >
          <span>🏬</span> Empório de Juncoturvo
        </button>
      </div>

      {/* Painel de Navegação e Teste da Cripta do Guardião Adormecido (Dungeon Opcional) */}
      <div
        id="cripta-navigation-tools"
        className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
          <span>🏛</span> Cripta do Guardião (Opcional):
        </span>
        <button
          id="btn-cripta-sala1"
          type="button"
          onClick={irParaCriptaSala1}
          className="flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 px-2 py-0.5 rounded border border-emerald-600/60 transition cursor-pointer text-[11px]"
          title="Ir para a Sala 1 da Cripta (Puzzle dos 2 Blocos de Pedra)"
        >
          <span>⬡</span> Sala 1 (Puzzle de Blocos)
        </button>
        <button
          id="btn-cripta-sala2"
          type="button"
          onClick={irParaCriptaSala2}
          className="flex items-center gap-1 bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 px-2 py-0.5 rounded border border-amber-700/60 transition cursor-pointer text-[11px]"
          title="Ir para a Sala 2 da Cripta (Combate com 4 Espinhos e 2 Vagalumes)"
        >
          <span>⚔</span> Sala 2 (Combate)
        </button>
        <button
          id="btn-cripta-sala3"
          type="button"
          onClick={irParaCriptaSala3}
          className="flex items-center gap-1 bg-teal-950/60 hover:bg-teal-900/70 text-teal-300 px-2 py-0.5 rounded border border-teal-600/60 transition cursor-pointer text-[11px]"
          title="Ir para a Sala 3 da Cripta (Baú do Guardião: +1 Fragmento de Vida Máximo)"
        >
          <span>★</span> Sala 3 (Baú +1 Vida)
        </button>
      </div>

      {/* Painel de Navegação e Teste do Santuário (Dungeon) */}
      <div
        id="dungeon-navigation-tools"
        className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
          <span>🏛</span> Santuário da Raiz Antiga:
        </span>
        <button
          id="btn-entrar-santuario"
          type="button"
          onClick={entrarSantuarioTeste}
          className="flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60 transition cursor-pointer text-[11px]"
          title="Entrar no Santuário da Raiz Antiga (Dungeon)"
        >
          <span>🏛</span> Entrar no Santuário
        </button>
        <button
          id="btn-warp-fosso"
          type="button"
          onClick={irParaFossoDungeon}
          className="flex items-center gap-1 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700/60 transition cursor-pointer text-[11px]"
          title="Ir para a Sala do Fosso com alavanca e argolas de gancho"
        >
          <span>⚓</span> Sala do Fosso
        </button>
        <button
          id="btn-warp-chefe"
          type="button"
          onClick={irParaChefeTeste}
          className="flex items-center gap-1 bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 px-2 py-0.5 rounded border border-purple-700/60 transition cursor-pointer text-[11px]"
          title="Teletransportar diretamente para a Sala do Chefe Raizarca"
        >
          <span>👑</span> Chefe Raizarca
        </button>
        <button
          id="btn-sair-santuario"
          type="button"
          onClick={sairSantuarioTeste}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition cursor-pointer text-[11px]"
          title="Retornar para o Vale Verdejante"
        >
          <span>🌲</span> Sair para o Vale
        </button>
        <button
          id="btn-give-key"
          type="button"
          onClick={darChavePequenaTeste}
          className="flex items-center gap-1 bg-yellow-950/50 hover:bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded border border-yellow-800/60 transition cursor-pointer text-[11px]"
          title="Adicionar +1 Chave Pequena para abrir portas"
        >
          <span>🔑</span> +1 Chave
        </button>
        <button
          id="btn-give-boss-key"
          type="button"
          onClick={darChaveChefeTeste}
          className="flex items-center gap-1 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/60 transition cursor-pointer text-[11px]"
          title="Adicionar Chave do Chefe"
        >
          <span>🗝</span> Chave do Chefe
        </button>
        <button
          id="btn-reset-dungeon"
          type="button"
          onClick={resetarDungeonTeste}
          className="flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 px-2 py-0.5 rounded border border-rose-800/50 transition cursor-pointer text-[11px]"
          title="Reiniciar quebra-cabeças, baús e portas da Dungeon"
        >
          <span>↺</span> Reiniciar Dungeon
        </button>
      </div>

      {/* Painel de Navegação e Teste do Santuário das Águas Turvas (Prompt 7 / Charco Sombrio) */}
      <div
        id="aguas-navigation-tools"
        className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <span className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
          <span>🌊</span> Santuário das Águas Turvas:
        </span>
        <button
          id="btn-entrar-aguas"
          type="button"
          onClick={entrarSantuarioAguasTeste}
          className="flex items-center gap-1 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 px-2 py-0.5 rounded border border-cyan-600/60 transition cursor-pointer text-[11px]"
          title="Entrar no Santuário das Águas Turvas (Entrada principal)"
        >
          <span>🏛</span> Entrada
        </button>
        <button
          id="btn-aguas-puzzle1"
          type="button"
          onClick={irParaPuzzlePlataformasTeste}
          className="flex items-center gap-1 bg-teal-950/60 hover:bg-teal-900/70 text-teal-300 px-2 py-0.5 rounded border border-teal-600/60 transition cursor-pointer text-[11px]"
          title="Sala de Puzzle 1 (Plataformas que afundam aos 3s)"
        >
          <span>⏳</span> Puzzle 1 (Plataformas)
        </button>
        <button
          id="btn-aguas-puzzle2"
          type="button"
          onClick={irParaPuzzleAlavancaTeste}
          className="flex items-center gap-1 bg-blue-950/60 hover:bg-blue-900/70 text-blue-300 px-2 py-0.5 rounded border border-blue-600/60 transition cursor-pointer text-[11px]"
          title="Sala de Puzzle 2 (Alavanca remota com Bumerangue)"
        >
          <span>🪃</span> Puzzle 2 (Bumerangue)
        </button>
        <button
          id="btn-aguas-chefe"
          type="button"
          onClick={irParaChefeMarejanteTeste}
          className="flex items-center gap-1 bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 px-2 py-0.5 rounded border border-indigo-600/60 transition cursor-pointer text-[11px]"
          title="Teletransportar para a Sala-Chefe: Covil do Marejante"
        >
          <span>👑</span> Chefe Marejante
        </button>
        <button
          id="btn-equipar-bumerangue"
          type="button"
          onClick={equiparBumerangueTeste}
          className="flex items-center gap-1 bg-sky-950/60 hover:bg-sky-900/70 text-sky-300 px-2 py-0.5 rounded border border-sky-600/60 transition cursor-pointer text-[11px]"
          title="Equipar Bumerangue das Marés no slot [X]"
        >
          <span>🪃</span> Equipar Bumerangue [X]
        </button>
      </div>

      {/* Painel de Navegação do Covil Afogado (Catacumba Opcional do Charco Sombrio) */}
      <div
        id="covil-navigation-tools"
        className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-mono"
      >
        <span className="text-[11px] text-teal-400 font-semibold flex items-center gap-1">
          <span>💀</span> Covil Afogado:
        </span>
        <button
          id="btn-overworld-alavanca-covil"
          type="button"
          onClick={irParaOverworldAlavancaCovil}
          className="flex items-center gap-1 bg-teal-950/60 hover:bg-teal-900/70 text-teal-300 px-2 py-0.5 rounded border border-teal-600/60 transition cursor-pointer text-[11px]"
          title="Ir para a margem do canal com Alavanca Remota (Overworld)"
        >
          <span>🌊</span> Canal & Alavanca
        </button>
        <button
          id="btn-entrar-covil"
          type="button"
          onClick={irParaCovilAfogadoTeste}
          className="flex items-center gap-1 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 px-2 py-0.5 rounded border border-emerald-600/60 transition cursor-pointer text-[11px]"
          title="Entrar na Entrada do Covil Afogado (Dungeon)"
        >
          <span>🏛</span> Entrada Covil
        </button>
        <button
          id="btn-covil-puzzles"
          type="button"
          onClick={irParaCovilPuzzlesTeste}
          className="flex items-center gap-1 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 px-2 py-0.5 rounded border border-cyan-600/60 transition cursor-pointer text-[11px]"
          title="Sala de Puzzles com Cristais e Alavanca de Drenagem"
        >
          <span>💎</span> Sala de Puzzles
        </button>
        <button
          id="btn-covil-bau"
          type="button"
          onClick={irParaCovilBauTeste}
          className="flex items-center gap-1 bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 px-2 py-0.5 rounded border border-amber-600/60 transition cursor-pointer text-[11px]"
          title="Câmara do Baú Secreto com Upgrade"
        >
          <span>📦</span> Baú Secreto
        </button>
      </div>

      {/* D-Pad Virtual Discreto para Dispositivos Touch / Testes Rápidos */}
      <div
        id="virtual-dpad"
        className="mt-2 flex items-center gap-6 sm:hidden"
      >
        <div className="grid grid-cols-3 gap-1 w-28 h-28">
          <div />
          <button
            id="btn-up"
            type="button"
            className="bg-slate-800 text-slate-200 active:bg-slate-700 rounded flex items-center justify-center font-bold text-sm"
            onPointerDown={() => setVirtualKey('ArrowUp', true)}
            onPointerUp={() => setVirtualKey('ArrowUp', false)}
            onPointerLeave={() => setVirtualKey('ArrowUp', false)}
          >
            ▲
          </button>
          <div />
          <button
            id="btn-left"
            type="button"
            className="bg-slate-800 text-slate-200 active:bg-slate-700 rounded flex items-center justify-center font-bold text-sm"
            onPointerDown={() => setVirtualKey('ArrowLeft', true)}
            onPointerUp={() => setVirtualKey('ArrowLeft', false)}
            onPointerLeave={() => setVirtualKey('ArrowLeft', false)}
          >
            ◀
          </button>
          <div className="bg-slate-900 rounded" />
          <button
            id="btn-right"
            type="button"
            className="bg-slate-800 text-slate-200 active:bg-slate-700 rounded flex items-center justify-center font-bold text-sm"
            onPointerDown={() => setVirtualKey('ArrowRight', true)}
            onPointerUp={() => setVirtualKey('ArrowRight', false)}
            onPointerLeave={() => setVirtualKey('ArrowRight', false)}
          >
            ▶
          </button>
          <div />
          <button
            id="btn-down"
            type="button"
            className="bg-slate-800 text-slate-200 active:bg-slate-700 rounded flex items-center justify-center font-bold text-sm"
            onPointerDown={() => setVirtualKey('ArrowDown', true)}
            onPointerUp={() => setVirtualKey('ArrowDown', false)}
            onPointerLeave={() => setVirtualKey('ArrowDown', false)}
          >
            ▼
          </button>
          <div />
        </div>

        <div className="flex gap-2">
          <button
            id="btn-action-z"
            type="button"
            className="w-12 h-12 rounded-full bg-blue-700 text-white font-bold active:bg-blue-600 shadow"
            onPointerDown={() => setVirtualKey('KeyZ', true)}
            onPointerUp={() => setVirtualKey('KeyZ', false)}
            onPointerLeave={() => setVirtualKey('KeyZ', false)}
          >
            Z
          </button>
          <button
            id="btn-action-x"
            type="button"
            className="w-12 h-12 rounded-full bg-slate-700 text-white font-bold active:bg-slate-600 shadow"
            onPointerDown={() => setVirtualKey('KeyX', true)}
            onPointerUp={() => setVirtualKey('KeyX', false)}
            onPointerLeave={() => setVirtualKey('KeyX', false)}
          >
            X
          </button>
        </div>
      </div>
    </div>
  );
};

