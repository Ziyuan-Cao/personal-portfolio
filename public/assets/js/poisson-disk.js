// Bridson, Fast Poisson Disk Sampling in Arbitrary Dimensions (2007):
// https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf
// Periodic boundaries avoid seams. This small decorative field uses a direct
// neighbor scan instead of a spatial grid; candidate generation follows Bridson.
export function poissonDisk(width, height, distance, random = Math.random) {
  const points = [{ x: random() * width, y: random() * height }];
  const active = [points[0]];
  const wrap = (value, extent) => ((value % extent) + extent) % extent;

  while (active.length) {
    const index = Math.floor(random() * active.length);
    const origin = active[index];
    let accepted = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const angle = random() * Math.PI * 2;
      // sqrt gives uniform area density in the annulus [r, 2r].
      const radius = distance * Math.sqrt(1 + 3 * random());
      const candidate = {
        x: wrap(origin.x + Math.cos(angle) * radius, width),
        y: wrap(origin.y + Math.sin(angle) * radius, height),
      };
      const overlaps = points.some(point => {
        const dx = Math.abs(candidate.x - point.x);
        const dy = Math.abs(candidate.y - point.y);
        return Math.hypot(Math.min(dx, width - dx), Math.min(dy, height - dy)) < distance;
      });
      if (overlaps) continue;
      points.push(candidate);
      active.push(candidate);
      accepted = true;
      break;
    }
    if (!accepted) {
      active[index] = active[active.length - 1];
      active.pop();
    }
  }
  return points;
}
