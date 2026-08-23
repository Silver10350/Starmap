const canvas = document.getElementById("sky");
const ctx = canvas.getContext("2d");


import { generate_stars } from "./calculs.js";
import jsonData from "../pressets/stars.json" with { type: "json" };

let stars = [];
let cam_az = 0;
let cam_alt = 0;
let scale = 1;
let startX=0, startY = 0, newX = 0, newY = 0

function updateStars() {
    stars = generate_stars(
        jsonData,
        canvas.width,
        canvas.height,
        0, 90, cam_az, cam_alt, scale
    );
    drawStars();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    updateStars();
}

function updateCamera(az, alt) {
    cam_az = (360+az)%360;
    cam_alt = Math.max(Math.min(alt,90),-90);
    updateStars();
}

function updateScale(new_scale) {
    scale = Math.min(200,Math.max(0.4,new_scale));
    updateStars();
}

function drawStars() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.x > 0, star.x < canvas.width, star.y > 0, star.y < canvas.height) {
            ctx.fillStyle = star.color;

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
                ctx.fillText(star.name, star.x + 5, star.y);
            }
        }
    }
}

function mouseDownHandler(e) {
    
    startX = e.clientX
    startY = e.clientY
    window.addEventListener("mousemove", mouseMoveHandler);
    window.addEventListener("mouseup", mouseUpHandler);
}

function mouseUpHandler(e) {
    window.removeEventListener("mousemove", mouseMoveHandler)
}

function mouseMoveHandler(e) {
    newX = startX - e.clientX
    newY = startY - e.clientY
    startX = e.clientX
    startY = e.clientY
    let new_az = cam_az + newX/(scale*10)
    let new_alt = cam_alt - newY/(scale*10)
    updateCamera(new_az,new_alt)
}

function mouseWheelHandler(e){
    updateScale(scale*(1-e.deltaY/1000))
}

window.addEventListener("resize", resize);
window.addEventListener("mousedown", mouseDownHandler);
window.addEventListener("wheel", mouseWheelHandler)

resize();