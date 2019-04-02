var socket = io();

let movement = {
    left: false,
    right: false
};
let monsters = {};
let players = {};
let bullets = {};

let qs = el => document.querySelector(el);
let rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
let poly = qs('.poly');

socket.on('create_monster', function (el) {
    let monster = document.createElement('div');
    let monster_head = document.createElement('div');
    let monster_body = document.createElement('div');
    let monster_arm = document.createElement('div');
    let monster_second_arm = document.createElement('div');
    let monster_leg = document.createElement('div');
    let monster_second_leg = document.createElement('div');
    monster.classList.add('monster');
    monster_head.classList.add('monster_head');
    monster_body.classList.add('monster_body');
    monster_arm.classList.add('monster_arm');
    monster_second_arm.classList.add('monster_second_arm');
    monster_leg.classList.add('monster_leg');
    monster_second_leg.classList.add('monster_second_leg');
    monster_head.style.background = `url("css/monsters/${el.type}/${el.type}_head.png")`;
    monster_body.style.background = `url("css/monsters/${el.type}/${el.type}_body.png")`;
    monster_arm.style.background = `url("css/monsters/${el.type}/${el.type}_arm.png")`;
    monster_second_arm.style.background = `url("css/monsters/${el.type}/${el.type}_arm.png")`;
    monster_leg.style.background = `url("css/monsters/${el.type}/${el.type}_leg.png")`;
    monster_second_leg.style.background = `url("css/monsters/${el.type}/${el.type}_leg.png")`;
    monster.style.right = `${el.pos}px`;
    monster.style.bottom = `${128}px`;
    monster.append(monster_head, monster_body, monster_arm, monster_second_arm, monster_leg, monster_second_leg);
    poly.appendChild(monster);
    monsters[el.id] = monster;
    // socket.emit('created',monster);
});


socket.on('create_player', function (el) {
    let player = document.createElement('div');
    let player_stats = document.createElement('div');
    let stats_healt = document.createElement('div');
    let stats_mana = document.createElement('div');
    let player_head = document.createElement('div');
    let player_body = document.createElement('div');
    let player_arm = document.createElement('div');
    let player_weapon = document.createElement('div');
    let player_leg = document.createElement('div');
    let id = el.id;
    player.classList.add('player');
    player_stats.classList.add('stats');
    stats_healt.classList.add('health');
    stats_mana.classList.add('mana');
    player_head.classList.add('player_head');
    player_body.classList.add('player_body');
    player_arm.classList.add('player_arm');
    player_weapon.classList.add('weapon');
    player_leg.classList.add('player_leg');
    player_head.style.background = `url("css/player/male_head.png")`;
    player_body.style.background = `url("css/player/male_body.png")`;
    player_arm.style.background = `url("css/player/male_arm.png")`;
    player_weapon.style.background = `url("css/bow.png")`;
    player_leg.style.background = `url("css/player/male_leg.png")`;
    player.style.left = `${el.pos.x}px`;
    player.style.bottom = `${el.pos.y}px`;
    player_stats.append(stats_healt, stats_mana);
    player_arm.appendChild(player_weapon);
    player.append(player_stats, player_head, player_body, player_arm, player_leg);
    poly.appendChild(player);
    players[id] = player;
});

// requestAnimationFrame(_=>{
//
// });


socket.on('update_player', function (obj) {

    players[obj.id].style.left = `${obj.pos.x}px`;
    players[obj.id].style.bottom = `${obj.pos.y}px`;

    if ((document.documentElement.clientHeight - obj.Cursor.y) > 243) {
        players[obj.id].querySelector('.player_arm').style.transform = `rotateZ(${obj.angle + 90}deg)`;

    } else {
        players[obj.id].querySelector('.player_arm').style.transform = `rotateZ(${obj.angle + 90}deg)`;

    }
    if (obj.pos.x > obj.Cursor.x)
        players[obj.id].querySelector('.player_arm').style.transform = `rotateZ(${-(obj.angle + 90)}deg)`;


    players[obj.id].querySelector('.player .stats .health').style.width = `${obj.HP}px`;
    players[obj.id].querySelector('.player .stats .health').innerText = `${Math.round(obj.HP)}`;
    players[obj.id].querySelector('.player .stats .mana').innerText = `${Math.round(obj.MP)}`;
    players[obj.id].querySelector('.player .stats .mana').style.width = `${obj.MP}px`;
});


socket.on('create_bullet', function (obj) {
    let bullet = document.createElement('div');
    bullet.classList.add('ball');
    if (obj.bullet_pos.x < obj.bullet_to.x) {
        bullet.style.transform = `rotateZ(${47 - obj.angle}deg)`;
    } else {
        bullet.style.transform = `rotateZ(${180 + (47 + obj.angle)}deg)`;
    }

    bullets[obj.id] = bullet;
    poly.appendChild(bullets[obj.id]);

});

socket.on('update_bullet', function (obj) {
    bullets[obj.id].style.left = `${obj.bullet_pos.x}px`;
    bullets[obj.id].style.bottom = `${obj.bullet_pos.y}px`;
});

socket.on('delete_bullet', function (obj) {
    bullets[obj.id].remove();
});

socket.on('update_monsters', function (obj) {
    monsters[obj.id].style.right = `${obj.pos}px`;
});

socket.on('delete_monster', function (obj) {
    monsters[obj.id].remove();
});

socket.on('delete_player', function (obj) {
    if (players[obj.id]) {
        players[obj.id].remove();
    }
    //delete players[obj.id];
});


document.onmousedown = function (ell) {
    let listener = function (el) {
        socket.emit('LookAt', {btn_hold: true, Cursor: {x: el.clientX, y: el.clientY}});
    };

    if (ell.button == 2) {
        qs('body').style.cursor = "url(css/crosshair.png), crosshair";
        socket.emit('LookAt', {btn_hold: true, Cursor: {x: ell.clientX, y: ell.clientY}});
        addEventListener("mousemove", listener);
        document.onmouseup = function (elt) {
            if (elt.button == 2) {
                socket.emit('LookAt', {btn_hold: false, Cursor: {x: ell.clientX, y: ell.clientY}});
                removeEventListener("mousemove", listener);
                qs('body').style.cursor = "url(css/sword.png), default";
                document.onmousemove = function () {
                };
            }
        };
    }
    if (ell.button == 0) {
        // if (Math.round(newGame.MyPlayer.MP) > 0) {
        //     newGame.MyPlayer.shoot();
        socket.emit('shoot');
        // }
    }
};


addEventListener("keydown", el => {
    switch (el.keyCode) {
        case 65: {
            movement.right = true;
            break;
        }
        case 68: {
            movement.left = true;
            break;
        }
    }
});

addEventListener("keyup", el => {
    switch (el.keyCode) {
        // case 49: {
        //     newGame.AirSkill();
        //     break;
        // }
        case 65: {
            movement.right = false;
            break;
        }
        case 68: {
            movement.left = false;
            break;
        }
        // case 32: {
        //     newGame.MyPlayer.jump();
        //     break;
        // }
    }
});

setInterval(_ => {
    socket.emit('updatePlayerPos', movement);
    socket.emit('updateInfo', {
        clientH: document.documentElement.clientHeight,
        clientW: document.documentElement.clientWidth
    })
}, 1000 / 50);