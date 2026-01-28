import {Vec2, Vec3, Mat4, div, add, mul, Transform, matmul, cross} from "./vec.js";
import {perspective, lookAt, toYawPitch, fromYawPitch, forwardDirection} from "./3d.js";
import {boxMesh, gridMesh} from "./meshes.js"

/** @type {HTMLCanvasElement} */
let canvas = document.getElementById('mycanvas');
let ctx = canvas.getContext('2d');


function clear() {
    ctx.fillStyle = '#101010';
    ctx.fillRect(0, 0, 1280, 720);
}

/**
 * @param p1 {Vec2}
 * @param p2 {Vec2}
 * @param color {string}
 * @param width {number}
 */
function drawLine(p1, p2, color = 'red', width = 2) {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.closePath();
}

/**
 * @param p {Vec2}
 */
function drawPoint(p) {
    ctx.fillStyle = 'red';
    ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
}

/**
 * @param ndc {Vec3}
 * @return {Vec2}
 */
function toScreen(ndc) {
    return new Vec2(
        (ndc.x * 0.5 + 0.5) * 1280,
        (1 - (ndc.y * 0.5 + 0.5)) * 720,
    );
}

function radians(deg) {
    return deg / 180 * Math.PI;
}

let cam_pos = new Vec3(10, 5, 10);
let cam_target = new Vec3(0, .5, 0);
let cam_up = new Vec3(0, 1, 0);

let proj = perspective(radians(60), 1280 / 720, 0.1, 1000.0);
let view = lookAt(cam_pos, cam_target, cam_up);

let {yaw, pitch} = toYawPitch(cam_pos, cam_target)
let sensitivity = 0.001;

canvas.addEventListener("click", async () => {
    await canvas.requestPointerLock({
        unadjustedMovement: true,
    });
});

canvas.addEventListener('mousemove', ev => {
    if (!document.pointerLockElement) return;
    yaw += ev.movementX * sensitivity;
    pitch += ev.movementY * -sensitivity;
    cam_target = fromYawPitch(yaw, pitch, cam_pos);
    view = lookAt(cam_pos, cam_target, new Vec3(0, 1, 0));
});

let keys = {w: false, a: false, s: false, d: false, shift: false};
document.addEventListener('keydown', ev => {
    keys[ev.key.toLocaleLowerCase()] = true;
    keys['shift'] = ev.shiftKey;
});
document.addEventListener('keyup', ev => {
    keys[ev.key.toLocaleLowerCase()] = false;
    keys['shift'] = ev.shiftKey;
});

/**
 * @param mvp {Mat4}
 * @param v {Vec3}
 * @return {Vec2|null}
 */
function worldToScreen(mvp, v) {
    let clip = matmul(mvp, v.vec4());
    if (clip.w <= 0.000001) {
        return null;
    }
    let ndc = div(clip.vec3(), clip.w);
    return toScreen(ndc);
}

let angle = 0;


let preparedObjects = [];


function mulberry32(seed) {
    // from chatgpt
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const random = mulberry32(1234);

function rand(a, b) {
    return random() * (b - a) + a;
}

for (let i = 0; i < 30; i++) {
    const model = new Transform()
        .withTranslation(rand(-30, 30), rand(-20, 20), rand(-30, 30))
        .withScaling(rand(0.5, 3.5), rand(0.5, 3.5), rand(0.5, 3.5))
        .withRotation([rand(0, 1), rand(0, 1), rand(0, 1)], random() * Math.PI * 2);

    preparedObjects.push({
        model: model,
        color: '#00ff00',
    });
}

function update(delta) {
    // update player movement
    let inputDir = new Vec2(keys["d"] - keys["a"], keys["w"] - keys["s"]);
    if (inputDir.lengthSquared() > 0) {
        inputDir = inputDir.normalized();
        let forward = forwardDirection(yaw, pitch);
        let right = cross(forward, cam_up);
        let move = add(mul(forward, inputDir.y), mul(right, inputDir.x));
        if (move.lengthSquared() > 0) {
            move = move.normalized();
            let speed = 25.0;
            let fast_multiplier = 5.0;
            cam_pos = add(
                cam_pos,
                mul(move, speed * (keys.shift ? fast_multiplier : 1) * delta)
            );

            view = lookAt(cam_pos, add(cam_pos, forward), cam_up);
        }
    }


    clear();

    // draw grid first
    const gridModel = new Transform()
        .withScaling(3, 1, 3)
        .withTranslation(0, -1, 0);
    const gridMvp = matmul(proj, matmul(view, gridModel));

    gridMesh.faces.forEach(face => {
        for (let f = 0; f < face.length; f++) {
            let p1 = worldToScreen(gridMvp, gridMesh.points[face[f]]);
            let p2 = worldToScreen(gridMvp, gridMesh.points[face[(f + 1) % face.length]]);
            if (p1 !== null && p2 !== null) {
                drawLine(p1, p2, '#808080', 1);
            }
        }
    });

    // then draw boxes on top.
    angle += radians((90 * delta) % 360);
    const model = new Transform()
        .withTranslation(-2, 0, 0)
        .withRotation([0, 1, 0], angle);
    const model2 = new Transform()
        .withTranslation(2, 1, 0)
        .withRotation([0, 1, 0], -angle)
        .withScaling(1, 2, 1);

    let objects = [
        {model: model, color: '#ff0000'},
        {model: model2, color: '#0000ff'},
        ...preparedObjects,
    ];

    boxMesh.faces.forEach(face => {
        for (let f = 0; f < face.length; f++) {
            objects.forEach(obj => {
                const mvp = matmul(proj, matmul(view, obj.model));
                let p1 = worldToScreen(mvp, boxMesh.points[face[f]]);
                let p2 = worldToScreen(mvp, boxMesh.points[face[(f + 1) % face.length]]);
                if (p1 !== null && p2 !== null) {
                    drawLine(p1, p2, obj.color);
                }
            });
        }
    });
}


(function (updateFunc) {
    let lastFrame = null;

    function _wrapper(time) {
        if (lastFrame === null) {
            lastFrame = time;
        }

        let delta = (time - lastFrame) / 1000.0;
        lastFrame = time;

        try {
            updateFunc(delta);
        } finally {
            window.requestAnimationFrame(_wrapper);
        }
    }

    window.requestAnimationFrame(_wrapper);
})(update);
