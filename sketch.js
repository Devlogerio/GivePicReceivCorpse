p5.disableFriendlyErrors = true;
window.onerror = function(e) {
  e.preventDefault();
  return true;
}

disableCanvasClick = true;
var peopleImages = [];
var peopleImagesIndexes = [];
var mapImages = [];
var mapIndexes = [];
var aimImage;
var game;
var player;
var startDiv;
var statusDiv;
var map;
var livesDiv;
var bulletsDiv;
var levelDiv;
var gameOverDiv;

var shotSound;
var crowdSound;
var crowdScream;
var guideSound;
var targetDownSound;
var shotMissedSound;
var innocentDiedSound;
var gameOverSound;
var deathSound;


function preload() {
  for (var i = 1; i < 88; i++) {
    peopleImages[i] = loadImage("./img/people/" + i + ".png");
    peopleImagesIndexes.push(i);
  }
  for (var i = 1; i < 6; i++) {
    mapImages[i] = loadImage("./img/maps/" + i + ".png");
    mapIndexes.push(i);
  }
  map = loadImage("./img/maps/" + 1 + ".png");
  aimImage = loadImage("./img/scope/1.png");

  crowdSound = loadSound('./sounds/2.mp3');

  soundFormats('mp3');
  shotSound = loadSound('./sounds/1.mp3');
  shotSound.playMode('sustain');
  shotSound.setVolume(0.2);
  crowdScream = loadSound('./sounds/3.mp3');
  crowdScream.playMode('sustain');
  crowdScream.setVolume(1.5);
  guideSound = loadSound('./sounds/4.mp3');
  guideSound.playMode('sustain');
  guideSound.setVolume(6);
  targetDownSound = loadSound('./sounds/5.mp3');
  targetDownSound.playMode('sustain');
  targetDownSound.setVolume(6);
  shotMissedSound = loadSound('./sounds/6.mp3');
  shotMissedSound.playMode('sustain');
  shotMissedSound.setVolume(6);
  innocentDiedSound = loadSound('./sounds/7.mp3');
  innocentDiedSound.playMode('sustain');
  innocentDiedSound.setVolume(6);
  gameOverSound = loadSound('./sounds/8.mp3');
  gameOverSound.playMode('sustain');
  gameOverSound.setVolume(6);
  deathSound = loadSound('./sounds/9.mp3');
  deathSound.playMode('sustain');
  deathSound.setVolume(5);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  

  statusDiv = document.getElementById("statusDiv");
  startDiv = document.getElementById("startDiv");
  livesDiv = document.getElementById("livesDiv");
  bulletsDiv = document.getElementById("bulletsDiv");
  levelDiv = document.getElementById("levelDiv");
  gameOverDiv = document.getElementById("gameOverDiv");
  
  player = new Player();
  game = new Game();
  game.initialPeople();
  frameRate(30);
  
  startDiv.style.display = 'block';
}

function draw() {
  // background(255);
  game.drawMap();
  for(var i in game.people) {
    game.people[i].update();
    game.people[i].draw();
  }
  game.checkPeopleRemoval();
  game.checkPopulation();
  game.drawTarget();
  drawAimImage();
  updateHud();
}

class People {
  constructor(population) {
    this.id = random(getShrinkenPeopleIndexes(game.level));
    this.x = random([-50, windowWidth + 50]);
    this.y = floor(random(windowHeight/1.8, windowHeight - 100));
    this.width = 90;
    this.height = 136;
    this.widthDiv2 = this.width/2;
    this.heightDiv2 = this.height/2;
    this.speed = this.initialSpeed();
    // this.image = peopleImages[floor(random(peopleImages.length))];
    this.remove = false;
  }

  repositionY() {
    this.y = floor(random(windowHeight/1.8, windowHeight - 100));
  }

  initialSpeed() {
    if(this.id === game.targetId) {
      if(this.x > windowWidth/2) {
        return random(-17, -1);
      } else {
        return random(1, 17);
      }
    }

    if(this.x > windowWidth/2) {
      return random(-10, -1);
    } else {
      return random(1, 10);
    }
  }

  update() {
    this.x +=  this.speed * (deltaTime / 50);
    if(this.x >= windowWidth + 55 || this.x <= -55) {
      this.remove = true;
    }
  }

  draw(){
    push();
    // fill(255, 0, 0);
    image(peopleImages[this.id], this.x - this.widthDiv2, this.y - this.heightDiv2, this.width, this.height);
    // rect(this.x - 45, this.y - 68, 90, 136);
    // textSize(32);
    // text(this.id, this.x - this.widthDiv2, this.y - this.heightDiv2);
    pop();
  }

  onHit() {
      if(this.id === game.targetId) {
        this.remove = true;
        return true;
      } else {
        this.remove = true;
        return false;
      }

  }
}

class Player {
  constructor() {
    this.kills = 0;
    this.shots = 3;
    this.lives = 3;
    this.gameOver = false;
  }

  shoot() {
    this.shots--;
    try {
      shotSound.play();
    } catch(e) {}
    var hits = []
    for(var i in game.people) {
      var currentPerson = game.people[i];
      if(mouseX < currentPerson.x + currentPerson.widthDiv2 && mouseX > currentPerson.x - currentPerson.widthDiv2 && mouseY < currentPerson.y + currentPerson.heightDiv2 && mouseY > currentPerson.y - currentPerson.heightDiv2) {
        hits.push(i);
      }
    }

    var didHitRightTarget = false;
    for(var i in hits) {
      didHitRightTarget = game.people[hits[i]].onHit();
      if(didHitRightTarget == true) {
        player.livesUpdate(true);
        break;
      }
    }

    if(hits.length >= 1 && didHitRightTarget == false) {
      player.livesUpdate(false);
    }

    if(this.shots <= 0) {
      game.levelDown();
    }
  }

