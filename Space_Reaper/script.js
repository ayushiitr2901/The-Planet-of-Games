var W = 1300,
H = 600,
LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, FIRE = 16,
RESET = 27; // esc

var sfx = {
    fire: new Audio("sound_effects/cg1.wav"),
    enemyHit: new Audio("sound_effects/flyswatter3.wav"),
    avatarHit: new Audio("sound_effects/deathh.wav"),
    backgroundsound: new Audio("sound_effects/forest.wav"),
    over: new Audio("sound_effects/over2.wav")
};
var Game = function Game (canvas) {
    var that = this,
        INTERVAL = 30,
        timer = -1,
        previousTime = 0;
    this.currentState = null;
    this.introState = null;
    this.gameplayState = null; new GameplayState(this);
    this.onFrame = function () {
        var currentTime = new Date().getTime(),
            timeElapsed;
        if (previousTime == 0) {
            previousTime = currentTime;
        }
    timeElapsed = currentTime - previousTime;
    that.clearCanvas(canvas);
    // Only update the currentState.
    that.currentState.update (timeElapsed, currentTime);
    that.currentState.draw (canvas, timeElapsed, currentTime);
    previousTime = currentTime;
    };
    this.init = function () {
        timer = setInterval( that.onFrame, INTERVAL );
        that.reset();
    };
    this.startGame = function () {
        that.clearCanvas();
        that.gameplayState = new GameplayState(that);
        that.currentState = that.gameplayState;
        that.introState = null;
        sfx.backgroundsound.play();
    }
    this.reset = function () {
        that.clearCanvas();
        that.introState = new IntroState(that);
        that.currentState = that.introState;
        that.gameplayState = null;
        sfx.backgroundsound.pause();
    }
    this.clearCanvas = function () {
        var c = canvas.getContext("2d");
        c.beginPath();
        c.rect(0,0,W,H);
        c.fillStyle = "#000000";
        c.fill();
    }
}
function IntroState (game) {
    var that = this;
    this.game = game;
    var img = new Image();
    img.src = "images/cover.png";
    var opacity = 0;
    var fadeDuration = 1000;
    // startTime thing prevents accidentally starting the game again.
    var startTime = 0;
    this.update = function (timeElapsed, currentTime) {
        if (startTime == 0) { startTime = currentTime; }

        var runningTime = currentTime - startTime;
        opacity = runningTime / fadeDuration;

        if (runningTime > fadeDuration &&
            key.getPressedKeyCodes() == 13) {
            this.game.startGame();
        }
    }
    this.draw = function (canvas, timeElapsed, currentTime) {
        var c = canvas.getContext("2d");
        c.globalAlpha = opacity;
        c.drawImage (img, 0, 0, W, H);
        c.globalAlpha = 1.0;
    }
}

