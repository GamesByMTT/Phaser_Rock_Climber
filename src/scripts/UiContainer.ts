import Phaser from 'phaser';
import { Scene, GameObjects, Types } from 'phaser';
import { Globals, ResultData, currentGameData, initData } from './Globals';
import { TextLabel } from './TextLabel';
import { gameConfig } from './appconfig';
import SoundManager from './SoundManager';
import GambleScene from '../view/GambleScene';
// Define UiContainer as a Phaser Scene class
export class UiContainer extends Phaser.GameObjects.Container {
    SoundManager: SoundManager
    spinBtn!: Phaser.GameObjects.Sprite;
    maxbetBtn!: Phaser.GameObjects.Sprite;
    autoBetBtn!: Phaser.GameObjects.Sprite;
    doubleButton!: Phaser.GameObjects.Sprite;
    CurrentBetText!: TextLabel;
    currentWiningText!: TextLabel;
    WiningText!: Phaser.GameObjects.Text;
    currentBalanceText!: TextLabel;
    CurrentLineText!: TextLabel;
    pBtn!: Phaser.GameObjects.Sprite;
    linesNumber!: Phaser.GameObjects.Sprite;
    fadeDoubbleButton!: Phaser.GameObjects.Sprite;
    public isAutoSpinning: boolean = false; // Flag to track if auto-spin is active
    mainScene!: Phaser.Scene
    fireSprite1!: Phaser.GameObjects.Sprite
    fireSprite2!: Phaser.GameObjects.Sprite
    betButtonDisable!: Phaser.GameObjects.Container

    constructor(scene: Scene, spinCallBack: () => void, soundManager: SoundManager) {
        super(scene);
        scene.add.existing(this); 
        // Initialize UI elements
        this.maxBetInit();
        this.spinBtnInit(spinCallBack);
        this.autoSpinBtnInit(spinCallBack);
        this.lineBtnInit();
        this.winBtnInit();
        this.balanceBtnInit();
        this.BetBtnInit();
        this.fadeDoubbleBtn()
        this.linesNumberInit();
        this.SoundManager = soundManager;
    }

    /**
     * @method lineBtnInit Shows the number of lines for example 1 to 20
     */
    lineBtnInit() { 
        const container = this.scene.add.container(0, 0);
        const linePanel = this.scene.add.sprite(0, 0, "lines").setDepth(0);
        linePanel.setOrigin(0.5);
        linePanel.setPosition(linePanel.width * 2.2, gameConfig.scale.height/2 - 100);
        // container.add(lineText);
        this.pBtn = this.createButton('pBtn', gameConfig.scale.width / 2 - this.maxbetBtn.width / 2.15, gameConfig.scale.height - this.maxbetBtn.height * 0.7, () => {
            this.bnuttonMusic("buttonpressed");
            this.pBtn.setTexture('pBtnH');
            this.pBtn.disableInteractive();
            if (!currentGameData.isMoving) {
                currentGameData.currentBetIndex++;
                if (currentGameData.currentBetIndex >= initData.gameData.Bets.length) {
                    currentGameData.currentBetIndex = 0;
                }
                const betAmount = initData.gameData.Bets[currentGameData.currentBetIndex];
                const updatedBetAmount = betAmount * 20;
                this.CurrentLineText.updateLabelText(betAmount);
                this.CurrentBetText.updateLabelText(updatedBetAmount.toString());
            }
            this.scene.time.delayedCall(200, () => {
                this.pBtn.setTexture('pBtn');
                this.pBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            });
        }).setDepth(0).setScale(0.8);
        container.add(this.pBtn);
        this.CurrentLineText = new TextLabel(this.scene, linePanel.x, linePanel.y, initData.gameData.Bets[currentGameData.currentBetIndex], 27, "#ffffff");
        //Line Count
        container.add(this.CurrentLineText).setDepth(1)
    }

