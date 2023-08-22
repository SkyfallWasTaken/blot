const id = "roots.md";
const collection = "workshops";
const slug = "roots";
const body = '\n# Roots in Haxidraw\n\n(Written by @profsucrose, if you have any issues or questions)\n\nLet\'s walk through the process of how the following image was generated:\n\n<img src="https://cloud-dl5vmy52p-hack-club-bot.vercel.app/0roots.png" width="200">\n\n## The first branch\n\nWe can first start by drawing a simple random walk, where during each step we (randomly) turn the turtle by a few degrees and then inch it forward. We\'ll later make this recursive, so let\'s put the logic in its own function `makeBranch`. The first branch will start at the center, so we also define the width and height of the document (in millimeters, as visualized as the blue rectangle) at the top as constants. We want the branch to start facing the bottom of the page, so we also rotate the turtle 90 degrees when creating it:\n\n```js\nconst WIDTH = 10;\nconst HEIGHT = 20;\n\nconst t = new Turtle([WIDTH / 2, 0]);\nt.right(90);\n\nconst turtles = [t];\n\nfunction makeBranch(turtle) {\n  const n = 185;\n\n  for (let i = 0; i < n; i++) {\n    const curl = randInRange(-5, 5);\n    turtle.left(curl);\n    turtle.forward(length);\n  }\n\n  return turtle;\n}\n\nmakeBranch(t);\n\ndrawTurtles(...turtles);\n```\n\nYou should get something like the screenshot below:\n\n<img src="https://cloud-53ljw5q8m-hack-club-bot.vercel.app/0random_walk.png" width="300">\n\nLet\'s then add width (or thickness) to the branch by, for each point, replacing it with two points separated by the path\'s normal vector at that point. As in, in `iteratePoints`, we get the angle (in radians) the turtle was facing at that point (`angleAtPoint`), and then get the corresponding left and right points by rotating left or right 90 degrees and stepping forward. By stepping we separate the center line into two as defined by the thickness value calculated in `thicknessAt`.\n\nLet\'s put this logic in a new function, `thicken`, which takes in the branch\'s turtle and a thickness value, and the path accordingly. We then call this function at the end of `makeBranch`. The above edits are shown below (feel free to play around with the different constants!):\n\n```js\n\nfunction makeBranch(turtle) {\n    ...\n\n    thicken(turtle)\n\n    return turtle;\n}\n\n\nfunction thicknessAt(t) {\n  return 1-smoothstep(-1.3, 0.9, t)\n}\n\nfunction thicken(turtle) {\n  const left = [];\n  const right = [];\n\n  turtle.iteratePath((pt, t) => {\n    // getAngle() returns degrees, convert to radians\n    const angleAtPoint = turtle.getAngle(t)/180 * Math.PI;\n\n    const thickness = thicknessAt(t)\n\n    const leftAngle = angleAtPoint - Math.PI/2\n    const rightAngle = angleAtPoint + Math.PI/2\n\n    const leftPoint = [\n      pt[0] + thickness * Math.cos(leftAngle),\n      pt[1] + thickness * Math.sin(leftAngle)\n    ]\n\n    const rightPoint = [\n      pt[0] + thickness * Math.cos(rightAngle),\n      pt[1] + thickness * Math.sin(rightAngle)\n    ]\n\n    left.push(leftPoint)\n    right.push(rightPoint)\n  })\n\n  // Now, instead of drawing the center line, the turtle\n  // consists of drawing just the left line and then the right.\n  turtle.path = [left, right];\n}\n\n\nmakeBranch(t, 0.1, 0)\n\ndrawTurtles(t)\n\n// Smoothstep\nfunction clamp(x, minVal, maxVal) {\n  return Math.max(Math.min(x, maxVal), minVal)\n}\n\nfunction smoothstep(edge0, edge1, x) {\n  const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);\n  return t * t * (3.0 - 2.0 * t);\n}\n```\n\nFor the easing function, we use a function called `smoothstep` (documented [here](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml)). If you\'re familiar with Bezier curves or easing functions, `smoothstep` is pretty similar: it takes in an `x` value (in this case time), left and right edges as x-values (`edge0`, `edge1`) and interpolates between the two through a smooth curve. This allows us to, in `thicknessAt`, have the returned thickness vary from `1` to `0` smoothly as `t` increases. `smoothstep` does not give you quite as much control as something like a Bezier curve, but for most easing tasks it works well enough and is easy to intuitively tweak via `edge0` and `edge1`.\n\nIf you\'re interested, here\'s a [visualization of smoothstep in Desmos](https://www.desmos.com/calculator/fyxbylpswj).\n\nThe above edits should produce something like:\n\n<img src="https://cloud-kaucor8o9-hack-club-bot.vercel.app/0thickness.png" width="400">\n\n## Reshaping the branch\n\nBefore we make more branches, let\'s change the random walk to make the "growth" behavior face down more (in a way crudely accounting for "gravity"). We can do this by, in each step, randomly sampling a target angle that the branch will try to curl towards to face. We\'ll then also need some logic for determining if the branch should turn clockwise or counterclockwise to get closer to the angle (a slightly harder problem than you may initially think).\n\nLet\'s add this logic to `makeBranch`:\n\n```js\n// Mods angle to be from -180 - 180 degrees\nfunction modAngleDeg(angle) {\n  angle = Math.sign(angle) * (Math.abs(angle) % 360);\n  if (angle > 180) return 180 - angle;\n  else return angle;\n}\n\nfunction makeBranch(turtle, length, startingT) {\n  const n = 185;\n\n  for (let i = 0; i < n; i++) {\n    const time = i / (n - 1); // Scale i to be from 0-1. The "time" of the step\n    const stdev = 200; // High standard deviation, we don\'t want the branch to be straight\n    const average = -90; // Downwards\n    const targetAngle = gaussianRandom(average, stdev); // Like Math.random(), but biased towards `average`\n\n    const angle = turtle.angle; // Current angle\n\n    const moddedAngle = modAngleDeg(targetAngle); // Mod target angle to be from -180 - 180\n\n    // moddedAngle and moddedAngle + 360 are equivalent; which\n    // one is numerically closer determines which way to turn.\n    const closerDiff = Math.min(moddedAngle - angle, moddedAngle + 360 - angle);\n    const curl = closerDiff / 20; // Scale down\n\n    turtle.left(curl);\n    turtle.forward(length);\n  }\n\n  thicken(turtle, startingT);\n\n  return turtle;\n}\n```\n\nTo randomly sample an angle that is on average close to some "target" but can sometimes be far away, we can use the [normal/Gaussian distribution](https://en.wikipedia.org/wiki/Normal_distribution). We can then control how far each random angle can be from the target by changing the standard deviation (`stdev`) of the distribution. Math.random() in Javascript generates a number between 0 and 1 from a uniform distribution (any number is as likely as any other) so we can turn it into a normal distribution by doing a "Box-Muller transform." I.e., we can copy code from StackOverflow (I don\'t actually know statistics):\n\n```js\n// https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve\n// Standard Normal variate using Box-Muller transform.\nfunction gaussianRandom(mean = 0, stdev = 1) {\n  const u = 1 - Math.random(); // Converting [0,1) to (0,1]\n  const v = Math.random();\n  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);\n  // Transform to the desired mean and standard deviation:\n  return z * stdev + mean;\n}\n```\n\nThe shape of the branch should now be (subtly) different:\n\n<img src="https://cloud-hvaqgannn-hack-club-bot.vercel.app/0normal_dist.png" width="300">\n\n## Branches\n\nWe can add branches in `makeBranch` by, if the length of the current branch is long enough (twigs don\'t branch), creating some additional turtles which break off from the current branch:\n\n```js\nfunction makeBranch() {\n    ...\n\n    if (length > +0.05) {\n        const nBranches = Math.floor(randInRange(1, 4)) // 1-3\n\n        for (let i = 0; i < nBranches; i++) {\n            const time = randInRange(0.02, 1);\n            const pt = turtle.interpolate(time);\n            const curAngleDeg = turtle.getAngle(time),\n                curAngleRad = curAngleDeg/180 * Math.PI\n            const parentThickness = thicknessAt(time + startingT)\n\n            // Turn either left or right 90 degrees\n            const a = (Math.random() > 0.5 ? 1 : -1) * 90\n\n            // Move side branch out of parent\n            pt[0] += parentThickness * Math.cos(curAngleRad - a)\n            pt[1] += parentThickness * Math.sin(curAngleRad - a)\n\n            const newBranch = new Turtle(pt);\n            newBranch.setAngle(curAngleDeg);\n\n            newBranch.right(a);\n            makeBranch(newBranch, length*(1-time)*.90, time + startingT); // Recur\n\n            turtles.push(newBranch) // Add to turtles array for drawing\n        }\n    }\n\n    thicken(turtle, 0.8, startingT)\n\n    return turtle;\n}\n```\n\nThis should produce something like:\n\n<img src="https://cloud-q2juhr9qv-hack-club-bot.vercel.app/0branches.png" width="300">\n\n# Texturing\n\nFinally, let\'s add some texture by drawing rungs/"rings" throughout the path of each branch. Each ring consists of an initially straight line from `leftPoint` to `rightPoint`, where we then add noise to the line by adjusting individual points. We want the line to be more noisy towards the center and less so towards the ends, so we can again use `smoothstep`! This requires rewriting how `thicken` works, so the whole function with these edits made is shown below:\n\n```js\nfunction thicken(turtle, startingTime) {\n  const nRings = 200;\n  const ringStepT = 1 / (nRings - 1);\n  let nextRingT = ringStepT;\n\n  const left = [];\n  const right = [];\n\n  turtle.iteratePath((pt, t) => {\n    /* Thicken line at point, as before */\n\n    // getAngle() returns degrees, convert to radians\n    const angleAtPoint = (turtle.getAngle(t) / 180) * Math.PI;\n\n    const thickness = thicknessAt(t, startingTime);\n\n    const leftAngle = angleAtPoint - Math.PI / 2;\n    const rightAngle = angleAtPoint + Math.PI / 2;\n\n    const leftPoint = [\n      pt[0] + thickness * Math.cos(leftAngle),\n      pt[1] + thickness * Math.sin(leftAngle),\n    ];\n\n    const rightPoint = [\n      pt[0] + thickness * Math.cos(rightAngle),\n      pt[1] + thickness * Math.sin(rightAngle),\n    ];\n\n    left.push(leftPoint);\n    right.push(rightPoint);\n\n    /* But, every ringStepT, draw a ring from left to right */\n    if (t >= nextRingT) {\n      nextRingT += ringStepT;\n\n      /* Draw ring */\n      // Start ring at leftPoint, draw straight line to rightPoint, then add noise\n\n      const deltaX = rightPoint[0] - leftPoint[0];\n      const deltaY = rightPoint[1] - leftPoint[1];\n\n      const ring = new Turtle(leftPoint)\n        .setAngle((Math.atan2(deltaY, deltaX) / Math.PI) * 180)\n        .forward(Math.sqrt(deltaX * deltaX + deltaY * deltaY)) // Straight line from left to right\n        .resample(0.01); // Resample so we can modulate individual points\n\n      // Seed for noise\n      const ringSeed = 1;\n\n      // Take normal vector of straight line by perpendicularizing the line (<x, y> -> <-y, x>)\n      const normalMag = Math.sqrt(deltaX * deltaX + deltaY * deltaY);\n      const normalX = -deltaY / normalMag;\n      const normalY = deltaX / normalMag;\n\n      // Add noise\n      ring.iteratePath((ringPoint, ringT) => {\n        const normal = ring.getNormal(ringT);\n\n        // Smoothstep so more noisy in middle, less at edges\n        const s =\n          0.9 * smoothstep(-0.1, 0.4, 0.5 - Math.abs(ringT - 0.5)) * thickness;\n        const noiseMag = 2 * (noise([2 * ringT, ringSeed]) - 0.5) * s;\n\n        ringPoint[0] += normalX * noiseMag;\n        ringPoint[1] += normalY * noiseMag;\n      });\n\n      turtles.push(ring);\n    }\n  });\n\n  turtle.path = [left, right];\n}\n```\n\nYou should now be able to produce something like the screenshot below:\n\n<img src="https://cloud-2sueak8hm-hack-club-bot.vercel.app/0final_roots.png" width="400">\n\nThat\'s it! But you can still add a lot of features from here, if you\'re up to it:\n\n- For instance, one thing to add would be occlusion, so each branch can be assigned a z-index and cover other ones, so many more branches can be rendered without being too busy\n- Or, you could make the texturing more interesting by varying `ringSeed` for different branches or different regions\n- You could render multiple initial branches/roots at the start, and generate random parameters for each one in an interesting pattern\n- Add some logic so the branches stay within the Haxidraw bed/document always, and curl away from the edges if they get too close\n- Generate a texture for the background\n';
const data = { title: "Roots", description: "We can first start by drawing a simple random walk, where during each step we (randomly) turn the turtle by a few degrees and then inch it forward. We'll later make this recursive, so let's put the logic in its own function `makeBranch`. The first branch will start at the center, so we also define the width and height of the document (in millimeters, as visualized as the blue rectangle) at the top as constants. We want the branch to start facing the bottom of the page, so we also rotate the turtle 90 degrees when creating it:\n", thumbnail: "https://cloud-dl5vmy52p-hack-club-bot.vercel.app/0roots.png" };
const _internal = {
  type: "content",
  filePath: "/Users/jchen/Documents/Programming/prs/haxidraw/astro/src/content/workshops/roots.md",
  rawData: "\ntitle: Roots \ndescription: >\n  We can first start by drawing a simple random walk, where during each step we (randomly) turn the turtle by a few degrees and then inch it forward. We'll later make this recursive, so let's put the logic in its own function `makeBranch`. The first branch will start at the center, so we also define the width and height of the document (in millimeters, as visualized as the blue rectangle) at the top as constants. We want the branch to start facing the bottom of the page, so we also rotate the turtle 90 degrees when creating it:\nthumbnail: https://cloud-dl5vmy52p-hack-club-bot.vercel.app/0roots.png"
};
export {
  _internal,
  body,
  collection,
  data,
  id,
  slug
};