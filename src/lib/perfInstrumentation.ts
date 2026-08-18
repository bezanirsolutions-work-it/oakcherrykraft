/**
 * Development-only performance instrumentation for diagnosing CLS, LCP, and TBT.
 * This file records detailed timing and DOM information during page load.
 * 
 * Should only be active in development and on localhost during testing.
 */

const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

interface CLSEvent {
  timestamp: number;
  value: number;
  hadRecentInput: boolean;
  elements: Array<{
    selector: string;
    tag: string;
    class: string;
    before: { top: number; height: number };
    after: { top: number; height: number };
  }>;
}

interface ResourceTiming {
  url: string;
  startTime: number;
  fetchStart: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  transferSize: number;
  decodedBodySize: number;
  duration: number;
}

interface LCPData {
  time: number;
  element: string;
  tag: string;
  class: string;
  id: string;
  src: string;
  size: number;
  renderTime: number;
  loadTime: number;
}

interface LongTaskData {
  startTime: number;
  duration: number;
  scriptUrl: string;
  containerName?: string;
  containerType?: string;
}

interface BodyHeightSample {
  time: number;
  scrollHeight: number;
  clientHeight: number;
  offsetHeight: number;
  numImages: number;
  firstImageHeight: number | null;
  footerPosition: number | null;
}

export interface PerfInstrumentationData {
  clsEvents: CLSEvent[];
  footerSamples: Array<{
    time: number;
    top: number;
    height: number;
    bodyHeight: number;
    contentHeight: number;
  }>;
  bodyHeightSamples: BodyHeightSample[];
  lcpElement: LCPData | null;
  lcpResource: ResourceTiming | null;
  longTasks: LongTaskData[];
  productsFetchStart: number | null;
  productsFetchEnd: number | null;
  productsStateUpdate: number | null;
  imagesStartLoading: number | null;
  imagesFinishedLoading: number | null;
  fontsReady: number | null;
  chatWidgetMount: number | null;
  layoutStateChanges: Array<{ time: number; detail: string }>;
}

const data: PerfInstrumentationData = {
  clsEvents: [],
  footerSamples: [],
  bodyHeightSamples: [],
  lcpElement: null,
  lcpResource: null,
  longTasks: [],
  productsFetchStart: null,
  productsFetchEnd: null,
  productsStateUpdate: null,
  imagesStartLoading: null,
  imagesFinishedLoading: null,
  fontsReady: null,
  chatWidgetMount: null,
  layoutStateChanges: [],
};

// Initialize CLS observer IMMEDIATELY when module loads, before main.tsx render
function observeCLSEarly() {
  if (!isDev || !('PerformanceObserver' in window)) return;

  try {
    console.log('[PERF][CLS] Setting up PerformanceObserver EARLY for layout-shift');
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry instanceof (window as any).LayoutShift)) return;
        const shift = entry as any;

        console.log(`[PERF][CLS] Detected shift at ${performance.now().toFixed(1)}ms: value=${shift.value.toFixed(4)}, hadRecentUserInput=${shift.hadRecentUserInput}`);

        if (shift.hadRecentUserInput) {
          console.log('[PERF][CLS] Shift ignored (user input)');
          return;
        }

        const elements = [];
        if (shift.sources) {
          for (const source of shift.sources) {
            const node = source.node as HTMLElement;
            if (!node) continue;

            const tag = node.tagName.toLowerCase();
            const className = node.className || '';
            const id = node.id || '';
            const selector = `${tag}${id ? '#' + id : ''}${className ? '.' + className.split(' ')[0] : ''}`;

            const rect = node.getBoundingClientRect();
            elements.push({
              selector,
              tag,
              class: className,
              before: { top: rect.top, height: rect.height },
              after: { top: rect.top, height: rect.height },
            });
          }
        }

        data.clsEvents.push({
          timestamp: performance.now(),
          value: shift.value,
          hadRecentInput: shift.hadRecentUserInput,
          elements,
        });

        console.log(
          `[PERF][CLS] Recorded event at ${performance.now().toFixed(1)}ms value=${shift.value.toFixed(4)} elements=${elements.length}`,
          elements
        );
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    console.log('[PERF][CLS] PerformanceObserver ACTIVE at ' + performance.now().toFixed(1) + 'ms');
  } catch (e) {
    console.log('[PERF][CLS] Observer setup failed:', e);
  }
}

// Call immediately
observeCLSEarly();

export function initPerfInstrumentation() {
  if (!isDev) return;

  console.log('[PERF] Initializing performance instrumentation at ' + performance.now().toFixed(1) + 'ms');

  // CLS observer already initialized above
  // Monitor body height changes which could cause CLS
  sampleBodyHeight();

  // Sample footer position starting from ~100ms
  setTimeout(() => sampleFooterPosition(), 100);

  // Monitor LCP
  observeLCP();

  // Monitor long tasks
  observeLongTasks();

  // Monitor fonts
  observeFonts();

  // Make data available globally for inspection
  (window as any).__perfData = data;
}

