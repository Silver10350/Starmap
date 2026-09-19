import { radians, degrees, sin, cos, asin, atan2, atan, sqrt, min } from "./math.js";


export function radec_to_azalt(ra, dec, lst, lat) {
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

function azalt_to_xy(az_rad, alt_rad, cam_az, cam_alt, fov, screen_width, screen_height) {
    const center_az_rad = radians(cam_az)
    const center_alt_rad = radians(cam_alt)
    const width = screen_width
    const height = screen_height
    const az_diff = az_rad - center_az_rad
    const denominator = (1 + sin(center_alt_rad) * sin(alt_rad) + cos(center_alt_rad) * cos(alt_rad) * cos(az_diff))
    if (denominator <= 0) {
        return 'None'
    }
    const screen_scale = Math.min(width, height) /radians(fov)
    const k = 2 / denominator
    const x = width/2 + screen_scale * k * cos(alt_rad) * sin(az_diff)
    const y = height/2 - screen_scale * k * (cos(center_alt_rad)*sin(alt_rad) - sin(center_alt_rad)*cos(alt_rad)*cos(az_diff))
    return [x, y]
}

export function xy_to_azalt(xy, screen_width, screen_height, fov, cam_az,cam_alt) {
    const x = xy[0]
    const y = xy[1]
    const width = screen_width
    const height = screen_height
    const screen_scale = Math.min(width, height) / radians(fov)
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


export function get_color(color, mag, fov) {
    const m0 = 10;
    const maxMagnitude = m0 + 4 * Math.log10(60/fov);
    const L1 =  1 - (mag / maxMagnitude/1.2);
    return color_to_hex(color, L1)
}

export function get_radius(m, fov) {
    const r0 = 6;
    const radius = r0 * Math.pow(10, -m / 8) * Math.pow(60/fov, 0.5);
    return Math.min(radius,5)
}

export function get_xy(az, alt, cam, fov, canvas) {
    const width = canvas.width;
    const height = canvas.height;
    return azalt_to_xy(az, alt, cam.az, cam.alt, fov, width, height)
}

function get_angle_distance(az1, alt1, az2, alt2) {
    const az1_rad = radians(az1);
    const alt1_rad = radians(alt1);
    const az2_rad = radians(az2);
    const alt2_rad = radians(alt2);
    const angle_distance = Math.acos(sin(alt1_rad) * sin(alt2_rad) + cos(alt1_rad) * cos(alt2_rad) * cos(az2_rad - az1_rad));
    return degrees(angle_distance);
}

export function is_star_in_fov(az, alt, cam, fov) {
    if (get_angle_distance(az, alt, cam.az, cam.alt) > fov/2) {
        return false;
    }
    return true;
}
export function pos_distance(x1,y1,x2,y2) {
    return Math.sqrt((x1-x2)**2+(y1-y2)**2)
}
export function angle_distance(az1,alt1,az2,alt2) {
    return degrees(Math.acos(sin(radians(alt1))*sin(radians(alt2))+cos(radians(alt1))*cos(radians(alt2))*cos(radians(az2-az1))))
}

export function deg_to_hms(ra){
    ///Convertit des degrés en (heures, minutes, secondes).

    ra /= 15

    const h = Math.floor(ra)
    const m = Math.floor((ra - h) * 60)
    const s = (ra - h - m / 60) * 3600

    return [h, m, Math.round(s*10)/10]
}

export function deg_to_dms(dec){
    //Convertit des degrés en (degrés, minutes, secondes).
    let sign = ""
    if (dec < 0){sign = "-"}
    else{sign = "+"}
    
    dec = Math.abs(dec)

    const d = Math.floor(dec)
    const m = Math.floor((dec - d) * 60)
    const s = (dec - d - m / 60) * 3600

    return [sign, d, m, Math.round(s*10)/10]
}

export function updateLST(longitude){
    const now = new Date();
    
    // 1. Calculate Julian Date (JD)
    // Convert to milliseconds since 1970-01-01 UTC
    const timeMs = now.getTime(); 
    // Julian Date at 1970-01-01 12:00:00 UTC is 2440587.5
    let jd = (timeMs / 86400000) + 2440587.5;
    
    // 2. Calculate T (centuries since J2000.0)
    const T = (jd - 2451545.0) / 36525.0;
    
    // 3. Calculate Greenwich Mean Sidereal Time (GMST) in degrees
    // Standard Meeus formula: 280.46061837 + 360.98564736629 * (JD - 2451545) + ...
    let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * Math.pow(T, 2) - Math.pow(T, 3) / 38710000.0;
    
    // 4. Calculate Local Mean Sidereal Time (LMST / LST)
    // Add longitude: East longitude is positive (+), West longitude is negative (-)
    let lstDegrees = gmst + longitude;
    
    // 5. Reduce to a 0-360 degree range
    lstDegrees = lstDegrees % 360;
    if (lstDegrees < 0) {
        lstDegrees += 360;
    }

    return lstDegrees
}