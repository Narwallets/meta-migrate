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
import { yton } from "../../utils/math"
import Logic from "./logic"
import { getFarmAPR } from "../../utils/apr"
import { Box, Icon } from "@mui/material"

const NEAR = new Logic()

let allowanceInput: InputData, NEARInput: InputData, stNEARInput: InputData
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
                                    (BigInt(1) * BigInt(NEAR.minDepositAmount)) / BigInt(10),
                            msg: () =>
                                `This recipe requires a minimum of ${yton(
                                    (BigInt(1) * BigInt(NEAR.minDepositAmount!)).toString(),
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
                        return BigInt(NEAR.nativeNEARBalance) < (BigInt(1) * BigInt(NEAR.minDepositAmount)) / BigInt(10)
                    }),
                0
            )
            // Define Values
            const balance = Loading(!!NEAR?.nativeNEARBalance, NEAR.nativeNEARBalance, s => yton(s)!)
            return (
                <>
                    <TitleComponent title="NEAR -> stNEAR" step={1} />
                    <StepComponent
                        title={"Specify the recipe allowace in $NEAR."}
                        description={
                            <Description>
                                Your NEAR will be staked
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
                    <NavButtonComponent
                        next
                        completed={refresh[0]}
                        action={() => {
                            NEAR.stepOneAction(utils.format.parseNearAmount(allowanceInput.data.value)!)
                        }}
                        denied={allowanceInput?.data.error}
                    />
                </>
            )

        case 1:
            // Define Inputs
            if (NEAR.stNEARBalance !== undefined && NEAR.NEARBalance !== undefined) {
                const values = [NEAR.stNEARBalance!, NEAR.NEARBalance!]
                NEARInput ??= new InputData({
                    value: yton(values[1]),
                    pattern: /^\d+(\.\d{0,24})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.NEARBalance !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") > BigInt(NEAR.NEARBalance),
                            msg: () =>
                                `Insufficient funds. You only have ${
                                    NEAR.NEARBalance !== undefined ? yton(NEAR.NEARBalance) : "..."
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

                NEAR.lpSharesToStake = NEAR.calcLpSharesFromAmountsForStableStNearNear(
                    "0",
                    [stNEARInput.data.value, NEARInput.data.value],
                    [
                        utils.format.parseNearAmount(stNEARInput.data.error ? "0" : stNEARInput.data.value ?? "0")!,
                        utils.format.parseNearAmount(NEARInput.data.error ? "0" : NEARInput.data.value ?? "0")!
                    ]
                )
            }
            // Define Refresh
            refresh[1] ??= new Refresh(
                () =>
                    Promise.all([
                        // NEAR.getPoolInfo(NEAR.STNEAR_WNEAR_STABLE_POOL_ID),
                        NEAR.getTokenBalances([NEAR.ADDRESS_METAPOOL]),
                        NEAR.getNativeNearBalance(),
                        NEAR.getIsFarmActive(NEAR.STNEAR_WNEAR_STABLE_POOL_ID)
                    ]).then(res => {
                        // NEAR.poolInfo = res[0]
                        NEAR.stNEARBalance = res[0][0]
                        NEAR.NEARBalance = res[1]
                        NEAR.isFarmActive = res[2]
                        return false
                    }),
                0
            )
            // Define Values
            const inLPShares = Loading(!!NEAR.stNEARBalance, NEAR.lpSharesToStake, s => yton(s)!)
            const stNEARBalance = Loading(!!NEAR.stNEARBalance, NEAR.stNEARBalance, s => yton(s)!)
            const NEARBalance = Loading(!!NEAR.NEARBalance, NEAR.NEARBalance, s => yton(s)!)
            return (
                <>
                    <TitleComponent
                        title={`Enter stNEAR <-> NEAR ${NEAR.isFarmActive ? "farm" : "liquidity pool"}`}
                        step={2}
                    />
                    <StepComponent
                        title={`Provide LP ${NEAR.isFarmActive ? "and stake." : ""}`}
                        description={
                            <Description>
                                Provide your tokens as liquidity in the stNEAR {"<->"} NEAR pool
                                {`${NEAR.isFarmActive ? " and put your LP Shares into the stNEAR <-> NEAR farm." : ""}`}
                                <LineSpacing />
                                You currently have <Purple>{stNEARBalance}</Purple>&nbsp;$stNEAR and {""}
                                <Purple>{NEARBalance}</Purple>&nbsp;$NEAR.
                                <Break />
                                <InputComponent
                                    data={stNEARInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="stNEAR"
                                    type="number"
                                    onChange={(value: string) => {
                                        console.log("1.", NEARInput)
                                        NEARInput.data.value = NEARInput.data.unmatched
                                    }}
                                />
                                <Icon sx={{ alignSelf: "center" }}>link</Icon>
                                <InputComponent
                                    data={NEARInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="NEAR"
                                    type="number"
                                    onChange={(value: string) => {
                                        // if (NEAR.poolInfo !== undefined && !wNEARInput.data.error) {
                                        //     // https://stackoverflow.com/a/54409977/17894968
                                        //     stNEARInput.data.unmatched = (
                                        //         parseFloat(value) /
                                        //         (Number(
                                        //             (BigInt("10000000000") * BigInt(NEAR.poolInfo.pool_amounts[1])) /
                                        //                 BigInt(NEAR.poolInfo.pool_amounts[0])
                                        //         ) /
                                        //             10000000000)
                                        //     ).toFixed(5) // TODO: check if final pool is [wNEAR, stNEAR] or [stNEAR, wNEAR]
                                        stNEARInput.data.value = stNEARInput.data.unmatched
                                        // }
                                    }}
                                />
                                <Break />
                                {"\u2248"} <Purple>{inLPShares}</Purple>&nbsp;LP&nbsp;shares.
                                <Break />
                                <Note>Execution might take a while.</Note>
                            </Description>
                        }
                    />
                    <NavButtonComponent
                        next
                        completed={refresh[1]}
                        denied={
                            (!NEARInput && !stNEARInput) ||
                            NEARInput.data.error ||
                            stNEARInput.data.error ||
                            (parseFloat(NEARInput.data.unmatched) === 0 && parseFloat(stNEARInput.data.unmatched) === 0)
                        }
                        action={() => {
                            NEAR.addLiquidityAndFarm({
                                stnearAmount: utils.format.parseNearAmount(stNEARInput.data.value)!,
                                nearAmount: utils.format.parseNearAmount(NEARInput.data.value)!
                            })
                        }}
                    />
                </>
            )

        case 2:
            // Define Inputs
            // -
            // Define Refresh
            refresh[3] ??= new Refresh(
                () =>
                    NEAR.getV2FarmingStake(NEAR.STNEAR_WNEAR_STABLE_POOL_ID).then(res => {
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
                        NEAR.getPoolInfo(NEAR.STNEAR_WNEAR_STABLE_POOL_ID),
                        NEAR.getV2FarmingStake(NEAR.STNEAR_WNEAR_STABLE_POOL_ID)
                    ]).then(res => {
                        NEAR.wNEARBalanceOnRef = res[0][1]
                        NEAR.stNEARBalanceOnRef = res[0][0]
                        NEAR.stNEARBalance = res[1][0]
                        NEAR.NEARBalance = res[1][1]
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
                    amount: NEAR?.NEARBalance,
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
                    link: `https://app.ref.finance/pool/${NEAR.STNEAR_WNEAR_STABLE_POOL_ID}`,
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
    const [percentage, setPercentage] = useState(0)
    const [percentageStNear, setPercentageStNear] = useState(0)
    useEffect(() => {
        async function getPercentage() {
            const isFarmActive = await NEAR.getIsFarmActive(NEAR.NEW_POOL_ID)
            let percentage = 0
            if (isFarmActive) {
                percentage = (await getFarmAPR())?.ref_wnear_st_near_stable_apr
            }
            if (isNaN(percentage)) {
                percentage = 0
            }
            setPercentage(percentage)
        }
        // async function getPercentageStNear() {
        //     let percentage = (await getFarmAPR())?.st_near_30_day_apy
        //     if (isNaN(percentage) || percentage === 0) {
        //         percentage = 0
        //     }
        //     setPercentageStNear(percentage)
        // }

        getPercentage()
        // getPercentageStNear()
    }, [percentage /*, percentageStNear*/])
    return (
        <span>{`${percentage} %`}</span>
        // <span>{percentage + percentageStNear !== 0 ? Math.round(percentage + percentageStNear / 2) + "%" : "..."}</span>
    )
}