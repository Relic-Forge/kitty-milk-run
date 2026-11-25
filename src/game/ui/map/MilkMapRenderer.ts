import Phaser from 'phaser';
import { ASSETS } from '../../assets';
import type { CosmeticOption } from '../../data/cosmetics';
import { MAP_NODES, WORLDS, getMapNodeById, getWorldForNode, type MapNode } from '../../worldMap';
import { PixelButton } from '../components/PixelButton';
import { getNodePoint, getRouteControl, getRouteSegments, quadraticPoint, type MapPoint } from './mapGeometry';

type VisibleGameObject = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;
export type MilkMapRendererConfig = {
  scene: Phaser.Scene;
  overlay: Phaser.GameObjects.Container;
  textStyle: (size: number, color: string) => Phaser.Types.GameObjects.Text.TextStyle;
  createEyeTrackedCat: (x: number, y: number, texture: string, scale: number, nyan?: boolean) => Phaser.GameObjects.Container;
  setEyeTrackedCatTexture: (container: Phaser.GameObjects.Container, cosmetic: CosmeticOption) => void;
  createOverlayButton: (x: number, y: number, width: number, height: number, label: string, color: number, onClick: () => void) => Phaser.GameObjects.Container;
  getSelectedCosmetic: () => CosmeticOption;
  getSelectedMapNode: () => MapNode;
  getSelectedMapNodeId: () => string;
  getCurrentMapCatNode: () => MapNode;
  getTotalMilk: () => number;
  getMapMilkGoal: () => number;
  getBottlesForNode: (id: string) => number;
  getMapCardBody: (node: MapNode) => string;
  isMapNodeUnlocked: (node: MapNode) => boolean;
  isMapNodePlayable: (node: MapNode) => boolean;
  getMapInputReadyAt: () => number;
  isPointerHandled: () => boolean;
  getOverlayMode: () => string;
  selectMapNode: (id: string) => void;
  startGame: () => void;
  showShop: () => void;
  showLaunch: () => void;
};
export type MapUnlockCelebration = { fromNodeId: string; toNodeId: string };
const INK = 0x30365c;

export class MilkMapRenderer {
  readonly elements: VisibleGameObject[] = [];
  private atlas: VisibleGameObject[] = [];
  private worldId?: string;
  private buttons: { node: MapNode; graphics: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; caption: Phaser.GameObjects.Text }[] = [];
  private avatar?: Phaser.GameObjects.Image;
  private avatarNodeId?: string;
  private movement?: Phaser.Tweens.Tween;
  private moving = false;
  private movementVersion = 0;
  private pendingCelebration?: MapUnlockCelebration;
  private title?: Phaser.GameObjects.Text;
  private detail?: Phaser.GameObjects.Text;
  private status?: Phaser.GameObjects.Text;
  private rating?: Phaser.GameObjects.Text;
  private play?: PixelButton;
  private keyHandler?: (event: KeyboardEvent) => void;

  constructor(private readonly config: MilkMapRendererConfig) {}
  private get scene() { return this.config.scene; }
  private get world() { return getWorldForNode(this.config.getSelectedMapNode()); }
  private nodes() { return MAP_NODES.filter((n) => n.worldId === this.world.id); }
  private add<T extends VisibleGameObject>(object: T, atlas = false): T {
    this.config.overlay.add(object); this.elements.push(object);
    if (atlas) this.atlas.push(object);
    return object;
  }
  private text(x: number, y: number, value: string, size: number, color = '#ffffff', atlas = false) {
    return this.add(this.scene.add.text(x, y, value, {
      ...this.config.textStyle(size, color), stroke: '#30365c', strokeThickness: 3
    }).setResolution(2), atlas);
  }
  private button(x: number, y: number, width: number, label: string, color: number, action: () => void, atlas = false, disabled = false) {
    const button = new PixelButton({ scene: this.scene, x, y, width, height: 38, label, color, disabled,
      fontSize: 14, textStyle: this.config.textStyle, onClick: () => {
        if (this.ready()) action();
      } });
    this.add(button.container, atlas); return button;
  }
  private ready() { return this.config.getOverlayMode() === 'map' && this.scene.time.now >= this.config.getMapInputReadyAt() && !this.config.isPointerHandled(); }

