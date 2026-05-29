import { GAME_WIDTH } from '../constants';

export type LaneLayout = {
  laneCount: number;
  lanes: number[];
  roadOuterWidth: number;
  roadInnerWidth: number;
  roadLeftEdge: number;
  roadRightEdge: number;
  laneMarkerXs: number[];
};

export type LaneLayoutOptions = {
  laneCount: number;
  centerX?: number;
  spacing?: number;
  shoulderWidth?: number;
};

const DEFAULT_SPACING = 170;
const DEFAULT_SHOULDER_WIDTH = 90;

export function buildLaneLayout({
  laneCount,
  centerX = GAME_WIDTH / 2,
  spacing = DEFAULT_SPACING,
  shoulderWidth = DEFAULT_SHOULDER_WIDTH
}: LaneLayoutOptions): LaneLayout {
  if (!Number.isInteger(laneCount) || laneCount < 2 || laneCount > 5) {
    throw new Error(`laneCount must be an integer from 2 to 5. Received ${laneCount}.`);
  }

  const firstLane = centerX - ((laneCount - 1) * spacing) / 2;
  const lanes = Array.from({ length: laneCount }, (_unused, index) => Math.round(firstLane + index * spacing));
  const roadInnerWidth = Math.round((laneCount - 1) * spacing + shoulderWidth * 2);
  const roadOuterWidth = roadInnerWidth + 52;
  const roadLeftEdge = Math.round(centerX - roadInnerWidth / 2);
  const roadRightEdge = Math.round(centerX + roadInnerWidth / 2);
  const laneMarkerXs = lanes.slice(0, -1).map((laneX, index) => Math.round((laneX + lanes[index + 1]) / 2));

  return {
    laneCount,
    lanes,
    roadOuterWidth,
    roadInnerWidth,
    roadLeftEdge,
    roadRightEdge,
    laneMarkerXs
  };
}
