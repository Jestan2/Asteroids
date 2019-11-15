const gameHeight = 500;
const gameWidth = 700;
const FPS = 30;
const GAME_LIVES = 3; //num of lives
const ROIDS_NUM = 1; //initial number of asteroids
const ROIDS_JAG = 0.3; // jageddness of astroids
const ROID_SIZE = 100; //starting size of roids (pixels)
const ROID_SPD = 50; // max speed roids in pixels per seconds
const ROID_VERT = 10; //avg num of verticies
const SHIP_SIZE = 30; //height of ship in pixels
const TURN_SPEED = 360; //turn speed in degrrees per second
const SHIP_THRUST = 5; //accerleration of ship in pixels per sec
const FRICTION = 0.9;
const SHOW_BOUNDING = false; // show collision bounding.
const CENTER_DOT = false;
const SHIP_EXPLODE_DUR = 0.3; // duration of ships explosion
const LASER_EXPLODE_DUR = 0.1; // duration of lasers explosion
const SHIP_INV_DUR = 3; //invulrnability duration
const SHIP_BLINK_DUR = 0.2; // time for blink
const LASER_MAX = 10; //maximim number of lazers
const LASER_SPD = 500; // spd of lasers in pixels per second
const LASER_DIST = 0.6; // max distance laser can travel as fraction of screen width
const TEXT_FADE_TIME = 2; //text fade tim ein sconds
var canvas = document.getElementById("gameScreen");
let ctx = canvas.getContext("2d");

//set up game parameters

var roids, ship, level, text, textAlpha, lives;
newGame();

//set up event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

setInterval(update, 1000 / FPS);

function createAstroidBelt() {
  roids = [];
  var x, y;
  for (var i = 0; i < ROIDS_NUM + level; i++) {
    do {
      x = Math.floor(Math.random() * gameWidth);
      y = Math.floor(Math.random() * gameHeight);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROID_SIZE * 2 + ship.r);
    roids.push(newAsteroids(x, y, Math.ceil(ROID_SIZE / 2)));
  }
}
function destroyAstroid(index) {
  var x = roids[index].x;
  var y = roids[index].y;
  var r = roids[index].r;

  //split the astroid if required
  if (r === Math.ceil(ROID_SIZE / 2)) {
    roids.splice(index, 1);
    roids.push(newAsteroids(x, y, Math.ceil(ROID_SIZE / 4)));
    roids.push(newAsteroids(x, y, Math.ceil(ROID_SIZE / 4)));
  } else if (r === Math.ceil(ROID_SIZE / 4)) {
    roids.splice(index, 1);
    roids.push(newAsteroids(x, y, Math.ceil(ROID_SIZE / 8)));
    roids.push(newAsteroids(x, y, Math.ceil(ROID_SIZE / 8)));
  }
  //destroy the astroid
  else {
    roids.splice(index, 1);
  }
  if (roids.length === 0) {
    level++;
    newLevel();
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour = "white") {
  ctx.strokeStyle = colour;
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo(
    //nose of the ship
    x + (4 / 3) * ship.r * Math.cos(a),
    y - (4 / 3) * ship.r * Math.sin(a)
  );
  ctx.lineTo(
    //rear left
    x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a))
  );

  ctx.lineTo(
    //rear right
    x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a))
  );
  ctx.closePath();
  ctx.stroke();
}

function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
  lives--;
  if (lives === 0) {
    gameOver();
  }
}