function observeCLS() {
  if (!('PerformanceObserver' in window)) {
    console.log('[PERF][CLS] PerformanceObserver not supported');
    return;
  }

  try {
    console.log('[PERF][CLS] Setting up PerformanceObserver for layout-shift');
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry instanceof (window as any).LayoutShift)) return;
        const shift = entry as any;

        console.log(`[PERF][CLS] Detected shift: value=${shift.value.toFixed(4)}, hadRecentUserInput=${shift.hadRecentUserInput}`);

        if (shift.hadRecentUserInput) {
          console.log('[PERF][CLS] Shift ignored (user input)');
          return;
        }

        const elements = [];
        if (shift.sources) {
          for (const source of shift.sources) {
            const node = source.node as HTMLElement;
            if (!node) continue;

            const tag = node.tagName.toLowerCase();
            const className = node.className || '';
            const id = node.id || '';
            const selector = `${tag}${id ? '#' + id : ''}${className ? '.' + className.split(' ')[0] : ''}`;

            const rect = node.getBoundingClientRect();
            elements.push({
              selector,
              tag,
              class: className,
              before: { top: rect.top, height: rect.height },
              after: { top: rect.top, height: rect.height },
            });
          }
        }

        data.clsEvents.push({
          timestamp: performance.now(),
          value: shift.value,
          hadRecentInput: shift.hadRecentUserInput,
          elements,
        });

        console.log(
          `[PERF][CLS] Recorded event at ${performance.now().toFixed(1)}ms value=${shift.value.toFixed(4)} elements=${elements.length}`,
          elements
        );
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    console.log('[PERF][CLS] PerformanceObserver active');
  } catch (e) {
    console.log('[PERF][CLS] Observer setup failed:', e);
  }
}

function sampleBodyHeight() {
  if (!isDev) return;

  const sample = () => {
    const body = document.body;
    const numImages = document.querySelectorAll('img').length;
    const firstImage = document.querySelector('img');
    const firstImageHeight = firstImage ? firstImage.getBoundingClientRect().height : null;
    const footer = document.querySelector('footer');
    const footerPosition = footer ? footer.getBoundingClientRect().top : null;

    data.bodyHeightSamples.push({
      time: performance.now(),
      scrollHeight: body.scrollHeight,
      clientHeight: body.clientHeight,
      offsetHeight: body.offsetHeight,
      numImages,
      firstImageHeight,
      footerPosition,
    });

    // Log significant body height changes
    if (data.bodyHeightSamples.length > 1) {
      const prev = data.bodyHeightSamples[data.bodyHeightSamples.length - 2];
      const curr = data.bodyHeightSamples[data.bodyHeightSamples.length - 1];
      const heightChanged = Math.abs(curr.scrollHeight - prev.scrollHeight) > 20;
      const footerMoved = prev.footerPosition && curr.footerPosition && Math.abs(curr.footerPosition - prev.footerPosition) > 10;

      if (heightChanged || footerMoved) {
        console.log(
          `[PERF][BODY] CHANGE at ${curr.time.toFixed(1)}ms: scrollHeight ${prev.scrollHeight}→${curr.scrollHeight} (Δ${(curr.scrollHeight - prev.scrollHeight).toFixed(0)}), footer moved ${footerMoved ? 'YES' : 'NO'}`
        );
      }
    }
  };

  // Sample body height every 50ms for first 8 seconds
  const sampleInterval = window.setInterval(sample, 50);
  setTimeout(() => {
    clearInterval(sampleInterval);
    console.log(`[PERF][BODY] Sampling complete. Recorded ${data.bodyHeightSamples.length} samples.`);
  }, 8000);
}

function sampleFooterPosition() {
  let footerFound = false;
  let sampleInterval: number | null = null;

  const startSampling = () => {
    const footer = document.querySelector('footer');
    if (!footer) {
      console.log('[PERF][FOOTER] Footer not yet in DOM, retrying...');
      return false;
    }

    footerFound = true;
    console.log('[PERF][FOOTER] Footer found, starting position sampling');

    const sample = () => {
      const rect = footer.getBoundingClientRect();
      const mainContent = document.querySelector('main');
      const contentHeight = mainContent ? mainContent.getBoundingClientRect().height : 0;

      data.footerSamples.push({
        time: performance.now(),
        top: rect.top,
        height: rect.height,
        bodyHeight: document.body.scrollHeight,
        contentHeight,
      });

      // Log significant changes
      if (data.footerSamples.length > 1) {
        const prev = data.footerSamples[data.footerSamples.length - 2];
        const curr = data.footerSamples[data.footerSamples.length - 1];
        const topChanged = Math.abs(curr.top - prev.top) > 10;
        const heightChanged = Math.abs(curr.height - prev.height) > 10;

        if (topChanged || heightChanged) {
          console.log(
            `[PERF][FOOTER] CHANGE at ${curr.time.toFixed(1)}ms: top ${prev.top.toFixed(0)}→${curr.top.toFixed(0)}, height ${prev.height.toFixed(0)}→${curr.height.toFixed(0)}`
          );
        }
      }
    };

    // Sample every 100ms for first 6 seconds
    sampleInterval = window.setInterval(sample, 100);
    setTimeout(() => {
      if (sampleInterval) clearInterval(sampleInterval);
    }, 6000);

    return true;
  };

  // Try to start sampling immediately, then retry every 500ms if not found
  const retryInterval = window.setInterval(() => {
    if (startSampling()) {
      clearInterval(retryInterval);
    }
  }, 500);

  // Force stop retry after 3 seconds
  setTimeout(() => clearInterval(retryInterval), 3000);
}

