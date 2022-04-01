const bigMin = (arr: string[]): string => arr.reduce((a: string, b: string) => (BigInt(a) < BigInt(b) ? a : b))

const getMaxInvest = (available: string[], poolAmts: string[]): string[] => [
    bigMin([available[0], ((BigInt(available[1]) * BigInt(poolAmts[0])) / BigInt(poolAmts[1])).toString()]),
    bigMin([available[1], ((BigInt(available[0]) * BigInt(poolAmts[1])) / BigInt(poolAmts[0])).toString()])
]

// PROBLEM: This fn is used in conjunction with utils.format.formatNearAmount
// but utils.format.formatNearAmount USES LOCALIZED decimal-separator and thousands-separators
// so this function DOES NOT WORK if the LOCAL decimal-separator!=="." and LOCAL thousands-separators!==","
// SOLUTION:
// use yton() that converts an amount in yoctos into a formatted amount in near, floored
// const parseFloatFloorFixed = (str: string, acc: number = 4) =>
//     (Math.floor(parseFloat(str) * 10 ** acc) / 10 ** acc).toFixed(acc)

/**
 * Converts YOCTOS to formatted NEAR amounts
 * returns string with a decimal point and [decimal] decimal places, floored
 * also add commas as thousands separators
 * @param {string} yoctoString amount in yoctos as string
 */
function yton(yoctoString: string, decimals: number = 5): string {
    let result = (yoctoString + "").padStart(25, "0")
    // 1 NEAR = 1e24 YOCTOS
    result = result.slice(0, -24) + "." + result.slice(-24)
    // remove extra decimals (flooring)
    if (decimals > 23) {
        decimals = 23
    }
    if (decimals <= 0) {
        decimals = 1
    }
    result = result.slice(0, -24 + decimals)
    return addCommas(result)
}

/**
 * adds commas to a string number
 * @param {string} str
 */
function addCommas(str: string) {
    let n = str.indexOf(".")
    if (n === -1) n = str.length
    n -= 4
    while (n >= 0) {
        str = str.slice(0, n + 1) + "," + str.slice(n + 1)
        n = n - 3
    }
    return str
}

export { bigMin, getMaxInvest, yton, addCommas }
