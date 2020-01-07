import display from 'display/Display';

class Stage {
  constructor(battleController, stage) {
    this.battleController = battleController;
    this.baseScale = this.battleController.baseScale;
    this.fgScale = this.battleController.baseScale;

    const { floor, bg, fg } = stage;
    this.floorAnim = display.getAnimation(floor);
    this.fgAnim = display.getAnimation(fg);
    this.bgAnim = display.getAnimation(bg);
  }

  setBaseScale(s) {
    this.baseScale = s;
    this.setFgScale(s + (this.fgScale - this.baseScale));
  }

  setFgScale(s) {
    this.fgScale = s;
  }

  draw(camera, cameraFg) {
    const { offsetX, offsetY } = camera.getOffsets();
    const { offsetX: offsetXFg, offsetY: offsetYFg } = cameraFg.getOffsets();

    display.drawAnimation(
      this.bgAnim,
      this.battleController.getUnitLength() + offsetX / 2,
      offsetY / 2,
      {
        centered: true,
        scale: this.baseScale * 2,
      }
    );
    display.drawAnimation(this.floorAnim, offsetX, offsetY, {
      centered: true,
      scale: this.baseScale,
    });
    display.drawAnimation(this.fgAnim, offsetXFg, offsetYFg, {
      centered: true,
      scale: this.fgScale,
    });
  }
}

export default Stage;
