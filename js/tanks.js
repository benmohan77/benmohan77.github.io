var blocks; // Our landscape in a 2D array
var updateDelay = 2; //ticksPerSec / 30;
var currentUpdateCount = 0;
var maxMoves = 4;

//Constants
var gunSound = "gunSound";
var boomSound = "boomSound";
var ripSound = "ripSound";
var smokeSheetIMG = "smokeSheet";
var smokeSheet;
var animation;

// Landscape Generation Vars
var stageXblocks;
var stageYblocks;
var landMin;
var landMax;
var landBlockSize;
var maxLandDev;

// Player Tank Vars
var playerTanks = [];
var currentTank;
var currentTankIndex;

// Active Missile Vars
var activeMissiles = [];
var waitingForMissiles = false;

//Player Control Vars
var btnRotateRight;
var btnRotateLeft;
var btnRotateRightPressed;
var btnRotateLeftPressed;
var btnIncreasePowerPressed;
var btnDecreasePowerPressed;
var btnIncreasePower;
var btnDecreasePower;
var btnMoveRight;
var btnMoveLeft;
var btnFire;
var btnNextAmmo;
var btnPreviousAmmo;

//Key variables
const ARROW_KEY_LEFT = 37;
const ARROW_KEY_UP = 38;
const ARROW_KEY_RIGHT = 39;
const ARROW_KEY_DOWN = 40;
const SPACE_KEY = 32;
const A_KEY = 65;
const D_KEY = 68;
var isMoving = false;
var upKeyDown = false;
var downKeyDown = false;
var leftKeyDown = false;
var rightKeyDown = false;
var spaceKeyDown = false;
//main graphics

//Data displays
var lblBarrelRotation;
var lblNowPlaying;
var lblHealth;
var lblMovesLeft;
var lblPowerLevel;
var lblAmmoType;

// Some names for the tanks
// A few were taken from game forums
var tankNames = [
    "Frank the Tank",
    "Tankem",
    "Beef Chief",
    "InvincaBull",
    "Honey Badger",
    "Steve"
];

function newGame(players) {
    stage.removeAllChildren();

    maxMoves = Math.floor(15 / players);

    initUI();
    landGeneration();
    addTanks(players);

    smokeSheetIMG = queue.getResult("smokeSheet");

    var data = {
        images: ["smoke.png"],
        frames: { width: 64, height: 64, regX: 32, regY: 32, count: 16 },
        animations: {
            start: {
                frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                next: false
            },
        },
        framerate: 20
    };

    smokeSheet = new createjs.SpriteSheet(data);
    animation = new createjs.Sprite(smokeSheet, "start");

    lblBarrelRotation = new createjs.Text("0", "10px Arial", "#000000");
    lblBarrelRotation.x = 95;
    lblBarrelRotation.y = 12;
    stage.addChild(lblBarrelRotation);

    lblNowPlaying = new createjs.Text("Player:", "20px Courier New", "#000000");
    lblNowPlaying.x = 600;
    lblNowPlaying.y = 10;

    lblHealth = new createjs.Text("=== Health ===", "15px Courier New", "#000000");
    lblHealth.x = 600;
    lblHealth.y = 35;
    stage.addChild(lblNowPlaying, lblHealth);



    // KEYBOARD
    window.onkeydown = handleKeyDown;
    window.onkeyup = handleKeyUp;

    stage.update();

}


