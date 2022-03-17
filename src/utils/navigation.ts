export function getPage(): number {
    const params = new URLSearchParams(document.location.search)
    const page = params.get("p") ?? "0"
    return parseInt(page!)
}

export function jumpTo(page: number): void {
    const url = new URL(window.location.href)
    url.searchParams.set("p", page.toString())
    window.history.replaceState(null, "", url)
    window.FORCEUPDATE()
}

let firstTime = true

window.onload = () => {
    const url = new URL(window.location.href)
    const page = url.searchParams.get("p") ?? "0"
    const redirectTo =
        parseInt(page) +
        (!url.searchParams.has("errorCode") &&
        url.searchParams.has("transactionHashes")
            ? 1
            : 0)
    window.history.replaceState(null, "", window.location.href.split("?")[0])
    jumpTo(redirectTo)
    window.FORCEUPDATE()
}
