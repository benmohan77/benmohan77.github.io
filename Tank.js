(function() {
    var Tank = function(playerName, barrelRotation, tankPNG, barrelPNG) {
        var tank = new createjs.Container();

        // Create tank bitmap
        tank.bitmap = new createjs.Bitmap(queue.getResult(tankPNG));

        // Create tank barrel
        tank.barrel = new createjs.Bitmap(queue.getResult(barrelPNG));
        tank.barrel.regX = 0;
        tank.barrel.regY = 2.5;
        tank.barrel.x = 10;
        tank.barrel.y = 10;
        tank.barrel.rotation = -barrelRotation;

        tank.marker = new createjs.Shape();
        tank.marker.graphics.beginFill("#6F6").setStrokeStyle(2)
            .beginStroke("#26F").drawPolyStar(0, 0, 8, 3, 0.5, 90);
        tank.marker.alpha = 0;
        tank.marker.x = 10;
        tank.marker.y = -25;
        tank.marker.moveAnimation = createjs.Tween.get(tank.marker, { paused: true, loop: true })
            .to({ y: -35 }, 750).to({ y: -25 }, 750);

        tank.damageText = new createjs.Text("", "10px Arial", "#F00");

        // Add tank bitmap, barrel bitmap, and the marker shape to the tank container
        tank.addChild(tank.bitmap);
        tank.addChild(tank.barrel);
        tank.addChild(tank.marker);
        tank.addChild(tank.damageText);

        // Set common properties of the tank
        tank.name = playerName;
        tank.health = 100;
        tank.movesLeft = 0;
        tank.powerLevel = 50;

        // Set tank functions
        tank.damageTank = damageTank;
        tank.nextMissile = nextMissile;
        tank.previousMissile = previousMissile;
        tank.getHealth = getHealth;
        tank.killTank = killTank;
        tank.isDead = isDead;
        tank.rotateBarrelLeft = rotateBarrelLeft;
        tank.rotateBarrelRight = rotateBarrelRight;
        tank.getBarrelRotation = getBarrelRotation;
        tank.getMovesLeft = getMovesLeft;
        tank.useMove = useMove;
        tank.setMovesLeft = setMovesLeft;
        tank.getPowerLevel = getPowerLevel;
        tank.decreasePowerLevel = decreasePowerLevel;
        tank.increasePowerLevel = increasePowerLevel;
        tank.showMarker = showMarker;
        tank.hideMarker = hideMarker;
        tank.getMissile = getMissile;
        tank.MISSILES = {
            normal: { id: "normal", count: 100 },
            big: { id: "big", count: 10 },
            fast: { id: "fast", count: 20 }
        };
        tank.selectedMissile = tank.MISSILES.normal;


        return tank;
    }

    /* FUNCTIONS RELATING TO HEALTH */
    function damageTank(amount) {
        if (amount !== 0) {
            this.damageText.text = "-" + amount;
            this.damageText.y = -10;
            this.damageText.moveAnimation = createjs.Tween.get(this.damageText)
                .to({ alpha: 1, y: -20 }, 500).wait(1000).to({ alpha: 0, y: -30 }, 500);
            this.health -= amount;
            if (this.health < 0) {
                this.health = 0;
            }
        }
    }

    function nextMissile() {
        switch (this.selectedMissile) {
            case this.MISSILES.normal:
                this.selectedMissile = this.MISSILES.big;
                break;
            case this.MISSILES.big:
                this.selectedMissile = this.MISSILES.fast;
                break;
            case this.MISSILES.fast:
                this.selectedMissile = this.MISSILES.normal;
                break;
        }
    }

    function previousMissile() {
        switch (this.selectedMissile) {
            case this.MISSILES.normal:
                this.selectedMissile = this.MISSILES.fast;
                break;
            case this.MISSILES.fast:
                this.selectedMissile = this.MISSILES.big;
                break;
            case this.MISSILES.big:
                this.selectedMissile = this.MISSILES.normal;
                break;
        }
    }




    function getHealth() {
        return this.health;
    }

    function killTank() {
        damageTank(this.health);
    }

    function isDead() {
        return this.health <= 0;
    }

    /* FUNCTIONS RELATING TO BARREL ROTATION */
    function rotateBarrelLeft() {
        if (this.barrel.rotation > -180) {
            this.barrel.rotation--;
        }
    }

    function rotateBarrelRight() {
        if (this.barrel.rotation < 0) {
            this.barrel.rotation++;
        }
    }

    function getBarrelRotation() {
        return -this.barrel.rotation;
    }

    /* FUNCTIONS RELATING TO TANK MOVEMENT */
    function getMovesLeft() {
        return this.movesLeft;
    }

    function useMove() {
        this.movesLeft--;
    }

    function setMovesLeft(amount) {
        this.movesLeft = amount;
    }

    /* FUNCTIONS RELATING TO TANK POWER LEVELS */
    function getPowerLevel() {
        return this.powerLevel;
    }

    function decreasePowerLevel() {
        this.powerLevel--;
    }

    function increasePowerLevel() {
        this.powerLevel++;
    }

    /* FUNCTIONS RELATING TO THE MARKER ABOVE THE TANK */
    function showMarker() {
        this.marker.moveAnimation.setPaused(false);
        this.marker.alpha = 1;
    }

    function hideMarker() {
        this.marker.moveAnimation.setPaused(true);
        this.marker.alpha = 0;
    }

    /* FUNCTIONS RELATING TO THE SHOOTING OF MISSILES */
    function getMissile(landBlockSize) {
        if (this.selectedMissile.count > 0) {
            this.selectedMissile.count--;
            return Missile(this.selectedMissile.id, this.getBarrelRotation(), this.getPowerLevel() / 7, this.x + (landBlockSize / 2), this.y + (landBlockSize / 2));

        }
    }

    window.Tank = Tank;
})();