function game_tick(event) {

    // Make sure all tanks are still on screen
    // If they aren't, kill them
    for (var i in playerTanks) {
        if (playerTanks[i].y + (landBlockSize / 2) > stageYdimens) {
            playerTanks[i].killTank();
        }
    }

    // Check to see if either all tanks are dead or all but one tank is dead
    var deathCount = 0;
    for (var i in playerTanks) {
        if (playerTanks[i].isDead()) {
            deathCount++;
            stage.removeChild(playerTanks[i]);
        }
    }
    if (deathCount >= playerTanks.length - 1) {
        createjs.Ticker.removeAllEventListeners();
        var gameover = new createjs.Text("Game Over", "30px Arial", "#000000");
        gameover.x = (stageXdimens / 2) - 75; // 245; // 75px off center
        gameover.y = (stageYdimens / 2) - 15; // 225; // 15px off center
        stage.addChild(gameover);
        // Remove the dead players from the stage
        // This will need to be moved so each dead player doesn't remain on screen until there is a winner
        for (var i in playerTanks) {
            if (playerTanks[i].isDead()) {
                playerTanks[i].removeAllChildren();
            }
        }
        stage.update();
        createjs.Sound.play(ripSound);
        createjs.Sound.mute = true;
    }

    // Remove the smoke animation once it is complete
    if (animation.currentFrame > 14) {
        stage.removeChild(animation);
    }

    // Rotate barrels
    rotateBarrel();

    // Update player labels
    playerLabel();

    // Update the power selections
    changePower();

    currentUpdateCount++;

    if (currentUpdateCount === updateDelay) {
        // Shoot if space bar is pressed
        if (spaceKeyDown && !waitingForMissiles)
            shoot();

        if (activeMissiles.length > 0) {
            //console.log("Number of missiles: " + activeMissiles.length);
            var elemsToRemove = [];
            for (i = activeMissiles.length - 1; i >= 0; i--) {
                // Do not interact with missile if it no longer exists on stage or has exploded
                if (activeMissiles[i].checkOutOfBounds() || activeMissiles[i].hasExploded()) {
                    //console.log("HERE");
                    elemsToRemove.push(i);
                } else {
                    activeMissiles[i].moveToNextPos();
                }
            }
            //console.log("Missiles to remove: " + elemsToRemove.length);

            // Remove the missiles from the stage and activeMissiles only when all are ready to be removed
            if (elemsToRemove.length === activeMissiles.length) {
                //console.log("Removing all missiles...");
                activeMissiles = [];
                //console.log("Number of active missiles: " + activeMissiles.length);

                // Change turns
                currentTank.hideMarker();
                do {
                    currentTankIndex = (currentTankIndex + 1) % playerTanks.length;
                    currentTank = playerTanks[currentTankIndex];
                } while (currentTank.isDead());
                currentTank.showMarker();
            }

            waitingForMissiles = (activeMissiles.length > 0);
            console.log("Waiting for missiles: " + ((waitingForMissiles) ? "True" : "False"));
        }

        currentUpdateCount = 0;
    }
    stage.update();
}


function addTanks(playerCount) {
    // Add our tanks
    playerTanks = [];
    for (i = 0; i < playerCount; i++) {
        s = "p" + (i + 1) + "TankPNG";
        playerTanks.push(new Tank(tankNames[i], (i + 1 <= (playerCount / 2)) ? 0 : 180, s, "tankBarrel"));
    }

    // Show the marker on the first player in the game
    playerTanks[0].showMarker();

    // Position each tank on the field
    positionTanks();

    for (var i in playerTanks) {
        playerTanks[i].setMovesLeft(maxMoves);
        stage.addChild(playerTanks[i]);
    }

    currentTankIndex = 0;
    currentTank = playerTanks[currentTankIndex];
}

// Used for initializing the positions of the tanks
function positionTanks() {
    var divisionSize = stageXblocks / (playerTanks.length);
    for (var i in playerTanks) {
        var xPosition = (i * divisionSize) + (divisionSize / 2);
        xPosition = (xPosition <= stageXblocks / 2) ? Math.floor(xPosition) : Math.ceil(xPosition);
        playerTanks[i].x = xPosition * landBlockSize;
        playerTanks[i].y = stageYdimens - (blocks[xPosition].length * landBlockSize);
    }
}

// Used for repositioning the height of the tanks on the screen (perhaps after block desctruction)
function positionTanksHeight() {
    for (var i in playerTanks) {
        if (!playerTanks[i].isDead()) {
            var xPosition = parseInt(playerTanks[i].x / landBlockSize);
            playerTanks[i].y = stageYdimens - (blocks[xPosition].length * landBlockSize);
        }
    }
}

function playerLabel() {
    lblNowPlaying.text = "Player: " + currentTank.name;
    var str = "--- Health ---";
    for (var i in playerTanks) {
        var addStr = "";
        if (playerTanks[i].getHealth() === 0)
            addStr = "ded";
        else if (playerTanks[i].getHealth() < 10)
            addStr = "00" + playerTanks[i].getHealth();
        else if (playerTanks[i].getHealth() < 100)
            addStr = "0" + playerTanks[i].getHealth();
        else
            addStr = playerTanks[i].getHealth();
        str += "\n" + addStr + " " + playerTanks[i].name;
    }
    lblHealth.text = str;
    lblBarrelRotation.text = currentTank.getBarrelRotation();
    lblMovesLeft.text = currentTank.getMovesLeft();
    lblPowerLevel.text = currentTank.getPowerLevel();
    lblAmmoType.text = currentTank.selectedMissile.id.toUpperCase() + ": " + currentTank.selectedMissile.count;
}

