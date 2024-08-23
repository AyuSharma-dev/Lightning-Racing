import { LightningElement, track } from 'lwc';

const Game_Resource = './resources';
export default class RaceGame extends LightningElement {
    
    greenSideways = Game_Resource+'/images/sideTrees.jpg';
    desertSideways = Game_Resource+'/images/sideDesert.jpg';
    beachSideways = Game_Resource+'/images/sideBeach.jpg';
    redCar = Game_Resource+'/images/redCar.png';
    music1 = Game_Resource + '/sounds/music1.mp3';
    music2 = Game_Resource + '/sounds/music2.mp3';
    music3 = Game_Resource + '/sounds/music3.mp3';
    music4 = Game_Resource + '/sounds/music4.mp3';

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
        console.log( localStorage.getItem('lwc_race_game') );
        this.highScore = localStorage.getItem('lwc_race_game')
            ? localStorage.getItem('lwc_race_game')
            : 0;
        if( !localStorage.getItem('lwc_race_game') ){
            localStorage.setItem('lwc_race_game', 10);
        }
    }

    get displaySpeed() {
        return this.speed.toFixed(1);
    }

    moveCar( tempXHead, tempYHead ){

        const newPosIndex = this.gameBlocks.findIndex(
            (x) => x.id === `${this.xHead}:${this.yHead}`
        );

        if( this.gameBlocks[newPosIndex] && this.gameBlocks[newPosIndex].enemy ){
            this.setGameOver( newPosIndex );
        }
        else if( this.gameBlocks[newPosIndex] ){
            const oldPosIndex = this.gameBlocks.findIndex(
                (x) => x.id === `${tempXHead}:${tempYHead}`
            );
            this.gameBlocks[oldPosIndex].myCar = false;
            this.gameBlocks[oldPosIndex].class = '';

            this.gameBlocks[newPosIndex].myCar = true;
            this.gameBlocks[newPosIndex].class = 'myCar';
        }
    }

    stopLoop( event ){
        clearInterval( this.intervalObj );
        clearInterval( this.int1 );
        this.stopAudio()
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
        console.log('dims--',eWidth, eHeight);
        let xBlock, yBlock;
        if( eWidth < 500 ){
            xBlock = 20;
            yBlock = 40;
        }
        else{
            xBlock = 35;
            yBlock = 70;
        }
         
        this.xMax = Math.floor(eWidth / xBlock);
        this.yMax = Math.floor(eHeight / yBlock);
        const tmpBlocks = [];

        this.xHead = this.xMax - 2;
        this.yHead = this.yMax - 1;
        for (let y = 0; y < this.yMax; y++) {
            for (let x = 0; x < this.xMax; x++) {
                let obj;
                if (x === this.xHead && y === this.yHead) {
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
                    this.speed -= 2;
                    this.level += 1;
                    clearInterval( this.int1 );
                    clearInterval( this.intervalObj );
                    this.startGame();
                }
                if( this.level == 7  ){
                    this.setSideWays( this.desertSideways, false );
                    this.enemyClass = 'enemyTruck';
                    if( !this.musicPaused ){
                        this.audio1.pause();
                        this.audio2.play();
                    }
                }
                if( this.level == 14 ){
                    this.setSideWays( this.beachSideways, true );
                    this.enemyClass = 'openCar';
                    if( !this.musicPaused ){
                        this.audio2.pause();
                        this.audio3.play();
                    }
                }
                if( this.level == 20 ){
                    this.setSideWays( this.greenSideways, false );
                    this.enemyClass = 'fastCar';
                    if( !this.musicPaused ){
                        this.audio3.pause();
                        this.audio4.play();
                    }
                }
            }
        }
        catch(err){
            console.log('error when moving enemy-->', err);
        }
        
    }

    resumeMusic(){
        if( this.level >= 7 && this.level < 14 ){
            this.audio2.play();
        }
        else if( this.level >= 14 && this.level < 20 ){
            this.audio3.play();
        }
        else if( this.level >= 20){
            this.audio4.play();
        }
        else{
            this.audio1.play();
        }
    }

    addRemoveEnemy( elementId, addEnemy ){
        
        const elementIndex = this.gameBlocks.findIndex(
            (x) => x.id === elementId
        );
        if( this.gameBlocks[elementIndex] ){
            //console.log('Id added--', elementId);
            if( addEnemy && this.gameBlocks[elementIndex].myCar ){
                this.setGameOver( elementIndex );
                return;
            }
            
            this.gameBlocks[elementIndex].enemy = addEnemy;
            this.gameBlocks[elementIndex].class = addEnemy ? this.enemyClass: '';
        }
        
    }

    setGameOver( elementIndex ){
        this.stopAudio();
        this.gameBlocks[elementIndex].class = "blastImg";
        clearInterval(this.int1);
        clearInterval( this.intervalObj );
        this.showOverlay = true;
        
        this.gameOver = true;
        if( this.score > this.highScore ){
            this.highScore = this.score;
            localStorage.setItem('lwc_race_game', this.score);
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
        this.enemyClass = 'enemy';
        if( !this.musicPaused ){
            this.audioStarted = false;
        }

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
        this.audio1.pause();
        this.audio2.pause();
        this.audio3.pause();
        this.audio4.pause();
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
            this.audio1.play();
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
    musicPaused = false;
    addKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            e.preventDefault();
            if( !this.gameOver ){
                try{
                    let tempXHead = this.xHead;
                    let tempYHead = this.yHead;
                    switch (e.key) {
                        case 'ArrowUp':
                            break;
                        case 'ArrowDown':
                            break;
                        case 'ArrowLeft':
                            if( !this.pause){
                                if(  this.xHead > 0 ){
                                    this.xHead -= 1;
                                    this.moveCar( tempXHead, tempYHead );
                                }
                                break;
                            }
                        case 'ArrowRight':
                            if( !this.pause ){
                                if( this.xHead < this.xMax - 1 ){
                                    this.xHead += 1;
                                    this.moveCar( tempXHead, tempYHead );
                                }
                                break;
                            }
                        case 'p':
                            if( this.pause ){
                                this.pause = false;
                                this.showOverlay = false;
                                this.startGame();
                                this.resumeMusic();
                                break;
                            }
                            else{
                                this.pause = true;
                                this.showOverlay = true;
                                clearInterval(this.int1);
                                clearInterval( this.intervalObj );
                                this.stopAudio();
                                break;
                            }
                        case 'k':
                            if( !this.pause ){
                                if( !this.musicPaused ){
                                    this.stopAudio();
                                    this.musicPaused = true;
                                    break;
                                }
                                else{
                                    this.resumeMusic();
                                    this.musicPaused = false;
                                    break;
                                }
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