  create() {
    this.createAtlasPage();
    const panel = this.scene.add.graphics().fillStyle(INK, 0.96);
    panel.fillRoundedRect(-438, 159, 876, 95, 20);
    panel.lineStyle(2, 0xffffff, 0.65).strokeRoundedRect(-438, 159, 876, 95, 20);
    this.add(panel);
    this.status = this.text(-414, 169, '', 11, '#ffd888');
    this.title = this.text(-414, 188, '', 21, '#fff9e5');
    this.detail = this.text(-414, 220, '', 11, '#e4edff');
    this.detail.setWordWrapWidth(475);
    this.rating = this.text(138, 181, '', 17, '#ffdc88').setOrigin(0.5, 0);
    this.play = this.button(320, 204, 174, 'PLAY', 0x65be82, () => this.activateSelection());
    this.avatar = this.add(this.scene.add.image(0, 0, this.config.getSelectedCosmetic().run1));
    this.keyHandler = (event: KeyboardEvent) => {
      if (!this.ready() || event.repeat) return;
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) event.preventDefault();
      const node = this.config.getSelectedMapNode();
      if (event.key === 'Enter' || event.key === ' ') { this.activateSelection(); return; }
      if (event.key === 'Escape') { this.config.showLaunch(); return; }
      if (event.key === 'ArrowUp') {
        const bonus = this.nodes().find((n) => n.nodeType === 'bonus' && n.unlock.previousNodeId === node.id);
        if (bonus) this.config.selectMapNode(bonus.id);
        return;
      }
      if (event.key === 'ArrowDown' && node.nodeType === 'bonus' && node.unlock.previousNodeId) {
        this.config.selectMapNode(node.unlock.previousNodeId); return;
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const stops = this.nodes().filter((n) => n.nodeType !== 'bonus');
      const anchorId = node.nodeType === 'bonus' ? node.unlock.previousNodeId : node.id;
      const index = stops.findIndex((n) => n.id === anchorId);
      const next = event.key === 'ArrowLeft' ? getMapNodeById(node.unlock.previousNodeId ?? '') : stops[index + 1];
      if (next) this.config.selectMapNode(next.id);
    };
    this.scene.input.keyboard?.on('keydown', this.keyHandler);
    this.update();
  }
  destroy() {
    this.cancelMovement();
    if (this.keyHandler) this.scene.input.keyboard?.off('keydown', this.keyHandler);
  }
  setPendingCelebration(value: MapUnlockCelebration | undefined) { this.pendingCelebration = value; }
  private cancelMovement() {
    this.movementVersion++; this.movement?.stop(); this.movement = undefined; this.moving = false;
    if (this.avatar) this.scene.tweens.killTweensOf(this.avatar);
  }
  createAtlasPage() {
    if (this.worldId === this.world.id) return;
    this.cancelMovement(); this.avatarNodeId = undefined;
    for (const element of this.atlas) {
      Phaser.Utils.Array.Remove(this.elements, element);
      // Hover/ambient tweens must not retain destroyed objects after changing worlds.
      this.scene.tweens.killTweensOf(element); element.destroy();
    }
    this.atlas = []; this.buttons = []; this.worldId = this.world.id;
    this.drawLandscape(); this.drawHeader(); this.drawConnections(); this.drawStops();
    // The new landscape covers the full screen; keep the persistent level card
    // above it when navigating between chapters.
    for (const element of this.elements) {
      if (!this.atlas.includes(element)) this.config.overlay.bringToTop(element);
    }
  }
  private drawHeader() {
    const index = this.world.order;
    const plaque = this.scene.add.graphics();
    plaque.fillStyle(0x30243a, 0.87).fillRoundedRect(-353, -261, 564, 91, 18);
    plaque.lineStyle(2, 0xffdeb0, 0.8).strokeRoundedRect(-353, -261, 564, 91, 18);
    this.add(plaque, true);
    this.text(-333, -250, `THE MILK TRAIL  /  WORLD ${String(index + 1).padStart(2, '0')}`, 11, '#e8f6ff', true);
    this.text(-333, -231, this.world.displayName, 27, '#fff8df', true);
    const milk = this.nodes().filter((n) => n.nodeType !== 'gate').reduce((sum, n) => sum + this.config.getBottlesForNode(n.id), 0);
    this.text(-332, -194, `${milk}/27 bottles  ·  ${this.world.mapSkin.pathName}`, 11, '#eff6ff', true);
    this.button(-402, -215, 52, '<', 0x536c9d, () => this.visitWorld(index - 1), true, index === 0);
    this.button(405, -215, 52, '>', 0x536c9d, () => this.visitWorld(index + 1), true, index === WORLDS.length - 1);
    this.button(299, -226, 112, 'SHOP', 0xd890b0, this.config.showShop, true);
    this.button(299, -181, 112, 'HOME', 0x688bb1, this.config.showLaunch, true);
    this.text(105, -243, `MILK ${this.config.getTotalMilk()}/${this.config.getMapMilkGoal()}`, 12, '#fff4b5', true).setOrigin(0.5, 0);
    WORLDS.forEach((world, i) => {
      const x = -59 + i * 18;
      const unlocked = this.config.isMapNodeUnlocked(MAP_NODES.find((n) => n.worldId === world.id && n.nodeType === 'main')!);
      const dot = this.add(this.scene.add.circle(x, -190, i === index ? 6 : 4, i === index ? 0xffdc88 : unlocked ? 0xd6f4ed : 0x617c9c), true);
      const zone = this.add(this.scene.add.zone(x, -190, 17, 24).setInteractive({ useHandCursor: true }), true);
      zone.on('pointerup', () => { if (this.ready()) this.visitWorld(i); });
      if (i === index) dot.setStrokeStyle(2, 0xffffff);
    });
    this.add(this.scene.add.rectangle(0, 141, 336, 20, INK, 0.86), true);
    this.text(0, 141, 'Tap a stop to travel  ·  Arrows to explore  ·  Enter to play', 10, '#d8edf8', true).setOrigin(0.5);
  }
  private visitWorld(index: number) {
    const world = WORLDS[index]; if (!world) return;
    const nodes = MAP_NODES.filter((n) => n.worldId === world.id && n.nodeType === 'main');
    const next = [...nodes].reverse().find((n) => this.config.isMapNodePlayable(n)) ?? nodes[0];
    this.config.selectMapNode(next.id);
  }
  private drawLandscape() {
    this.add(this.scene.add.image(0, 0, this.world.id).setDisplaySize(960, 540), true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const outdoors = this.world.order >= 5 && this.world.order < 9;
    // Give the scene a resident, with motion confined to a pocket off the trail.
    const enchanted = this.world.order === 9;
    const texture = enchanted ? ASSETS.magicKingdomStarLantern : outdoors ? ASSETS.flower : ASSETS.mouseRodent;
    const resident = this.add(this.scene.add.image(-235, 68, texture), true);
    resident.setScale((enchanted ? 44 : 31) / resident.width);
    if (enchanted || outdoors) {
      resident.setOrigin(0.5, 0.9).setAngle(-7);
      this.scene.tweens.add({ targets: resident, angle: 7, y: enchanted ? 56 : 68,
        duration: 1650, ease: 'Sine.inOut', yoyo: true, repeat: -1 });
    } else {
      this.scene.tweens.add({ targets: resident, x: -192, duration: 680,
        hold: 1100, repeatDelay: 1900, ease: 'Sine.inOut', yoyo: true, repeat: -1,
        onYoyo: () => resident.setFlipX(true), onRepeat: () => resident.setFlipX(false) });
    }
    for (let i = 0; i < 10; i++) {
      const x = -440 + (i * 173 + this.world.order * 37) % 875;
      const y = -155 + (i * 79) % 265;
      const mote = this.add(this.scene.add.star(x, y, 4, 1, i % 3 + 2,
        outdoors ? 0xffeba1 : 0xfff4db).setAlpha(0), true);
      this.scene.tweens.add({
        targets: mote, x: x + 12, y: y - 24, alpha: 0.9, angle: 45,
        duration: 1500 + i * 145, delay: i * 130, ease: 'Sine.inOut', yoyo: true, repeat: -1
      });
    }
  }
  private drawConnections() {
    for (const to of this.nodes()) {
      const from = getMapNodeById(to.unlock.previousNodeId ?? '');
      if (!from || from.worldId !== to.worldId) continue;
      const start = getNodePoint(from), end = getNodePoint(to), control = getRouteControl(from,to);
      const unlocked = this.config.isMapNodeUnlocked(to);
      const g = this.scene.add.graphics();
      const stroke = (width: number, color: number, alpha = 1) => {
        g.lineStyle(width,color,alpha).beginPath().moveTo(start.x,start.y + 3);
        for (let i=1;i<=32;i++) { const p=quadraticPoint(start,control,end,i/32); g.lineTo(p.x,p.y + 3); }
        g.strokePath();
      };
      stroke(to.nodeType === 'bonus' ? 14 : 23, INK, 0.16);
      stroke(to.nodeType === 'bonus' ? 11 : 18, this.world.palette.pathEdge);
      stroke(to.nodeType === 'bonus' ? 7 : 12, unlocked ? 0xffe7a5 : this.world.palette.path);
      // Markers are drawn in local positions, never rotated around the canvas origin.
      for (let i=1;i<8;i++) {
        const p=quadraticPoint(start,control,end,i/8);
        g.fillStyle(unlocked ? 0xffffff : 0xa58f84, unlocked ? 0.8 : 0.45).fillCircle(p.x,p.y,2);
      }
      this.add(g,true);
    }
  }
  private drawStops() {
    for (const node of this.nodes()) {
      const p=getNodePoint(node);
      const container=this.add(this.scene.add.container(p.x,p.y),true);
      const graphics=this.scene.add.graphics();
      const label=this.scene.add.text(0,0,node.nodeType === 'bonus' ? '+' : node.nodeType === 'gate' ? '>' : String(this.world.order*8 + this.nodes().filter((n)=>n.nodeType==='main').findIndex((n)=>n.id===node.id)+1), {
        ...this.config.textStyle(18,'#fff9e5'),stroke:'#30365c',strokeThickness:3
      }).setOrigin(0.5).setResolution(2);
      const caption=this.scene.add.text(0,39,node.nodeType==='bonus'?'BONUS':node.nodeType==='gate'?'NEXT WORLD':'', {
        ...this.config.textStyle(9,'#fff9e5'),stroke:'#30365c',strokeThickness:3
      }).setOrigin(0.5).setResolution(2);
      const zone=this.scene.add.zone(0,0,64,66).setInteractive({useHandCursor:true});
      container.add([graphics,label,caption,zone]);
      zone.on('pointerup',()=>{if(this.ready()) this.config.selectMapNode(node.id);});
      zone.on('pointerover',()=>container.setScale(1.07));
      zone.on('pointerout',()=>container.setScale(1));
      this.buttons.push({node,graphics,label,caption});
    }
  }
  update() {
    const node=this.config.getSelectedMapNode();
    const unlocked=this.config.isMapNodeUnlocked(node);
    const bottles=this.config.getBottlesForNode(node.id);
    this.title?.setText(node.displayName);
    this.status?.setText(node.nodeType==='gate' ? (unlocked?'NEXT WORLD IS OPEN':'WORLD GATE · LOCKED') : !unlocked?'LOCKED STOP':node.nodeType==='bonus'?'BONUS DETOUR':bottles?'COMPLETED · REPLAY FOR MORE MILK':'YOUR NEXT ADVENTURE');
    const previous=getMapNodeById(node.unlock.previousNodeId??'');
    const needsPrevious=previous && !this.config.isMapNodeUnlocked(node) && (previous.nodeType==='gate' ? !this.config.isMapNodeUnlocked(previous) : this.config.getBottlesForNode(previous.id)===0);
    const milkNeeded=Math.max(0,node.unlock.requiredMilkBottles-this.config.getTotalMilk());
    this.detail?.setText(unlocked?node.flavor:[needsPrevious?`Finish ${previous!.displayName}.`:'',milkNeeded?`Earn ${milkNeeded} more milk ${milkNeeded===1?'bottle':'bottles'}.`:''].filter(Boolean).join(' ') || 'Finish the previous stop to unlock.');
    this.rating?.setText(node.nodeType==='gate' ? '' : `${'★'.repeat(bottles)}${'☆'.repeat(3-bottles)}\nBEST MILK`).setFontSize(14);
    this.play?.setLabel(!unlocked?'LOCKED':node.nodeType==='gate'?'ENTER WORLD':bottles?'REPLAY':'PLAY');
    this.play?.setDisabled(!unlocked || this.moving);
    for (const button of this.buttons) this.drawStop(button);
    this.updateAvatar(node);
    if (this.avatar) this.config.overlay.bringToTop(this.avatar);
  }
  private drawStop({node,graphics:g,label,caption}: typeof this.buttons[number]) {
    const selected=node.id===this.config.getSelectedMapNodeId();
    const unlocked=this.config.isMapNodeUnlocked(node), bottles=this.config.getBottlesForNode(node.id);
    const radius=node.nodeType==='gate'?24:node.nodeType==='bonus'?23:22;
    g.clear();
    if (selected) {
      g.lineStyle(3,0xfffcdb,1).strokeCircle(0,0,radius+7);
      g.lineStyle(3,0xffdc88,0.9).strokeCircle(0,0,radius+11);
    }
    g.fillStyle(INK,0.2).fillEllipse(0,8,radius*2+9, radius*2);
    g.fillStyle(unlocked?bottles?0x69b996:node.nodeType==='bonus'?0xe9ac62:0xf5c976:0x827388).fillCircle(0,0,radius);
    g.lineStyle(3,unlocked?0xfff4d6:0xd8c9c8).strokeCircle(0,0,radius);
    g.fillStyle(0xffffff,0.22).fillEllipse(-6,-10,22,10);
    label.setVisible(unlocked || node.nodeType === 'main');
    if (node.nodeType === 'main') caption.setVisible(false);
    if (node.nodeType === 'gate') {
      g.fillStyle(0x92728d).fillRoundedRect(-25,-34,50,58,9);
      g.fillStyle(0xffe6bd).fillRoundedRect(-22,-37,44,58,9);
      g.fillStyle(unlocked?0x70b99c:0x74758e).fillRoundedRect(-15,-29,30,49,7);
      g.fillStyle(0xffe6bd).fillRect(-22,-40,9,8).fillRect(-5,-40,10,8).fillRect(13,-40,9,8);
      if (unlocked) g.fillStyle(0xffdc88).fillTriangle(-5,-14,8,-7,-5,0);
      label.setVisible(false);
    }
    if (!unlocked && node.nodeType !== 'main') {
      g.lineStyle(3,0x525b6e).strokeRoundedRect(-6,-9,12,14,6);
      g.fillStyle(0x525b6e).fillRoundedRect(-10,-2,20,16,4);
      g.fillStyle(0xdedce1).fillCircle(0,4,2).fillRect(-1,4,2,5);
    }
    if (node.nodeType!=='gate') for(let i=0;i<3;i++) {
      g.fillStyle(i<bottles?0xffe797:0xffffff,i<bottles?1:0.45).fillCircle(-12+i*12,29,3.5);
    }
  }
  private updateAvatar(selected: MapNode) {
    if(!this.avatar) return;
    if (this.config.getOverlayMode() !== 'map') {
      this.cancelMovement(); this.avatar.setVisible(false); this.avatarNodeId = undefined; return;
    }
    const celebration=this.pendingCelebration; this.pendingCelebration=undefined;
    const targetNode=this.config.isMapNodeUnlocked(selected)?selected:this.config.getCurrentMapCatNode();
    if(targetNode.worldId!==this.world.id) { this.cancelMovement(); this.avatar.setVisible(false); this.avatarNodeId=undefined; return; }
    const cosmetic=this.config.getSelectedCosmetic();
    this.avatar.setVisible(true);
    const scale=cosmetic.style==='nyan'?0.39:0.47;
    const target=getNodePoint(targetNode);
    const from=getMapNodeById(celebration?.fromNodeId??this.avatarNodeId??'');
    if(this.avatarNodeId===targetNode.id && !celebration) return;
    // Finish the current edge before following a newly tapped destination. This
    // keeps rapid taps from spawning competing tweens or teleporting the kitty.
    if (this.moving) return;
    this.cancelMovement();
    const route=from?getRouteSegments(from,targetNode):[];
    this.avatarNodeId=targetNode.id;
    if(!route.length) {
      this.avatar.setTexture(cosmetic.run1).setPosition(target.x,target.y-36).setScale(scale).setAngle(0);
      if(celebration) this.celebrate(target);
      this.play?.setDisabled(!this.config.isMapNodeUnlocked(selected)); return;
    }
    this.moving=true; this.play?.setDisabled(true);
    const version=this.movementVersion;
    const start=getNodePoint(from!);
    this.avatar.setPosition(start.x,start.y-36).setScale(scale);
    const progress={value:0};
    this.movement=this.scene.tweens.add({targets:progress,value:route.length,duration:Math.min(1600,route.length*300),ease:'Linear',
      onUpdate:()=>{
        if(version!==this.movementVersion || !this.avatar) return;
        const index=Math.min(route.length-1,Math.floor(progress.value));
        const segment=route[index], t=Math.min(1,progress.value-index);
        const a=getNodePoint(segment.from), b=getNodePoint(segment.to);
        const p=quadraticPoint(a,getRouteControl(segment.from,segment.to),b,t);
        this.avatar.setPosition(p.x,p.y-36-Math.abs(Math.sin(progress.value*Math.PI*6))*3)
          .setTexture(progress.value%0.3<0.15?cosmetic.run1:cosmetic.run2);
      },onComplete:()=>{
        if(version!==this.movementVersion || !this.avatar) return;
        this.moving=false; this.movement=undefined;
        this.avatar.setPosition(target.x,target.y-36).setTexture(cosmetic.run1);
        this.play?.setDisabled(!this.config.isMapNodeUnlocked(this.config.getSelectedMapNode()));
        if(celebration) this.celebrate(target);
        this.updateAvatar(this.config.getSelectedMapNode());
      }});
  }
  private activateSelection() {
    if(this.moving) return;
    const node=this.config.getSelectedMapNode();
    if(!this.config.isMapNodeUnlocked(node)) return;
    if(node.nodeType==='gate') this.visitWorld(this.world.order+1);
    else if(this.config.isMapNodePlayable(node)) this.config.startGame();
  }
  private celebrate(point: MapPoint) {
    for(let i=0;i<14;i++) {
      const angle=i/14*Math.PI*2;
      const star=this.add(this.scene.add.star(point.x,point.y-20,4,2,6,i%2?0xffdc88:0xffffff));
      this.scene.tweens.add({targets:star,x:point.x+Math.cos(angle)*64,y:point.y-20+Math.sin(angle)*54,alpha:0,angle:120,duration:650,
        onComplete:()=>{Phaser.Utils.Array.Remove(this.elements,star);star.destroy();}});
    }
  }
}
