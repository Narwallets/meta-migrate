import { Box, Grid, Icon } from "@mui/material"
import { utils } from "near-api-js"
import * as React from "react"
import { ReactNode, useReducer } from "react"
import meme from "../meme.png"
import {
    addLiquidityAndStake,
    calcLpSharesFromAmounts,
    exitOldPosition,
    getMetapoolInfo,
    getNativeNearBalance,
    getNewFarmingStake,
    getNewPoolInfo,
    getOctBalanceOnRef,
    getOldPosition,
    getStnearBalance,
    getStnearBalanceOnRef,
    getWnearBalanceOnRef,
    nearToStnear,
    NEW_POOL_ID,
    OLD_POOL_ID
} from "../services/near"
import { getMaxInvest, yton } from "../utils/math"
import { Refresh } from "../utils/refresh"
import { Break, Description, LineSpacing, Loading, Note, Purple } from "./description"
import { InputComponent, InputData } from "./input"
import LocateComponent from "./locate"
import NavButtonComponent from "./navbuttons"
import StepComponent from "./step"
import TitleComponent from "./title"

let NEAR: {
    newFarmingStake?: string
    oldPosition?: {
        user_total_shares: string
        user_farm_shares: string
        user_lp_shares: string
        total_shares: string
        min_amounts: string[]
    }
    newPoolInfo?: {
        user_shares: string
        total_shares: string
        amounts: string[]
    }
    stNEARPrice?: string
    minDepositAmount?: string
    wNEARBalanceOnRef?: string
    OCTBalanceOnRef?: string
    stNEARBalanceOnRef?: string
    stNEARBalance?: string
    nativeNEARBalance?: string
    lpSharesToStake?: string
} = {}

let stakeInput: InputData, OCTInput: InputData, stNEARInput: InputData
let refresh: Refresh[] = []

