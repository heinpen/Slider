import './Slider.sass';

interface UserConfig {
  direction?: string,
  pagination?: boolean
  counter?: boolean
  arrows?: boolean
}

function Slider(sliderClassName: string, userConfig: UserConfig): void {
  const slider = document.querySelector<HTMLElement>(sliderClassName);
  const sliderWrapper = slider.querySelector<HTMLElement>('.slider__wrapper');
  const slides = slider.querySelectorAll('.slider__slide');

  const config = (function init() {
    interface MainConfig {
      wasPressed: boolean,
      slidePosition: number,
      activeSlide: number,
      startPointOfDragging: number,
      timeOfStartDragging: number,
      draggingStopped: number,
      direction?: string,
      slideHeight?: number,
      slideWidth?: number,
      bullets?: NodeListOf<Element>
      counter?: HTMLSpanElement
    }

    const mainConfig: MainConfig = {
      wasPressed: false,
      slidePosition: 0,
      activeSlide: 0,
      startPointOfDragging: 0,
      timeOfStartDragging: 0,
      draggingStopped: 0,
    };

    // Configure slider according to config, provided by user.

    // direction
    mainConfig.direction = userConfig.direction ?? 'horizontal';
    if (mainConfig.direction === 'vertical') {
      sliderWrapper.classList.add('slider__wrapper_vertical');
      slider.classList.add('slider_vertical');
      mainConfig.slideHeight = slider.offsetHeight;
    } else {
      mainConfig.slideWidth = slider.offsetWidth;
    }

    // arrows
    if (userConfig.arrows) {
      createArrows();
    }

    // pagination
    if (userConfig.pagination) {
      mainConfig.bullets = createBullets(mainConfig.direction);
    }

    // counter
    if (userConfig.counter) {
      mainConfig.counter = createCounter();
    }

    return mainConfig;
  })();

  (function init() {
    if (config.counter) setCurrentSlideNumber();
    setActiveStatus(config.activeSlide);
    initEventListeners();
    addTransparentHighlight();
  })();

  function createArrows() {
    const arrows = {
      right: document.createElement('button'),
      left: document.createElement('button'),
    };
    arrows.right.classList.add('slider__arrow', 'slider__arrow_right');
    arrows.left.classList.add('slider__arrow', 'slider__arrow_left');

    // Append to slider.
    slider.append(arrows.right, arrows.left);
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
      setActiveStatus(newIndex);
      applyChangesAfterTransition();
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

  function setSizeOfSlide(size?: string) {
    if (size === 'height') {
      config.slideHeight = slider.offsetHeight;
    }
    config.slideWidth = slider.offsetWidth;
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
    sliderWrapper.style.transitionDuration = '300ms';
    addSlidingStatus();
  }

  function endSliding() {
    removeVisibility();
    sliderWrapper.style.transitionDuration = '0ms';
    removeSlidingStatus();
  }

  function setSliderPosition(indexOfSlide: number, draggedDistance = 0, slowingCoeff = 1) {
    const {
      direction, slideWidth, slideHeight,
    } = config;
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
    // slide
    slides[prevIndex].classList.remove('active-slide');
    slides[newIndex].classList.add('active-slide');

    // bullet
    if (config.bullets) {
      config.bullets[prevIndex].classList.remove('active-bullet');
      config.bullets[newIndex].classList.add('active-bullet');
    }

    // Set new active index.
    config.activeSlide = newIndex;
  }

  function isSliding() {
    return sliderWrapper.classList.contains('sliding');
  }

  function startOfDragging(e: MouseEvent) {
    const target = e.target as HTMLTextAreaElement;
    // If click was on pagination bar or right click was used
    // then slider-dragging is not getting triggered.
    if (target.classList.contains('slider__pagination')
     || target.parentElement.classList.contains('slider__pagination')
     || e.buttons === 2
     || isSliding()) {
      return;
    }

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
    } else if (directionOfDragging(draggedDistance) === 'left') {
      isFirstSlide() ? goToCurrentSlide() : goToPrevSlide();
      startSliding();
    } else if (directionOfDragging(draggedDistance) === 'right') {
      isLastSlide() ? goToCurrentSlide() : goToNextSlide();
      startSliding();
    }
  }

  function directionOfDragging(draggedDistance: number) {
    return draggedDistance > 0 ? 'right' : 'left';
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

  function applyChangesAfterTransition() {
    if (config.counter) setCurrentSlideNumber();
  }

  function goToPrevSlide() {
    const { activeSlide } = config;
    const newActiveSlide = activeSlide - 1;
    const prevActiveSlide = activeSlide;
    setSliderPosition(newActiveSlide);
    setActiveStatus(newActiveSlide, prevActiveSlide);

    applyChangesAfterTransition();
  }

  function goToNextSlide() {
    const { activeSlide } = config;
    const newActiveSlide = activeSlide + 1;
    const prevActiveSlide = activeSlide;
    setSliderPosition(newActiveSlide);
    setActiveStatus(newActiveSlide, prevActiveSlide);

    applyChangesAfterTransition();
  }

  function initEventListeners() {
    if (window.PointerEvent) {
      slider.addEventListener('pointerdown', startOfDragging);
      slider.addEventListener('pointermove', dragging);
      slider.addEventListener('pointerup', endOfDragging);
      slider.addEventListener('pointercancel', endOfDragging);

      //

      slider.addEventListener('mouseleave', endOfDragging);
    } else {
      slider.addEventListener('mousedown', startOfDragging);
      slider.addEventListener('mousemove', dragging);
      slider.addEventListener('mouseup', endOfDragging);
      slider.addEventListener('mouseleave', endOfDragging);

      slider.addEventListener('touchstart', startOfDragging);
      slider.addEventListener('touchmove', dragging);
      slider.addEventListener('touchcancel', endOfDragging);
      slider.addEventListener('touchend', endOfDragging);
    }
    // Set transitionDuration as 0ms when sliding transition ended
    // so we can drag without any transition.
    sliderWrapper.addEventListener('transitionend', endSliding);

    // Change size of slide according to the size of viewport.
    window.addEventListener('resize', () => {
      const { direction, activeSlide } = config;
      if (direction === 'horizontal') setSizeOfSlide();
      else setSizeOfSlide('height');
      setSliderPosition(activeSlide);
    });
  }
}
export default Slider;
