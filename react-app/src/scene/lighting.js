import * as THREE from "three";

export const STUDIO_LIGHT_PRESETS = {
  softbox: {
    exposure: 1.05,
    environmentIntensity: 0.95,
    keyLight: 2.0,
    fillLight: 0.95,
    rimLight: 0.45,
    topSoftbox: 2.8,
    spotLight: 0.55,
    pointLight: 0.18
  },
  jewelry: {
    exposure: 1.18,
    environmentIntensity: 0.7,
    keyLight: 3.2,
    fillLight: 0.3,
    rimLight: 1.05,
    topSoftbox: 3.6,
    spotLight: 1.65,
    pointLight: 0.45
  },
  automotive: {
    exposure: 0.98,
    environmentIntensity: 0.52,
    keyLight: 2.65,
    fillLight: 0.22,
    rimLight: 1.8,
    topSoftbox: 1.25,
    spotLight: 1.85,
    pointLight: 0.22
  },
  interior: {
    exposure: 1.0,
    environmentIntensity: 0.82,
    keyLight: 1.75,
    fillLight: 0.78,
    rimLight: 0.42,
    topSoftbox: 1.9,
    spotLight: 0.4,
    pointLight: 0.38
  },
  dramatic: {
    exposure: 0.86,
    environmentIntensity: 0.36,
    keyLight: 1.85,
    fillLight: 0.12,
    rimLight: 1.55,
    topSoftbox: 0.72,
    spotLight: 2.3,
    pointLight: 0.12
  }
};

export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function monthToDayOfYear(month) {
  const days = [0, 15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349];
  return days[Math.min(12, Math.max(1, Math.round(month)))] || 166;
}

export function kelvinToColor(kelvin) {
  const temp = clamp(kelvin, 2000, 12000) / 100;
  let r;
  let g;
  let b;

  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    b = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    b = 255;
  }

  const color = new THREE.Color(
    clamp01(r / 255),
    clamp01(g / 255),
    clamp01(b / 255)
  );
  return color;
}

export function getSolarState({ hour = 12, month = 6, latitude = 37.5 }) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const dayOfYear = monthToDayOfYear(month);
  const declination = THREE.MathUtils.degToRad(23.44 * Math.sin(THREE.MathUtils.degToRad((360 / 365) * (284 + dayOfYear))));
  const solarHour = hour;
  const hourAngle = THREE.MathUtils.degToRad(15 * (solarHour - 12));

  const sinAlt =
    Math.sin(lat) * Math.sin(declination) +
    Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
  const altitude = Math.asin(clamp(sinAlt, -1, 1));

  const cosAz =
    (Math.sin(declination) - Math.sin(lat) * Math.sin(altitude)) /
    (Math.cos(lat) * Math.cos(altitude) || 1);
  let azimuth = Math.acos(clamp(cosAz, -1, 1));
  if (solarHour > 12) azimuth = Math.PI * 2 - azimuth;

  const daylight = clamp01((THREE.MathUtils.radToDeg(altitude) + 6) / 60);
  const kelvin = 2500 + daylight * 3800;
  const color = kelvinToColor(kelvin);
  const sunVector = new THREE.Vector3(
    Math.sin(azimuth) * Math.cos(altitude),
    Math.sin(altitude),
    -Math.cos(azimuth) * Math.cos(altitude)
  ).normalize();

  return {
    altitude,
    azimuth,
    daylight,
    kelvin,
    color,
    sunVector
  };
}

export function formatTime(hours) {
  const h = Math.floor(((hours % 24) + 24) % 24);
  const m = Math.round(((((hours % 24) + 24) % 24) - h) * 60);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}
