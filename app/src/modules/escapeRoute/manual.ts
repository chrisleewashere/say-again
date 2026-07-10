import type { ManualBlock, ManualSection } from '../../engine/types';
import { DIFFICULTY_LABELS } from '../../engine/types';
import { floorsForDifficulty, GRID_SIZE, type Floor, type FloorDifficulty } from './rules';
import {
  compassSvg,
  floorMapAlt,
  floorMapSvg,
  landmarkLegendRows,
  legendSvg,
  routeRulesText,
  routeScriptLines,
  routeSummary,
  type Edition,
} from './prose';

/** One map figure per floor, generated from the same data the engine walks. */
function floorFigure(floor: Floor, ed: Edition): ManualBlock {
  return {
    kind: 'figure',
    svg: floorMapSvg(floor),
    caption:
      ed === 'standard'
        ? `Floor ${floor.floorId} — dashed line is the safe route; hatched squares are hidden sensors.`
        : `Floor ${floor.floorId}. Follow the dashed line. Striped squares are sensors — keep away!`,
    alt: floorMapAlt(floor, ed),
  };
}

function difficultyBlocks(difficulty: FloorDifficulty, ed: Edition): ManualBlock[] {
  const size = GRID_SIZE[difficulty];
  const floors = floorsForDifficulty(difficulty);
  const blocks: ManualBlock[] = [
    {
      kind: 'h3',
      text:
        ed === 'standard'
          ? `${DIFFICULTY_LABELS[difficulty]} floors (${size}×${size} grid): ${floors.map((f) => f.floorId).join(', ')}`
          : `${DIFFICULTY_LABELS[difficulty]} floors (${size} by ${size}): ${floors.map((f) => f.floorId).join(', ')}`,
    },
  ];
  for (const floor of floors) {
    blocks.push(floorFigure(floor, ed));
    if (ed === 'standard') {
      blocks.push({ kind: 'p', text: routeSummary(floor, 'standard') });
    } else {
      blocks.push({ kind: 'steps', items: routeScriptLines(floor) });
    }
  }
  return blocks;
}

export const escapeRouteManual: ManualSection = {
  standard: {
    intro:
      'The Agent sees a top-down floor map with their avatar at START, an EXIT, walls, and landmark icons — ' +
      'but the floor sensors are invisible on screen. Only YOUR maps show the sensors and the safe route. ' +
      'Ask for the floor code, find that map below, and talk the Agent through cell by cell. ' +
      'The Agent moves with north/south/east/west buttons and can read cell coordinates (letters across the top, numbers down the side).',
    blocks: [
      {
        kind: 'figure',
        svg: compassSvg(),
        caption: 'Compass: north is always the top of the map. Row 1 is the north row; column A is the west column.',
        alt: 'A compass rose with north at the top, south at the bottom, east on the right, and west on the left.',
      },
      { kind: 'h3', text: 'How the floor works' },
      { kind: 'steps', items: routeRulesText('standard') },
      {
        kind: 'figure',
        svg: legendSvg(),
        caption: 'Map legend: every landmark has a shape AND a letter tag, so you never have to rely on color.',
        alt: 'Legend showing five landmark shapes with letter tags, the hatched sensor square, the thick wall line, the dashed safe route, and the START and EXIT marks.',
      },
      {
        kind: 'table',
        caption: 'Landmark tags the Agent can read out.',
        header: ['Landmark', 'Letter tag', 'Shape'],
        rows: landmarkLegendRows('standard'),
      },
      {
        kind: 'callout',
        tone: 'tip',
        text:
          'Use landmarks as checkpoints. At each one, pause and ask: "What do you see? Which cell are you in?" ' +
          'If two landmarks match (some floors have two plants, two cameras...), ask for the cell coordinate to tell them apart.',
      },
      {
        kind: 'callout',
        tone: 'warning',
        text:
          'A sensor step raises the alarm and sends the Agent back to START. Before saying "go", double-check the next cell on your map — and if the Agent sounds unsure about where they are, ask them to read their coordinates again.',
      },
      ...difficultyBlocks(1, 'standard'),
      ...difficultyBlocks(2, 'standard'),
      ...difficultyBlocks(3, 'standard'),
    ],
  },
  simplified: {
    intro:
      'The Agent sees a map with a START dot, an EXIT, walls, and icons. ' +
      'The Agent CANNOT see the sensors. Your maps show them. ' +
      'Ask: "What floor are you on?" Find that map. Then give directions one step at a time.',
    blocks: [
      {
        kind: 'figure',
        svg: compassSvg(),
        caption: 'North is up. South is down. East is right. West is left.',
        alt: 'A compass rose: N at the top, S at the bottom, E on the right, W on the left.',
      },
      { kind: 'h3', text: 'The rules' },
      { kind: 'steps', items: routeRulesText('simplified') },
      {
        kind: 'figure',
        svg: legendSvg(),
        caption: 'What the marks mean. Each icon has a shape and a letter.',
        alt: 'Legend: five landmark shapes with letters, striped sensor square, thick wall line, dashed route, START dot, EXIT mark.',
      },
      {
        kind: 'table',
        caption: 'The icons and their letters.',
        header: ['Icon', 'Letter', 'Shape'],
        rows: landmarkLegendRows('simplified'),
      },
      {
        kind: 'callout',
        tone: 'tip',
        text: 'Stop at every icon. Ask: "What do you see? What cell are you in?" Asking questions is part of the mission!',
      },
      {
        kind: 'callout',
        tone: 'warning',
        text: 'Sensors send the Agent back to START. Check your map before every "go". It is okay to start over.',
      },
      ...difficultyBlocks(1, 'simplified'),
      ...difficultyBlocks(2, 'simplified'),
      ...difficultyBlocks(3, 'simplified'),
    ],
  },
};
