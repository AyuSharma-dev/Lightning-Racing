import { LightningElement, track } from 'lwc';
import gameResource from '@salesforce/resourceUrl/raceGameResource';


export default class RaceGame extends LightningElement {

    greenSideways = gameResource+'/sideTrees.jpg';
    desertSideways = gameResource+'/sideDesert.jpg';
    beachSideways = gameResource+'/sideBeach.jpg';
    redCar = gameResource+'/redCar.png';
    music1 = gameResource + '/music1.mp3';
    music2 = gameResource + '/music2.mp3';
    music3 = gameResource + '/music3.mp3';
    music4 = gameResource + '/music4.mp3';

    score = 0;
    highScore = 0;

    blockSize = 80;

    @track gameBlocks = [];

    renderComplete = false;

    xSpeed = 1;
    ySpeed = 0;

    xHead = 3;
    yHead = 8;

    xMax;
    yMax;

    showOverlay = true;
    gameOver = false;

    speed = 110;
    intervalObj;
    enemiesInterval=0;
    level = 1;
    enemyClass = 'enemy';

    connectedCallback() {
        this.highScore = localStorage.getItem('lwc_snake_high')
            ? localStorage.getItem('lwc_snake_high')
            : 0;
    }

    get displaySpeed() {
        return this.speed.toFixed(1);
    }

    moveCar( tempXHead, tempYHead ){

        const oldPosIndex = this.gameBlocks.findIndex(
            (x) => x.id === `${tempXHead}:${tempYHead}`
        );
        this.gameBlocks[oldPosIndex].myCar = false;
        this.gameBlocks[oldPosIndex].class = '';

        const newPosIndex = this.gameBlocks.findIndex(
            (x) => x.id === `${this.xHead}:${this.yHead}`
        );

        if( this.gameBlocks[newPosIndex].enemy ){
            alert('Game Over');
        }
        else{
            this.gameBlocks[newPosIndex].myCar = true;
            this.gameBlocks[newPosIndex].class = 'myCar';
        }
    }

    stopLoop( event ){
        clearInterval( this.intervalObj );
        clearInterval( this.int1 );
        // this.audio1.pause();
        // this.audio2.pause();
        // this.audio3.pause();
        // this.audio4.pause();
    }

    intervalIds = [];
    createEnemies( numOfEnemies ){
        let randomPos = [];
        const yEnemy = 0;
            
        let xEnemy;
        while (true) {
            xEnemy = Math.floor(Math.random() * (this.xMax));
            if( !randomPos.includes( xEnemy ) ){
                randomPos.push( xEnemy );
                break;
            }
        }

        const enemyIndex = this.gameBlocks.findIndex(
            (x) => x.id === `${xEnemy}:${yEnemy}`
        );
        this.gameBlocks[enemyIndex].enemy = true;
        this.gameBlocks[enemyIndex].class = this.enemyClass;
    }

    renderGameBlocks() {
        const gameContainerEl = this.template.querySelector('.game-play');
        const eWidth = gameContainerEl.clientWidth;
        const eHeight = gameContainerEl.clientHeight;

        this.xMax = Math.floor(eWidth / 40);
        this.yMax = Math.floor(eHeight / this.blockSize);
        const tmpBlocks = [];

        for (let y = 0; y < this.yMax; y++) {
            for (let x = 0; x < this.xMax; x++) {
                let obj;
                if (x === 3 && y === 8) {
                    obj = {
                        id: `${x}:${y}`,
                        myCar: true,
                        enemy: false,
                        class: 'myCar'
                    };
                } else {
                    obj = {
                        id: `${x}:${y}`,
                        myCar: false,
                        enemy: false,
                        class: ''
                    };
                }
                tmpBlocks.push(obj);
            }
        }
        this.gameBlocks = tmpBlocks;
    }

    moveEnemy(){
        let processedEnemies = [];
        let newId;
        let createEnemies = false;
        let createMultiple = false;
        try{
            //console.log('before loop');
            for( let i=0; i<this.gameBlocks.length; i++ ){
                let element = this.gameBlocks[i];
                if( element.enemy && !processedEnemies.includes( element.id ) ){
                    let cords = element.id.split(':');
                    let yCord = parseInt( cords[1] );
                    console.log( (yCord + 2 > this.yMax) );
                    //console.log('enemy--',JSON.stringify( element ));
                    if( yCord + 2 > this.yMax){
                        this.addRemoveEnemy( element.id, false );
                        this.score += 1;
                        createEnemies = true;
                        continue;
                    }
                    cords[1] = ( yCord + 1 ).toString();
                    newId = `${cords[0]}:${cords[1]}`;

                    this.addRemoveEnemy( element.id, false );
                    this.addRemoveEnemy( newId, true );
                    processedEnemies.push( newId );
                }
            }
            if( createEnemies ){
                //this.addRemoveEnemy( element.id, false );
                this.enemiesInterval += 1;
                if( this.enemiesInterval % 20 === 0 ){
                    this.speed -= 4;
                    this.level += 1;
                    clearInterval( this.int1 );
                    clearInterval( this.intervalObj );
                    this.startGame();
                    console.log('inside X');
                }
                if( this.level == 5  ){
                    this.setSideWays( this.desertSideways, false );
                    this.enemyClass = 'enemyTruck';
                    // this.audio1.pause();
                    // this.audio2.play();
                }
                if( this.level == 10 ){
                    this.setSideWays( this.beachSideways, true );
                    this.enemyClass = 'enemyPolice';
                    // this.audio2.pause();
                    // this.audio3.play();
                }
                if( this.level == 15 ){
                    this.setSideWays( this.greenSideways, false );
                    this.enemyClass = 'enemy';
                    // this.audio3.pause();
                    // this.audio4.play();
                }
            }
            console.log('speed--', this.speed);
        }
        catch(err){
            console.log('error when moving enemy-->', err);
        }
        
    }

