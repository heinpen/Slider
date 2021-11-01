import './Slider.sass';

interface UserConfig {
  direction?: string;
  pagination?: boolean;
  counter?: boolean;
  arrows?: boolean;
  transition?: number;
}

function Slider(sliderId: string, userConfig: UserConfig): void {
  const slider = document.getElementById(sliderId);
  slider.classList.add('slider');
  const sliderWrapper = slider.querySelector<HTMLElement>('.slider__wrapper');
  const slides = slider.querySelectorAll<HTMLElement>('.slider__slide');

  const config = (function createConfig() {
    interface MainConfig {
      wasPressed: boolean;
      slidePosition: number;
      activeSlide: number;
      startPointOfDragging: number;
      timeOfStartDragging: number;
      draggingStopped: number;
      transition: number;
      direction: string;
      slideHeight?: number;
      slideWidth?: number;
      bullets?: NodeListOf<Element>;
      counter?: HTMLSpanElement;
      arrows?: {
        forward: HTMLButtonElement;
        back: HTMLButtonElement;
      };
    }

    const mainConfig: MainConfig = {
      wasPressed: false,
      slidePosition: 0,
      activeSlide: 0,
      startPointOfDragging: 0,
      timeOfStartDragging: 0,
      draggingStopped: 0,
      transition: userConfig.transition ?? 200,
      direction: userConfig.direction ?? 'horizontal',
    };

    return mainConfig;
  })();

  (function configureSlider() {
    // direction
    if (config.direction === 'vertical') {
      sliderWrapper.classList.add('slider__wrapper_vertical');
      slider.classList.add('slider_vertical');
    }

    // arrows
    if (userConfig.arrows) {
      config.arrows = createArrows();
      setArrowStatus();
    }

    // pagination
    if (userConfig.pagination) {
      config.bullets = createBullets(config.direction);
    }

    // counter
    if (userConfig.counter) {
      config.counter = createCounter();
      setCurrentSlideNumber();
    }

    setActiveStatus(config.activeSlide);
    setSizeOfSlide(config.direction);
    initEventListeners();
    addTransparentHighlight();
  })();

  function createArrows() {
    interface Arrows {
      [arrow: string]: HTMLButtonElement;
      forward: HTMLButtonElement;
      back: HTMLButtonElement;
    }
    const arrows: Arrows = {
      forward: document.createElement('button'),
      back: document.createElement('button'),
    };

    arrows.forward.classList.add('slider__arrow', 'slider__arrow_forward');
    arrows.back.classList.add('slider__arrow', 'slider__arrow_back');

    for (const arrow in arrows) {
      if (Object.hasOwnProperty.call(arrows, arrow)) {
        arrows[arrow].addEventListener('click', arrowHandler);
      }
    }

    // Append to slider.
    slider.append(arrows.forward, arrows.back);

    return arrows;
  }

  function arrowHandler(e: MouseEvent) {
    const target = e.target as HTMLTextAreaElement;
    const { activeSlide } = config;
    if (target.classList.contains('slider__arrow_back')) {
      if (isFirstSlide()) return;
      const newIndex = activeSlide - 1;
      triggerArrows(newIndex);
    } else if (target.classList.contains('slider__arrow_forward')) {
      if (isLastSlide()) return;
      const newIndex = activeSlide + 1;
      triggerArrows(newIndex);
    }

    function triggerArrows(newIndex: number) {
      changeSliderPosition(newIndex);
      applyChangesAfterTransition(newIndex);
    }
  }

  function createBullets(direction: string) {
    const sliderPagination = document.createElement('div');

    sliderPagination.classList.add('slider__pagination');
    if (direction === 'vertical') sliderPagination.classList.add('vertical');
    else sliderPagination.classList.add('horizontal');

    for (let i = 0; i < slides.length; i++) {
      const bullet = document.createElement('button');
      bullet.classList.add('slider__bullet');
      bullet.dataset.bulletIndex = String(i);
      sliderPagination.appendChild(bullet);
    }

    slider.appendChild(sliderPagination);

    sliderPagination.addEventListener('click', triggerBullets);

    return document.querySelectorAll('.slider__bullet');
  }

  function addTransparentHighlight() {
    slider.classList.add('highlight-transparent');
  }

  function triggerBullets(e: MouseEvent) {
    const target = e.target as HTMLTextAreaElement;
    if (target.classList.contains('slider__bullet')) {
      const newIndex = Number(target.dataset.bulletIndex);
      // If click was on active bullet - do nothing.
      if (newIndex === config.activeSlide) return;
      changeSliderPosition(newIndex);
      applyChangesAfterTransition(newIndex);
    }
  }

  function createCounter() {
    const counterElement = document.createElement('span');
    counterElement.classList.add('slider__counter');
    slider.appendChild(counterElement);
    return counterElement;
  }

  function setCurrentSlideNumber() {
    const { activeSlide, counter } = config;
    const numberOfSlide = activeSlide + 1;

    if (numberOfSlide >= 10) {
      counter.innerText = `${numberOfSlide}`;
    } else {
      counter.innerText = `0${numberOfSlide}`;
    }
  }

  function setSizeOfSlide(direction: string) {
    if (direction === 'vertical') {
      config.slideHeight = slider.offsetHeight;
      slides.forEach((slide) => slide.style.height = `${config.slideHeight}px`);
    } else {
      config.slideWidth = slider.offsetWidth;
      slides.forEach((slide) => slide.style.width = `${config.slideWidth}px`);
    }
  }

  function changeSliderPosition(newIndex: number) {
    setSliderPosition(newIndex);
    // Add transition duration during changing slides.
    startSliding();
  }

  function addVisibility() {
    slides.forEach((slide) => slide.classList.add('visible'));
  }

  function removeVisibility() {
    slides.forEach((slide) => slide.classList.remove('visible'));
  }

  function startSliding() {
    addVisibility();
    sliderWrapper.style.transitionDuration = `${config.transition}ms`;
    addSlidingStatus();
  }

  function endSliding() {
    removeVisibility();
    sliderWrapper.style.transitionDuration = '0ms';
    removeSlidingStatus();
  }

  function setSliderPosition(indexOfSlide: number, draggedDistance = 0, slowingCoeff = 1) {
    const { direction, slideWidth, slideHeight } = config;
    if (direction === 'horizontal') {
      sliderWrapper.style.transform = `translate3d(${-calculateSliderPosition(slideWidth)}px, 0, 0)`;
    } else {
      sliderWrapper.style.transform = `translate3d(0, ${-calculateSliderPosition(slideHeight)}px, 0)`;
    }

    function calculateSliderPosition(size: number) {
      config.slidePosition = size * indexOfSlide + draggedDistance / slowingCoeff;
      return config.slidePosition;
    }
  }

  function setActiveStatus(newIndex: number, prevIndex = config.activeSlide) {
    const { bullets } = config;
    // slide

    slides[prevIndex].classList.remove('active-slide');
    slides[newIndex].classList.add('active-slide');

    // bullets
    if (bullets) {
      bullets[prevIndex].classList.remove('active-bullet');
      bullets[newIndex].classList.add('active-bullet');
    }
    console.log(newIndex, prevIndex);
    // Set new active index.
    config.activeSlide = newIndex;
  }

  function isSliding() {
    return !!sliderWrapper.classList.contains('sliding');
  }

  function startOfDragging(e: MouseEvent) {
    const target = e.target as HTMLTextAreaElement;

    // Create array of conditionals. And each of them has to return false
    // to enable dragging.
    const itemsPreventDragging = [
      target.classList.contains('slider__pagination'),
      target.parentElement.classList.contains('slider__pagination'),
      e.buttons === 2,
      isSliding(),
      target.classList.contains('slider__arrow'),
    ];
    // Check each value in array to be false, if not - prevent dragging.
    const isDraggingNotAllowed = itemsPreventDragging.some((con) => con);
    if (isDraggingNotAllowed) return;

    if (config.direction === 'horizontal') {
      config.startPointOfDragging = e.pageX;
    } else {
      config.startPointOfDragging = e.pageY;
    }

    config.wasPressed = true;
    config.timeOfStartDragging = new Date().getTime();
    e.preventDefault();
  }

  function dragging(e: MouseEvent) {
    const { wasPressed, direction, startPointOfDragging: start } = config;
    // If user move mouse without wasPressed slider won't get triggered.
    if (!wasPressed) return;
    addVisibility();
    if (direction === 'horizontal') {
      var currentPointOfDragging = e.pageX;
    } else {
      var currentPointOfDragging = e.pageY;
    }
    const draggedDistance = start - currentPointOfDragging;
    const slowingCoeff = 2;
    if (draggedDistance < 0) {
      draggingUp(draggedDistance, slowingCoeff);
    } else if (draggedDistance > 0) {
      draggingDown(draggedDistance, slowingCoeff);
    }
  }

  function draggingUp(draggedDistance: number, slowingCoeff: number) {
    if (isFirstSlide()) {
      setSliderPosition(config.activeSlide, draggedDistance, slowingCoeff);
    } else {
      setSliderPosition(config.activeSlide, draggedDistance);
    }
  }

  function draggingDown(draggedDistance: number, slowingCoeff: number) {
    if (isLastSlide()) {
      setSliderPosition(config.activeSlide, draggedDistance, slowingCoeff);
    } else {
      setSliderPosition(config.activeSlide, draggedDistance);
    }
  }

  function endOfDragging(e: MouseEvent) {
    const { direction, startPointOfDragging: start } = config;

    if (!config.wasPressed) return;
    config.wasPressed = false;
    if (direction === 'horizontal') {
      var endPointOfDragging = e.pageX;
    } else {
      var endPointOfDragging = e.pageY;
    }
    const draggedDistance = start - endPointOfDragging;

    config.draggingStopped = new Date().getTime();

    // If user dragged in vertical direction
    // then slider doesn't get triggered.
    if (slidingWasCanceled(endPointOfDragging)) return;
    // If not, choose next slider according to direction.
    chooseNextSlide(draggedDistance, timeOfDragging());
  }

  function slidingWasCanceled(endPointOfDragging: number) {
    return !!(endPointOfDragging === 0 && timeOfDragging() < 100);
  }

  function timeOfDragging() {
    const { draggingStopped: stop, timeOfStartDragging: start } = config;
    return stop - start;
  }

  function chooseNextSlide(draggedDistance: number, dragTime: number) {
    if (draggedDistance === 0) {
      // Nothing happens.
    } else if (timeLimitBreached(dragTime)) {
      goToCurrentSlide();
      startSliding();
    } else if (directionOfDragging(draggedDistance) === 'back') {
      isFirstSlide() ? goToCurrentSlide() : goToPrevSlide();
      startSliding();
    } else if (directionOfDragging(draggedDistance) === 'forward') {
      isLastSlide() ? goToCurrentSlide() : goToNextSlide();
      startSliding();
    }
  }

  function directionOfDragging(draggedDistance: number) {
    return draggedDistance > 0 ? 'forward' : 'back';
  }

  function timeLimitBreached(dragTime: number) {
    return dragTime > 250;
  }

  function addSlidingStatus() {
    sliderWrapper.classList.add('sliding');
  }

  function removeSlidingStatus() {
    sliderWrapper.classList.remove('sliding');
  }

  function isFirstSlide() {
    return config.activeSlide === 0;
  }

  function isLastSlide() {
    return config.activeSlide === slides.length - 1;
  }

  function goToCurrentSlide() {
    setSliderPosition(config.activeSlide);
  }

  function setArrowStatus() {
    const { arrows } = config;
    if (isLastSlide()) {
      arrows.forward.disabled = true;
      arrows.back.removeAttribute('disabled');
    } else if (isFirstSlide()) {
      arrows.back.disabled = true;
      arrows.forward.removeAttribute('disabled');
    } else {
      arrows.forward.removeAttribute('disabled');
      arrows.back.removeAttribute('disabled');
    }
  }

  function applyChangesAfterTransition(newActiveSlide: number, prevActiveSlide?: number) {
    const { counter, arrows } = config;
    setActiveStatus(newActiveSlide, prevActiveSlide);
    if (counter) setCurrentSlideNumber();
    if (arrows) setArrowStatus();
  }

  function goToPrevSlide() {
    const { activeSlide } = config;
    const newActiveSlide = activeSlide - 1;
    const prevActiveSlide = activeSlide;
    setSliderPosition(newActiveSlide);
    applyChangesAfterTransition(newActiveSlide, prevActiveSlide);
  }

  function goToNextSlide() {
    const { activeSlide } = config;
    const newActiveSlide = activeSlide + 1;
    const prevActiveSlide = activeSlide;
    setSliderPosition(newActiveSlide);
    applyChangesAfterTransition(newActiveSlide, prevActiveSlide);
  }

  function initEventListeners() {
    slider.addEventListener('pointerdown', startOfDragging);
    slider.addEventListener('pointermove', dragging);
    slider.addEventListener('pointerup', endOfDragging);
    slider.addEventListener('pointercancel', endOfDragging);
    slider.addEventListener('pointerleave', endOfDragging);

    // Set transitionDuration as 0ms when sliding transition ended
    // so we can drag without any transition.
    sliderWrapper.addEventListener('transitionend', endSliding);

    // Change size of slide according to the size of viewport.
    window.addEventListener('resize', () => {
      const { direction, activeSlide } = config;
      setSizeOfSlide(direction);
      setSliderPosition(activeSlide);
    });
  }
}
export default Slider;
