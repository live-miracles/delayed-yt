export function getCurrentDate() {
    return new Date().getTime() / 1000;
}
export function extractYouTubeId(str) {
    try {
        const url = new URL(str);
        const vParam = url.searchParams.get("v");
        if (vParam) {
            return vParam;
        }
        else if (url.pathname.startsWith("/live/")) {
            return url.pathname.slice(6);
        }
        else if (url.origin === "https://youtu.be") {
            return url.pathname.slice(1);
        }
        else {
            return str;
        }
    }
    catch (error) {
        return str;
    }
}
export function durationToString(duration) {
    const dur = Math.trunc(duration);
    const h = Math.floor(dur / 3600);
    const m = Math.floor((dur % 3600) / 60);
    const s = Math.floor(dur % 60);
    return `${h > 0 ? h + "h " : ""}${h > 0 || m > 0 ? m + "m " : ""}${s}s`;
}
export function getInputValue(input) {
    if (input.type === "checkbox") {
        return input.checked ? "1" : "0";
    }
    else if (input.type === "text" || input.type === "number") {
        return input.value;
    }
    else {
        console.error("Unknown input type: " + input.type);
        return null;
    }
}
export function setInputValue(input, value) {
    if (input.type === "checkbox") {
        console.assert(["0", "1"].includes(value));
        input.checked = value === "1";
    }
    else if (input.type === "text" || input.type === "number") {
        input.value = value;
    }
    else {
        console.error("Unknown input type: " + input.type);
    }
}
export function setDocumentUrlParams() {
    const searchParams = new URLSearchParams(new URL(window.location.href).search);
    document.querySelectorAll(".url-param").forEach((input) => {
        const value = searchParams.get(input.id);
        if (value)
            setInputValue(input, value);
    });
}
export function getDocumentUrlParams() {
    const params = new URLSearchParams();
    document.querySelectorAll(".url-param").forEach((input) => {
        if (input.type === "checkbox") {
            params.append(input.id, input.checked ? "1" : "0");
        }
        else if (input.type === "text" || input.type === "number") {
            params.append(input.id, input.value);
        }
        else {
            console.error("unexpected type: " + input.type);
        }
    });
    return params;
}
export function updateUrlParam(e) {
    const input = e.currentTarget;
    const name = input.id;
    const value = getInputValue(input);
    const url = new URL(window.location.href);
    if (value !== null)
        url.searchParams.set(name, value);
    window.history.replaceState({}, "", url);
}
//# sourceMappingURL=tools.js.map