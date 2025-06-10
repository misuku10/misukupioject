const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const socket = io();

const worldWidth = 3000;
const worldHeight = 3000;

const player = {
    x: worldWidth / 2,
    y: worldHeight / 2,
    size: 64,
    speed: 4,
    img: new Image(),
    username: ''
};

player.img.src = '/static/goose.png';

const players = {};
const keys = {};

document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

let camX = player.x - window.innerWidth / 2;
let camY = player.y - window.innerHeight / 2;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

function update() {
    if (keys['w'] || keys['arrowup']) player.y -= player.speed;
    if (keys['s'] || keys['arrowdown']) player.y += player.speed;
    if (keys['a'] || keys['arrowleft']) player.x -= player.speed;
    if (keys['d'] || keys['arrowright']) player.x += player.speed;

    player.x = Math.max(0, Math.min(worldWidth, player.x));
    player.y = Math.max(0, Math.min(worldHeight, player.y));

    socket.emit('move', { x: player.x, y: player.y });

    const targetCamX = player.x - canvas.width / 2;
    const targetCamY = player.y - canvas.height / 2;

    const lerpFactor = 0.1;
    camX += (targetCamX - camX) * lerpFactor;
    camY += (targetCamY - camY) * lerpFactor;
}

function drawGrid() {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= worldWidth; x += 200) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, worldHeight);
        ctx.stroke();
    }
    for (let y = 0; y <= worldHeight; y += 200) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(worldWidth, y);
        ctx.stroke();
    }
}

function drawPlayers() {
    for (const p of Object.values(players)) {
        const screenX = p.x - camX;
        const screenY = p.y - camY;

        if (
            screenX + player.size < 0 ||
            screenX - player.size > canvas.width ||
            screenY + player.size < 0 ||
            screenY - player.size > canvas.height
        ) {
            continue;
        }

        ctx.drawImage(player.img, p.x - player.size / 2, p.y - player.size / 2, player.size, player.size);

        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.username, p.x, p.y - player.size / 2 - 10);
    }
}

function drawMiniMap() {
    const miniMapSize = 200;
    const padding = 20;

    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#222';
    ctx.fillRect(canvas.width - miniMapSize - padding, canvas.height - miniMapSize - padding, miniMapSize, miniMapSize);

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width - miniMapSize - padding, canvas.height - miniMapSize - padding, miniMapSize, miniMapSize);

    const scaleX = miniMapSize / worldWidth;
    const scaleY = miniMapSize / worldHeight;

    for (const p of Object.values(players)) {
        const miniX = canvas.width - miniMapSize - padding + p.x * scaleX;
        const miniY = canvas.height - miniMapSize - padding + p.y * scaleY;

        if (p.username === player.username) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(miniX, miniY, 6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const screenX = p.x - camX;
            const screenY = p.y - camY;
            if (
                screenX + player.size >= 0 &&
                screenX - player.size <= canvas.width &&
                screenY + player.size >= 0 &&
                screenY - player.size <= canvas.height
            ) {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(miniX, miniY, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    ctx.restore();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camX, -camY);

    ctx.fillStyle = '#def';
    ctx.fillRect(0, 0, worldWidth, worldHeight);

    drawGrid();
    drawPlayers();

    ctx.restore();

    drawMiniMap();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

socket.on('connect', () => {
    player.username = username;
    socket.emit('new_player', { username: player.username });
});

socket.on('players_update', data => {
    Object.assign(players, data);
});

window.addEventListener('load', () => {
    document.body.focus();
    gameLoop();
});
