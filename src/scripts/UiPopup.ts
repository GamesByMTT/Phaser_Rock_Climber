import Phaser from "phaser";
import { Globals, initData, TextStyle } from "./Globals";
import { gameConfig } from "./appconfig";
import { TextLabel } from "./TextLabel";
import { UiContainer } from "./UiContainer";
import SoundManager from "./SoundManager";
import InfoScene from "./infoPopup";
import { text } from "stream/consumers";

const Random = Phaser.Math.Between;
export class UiPopups extends Phaser.GameObjects.Container {
    SoundManager: SoundManager;
    UiContainer: UiContainer
    menuBtn!: InteractiveBtn;
    settingBtn!: InteractiveBtn;
    rulesBtn!: InteractiveBtn;
    infoBtn!: InteractiveBtn;
    exitBtn!: InteractiveBtn
    yesBtn!: InteractiveBtn;
    noBtn!: InteractiveBtn
    isOpen: boolean = false;
    isExitOpen: boolean = false;
    settingClose!: InteractiveBtn;
    onButton!: InteractiveBtn;
    offButton!:InteractiveBtn;
    toggleBar!: InteractiveBtn;
    soundEnabled: boolean = true; // Track sound state
    musicEnabled: boolean = true; // Track sound state
    normalButtonSound!: Phaser.Sound.BaseSound
    popupBackground!: Phaser.GameObjects.Sprite;  // Background sprite for popup
    pageViewContainer!: Phaser.GameObjects.Container;
    currentPageIndex: number = 0;
    pages: Phaser.GameObjects.Container[] = [];
    constructor(scene: Phaser.Scene, uiContainer: UiContainer, soundManager: SoundManager) {
        super(scene);
        this.setPosition(0, 0);
        // this.ruleBtnInit();
        this.settingBtnInit();
        this.menuBtnInit();
        this.exitButton();
        this.infoBtnInit();
         // Initialize background sprite for popup with initial opacity of 0 (hidden)
         this.popupBackground = this.scene.add.sprite(gameConfig.scale.width / 2, gameConfig.scale.height / 2, 'PopupBackground')
         .setOrigin(0.5)
         .setAlpha(0)
         .setDepth(9); // Set initial transparency to 0 (hidden)
         this.popupBackground.setDisplaySize(this.popupBackground.width * 0.25, this.popupBackground.height * 0.25); // Make it fullscreen

         // Initialize Page View container
        this.pageViewContainer = this.scene.add.container(0, 0);
        this.pageViewContainer.setVisible(false); // Initially hidden
        this.add(this.pageViewContainer);
        this.UiContainer = uiContainer
        this.SoundManager = soundManager
        this.initPageView();
        scene.add.existing(this);
    }

    menuBtnInit() {
        const menuBtnTextures = [
            this.scene.textures.get('MenuBtn'),
            this.scene.textures.get('MenuBtnH')
        ];
        this.menuBtn = new InteractiveBtn(this.scene, menuBtnTextures, () => {
            this.buttonMusic("buttonpressed")
            this.openPopUp();
        }, 0, true);
        this.menuBtn.setPosition( gameConfig.scale.width / 1.225, gameConfig.scale.height / 7 );
        this.add(this.menuBtn);
    }
    exitButton(){
        const exitButtonSprites = [
            this.scene.textures.get('exitButton'),
            this.scene.textures.get('exitButton')
        ];
        this.exitBtn = new InteractiveBtn(this.scene, exitButtonSprites, ()=>{
                this.buttonMusic("buttonpressed")
                this.openLogoutPopup();
        }, 0, true, );
        this.exitBtn.setPosition(gameConfig.scale.width / 5.2 , gameConfig.scale.height / 7)
        this.add(this.exitBtn)
    }
    
