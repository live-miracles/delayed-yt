export function getCurrentDate(): number {
  return new Date().getTime() / 1000;
}

export function extractYouTubeId(str: string): string {
  try {
    const url = new URL(str);
    const vParam = url.searchParams.get("v");
    if (vParam) {
      return vParam;
    } else if (url.pathname.startsWith("/live/")) {
      return url.pathname.slice(6);
    } else if (url.origin === "https://youtu.be") {
      return url.pathname.slice(1);
    } else {
      return str;
    }
  } catch (error) {
    return str;
  }
}

export function durationToString(duration: number): string {
  const dur = Math.trunc(duration);
  const h = Math.floor(dur / 3600);
  const m = Math.floor((dur % 3600) / 60);
  const s = Math.floor(dur % 60);
  return `${h > 0 ? h + "h " : ""}${h > 0 || m > 0 ? m + "m " : ""}${s}s`;
}

export function getInputValue(input: HTMLInputElement): string | null {
  if (input.type === "checkbox") {
    return input.checked ? "1" : "0";
  } else if (input.type === "text" || input.type === "number") {
    return input.value;
  } else {
    console.error("Unknown input type: " + input.type);
    return null;
  }
}

export function setInputValue(input: HTMLInputElement, value: string): void {
  if (input.type === "checkbox") {
    console.assert(["0", "1"].includes(value));
    input.checked = value === "1";
  } else if (input.type === "text" || input.type === "number") {
    input.value = value;
  } else {
    console.error("Unknown input type: " + input.type);
  }
}

export function setDocumentUrlParams(): void {
  const searchParams = new URLSearchParams(
    new URL(window.location.href).search,
  );

  document.querySelectorAll<HTMLInputElement>(".url-param").forEach((input) => {
    const value = searchParams.get(input.id);
    if (value) setInputValue(input, value);
  });
}

export function getDocumentUrlParams(): URLSearchParams {
  const params = new URLSearchParams();

  document.querySelectorAll<HTMLInputElement>(".url-param").forEach((input) => {
    if (input.type === "checkbox") {
      params.append(input.id, input.checked ? "1" : "0");
    } else if (input.type === "text" || input.type === "number") {
      params.append(input.id, input.value);
    } else {
      console.error("unexpected type: " + input.type);
    }
  });
  return params;
}

export function updateUrlParam(e: Event): void {
  const input = e.currentTarget as HTMLInputElement;
  const name = input.id;
  const value = getInputValue(input);

  const url = new URL(window.location.href);
  if (value !== null) url.searchParams.set(name, value);
  window.history.replaceState({}, "", url);
}
