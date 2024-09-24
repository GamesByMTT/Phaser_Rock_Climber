import { Scene, GameObjects, Scale } from 'phaser';
import { Slots } from '../scripts/Slots';
import { UiContainer } from '../scripts/UiContainer';
import { LineGenerator, Lines } from '../scripts/Lines';
import { UiPopups } from '../scripts/UiPopup';
import LineSymbols from '../scripts/LineSymbols';
import { Globals, ResultData, currentGameData, initData, gambleResult } from '../scripts/Globals';
import { gameConfig } from '../scripts/appconfig';
import BonusScene from './BonusScene';
import SoundManager from '../scripts/SoundManager';

export default class MainScene extends Scene {
    gameBg!: Phaser.GameObjects.Sprite
    slot!: Slots;
    slotFrame!: Phaser.GameObjects.Sprite
    reelBg!: Phaser.GameObjects.Sprite
    lineGenerator!: LineGenerator;
    soundManager!: SoundManager
    uiContainer!: UiContainer;
    uiPopups!: UiPopups;
    lineSymbols!: LineSymbols
    onSpinSound!: Phaser.Sound.BaseSound
    private mainContainer!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'MainScene' });
    }
    /**
     * @method create method used to create scene and add graphics respective to the x and y coordinates
     */
    create() {
        // Set up the background
        const { width, height } = this.cameras.main;
        // Initialize main container
        this.mainContainer = this.add.container();
        this.soundManager = new SoundManager(this)
        console.log("ManinScene Loaded on Rock Climbing Monkey");
        // Set up the stairs frame
        this.gameBg = new Phaser.GameObjects.Sprite(this, width/2, height/2, 'gameBg').setDepth(0).setDisplaySize(1920, 1080)
        // this.reelBg = new Phaser.GameObjects.Sprite(this, width/2, height/2.2, 'reelBg').setDepth(0)
        
        this.mainContainer.add([this.gameBg])
        this.soundManager.playSound("backgroundMusic")

        // Initialize UI Container
        this.uiContainer = new UiContainer(this, () => this.onSpinCallBack(), this.soundManager);
        this.mainContainer.add(this.uiContainer);
        // // Initialize Slots
        this.slot = new Slots(this, this.uiContainer,() => this.onResultCallBack(), this.soundManager);
        // Initialize payLines
        this.lineGenerator = new LineGenerator(this, this.slot.slotSymbols[0][0].symbol.height + 50, this.slot.slotSymbols[0][0].symbol.width + 10);
        this.mainContainer.add([this.lineGenerator, this.slot]);

        // Initialize UI Popups
        this.uiPopups = new UiPopups(this, this.uiContainer, this.soundManager);
        this.mainContainer.add(this.uiPopups)

        // Initialize LineSymbols
        this.lineSymbols = new LineSymbols(this, 10, 12, this.lineGenerator)
        
        this.mainContainer.add(this.lineSymbols);
        const frames = [];
        for (let i = 0; i <= 33; i++) {
            frames.push({ key: `man${i}` }); // Use the same key names as loaded in preload
          }
          // Create an animation using frame objects
          this.anims.create({
            key: 'monkeySwing',   // Key for the animation
            frames: frames,       // Frames array
            frameRate: 25,        // Animation speed
            repeat: -1            // Repeat indefinitely
          });
          // Add a sprite to play the animation
          const man = this.add.sprite(gameConfig.scale.width/2 + 800, gameConfig.scale.height/ 1.60, 'man0').setScale(0.85);
          // Play the animation on the sprite
          man.play('monkeySwing');
    }

    update(time: number, delta: number) {
        // this.slot.update(time, delta);
        this.uiContainer.update()
        // this.uiContainer.doubleBtnInit()
    }

    /**
     * @method onResultCallBack Change Sprite and Lines
     * @description update the spirte of Spin Button after reel spin and emit Lines number to show the line after wiining
     */
    onResultCallBack() {
        const onSpinMusic = "onSpin"
        this.uiContainer.onSpin(false);
        this.soundManager.stopSound(onSpinMusic)
        this.lineGenerator.showLines(ResultData.gameData.linesToEmit);
    }
    /**
     * @method onSpinCallBack Move reel
     * @description on spin button click moves the reel on Seen and hide the lines if there are any
     */
    onSpinCallBack() {
        const onSpinMusic = "onSpin"
        this.soundManager.playSound(onSpinMusic)
        this.slot.moveReel();
        this.lineGenerator.hideLines();
    }

    /**
     * @method recievedMessage called from MyEmitter
     * @param msgType ResultData
     * @param msgParams any
     * @description this method is used to update the value of textlabels like Balance, winAmount freeSpin which we are reciving after every spin
     */
    recievedMessage(msgType: string, msgParams: any) {
        if (msgType === 'ResultData') {
            this.time.delayedCall(3000, () => {    
                if (ResultData.gameData.isBonus) {
                    if(this.uiContainer.isAutoSpinning){
                        this.uiContainer.autoBetBtn.emit('pointerdown'); 
                        this.uiContainer.autoBetBtn.emit('pointerup');
                    }
                    Globals.SceneHandler?.addScene('BonusScene', BonusScene, true)
                }        
                this.uiContainer.currentWiningText.updateLabelText(ResultData.playerData.currentWining.toString());
                currentGameData.currentBalance = ResultData.playerData.Balance;
                let betValue = (initData.gameData.Bets[currentGameData.currentBetIndex]) * 20
                let jackpot = ResultData.gameData.jackpot
                let winAmount = ResultData.gameData.WinAmout;   
                this.uiContainer.currentBalanceText.updateLabelText(currentGameData.currentBalance.toFixed(2));
                const freeSpinCount = ResultData.gameData.freeSpins.count;
                // const freeSpinCount = 5;
                // Check if freeSpinCount is greater than 1
                if (freeSpinCount >= 1) {
                    this.freeSpinPopup(freeSpinCount, 'freeSpinPopup')
                    this.uiContainer.freeSpininit(freeSpinCount)
                    this.tweens.add({
                        targets: this.uiContainer.freeSpinText,
                        scaleX: 1.3, 
                        scaleY: 1.3, 
                        duration: 800, // Duration of the scale effect
                        yoyo: true, 
                        repeat: -1, 
                        ease: 'Sine.easeInOut' // Easing function
                    });
                } else {
                    // If count is 1 or less, ensure text is scaled normally
                    this.uiContainer.freeSpininit(freeSpinCount)
                }
                if (winAmount >= 15 * betValue && winAmount < 20 * betValue) {
                    // HugeWinPopup
                    this.showWinPopup(winAmount, 'hugeWinPopup')
                } else if (winAmount >= 20 * betValue && winAmount < 25 * betValue) {
                    //MegawinPopup
                    this.showWinPopup(winAmount, 'megaWinPopup')
                }
            });
            setTimeout(() => {
                this.slot.stopTween();
            }, 1000);
        }
        if(msgType === 'GambleResult'){
            this.uiContainer.currentWiningText.updateLabelText(gambleResult.gamleResultData.currentWining.toString());
        }
    }

    /**
     * @method showWinPopup
     * @description Displays a popup showing the win amount with an increment animation and different sprites
     * @param winAmount The amount won to display in the popup
     * @param spriteKey The key of the sprite to display in the popup
     */
    showWinPopup(winAmount: number, spriteKey: string) {
        // Create the popup background
        const inputOverlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
        .setOrigin(0, 0)
        .setDepth(9) // Set depth to be below the popup but above game elements
        .setInteractive() // Make it interactive to block all input events
        inputOverlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
        });

        const megaWinBg = this.add.sprite(gameConfig.scale.width / 2, gameConfig.scale.height / 2, "megawinAnimBg")
        .setDepth(10)
        .setOrigin(0.5);

        // this.tweens.add({
        //     targets: megaWinBg,
        //     scale: 1.2, // Scale up a bit 
        //     duration: 500, 
        //     yoyo: true, 
        //     repeat: -1, 
        //     ease: 'Sine.easeInOut'
        // });
        const megaWinStar = this.add.sprite(gameConfig.scale.width / 2, gameConfig.scale.height / 2, "megawinStar")
            .setDepth(12) // Ensure it's above the rotating background
            .setOrigin(0.5)
            .setScale(0); // Start hidden (scaled down)

        this.tweens.add({
            targets: megaWinStar,
            scale: 1,  
            duration: 500,
            yoyo: true, 
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 250 // Start after half of megaWinBg's animation 
        });

        const coinFrames = [];
        for (let i = 0; i < 19; i++) { // Assuming you have 50 frames (winning0 to winning49)
            coinFrames.push({ key: `coin${i}` });
        }
        this.anims.create({
            key: `coinFlip`,
            frames: coinFrames,
            frameRate: 10,
            repeat: -1 
        });
        const winningSprite = this.add.sprite(gameConfig.scale.width / 4, gameConfig.scale.height * 0.8, `coin0`).setDepth(13).setScale(0.7)
        winningSprite.play('coinFlip')
        
        const winSprite = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY - 50, spriteKey).setScale(0.8);
        winSprite.setDepth(13)

        // Tween to animate the text increment from 0 to winAmount
        this.tweens.addCounter({
            from: 0,
            to: winAmount,
            duration: 1000, // Duration of the animation in milliseconds
            onUpdate: (tween) => {
                const value = Math.floor(tween.getValue());
               
            },
            onComplete: () => {
                // Automatically close the popup after a few seconds
                this.time.delayedCall(4000, () => {
                    inputOverlay.destroy();
                    // winBg.destroy();
                    megaWinBg.destroy();
                    megaWinStar.destroy();
                    winSprite.destroy();
                    winningSprite.stop()
                    winningSprite.destroy();
                });
            }
        });
    }

    /**
     * @method freeSpinPopup
     * @description Displays a popup showing the win amount with an increment animation and different sprites
     * @param freeSpinCount The amount won to display in the popup
     * @param spriteKey The key of the sprite to display in the popup
     */
    freeSpinPopup(freeSpinCount: number, spriteKey: string) {
        console.log(this.uiContainer.isAutoSpinning, "AutoSpinCheck");
        
        // Create the popup background
        const inputOverlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5)
        .setOrigin(0, 0)
        .setDepth(9) // Set depth to be below the popup but above game elements
        .setInteractive() // Make it interactive to block all input events
        inputOverlay.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            pointer.event.stopPropagation();
        });
        const winSprite = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, spriteKey).setDepth(11);
        if(!this.uiContainer.isAutoSpinning){
          
            
        }
        // Create the text object to display win amount
        const freeText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, '0', {
            font: '45px',
            color: '#FFFFFF'
        }).setDepth(11).setOrigin(0.5);
        // Tween to animate the text increment from 0 to winAmount
        this.tweens.addCounter({
            from: 0,
            to: freeSpinCount,
            duration: 1000, // Duration of the animation in milliseconds
            onUpdate: (tween) => {
                const value = Math.floor(tween.getValue());
                freeText.setText(value.toString());
            },
            onComplete: () => {
                const startButton = this.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY + 80, 'freeSpinStartButton').setDepth(11).setScale(0.5, 0.5).setInteractive();
                startButton.on("pointerdown", () => {
                    inputOverlay.destroy();
                    freeText.destroy();
                    winSprite.destroy();
                    startButton.destroy();
                    Globals.Socket?.sendMessage("SPIN", { currentBet: currentGameData.currentBetIndex, currentLines: 9, spins: 1 });
                    currentGameData.currentBalance -= initData.gameData.Bets[currentGameData.currentBetIndex];
                    // this.currentBalanceText.updateLabelText(currentGameData.currentBalance.toFixed(2));
                    this.onSpinCallBack();
        });
                if(this.uiContainer.isAutoSpinning){
                this.time.delayedCall(3000, () => {
                    inputOverlay.destroy();
                    freeText.destroy();
                    winSprite.destroy();
                });
                }
                // Automatically close the popup after a few seconds
                
            }
        });
    }

   
}
