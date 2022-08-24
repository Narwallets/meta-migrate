export function getFarmAPR(): Promise<any> {
    return fetch("https://validators.narwallets.com/metrics_json", {
        headers: {
            "Access-Control-Allow-Origin": window.location.href
        }
    }).then(res => res.json())
}
