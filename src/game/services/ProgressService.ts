import { STORAGE_KEYS } from '../data/storageKeys';
import { MAP_NODES, WORLDS, getMapNodeById, getWorldForNode, type MapNode } from '../worldMap';
import { StorageService } from './StorageService';

type ProgressRecord = Record<string, number>;

export type PendingMapUnlock = {
  fromNodeId: string;
  toNodeId: string;
};

function clampBottleRating(value: number) {
  return Math.max(0, Math.min(3, value));
}

export class ProgressService {
  private static progress: ProgressRecord = {};
  private static selectedNodeId = MAP_NODES[0].id;
  private static devTestNodeId: string | undefined;
  private static pendingMapUnlock?: PendingMapUnlock;

  static load() {
    ProgressService.devTestNodeId = ProgressService.getDevTestNodeId();
    const storedProgress = StorageService.getJson<ProgressRecord>(STORAGE_KEYS.mapProgress, {});
    ProgressService.progress = Object.fromEntries(
      Object.entries(storedProgress)
        .filter(([id, bottles]) => MAP_NODES.some((node) => node.id === id) && Number.isFinite(Number(bottles)))
        .map(([id, bottles]) => [id, clampBottleRating(Number(bottles))])
    );

    const storedNodeId = StorageService.getOptionalString(STORAGE_KEYS.selectedMapNode);
    ProgressService.selectedNodeId = MAP_NODES.some((node) => node.id === storedNodeId)
      ? storedNodeId!
      : ProgressService.getNewestUnlockedNode().id;
    if (ProgressService.devTestNodeId) ProgressService.selectedNodeId = ProgressService.devTestNodeId;
  }

  static save() {
    StorageService.setJson(STORAGE_KEYS.mapProgress, ProgressService.progress);
    StorageService.setString(STORAGE_KEYS.selectedMapNode, ProgressService.selectedNodeId);
  }

  static getSelectedNode() {
    return MAP_NODES.find((node) => node.id === ProgressService.selectedNodeId) ?? MAP_NODES[0];
  }

  static getSelectedNodeId() {
    return ProgressService.getSelectedNode().id;
  }

  static setSelectedNode(nodeId: string) {
    if (!MAP_NODES.some((node) => node.id === nodeId)) return;
    ProgressService.selectedNodeId = nodeId;
    ProgressService.save();
  }

  static getCurrentRunNode() {
    const selectedNode = ProgressService.getSelectedNode();
    if (ProgressService.isNodePlayable(selectedNode)) return selectedNode;
    const playableNodes = MAP_NODES.filter((node) => ProgressService.isNodePlayable(node));
    const incompleteNode = [...playableNodes].reverse().find((node) => ProgressService.getBottlesForNode(node.id) < 3);
    return incompleteNode ?? playableNodes[playableNodes.length - 1] ?? MAP_NODES[0];
  }

  static getCurrentMapCatNode() {
    if (ProgressService.devTestNodeId) {
      return getMapNodeById(ProgressService.devTestNodeId) ?? MAP_NODES[0];
    }
    const playableNodes = MAP_NODES.filter((node) => ProgressService.isNodePlayable(node));
    const incompleteNode = [...playableNodes].reverse().find((node) => ProgressService.getBottlesForNode(node.id) < 3);
    return incompleteNode ?? playableNodes[playableNodes.length - 1] ?? MAP_NODES[0];
  }

  static getNewestUnlockedNode() {
    const playableNodes = MAP_NODES.filter((node) => ProgressService.isNodePlayable(node));
    return playableNodes[playableNodes.length - 1] ?? MAP_NODES[0];
  }

  static isNodeUnlocked(node: MapNode): boolean {
    if (node.id === ProgressService.devTestNodeId) return true;
    if (ProgressService.getTotalMilk() < node.unlock.requiredMilkBottles) return false;
    if (!node.unlock.previousNodeId) return true;
    const previousNode = getMapNodeById(node.unlock.previousNodeId);
    if (previousNode?.nodeType === 'gate') return ProgressService.isGateOpen(previousNode.id);
    return ProgressService.getBottlesForNode(node.unlock.previousNodeId) > 0;
  }