function observeLCP() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;

      const element = lastEntry.element || null;
      let lcpData: LCPData | null = null;

      if (element) {
        const tag = element.tagName.toLowerCase();
        const className = element.className || '';
        const id = element.id || '';
        const src = element.src || element.style?.backgroundImage || '';
        const size = lastEntry.size || 0;

        lcpData = {
          time: lastEntry.startTime,
          element: element.outerHTML.substring(0, 200),
          tag,
          class: className,
          id,
          src: src.substring(0, 200),
          size,
          renderTime: lastEntry.renderTime || 0,
          loadTime: lastEntry.loadTime || 0,
        };

        data.lcpElement = lcpData;

        console.log(
          `[PERF][LCP] time=${lastEntry.startTime.toFixed(1)}ms tag=${tag} class="${className}" size=${size}`,
          lcpData
        );

        // Try to get resource timing for LCP
        if (src && tag === 'IMG') {
          getResourceTiming(src);
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.log('[PERF][LCP] Observer not supported:', e);
  }
}

function getResourceTiming(url: string) {
  try {
    const entries = performance.getEntriesByName(url) as PerformanceResourceTiming[];
    if (entries.length > 0) {
      const entry = entries[entries.length - 1];
      const timing: ResourceTiming = {
        url: entry.name,
        startTime: entry.startTime,
        fetchStart: entry.fetchStart,
        requestStart: entry.requestStart,
        responseStart: entry.responseStart,
        responseEnd: entry.responseEnd,
        transferSize: entry.transferSize,
        decodedBodySize: entry.decodedBodySize,
        duration: entry.duration,
      };

      data.lcpResource = timing;

      console.log(
        `[PERF][LCP_RESOURCE] fetchStart=${timing.fetchStart.toFixed(1)}ms responseStart=${timing.responseStart.toFixed(1)}ms responseEnd=${timing.responseEnd.toFixed(1)}ms transferSize=${timing.transferSize}`,
        timing
      );
    }
  } catch (e) {
    console.log('[PERF][LCP_RESOURCE] Error getting resource timing:', e);
  }
}

function observeLongTasks() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const task = entry as any;
        const duration = task.duration;
        let scriptUrl = 'unknown';

        if (task.attribution && task.attribution.length > 0) {
          scriptUrl = task.attribution[0].name || 'unknown';
        }

        data.longTasks.push({
          startTime: task.startTime,
          duration,
          scriptUrl,
          containerName: task.containerName,
          containerType: task.containerType,
        });

        console.log(
          `[PERF][LONGTASK] start=${task.startTime.toFixed(1)}ms duration=${duration.toFixed(1)}ms url="${scriptUrl}"`
        );
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.log('[PERF][LONGTASK] Observer not supported:', e);
  }
}

function observeFonts() {
  if (!document.fonts) return;

  document.fonts.ready.then(() => {
    data.fontsReady = performance.now();
    console.log(`[PERF][FONTS] Fonts ready at ${performance.now().toFixed(1)}ms`);
  });
}

export function recordProductsFetchStart() {
  data.productsFetchStart = performance.now();
  console.log(`[PERF][PRODUCTS] Fetch started at ${performance.now().toFixed(1)}ms`);
}

export function recordProductsFetchEnd() {
  data.productsFetchEnd = performance.now();
  console.log(
    `[PERF][PRODUCTS] Fetch ended at ${performance.now().toFixed(1)}ms (duration: ${(data.productsFetchEnd - (data.productsFetchStart || 0)).toFixed(1)}ms)`
  );
}

export function recordProductsStateUpdate() {
  data.productsStateUpdate = performance.now();
  console.log(`[PERF][PRODUCTS] State updated at ${performance.now().toFixed(1)}ms`);
}

export function recordImagesStartLoading() {
  if (!data.imagesStartLoading) {
    data.imagesStartLoading = performance.now();
    console.log(`[PERF][IMAGES] Started loading at ${performance.now().toFixed(1)}ms`);
  }
}

export function recordImagesFinishedLoading() {
  data.imagesFinishedLoading = performance.now();
  console.log(`[PERF][IMAGES] Finished loading at ${performance.now().toFixed(1)}ms`);
}

export function recordChatWidgetMount() {
  data.chatWidgetMount = performance.now();
  console.log(`[PERF][CHAT] ChatWidget mounted at ${performance.now().toFixed(1)}ms`);
}

export function recordLayoutStateChange(detail: string) {
  data.layoutStateChanges.push({ time: performance.now(), detail });
  console.log(`[PERF][LAYOUT] State change: ${detail} at ${performance.now().toFixed(1)}ms`);
}

export function getPerfData() {
  return data;
}