//initializes the buttons for controlling the tanks
function initUI() {

    //Control Button Initialization
    //Right Rotation button
    btnRotateRight = new ArrowButton(180);
    btnRotateRight.on("mousedown", function() {
        btnRotateRightPressed = true;
    })

    btnRotateRight.on("pressup", function() {
        btnRotateRightPressed = false;
    });
    btnRotateRight.x = 60 + 25;



    //Left rotation button
    btnRotateLeft = new ArrowButton(0);
    btnRotateLeft.on("mousedown", function() {
        btnRotateLeftPressed = true;
    });
    btnRotateLeft.on("pressup", function() {
        btnRotateLeftPressed = false;
    });
    btnRotateLeft.x = 60 - 25;

    //Fire button
    btnFire = new createjs.Shape();
    btnFire.graphics.beginStroke("#000000").beginFill("#ff0000").drawRect(0, 0, 100, 35);
    btnFire.x = 475;
    btnFire.y = 25;
    var text = new createjs.Text("FIRE", "22px Arial", "#000000");
    text.x = btnFire.x + 25;
    text.y = 33;

    //Moves Left label
    lblMovesLeft = new createjs.Text("", "10px Arial", "#000000");
    lblMovesLeft.x = 202;
    lblMovesLeft.y = 12;

    btnFire.addEventListener("click", shoot);
    stage.addChild(btnFire);

    //Ammo Type Label
    lblAmmoType = new createjs.Text("", "10px Arial", "#000000");
    lblAmmoType.x = 370;
    lblAmmoType.y = 12;

    //Next Ammo Button
    btnNextAmmo = new ArrowButton(180);
    btnNextAmmo.addEventListener("click", function() { currentTank.nextMissile(); });
    btnNextAmmo.x = 390 + 25;

    //Previous Ammo Button
    btnPreviousAmmo = new ArrowButton(0);
    btnPreviousAmmo.addEventListener("click", function() {
        currentTank.previousMissile();
    });
    btnPreviousAmmo.x = 390 - 25;
    //Right move button
    btnMoveRight = new ArrowButton(180);
    btnMoveRight.addEventListener("click", moveTankRight);
    btnMoveRight.x = 170 + 25;

    //Left move button
    btnMoveLeft = new ArrowButton(0);
    btnMoveLeft.addEventListener("click", moveTankLeft);
    btnMoveLeft.x = 170 - 25;

    //Power down button;
    btnDecreasePower = new ArrowButton(0);
    btnDecreasePower.on("mousedown", function() {
        btnDecreasePowerPressed = true;
    });
    btnDecreasePower.on("pressup", function() {
        btnDecreasePowerPressed = false;
    });
    btnDecreasePower.x = 270 - 25;

    //Power Up Button
    btnIncreasePower = new ArrowButton(180);
    btnIncreasePower.on("mousedown", function() {
        btnIncreasePowerPressed = true;
    });
    btnIncreasePower.on("pressup", function() {
        btnIncreasePowerPressed = false;
    });
    btnIncreasePower.x = 270 + 25;


    //Power Labels
    lblPowerLevel = new createjs.Text("", "10px Arial", "#000000");
    lblPowerLevel.x = 285;
    lblPowerLevel.y = 12;

    //Misc Labels
    var moves = new createjs.Text("Moves Left:", "10px Arial", "#000000");
    moves.x = 143;
    moves.y = 12;

    var angle = new createjs.Text("Firing Angle:", "10px Arial", "#000000");
    angle.x = 30;
    angle.y = 12;

    var power = new createjs.Text("Power:", "10px Arial", "#000000");
    power.x = 250;
    power.y = 12;

    btnRotateRight.y = btnNextAmmo.y = btnPreviousAmmo.y = btnRotateLeft.y = btnDecreasePower.y = btnIncreasePower.y = btnMoveRight.y = btnMoveLeft.y = 40;

    stage.addChild(lblAmmoType, btnNextAmmo, btnPreviousAmmo, btnRotateRight, btnRotateLeft, lblBarrelRotation, btnMoveRight, btnMoveLeft, text, lblMovesLeft, moves, angle, btnDecreasePower, btnIncreasePower, power, lblPowerLevel);
}

function landGeneration() {
    blocks = [];
    landBlockSize = 20;
    maxLandDev = 1; // The max amount the land can deviate per step either way when generating
    landMin = (stageYdimens / landBlockSize) * 0.20; // Land must be at least 20% above bottom
    landMax = (stageYdimens / landBlockSize) * 0.60; // Land must not exceed 60% above bottom
    stage.update(); // why is this here?

    // Create the graphics block used to make landscape blocks
    g.beginStroke("#8B4513").beginFill("#D2691E");
    g.drawRect(0, 0, landBlockSize, landBlockSize);

    // Get the starting position for the landscape
    var m = getRandomInt(landMin, landMax);

    blocks = get2DArray(stageXdimens / landBlockSize);

    // Add random blocks as terrain
    for (i = 0; i < stageXdimens / landBlockSize; i++) {
        m = getRandomInt(m - maxLandDev, m + maxLandDev + 1);
        if (m < landMin) {
            m = landMin;
        }
        if (m > landMax) {
            m = landMax;
        }
        for (j = 0; j < m; j++) {
            blocks[i][j] = new createjs.Shape(g);
        }
    }

    // Place blocks on the correct screen positions
    for (i = 0; i < blocks.length; i++) {
        for (j = 0; j < blocks[i].length; j++) {
            blocks[i][j].x = landBlockSize * i;
            blocks[i][j].y = y_bot(landBlockSize * j);
            stage.addChild(blocks[i][j]);
        }
    }

    stageXblocks = blocks.length;
    stageYblocks = blocks[0].length;
}