    /**
     * @method winBtnInit add sprite and text
     * @description add the sprite/Placeholder and text for winning amount 
     */
    winBtnInit() {
        const winPanel = this.scene.add.sprite(0, 0, 'winPanel');
        winPanel.setOrigin(0.5);
        // winPanel.setScale(0.8, 0.8)
        winPanel.setPosition(gameConfig.scale.width/2, gameConfig.scale.height/2 + (winPanel.width * 0.8));
        winPanel.setDisplaySize(384,190)
        const currentWining: any = ResultData.playerData.currentWining;
        this.currentWiningText = new TextLabel(this.scene, 0, -15, currentWining, 40, "#0ac9ff");
        this.WiningText = this.scene.add.text(-70, 15, "Winnings", {color:"#0ac9ff", fontSize: "30px", align:"center"})
        const winPanelChild = this.scene.add.container(winPanel.x, winPanel.y)
        winPanelChild.add([this.currentWiningText, this.WiningText]);
        if(currentWining > 0){
            // console.log(currentWining, "currentWining");
            this.scene.tweens.add({
                targets:  this.currentWiningText,
                scaleX: 1.3, 
                scaleY: 1.3, 
                duration: 500, // Duration of the scale effect
                yoyo: true, 
                repeat: -1, 
                ease: 'Sine.easeInOut' // Easing function
            });
        }
    }
    /**
     * @method balanceBtnInit Remaning balance after bet (total)
     * @description added the sprite/placeholder and Text for Total Balance 
     */
    balanceBtnInit() {
        const balancePanel = this.scene.add.sprite(0, 0, 'balancePanel').setScale(0.8);
        balancePanel.setOrigin(0.5);
        balancePanel.setPosition(gameConfig.scale.width / 3, gameConfig.scale.height/8);
        const container = this.scene.add.container(balancePanel.x, balancePanel.y);
        // container.add(balancePanel);
        currentGameData.currentBalance = initData.playerData.Balance;
        const creditHeading = this.scene.add.text(-65, -60, "Credit", {color: "#ffffff", align: "center", fontSize: "35px"})
        this.currentBalanceText = new TextLabel(this.scene, 0, 0, currentGameData.currentBalance.toFixed(2), 27, "#ffffff");
        container.add([creditHeading, this.currentBalanceText]);
    }
    /**
     * @method spinBtnInit Spin the reel
     * @description this method is used for creating and spin button and on button click the a SPIn emit will be triggered to socket and will deduct the amout according to the bet
     */
    spinBtnInit(spinCallBack: () => void) {
        this.spinBtn = new Phaser.GameObjects.Sprite(this.scene, 0, 0, "spinBtn");
        this.spinBtn = this.createButton('spinBtn', gameConfig.scale.width / 1.2, gameConfig.scale.height/1.1, () => {
                this.bnuttonMusic("spinButton");
                if(this.doubleButton){
                    this.doubleButton.destroy();   
                }
            // checking if autoSpining is working or not if it is auto Spining then stop it
            if(this.isAutoSpinning){
                this.autoBetBtn.emit('pointerdown'); // Simulate the pointerdown event
                this.autoBetBtn.emit('pointerup'); // Simulate the pointerup event (if needed)
                return;
            }
        // tween added to scale transition
            this.scene.tweens.add({
                targets: this.spinBtn,
                duration: 100,
                onComplete: () => {
                    // Send message and update the balance
                    Globals.Socket?.sendMessage("SPIN", { currentBet: currentGameData.currentBetIndex, currentLines: 9, spins: 1 });
                    currentGameData.currentBalance -= initData.gameData.Bets[currentGameData.currentBetIndex];
                    this.currentBalanceText.updateLabelText(currentGameData.currentBalance.toFixed(2));
                    // Trigger the spin callback
                    this.onSpin(true);
                    spinCallBack();
                }
            });
        }).setDepth(1);
        this.spinBtn.setScale(0.8)
    }

