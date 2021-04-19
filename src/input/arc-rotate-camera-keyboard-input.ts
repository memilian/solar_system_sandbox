import {
  ArcRotateCamera,
  ArcRotateCameraKeyboardMoveInput,
  Camera,
  Engine,
  ICameraInput,
  KeyboardEventTypes,
  KeyboardInfo,
  Nullable,
  Observer,
  Scene,
  serialize,
} from '@babylonjs/core'

export class ArcRotateCameraKeyboardInput implements ICameraInput<ArcRotateCamera> {
  @serialize()
  public keysUp = ['z']

  @serialize()
  public keysDown = ['s']

  @serialize()
  public keysLeft = ['q']

  @serialize()
  public keysRight = ['d']

  @serialize()
  public keysReset = ['Backspace']

  @serialize()
  public panningSensibility: number = 5.0

  camera: ArcRotateCamera
  private onCanvasBlurObserver: Nullable<Observer<Engine>>
  private onKeyboardObserver: Nullable<Observer<KeyboardInfo>>
  private engine: Engine
  private scene: Scene
  private keys: Array<string> = []

  public attachControl(noPreventDefault?: boolean): void {
    if (this.onCanvasBlurObserver) {
      return
    }

    this.scene = this.camera.getScene()
    this.engine = this.scene.getEngine()

    this.onCanvasBlurObserver = this.engine.onCanvasBlurObservable.add(() => {
      this.keys = []
    })

    this.onKeyboardObserver = this.scene.onKeyboardObservable.add((info) => {
      let evt = info.event
      if (!evt.metaKey) {
        if (info.type === KeyboardEventTypes.KEYDOWN) {
          if (
            this.keysUp.indexOf(evt.key) !== -1 ||
            this.keysDown.indexOf(evt.key) !== -1 ||
            this.keysLeft.indexOf(evt.key) !== -1 ||
            this.keysRight.indexOf(evt.key) !== -1 ||
            this.keysReset.indexOf(evt.key) !== -1
          ) {
            var index = this.keys.indexOf(evt.key)

            if (index === -1) {
              this.keys.push(evt.key)
            }

            if (evt.preventDefault) {
              if (!noPreventDefault) {
                evt.preventDefault()
              }
            }
          }
        } else {
          if (
            this.keysUp.indexOf(evt.key) !== -1 ||
            this.keysDown.indexOf(evt.key) !== -1 ||
            this.keysLeft.indexOf(evt.key) !== -1 ||
            this.keysRight.indexOf(evt.key) !== -1 ||
            this.keysReset.indexOf(evt.key) !== -1
          ) {
            var index = this.keys.indexOf(evt.key)

            if (index >= 0) {
              this.keys.splice(index, 1)
            }

            if (evt.preventDefault) {
              if (!noPreventDefault) {
                evt.preventDefault()
              }
            }
          }
        }
      }
    })
  }

  public detachControl(): void {
    if (this.scene) {
      if (this.onKeyboardObserver) {
        this.scene.onKeyboardObservable.remove(this.onKeyboardObserver)
      }
      if (this.onCanvasBlurObserver) {
        this.engine.onCanvasBlurObservable.remove(this.onCanvasBlurObserver)
      }
      this.onKeyboardObserver = null
      this.onCanvasBlurObserver = null
    }

    this.keys = []
  }

  getClassName() {
    return 'ArcRotateCameraKeyboardInput'
  }

  //for example "mouse" will turn into camera.inputs.attached.mouse
  getSimpleName() {
    return 'smoothkeyboard'
  }

  //this optional function will get called for each rendered frame, if you want to synchronize your input to rendering,
  //no need to use requestAnimationFrame. It's a good place for applying calculations if you have to
  public checkInputs(): void {
    if (this.onKeyboardObserver) {
      var camera = this.camera

      for (var index = 0; index < this.keys.length; index++) {
        var key = this.keys[index]
        if (this.keysLeft.indexOf(key) !== -1) {
            camera.inertialPanningX -= 1 / this.panningSensibility
        } else if (this.keysUp.indexOf(key) !== -1) {
            camera.inertialPanningY += 1 / this.panningSensibility
        } else if (this.keysRight.indexOf(key) !== -1) {
            camera.inertialPanningX += 1 / this.panningSensibility
        } else if (this.keysDown.indexOf(key) !== -1) {
            camera.inertialPanningY -= 1 / this.panningSensibility
        } else if (this.keysReset.indexOf(key) !== -1) {
          if (camera.useInputToRestoreState) {
            camera.restoreState()
          }
        }
      }
    }
  }
}
