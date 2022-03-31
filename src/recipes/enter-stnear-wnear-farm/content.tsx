import * as React from "react"
import { ReactNode, useEffect, useState } from "react"
import { Description, Break, Loading, Purple, Note, LineSpacing } from "../../components/description"
import { InputData, InputComponent } from "../../components/input"
import LocateComponent from "../../components/locate"
import NavButtonComponent from "../../components/navbuttons"
import StepComponent from "../../components/step"
import TitleComponent from "../../components/title"
import meme from "../../memes/2.gif"
import { Refresh } from "../../utils/refresh"
import { utils } from "near-api-js"
import { getMaxInvest, yton } from "../../utils/math"
import Logic from "./logic"
import { getFarmAPR } from "../../utils/apr"
import { Box, Icon } from "@mui/material"

const NEAR = new Logic()

let allowanceInput: InputData, wNEARInput: InputData, stNEARInput: InputData
let refresh: Refresh[] = []

export const steps: string[] = ["get tokens", "enter farm", "profit", "locate my funds"]

export function getContent(page: number): ReactNode | null {
    switch (page) {
        case 0:
            // Define Inputs
            if (NEAR.minDepositAmount !== undefined && NEAR.nativeNEARBalance !== undefined)
                allowanceInput ??= new InputData({
                    value: Math.max(Number(yton(NEAR.nativeNEARBalance!, 5)) - 5, 0).toString(),
                    pattern: /^\d+(\.\d{0,24})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.minDepositAmount !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") <
                                    BigInt(2) * BigInt(NEAR.minDepositAmount),
                            msg: () =>
                                `This recipe requires a minimum of ${yton(
                                    (BigInt(2) * BigInt(NEAR.minDepositAmount!)).toString(),
                                    2
                                )} $NEAR.`
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
            refresh[0] ??= new Refresh(
                () =>
                    Promise.all([NEAR.getMetapoolInfo(), NEAR.getNativeNearBalance()]).then(res => {
                        NEAR.minDepositAmount = res[0].min_deposit_amount
                        NEAR.nativeNEARBalance = res[1]
                        return BigInt(NEAR.nativeNEARBalance) < BigInt(2) * BigInt(NEAR.minDepositAmount)
                    }),
                0
            )
            // Define Values
            const balance = Loading(!!NEAR?.nativeNEARBalance, NEAR.nativeNEARBalance, s => yton(s)!)
            return (
                <>
                    <TitleComponent title="NEAR -> stNEAR & wNEAR" step={1} />
                    <StepComponent
                        title={"Specify the recipe allowace in $NEAR."}
                        description={
                            <Description>
                                Your NEAR will be staked and wrapped in equal parts.
                                <Break />
                                You currently have <Purple>{balance}</Purple>&nbsp;$NEAR in your wallet.
                                <Break />
                                <InputComponent
                                    data={allowanceInput ?? new InputData({ value: "" })}
                                    label="recipe allowance"
                                    type="number"
                                    unit="NEAR"
                                />
                            </Description>
                        }
                        denied={allowanceInput?.data.error}
                        completed={refresh[0]}
                        action={() => {
                            NEAR.stepOneAction(utils.format.parseNearAmount(allowanceInput.data.value)!)
                        }}
                    />
                    <NavButtonComponent next completed={refresh[0]}/>
                </>
            )

        case 1:
            // Define Inputs
            if (NEAR.poolInfo !== undefined && NEAR.stNEARBalance !== undefined && NEAR.wNEARBalance !== undefined) {
                const values = getMaxInvest([NEAR.stNEARBalance!, NEAR.wNEARBalance!], NEAR.poolInfo.pool_amounts)
                wNEARInput ??= new InputData({
                    value: yton(values[1]),
                    pattern: /^\d+(\.\d{0,18})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.wNEARBalance !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") > BigInt(NEAR.wNEARBalance),
                            msg: () =>
                                `Insufficient funds. You only have ${
                                    NEAR.wNEARBalance !== undefined ? yton(NEAR.wNEARBalance) : "..."
                                } $wNEAR.`
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
                        utils.format.parseNearAmount(wNEARInput.data.error ? "0" : wNEARInput.data.value ?? "0")!
                    ]
                )
            }
            // Define Refresh
            refresh[1] ??= new Refresh(
                () =>
                    Promise.all([
                        NEAR.getPoolInfo(NEAR.STNEAR_WNEAR_POOL_ID),
                        NEAR.getTokenBalances([NEAR.ADDRESS_METAPOOL, NEAR.ADDRESS_WNEAR])
                    ]).then(res => {
                        NEAR.poolInfo = res[0]
                        NEAR.stNEARBalance = res[1][0]
                        NEAR.wNEARBalance = res[1][1]
                        return false
                    }),
                0
            )
            // Define Values
            const inLPShares = Loading(!!NEAR.poolInfo, NEAR.lpSharesToStake, s => yton(s)!)
            const stNEARBalance = Loading(!!NEAR.stNEARBalance, NEAR.stNEARBalance, s => yton(s)!)
            const wNEARBalance = Loading(!!NEAR.wNEARBalance, NEAR.wNEARBalance, s => yton(s)!)
            return (
                <>
                    <TitleComponent title="Enter stNEAR <-> wNEAR farm" step={2} />
                    <StepComponent
                        title={"Provide LP and stake."}
                        description={
                            <Description>
                                Provide your tokens as liquidity in the stNEAR {"<->"} wNEAR pool and {""}
                                put your LP Shares into the stNEAR {"<->"} wNEAR farm. {""}
                                <LineSpacing />
                                You currently have <Purple>{stNEARBalance}</Purple>&nbsp;$stNEAR and {""}
                                <Purple>{wNEARBalance}</Purple>&nbsp;$wNEAR.
                                <Break />
                                <InputComponent
                                    data={stNEARInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="stNEAR"
                                    type="number"
                                    onChange={(value: string) => {
                                        if (NEAR.poolInfo !== undefined && !stNEARInput.data.error) {
                                            wNEARInput.data.unmatched = (
                                                (parseFloat(value) *
                                                    Number(
                                                        (BigInt("10000000000") *
                                                            BigInt(NEAR.poolInfo.pool_amounts[1])) /
                                                            BigInt(NEAR.poolInfo.pool_amounts[0])
                                                    )) /
                                                10000000000
                                            ).toFixed(5) // TODO: check if final pool is [wNEAR, stNEAR] or [stNEAR, wNEAR]
                                        }
                                    }}
                                />
                                <Icon sx={{ alignSelf: "center" }}>link</Icon>
                                <InputComponent
                                    data={wNEARInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="wNEAR"
                                    type="number"
                                    onChange={(value: string) => {
                                        if (NEAR.poolInfo !== undefined && !wNEARInput.data.error) {
                                            // https://stackoverflow.com/a/54409977/17894968
                                            stNEARInput.data.unmatched = (
                                                parseFloat(value) /
                                                (Number(
                                                    (BigInt("10000000000") * BigInt(NEAR.poolInfo.pool_amounts[1])) /
                                                        BigInt(NEAR.poolInfo.pool_amounts[0])
                                                ) /
                                                    10000000000)
                                            ).toFixed(5) // TODO: check if final pool is [wNEAR, stNEAR] or [stNEAR, wNEAR]
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
                            !wNEARInput ||
                            !stNEARInput ||
                            wNEARInput.data.error ||
                            stNEARInput.data.error ||
                            parseFloat(wNEARInput.data.unmatched) === 0 ||
                            parseFloat(stNEARInput.data.unmatched) === 0
                        }
                        completed={refresh[1]}
                        action={() => {
                            NEAR.stepTwoAction({
                                stnearAmount: utils.format.parseNearAmount(stNEARInput.data.value)!,
                                wnearAmount: utils.format.parseNearAmount(wNEARInput.data.value)!
                            })
                        }}
                    />
                    <NavButtonComponent next completed={refresh[1]}/>
                </>
            )

        case 2:
            // Define Inputs
            // -
            // Define Refresh
            refresh[3] ??= new Refresh(
                () =>
                    NEAR.getFarmingStake(NEAR.STNEAR_WNEAR_POOL_ID).then(res => {
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
                    <img src={meme} style={{ maxHeight: "75%" }} alt="meme" />
                    <Box className="lp-balance-container" sx={{ my: 2 }}>
                        You currently have <Purple>{farmingStake}</Purple>&nbsp;LP&nbsp;shares in the farm.
                    </Box>
                    <NavButtonComponent back />
                </>
            )

        case 3:
            // Define Inputs
            // -
            // Define Refresh
            refresh[4] ??= new Refresh(
                () =>
                    Promise.all([
                        NEAR.getTokenBalancesOnRef([NEAR.ADDRESS_METAPOOL, NEAR.ADDRESS_WNEAR]),
                        NEAR.getTokenBalances([NEAR.ADDRESS_METAPOOL, NEAR.ADDRESS_WNEAR]),
                        NEAR.getNativeNearBalance(),
                        NEAR.getPoolInfo(NEAR.STNEAR_WNEAR_POOL_ID),
                        NEAR.getFarmingStake(NEAR.STNEAR_WNEAR_POOL_ID)
                    ]).then(res => {
                        NEAR.wNEARBalanceOnRef = res[0][1]
                        NEAR.stNEARBalanceOnRef = res[0][0]
                        NEAR.stNEARBalance = res[1][0]
                        NEAR.wNEARBalance = res[1][1]
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
                    amount: NEAR?.wNEARBalanceOnRef,
                    unit: "wNEAR",
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
                    amount: NEAR?.wNEARBalance,
                    unit: "wNEAR",
                    noline: true
                },
                {
                    location: "",
                    link: `https://wallet.near.org/`,
                    amount: NEAR?.stNEARBalance,
                    unit: "stNEAR"
                },
                {
                    location: "stNEAR <-> wNEAR Pool",
                    link: `https://app.ref.finance/pool/${NEAR.NEW_POOL_ID}`,
                    amount: NEAR?.poolShares,
                    unit: "LP"
                },
                {
                    location: "stNEAR <-> wNEAR Farm",
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
            let percentage = (await getFarmAPR())?.ref_wnear_st_near_apr
            if (isNaN(percentage) || percentage === 0) {
                percentage = "..."
            }
            setPercentage(percentage)
        }
        getPercentage()
    }, [percentage])
    return <span>{percentage !== "..." ? Math.round(Number(percentage)) + "%" : "..."}</span>
}