    /**
     * @method maxBetBtn used to increase the bet amount to maximum
     * @description this method is used to add a spirte button and the button will be used to increase the betamount to maximun example on this we have twenty lines and max bet is 1 so the max bet value will be 1X20 = 20
     */
    maxBetInit() {
        this.maxbetBtn =  new Phaser.GameObjects.Sprite(this.scene, 0, 0, 'maxBetBtn')
        this.maxbetBtn = this.createButton('maxBetBtn', gameConfig.scale.width / 2 + this.maxbetBtn.width * 0.40, gameConfig.scale.height - this.maxbetBtn.height * 0.7 , () => {
            if (this.SoundManager) {
                this.bnuttonMusic("buttonpressed");
            }
            this.scene.tweens.add({
                targets: this.maxbetBtn,
                scaleX: 0.9,
                scaleY: 0.9,
                duration: 100,
                onComplete: ()=>{
                    this.maxbetBtn.setTexture("maxBetBtOnPressed")
                    this.maxbetBtn.disableInteractive()
                    currentGameData.currentBetIndex = initData.gameData.Bets[initData.gameData.Bets.length - 1];
                    this.CurrentBetText.updateLabelText((currentGameData.currentBetIndex*20).toString());
                    this.CurrentLineText.updateLabelText(initData.gameData.Bets[initData.gameData.Bets.length - 1]);
                    this.scene.tweens.add({
                        targets: this.maxbetBtn,
                        scaleX: 0.8,
                        scaleY: 0.8,
                        duration: 100,
                        onComplete: ()=>{
                            this.maxbetBtn.setTexture("maxBetBtn");
                            this.maxbetBtn.setInteractive({ useHandCursor: true, pixelPerfect: true })
                        }
                    })
                    
                }
            })
        }).setDepth(0).setScale(0.8);      
    }
    /**
     * @method autoSpinBtnInit 
     * @param spinCallBack 
     * @description crete and auto spin button and on that spin button click it change the sprite and called a recursive function and update the balance accroding to that
     */
    autoSpinBtnInit(spinCallBack: () => void) {
        this.autoBetBtn = new Phaser.GameObjects.Sprite(this.scene, 0, 0, "autoSpin");
        this.autoBetBtn = this.createButton(
            'autoSpin',
            this.autoBetBtn.width * 1.1,
            gameConfig.scale.height/1.1,
            () => {
                // this.normalButtonSound.play()
                this.scene.tweens.add({
                    targets: this.autoBetBtn,
                    duration: 100,
                    onComplete: () =>{
                        this.isAutoSpinning = !this.isAutoSpinning; // Toggle auto-spin state
                        if (this.isAutoSpinning && currentGameData.currentBalance > 0) {
                            Globals.Socket?.sendMessage("SPIN", {
                                currentBet: currentGameData.currentBetIndex,
                                currentLines : 20
                            });
                            currentGameData.currentBalance -= initData.gameData.Bets[currentGameData.currentBetIndex];
                            this.currentBalanceText.updateLabelText(currentGameData.currentBalance.toFixed(2));
                            this.autoSpinRec(true)
                            spinCallBack(); // Callback to indicate the spin has started
                            // Start the spin recursion
                            this.startSpinRecursion(spinCallBack);
                        } else {
                            // Stop the spin if auto-spin is turned off
                            this.autoSpinRec(false);
                        }
                    }
                })
            }
        ).setDepth(0);
        this.autoBetBtn.setScale(0.8)
    }

    /**
     * @method fadeDoubbleBtn
     */
    fadeDoubbleBtn(){
        if(this.fadeDoubbleButton){
            if(this.fadeDoubbleButton.scene == undefined){
                this.fadeDoubbleButton = this.scene.add.sprite(gameConfig.scale.width / 2 + this.maxbetBtn.height * 3.45, gameConfig.scale.height - this.maxbetBtn.height, "doubleButton").setScale(0.8)
            }
        }else{
            this.fadeDoubbleButton = this.scene.add.sprite(gameConfig.scale.width / 2 + this.maxbetBtn.height * 3.45, gameConfig.scale.height - this.maxbetBtn.height, "doubleButton").setScale(0.8)
        }
    }
    /**
     * @method BetBtnInit 
     * @description this method is used to create the bet Button which will show the totla bet which is placed and also the plus and minus button to increase and decrese the bet value
     */
    BetBtnInit() {
        const container = this.scene.add.container(gameConfig.scale.width / 1.5, gameConfig.scale.height/8);
        this.betButtonDisable = container;
        const betPanelHeading = this.scene.add.text(-90, -60, "Total Bet", {color: "#ffffff", align: "center", fontSize: "35px"})
        const betPanel = this.scene.add.sprite(0, 0, 'balancePanel').setOrigin(0.5).setDepth(4).setScale(0.8);
        container.add(betPanel);
        this.CurrentBetText = new TextLabel(this.scene, 0, 0, ((initData.gameData.Bets[currentGameData.currentBetIndex]) * 20).toString(), 27, "#FFFFFF").setDepth(6);
        container.add([betPanelHeading, this.CurrentBetText]);
    }
    linesNumberInit(){
        this.linesNumber = this.scene.add.sprite(gameConfig.scale.width / 3.35, gameConfig.scale.height - this.maxbetBtn.height , "linesNumber").setScale(0.8)
    }
   
    /**
     * @method startSpinRecursion
     * @param spinCallBack 
     */
    startSpinRecursion(spinCallBack: () => void) {
        if (this.isAutoSpinning && currentGameData.currentBalance > 0) {
            // this.startFireAnimation();
            // Delay before the next spin
            const delay = currentGameData.isMoving && (ResultData.gameData.symbolsToEmit.length > 0) ? 3000 : 5000;
            this.scene.time.delayedCall(delay, () => {
                if (this.isAutoSpinning && currentGameData.currentBalance >= 0) {
                    Globals.Socket?.sendMessage("SPIN", {
                        currentBet: currentGameData.currentBetIndex,
                        currentLines : 20
                    });
                    currentGameData.currentBalance -= initData.gameData.Bets[currentGameData.currentBetIndex];
                    this.currentBalanceText.updateLabelText(currentGameData.currentBalance.toFixed(2));
                    spinCallBack();
                    // Call the spin recursively
                    this.spinRecursively(spinCallBack);
                }
            });
        }
    }