  static isNodePlayable(node: MapNode) {
    return node.nodeType !== 'gate' && ProgressService.isNodeUnlocked(node);
  }

  private static getDevTestNodeId() {
    if (!import.meta.env.DEV || typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    const explicitNodeId = params.get('testNode');
    const explicitNode = explicitNodeId ? MAP_NODES.find((node) => node.id === explicitNodeId && node.nodeType !== 'gate') : undefined;
    if (explicitNode) return explicitNode.id;

    const testWorld = params.get('testWorld');
    if (!testWorld) return undefined;
    const normalizedWorld = testWorld.trim().toLowerCase();
    const world = WORLDS.find(
      (candidate) =>
        candidate.id.toLowerCase() === normalizedWorld ||
        candidate.themeKey.toLowerCase() === normalizedWorld ||
        candidate.shortName.toLowerCase().replace(/\s+/g, '-') === normalizedWorld
    );
    return MAP_NODES.find((node) => node.worldId === world?.id && node.nodeType === 'main')?.id;
  }

  static isGateOpen(gateId: string) {
    const gate = MAP_NODES.find((node) => node.id === gateId);
    return gate ? ProgressService.isNodeUnlocked(gate) : false;
  }

  static getBottlesForNode(nodeId: string) {
    return clampBottleRating(ProgressService.progress[nodeId] ?? 0);
  }

  static getTotalMilk() {
    return Object.values(ProgressService.progress).reduce((total, bottles) => total + clampBottleRating(bottles), 0);
  }

  static getMapMilkGoal() {
    return MAP_NODES.filter((node) => node.nodeType !== 'gate').length * 3;
  }

  static getNodeLevelNumber(node: MapNode) {
    if (node.nodeType === 'bonus') return 'Bonus';
    const mainNodes = MAP_NODES.filter((candidate) => candidate.worldId === node.worldId && candidate.nodeType === 'main');
    const index = mainNodes.findIndex((candidate) => candidate.id === node.id);
    return index >= 0 ? String(index + 1) : '1';
  }

  static formatBottleRating(bottles: number) {
    return [0, 1, 2].map((index) => (index < bottles ? '★' : '☆')).join(' ');
  }

  static getMapCardBody(node: MapNode) {
    const world = getWorldForNode(node);
    if (node.nodeType === 'gate') {
      return ProgressService.isNodeUnlocked(node)
        ? `${world.mapSkin.gateName} is open. The next world is waiting.`
        : `${node.flavor} Replay earlier levels to earn more.`;
    }
    const bottles = ProgressService.getBottlesForNode(node.id);
    const rating = bottles > 0 ? `Milk x${bottles}` : 'No bottles yet';
    const locked = ProgressService.isNodeUnlocked(node)
      ? ''
      : node.unlock.requiredMilkBottles > 0
        ? ` Need ${node.unlock.requiredMilkBottles} milk.`
        : ' Finish the previous stop first.';
    return `World: ${world.shortName}  Best: ${rating}\n${node.flavor}${locked}`;
  }

  static completeRun(nodeId: string, yarnScore: number, perfectRun = false) {
    const node = MAP_NODES.find((candidate) => candidate.id === nodeId);
    if (!node || node.nodeType === 'gate') return 0;
    const earnedBottles =
      perfectRun || yarnScore >= node.scoreTargets.threeBottleScore ? 3 : yarnScore >= node.scoreTargets.twoBottleScore ? 2 : 1;
    const nextBottles = Math.max(ProgressService.getBottlesForNode(node.id), earnedBottles);
    ProgressService.progress[node.id] = nextBottles;
    const nextNodeId = ProgressService.getNewestUnlockedNode().id;
    ProgressService.selectedNodeId = nextNodeId;
    if (nextNodeId !== node.id) {
      ProgressService.pendingMapUnlock = { fromNodeId: node.id, toNodeId: nextNodeId };
    }
    ProgressService.save();
    return nextBottles;
  }

  static consumePendingMapUnlock() {
    const pending = ProgressService.pendingMapUnlock;
    ProgressService.pendingMapUnlock = undefined;
    return pending;
  }
}