function newAsteroids(x, y, r) {
  var lvlMult = 1 + 0.1 * level;
  var roid = {
    x: x,
    y: y,
    xv:
      ((Math.random() * ROID_SPD * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    yv:
      ((Math.random() * ROID_SPD * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2, //angle in radians
    vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 2),
    offs: []
  };
  for (var i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
  }

  return roid;
}

function newGame() {
  level = 0;
  lives = GAME_LIVES;
  ship = newShip();
  newLevel();
}

function newLevel() {
  text = "LEVEL " + (level + 1);
  textAlpha = 1.0;

  createAstroidBelt();
}
function gameOver() {
  ship.dead = true;
  textAlpha = 1.0;
  text = "GAME OVER";
}

function newShip() {
  return {
    x: gameWidth / 2,
    y: gameHeight / 2,
    r: SHIP_SIZE / 2,
    a: (90 / 180) * Math.PI, //convert to radians
    rot: 0,
    canShoot: true,
    lasers: [],
    thrusting: false,
    dead: false,
    blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    explodeTime: 0,
    thrust: {
      x: 0,
      y: 0
    }
  };
}

function shootLaser() {
  //draw lasers
  if (ship.canShoot === true && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      //from the nose of the ship
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
      yv: (-LASER_SPD * Math.sin(ship.a)) / FPS,
      dist: 0,
      explodeTime: 0
    });
  }

  // prevent further shooting
  ship.canShoot = false;
}

function keyDown() {
  switch (event.keyCode) {
    case 32: //shoot laser
      shootLaser();
      break;
    case 37: //left key(rotate ship left)
      ship.rot = ((TURN_SPEED / 180) * Math.PI) / FPS;
      break;

    case 38: //up key(move ship)
      ship.thrusting = true;
      break;

    case 39: // right key(rotate ship right)
      ship.rot = ((-TURN_SPEED / 180) * Math.PI) / FPS;
      break;
  }
}

function keyUp() {
  switch (event.keyCode) {
    case 32: //allow shooting again
      ship.canShoot = true;
      break;

    case 37: //left key(stop rotation left )
      ship.rot = 0;
      break;

    case 38: //up key(stop move ship)
      ship.thrusting = false;
      break;

    case 39: // right key(stop rotation right)
      ship.rot = 0;
      break;
  }
}

function update() {
  var blinkOn = ship.blinkNum % 2 === 0;

  var exploding = ship.explodeTime > 0;

  //draw space
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, gameWidth, gameHeight);

  //thrust the ship

  if (ship.thrusting) {
    ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;

    if (!exploding) {
      if (blinkOn) {
        //draw thrusters
        ctx.fillStyle = "#FF5237";
        ctx.strokeStyle = "yellow";
        ctx.lineWidth = SHIP_SIZE / 10;
        ctx.beginPath();
        ctx.moveTo(
          //rear left
          ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + Math.sin(ship.a)),
          ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - Math.cos(ship.a))
        );
        ctx.lineTo(
          //rear center behind ship
          ship.x - ship.r * (6 / 3) * Math.cos(ship.a),
          ship.y + ship.r * (6 / 3) * Math.sin(ship.a)
        );

        ctx.lineTo(
          //rear right
          ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - Math.sin(ship.a)),
          ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + Math.cos(ship.a))
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  } else {
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
  }

  if (!exploding) {
    if (blinkOn) {
      //draw trangular ship
      drawShip(ship.x, ship.y, ship.a);
    }
    //handle blinking
    if (ship.blinkNum > 0) {
      //reduce blink time
      ship.blinkTime--;
      if (ship.blinkTime === 0) {
        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
        ship.blinkNum--;
      }
    }
  } else {
    //draw the explosion
    ctx.fillStyle = "darkred";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.6, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.1, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.8, Math.PI * 2, false);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
    ctx.fill();
  }
  //circle zone
  if (SHOW_BOUNDING) {
    ctx.strokeStyle = "lime";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
    ctx.stroke();
  }
  //grab asteroid properties

  //draw the astroids

  var x, y, r, a, vert, offs;
  for (var i = 0; i < roids.length; i++) {
    x = roids[i].x;
    y = roids[i].y;
    r = roids[i].r;
    a = roids[i].a;
    vert = roids[i].vert;
    offs = roids[i].offs;

    //draw the path
    ctx.beginPath();
    ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));
    //draw the polygon
    ctx.strokeStyle = "slategrey";
    ctx.lineWidth = SHIP_SIZE / 20;
    for (var j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
        y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert)
      );
    }
    ctx.closePath();
    ctx.stroke();

    if (SHOW_BOUNDING) {
      ctx.strokeStyle = "lime";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false);
      ctx.stroke();
    }
  }

  //grab properties and loop
  var ax, ay, ar, lx, ly;
  for (var i = roids.length - 1; i >= 0; i--) {
    ax = roids[i].x;
    ay = roids[i].y;
    ar = roids[i].r;

    // prop for lasers
    for (var j = ship.lasers.length - 1; j >= 0; j--) {
      lx = ship.lasers[j].x;
      ly = ship.lasers[j].y;

      //detect the distance
      if (
        ship.lasers[j].explodeTime === 0 &&
        distBetweenPoints(ax, ay, lx, ly) < ar
      ) {
        //explode laser
        ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);

        //remove the astroid
        destroyAstroid(i);
        break;
      }
    }
  }

  //check for astroid collision
  if (!exploding) {
    if (ship.blinkNum === 0) {
      for (var i = 0; i < roids.length; i++) {
        if (
          distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
          ship.r + roids[i].r
        ) {
          explodeShip();
          destroyAstroid(i);
          break;
        }
      }
    }

    //rotate ship
    ship.a += ship.rot;

    //move ship

    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  } else {
    ship.explodeTime--;
    if (ship.explodeTime == 0) {
      ship = newShip();
    }
  }
  //collision detection
  if (ship.x < 0 - ship.r) {
    ship.x = gameWidth + ship.r;
  }
  if (ship.y < 0 - ship.r) {
    ship.y = gameHeight + ship.r;
  }
  if (ship.y > gameHeight + ship.r) {
    ship.y = 0 - ship.r;
  }
  if (ship.x > gameWidth + ship.r) {
    ship.x = 0 - ship.r;
  }

  if (CENTER_DOT) {
    ctx.fillStyle = "red";
    ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
  }

  //draw the lasers

  for (var b = 0; b < ship.lasers.length; b++) {
    if (ship.lasers[b].explodeTime === 0) {
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[b].x,
        ship.lasers[b].y,
        SHIP_SIZE / 15,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
    } else {
      //draw explosion
      ctx.fillStyle = "orangered";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[b].x,
        ship.lasers[b].y,
        ship.r * 0.75,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
      ctx.fillStyle = "salmon";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[b].x,
        ship.lasers[b].y,
        ship.r * 0.5,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
      ctx.fillStyle = "pink";
      ctx.beginPath();
      ctx.arc(
        ship.lasers[b].x,
        ship.lasers[b].y,
        ship.r * 0.25,
        0,
        Math.PI * 2,
        false
      );
      ctx.fill();
    }
  }

  //draw text for levels
  if (textAlpha >= 0) {
    ctx.textAlign = "center";
    ctx.textbaseLine = "middle";
    ctx.fillStyle = "rgba(225, 225, 225," + textAlpha + ")";
    ctx.font = "small-caps 45px Arial";
    ctx.fillText(text, gameWidth / 2, gameHeight * 0.75);
    textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
  }
  var lifeColour;
  for (var i = 0; i < lives; i++) {
    lifeColour = exploding && lives === i - 1 ? "red" : "white";
    drawShip(
      SHIP_SIZE + i * SHIP_SIZE * 1.2,
      SHIP_SIZE,
      0.5 * Math.PI,
      lifeColour
    );
  }

  //move the lasers

  for (var i = ship.lasers.length - 1; i >= 0; i--) {
    /*check ditance travelled and delete*/
    if (ship.lasers[i].dist > LASER_DIST * gameWidth) {
      ship.lasers.splice(i, 1);
      continue;
    }
    //handle the explosion
    if (ship.lasers[i].explodeTime > 0) {
      ship.lasers[i].explodeTime--;
      //destroy laser after duration is up
      if (ship.lasers[i].explodeTime === 0) {
        ship.lasers.splice(i, 1);
        continue;
      }
    } else {
      //movement
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;

      //distance lasers
      ship.lasers[i].dist += Math.sqrt(
        Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)
      );
    }
    //handle edge of screen

    if (ship.lasers[i].y > gameHeight) {
      ship.lasers[i].y = 0;
    } else if (ship.lasers[i].y < 0) {
      ship.lasers[i].y = gameHeight;
    }
    if (ship.lasers[i].x > gameWidth) {
      ship.lasers[i].x = 0;
    } else if (ship.lasers[i].x < 0) {
      ship.lasers[i].x = gameWidth;
    }
  }

  //move the astroids
  for (var i = 0; i < roids.length; i++) {
    roids[i].x += roids[i].xv;
    roids[i].y += roids[i].yv;

    //edge of screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = gameWidth + roids[i].r;
    }
    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = gameHeight + roids[i].r;
    }
    if (roids[i].y > gameHeight + roids[i].r) {
      roids[i].y = 0 - roids[i].r;
    }
    if (roids[i].x > gameWidth + roids[i].r) {
      roids[i].x = 0 - roids[i].r;
    }
  }
}