function getContent(page: number): ReactNode | null {
    switch (page) {
        case 0:
            // Define Inputs
            // -
            // Define Refresh
            refresh[0] ??= new Refresh(() =>
                getOldPosition().then(res => {
                    NEAR.oldPosition = res
                    return BigInt(res.user_lp_shares) === BigInt("0") && BigInt(res.user_farm_shares) === BigInt("0")
                })
            )
            // Define Values
            const [allShares, OCTPart, stNEARPart] = Loading(
                !!NEAR?.oldPosition,
                [
                    NEAR.oldPosition?.user_total_shares,
                    NEAR.oldPosition?.min_amounts[0] + "000000",
                    NEAR.oldPosition?.min_amounts[1]
                ],
                s => yton(s)!
            ) as string[]
            return (
                <>
                    <TitleComponent title="Exit OCT <-> wNEAR" step={1} />
                    <StepComponent
                        title={"Unstake & remove liquidity."}
                        description={
                            <Description>
                                Unstake your LP shares from the OCT {"<->"} wNEAR farm and remove liquidity from the OCT{" "}
                                {"<->"} wNEAR pool to receive OCT and wNEAR tokens. Your wNEAR will be withdrawn and
                                unwrapped automatically.
                                <LineSpacing />
                                You have a total of {""}
                                <Purple>{allShares}</Purple>&nbsp;LP&nbsp;shares
                                <Break />
                                {"\u2248"} <Purple>{OCTPart}</Purple>&nbsp;$OCT and <Purple>{stNEARPart}</Purple>
                                &nbsp;$NEAR.
                                <Break />
                                <Note>Execution might take a while.</Note>
                            </Description>
                        }
                        completed={refresh[0]}
                        action={() => {
                            localStorage.setItem("OCTminAmountOut", NEAR.oldPosition!.min_amounts[0])
                            localStorage.setItem("wNEARminAmountOut", NEAR.oldPosition!.min_amounts[1])
                            exitOldPosition(
                                NEAR.oldPosition!.user_farm_shares,
                                NEAR.oldPosition!.user_total_shares,
                                NEAR.oldPosition!.min_amounts
                            )
                        }}
                    />
                    <NavButtonComponent next />
                </>
            )

        case 1:
            // Define Inputs
            stakeInput ??= new InputData({
                value: utils.format.formatNearAmount(localStorage.getItem("wNEARminAmountOut") ?? "0"),
                pattern: /^\d+(\.\d{0,24})?$/,
                assert: [
                    {
                        test: (value: string) =>
                            NEAR.minDepositAmount !== undefined &&
                            BigInt(utils.format.parseNearAmount(value) ?? "0") < BigInt(NEAR.minDepositAmount),
                        msg: `Staking with MetaPool requires a minimum deposit of ${yton(
                            NEAR.minDepositAmount!,
                            2
                        )} $NEAR.`
                    },
                    {
                        test: (value: string) =>
                            NEAR.nativeNEARBalance !== undefined &&
                            BigInt(utils.format.parseNearAmount(value) ?? "0") > BigInt(NEAR.nativeNEARBalance),
                        msg: `Insufficient funds. You only have ${utils.format.formatNearAmount(
                            NEAR.nativeNEARBalance!
                        )} $NEAR in your wallet.`
                    }
                ]
            })
            // Define Refresh
            refresh[1] ??= new Refresh(
                () =>
                    Promise.all([getNativeNearBalance(), getWnearBalanceOnRef(), getMetapoolInfo()]).then(res => {
                        NEAR.nativeNEARBalance = res[0]
                        NEAR.wNEARBalanceOnRef = res[1]
                        NEAR.stNEARPrice = res[2].st_near_price
                        NEAR.minDepositAmount = res[2].min_deposit_amount
                        return BigInt(NEAR.nativeNEARBalance) < BigInt(NEAR.minDepositAmount)
                    }),
                0
            )
            // Define Values
            const balance = Loading(!!NEAR?.nativeNEARBalance, NEAR.nativeNEARBalance, s => yton(s)!)
            const inStNEAR = Loading(!!NEAR?.stNEARPrice, NEAR.stNEARPrice, s =>
                (stakeInput.data.error || !stakeInput.data.value
                    ? 0
                    : Number(BigInt(utils.format.parseNearAmount(stakeInput.data.value)! + "0000") / BigInt(s)) / 10000
                ).toFixed(5)
            )
            return (
                <>
                    <TitleComponent title="NEAR -> stNEAR" step={2} />
                    <StepComponent
                        title={"Stake NEAR."}
                        description={
                            <Description>
                                Stake your NEAR with MetaPool to get stNEAR.
                                <Break />
                                You currently have <Purple>{balance}</Purple> $NEAR in your wallet.
                                <Break />
                                <InputComponent data={stakeInput} label="amount" unit="NEAR" type="number" />
                                {""} {"\u2248"} {""}
                                <Purple>{inStNEAR}</Purple>&nbsp;$stNEAR.
                            </Description>
                        }
                        completed={refresh[1]}
                        denied={stakeInput.data.error}
                        action={() => nearToStnear(utils.format.parseNearAmount(stakeInput.data.value)!)}
                    />
                    <NavButtonComponent next back />
                </>
            )

        case 2:
            // Define Inputs
            if (NEAR.newPoolInfo !== undefined) {
                const values = getMaxInvest(
                    [
                        (BigInt(NEAR.stNEARBalanceOnRef!) + BigInt(NEAR.stNEARBalance!)).toString(),
                        NEAR.OCTBalanceOnRef!
                    ],
                    NEAR.newPoolInfo.amounts
                )
                OCTInput ??= new InputData({
                    value: yton(values[1] + "000000"),
                    pattern: /^\d+(\.\d{0,18})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.OCTBalanceOnRef !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") >
                                    BigInt(NEAR.OCTBalanceOnRef + "000000"),
                            msg: `Insufficient funds. You only have ${
                                NEAR.OCTBalanceOnRef !== undefined ? yton(NEAR.OCTBalanceOnRef + "000000") : "..."
                            } $OCT on Ref-finance.`
                        }
                    ]
                })

                stNEARInput ??= new InputData({
                    value: yton(values[0]),
                    pattern: /^\d+(\.\d{0,24})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.stNEARBalanceOnRef !== undefined &&
                                NEAR.stNEARBalance !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") >
                                    BigInt(NEAR.stNEARBalanceOnRef) + BigInt(NEAR.stNEARBalance),
                            msg: `Insufficient funds. You only have ${yton(
                                (BigInt(NEAR.stNEARBalanceOnRef ?? "0") + BigInt(NEAR.stNEARBalance ?? "0")).toString()
                            )} stNEAR in total.`
                        }
                    ]
                })

                NEAR.lpSharesToStake = calcLpSharesFromAmounts(
                    NEAR.newPoolInfo.total_shares,
                    NEAR.newPoolInfo.amounts,
                    [
                        utils.format.parseNearAmount(stNEARInput.data.error ? "0" : stNEARInput.data.value ?? "0")!,
                        (
                            BigInt(
                                utils.format.parseNearAmount(OCTInput.data.error ? "0" : OCTInput.data.value ?? "0")!
                            ) / BigInt("1000000")
                        ).toString()
                    ]
                )
            }
            // Define Refresh
            refresh[2] ??= new Refresh(() =>
                Promise.all([getNewPoolInfo(), getOctBalanceOnRef(), getStnearBalanceOnRef(), getStnearBalance()]).then(
                    res => {
                        NEAR.newPoolInfo = res[0]
                        NEAR.OCTBalanceOnRef = res[1]
                        NEAR.stNEARBalanceOnRef = res[2]
                        NEAR.stNEARBalance = res[3]
                        return false
                    }
                )
            )
            // Define Values
            const OCTBalance = Loading(!!NEAR.OCTBalanceOnRef, NEAR.OCTBalanceOnRef + "000000", s => yton(s)!)
            const inLPShares = Loading(!!NEAR.newPoolInfo, NEAR.lpSharesToStake, s => yton(s)!)
            const stNEARBalance =
                NEAR.stNEARBalance !== undefined && NEAR.stNEARBalanceOnRef !== undefined
                    ? yton((BigInt(NEAR.stNEARBalance) + BigInt(NEAR.stNEARBalanceOnRef)).toString())
                    : "..."
            return (
                <>
                    <TitleComponent title="Enter OCT <-> stNEAR" step={3} />
                    <StepComponent
                        title={"Provide liquidity & farm."}
                        description={
                            <Description>
                                <Break />
                                You have <Purple>{OCTBalance}</Purple>&nbsp;$OCT
                                {""} and <Purple>{stNEARBalance}</Purple>&nbsp;$stNEAR.
                                <Break />
                                <InputComponent
                                    data={OCTInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="OCT"
                                    type="number"
                                    onChange={(value: string) => {
                                        if (NEAR.newPoolInfo !== undefined && !OCTInput.data.error) {
                                            // https://stackoverflow.com/a/54409977/17894968
                                            stNEARInput.data.unmatched = (
                                                parseFloat(value) /
                                                (Number(
                                                    (BigInt("10000000000") *
                                                        BigInt("1000000") *
                                                        BigInt(NEAR.newPoolInfo.amounts[1])) /
                                                        BigInt(NEAR.newPoolInfo.amounts[0])
                                                ) /
                                                    10000000000)
                                            ).toFixed(5) // TODO: check if final pool is [OCT, stNEAR] or [stNEAR, OCT]
                                        }
                                    }}
                                />
                                <Icon sx={{ alignSelf: "center" }}>link</Icon>
                                <InputComponent
                                    data={stNEARInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="stNEAR"
                                    type="number"
                                    onChange={(value: string) => {
                                        if (NEAR.newPoolInfo !== undefined && !stNEARInput.data.error) {
                                            stNEARInput.data.unmatched = (
                                                (parseFloat(value) *
                                                    Number(
                                                        (BigInt("10000000000") *
                                                            BigInt("1000000") *
                                                            BigInt(NEAR.newPoolInfo.amounts[1])) /
                                                            BigInt(NEAR.newPoolInfo.amounts[0])
                                                    )) /
                                                10000000000
                                            ).toFixed(5) // TODO: check if final pool is [OCT, stNEAR] or [stNEAR, OCT]
                                        }
                                    }}
                                />
                                <Break />
                                {"\u2248"} <Purple>{inLPShares}</Purple>&nbsp;LP&nbsp;shares.
                            </Description>
                        }
                        denied={
                            !OCTInput ||
                            !stNEARInput ||
                            OCTInput.data.error ||
                            stNEARInput.data.error ||
                            parseFloat(OCTInput.data.unmatched) === 0 ||
                            parseFloat(stNEARInput.data.unmatched) === 0
                        }
                        completed={refresh[2]}
                        action={() => {
                            addLiquidityAndStake(
                                (
                                    BigInt(utils.format.parseNearAmount(stNEARInput.data.value)!) -
                                    BigInt(NEAR.stNEARBalanceOnRef!)
                                ).toString(),
                                [
                                    utils.format.parseNearAmount(stNEARInput.data.value)!,
                                    (
                                        BigInt(utils.format.parseNearAmount(OCTInput.data.value)!) / BigInt("1000000")
                                    ).toString()
                                ],
                                NEAR.lpSharesToStake!
                            )
                        }}
                    />
                    <NavButtonComponent next back />
                </>
            )

        case 3:
            // Define Inputs
            // -
            // Define Refresh
            refresh[3] ??= new Refresh(
                () =>
                    getNewFarmingStake().then(res => {
                        NEAR.newFarmingStake = res
                        return true
                    }),
                0
            )
            // Define Values
            const farmingStake = Loading(!!NEAR.newFarmingStake, NEAR.newFarmingStake, s => yton(s)!)
            return (
                <>
                    <TitleComponent title="Happy Farming!" />
                    <img src={meme} alt="meme" />
                    <Box sx={{ my: 2 }}>
                        You currently have <Purple>{farmingStake}</Purple>&nbsp;LP&nbsp;shares in the farm.
                    </Box>
                    <NavButtonComponent back />
                </>
            )

        case 4:
            // Define Inputs
            // -
            // Define Refresh
            refresh[4] ??= new Refresh(
                () =>
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
                        NEAR.oldPosition = res[0]
                        NEAR.wNEARBalanceOnRef = res[1]
                        NEAR.stNEARBalanceOnRef = res[2]
                        NEAR.OCTBalanceOnRef = res[3]
                        NEAR.stNEARBalance = res[4]
                        NEAR.nativeNEARBalance = res[5]
                        NEAR.newPoolInfo = res[6]
                        NEAR.newFarmingStake = res[7]
                        return true
                    }),
                0
            )
            // Define Values
            const rows = [
                {
                    location: "OCT <-> wNEAR Farm",
                    link: `https://app.ref.finance/farms`,
                    amount: NEAR?.oldPosition?.user_farm_shares,
                    unit: "LP"
                },
                {
                    location: "OCT <-> wNEAR Pool",
                    link: `https://app.ref.finance/pool/${OLD_POOL_ID}`,
                    amount: NEAR?.oldPosition?.user_lp_shares,
                    unit: "LP"
                },
                {
                    location: "Ref-Finance",
                    link: `https://app.ref.finance/account`,
                    amount: NEAR?.wNEARBalanceOnRef,
                    unit: "wNEAR",
                    noline: true
                },
                {
                    location: "",
                    link: `https://app.ref.finance/account`,
                    amount: NEAR?.OCTBalanceOnRef,
                    unit: "OCT",
                    noline: true
                },
                {
                    location: "",
                    link: `https://app.ref.finance/account`,
                    amount: NEAR?.stNEARBalanceOnRef,
                    unit: "stNEAR"
                },
                {
                    location: "NEAR wallet",
                    link: `https://wallet.near.org/`,
                    amount: NEAR?.nativeNEARBalance,
                    unit: "NEAR",
                    noline: true
                },
                {
                    location: "",
                    link: `https://wallet.near.org/`,
                    amount: NEAR?.stNEARBalance,
                    unit: "stNEAR"
                },
                {
                    location: "OCT <-> stNEAR Pool",
                    link: `https://app.ref.finance/pool/${NEW_POOL_ID}`,
                    amount: NEAR?.newPoolInfo?.user_shares,
                    unit: "LP"
                },
                {
                    location: "OCT <-> stNEAR Farm",
                    link: `https://app.ref.finance/farms`,
                    amount: NEAR?.newFarmingStake,
                    unit: "LP"
                }
            ]
            return <LocateComponent rows={rows} />

        default:
            return <TitleComponent title="Something went wrong" />
    }
}

export default function PageComponent(props: { page: number }) {
    const [, forceUpdate] = useReducer(x => x + 1, 0)
    window.updatePage = forceUpdate
    return (
        <Grid
            container
            sx={{
                width: 1,
                height: 1,
                p: 4,
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
