

// Generate custom diagonal - play with it here - https://observablehq.com/@bumbeishvili/curved-edges?collection=@bumbeishvili/work-components
export function diagonal(s, t) {
    // Calculate some variables based on source and target (s,t) coordinates
    const x = s.x;
    const y = s.y;
    const ex = t.x;
    const ey = t.y;
    let xrvs = ex - x < 0 ? -1 : 1;
    let yrvs = ey - y < 0 ? -1 : 1;
    let rdef = 35;
    let rInitial = Math.abs(ex - x) / 2 < rdef ? Math.abs(ex - x) / 2 : rdef;
    let r = Math.abs(ey - y) / 2 < rInitial ? Math.abs(ey - y) / 2 : rInitial;
    let h = Math.abs(ey - y) / 2 - r;
    let w = Math.abs(ex - x) - r * 2;

    // Build the path
    const path = `
         M ${x} ${y}
         L ${x} ${y + h * yrvs}
         C  ${x} ${y + h * yrvs + r * yrvs} ${x} ${y + h * yrvs + r * yrvs} ${x + r * xrvs} ${y + h * yrvs + r * yrvs}
         L ${x + w * xrvs + r * xrvs} ${y + h * yrvs + r * yrvs}
         C ${ex}  ${y + h * yrvs + r * yrvs} ${ex}  ${y + h * yrvs + r * yrvs} ${ex} ${ey - h * yrvs}
         L ${ex} ${ey}
       `
    // Return result
    return path;
}