    spinRecursively(spinCallBack: () => void) {
        if (this.isAutoSpinning) {
            // Perform the spin
            this.autoSpinRec(true);
            if (currentGameData.currentBalance < initData.gameData.Bets[currentGameData.currentBetIndex]) {
                // Stop the spin when a winning condition is met or balance is insufficient
                this.autoSpinRec(false);
                spinCallBack();
            } else {
                // Continue spinning if no winning condition is met and balance is sufficient
                this.startSpinRecursion(spinCallBack);
            }
        }
    }
    
    createButton(key: string, x: number, y: number, callback: () => void): Phaser.GameObjects.Sprite {
        const button = this.scene.add.sprite(x, y, key).setInteractive({ useHandCursor: true, pixelPerfect: true });
        button.on('pointerdown', callback);
        return button;
    }
   
    autoSpinRec(spin: boolean){
        if(spin){
            // this.spinBtn.setTexture("spinBtnOnPressed"); 
            this.spinBtn.setTexture("spinBtn");
            // this.autoBetBtn.setTexture("autoSpinOnPressed");
            this.autoBetBtn.setTexture("autoSpin");
            this.maxbetBtn.disableInteractive();
            this.maxbetBtn.setTexture("maxBetBtOnPressed");
            this.pBtn.disableInteractive();
            this.pBtn.setTexture("pBtnH")
            // this.spinBtn.setAlpha(0.5)
            this.autoBetBtn.setAlpha(0.5)
        }else{
            this.spinBtn.setTexture("spinBtn");
            this.autoBetBtn.setTexture("autoSpin");
            this.maxbetBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.pBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.autoBetBtn.setAlpha(1)
            this.pBtn.setTexture("pBtn")
            this.maxbetBtn.setTexture("maxBetBtn");
           
        }        
    }

    onSpin(spin: boolean) {
        // Handle spin functionality
        if(this.isAutoSpinning){
            return
        }
        if(spin){
            this.spinBtn.disableInteractive();
            // this.spinBtn.setTexture("spinBtnOnPressed");
            this.spinBtn.setTexture("spinBtn");
            this.autoBetBtn.setTexture("autoSpin")
            // this.autoBetBtn.setTexture("autoSpinOnPressed")
            this.autoBetBtn.disableInteractive();
            this.maxbetBtn.disableInteractive();
            this.maxbetBtn.setTexture("maxBetBtOnPressed");
            this.pBtn.disableInteractive();
            this.pBtn.setTexture("pBtnH")
            this.spinBtn.setAlpha(0.5)
            this.autoBetBtn.setAlpha(0.5)
            
        }else{
            this.spinBtn.setTexture("spinBtn");
            this.spinBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.autoBetBtn.setTexture("autoSpin");
            this.autoBetBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.maxbetBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.maxbetBtn.setTexture("maxBetBtn");
            this.pBtn.setInteractive({ useHandCursor: true, pixelPerfect: true });
            this.pBtn.setTexture("pBtn")
            this.spinBtn.setScale(0.8);
            this.autoBetBtn.setScale(0.8);
            this.spinBtn.setAlpha(1)
            this.autoBetBtn.setAlpha(1)
        }        
    }

    bnuttonMusic(key: string){
        this.SoundManager.playSound(key)
    }
    update() {
        if (parseFloat(this.currentWiningText.text) > 0) {
            // If doubleButton does not exist, create it
            if (!this.doubleButton || this.doubleButton.scene == undefined) {
                if(this.fadeDoubbleButton){
                    this.fadeDoubbleButton.destroy()
                }
                this.doubleButton = this.createButton('doubleButtonPressed', gameConfig.scale.width / 2 + this.maxbetBtn.height * 3.45, gameConfig.scale.height - this.maxbetBtn.height, () => {
                    Globals.Socket?.sendMessage("GambleInit", { id: "GambleInit", GAMBLETYPE: "HIGHCARD" });
                    Globals.SceneHandler?.addScene('GambleScene', GambleScene, true);
                }).setScale(0.8);
    
                // Start tween for scaling up and down continuously
                this.scene.tweens.add({
                    targets: this.doubleButton,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                this.scene.tweens.add({
                    targets:  this.currentWiningText,
                    scaleX: 1.3, 
                    scaleY: 1.3, 
                    duration: 500, // Duration of the scale effect
                    yoyo: true, 
                    repeat: -1, 
                    ease: 'Sine.easeInOut' // Easing function
                });
            }
        } else {
            if(!this.fadeDoubbleButton || this.fadeDoubbleButton.scene == undefined){
                this.fadeDoubbleBtn()
            }
            if (this.doubleButton) {
                this.scene.tweens.killTweensOf(this.doubleButton);
                this.doubleButton.destroy(); 
            }
           
        }
    }
    
}
