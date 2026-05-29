import { CosmeticService } from '../services/CosmeticService';
import { ProgressService } from '../services/ProgressService';
import { MAP_CONNECTIONS, MAP_NODES, WORLDS, getWorldForNode } from '../worldMap';

export function buildMapViewModel() {
  const selectedNode = ProgressService.getSelectedNode();
  const activeWorld = getWorldForNode(selectedNode);
  const worldIndex = WORLDS.findIndex((world) => world.id === activeWorld.id);
  const cosmetic = CosmeticService.getSelectedCosmetic();

  return {
    totalMilk: ProgressService.getTotalMilk(),
    mapMilkGoal: ProgressService.getMapMilkGoal(),
    selectedNodeId: selectedNode.id,
    selectedNode,
    activeWorld,
    previousWorld: WORLDS[worldIndex - 1],
    nextWorld: WORLDS[worldIndex + 1],
    nodes: MAP_NODES.map((node) => ({
      node,
      bottles: ProgressService.getBottlesForNode(node.id),
      unlocked: ProgressService.isNodeUnlocked(node),
      playable: ProgressService.isNodePlayable(node),
      cardBody: ProgressService.getMapCardBody(node)
    })),
    connections: MAP_CONNECTIONS,
    selectedCat: {
      texture: cosmetic.run1,
      usesNyanArt: cosmetic.style === 'nyan'
    }
  };
}
