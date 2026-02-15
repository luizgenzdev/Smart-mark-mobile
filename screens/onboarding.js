// onboarding.js
export function renderOnboarding(onFinish, isAuth = false) {
  const slides = [
    {
      title: "Welcome to Smart Mark",
      desc: "Easily track pupil attendance accurately and efficiently.",
      img: "assets/onboard.webp",
      alt: "Welcome illustration",
    },
    {
      title: "Easy Reports",
      desc: "Generate weekly or monthly Markreports in seconds.",
      img: "assets/onboard1.webp",
      alt: "Reports illustration",
    },
    {
      title: "Secure Data",
      desc: "Your school's data is safe and private with Smart Attendance.",
      img: "assets/onboard2.webp",
      alt: "Secure data illustration",
    },
    {
      title: "Start App",
      desc: "Start Smart Mark and enjoy a faster, simpler way to mark and manage attendance.",
      img: "assets/onboard3.webp",
      alt: "Start illustration",
    },
  ];

  let currentSlide = 0;
  const container = document.getElementById("body");
  container.classList.remove("pt-16");

  function renderSlide() {
    const slide = slides[currentSlide];
    const dots = slides
      .map((_, i) => `
        <span class="mx-1 w-8 h-1 rounded-full inline-block ${
          i === currentSlide
            ? "bg-blue-600"
            : "bg-gray-400 dark:bg-gray-600"
        }"></span>`
      )
      .join("");

    container.classList.add("opacity-0", "transition-opacity", "duration-300");

    setTimeout(() => {
      container.innerHTML = `
        <div class="flex dark:bg-[#121212] flex-col h-screen items-center justify-center p-6 text-center">
          <img src="${slide.img}" alt="${slide.alt}"
            class="w-40 h-40 mb-6 mx-auto drop-shadow-lg object-contain">
          <h1 class="text-3xl font-extrabold mb-2 text-gray-900 dark:text-gray-100">
            ${slide.title}
          </h1>
          <p class="text-gray-700 dark:text-gray-300 mb-6 text-lg">
            ${slide.desc}
          </p>
          <div class="mb-6">${dots}</div>
          <div class="flex justify-between w-full max-w-xs mx-auto">
            <button id="skipBtn"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
              Skip
            </button>
            <button id="nextBtn"
              class="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
              ${currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      `;
      container.classList.remove("opacity-0");
      attachEvents();
    }, 200);
  }

  function attachEvents() {
    document.getElementById("nextBtn").onclick = () => {
      currentSlide < slides.length - 1
        ? (++currentSlide, renderSlide())
        : finishOnboarding();
    };

    document.getElementById("skipBtn").onclick = finishOnboarding;
  }

  function finishOnboarding() {
    localStorage.setItem("onboardingSeen", "true");

    if (typeof onFinish === "function") {
      onFinish(); // 🔑 let main.js decide what happens next
    }
  }

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" && currentSlide < slides.length - 1) {
      currentSlide++;
      renderSlide();
    }
    if (e.key === "ArrowLeft" && currentSlide > 0) {
      currentSlide--;
      renderSlide();
    }
  });

  renderSlide();
}