import { utils } from "near-api-js"
import * as React from "react"
import { ReactNode, useEffect, useState } from "react"
import { Refresh } from "../../utils/refresh"
import meme from "../../memes/1.png"
import { Break, Description, LineSpacing, Loading, Note, Purple } from "../../components/description"
import { InputComponent, InputData } from "../../components/input"
import LocateComponent from "../../components/locate"
import NavButtonComponent from "../../components/navbuttons"
import StepComponent from "../../components/step"
import TitleComponent from "../../components/title"
import { bigMax, getMaxInvest, yton } from "../../utils/math"
import Logic from "./logic"
import { getFarmAPR } from "../../utils/apr"
import { Box, Icon } from "@mui/material"

const NEAR = new Logic()

let allowanceInput: InputData, stNEARInput: InputData, METAInput: InputData
let refresh: Refresh[] = []

// input debouncer
let inputUpdated = new Date()

export const steps: string[] = ["get tokens", "enter farm", "profit"]

export function getContent(page: number): ReactNode | null {
    switch (page) {
        case 0:
            if (!!NEAR.stNEARPrice && !!NEAR.poolInfo) {
                NEAR.stNEARReceived = NEAR.estimateStnearOut(
                    utils.format.parseNearAmount(allowanceInput?.data.value ?? "0")!,
                    NEAR.stNEARPrice
                )
                NEAR.stNEARToSwap = NEAR.estimateStnearIn(NEAR.stNEARReceived, NEAR.poolInfo)
            }
            // Define Inputs
            if (NEAR.minDepositAmount !== undefined && NEAR.nativeNEARBalance !== undefined)
                allowanceInput ??= new InputData({
                    value: Math.max(Number(yton(NEAR.nativeNEARBalance!, 5)) - 5, 0).toString(),
                    pattern: /^\d+(\.\d{0,24})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.minDepositAmount !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") < BigInt(NEAR.minDepositAmount),
                            msg: () => `This recipe requires a minimum of ${yton(NEAR.minDepositAmount!, 2)} $NEAR.`
                        },
                        {
                            test: (value: string) =>
                                NEAR.nativeNEARBalance !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") > BigInt(NEAR.nativeNEARBalance),
                            msg: () =>
                                `Insufficient funds. You only have ${utils.format.formatNearAmount(
                                    NEAR.nativeNEARBalance!
                                )} $NEAR in your wallet.`
                        }
                    ]
                })
            // Define Refresh
            refresh[0] ??= new Refresh(() =>
                Promise.all([
                    NEAR.getMetapoolInfo(),
                    NEAR.getNativeNearBalance(),
                    NEAR.estimateMetaOut(NEAR.stNEARToSwap ?? "0"),
                    NEAR.getPoolInfo(NEAR.STNEAR_META_POOL_ID)
                ]).then(async res => {
                    NEAR.minDepositAmount = res[0].min_deposit_amount
                    NEAR.stNEARPrice = res[0].st_near_price
                    NEAR.nativeNEARBalance = res[1]
                    NEAR.METAOut = res[2]
                    NEAR.poolInfo = res[3]
                    if (NEAR.stNEARToSwap === undefined) {
                        const nearToUse: string = bigMax([
                            (BigInt(NEAR.nativeNEARBalance) - BigInt(utils.format.parseNearAmount("5")!)).toString(),
                            BigInt("0").toString()
                        ])
                        NEAR.stNEARReceived = NEAR.estimateStnearOut(nearToUse!, NEAR.stNEARPrice)
                        const stnearToSwap: string = NEAR.estimateStnearIn(NEAR.stNEARReceived, NEAR.poolInfo)
                        NEAR.METAOut = await NEAR.estimateMetaOut(stnearToSwap)
                    }
                    return BigInt(NEAR.nativeNEARBalance) < BigInt(NEAR.minDepositAmount)
                })
            )
            // Define Values
            const balance = Loading(!!NEAR?.nativeNEARBalance, NEAR.nativeNEARBalance, s => yton(s)!)
            const METAOut = Loading(!!NEAR?.METAOut, NEAR.METAOut, s => yton(s)!)
            const stNEAROut =
                NEAR.stNEARReceived !== undefined && NEAR.stNEARToSwap !== undefined
                    ? yton((BigInt(NEAR.stNEARReceived) - BigInt(NEAR.stNEARToSwap)).toString())
                    : "..."
            return (
                <>
                    <TitleComponent title="NEAR -> stNEAR & META" step={1} />
                    <StepComponent
                        title={"Specify the recipe allowace in $NEAR."}
                        description={
                            <Description>
                                Your NEAR will be staked with <Purple>MetaPool</Purple> to get stNEAR. {""}
                                Half of it will be swapped for META.
                                <Break />
                                You currently have <Purple>{balance}</Purple>&nbsp;$NEAR in your wallet.
                                <Break />
                                <InputComponent
                                    data={allowanceInput ?? new InputData({ value: "" })}
                                    label="recipe allowance"
                                    type="number"
                                    unit="NEAR"
                                    onChange={() => {
                                        setTimeout(async () => {
                                            if (
                                                new Date().getTime() - inputUpdated.getTime() > 400 &&
                                                !!NEAR.stNEARPrice &&
                                                !!NEAR.poolInfo
                                            ) {
                                                NEAR.stNEARReceived = NEAR.estimateStnearOut(
                                                    utils.format.parseNearAmount(allowanceInput?.data.value ?? "0")!,
                                                    NEAR.stNEARPrice
                                                )
                                                NEAR.METAOut = await NEAR.estimateMetaOut(
                                                    NEAR.estimateStnearIn(NEAR.stNEARReceived, NEAR.poolInfo)
                                                )
                                                window.updatePage()
                                            }
                                        }, 500)
                                        NEAR.METAOut = undefined
                                        inputUpdated = new Date()
                                    }}
                                />
                                <Break />
                                {"\u2248"} <Purple>{stNEAROut}</Purple>&nbsp;$stNEAR + {""}
                                <Purple>{METAOut}</Purple>&nbsp;$META.
                            </Description>
                        }
                        denied={allowanceInput?.data.error || !NEAR.METAOut || BigInt(NEAR.METAOut) === BigInt(0)}
                        completed={refresh[0]}
                        action={() => {
                            NEAR.stepOneAction({
                                near_amount: utils.format.parseNearAmount(allowanceInput.data.value)!,
                                min_meta_out: NEAR.METAOut!
                            })
                        }}
                    />
                    <NavButtonComponent next />
                </>
            )

        case 1:
            // Define Inputs
            if (NEAR.poolInfo !== undefined && NEAR.stNEARBalance !== undefined && NEAR.METABalance !== undefined) {
                const values = getMaxInvest([NEAR.stNEARBalance!, NEAR.METABalance!], NEAR.poolInfo.pool_amounts)
                METAInput ??= new InputData({
                    value: yton(values[1]),
                    pattern: /^\d+(\.\d{0,18})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.METABalance !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") > BigInt(NEAR.METABalance),
                            msg: () =>
                                `Insufficient funds. You only have ${
                                    NEAR.METABalance !== undefined ? yton(NEAR.METABalance) : "..."
                                } $META.`
                        }
                    ]
                })

                stNEARInput ??= new InputData({
                    value: yton(values[0]),
                    pattern: /^\d+(\.\d{0,24})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.stNEARBalance !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") > BigInt(NEAR.stNEARBalance),
                            msg: () =>
                                `Insufficient funds. You only have ${
                                    NEAR.stNEARBalance !== undefined ? yton(NEAR.stNEARBalance) : "..."
                                } $stNEAR.`
                        }
                    ]
                })

                NEAR.lpSharesToStake = NEAR.calcLpSharesFromAmounts(
                    NEAR.poolInfo.total_shares,
                    NEAR.poolInfo.pool_amounts,
                    [
                        utils.format.parseNearAmount(stNEARInput.data.error ? "0" : stNEARInput.data.value ?? "0")!,
                        utils.format.parseNearAmount(METAInput.data.error ? "0" : METAInput.data.value ?? "0")!
                    ]
                )
            }
            // Define Refresh
            refresh[1] ??= new Refresh(
                () =>
                    Promise.all([
                        NEAR.getPoolInfo(NEAR.STNEAR_META_POOL_ID),
                        NEAR.getTokenBalances([NEAR.ADDRESS_METAPOOL, NEAR.ADDRESS_META_TOKEN])
                    ]).then(res => {
                        NEAR.poolInfo = res[0]
                        NEAR.stNEARBalance = res[1][0]
                        NEAR.METABalance = res[1][1]
                        return false
                    }),
                0
            )
            // Define Values
            const inLPShares = Loading(!!NEAR.poolInfo, NEAR.lpSharesToStake, s => yton(s)!)
            const stNEARBalance = Loading(!!NEAR.stNEARBalance, NEAR.stNEARBalance, s => yton(s)!)
            const METABalance = Loading(!!NEAR.METABalance, NEAR.METABalance, s => yton(s)!)
            return (
                <>
                    <TitleComponent title="Enter stNEAR <-> META farm" step={2} />
                    <StepComponent
                        title={"Provide LP and stake."}
                        description={
                            <Description>
                                Provided your tokens as liquidity in the stNEAR {"<->"} META pool and {""}
                                put your LP Shares into the stNEAR {"<->"} META farm. {""}
                                <LineSpacing />
                                You currently have <Purple>{stNEARBalance}</Purple>&nbsp;$stNEAR and {""}
                                <Purple>{METABalance}</Purple>&nbsp;$META.
                                <Break />
                                <InputComponent
                                    data={stNEARInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="stNEAR"
                                    type="number"
                                    onChange={(value: string) => {
                                        if (NEAR.poolInfo !== undefined && !stNEARInput.data.error) {
                                            METAInput.data.unmatched = (
                                                (parseFloat(value) *
                                                    Number(
                                                        (BigInt("10000000000") *
                                                            BigInt(NEAR.poolInfo.pool_amounts[1])) /
                                                            BigInt(NEAR.poolInfo.pool_amounts[0])
                                                    )) /
                                                10000000000
                                            ).toFixed(5) // TODO: check if final pool is [META, stNEAR] or [stNEAR, META]
                                        }
                                    }}
                                />
                                <Icon sx={{ alignSelf: "center" }}>link</Icon>
                                <InputComponent
                                    data={METAInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="META"
                                    type="number"
                                    onChange={(value: string) => {
                                        if (NEAR.poolInfo !== undefined && !METAInput.data.error) {
                                            // https://stackoverflow.com/a/54409977/17894968
                                            stNEARInput.data.unmatched = (
                                                parseFloat(value) /
                                                (Number(
                                                    (BigInt("10000000000") * BigInt(NEAR.poolInfo.pool_amounts[1])) /
                                                        BigInt(NEAR.poolInfo.pool_amounts[0])
                                                ) /
                                                    10000000000)
                                            ).toFixed(5) // TODO: check if final pool is [META, stNEAR] or [stNEAR, META]
                                        }
                                    }}
                                />
                                <Break />
                                {"\u2248"} <Purple>{inLPShares}</Purple>&nbsp;LP&nbsp;shares.
                                <Break />
                                <Note>Execution might take a while.</Note>
                            </Description>
                        }
                        denied={
                            !METAInput ||
                            !stNEARInput ||
                            METAInput.data.error ||
                            stNEARInput.data.error ||
                            parseFloat(METAInput.data.unmatched) === 0 ||
                            parseFloat(stNEARInput.data.unmatched) === 0
                        }
                        completed={refresh[1]}
                        action={() => {
                            NEAR.stepTwoAction({
                                stnearAmount: utils.format.parseNearAmount(stNEARInput.data.value)!,
                                metaAmount: utils.format.parseNearAmount(METAInput.data.value)!
                            })
                        }}
                    />
                    <NavButtonComponent back next />
                </>
            )

        case 2:
            // Define Inputs
            // -
            // Define Refresh
            refresh[2] ??= new Refresh(
                () =>
                    NEAR.getFarmingStake(NEAR.STNEAR_META_POOL_ID).then(res => {
                        NEAR.farmShares = res
                        return true
                    }),
                0
            )
            // Define Values
            const farmingStake = Loading(!!NEAR.farmShares, NEAR.farmShares, s => yton(s)!)
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

        case 3:
            // Define Inputs
            // -
            // Define Refresh
            refresh[3] ??= new Refresh(
                () =>
                    Promise.all([
                        NEAR.getTokenBalancesOnRef([NEAR.ADDRESS_METAPOOL, NEAR.ADDRESS_META_TOKEN]),
                        NEAR.getTokenBalances([NEAR.ADDRESS_METAPOOL, NEAR.ADDRESS_META_TOKEN]),
                        NEAR.getNativeNearBalance(),
                        NEAR.getPoolInfo(NEAR.STNEAR_META_POOL_ID),
                        NEAR.getFarmingStake(NEAR.STNEAR_META_POOL_ID)
                    ]).then(res => {
                        NEAR.METABalanceOnRef = res[0][1]
                        NEAR.stNEARBalanceOnRef = res[0][0]
                        NEAR.stNEARBalance = res[1][0]
                        NEAR.METABalance = res[1][1]
                        NEAR.nativeNEARBalance = res[2]
                        NEAR.poolShares = res[3].user_shares
                        NEAR.farmShares = res[4]
                        return true
                    }),
                0
            )
            // Define Values
            const rows = [
                {
                    location: "Ref-Finance",
                    link: `https://app.ref.finance/account`,
                    amount: NEAR?.METABalanceOnRef,
                    unit: "META",
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
                    amount: NEAR?.METABalance,
                    unit: "META",
                    noline: true
                },
                {
                    location: "",
                    link: `https://wallet.near.org/`,
                    amount: NEAR?.stNEARBalance,
                    unit: "stNEAR"
                },
                {
                    location: "stNEAR <-> META Pool",
                    link: `https://app.ref.finance/pool/${NEAR.STNEAR_META_POOL_ID}`,
                    amount: NEAR?.poolShares,
                    unit: "LP"
                },
                {
                    location: "stNEAR <-> META Farm",
                    link: `https://app.ref.finance/farms`,
                    amount: NEAR?.farmShares,
                    unit: "LP"
                }
            ]
            return <LocateComponent rows={rows} />

        default:
            return <TitleComponent title="Something went wrong" />
    }
}

export function APY() {
    const [percentage, setPercentage] = useState("...")
    useEffect(() => {
        async function getPercentage() {
            let percentage = (await getFarmAPR())?.ref_meta_st_near_apr
            if (isNaN(percentage) || percentage === 0) {
                percentage = "..."
            }
            setPercentage(percentage)
        }
        getPercentage()
    }, [percentage])
    return <span>{percentage !== "..." ? Math.round(Number(percentage)) + "%" : "..."}</span>
}
