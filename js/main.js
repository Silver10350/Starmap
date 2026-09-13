const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");

import { get_xy, get_radius, get_color, xy_to_azalt, radec_to_azalt,pos_distance,angle_distance} from "./calculs.js";
import jsonData from "../presets/stars.json" with { type: "json" };

let stars = jsonData;
let cam = {az:0, alt:0}
let fov = 60;
let startX=0, startY = 0, newX = 0, newY = 0
let mouse_pos = []
let selectionpos = null
let is_moving = false

let pointers = new Map();
let pinchDistance = null;

function initStars() {
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        [star.az, star.alt] = radec_to_azalt(star.ra, star.dec, 0, 90);
        star.az_rad = star.az * Math.PI / 180;
        star.alt_rad = star.alt * Math.PI / 180;
    }
    updateStarsApp();
    resize();
    updateStarsPos()
}

function updateStarsPos() {
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.should_display) {
            [star.x, star.y] = get_xy(star.az_rad, star.alt_rad, cam, fov, canvas)
        }
        
    }
    drawStars();
}
function updateStarsApp() {
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.radius = get_radius(star.magnitude, fov);
        star.should_display = star.radius > 0.6;
        if (star.should_display) {
            star.draw_color = get_color(star.color, star.magnitude, fov);
            star.name_should_display = star.radius > 4.5;
        }
    }
    drawStars()
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    updateStarsPos();
}

function updateCamera(az, alt) {
    cam.az = (360+az)%360;
    cam.alt = Math.max(Math.min(alt,90),-90);
    updateStarsPos();
}

function updateFov(new_fov) {
    const azalt0 = xy_to_azalt(mouse_pos ,canvas.width, canvas.height, fov, cam.az, cam.alt)
    fov = Math.min(185,Math.max(1,new_fov));
    const azalt1 = xy_to_azalt(mouse_pos,canvas.width, canvas.height, fov, cam.az, cam.alt)
    const new_cam_az = cam.az + azalt0[0] - azalt1[0]
    const new_cam_alt = cam.alt + azalt0[1] - azalt1[1]
    updateStarsApp();
    updateCamera(new_cam_az, new_cam_alt)
    
}

function drawStars() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.should_display && star.x > 0 && star.x < canvas.width && star.y > 0 && star.y < canvas.height) {
            ctx.fillStyle = star.draw_color;
            
            ctx.beginPath();
            ctx.arc(
                star.x,
                star.y,
                star.radius,
                0,
                Math.PI * 2
            );
            
            ctx.fill();
            if (star.name_should_display) {
                ctx.fillStyle = "white";
                ctx.font = "12px Arial";
                ctx.fillText(star.name, star.x + 5, star.y+10);
            }
        }
    }
}

function mouseDownHandler(e) {
    pointers.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY
    });

    if (pointers.size === 1) {
        startX = e.clientX;
        startY = e.clientY;
        is_moving = false;
    }

    canvas.addEventListener("pointermove", mouseMoveHandler);
    canvas.addEventListener("pointerup", mouseUpHandler);
}

function mouseUpHandler(e){

    pointers.delete(e.pointerId);

    if (pointers.size < 2){
        pinchDistance = null;
    }

    if (pointers.size === 0){
        canvas.removeEventListener("pointermove", mouseMoveHandler);
        canvas.removeEventListener("pointerup", mouseUpHandler);
    }
}

function mouseMoveHandler(e){

    if (pointers.has(e.pointerId)) {
        pointers.set(e.pointerId,{
            x:e.clientX,
            y:e.clientY
        });
    }

    // Déplacement
    if (pointers.size === 1){

        if (pos_distance(startX,startY,e.clientX,e.clientY)>10){
            is_moving = true;
        }

        if (is_moving){
            let dx = startX - e.clientX;
            let dy = startY - e.clientY;

            startX = e.clientX;
            startY = e.clientY;

            updateCamera(
                cam.az + dx*(fov/500),
                cam.alt - dy*(fov/500)
            );
        }
    }

    // Zoom
    else if (pointers.size === 2){

        const [p1,p2] = [...pointers.values()];

        const distance = Math.hypot(
            p2.x - p1.x,
            p2.y - p1.y
        );

        if (pinchDistance !== null){
            updateFov(
                fov * pinchDistance / distance
            );
        }

        pinchDistance = distance;
    }
}

function mouseWheelHandler(e){
    updateFov(fov *(1 + e.deltaY/1000))
}
function mousePosHandler(e){
    mouse_pos = [e.clientX,e.clientY]
}
function mouseClickHandler(e){
    if (is_moving== false){
        selectionpos = [e.clientX, e.clientY]
        console.log(selectionpos)
    }
}

canvas.addEventListener("resize", resize);
canvas.addEventListener("pointerdown", mouseDownHandler);
canvas.addEventListener("wheel", mouseWheelHandler)
canvas.addEventListener('pointermove', mousePosHandler) 
canvas.addEventListener("click",mouseClickHandler)


initStars();