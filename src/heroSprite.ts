import { HeroState } from './types';

// =============================================================================
// ELDRIM: ECOS DO PASSADO - RENDERIZAÇÃO 16-BIT DO HERÓI (REN)
// =============================================================================
// Visual: Bounding Box 16x24px.
// A colisão física é de 16x16px (pés 16x8px).
// O topo do sprite se estende 8px acima da caixa de colisão física (sy = heroi.y - 8).

export function renderizarHeroiRen(
  ctx: CanvasRenderingContext2D,
  heroi: HeroState,
  isMoving: boolean = false,
  gameTime: number = 0
) {
  // 1. Dano / iframes: Piscar o sprite completo se estiver em invulnerabilidade (800ms)
  if (heroi.iframes && heroi.iframes > 0 && Math.floor(heroi.iframes * 20) % 2 === 0) {
    return;
  }

  // Posição base do sprite visual (16x24px)
  const sx = Math.round(heroi.x);
  const sy = Math.round(heroi.y - 8);

  // Oscilação vertical leve ao respirar parado (~2s)
  const breathingY = (!heroi.atacando && !isMoving) ? (Math.sin(gameTime * Math.PI) > 0 ? 1 : 0) : 0;

  ctx.save();

  // 2. Sombra suave sob os pés
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(sx + 8, sy + 22.5, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Pernas & Botas (Animação de caminhada de 2 frames a cada 150ms)
  const stepFrame = isMoving ? Math.floor(gameTime / 0.15) % 2 : -1;
  const pantsColor = '#3a2818';
  const bootColor = '#2a1a10';

  if (stepFrame === 0) {
    // Frame 0: Perna esquerda estendida à frente
    ctx.fillStyle = pantsColor;
    ctx.fillRect(sx + 3, sy + 16, 4, 6);
    ctx.fillRect(sx + 9, sy + 16, 4, 4);

    ctx.fillStyle = bootColor;
    ctx.fillRect(sx + 3, sy + 20, 4, 3);
    ctx.fillRect(sx + 9, sy + 19, 4, 2);
  } else if (stepFrame === 1) {
    // Frame 1: Perna direita estendida à frente
    ctx.fillStyle = pantsColor;
    ctx.fillRect(sx + 3, sy + 16, 4, 4);
    ctx.fillRect(sx + 9, sy + 16, 4, 6);

    ctx.fillStyle = bootColor;
    ctx.fillRect(sx + 3, sy + 19, 4, 2);
    ctx.fillRect(sx + 9, sy + 20, 4, 3);
  } else {
    // Parado: Pernas juntas
    ctx.fillStyle = pantsColor;
    ctx.fillRect(sx + 3.5, sy + 16 + breathingY, 3.5, 6);
    ctx.fillRect(sx + 9, sy + 16 + breathingY, 3.5, 6);

    ctx.fillStyle = bootColor;
    ctx.fillRect(sx + 3.5, sy + 20.5 + breathingY, 3.5, 2.5);
    ctx.fillRect(sx + 9, sy + 20.5 + breathingY, 3.5, 2.5);
  }

  // 4. Tronco (Túnica terracota #a8532e & Cinto marrom #5a3a1a & Broche #c9a24b)
  const tunicColor = '#a8532e';
  const beltColor = '#5a3a1a';
  const broochColor = '#c9a24b';

  if (heroi.direcao === 'baixo') {
    // Frente
    ctx.fillStyle = tunicColor;
    ctx.fillRect(sx + 2, sy + 8 + breathingY, 12, 8);

    // Gola da túnica
    ctx.fillStyle = '#7a381a';
    ctx.fillRect(sx + 6, sy + 8 + breathingY, 4, 2);

    // Cinto
    ctx.fillStyle = beltColor;
    ctx.fillRect(sx + 2, sy + 14 + breathingY, 12, 2);
    ctx.fillStyle = broochColor;
    ctx.fillRect(sx + 7, sy + 14 + breathingY, 2, 2); // Fivela

    // Broche dourado no peito (brasão de família de Ren)
    ctx.fillStyle = broochColor;
    ctx.fillRect(sx + 5, sy + 10 + breathingY, 2.5, 2.5);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sx + 5.5, sy + 10.5 + breathingY, 1, 1);
  } else if (heroi.direcao === 'cima') {
    // Costas
    ctx.fillStyle = tunicColor;
    ctx.fillRect(sx + 2, sy + 8 + breathingY, 12, 8);

    // Cinto
    ctx.fillStyle = beltColor;
    ctx.fillRect(sx + 2, sy + 14 + breathingY, 12, 2);
  } else if (heroi.direcao === 'esquerda') {
    // Perfil Esquerdo
    ctx.fillStyle = tunicColor;
    ctx.fillRect(sx + 3, sy + 8 + breathingY, 10, 8);

    // Cinto
    ctx.fillStyle = beltColor;
    ctx.fillRect(sx + 3, sy + 14 + breathingY, 10, 2);

    // Broche no peito
    ctx.fillStyle = broochColor;
    ctx.fillRect(sx + 4, sy + 10 + breathingY, 2, 2);
  } else if (heroi.direcao === 'direita') {
    // Perfil Direito
    ctx.fillStyle = tunicColor;
    ctx.fillRect(sx + 3, sy + 8 + breathingY, 10, 8);

    // Cinto
    ctx.fillStyle = beltColor;
    ctx.fillRect(sx + 3, sy + 14 + breathingY, 10, 2);

    // Broche no peito
    ctx.fillStyle = broochColor;
    ctx.fillRect(sx + 10, sy + 10 + breathingY, 2, 2);
  }

  // 5. Cabeça (Pele #e0a878 & Cabelo castanho #3d2817)
  const skinColor = '#e0a878';
  const hairColor = '#3d2817';
  const eyeColor = '#18100a';

  if (heroi.direcao === 'baixo') {
    // Rosto visível
    ctx.fillStyle = skinColor;
    ctx.fillRect(sx + 3.5, sy + 2 + breathingY, 9, 7);

    // Cabelo topo e franja
    ctx.fillStyle = hairColor;
    ctx.fillRect(sx + 2, sy + breathingY, 12, 3);
    ctx.fillRect(sx + 2, sy + 3 + breathingY, 2, 3); // Mecha esquerda
    ctx.fillRect(sx + 12, sy + 3 + breathingY, 2, 3); // Mecha direita
    ctx.fillRect(sx + 5, sy + 3 + breathingY, 3, 1); // Franja central

    // 2 olhos simples
    ctx.fillStyle = eyeColor;
    ctx.fillRect(sx + 5, sy + 5 + breathingY, 1.5, 2);
    ctx.fillRect(sx + 9.5, sy + 5 + breathingY, 1.5, 2);
  } else if (heroi.direcao === 'cima') {
    // Só cabelo visível nas costas
    ctx.fillStyle = hairColor;
    ctx.fillRect(sx + 2, sy + breathingY, 12, 9);
    // Textura mechas de cabelo
    ctx.fillStyle = '#4a321d';
    ctx.fillRect(sx + 4, sy + 2 + breathingY, 8, 2);
    ctx.fillRect(sx + 3, sy + 5 + breathingY, 10, 2);
  } else if (heroi.direcao === 'esquerda') {
    // Perfil Esquerdo (Silhueta mais estreita)
    ctx.fillStyle = skinColor;
    ctx.fillRect(sx + 3, sy + 2 + breathingY, 8, 7);

    // Cabelo topo e trás
    ctx.fillStyle = hairColor;
    ctx.fillRect(sx + 3, sy + breathingY, 9, 3);
    ctx.fillRect(sx + 8, sy + 3 + breathingY, 4, 5); // Cabelo atrás

    // 1 olho visível
    ctx.fillStyle = eyeColor;
    ctx.fillRect(sx + 4, sy + 5 + breathingY, 1.5, 2);
  } else if (heroi.direcao === 'direita') {
    // Perfil Direito
    ctx.fillStyle = skinColor;
    ctx.fillRect(sx + 5, sy + 2 + breathingY, 8, 7);

    // Cabelo topo e trás
    ctx.fillStyle = hairColor;
    ctx.fillRect(sx + 4, sy + breathingY, 9, 3);
    ctx.fillRect(sx + 4, sy + 3 + breathingY, 4, 5); // Cabelo atrás

    // 1 olho visível
    ctx.fillStyle = eyeColor;
    ctx.fillRect(sx + 10.5, sy + 5 + breathingY, 1.5, 2);
  }

  // 6. Espada / Bainha
  // Se NÃO estiver atacando: desenha a bainha nas costas
  if (!heroi.atacando) {
    const sheathColor = '#78716c';
    const hiltColor = '#2a1a10';

    if (heroi.direcao === 'cima') {
      // Bainha na diagonal nas costas
      ctx.strokeStyle = sheathColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + 15);
      ctx.lineTo(sx + 11, sy + 6);
      ctx.stroke();

      // Punho e Guarda espreitando no ombro
      ctx.fillStyle = broochColor;
      ctx.fillRect(sx + 11, sy + 4, 3, 2);
      ctx.fillStyle = hiltColor;
      ctx.fillRect(sx + 12, sy + 2, 2, 3);
    } else if (heroi.direcao === 'baixo') {
      // Cabo da espada visível sobre o ombro direito
      ctx.fillStyle = broochColor;
      ctx.fillRect(sx + 10, sy + 6 + breathingY, 4, 1.5);
      ctx.fillStyle = hiltColor;
      ctx.fillRect(sx + 11, sy + 3 + breathingY, 2, 3);
      ctx.fillStyle = broochColor;
      ctx.fillRect(sx + 11, sy + 2 + breathingY, 2, 1); // Pomo
    } else if (heroi.direcao === 'esquerda') {
      // Bainha ao lado do corpo
      ctx.fillStyle = sheathColor;
      ctx.fillRect(sx + 9, sy + 7 + breathingY, 2, 8);
      ctx.fillStyle = broochColor;
      ctx.fillRect(sx + 8.5, sy + 5 + breathingY, 3, 2);
    } else if (heroi.direcao === 'direita') {
      // Bainha ao lado do corpo
      ctx.fillStyle = sheathColor;
      ctx.fillRect(sx + 5, sy + 7 + breathingY, 2, 8);
      ctx.fillStyle = broochColor;
      ctx.fillRect(sx + 4.5, sy + 5 + breathingY, 3, 2);
    }
  } else {
    // Durante o Ataque: Lâmina de Eldrim desferida em varredura de ~90° (durando os 200ms da hitbox)
    const timer = heroi.ataqueTimer || 0;
    const progress = 1.0 - Math.max(0, Math.min(1.0, timer / 0.2)); // 0.0 inicio a 1.0 fim

    // Ponto pivô do golpe (empunhadura do herói)
    let px = sx + 8;
    let py = sy + 12;

    let startAngle = 0;
    let endAngle = 0;

    if (heroi.direcao === 'baixo') {
      py = sy + 15;
      startAngle = Math.PI * 0.25; // +45°
      endAngle = Math.PI * 0.75; // +135°
    } else if (heroi.direcao === 'cima') {
      py = sy + 9;
      startAngle = -Math.PI * 0.75; // -135°
      endAngle = -Math.PI * 0.25; // -45°
    } else if (heroi.direcao === 'esquerda') {
      px = sx + 4;
      startAngle = Math.PI * 0.75; // +135°
      endAngle = Math.PI * 1.25; // +225°
    } else if (heroi.direcao === 'direita') {
      px = sx + 12;
      startAngle = -Math.PI * 0.25; // -45°
      endAngle = Math.PI * 0.25; // +45°
    }

    const currentAngle = startAngle + progress * (endAngle - startAngle);

    // Desenhar Rastro/Arco da Espada
    ctx.beginPath();
    ctx.arc(px, py, 14, startAngle, currentAngle, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = heroi.ataqueCarregado ? 'rgba(56, 189, 248, 0.8)' : 'rgba(224, 231, 255, 0.6)';
    ctx.stroke();

    // Desenhar Lâmina com rotação
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(currentAngle);

    // Cabo
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(-3, -1, 3, 2);

    // Guarda Dourada #c9a24b
    ctx.fillStyle = '#c9a24b';
    ctx.fillRect(0, -3, 2, 6);

    // Lâmina Prateada #c0c0c8
    ctx.fillStyle = heroi.ataqueCarregado ? '#38bdf8' : '#c0c0c8';
    ctx.fillRect(2, -1.5, 12, 3);

    // Núcleo reluzente de luz
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, -0.5, 11, 1);

    ctx.restore();
  }

  ctx.restore();
}

// Alias de exportação para compatibilidade direta
export const renderizarHeroi = renderizarHeroiRen;
