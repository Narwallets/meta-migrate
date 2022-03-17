import {
    Box,
    Grid,
    Icon,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField
} from "@mui/material"
import { useTheme } from "@mui/styles"
import { utils } from "near-api-js"
import * as React from "react"
import { ReactNode, useReducer } from "react"
import {
    getMetapoolInfo,
    getNewFarmingStake,
    getNewPoolInfo,
    getNativeNearBalance,
    getOctBalanceOnRef,
    getStnearBalance,
    getStnearBalanceOnRef,
    getWnearBalanceOnRef,
    getOldPosition,
    exitOldPosition,
    nearToStnear,
    OLD_POOL_ID,
    NEW_POOL_ID,
    addLiquidityAndStake,
    calcLpSharesFromAmounts
} from "../services/near"
import { Refresh } from "../utils/refresh"
import NavButtonComponent from "./navbuttons"
import StepComponent from "./step"
import TitleComponent from "./title"
import meme from "../meme.png"

const inputValues: string[] = []
const inputValuesUnmatched: string[] = []
const inputErrors: boolean[] = []

const bigMin = (arr: string[]): string =>
    arr.reduce((a: string, b: string) => (BigInt(a) < BigInt(b) ? a : b))

const getMaxInvest = (available: string[], poolAmts: string[]): string[] => [
    bigMin([
        available[0],
        (
            (BigInt(available[1]) * BigInt(poolAmts[0])) /
            BigInt(poolAmts[1])
        ).toString()
    ]),
    bigMin([
        available[1],
        (
            (BigInt(available[0]) * BigInt(poolAmts[1])) /
            BigInt(poolAmts[0])
        ).toString()
    ])
]

const setInputValues = (
    id: number,
    val: string,
    pattern?: string,
    fallback: string = "0"
) => {
    inputValuesUnmatched[id] = val
    inputValues[id] =
        pattern !== undefined
            ? val.match(pattern) !== null
                ? val
                : fallback
            : val
}

const setInputErrors = (
    id: number,
    pattern?: string,
    assert?: Array<{ test: (value: string) => boolean; msg: string }>
) => {
    if (inputValuesUnmatched[id] === undefined) return

    const error =
        (pattern !== undefined &&
            inputValuesUnmatched[id].match(pattern) === null) ||
        (assert !== undefined &&
            assert.some(a => a.test(inputValuesUnmatched[id])))

    if (inputErrors[id] !== error) {
        inputErrors[id] = error
        updatePage()
    }
}

const Description = (props: { children: any }) => (
    <div
    // style={{
    //     display: "flex",
    //     flexFlow: "row wrap",
    //     alignItems: "baseline",
    //     whiteSpace: "break-spaces"
    // }}
    >
        {props.children}
    </div>
)

const Break = () => <div /*style={{ width: "100%" }}*/ />

const Seperate = () => <div /*style={{ width: "100%", height: "0.5em" }}*/ />

const Warning = (props: { children: any }) => {
    const theme = useTheme() as any
    return (
        <span
        // style={{
        //     display: "flex",
        //     flexFlow: "row wrap",
        //     color: theme.palette.warning.main,
        //     fontWeight: "bold",
        //     marginTop: "8px"
        // }}
        >
            <Icon>warning_amber</Icon> {props.children}
        </span>
    )
}

const Purple = (props: { children: any }) => {
    const theme = useTheme() as any
    return (
        <span
        style={{
            color: theme.palette.primary.main,
            fontWeight: "bold"
        }}
        >
            {props.children}
        </span>
    )
}

const Note = (props: { children: any }) => {
    return (
        <span
        style={{
            fontWeight: "lighter",
            fontSize: "small",
            opacity: 0.5,
            paddingTop: "0.5rem"
        }}
        >
            {props.children}
        </span>
    )
}