function GameplayState (game) {
    var that = this;
    this.game = game;
    var bg = new Background();
    var avatar = new Avatar();
    var enemyManager = new EnemyManager();     
    var scoreManager = new ScoreManager();  
    scoreManager.x = W - 200;          
    scoreManager.y = 40;
    var healthManager = new HealthManager();
    healthManager.x = 200;
    healthManager.y = 40;

    this.update = function (timeElapsed, currentTime) {
        bg.offset += timeElapsed/bg.interval * bg.image.width;
        enemyManager.update(timeElapsed, currentTime);
        // quit game on ESC
        if (key.isPressed(RESET) || healthManager.GameOver()) {                    
            this.game.reset();
        }
        if (key.isPressed(RIGHT)) {                    
            avatar.x += avatar.vx;
        }
        if (key.isPressed(LEFT)) {
            avatar.x -= avatar.vx;
        }
        if (key.isPressed(UP)) {
            avatar.y -= avatar.vy;    
        }
        if (key.isPressed(DOWN)) {
            avatar.y += avatar.vy;    
        }
        if (key.isPressed(FIRE) && avatar.canFire()) {
            avatar.spawnBullet();
        }

        // constrain avatar to bounds of screen.
        avatar.x = Math.max(0, Math.min(avatar.x, W-avatar.image.width));
        avatar.y = Math.max(0, Math.min(avatar.y, H-avatar.image.height));

        var b = avatar.bullet;
        if (b) {
            b.vx += b.ax;
            b.x += b.vx;
            if (b.x > W) {
                avatar.killBullet();
            }
        }
        that.detectCollisions();
    }
    this.draw = function (canvas, timeElapsed, currentTime) {
        var c = canvas.getContext("2d"), 
        b = avatar.bullet;
        var x = -bg.offset;
        var i = 0;
        while (x < W) {
            var y = 0;
            while (y < H) {
                c.drawImage(bg.image, x, y, bg.image.width, bg.image.height);
                y += bg.image.height;
            }
            x += bg.image.width;
        }
        enemyManager.draw(canvas, timeElapsed, currentTime);
        scoreManager.draw(canvas, timeElapsed, currentTime);
        healthManager.draw(canvas, timeElapsed, currentTime);

        if (b) {
            // draw bullet
            b.draw(c);
        }
        // draw avatar
        avatar.draw(c);
    }
    this.detectCollisions = function () {
        var i = 0, l = enemyManager.enemies.length;
        for (; i < l; i++) {
            var enemy = enemyManager.enemies[i];
            if (enemy == null) { continue; }
            if (
                (avatar.x + avatar.image.width > enemy.x && avatar.x < enemy.x + enemy.width()) &&
                (avatar.y + avatar.image.height > enemy.y && avatar.y < enemy.y + enemy.height())
            ) {
                that.resolveEnemyHitAvatar(enemy, avatar); 
            }
        var bullet = avatar.bullet;
            if ( bullet &&
                (bullet.x + bullet.image.width > enemy.x && bullet.x < enemy.x + enemy.width()) &&
                (bullet.y + bullet.image.height > enemy.y && bullet.y < enemy.y + enemy.height())) {
                that.resolveBulletHitEnemy(bullet, enemy); 
            }
        }
    }
    this.resolveEnemyHitAvatar = function (enemy, avatar) {
        enemyManager.killEnemy(enemy);
        // avatar.hitPoints--;
        healthManager.takelife();
        avatar.x -= 40;
        console.log("OUCH!");
        sfx.avatarHit.play();
    }
    this.resolveBulletHitEnemy = function (bullet, enemy) {
        enemyManager.killEnemy(enemy);
        avatar.killBullet();
        scoreManager.incrementScore();
        sfx.enemyHit.play();
    }
}

function Background() {
    this.offset = 0;
    this.interval = 3000;
    this.image = new Image();
    this.image.src = "images/space-2.png";
}

function Avatar () {
    // position
    this.x = 30;
    this.y = H/2;
    // velocity
    this.vx = 10;
    this.vy = 10;
    // HP
    this.hitPoints = 10;
    // view
    this.image = new Image();
    this.image.src = "images/www.png";
    this.bullet = null;
    this.canFire = function () {
        return this.bullet == null;
    }
    this.spawnBullet = function () {
        this.bullet = new Bullet();
        this.bullet.x = this.x + this.image.width / 2;
        this.bullet.y = this.y + this.image.height / 2;
        sfx.fire.play();
    };
    this.killBullet = function () {
        this.bullet = null;
    };

    this.draw = function (context) {
        context.drawImage(this.image, this.x, this.y);
    }
}

function Bullet () {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.ax = 1;
    this.image = new Image();
    this.image.src = "images/web9.png";
    this.draw = function (context) {
        context.drawImage(this.image, this.x, this.y);
    }
}