function y_bot(y) {
    return (stageYdimens - y);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function get2DArray(size) {
    size = size > 0 ? size : 0;
    var arr = [];

    while (size--) {
        arr.push([]);
    }

    return arr;
}

function shoot() {
    if (!waitingForMissiles) {
        activeMissiles.push(currentTank.getMissile(landBlockSize));
        //currentTank.fireMissile();
        currentTank.setMovesLeft(maxMoves);

        // Add smoke animation
        animation.x = currentTank.x + (landBlockSize / 2) + (12 * Math.cos(toRadians(-currentTank.getBarrelRotation())));
        animation.y = currentTank.y + (landBlockSize / 2) + (12 * Math.sin(toRadians(-currentTank.getBarrelRotation())));
        animation.scaleX = .5;
        animation.scaleY = .5;
        animation.gotoAndPlay("start");
        stage.addChild(animation);

        for (var i in activeMissiles) {
            stage.addChild(activeMissiles[i]);
        }

        createjs.Sound.play(gunSound); // play using id.  Could also use full source path or event.src.
    }
}

function handleKeyDown(e) {
    switch (e.keyCode) {
        case ARROW_KEY_UP:
            upKeyDown = true;
            //console.log("up arrow up");
            break;
        case ARROW_KEY_DOWN:
            downKeyDown = true;
            break;
        case ARROW_KEY_LEFT:
            leftKeyDown = true;
            break;
        case ARROW_KEY_RIGHT:
            rightKeyDown = true;
            break;
        case SPACE_KEY:
            spaceKeyDown = true;
            break;
        case A_KEY:
            if (!isMoving) {
                isMoving = true;
                moveTankLeft();
            }
            break;
        case D_KEY:
            if (!isMoving) {
                isMoving = true;
                moveTankRight();
            }
            break;
        default:
            break;
    }
}

function handleKeyUp(e) {
    switch (e.keyCode) {
        case ARROW_KEY_UP:
            upKeyDown = false;
            break;
        case ARROW_KEY_DOWN:
            downKeyDown = false;
            break;
        case ARROW_KEY_LEFT:
            leftKeyDown = false;
            break;
        case ARROW_KEY_RIGHT:
            rightKeyDown = false;
            break;
        case SPACE_KEY:
            spaceKeyDown = false;
            break;
        case A_KEY:
            isMoving = false;
            break;
        case D_KEY:
            isMoving = false;
            break;
        default:
            break;
    }
}

function rotateBarrel() {
    if (!waitingForMissiles) {
        if ((btnRotateLeftPressed || leftKeyDown) && (currentTank.getBarrelRotation() < 180)) {
            currentTank.rotateBarrelLeft();
        }
        if ((btnRotateRightPressed || rightKeyDown) && (currentTank.getBarrelRotation() > 0)) {
            currentTank.rotateBarrelRight();
        }
    }
}

function moveTankLeft() {
    if (!waitingForMissiles) {
        if (currentTank.getMovesLeft() > 0 && currentTank.x > 0) {
            var xPosition = parseInt(currentTank.x / landBlockSize) - 1;
            var yPosition = blocks[xPosition].length;
            currentTank.x = landBlockSize * xPosition;
            currentTank.y = stageYdimens - (landBlockSize * yPosition);
            currentTank.useMove();
        }
    }
}

function moveTankRight() {
    if (!waitingForMissiles) {
        if (currentTank.getMovesLeft() > 0 && currentTank.x < stageXdimens - landBlockSize) {
            var xPosition = parseInt(currentTank.x / landBlockSize) + 1;
            var yPosition = blocks[xPosition].length;
            currentTank.x = landBlockSize * xPosition;
            currentTank.y = stageYdimens - (landBlockSize * yPosition);
            currentTank.useMove();
        }
    }
}

function changePower() {
    if (!waitingForMissiles) {
        if ((btnIncreasePowerPressed || upKeyDown) && currentTank.getPowerLevel() < 100) {
            currentTank.increasePowerLevel();
        }
        if ((btnDecreasePowerPressed || downKeyDown) && currentTank.getPowerLevel() > 20) {
            currentTank.decreasePowerLevel();
        }
    }
}