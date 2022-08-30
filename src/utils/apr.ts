export async function getFarmAPR(): Promise<any> {
    const url = "https://validators.narwallets.com/metrics_json"
    try {
        let result = await fetch(url)
        return await result.json()
    } catch (ex) {
        console.error(`err retrieving ${url}`, ex)
        throw new Error(`err retrieving ${url}`)
    }
    // return fetch("https://validators.narwallets.com/metrics_json", {
    //     headers: {
    //         // "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, Methods, Access-Control-Allow-Origin",
    //         // "Access-Control-Allow-Origin": "*",
    //         // "Access-Control-Allow-Credentials": "true",
    //         // "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT",
    //         // "Access-Control-Allow-Origin": window.location.href
    //     }
    // }).then(res => res.json())
}
