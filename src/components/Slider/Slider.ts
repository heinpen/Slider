import './Slider.sass';

interface Config {
  direction?: string,
  pagination?: boolean
  counter?: boolean
}

function Slider(sliderClassName: string, config: Config): void {
  const slider = document.querySelector<HTMLElement>(sliderClassName);
  const sliderWrapper = slider.querySelector<HTMLElement>('.slider__wrapper');
  const slides = slider.querySelectorAll('.slider__slide');

  const direction = config.direction ?? 'horizontal';
  if (direction === 'vertical') {
    sliderWrapper.classList.add('vertical');
    var slideHeight: number = setSizeOfSlide('height');
  } else {
    var slideWidth: number = setSizeOfSlide();
  }
  if (config.pagination) {
    var bullets = createBullets();
  }
  if (config.counter) {
    createCounter();
  }

  let wasPressed = false;
  let slidePosition = 0;
  let indexOfActiveSlide = 0;
  let startPointOfDragging: number;
  let timeOfStartDragging: number;
  let draggingStopped: number;

  function createBullets() {
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

    function triggerBullets(e: MouseEvent) {
      const target = e.target as HTMLTextAreaElement;
      if (target.classList.contains('slider__bullet')) {
        const numberBulletIndex = Number(target.dataset.bulletIndex);
        bulletClickTrigger(numberBulletIndex);
      }
    }
    function bulletClickTrigger(indexOfNewActiveSlide: number) {
      changeSliderPosition(indexOfNewActiveSlide);
      setNewActiveSlideAndBullet(indexOfNewActiveSlide);
      // setCurrentSlideNumber();
    }

    return document.querySelectorAll('.slider__bullet');
  }

  (function init() {
    addActiveSlideAndBullet(indexOfActiveSlide);
    initEventListeners();
    addTransparentHighlight();
  })();

  function addTransparentHighlight() {
    slider.classList.add('highlight-transparent');
  }

  function createCounter() {
    const counter = document.createElement('span');
    const numberOfSlide = indexOfActiveSlide + 1;
    if (numberOfSlide >= 10) {
      counter.innerText = `${numberOfSlide}`;
    } else {
      counter.innerText = `0${numberOfSlide}`;
    }
    slider.appendChild(counter);
  }

  function setSizeOfSlide(size?: string) {
    if (size === 'height') {
      slideHeight = slider.offsetHeight;
      return slideHeight;
    }
    slideWidth = slider.offsetWidth;
    return slideWidth;
  }

  function changeSliderPosition(indexOfNewActiveSlide: number) {
    setSliderPosition(indexOfNewActiveSlide);
    // Add transition duration during changing slides.
    startSliding();
  }

  function startSliding() {
    sliderWrapper.style.transitionDuration = '300ms';
    addSlidingStatus();
  }

  function endSliding() {
    sliderWrapper.style.transitionDuration = '0ms';
    removeSlidingStatus();
  }

  function setSliderPosition(indexOfSlide: number, draggedDistance = 0, slowingCoeff = 1) {
    if (direction === 'horizontal') {
      slidePosition = slideWidth * indexOfSlide + draggedDistance / slowingCoeff;
      sliderWrapper.style.transform = `translate3d(${-slidePosition}px, 0, 0)`;
    } else {
      slidePosition = slideHeight * indexOfSlide + draggedDistance / slowingCoeff;
      sliderWrapper.style.transform = `translate3d(0, ${-slidePosition}px, 0)`;
    }
  }

  function removePrevActiveSlideAndBullet(i: number) {
    slides[i].classList.remove('active-slide');
    if (config.pagination) bullets[i].classList.remove('active-bullet');
  }

  function addActiveSlideAndBullet(i: number) {
    slides[i].classList.add('active-slide');
    if (config.pagination) bullets[i].classList.add('active-bullet');
  }

  function setNewActiveSlideAndBullet(newIndex: number, prevIndex = indexOfActiveSlide) {
    removePrevActiveSlideAndBullet(prevIndex);
    addActiveSlideAndBullet(newIndex);
    setNewIndexOfActiveSlide(newIndex);
  }

  function setNewIndexOfActiveSlide(newIndex: number) {
    indexOfActiveSlide = newIndex;
  }

  function isSliding() {
    return sliderWrapper.classList.contains('sliding');
  }

  function startOfDragging(e: MouseEvent) {
    const target = e.target as HTMLTextAreaElement;
    // If click was on pagination bar or right click was used
    // then slider-dragging is not getting triggered.
    const elementsClickedId = [target.id, target.parentElement.id];
    if (elementsClickedId.includes('sliderPagination') || e.buttons === 2 || isSliding()) return;

    if (direction === 'horizontal') {
      startPointOfDragging = e.pageX;
    } else {
      startPointOfDragging = e.pageY;
    }

    wasPressed = true;
    timeOfStartDragging = new Date().getTime();
    endSliding();
    e.preventDefault();
  }

  function dragging(e: MouseEvent) {
    // If user move mouse without wasPressed slider won't get triggered.
    if (!wasPressed) return;

    if (direction === 'horizontal') {
      var currentPointOfDragging = e.pageX;
    } else {
      var currentPointOfDragging = e.pageY;
    }
    const draggedDistance = startPointOfDragging - currentPointOfDragging;
    const slowingCoeff = 2;
    if (draggedDistance < 0) {
      draggingUp(draggedDistance, slowingCoeff);
    } else if (draggedDistance > 0) {
      draggingDown(draggedDistance, slowingCoeff);
    }
  }

  function draggingUp(draggedDistance:number, slowingCoeff:number) {
    if (isFirstSlide()) {
      setSliderPosition(indexOfActiveSlide, draggedDistance, slowingCoeff);
    } else {
      setSliderPosition(indexOfActiveSlide, draggedDistance);
    }
  }
  function draggingDown(draggedDistance: number, slowingCoeff: number) {
    if (isLastSlide()) {
      setSliderPosition(indexOfActiveSlide, draggedDistance, slowingCoeff);
    } else {
      setSliderPosition(indexOfActiveSlide, draggedDistance);
    }
  }

  function endOfDragging(e: MouseEvent) {
    if (!wasPressed) return;
    wasPressed = false;
    if (direction === 'horizontal') {
      var endPointOfDragging = e.pageX;
    } else {
      var endPointOfDragging = e.pageY;
    }
    const draggedDistance = startPointOfDragging - endPointOfDragging;

    draggingStopped = new Date().getTime();

    // If user dragged in vertical direction
    // then slider doesn't get triggered.
    if (slidingWasCanceled(endPointOfDragging)) return;
    // If not choose next slider according to direction.
    chooseNextSlide(draggedDistance, timeOfDragging());
  }

  function slidingWasCanceled(endPointOfDragging: number) {
    return !!(endPointOfDragging === 0 && timeOfDragging() < 100);
  }

  function timeOfDragging() {
    return draggingStopped - timeOfStartDragging;
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
    return indexOfActiveSlide === 0;
  }

  function isLastSlide() {
    return indexOfActiveSlide === slides.length - 1;
  }

  function goToCurrentSlide() {
    setSliderPosition(indexOfActiveSlide);
  }

  function goToPrevSlide() {
    const newActiveSlide = indexOfActiveSlide - 1;
    const prevActiveSlide = indexOfActiveSlide;
    setSliderPosition(newActiveSlide);
    setNewActiveSlideAndBullet(newActiveSlide, prevActiveSlide);

    // setCurrentSlideNumber();
  }

  function goToNextSlide() {
    const newActiveSlide = indexOfActiveSlide + 1;
    const prevActiveSlide = indexOfActiveSlide;
    setSliderPosition(newActiveSlide);
    setNewActiveSlideAndBullet(newActiveSlide, prevActiveSlide);

    // setCurrentSlideNumber();
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
      if (direction === 'horizontal') setSizeOfSlide();
      else setSizeOfSlide('height');
      setSliderPosition(indexOfActiveSlide);
    });
  }
}
export default Slider;
