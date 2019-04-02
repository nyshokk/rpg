let express = require('express');
let http = require('http');
let path = require('path');
let socketIO = require('socket.io');
let app = express();
let server = http.Server(app);
let io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
app.use('/css', express.static(__dirname + '/css'));

app.get('/', function (request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function () {
    console.log('Запускаю сервер на порте 5000');
});

let i = 0;
let newGame;
io.on('connection', function (socket) {
    if (i == 0)
        newGame = new Game(socket);
    i++;
    //newGame.generate();
    newGame.newPlayer(socket);
    newGame.loadMap(socket);


    socket.on('updatePlayerPos', function (obj) {
        newGame.players[socket.id].update(obj);
    });
    socket.on('updateInfo', function (obj) {
        newGame.players[socket.id].clientH = obj.clientH;
        newGame.players[socket.id].clientW = obj.clientW;
    });

    socket.on('shoot', function () {
        newGame.players[socket.id].shoot();
    });

    socket.on('LookAt', function (obj) {
        newGame.players[socket.id].btn_hold = obj.btn_hold;
        newGame.players[socket.id].Cursor.x = obj.Cursor.x;
        newGame.players[socket.id].Cursor.y = obj.Cursor.y;
    });


    socket.on('disconnect', _ => {
        newGame.deletePlayer(socket.id);
    });
});


let rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;


class Game {
    constructor(socket) {
        this.socket = socket;
        this.id_monster = 0;
        this.id_bullet = 0;
        this.monstersCount = 5;
        this.bullets = [];
        this.monsters = [];
        this.players = {};
        this.loop();
    }

    loop() {
        setInterval(_ => {
            this.generate();
            this.update();
        }, 1000 / 50);
    }

    newPlayer(socket) {
        this.players[socket.id] = new Player(this, socket);
    }

    deletePlayer(id) {
        delete this.players[id];
        io.sockets.emit('delete_player', {id: id});
    }

    generate() {
        if (this.monsters.length < this.monstersCount) {
            this.monsters.push(new Monster(this));
            this.id_monster++;
        }
    }

    update() {
        this.bullets.forEach(el => {
            el.update();
            el.draw();
        });
        this.monsters.forEach(el => {
            el.walk();
            io.sockets.emit('update_monsters', {id: el.id, pos: el.pos.x, lng: this.monsters.length});
        });
        for (let p in this.players) {
            if (this.players[p].btn_hold) {
                this.players[p].LookAtMouse();
            }
        }
    }

    loadMap(socket) {
        this.monsters.forEach(el => {
            socket.emit('create_monster', {id: el.id, type: el.MonsetType, pos: el.pos.x, lng: this.monsters.length})
        });

        this.bullets.forEach(el => {
            socket.emit('create_bullet', {
                id: el.id,
                angle: el.angle,
                bullet_pos: {x: el.bullet_pos.x, y: el.bullet_pos.y},
                bullet_to: {x: el.bullet_to.x, y: el.bullet_to.y}
            });
        });

        for (let p in this.players) {
            if (this.players[p].id !== socket.id) {
                socket.emit('create_player', {
                    id: this.players[p].id,
                    pos: {x: this.players[p].pos.x, y: this.players[p].pos.y}
                });
            }
        }
    }
}

class Player {
    constructor(game, socket) {
        this.id = socket.id;
        this.clientH = 0;
        this.clientW = 0;
        this.Cursor = {
            x: 0,
            y: 0
        };
        this.movement = {
            left: false,
            right: false
        };
        this.game = game;
        this.isJump = false;
        this.HP = 100;
        this.MP = 100;
        this.Speed = 15;
        this.angle = 0;
        this.pos = {
            x: 120,
            y: 128,
            hand: 243
        };

        io.sockets.emit('create_player', {id: this.id, pos: {x: this.pos.x, y: this.pos.y}});
        //io.sockets.emit('update_player',{id:this.id});

    }

    // jump() {
    //     if (this.isJump == false) {
    //         this.isJump = true;
    //         this.pos.y += 20;
    //         this.pos.hand += 20;
    //         setTimeout(_ => {
    //             this.isJump = false;
    //         }, 800);
    //     }
    // }
    //
    update(obj) {
        if (obj.left)
            this.pos.x += this.Speed;
        if (obj.right)
            this.pos.x -= this.Speed;

        io.sockets.emit('update_player', {
            id: this.id,
            pos: {x: this.pos.x, y: this.pos.y},
            angle: this.angle,
            Cursor: {x: this.Cursor.x, y: this.Cursor.y},
            HP: this.HP,
            MP: this.MP
        })
        // if (this.HP < 100)
        //     this.HP += 1 / 100;
        // if (this.MP < 100)
        //     this.MP += 1 / 100;
        // if (this.HP < 0)
        //     this.HP = 0;
        // if (this.MP < 0)
        //     this.MP = 0;

    }

    //
    shoot() {
        //     let audio = new Audio();
        //     audio.src = "js/sounds/arrow.wav";
        //     audio.autoplay = true;
        //
        this.game.bullets.push(new Bullet(this.game, this));
        this.MP--;
    }

    //
    LookAtMouse() {
        let ac = Math.abs(this.pos.x - this.Cursor.x);

        let bc = Math.abs(this.pos.hand - (this.clientH - this.Cursor.y));
        let ab = Math.sqrt(Math.pow(ac, 2) + Math.pow(bc, 2));
        let rad = ac / ab;

        if ((this.clientH - this.Cursor.y) > this.pos.hand)
            this.angle = Math.acos(rad) * 180 / Math.PI;
        else
            this.angle = -Math.acos(rad) * 180 / Math.PI;


        // if ((CleintH - this.Cursor.y) > this.pos.hand) {
        //     qs('.player_arm').style.transform = `rotateZ(${this.angle + 90}deg)`;
        //
        // } else {
        //     qs('.player_arm').style.transform = `rotateZ(${this.angle + 90}deg)`;
        //
        // }
        // if (this.pos.x > this.game.Cursor.x)
        //     qs('.player_arm').style.transform = `rotateZ(${-(this.angle + 90)}deg)`;
    }
}

class Bullet {
    constructor(game, player) {
        this.game = game;
        this.id = game.id_bullet;
        this.player = player;
        this.angle = this.player.angle;

        this.bullet_pos =
            {
                x: this.player.pos.x + 60,
                y: this.player.pos.hand - 30
            };

        this.bullet_to =
            {
                x: this.player.Cursor.x,
                y: this.player.clientH - this.player.Cursor.y
            };


        this.speed =
            {
                x: (this.player.Cursor.x - this.bullet_pos.x) / 50,
                y: (this.player.clientH - this.player.Cursor.y - this.bullet_pos.y) / 50
            };


        io.sockets.emit('create_bullet', {
            id: this.id,
            angle: this.angle,
            bullet_pos: {x: this.bullet_pos.x, y: this.bullet_pos.y},
            bullet_to: {x: this.bullet_to.x, y: this.bullet_to.y}
        });
        this.game.id_bullet++;
    }

    check() {
        this.game.monsters.some(el => {
            if (this.bullet_pos.x >= (this.player.clientW - el.pos.x - 128) &&
                (this.bullet_pos.y > 100 && this.bullet_pos.y < el.pos.y + 178.965)) {
                io.sockets.emit('delete_monster', {id: el.id});
                this.game.monsters.splice(this.game.monsters.indexOf(el), 1);
                io.sockets.emit('delete_bullet', {id: this.id});
                this.game.bullets.splice(this.game.bullets.indexOf(this), 1);
                //this.game.score++;
                return true;
            }
        })
    }


    update() {
        this.check();
        if (Math.round(this.bullet_pos.x) >= this.player.clientW - 110 ||
            Math.round(this.bullet_pos.x) <= 0 ||
            Math.round(this.bullet_pos.y) >= this.player.clientH ||
            Math.round(this.bullet_pos.y) <= 15
        ) {
            io.sockets.emit('delete_bullet', {id: this.id});
            //this.bullet.remove();
            this.game.bullets.splice(this.game.bullets.indexOf(this), 1);
        } else {
            this.bullet_pos.x += this.speed.x;
            this.bullet_pos.y += this.speed.y;
        }
    }

    draw() {
        io.sockets.emit('update_bullet', {
            id: this.id,
            angle: this.angle,
            bullet_pos: {x: this.bullet_pos.x, y: this.bullet_pos.y}
        });
        //
        // this.bullet.style.left = `${this.bullet_pos.x}px`;
        // this.bullet.style.bottom = `${this.bullet_pos.y}px`;
    }
}


class Monster {
    constructor(game) {
        this.id = game.id_monster;
        this.game = game;
        this.HP = 100;
        this.ReadyForAttack = true;
        this.attackspeed = 2;
        this.pos = {
            x: rnd(30, 400),
            y: 128
        };
        this.Speed = 10;
        this.MonsetType = rnd(0, 2);

        switch (this.MonsetType) {
            case 0: {
                this.MonsetType = "zombie";
                break;
            }
            case 1: {
                this.MonsetType = "skeleton";
                break;
            }
            case 2: {
                this.MonsetType = "alien";
                break;
            }
        }


        io.sockets.emit('create_monster', {
            id: this.id,
            type: this.MonsetType,
            pos: this.pos.x,
            lng: this.game.monsters.length
        });
        //this.game.socket.emit('create_zombie', {type: this.MonsetType, id: this.id});
    }

    walk() {
        this.pos.x += .2;
    }
}





