import Phaser, { Scene } from "phaser";
import { Globals, initData, ResultData } from "./Globals";
import { gameConfig } from "./appconfig";

export default class InfoScene extends Scene{
    pageviewContainer!: Phaser.GameObjects.Container;
    popupBackground!: Phaser.GameObjects.Sprite
    SceneBg!: Phaser.GameObjects.Sprite
    Symbol1!: Phaser.GameObjects.Sprite
    leftArrow!: Phaser.GameObjects.Sprite
    rightArrow!: Phaser.GameObjects.Sprite
    infoCross!: Phaser.GameObjects.Sprite
    currentPageIndex: number = 0;
    pages: Phaser.GameObjects.Container[] = [];
    constructor(){
        super({key: 'InfoScene'})
    }
    create(){
        const {width, height} =  this.cameras.main
        this.SceneBg = new Phaser.GameObjects.Sprite(this, width / 2, height / 2, 'Background')
        .setDisplaySize(width, height)
        .setDepth(11)
        .setInteractive();
        this.SceneBg.on('pointerdown', (pointer:Phaser.Input.Pointer)=>{
            pointer.event.stopPropagation();
        })
        this.pageviewContainer = this.add.container();
        this.popupBackground = new Phaser.GameObjects.Sprite(this, gameConfig.scale.width/2, gameConfig.scale.height/2, "PopupBackground").setScale(0.27);
        this.pageviewContainer.add(this.popupBackground)
        this.leftArrow = new Phaser.GameObjects.Sprite(this, 300, gameConfig.scale.height/2, "leftArrow").setInteractive();
        this.rightArrow = new Phaser.GameObjects.Sprite(this, 1600, gameConfig.scale.height/2, "rightArrow").setInteractive();
        this.infoCross = new Phaser.GameObjects.Sprite(this, 1600, gameConfig.scale.height/2-400, "infoCross").setInteractive().setScale(0.2)
        this.infoCross.on('pointerdown', ()=>{
            if(Globals.SceneHandler?.getScene("InfoScene")){
                Globals.SceneHandler.removeScene("InfoScene")
            }
        });
        this.leftArrow.on('pointerdown', ()=>{
            console.log("left arrow clicked");
            // this.goToPreviousPage();
            
        })
        this.rightArrow.on('pointerdown', ()=>{
            console.log("rightArrow arrow clicked");
            // this.goToNextPage()
            
        })
        this.pageviewContainer.add([this.leftArrow, this.rightArrow, this.infoCross])
        this.pages = []
        this.createPages()

    }
    createPages() {
        // Create pages and add content
        this.pages[1] = this.add.container(0, 0);
        const symbol1 = this.add.sprite(450, 300, "inofIcon1").setScale(0.22)
        const symbol2 = this.add.sprite(750, 300, "inofIcon2").setScale(0.22)
        const symbol3 = this.add.sprite(1050, 300, "inofIcon3").setScale(0.22)
        const symbol4 = this.add.sprite(1350, 300, "inofIcon4").setScale(0.22)
        const symbol5 = this.add.sprite(450, 500, "inofIcon5").setScale(0.22)
        const symbol6 = this.add.sprite(750, 500, "inofIcon6").setScale(0.22)
        const symbol7 = this.add.sprite(1050, 500, "inofIcon7").setScale(0.22)
        const symbol8 = this.add.sprite(1350, 500, "inofIcon8").setScale(0.22)
        console.log(initData.UIData.symbols[0], "initData.UIData.symbols[0]");
        const infoIcons = [
            { x: 540, y: 300 }, // Position for infoIcon2
            { x: 840, y: 300 }, // Position for infoIcon3
            { x: 1140, y: 300 }, //
            { x: 1440, y: 300 }, //
            { x: 540, y: 500 }, //
            { x: 840, y: 500 }, //
            { x: 1140, y: 500 }, //
            { x: 1440, y: 500 }, //
        ]

         initData.UIData.symbols.forEach((symbol, symbolIndex) => {
            // Get the corresponding infoIcon position
            const iconPosition = infoIcons[symbolIndex];

            if (!iconPosition) return; // Avoid undefined positions

            // Loop through each multiplier in the current symbol
            
            symbol.multiplier.forEach((multiplierValueArray, multiplierIndex, array) => {
                if (Array.isArray(multiplierValueArray)) {
                    const multiplierValue = multiplierValueArray[0];
                    if (multiplierValue > 0) {  // Skip the loop iteration if multiplierValue is 0
                        // Determine the text (e.g., '5x', '4x', '2x')
                        const prefix = [5, 4, 3][multiplierIndex]; // Customize this if needed
                        // console.log(multiplierValue, "multiplierValue");
                        let text = `${multiplierValue} \n`;            
                        // Create the text object
                        const textObject = this.add.text(
                            iconPosition.x, // X position (you might want to offset this)
                            iconPosition.y + multiplierIndex * 60, // Y position (spacing between lines)
                            text,
                            { fontFamily: "Poplar Regular", fontSize: '30px', color: '#fff' } // Customize text style
                        );
                        // Optionally adjust the position further based on requirements
                        textObject.setLineSpacing(100)
                        textObject.setOrigin(0, 0.5); // Center the text if needed
                        this.pages[1].add(textObject);
                    }
                }
            });
        });
        this.pages[1].add([symbol1, symbol2, symbol3, symbol4, symbol5, symbol6, symbol7, symbol8]);
        this.pageviewContainer.add(this.pages[1]);

        this.pages[2] = this.add.container(this.scale.width, 0);  // Position off-screen initially
        
        this.pages[2].add(this.add.sprite(200, 300, 'Page2Sprite'));
        this.pageviewContainer.add(this.pages[2]);

        this.pages[3] = this.add.container(this.scale.width * 2, 0);  // Position off-screen initially
        this.pages[3].add(this.add.sprite(200, 300, 'Page3Sprite'));
        this.pageviewContainer.add(this.pages[3]);

        this.pages = [this.pages[1], this.pages[2], this.pages[3]];
        this.currentPageIndex = 0;
    }

    goToNextPage() {
        if (this.currentPageIndex < this.pages.length - 1) {
            const currentPage = this.pages[this.currentPageIndex];
            const nextPage = this.pages[this.currentPageIndex + 1];

            // Animate current page out (move left)
            this.tweens.add({
                targets: currentPage,
                x: -this.scale.width,  // Move off-screen to the left
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    currentPage.setVisible(false);
                }
            });

            // Animate next page in (move from right)
            this.tweens.add({
                targets: nextPage,
                x: 0,  // Move into view
                duration: 500,
                ease: 'Power2',
                onStart: () => {
                    nextPage.setVisible(true);
                }
            });

            this.currentPageIndex++;
        }
    }

    goToPreviousPage() {
        if (this.currentPageIndex > 0) {
            const currentPage = this.pages[this.currentPageIndex];
            const prevPage = this.pages[this.currentPageIndex - 1];

            // Animate current page out (move right)
            this.tweens.add({
                targets: currentPage,
                x: this.scale.width,  // Move off-screen to the right
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    currentPage.setVisible(false);
                }
            });

            // Animate previous page in (move from left)
            this.tweens.add({
                targets: prevPage,
                x: 0,  // Move into view
                duration: 500,
                ease: 'Power2',
                onStart: () => {
                    prevPage.setVisible(true);
                }
            });

            this.currentPageIndex--;
        }
    }
}