  livesUpdate(targetIsShot) {
    if(targetIsShot == true) {
      player.kills++;
      game.levelUp();
    } else {
      player.lives--;
      console.log('life gone');
      showDiv(`Innocent died!</br>Level: ${game.level}</br>Lives: ${this.lives}`);
      deathSound.play();
      crowdScream.play();
      innocentDiedSound.play();
    }
    if(player.lives < 0) {
      game.gameOver();
    }
  }

  reload() {
    this.shots = 3;
  }
}

class Game {
  constructor() {
    this.level = 10;
    this.targetId = random(getShrinkenPeopleIndexes(this.level));
    console.log(this.targetId);
    this.map = random(mapIndexes);
    this.people = [];
    this.gameSituation = 'On going';
  }

  initialPeople() {
    var population = 5 * this.level;
    for(var i = 0 ; i < 5 * this.level; i++) {
      this.people.push(new People(population));
    }
  }

  checkPeopleRemoval() {
    var removalIndexes = [];
    for(var i in this.people) {
      if(this.people[i].remove == true) {
        removalIndexes.push(i);
      }
    }
    for(var i in removalIndexes) {
      this.people.splice(removalIndexes[i], 1);
      var population = 5 * this.level;
      this.people.push(new People(population));
    }
  }

  gameOver() {
    this.gameSituation = 'Game over';
    showDivForEver('Game over.');
    gameOverDiv.style.display = 'block';
    gameOverSound.play();
  }

  levelUp() {
    this.level++;
    console.log('Level+ ! ' + this.level);
    player.reload();
    this.newTarget();
    showDiv(`*Target Down*</br>Level up</br>Level: ${this.level}`);
    deathSound.play();
    crowdScream.play();
    targetDownSound.play();
    this.changeMap();
  }

  levelDown() {
    this.level--;
    if(this.level <=  0) {
      this.gameOver();
      return;
    }
    console.log('Level- ! ' + this.level);
    player.reload();
    this.newTarget();
    showDiv(`Missed!</br>Level down</br>Level: ${this.level}`);
    shotMissedSound.play();
    this.changeMap();
  }

  newTarget() {
    var population = 5 * this.level;
    this.targetId = random(getShrinkenPeopleIndexes(this.level));
    console.log(this.targetId);
  }

  checkPopulation() {
    var population = 5 * this.level;
    if(this.people.length < population) {
      this.people.push(new People(population));
    }
    else if(this.people.length > population) {
      this.people.pop();
    }
  }

  changeMap() {
    this.map = random(mapIndexes);
  }

  drawMap() {
    background(51);
    image(mapImages[this.map], 0, 0, windowWidth, windowHeight);
  }

  drawTarget() {
    push();
    translate(windowWidth/2 - 45, 5);
    stroke(color(0, 0, 255));
    strokeWeight(4);
    fill(0, 0, 0, 150);
    rect(0, 0, 90, 160);
    textSize(25);
    fill(71, 71, 255);
    textStyle(BOLDITALIC);
    text('Target', 4, 25);
    image(peopleImages[this.targetId], 0, 25, 90, 136);
    pop();
  }

}

function drawAimImage() {
  push();

  image(aimImage, mouseX - 50, mouseY - 50, 150, 150);
  pop();
}

function mousePressed() {
  if(disableCanvasClick == true) {
    return;
  }
  player.shoot();
}

var timer;
function showDiv(content) {
  clearTimeout(timer);
  disableCanvasClick = true;
  statusDiv.innerHTML = content;
  statusDiv.style.display = 'block';
  timer = setTimeout(function() {
    statusDiv.style.display = 'none';
    disableCanvasClick = false;
  }, 5000);
}

function showStartDiv() {
  clearTimeout(timer);
  disableCanvasClick = true;
  // timer = setTimeout(function() {
  //   startDiv.style.display = 'none';
  //   disableCanvasClick = false;
  // }, 10000);
}

function showDivForEver(content, backColor) {
  clearTimeout(timer);
  disableCanvasClick = true;
  statusDiv.style.background = backColor;
  statusDiv.innerHTML = content;
  statusDiv.style.display = 'block';
}

function getShrinkenPeopleIndexes(level) {
  var population = 5 * level;
  if(population >= peopleImagesIndexes.length) {
    population = peopleImagesIndexes.length;
  }
  return peopleImagesIndexes.slice(0, population)
}

function updateHud() {
  livesDiv.innerHTML = 'Lives: ' + player.lives;
  if(player.lives < 0) {
    livesDiv.innerHTML = 'Lives: ' + player.lives + 1;
  }
  bulletsDiv.innerHTML = 'Bullets: ' + player.shots;
  levelDiv.innerHTML = 'Level: ' + game.level;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if(game) {
    for(var i in game.people) {
      game.people[i].repositionY();
    }
  }
}

function startGame() {
  guideSound.play();
  disableCanvasClick = false;
  startDiv.style.display = 'none';
  crowdSound.loop();
}