const Input = (props: {
    id: number
    label: string
    unit?: string
    type?: string
    default: string
    pattern?: string
    assert?: Array<{ test: (value: string) => boolean; msg: string }>
    onChange?: (value: string) => void
}) => {
    setInputValues(props.id, props.default)
    setInputErrors(props.id, props.pattern, props.assert)
    return (
        <TextField
            sx={{
                width: .45,
                mx: 1,
                // flex: 2,
                // flexBasis: 0
            }}
            label={props.label}
            variant="outlined"
            // margin="normal"
            size="small"
            type={props.type}
            InputProps={{
                ...(props.unit === undefined
                    ? {}
                    : {
                          endAdornment: (
                              <InputAdornment position="end">
                                  {props.unit}
                              </InputAdornment>
                          )
                      }),
                ...(props.pattern === undefined
                    ? {}
                    : {
                          pattern: props.pattern
                      })
            }}
            InputLabelProps={{
                shrink: true
            }}
            value={inputValuesUnmatched[props.id]}
            error={inputErrors[props.id]}
            helperText={
                inputErrors[props.id] &&
                props.pattern !== undefined &&
                inputValuesUnmatched[props.id].match(props.pattern) === null
                    ? "Invalid input value"
                    : props.assert !== undefined &&
                      props.assert.some(a =>
                          a.test(inputValuesUnmatched[props.id])
                      )
                    ? props
                          .assert!.filter(a =>
                              a.test(inputValuesUnmatched[props.id])
                          )
                          .map(a => a.msg)
                          .reduce((a, b) => a + "\n" + b)
                    : ""
            }
            onChange={e => {
                setInputValues(props.id, e.target.value, props.pattern)
                setInputErrors(props.id, props.pattern, props.assert)
                props?.onChange?.(e.target.value)
                updatePage()
            }}
        />
    )
}

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
export function yton(yoctoString: string, decimals: number = 5): string {
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
    if (n == -1) n = str.length
    n -= 4
    while (n >= 0) {
        str = str.slice(0, n + 1) + "," + str.slice(n + 1)
        n = n - 3
    }
    return str
}

