export function getPage(): number {
    const params = new URLSearchParams(document.location.search)
    const page = params.get("p") ?? "0"
    return parseInt(page!)
}

export function getRecipe(): string {
    const params = new URLSearchParams(document.location.search)
    const recipe = params.get("r") ?? ""
    return recipe
}

export function jumpToRecipePage(recipe: string | null, page: string | null): void {
    if (recipe == null) return
    const url = new URL(window.location.href)
    url.searchParams.set("r", recipe)
    if (page != null) url.searchParams.set("p", page)
    window.history.replaceState(null, "", url)
    window.updateApp()
}

export function jumpTo(page: number): void {
    const url = new URL(window.location.href)
    url.searchParams.set("p", page.toString())
    window.history.replaceState(null, "", url)
    window.updateApp()
}

let firstTime = true

window.onload = () => {
    const url = new URL(window.location.href)
    const recipe = url.searchParams.get("r")
    const page = url.searchParams.get("p")
    // const redirectTo =
    //     parseInt(page) + (!url.searchParams.has("errorCode") && url.searchParams.has("transactionHashes") ? 1 : 0)
    window.history.replaceState(null, "", window.location.href.split("?")[0])
    jumpToRecipePage(recipe, page)
    if (window.updateApp) window.updateApp()
}
