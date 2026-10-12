import type { AnalyticsEventDetail, AnalyticsEventType } from './types';

const EVENT_NAMESPACE = 'mvirgil:training';

export function emitAnalyticsEvent(type: AnalyticsEventType, detail: Omit<AnalyticsEventDetail, 'type'> = {}): void {
  try {
    const payload: AnalyticsEventDetail = {
      type,
      ...detail,
    };

    const customEvent = new CustomEvent(EVENT_NAMESPACE, {
      bubbles: true,
      composed: true,
      detail: payload,
    });

    window.dispatchEvent(customEvent);

    // Also dispatch named event directly for easy listening
    window.dispatchEvent(new CustomEvent(`mvirgil:${type}`, {
      bubbles: true,
      composed: true,
      detail: payload,
    }));
  } catch (error) {
    console.debug('Analytics dispatch suppressed:', error);
  }
}

export function subscribeToAnalytics(callback: (event: AnalyticsEventDetail) => void): () => void {
  const handler = (evt: Event) => {
    const customEvt = evt as CustomEvent<AnalyticsEventDetail>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    }
  };

  window.addEventListener(EVENT_NAMESPACE, handler);
  return () => {
    window.removeEventListener(EVENT_NAMESPACE, handler);
  };
}