    settingBtnInit() {
        const settingBtnSprites = [
            this.scene.textures.get('settingBtn'),
            this.scene.textures.get('settingBtnH')
        ];
        this.settingBtn = new InteractiveBtn(this.scene, settingBtnSprites, () => {
            this.buttonMusic("buttonpressed")
            // setting Button
            this.openSettingPopup();
        }, 1, true); // Adjusted the position index
        this.settingBtn.setPosition(gameConfig.scale.width - this.settingBtn.width * 2, gameConfig.scale.height/2);
        this.settingBtn.setScale(0.9)
        this.add(this.settingBtn);
    }

    infoBtnInit() {
        const infoBtnSprites = [
            this.scene.textures.get('infoBtn'),
            this.scene.textures.get('infoBtnH'),
        ];
        this.infoBtn = new InteractiveBtn(this.scene, infoBtnSprites, () => {
            // info button 
            this.buttonMusic("buttonpressed")
            this.openPage();
        }, 2, false); // Adjusted the position index
        this.infoBtn.setPosition(gameConfig.scale.width/ 2 - this.infoBtn.width * 5, this.infoBtn.height * 0.7).setScale(0.8);
        this.add(this.infoBtn);
    }

   
    initPageView() {
        const conatiner = this.scene.add.container(gameConfig.scale.width, gameConfig.scale.height).setInteractive()
        conatiner.on('pointerdown', (pointerdown: Phaser.Input.Pointer)=>{
            pointerdown.event.stopPropagation();
        })
        // Create pages with the ability to add custom content
        for (let i = 0; i < 3; i++) {
            const page = this.scene.add.container(i * gameConfig.scale.width, 100); // Position pages side by side off-screen initially
            this.pages.push(page);
            this.pageViewContainer.add(page);
        }
        const BonusHeading = this.scene.add.text(gameConfig.scale.width/2, gameConfig.scale.height - 100, "Bonus Game", {color: "#ffffff", align: "center"})
        this.addCustomContentToPage(0, [BonusHeading]);
        // Add navigation buttons
        this.addNavigationButtons();
    }

    openPopUp() {
        // Toggle the isOpen boolean
        this.isOpen = !this.isOpen;
        this.menuBtn.setInteractive(false);
        if (this.isOpen) {
            this.tweenToPosition(this.settingBtn, 1);
            this.tweenToPosition(this.infoBtn, 2);
        } else {
            this.tweenBack(this.settingBtn);
            this.tweenBack(this.infoBtn);
        }
    }

    tweenToPosition(button: InteractiveBtn, index: number) {
        const targetY =  this.menuBtn.x + (index * (this.menuBtn.width))
       // Calculate the x position with spacing
       button.setPosition(this.menuBtn.x, this.menuBtn.y)
        button.setVisible(true);
        this.scene.tweens.add({
            targets: button,
            x: targetY,
            duration: 300,
            ease: 'Elastic',
            easeParams: [1, 0.9],
            onComplete: () => {
                button.setInteractive(true);
                this.menuBtn.setInteractive(true);
            }
        });
    }
    tweenBack(button: InteractiveBtn) {
        button.setInteractive(false);
        this.scene.tweens.add({
            targets: button,
            x: button,
            duration: 100,
            ease: 'Elastic',
            easeParams: [1, 0.9],
            onComplete: () => {
                button.setVisible(false);
                this.menuBtn.setInteractive(true);
            }
        });
    }

    openPage() {
        Globals.SceneHandler?.addScene("InfoScene", InfoScene, true)
    }
    closePopUp() {
        // Reset visibility and background opacity when closing popup
        this.pageViewContainer.setVisible(false);
        this.popupBackground.setAlpha(0); // Hide background
    }
    addNavigationButtons() {
        // Previous Page Button
        const prevButton = this.scene.add.sprite(250, 550, 'leftArrow')
        .setScale(0.2)
        .setDepth(12)
        .setInteractive()
        .on('pointerdown', () => this.changePage(-1));
        this.pageViewContainer.add(prevButton);

        // Next Page Button
        const nextButton = this.scene.add.sprite(gameConfig.scale.width * 0.9, 550, 'rightArrow')
        .setScale(0.2)
        .setDepth(11)
        .setInteractive()
        .on('pointerdown', () => this.changePage(1));
        this.pageViewContainer.add(nextButton);
    }

