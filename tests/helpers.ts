import { userEvent } from "@testing-library/user-event";

/**
 * Radix checkboxes/buttons react better to real pointer events than to fireEvent.
 * pointerEventsCheck is disabled because jsdom styling of [pointer-events] is unreliable.
 */
export async function userClick(element: Element) {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.click(element);
}