function getContent(page: number): ReactNode | null {
    switch (page) {
        case 0:
            return (
                <>
                    <TitleComponent title="Exit OCT <-> wNEAR" step={1} />
                    <StepComponent
                        title={"Unstake & remove liquidity."}
                        description={
                            <Description>
                                Unstake your LP shares from the OCT {"<->"}{" "}
                                wNEAR farm and remove liquidity from the OCT{" "}
                                {"<->"} wNEAR pool to receive OCT and wNEAR
                                tokens. Your wNEAR will be withdrawn and
                                unwrapped automatically.
                                <Seperate />
                                You have a total of {""}
                                <span>
                                    <Purple>
                                        {window.oldPosition
                                            ? yton(
                                                  window.oldPosition
                                                      .user_total_shares
                                              )!
                                            : "..."}
                                    </Purple>
                                    {""} LP shares
                                </span>
                                <Break />
                                {"\u2248"} {""}
                                <span>
                                    <Purple>
                                        {window.oldPosition
                                            ? yton(
                                                  window.oldPosition
                                                      .min_amounts[0] + "000000" // cheap way to divide by 1e6
                                              )!
                                            : "..."}
                                    </Purple>
                                    {""} $OCT and {""}
                                </span>
                                <span>
                                    <Purple>
                                        {window.oldPosition
                                            ? yton(
                                                  window.oldPosition
                                                      .min_amounts[1]
                                              )!
                                            : "..."}
                                    </Purple>
                                    {""} $NEAR.
                                </span>
                                <Break />
                                <Note>Execution might take a while.</Note>
                            </Description>
                        }
                        
                    />
                    <NavButtonComponent
                        next 
                        status
                        completed={
                            window.REFRESHER[1] ??
                            (() => {
                                window.REFRESHER[1] = new Refresh(
                                    () =>
                                        new Promise(resolve =>
                                            getOldPosition().then(res => {
                                                window.oldPosition = res
                                                resolve(
                                                    BigInt(
                                                        res.user_lp_shares
                                                    ) === BigInt("0") &&
                                                        BigInt(
                                                            res.user_farm_shares
                                                        ) === BigInt("0")
                                                )
                                            })
                                        )
                                )
                                return window.REFRESHER[1]
                            })()
                        }
                        action={() => {
                            localStorage.setItem(
                                "OCTminAmountOut",
                                window.oldPosition.min_amounts[0]
                            )
                            localStorage.setItem(
                                "wNEARminAmountOut",
                                window.oldPosition.min_amounts[1]
                            )
                            exitOldPosition(
                                window.oldPosition.user_farm_shares,
                                window.oldPosition.user_total_shares,
                                window.oldPosition.min_amounts
                            )
                        }}
                    />
                </>
            )

        case 1:
            return (
                <>
                    <TitleComponent title="NEAR -> stNEAR" step={2} />
                    <StepComponent
                        title={"Stake NEAR."}
                        description={
                            <Description>
                                Stake your NEAR with MetaPool to get stNEAR.
                                <Break />
                                You currently have {""}
                                <span>
                                    <Purple>
                                        {window.nativeNEARBalance
                                            ? yton(window.nativeNEARBalance)
                                            : "..."}
                                    </Purple>
                                    {""} $NEAR in your wallet.
                                </span>
                                <Break />
                                <div className="input-container">
                                    <Input
                                        id={0}
                                        label="amount"
                                        unit="NEAR"
                                        type="number"
                                        pattern="^\d+(\.\d{0,24})?$"
                                        assert={[
                                            {
                                                test: (value: string) =>
                                                    window.minDepositAmount !==
                                                        undefined &&
                                                    BigInt(
                                                        utils.format.parseNearAmount(
                                                            value
                                                        ) ?? "0"
                                                    ) <
                                                        BigInt(
                                                            window.minDepositAmount
                                                        ),
                                                msg: `Staking with MetaPool requires a minimum deposit of ${yton(
                                                    window.minDepositAmount,
                                                    2
                                                )} $NEAR.`
                                            },
                                            {
                                                test: (value: string) =>
                                                    window.nativeNEARBalance !==
                                                        undefined &&
                                                    BigInt(
                                                        utils.format.parseNearAmount(
                                                            value
                                                        ) ?? "0"
                                                    ) >
                                                        BigInt(
                                                            window.nativeNEARBalance
                                                        ),
                                                msg: `Insufficient funds. You only have ${utils.format.formatNearAmount(
                                                    window.nativeNEARBalance
                                                )} $NEAR in your wallet.`
                                            }
                                        ]}
                                        default={
                                            inputValuesUnmatched[0] ??
                                            utils.format.formatNearAmount(
                                                localStorage.getItem(
                                                    "wNEARminAmountOut"
                                                ) ?? "0"
                                            )
                                        }
                                    />
                                    
                                    <span className="input-container-equals">
                                        {""} {"\u2248"} {""}
                                        <Purple>
                                            {window.stNEARPrice
                                                ? parseFloat(
                                                    (
                                                        Number(
                                                            BigInt(
                                                                inputErrors[0]
                                                                    ? "0"
                                                                    : (utils.format.parseNearAmount(
                                                                            inputValues[0] ??
                                                                                "0"
                                                                        ) as string) +
                                                                            "0000"
                                                            ) /
                                                                BigInt(
                                                                    window.stNEARPrice
                                                                )
                                                        ) / 10000
                                                    ).toString()
                                                ).toFixed(5)
                                                : "..."}
                                        </Purple>
                                        {""} $stNEAR.
                                    </span>
                                </div>
                            </Description>
                        }
                    />
                    <NavButtonComponent 
                        next 
                        back
                        status
                        completed={
                            window.REFRESHER[2] ??
                            (() => {
                                window.REFRESHER[2] = new Refresh(
                                    () =>
                                        new Promise(resolve =>
                                            Promise.all([
                                                getNativeNearBalance(),
                                                getWnearBalanceOnRef(),
                                                getMetapoolInfo()
                                            ]).then(res => {
                                                window.nativeNEARBalance =
                                                    res[0]
                                                window.wNEARBalanceOnRef =
                                                    res[1]
                                                window.stNEARPrice =
                                                    res[2].st_near_price
                                                window.minDepositAmount =
                                                    res[2].min_deposit_amount
                                                resolve(
                                                    BigInt(
                                                        window.nativeNEARBalance
                                                    ) <
                                                        BigInt(
                                                            window.minDepositAmount
                                                        )
                                                )
                                            })
                                        ),
                                    0
                                )
                                return window.REFRESHER[2]
                            })()
                        }
                        denied={inputErrors[0]}
                        action={() =>
                            nearToStnear(
                                utils.format.parseNearAmount(
                                    inputValues[0]
                                ) as string
                            )
                        }
                     />
                </>
            )

        case 2:
            if (window.newPoolInfo !== undefined) {
                const values = getMaxInvest(
                    [
                        (
                            BigInt(window.stNEARBalanceOnRef) +
                            BigInt(window.stNEARBalance)
                        ).toString(),
                        window.OCTBalanceOnRef
                    ],
                    window.newPoolInfo.amounts
                )
                inputValuesUnmatched[1] =
                    inputValuesUnmatched[1] ?? yton(values[1] + "000000")

                inputValuesUnmatched[2] =
                    inputValuesUnmatched[2] ?? yton(values[0])
            }
            window.lpSharesToStake = window.newPoolInfo
                ? calcLpSharesFromAmounts(
                      window.newPoolInfo.total_shares,
                      window.newPoolInfo.amounts,
                      [
                          utils.format.parseNearAmount(
                              inputErrors[2] ? "0" : inputValues[2] ?? "0"
                          )!,
                          (
                              BigInt(
                                  utils.format.parseNearAmount(
                                      inputErrors[1]
                                          ? "0"
                                          : inputValues[1] ?? "0"
                                  )!
                              ) / BigInt("1000000")
                          ).toString()
                      ]
                  )
                : "0"
            return (
                <>
                    <TitleComponent title="Enter OCT <-> stNEAR" step={3} />
                    <StepComponent
                        title={"Provide liquidity & farm."}
                        description={
                            <Description>
                                <Break />
                                You have {""}
                                <span>
                                    <Purple>
                                        {window.OCTBalanceOnRef !== undefined
                                            ? yton(
                                                  window.OCTBalanceOnRef +
                                                      "000000"
                                              )
                                            : "..."}
                                    </Purple>
                                    {""} $OCT
                                </span>
                                {""} and {""}
                                <span>
                                    <Purple>
                                        {window.stNEARBalance !== undefined &&
                                        window.stNEARBalanceOnRef !== undefined
                                            ? yton(
                                                  (
                                                      BigInt(
                                                          window.stNEARBalance
                                                      ) +
                                                      BigInt(
                                                          window.stNEARBalanceOnRef
                                                      )
                                                  ).toString()
                                              )
                                            : "..."}
                                    </Purple>
                                    {""} $stNEAR.
                                </span>
                                <Break />
                                <div className="input-container">
                                    <Input
                                        id={1}
                                        label="amount"
                                        unit="OCT"
                                        type="number"
                                        pattern="^\d+(\.\d{0,18})?$"
                                        assert={[
                                            {
                                                test: (value: string) =>
                                                    window.OCTBalanceOnRef !==
                                                        undefined &&
                                                    BigInt(
                                                        utils.format.parseNearAmount(
                                                            value
                                                        ) ?? "0"
                                                    ) >
                                                        BigInt(
                                                            window.OCTBalanceOnRef +
                                                                "000000"
                                                        ),
                                                msg: `Insufficient funds. You only have ${
                                                    window.OCTBalanceOnRef !==
                                                    undefined
                                                        ? yton(
                                                            window.OCTBalanceOnRef +
                                                                "000000"
                                                        )
                                                        : "..."
                                                } $OCT on Ref-finance.`
                                            }
                                        ]}
                                        onChange={(value: string) => {
                                            if (
                                                window.newPoolInfo !== undefined &&
                                                !inputErrors[1]
                                            ) {
                                                // https://stackoverflow.com/a/54409977/17894968
                                                inputValuesUnmatched[2] = (
                                                    parseFloat(value) /
                                                    (Number(
                                                        (BigInt("10000000000") *
                                                            BigInt("1000000") *
                                                            BigInt(
                                                                window.newPoolInfo
                                                                    .amounts[1]
                                                            )) /
                                                            BigInt(
                                                                window.newPoolInfo
                                                                    .amounts[0]
                                                            )
                                                    ) /
                                                        10000000000)
                                                ).toFixed(5) // TODO: check if final pool is [OCT, stNEAR] or [stNEAR, OCT]
                                            }
                                        }}
                                        default={inputValuesUnmatched[1]}
                                    />
                                    <Icon sx={{ alignSelf: "center", lineHeight: "1.5em" }}>link</Icon>
                                    <Input
                                        id={2}
                                        label="amount"
                                        unit="stNEAR"
                                        type="number"
                                        pattern="^\d+(\.\d{0,24})?$"
                                        assert={[
                                            {
                                                test: (value: string) =>
                                                    window.stNEARBalanceOnRef !==
                                                        undefined &&
                                                    window.stNEARBalance !==
                                                        undefined &&
                                                    BigInt(
                                                        utils.format.parseNearAmount(
                                                            value
                                                        ) ?? "0"
                                                    ) >
                                                        BigInt(
                                                            window.stNEARBalanceOnRef
                                                        ) +
                                                            BigInt(
                                                                window.stNEARBalance
                                                            ),
                                                msg: `Insufficient funds. You only have ${yton(
                                                    (
                                                        BigInt(
                                                            window.stNEARBalanceOnRef ??
                                                                "0"
                                                        ) +
                                                        BigInt(
                                                            window.stNEARBalance ??
                                                                "0"
                                                        )
                                                    ).toString()
                                                )} stNEAR in total.`
                                            }
                                        ]}
                                        onChange={(value: string) => {
                                            if (
                                                window.newPoolInfo !== undefined &&
                                                !inputErrors[2]
                                            ) {
                                                inputValuesUnmatched[1] = (
                                                    (parseFloat(value) *
                                                        Number(
                                                            (BigInt("10000000000") *
                                                                BigInt("1000000") *
                                                                BigInt(
                                                                    window
                                                                        .newPoolInfo
                                                                        .amounts[1]
                                                                )) /
                                                                BigInt(
                                                                    window
                                                                        .newPoolInfo
                                                                        .amounts[0]
                                                                )
                                                        )) /
                                                    10000000000
                                                ).toFixed(5) // TODO: check if final pool is [OCT, stNEAR] or [stNEAR, OCT]
                                            }
                                        }}
                                        default={inputValuesUnmatched[2]}
                                    />
                                    <Break />
                                    {"\u2248"}{" "}
                                    <span>
                                        <Purple>
                                            {window.newPoolInfo
                                                ? yton(window.lpSharesToStake)
                                                : "..."}
                                        </Purple>
                                        {""} LP shares. {""}
                                    </span>
                                </div>
                            </Description>
                        }
                        
                    />
                    <NavButtonComponent 
                        next 
                        back 
                        status
                        denied={
                            inputErrors[1] ||
                            inputErrors[2] ||
                            parseFloat(inputValuesUnmatched[1]) === 0 ||
                            parseFloat(inputValuesUnmatched[2]) === 0
                        }
                        completed={
                            window.REFRESHER[3] ??
                            (() => {
                                window.REFRESHER[3] = new Refresh(
                                    () =>
                                        new Promise(resolve =>
                                            Promise.all([
                                                getNewPoolInfo(),
                                                getOctBalanceOnRef(),
                                                getStnearBalanceOnRef(),
                                                getStnearBalance()
                                            ]).then(res => {
                                                window.newPoolInfo = res[0]
                                                window.OCTBalanceOnRef = res[1]
                                                window.stNEARBalanceOnRef =
                                                    res[2]
                                                window.stNEARBalance = res[3]
                                                resolve(false)
                                            })
                                        )
                                )
                                return window.REFRESHER[3]
                            })()
                        }
                        action={() => {
                            addLiquidityAndStake(
                                (
                                    BigInt(
                                        utils.format.parseNearAmount(
                                            inputValues[2]
                                        )!
                                    ) - BigInt(window.stNEARBalanceOnRef)
                                ).toString(),
                                [
                                    utils.format.parseNearAmount(
                                        inputValues[2]
                                    )!,
                                    (
                                        BigInt(
                                            utils.format.parseNearAmount(
                                                inputValues[1]
                                            )!
                                        ) / BigInt("1000000")
                                    ).toString()
                                ],
                                window.lpSharesToStake
                            )
                        }}
                    />
                </>
            )

        case 3:
            if (window.REFRESHER[4] === undefined)
                window.REFRESHER[4] = new Refresh(
                    () =>
                        new Promise(resolve =>
                            getNewFarmingStake().then(res => {
                                window.newFarmingStake = res
                                resolve(true)
                            })
                        ),
                    0
                )
            return (
                <>
                    <TitleComponent title="Happy Farming!" />
                    <img style={{ height: "100%" }} src={meme} alt="meme" />
                    <Box
                        sx={{
                            my: 2
                        }}
                    >
                        You currently have {""}
                        <span>
                            <Purple>
                                {window.newFarmingStake
                                    ? yton(window.newFarmingStake)
                                    : "..."}
                            </Purple>
                            {""} LP shares in the farm.
                        </span>
                    </Box>
                    <NavButtonComponent back />
                </>
            )

        case 4:
            if (window.REFRESHER[5] === undefined)
                window.REFRESHER[5] = new Refresh(
                    () =>
                        new Promise(resolve =>
                            Promise.all([
                                getOldPosition(),
                                getWnearBalanceOnRef(),
                                getStnearBalanceOnRef(),
                                getOctBalanceOnRef(),
                                getStnearBalance(),
                                getNativeNearBalance(),
                                getNewPoolInfo(),
                                getNewFarmingStake()
                            ]).then(res => {
                                window.oldPosition = res[0]
                                window.wNEARBalanceOnRef = res[1]
                                window.stNEARBalanceOnRef = res[2]
                                window.OCTBalanceOnRef = res[3]
                                window.stNEARBalance = res[4]
                                window.nativeNEARBalance = res[5]
                                window.newPoolInfo = res[6]
                                window.newFarmingStake = res[7]
                                resolve(true)
                            })
                        ),
                    0
                )
            const rows = [
                {
                    location: "OCT <-> wNEAR Farm",
                    link: `https://app.ref.finance/farms`,
                    amount: window?.oldPosition?.user_farm_shares,
                    unit: "LP"
                },
                {
                    location: "OCT <-> wNEAR Pool",
                    link: `https://app.ref.finance/pool/${OLD_POOL_ID}`,
                    amount: window?.oldPosition?.user_lp_shares,
                    unit: "LP"
                },
                {
                    location: "Ref-Finance",
                    link: `https://app.ref.finance/account`,
                    amount: window?.wNEARBalanceOnRef,
                    unit: "wNEAR",
                    noline: true
                },
                {
                    location: "",
                    link: `https://app.ref.finance/account`,
                    amount: window?.OCTBalanceOnRef,
                    unit: "OCT",
                    noline: true
                },
                {
                    location: "",
                    link: `https://app.ref.finance/account`,
                    amount: window?.stNEARBalanceOnRef,
                    unit: "stNEAR"
                },
                {
                    location: "NEAR wallet",
                    link: `https://wallet.near.org/`,
                    amount: window?.nativeNEARBalance,
                    unit: "NEAR",
                    noline: true
                },
                {
                    location: "",
                    link: `https://wallet.near.org/`,
                    amount: window?.stNEARBalance,
                    unit: "stNEAR"
                },
                {
                    location: "OCT <-> stNEAR Pool",
                    link: `https://app.ref.finance/pool/${NEW_POOL_ID}`,
                    amount: window?.newPoolInfo?.user_shares,
                    unit: "LP"
                },
                {
                    location: "OCT <-> stNEAR Farm",
                    link: `https://app.ref.finance/farms`,
                    amount: window?.newFarmingStake,
                    unit: "LP"
                }
            ]
            return (
                <>
                    <TableContainer>
                        <Table
                            stickyHeader
                            sx={{
                                width: 1
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell>Location</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell align="left"></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map(row => (
                                    <TableRow
                                        key={row.location}
                                        sx={
                                            row.noline
                                                ? {
                                                      "& *": {
                                                          border: 0
                                                      }
                                                  }
                                                : {
                                                      "&:last-child td, &:last-child th":
                                                          { border: 0 }
                                                  }
                                        }
                                    >
                                        <TableCell
                                            component="th"
                                            scope="row"
                                            sx={{
                                                cursor: "pointer"
                                            }}
                                            onClick={event =>
                                                (window.location.href =
                                                    row.link)
                                            }
                                        >
                                            {row.location !== "" ? (
                                                <>
                                                    {row.location}&nbsp;
                                                    <Icon
                                                        sx={{
                                                            verticalAlign:
                                                                "middle",
                                                            ml: 1,
                                                            color: "#aaa",
                                                            fontSize: "1.2em",
                                                            "&:hover": {
                                                                color: "#000"
                                                            }
                                                        }}
                                                    >
                                                        open_in_new
                                                    </Icon>
                                                </>
                                            ) : (
                                                <>&nbsp;</>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {row.amount
                                                ? yton(
                                                      row.amount +
                                                          (row.unit === "OCT"
                                                              ? "000000"
                                                              : "")
                                                  )!
                                                : "..."}{" "}
                                        </TableCell>
                                        <TableCell sx={{ width: "10ch" }}>
                                            {row.unit}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )

        default:
            return <TitleComponent title="Something went wrong" />
    }
}

let updatePage: any

export default function PageComponent(props: { page: number }) {
    const [, forceUpdate] = useReducer(x => x + 1, 0)
    updatePage = forceUpdate
    return (
        <Grid
            container
            sx={{
                width: .9,
                height: .85,
                m:"auto",
            }}
            direction="column"
            justifyContent="space-evenly"
            alignItems="center"
            wrap="nowrap"
        >
            {getContent(props.page)}
        </Grid>
    )
}
