import { radians, degrees, sin, cos, asin, atan2, atan, sqrt, min } from "./math.js";


function radec_to_azalt(ra, dec, lst, lat) {
    // Angle horaire
    const H = radians((lst - ra) % 360)
    const dec_rad = radians(dec)
    const lat_rad = radians(lat)
    // Altitude
    const alt = asin(sin(dec_rad) * sin(lat_rad) + cos(dec_rad) * cos(lat_rad) * cos(H))

    // Azimut
    const az = atan2(-cos(dec_rad) * sin(H), sin(dec_rad) * cos(lat_rad) - cos(dec_rad) * sin(lat_rad) * cos(H))

    const azalt = (degrees(az) + 360) % 360
    const alt_deg = degrees(alt)
    return [azalt, alt_deg]
}

function azalt_to_xy(az, alt, cam_az, cam_alt, scale, screen_width, screen_height) {
    const az_rad = radians(az)
    const alt_rad = radians(alt)
    const center_az_rad = radians(cam_az)
    const center_alt_rad = radians(cam_alt)
    const width = screen_width
    const height = screen_height
    const az_diff = az_rad - center_az_rad
    const denominator = (1 + sin(center_alt_rad) * sin(alt_rad) + cos(center_alt_rad) * cos(alt_rad) * cos(az_diff))
    if (denominator <= 0) {
        return 'None'
    }
    const screen_scale = min(width, height) * scale
    const k = 2 / denominator
    const x = width/2 + screen_scale * k * cos(alt_rad) * sin(az_diff)
    const y = height/2 - screen_scale * k * (cos(center_alt_rad)*sin(alt_rad) - sin(center_alt_rad)*cos(alt_rad)*cos(az_diff))
    return [x, y]
}

export function xy_to_azalt(xy, screen_width, screen_height, scale, cam_az,cam_alt) {
    const x = xy[0]
    const y = xy[1]
    const width = screen_width
    const height = screen_height
    const screen_scale = Math.min(width, height) * scale
    // Coordonnées normalisées
    const X = (x - width / 2) / screen_scale
    const Y = -(y - height / 2) / screen_scale
    // Distance au centre
    const rho = sqrt(X * X + Y * Y)
    if (rho == 0) {
        return [cam_az, cam_alt]
    }
    // Angle central
    const c = 2 * atan(rho / 2)
    const center_az = radians(cam_az)
    const center_alt = radians(cam_alt)
    const alt = asin(cos(c) * sin(center_alt) + (Y * sin(c) * cos(center_alt)) / rho)
    const az = center_az + atan2(X * sin(c), rho * cos(center_alt) * cos(c) - Y * sin(center_alt) * sin(c))
    const az_deg = (degrees(az) + 360) % 360
    const alt_deg = degrees(alt)
    return [az_deg, alt_deg]
}
function color_to_hex(color, L) {
    const r = Math.max(0, Math.min(255, Math.round(L*(color[0] * 255 * 0.4 + 255 * (1 - 0.4)))));
    const g = Math.max(0, Math.min(255, Math.round(L*(color[1] * 255 * 0.4 + 255 * (1 - 0.4)))));
    const b = Math.max(0, Math.min(255, Math.round(L*(color[2] * 255 * 0.4 + 255 * (1 - 0.4)))));
    return `rgb(${r}, ${g}, ${b})`;
}

function mag_to_radius(m,scale) {
    const r0 = 6;
    const radius = r0 * Math.pow(10, -m / 6) * Math.pow(scale, 0.5);
    return Math.min(radius,5)
}

export function generate_stars(stars, width, height, lst, lat, cam_az, cam_alt, scale) {
    const stars_pos_list = []
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const radius =  mag_to_radius(star.magnitude,scale)
        const m0 = 6;
        const maxMagnitude = m0 + 5 * Math.log10(scale);
    
        const L1 =  1 - (star.magnitude / maxMagnitude/1.2);
        if (star.magnitude < maxMagnitude) {
            const azalt = radec_to_azalt(star.ra, star.dec, lst, lat);
            const xy = azalt_to_xy(azalt[0], azalt[1], cam_az, cam_alt, scale, width, height);
            const name_should_display = star.magnitude < maxMagnitude -6
            stars_pos_list.push({"x": xy[0], "y": xy[1], "name": star.name, "color": color_to_hex(star.color, L1), "radius": radius, "name_should_display": name_should_display});
        }
    }
    return stars_pos_list
}