    addRemoveEnemy( elementId, addEnemy ){
        
        const elementIndex = this.gameBlocks.findIndex(
            (x) => x.id === elementId
        );
        if( this.gameBlocks[elementIndex] ){
            //console.log('Id added--', elementId);
            if( addEnemy && this.gameBlocks[elementIndex].myCar ){
                this.gameBlocks[elementIndex].class = "blastImg";
                clearInterval(this.int1);
                clearInterval( this.intervalObj );
                // this.audio.pause();
                this.showOverlay = true;
                
                this.gameOver = true;
                //alert('game over');
                return;
            }
            
            this.gameBlocks[elementIndex].enemy = addEnemy;
            this.gameBlocks[elementIndex].class = addEnemy ? this.enemyClass: '';
        }
        
    }

    resetGame(){
        this.speed = 110;
        this.level = 1;
        this.score = 0;
        this.enemiesInterval = 0;
        this.gameOver = false;
        this.showOverlay = false;
        this.setSideWays( this.greenSideways, false );
        this.audioStarted = false;
        this.enemyClass = 'enemy';

        this.stopAudio();
        for( let i=0; i<this.gameBlocks.length; i++ ){
            if( this.gameBlocks[i].class != '' ){
                this.gameBlocks[i].class = '';
                this.gameBlocks[i].enemy = false;
                this.gameBlocks[i].myCar = false;
            }
        }
        this.moveCar( 0, 0 );
        this.startGame();
    }

    setSideWays( img, rotate ){
        let i = 0;
        this.template.querySelectorAll('.sideWays').forEach(element => {
            i += 1;
            element.style.backgroundImage = "url('"+img+"')";
            if( i == 2 && rotate) element.style.transform = "rotate(180deg)";
        });
    }

    stopAudio(){
        // this.audio1.pause();
        // this.audio2.pause();
        // this.audio3.pause();
        // this.audio4.pause();
    }

    audioStarted;
    startGame() {
        this.showOverlay = false;
        this.intervalObj = setInterval(() => {
            this.moveEnemy();
        }, this.speed );

        this.int1 = setInterval(() => {
            this.createEnemies( 1 );
        }, this.speed+100 );
        
        if( !this.audioStarted ){
            //this.audio1.play();
            this.audioStarted = true;
        }
        
    }

    audio1;
    audio2;
    audio3;
    audio4;

    loadSounds(){
        this.audio1 = new Audio();
        this.audio1.src = this.music1;
        this.audio1.currentTime=17;
        this.audio1.loop = true;
        this.audio1.load();

        this.audio2 = new Audio();
        this.audio2.src = this.music2;
        this.audio2.loop = true;
        this.audio2.load();

        this.audio3 = new Audio();
        this.audio3.src = this.music3;
        this.audio3.loop = true;
        this.audio3.load();

        this.audio4 = new Audio();
        this.audio4.src = this.music4;
        this.audio4.loop = true;
        this.audio4.load();
    }

    addSpeed() {
        this.speed = this.speed + 0.1;
        clearInterval(this.intervalObj);
        this.startGame();
    }

    pause = false;
    addKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            e.preventDefault();
            if( !this.gameOver ){
                try{
                    let tempXHead = this.xHead;
                    let tempYHead = this.yHead;
                    console.log(e.key);
                    switch (e.key) {
                        case 'ArrowUp':
                            break;
                        case 'ArrowDown':
                            break;
                        case 'ArrowLeft':
                            if( !this.pause ){
                                this.xHead -= 1;
                                this.moveCar( tempXHead, tempYHead );
                                break;
                            }
                        case 'ArrowRight':
                            if( !this.pause ){
                                this.xHead += 1;
                                this.moveCar( tempXHead, tempYHead );
                                break;
                            }
                        case 'p':
                            if( this.pause ){
                                this.pause = false;
                                this.showOverlay = false;
                                this.startGame();
                            }
                            else{
                                this.pause = true;
                                this.showOverlay = true;
                                clearInterval(this.int1);
                                clearInterval( this.intervalObj );
                            }
                        default:
                            break;
                    }
                }
                catch(err){
                    alert('error->'+JSON.stringify(err.message));
                }
            }
            
        });
    }

    renderedCallback() {
        if (!this.renderComplete) {
            this.loadSounds();
            this.renderComplete = true;
            this.renderGameBlocks();
            this.addKeyboardControls();
            window.addEventListener('resize', () => {
                this.showOverlay = true;
                this.gameOver = false;
            });
        }
    }

    

}