    changePage(direction: number) {
        const nextPageIndex = this.currentPageIndex + direction;

        if (nextPageIndex < 0 || nextPageIndex >= this.pages.length) {
            return; // Prevent out of bounds
        }

        // Slide current page out of view and next page into view
        const currentPage = this.pages[this.currentPageIndex];
        const nextPage = this.pages[nextPageIndex];

        this.scene.tweens.add({
            targets: currentPage,
            x: `-=${gameConfig.scale.width}`,
            duration: 500,
            ease: 'Power2'
        });

        this.scene.tweens.add({
            targets: nextPage,
            x: `-=${gameConfig.scale.width}`,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.currentPageIndex = nextPageIndex;
                this.updatePageView();
            }
        });
    }

    addCustomContentToPage(pageIndex: number, content: Phaser.GameObjects.GameObject[]) {
        // Clear existing content on the page
        this.pages[pageIndex].removeAll(true);

        // Add new custom content to the specified page
        content.forEach(item => this.pages[pageIndex].add(item));
    }


    updatePageView(){

    }
    /**
     * 
     */
    openSettingPopup() {
        const settingblurGraphic = this.scene.add.graphics();
        settingblurGraphic.fillStyle(0x000000, 0.5);
        settingblurGraphic.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        const numSteps = 10; // 10 steps for 0.0 to 1.0
        let soundLevel = 5; // Initial sound level (0 to 9)
        let musicLevel = 5; // Initial music level (0 to 9)
        const infopopupContainer = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        ).setDepth(1);
    
        const popupBg = this.scene.add.image(0, 0, 'messagePopup').setDepth(13);
        const settingText = this.scene.add.text(-100, -290, 'SETTINGS', {color: "#000000", fontSize: "100px", fontFamily: 'crashLandingItalic'});
        const soundsImage = this.scene.add.image(-270, -100, 'soundImage').setDepth(10).setScale(0.7);
        const musicImage = this.scene.add.image(-270, 100, 'musicImage').setDepth(10).setScale(0.7);
        const soundProgreesBar = this.scene.add.image(40, -100, 'sounProgress');
        const musicProgreesBar = this.scene.add.image(40, 100, 'sounProgress');
        const volume0 = this.scene.add.text(-250, -190, "0%", {color: "#616d77", fontSize: "40px", fontFamily: 'crashLandingItalic'});
        const volume100 = this.scene.add.text(270, -190, "100%", {color: "#616d77", fontSize: "40px", fontFamily: 'crashLandingItalic'});
        const musicVolume0 = this.scene.add.text(-250, 10, "0%", {color: "#616d77", fontSize: "40px", fontFamily: 'crashLandingItalic'});
        const musicVolume100 = this.scene.add.text(270, 10, "100%", {color: "#616d77", fontSize: "40px", fontFamily: 'crashLandingItalic'});
    
        const soundLevelIndicator = this.scene.add.image(40, -100, 'indicatorSprite')
        .setDepth(11)
        .setInteractive({ draggable: true });
        const musicLevelIndicator = this.scene.add.image(40, 100, 'indicatorSprite')
        .setDepth(11)
        .setInteractive({ draggable: true });

        // Function to get the step index (0 to 9) based on pointer position
        const getStepIndex = (pointerX: number, progressBar: Phaser.GameObjects.Image): number => {
            const sectionWidth = progressBar.width / numSteps;
            const relativeX = pointerX - progressBar.x;
            return Phaser.Math.Clamp(Math.round(relativeX / sectionWidth), 0, numSteps - 1);
        };
    
        const updateSoundLevel = (pointerX: number) => {
            const newSoundLevel = getStepIndex(pointerX, soundProgreesBar);

            if (newSoundLevel !== soundLevel) {
                soundLevel = newSoundLevel;
                const newX = soundProgreesBar.x + (soundLevel * soundProgreesBar.width / numSteps) - soundProgreesBar.width / 2;

                this.scene.tweens.add({
                    targets: soundLevelIndicator,
                    x: newX,
                    duration: 100,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        const normalizedSoundLevel = soundLevel / (numSteps - 1);
                        console.log("Sound Level:", normalizedSoundLevel);
                        this.adjustSoundVolume(normalizedSoundLevel); // Update sound volume
                    }
                });
            }
        };
       // Function to update music level (similar to updateSoundLevel)
       const updateMusicLevel = (pointerX: number) => {
            const newMusicLevel = getStepIndex(pointerX, musicProgreesBar);

            if (newMusicLevel !== musicLevel) {
                musicLevel = newMusicLevel;
                const newX = musicProgreesBar.x + (musicLevel * musicProgreesBar.width / numSteps) - musicProgreesBar.width / 2;

                this.scene.tweens.add({
                    targets: musicLevelIndicator,
                    x: newX,
                    duration: 100,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        const normalizedMusicLevel = musicLevel / (numSteps - 1);
                        console.log("Music Level:", normalizedMusicLevel);
                        this.adjustMusicVolume(normalizedMusicLevel); // Update music volume
                    }
                });
            }
        };
        // Set initial indicator positions (start at 0.0)
        soundLevelIndicator.x = soundProgreesBar.x - soundProgreesBar.width / 2;
        musicLevelIndicator.x = musicProgreesBar.x - musicProgreesBar.width / 2;

        // === Drag Events ===
        soundLevelIndicator.on('drag', (pointer: Phaser.Input.Pointer) => {
            updateSoundLevel(pointer.x);
        });

        musicLevelIndicator.on('drag', (pointer: Phaser.Input.Pointer) => {
            updateMusicLevel(pointer.x);
        });
    
        const exitButtonSprites = [
            this.scene.textures.get('infoCross'),
            this.scene.textures.get('infoCross')
        ];
        
        this.settingClose = new InteractiveBtn(this.scene, exitButtonSprites, () => {
            infopopupContainer.destroy();
            settingblurGraphic.destroy();
            this.buttonMusic("buttonpressed");
        }, 0, true);
        
        this.settingClose.setPosition(430, -300).setScale(0.8);
    
        popupBg.setOrigin(0.5);
        popupBg.setScale(0.9);
        popupBg.setAlpha(1);
        
        infopopupContainer.add([popupBg, settingText, this.settingClose, soundsImage, musicImage, soundProgreesBar, musicProgreesBar, volume0, volume100, musicVolume0, musicVolume100, soundLevelIndicator, musicLevelIndicator]);
    }

   // Function to adjust sound volume
   adjustSoundVolume(level: number) {
        this.SoundManager.setVolume("soundEffects", level); // Assuming "soundEffects" is your sound key
    }

    // Function to adjust music volume
    adjustMusicVolume(level: number) {
        this.SoundManager.setVolume("backgroundMusic", level); // Assuming "backgroundMusic" is your music key
    }
    
    buttonMusic(key: string){
        this.SoundManager.playSound(key)
    }

    /**
     * @method openLogoutPopup
     * @description creating an container for exitPopup 
     */
    openLogoutPopup() {
        // Create a semi-transparent background for the popup
        const blurGraphic = this.scene.add.graphics().setDepth(1); // Set depth lower than popup elements
        blurGraphic.fillStyle(0x000000, 0.5); // Black with 50% opacity
        blurGraphic.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height); // Cover entire screen
        
        this.UiContainer.onSpin(true);
        // Create a container for the popup
        const popupContainer = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        ).setDepth(1); // Set depth higher than blurGraphic
    
        // Popup background image
        const popupBg = this.scene.add.image(0, 0, 'messagePopup').setDepth(10);
        popupBg.setOrigin(0.5);
        popupBg.setDisplaySize(900, 671); // Set the size for your popup background
        popupBg.setAlpha(1); // Set background transparency
        this.exitBtn.disableInteractive();

        const quitHeading = this.scene.add.text(-150, -250, "QUIT GAME", {color:"#000000", fontSize: "100px", fontFamily: 'crashLandingItalic', })
        // Add text to the popup
        const popupText = this.scene.add.text(-200, -100, "Do you really want \n to exit?", {color:"#000000", fontSize: "80px", fontFamily: 'crashLandingItalic', align:"center" });
        
        // Yes and No buttons
        const logoutButtonSprite = [
            this.scene.textures.get("yesButton"),
            this.scene.textures.get("yesButtonHover")
        ];
        this.yesBtn = new InteractiveBtn(this.scene, logoutButtonSprite, () => {
            
            this.UiContainer.onSpin(false);
            popupContainer.destroy();
            blurGraphic.destroy(); // Destroy blurGraphic when popup is closed
            window.parent.postMessage("onExit", "*");   
            Globals.Socket?.socket.emit("EXIT", {});
        }, 0, true);
        const logoutNoButtonSprite = [
            this.scene.textures.get("yesButton"),
            this.scene.textures.get("yesButtonHover")
        ];
        this.noBtn = new InteractiveBtn(this.scene, logoutNoButtonSprite, () => {
            
            this.UiContainer.onSpin(false);
            this.exitBtn.setInteractive()
            // this.exitBtn.setTexture("normalButton");
            popupContainer.destroy();
            blurGraphic.destroy(); // Destroy blurGraphic when popup is closed
        }, 0, true);
        const yesText = this.scene.add.text(-130, 140, "YES", {color:"#000000", fontFamily:"crashLandingItalic", fontSize:"50px"}).setOrigin(0.5)
        const noText = this.scene.add.text(130, 140, "NO", {color:"#000000", fontFamily:"crashLandingItalic", fontSize:"50px"}).setOrigin(0.5)
        this.yesBtn.setPosition(-130, 150).setScale(0.8, 0.8);
        this.noBtn.setPosition(130, 150).setScale(0.8, 0.8);
       
        // Add all elements to popupContainer
        popupContainer.add([popupBg, popupText, quitHeading, this.yesBtn,yesText, this.noBtn, noText]);
        // Add popupContainer to the scene
        this.scene.add.existing(popupContainer);       
    }
    
    buttonInteraction(press: boolean){
        if(press){
            this.menuBtn.disableInteractive();
            this.settingBtn.disableInteractive()
            this.rulesBtn.disableInteractive();
            this.menuBtn.disableInteractive();
        }
    }
}

class InteractiveBtn extends Phaser.GameObjects.Sprite {
    moveToPosition: number = -1;
    defaultTexture!: Phaser.Textures.Texture;
    hoverTexture!: Phaser.Textures.Texture

    constructor(scene: Phaser.Scene, textures: Phaser.Textures.Texture[], callback: () => void, endPos: number, visible: boolean) {
        super(scene, 0, 0, textures[0].key); // Use texture key
        this.defaultTexture = textures[0];
        this.hoverTexture = textures[1];        
        this.setOrigin(0.5);
        this.setInteractive();
        this.setVisible(visible);
        this.moveToPosition = endPos;
        this.on('pointerdown', () => {
            this.setTexture(this.hoverTexture.key)
            // this.setFrame(1);
            callback();
        });
        this.on('pointerup', () => {
            this.setTexture(this.defaultTexture.key)
            // this.setFrame(0);
        });
        this.on('pointerout', () => {
            this.setTexture(this.defaultTexture.key)
            // this.setFrame(0);
        });
        // Set up animations if necessary
        this.anims.create({
            key: 'hover',
            frames: this.anims.generateFrameNumbers(textures[1].key),
            frameRate: 10,
            repeat: -1
        });
    }
}