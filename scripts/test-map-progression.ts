import assert from 'node:assert/strict';
import { MAP_NODES, WORLDS, getRequiredMapNode, getWorldForNode } from '../src/game/worldMap';
import { ProgressService } from '../src/game/services/ProgressService';
import { StorageService } from '../src/game/services/StorageService';
import { STORAGE_KEYS } from '../src/game/data/storageKeys';
import { getNodePoint, getRouteControl, getRouteSegments, quadraticPoint } from '../src/game/ui/map/mapGeometry';

const data = new Map<string,string>();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => data.set(key,value)
} });
const home = MAP_NODES.filter(n=>n.worldId===WORLDS[0].id && n.nodeType==='main');
const reset = () => { data.clear(); ProgressService.load(); ProgressService.consumePendingMapUnlock(); };
reset();
assert.equal(ProgressService.getSelectedNodeId(), home[0].id);
assert.equal(ProgressService.isNodePlayable(home[1]),false);
for (const node of home.slice(0,4)) ProgressService.completeRun(node.id,1000);
assert.equal(ProgressService.getSelectedNodeId(),home[4].id,'main path advances past the bonus branch');
assert.equal(ProgressService.getCurrentMapCatNode().id,home[4].id,'kitty frontier prioritizes the main trail');
const bonus = MAP_NODES.find(n=>n.worldId===WORLDS[0].id && n.nodeType==='bonus')!;
assert.equal(ProgressService.isNodePlayable(bonus),true);
ProgressService.completeRun(bonus.id,1000);
assert.equal(ProgressService.getSelectedNodeId(),home[4].id,'bonus rejoins the trail');
for (const node of home.slice(4)) ProgressService.completeRun(node.id,1000);
const next = MAP_NODES.find(n=>n.worldId===WORLDS[1].id && n.nodeType==='main')!;
assert.equal(ProgressService.getSelectedNodeId(),next.id,'open gate advances to the next world');
ProgressService.completeRun(home[0].id,0);
assert.equal(ProgressService.getSelectedNodeId(),home[1].id,'replay advances one stop rather than teleporting');
assert.equal(ProgressService.getBottlesForNode(home[0].id),3,'replays preserve the best rating');
ProgressService.load();
assert.equal(ProgressService.getSelectedNodeId(),home[1].id,'selection persists');
assert.equal(ProgressService.getTotalMilk(),27);
reset();
for (const node of MAP_NODES.filter(n=>n.nodeType==='main' && getWorldForNode(n).order<3)) ProgressService.completeRun(node.id,0);
const thirdWorldEnd = MAP_NODES.filter(n=>n.worldId===WORLDS[2].id && n.nodeType==='main')[7];
const fourthWorldStart = MAP_NODES.find(n=>n.worldId===WORLDS[3].id && n.nodeType==='main')!;
assert.equal(ProgressService.getSelectedNodeId(),thirdWorldEnd.id,'a closed milk gate keeps the player in the current world');
assert.equal(ProgressService.isNodePlayable(fourthWorldStart),false);
assert.equal(ProgressService.consumePendingMapUnlock(),undefined,'stale celebrations are cleared');
for (const value of ['null','[]','"oops"','{bad']) {
  data.set(STORAGE_KEYS.mapProgress,value); ProgressService.load();
  assert.equal(ProgressService.getTotalMilk(),0,'corrupt progress recovers safely');
}
data.set(STORAGE_KEYS.mapProgress,JSON.stringify({[home[0].id]:2.9,[home[1].id]:99,world_01_gate:3,unknown:3}));
ProgressService.load();
assert.equal(ProgressService.getBottlesForNode(home[0].id),2,'ratings are whole bottles');
assert.equal(ProgressService.getTotalMilk(),5,'unknown nodes and gates cannot contribute milk');
for(const invalid of ['null','{}','42','"oops"']) {
  data.set('array',invalid); assert.deepEqual(StorageService.getJson('array',['tabby']),['tabby'],'shop lists reject non-arrays');
}
for (const world of WORLDS) {
  const nodes=MAP_NODES.filter(n=>n.worldId===world.id);
  for (const node of nodes) {
    const p=getNodePoint(node);
    assert.ok(p.x >= -405 && p.x <=405 && p.y >=-130 && p.y<=100,`${node.id} fits the landscape`);
    const previous=node.unlock.previousNodeId ? getRequiredMapNode(node.unlock.previousNodeId) : undefined;
    if(!previous || previous.worldId!==world.id) continue;
    const a=getNodePoint(previous),b=getNodePoint(node);
    const forward=getRouteControl(previous,node),reverse=getRouteControl(node,previous);
    assert.deepEqual(forward,reverse,'reverse movement follows the rendered curve');
    for(let i=0;i<=20;i++) {
      const point=quadraticPoint(a,forward,b,i/20);
      const opposite=quadraticPoint(b,reverse,a,1-i/20);
      assert.ok(Math.abs(point.x-opposite.x)<1e-8 && Math.abs(point.y-opposite.y)<1e-8);
      assert.ok(point.x>=-405 && point.x<=405 && point.y>=-150 && point.y<=115,'trail stays on the landscape');
    }
    const route=getRouteSegments(previous,node);
    assert.equal(route.length,1,'adjacent stops have one edge');
  }
  const mains=nodes.filter(n=>n.nodeType==='main');
  assert.equal(getRouteSegments(mains[0],mains[7]).length,7);
  const branch=nodes.find(n=>n.nodeType==='bonus')!;
  assert.equal(getRouteSegments(branch,mains[7]).length,5,'bonus route rejoins at level four');
}
assert.deepEqual(getRouteSegments(home[0],next),[],'world transitions do not walk through another map');
console.log('Map tests passed: progression, persistence, corrupt saves, gates, bonus routes and all 10 world layouts.');
