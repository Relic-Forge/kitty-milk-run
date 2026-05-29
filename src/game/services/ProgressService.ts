import { STORAGE_KEYS } from '../data/storageKeys';
import { MAP_NODES, getWorldForNode, type MapNode } from '../worldMap';
import { StorageService } from './StorageService';

type ProgressRecord = Record<string, number>;

function clampBottleRating(value: number) {
  return Math.max(0, Math.min(3, value));
}

export class ProgressService {
  private static progress: ProgressRecord = {};
  private static selectedNodeId = MAP_NODES[0].id;

  static load() {
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

  static getNewestUnlockedNode() {
    const playableNodes = MAP_NODES.filter((node) => ProgressService.isNodePlayable(node));
    return playableNodes[playableNodes.length - 1] ?? MAP_NODES[0];
  }

  static isNodeUnlocked(node: MapNode): boolean {
    if (ProgressService.getTotalMilk() < node.unlock.requiredMilkBottles) return false;
    if (!node.unlock.previousNodeId) return true;
    if (node.unlock.previousNodeId.includes('_gate')) return ProgressService.isGateOpen(node.unlock.previousNodeId);
    return ProgressService.getBottlesForNode(node.unlock.previousNodeId) > 0;
  }

  static isNodePlayable(node: MapNode) {
    return node.nodeType !== 'gate' && ProgressService.isNodeUnlocked(node);
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
    const locked = ProgressService.isNodeUnlocked(node) ? '' : ` Need ${node.unlock.requiredMilkBottles} milk.`;
    return `World: ${world.shortName}  Best: ${rating}\n${node.flavor}${locked}`;
  }

  static completeRun(nodeId: string, yarnScore: number, perfectRun = false) {
    const node = MAP_NODES.find((candidate) => candidate.id === nodeId);
    if (!node || node.nodeType === 'gate') return 0;
    const earnedBottles =
      perfectRun || yarnScore >= node.scoreTargets.threeBottleScore ? 3 : yarnScore >= node.scoreTargets.twoBottleScore ? 2 : 1;
    const nextBottles = Math.max(ProgressService.getBottlesForNode(node.id), earnedBottles);
    ProgressService.progress[node.id] = nextBottles;
    ProgressService.selectedNodeId = ProgressService.getNewestUnlockedNode().id;
    ProgressService.save();
    return nextBottles;
  }
}
