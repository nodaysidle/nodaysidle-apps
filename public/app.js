const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Homepage start lights: all five on, then out left to right, once.
const lights = [...document.querySelectorAll('.page-home .lights i')];
if (reduceMotion) {
  lights.forEach((light) => light.classList.add('out'));
} else {
  lights.forEach((light, i) => {
    window.setTimeout(() => light.classList.add('out'), 150 + i * 120);
  });
}

// App page demo: play muted on loop, unless the visitor asked for less motion.
const demo = document.querySelector('video.demo');
if (demo && !reduceMotion) {
  demo.muted = true;
  demo.play().catch(() => {});
}
