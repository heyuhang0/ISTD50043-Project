import { Avatar } from 'antd';


function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function strHash(s) {
  let hash = 0, i, chr;
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

function generateColor(seedStr) {
  let h = Math.abs(strHash(seedStr) % 360) / 360;
  let s = 0.6, v = 0.85;
  let color = HSVtoRGB(h, s, v);
  return "rgb(" + color.r + "," + color.g + "," + color.b + ")";
}

function UserAvatar({ username }) {
  let color = generateColor(username);
  return <Avatar style={{ backgroundColor: color }}>{username.substring(0, 1)}</Avatar>;
}

export default UserAvatar;