function Enemy (startTime) {
    this.x = 0;
    this.y = 0;
    this.image = new Image();
    this.image.src = "images/xx.png";
    this.fps = 3;
    this.frameWidth = 94;
    this.totalFrames = 6;
    this.frameHeight = 100;
    this.scale = 1.0;
    this.startTime = startTime;
    this.getCurrentFrame = function (currentTime) {
        return (Math.floor((currentTime / 1000) * this.fps) % this.totalFrames);
    }
    this.getFrameX = function (currentTime) {
        return this.getCurrentFrame(currentTime) * this.frameWidth;
    }
    this.getFrameY = function (currentTime) {
        return 0;
    }
    this.draw = function (canvas, timeElapsed, currentTime) {
        var c = canvas.getContext("2d");
        c.drawImage(this.image, this.getFrameX(currentTime), this.getFrameY(currentTime), this.frameWidth, this.frameHeight, this.x, this.y, this.frameWidth * this.scale, this.frameHeight * this.scale);
    }
    this.width = function () {
        return this.frameWidth * this.scale;
    }
    this.height = function () {
        return this.frameHeight * this.scale;
    }
}

function EnemyManager () {
    this.enemies = [];
    this.SPEED = -3;
    this.SPAWN_FREQUENCY = 1200;
    this.spawnTimer = 0;
    this.spawnEnemy = function (currentTime) {
        var enemy = new Enemy(currentTime);
        enemy.x = W;
        enemy.y = Math.random() * (H - enemy.image.height);
        console.log("Spawned enemy");
        this.enemies.push(enemy);
    }

    this.update = function (timeElapsed, currentTime) {
    // this.x = Math.max(0, Math.min(this.x, W-this.image.width));
    // this.y = Math.max(0, Math.min(this.y, H-this.image.height));
        this.spawnTimer += timeElapsed;
        if (this.spawnTimer > this.SPAWN_FREQUENCY) {
            this.spawnEnemy(currentTime);
            this.spawnTimer = 0;
        }
        for (var i = 0; i < this.enemies.length; i++ ) {
            var enemy = this.enemies[i];
            if (enemy != null) {
                enemy.vy = Math.sin((currentTime - enemy.startTime)/300) * 5;
                enemy.x += this.SPEED;
                enemy.y += enemy.vy;
                if (enemy.x < 0 - enemy.image.width) {
                    this.killEnemy(enemy);
                }
            }
        }
    }

    this.draw = function (canvas, timeElapsed, currentTime) {
        var c = canvas.getContext("2d");
        for (var i = 0; i < this.enemies.length; i++ ) {
            var enemy = this.enemies[i];
            if (enemy != null) {
                enemy.draw (canvas, timeElapsed, currentTime);
            }
        }
    }
    this.killEnemy = function (enemy) {
        var i = this.enemies.indexOf(enemy);
        if (i >= 0) {
            this.enemies.splice(i, 1);
        }
    }
}

function ScoreManager () {
    var score = 0,
    x = 0, y = 0;
    this.incrementScore = function () {
        score += 100;
    }
    this.resetScore = function () {
        score = 0;
    }
    this.draw = function (canvas, timeElapsed, currentTime) {
        var c = canvas.getContext("2d"),
        text = score+ " pts";
        c.font= "32px Arial";
        c.fillStyle = "white";
        c.fillText(text, this.x, this.y);
    }
}

function HealthManager (){
    var x=0, y = 0;
    var hits = 10;
    this.takelife = function () {
        hits -= 1;
    }
    this.GameOver = function () {
        if(hits<=0){
            sfx.over.play();
            alert("GameOver");
            return true;
        }
    }

    this.draw = function (canvas, timeElapsed, currentTime) {
        var c = canvas.getContext("2d"),
        text = "Life: "+ hits;
        c.font= "32px Arial";
        c.fillStyle = "white";
        c.fillText(text, this.x, this.y);
    }
}

window.onload = function(){
var canvas = document.getElementById("canvas");
var game = new Game(canvas);
game.init();
};