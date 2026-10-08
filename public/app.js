const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealElements = [...document.querySelectorAll('.reveal')];
const videos = [...document.querySelectorAll('.demo-video')];
let revealObserver;

function configureMotion() {
  revealObserver?.disconnect();
  const reduce = motionPreference.matches;
  document.documentElement.classList.toggle('motion-enabled', !reduce);
  document.documentElement.classList.toggle('reduce-motion', reduce);
  revealElements.forEach((element) => element.classList.remove('pending'));

  if (reduce) {
    videos.forEach((video) => {
      video.pause();
      video.removeAttribute('autoplay');
    });
    return;
  }

  document.documentElement.classList.add('can-autoplay');
  videos.forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('autoplay', '');
    video.play().catch(() => {});
  });

  if (!('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06 }
  );
  revealElements.forEach((element) => {
    if (element.getBoundingClientRect().top > window.innerHeight) {
      element.classList.add('pending');
      revealObserver.observe(element);
    }
  });
}

configureMotion();
motionPreference.addEventListener('change', configureMotion);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    videos.forEach((video) => video.pause());
  } else if (!motionPreference.matches) {
    videos.forEach((video) => video.play().catch(() => {}));
  }
});

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    if (button) {
      const previous = button.textContent;
      button.textContent = 'Copied';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = previous;
        button.classList.remove('copied');
      }, 1400);
    }
  } catch {
    /* clipboard may be unavailable */
  }
}

document.querySelectorAll('.copy-btn').forEach((button) => {
  button.addEventListener('click', () => copyText(button.dataset.copy || '', button));
});

document.querySelectorAll('.checksum').forEach((code) => {
  code.addEventListener('click', () => {
    const sibling = code.parentElement?.querySelector('.copy-btn');
    copyText(code.dataset.checksum || code.textContent || '', sibling);
  });
  code.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const sibling = code.parentElement?.querySelector('.copy-btn');
      copyText(code.dataset.checksum || code.textContent || '', sibling);
    }
  });
});
