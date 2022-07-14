import { Box, Icon } from "@mui/material"
import { utils } from "near-api-js"
import * as React from "react"
import { ReactNode, useState, useEffect } from "react"
import meme from "../../memes/1.png"
import Logic from "./logic"
import { getMaxInvest, yton } from "../../utils/math"
import { Refresh } from "../../utils/refresh"
import { Break, Description, LineSpacing, Loading, Note, Purple } from "../../components/description"
import { InputComponent, InputData } from "../../components/input"
import LocateComponent from "../../components/locate"
import NavButtonComponent from "../../components/navbuttons"
import StepComponent from "../../components/step"
import TitleComponent from "../../components/title"
import { getFarmAPR } from "../../utils/apr"

let wNearInput: InputData, stNEARInput: InputData
let refresh: Refresh[] = []

const NEAR = new Logic()

export const steps: string[] = ["old position", "new position", "profit", "locate my funds"]

export function getContent(page: number): ReactNode | null {
    switch (page) {
        case 0:
            // Define Inputs
            // -
            // Define Refresh
            refresh[0] ??= new Refresh(() =>
                NEAR.getOldPosition().then(res => {
                    NEAR.oldPosition = res
                    return BigInt(res.user_lp_shares) === BigInt("0") && BigInt(res.user_farm_shares) === BigInt("0")
                })
            )
            // Define Values
            const [allShares, wNearPart, stNEARPart] = Loading(
                !!NEAR?.oldPosition,
                [
                    NEAR.oldPosition?.user_total_shares,
                    NEAR.oldPosition?.min_amounts[0],
                    NEAR.oldPosition?.min_amounts[1]
                ],
                s => yton(s)!
            ) as string[]
            return (
                <>
                    <TitleComponent title="Exit stNEAR <-> wNEAR" step={page + 1} />
                    <StepComponent
                        title={"Unstake & remove liquidity."}
                        description={
                            <Description>
                                Unstake your LP shares from the old stNEAR {"<->"} wNEAR farm and remove liquidity from
                                the old stNEAR {"<->"} wNEAR pool to receive stNear and wNEAR tokens.
                                <LineSpacing />
                                You have a total of {""}
                                <Purple>{allShares}</Purple>&nbsp;LP&nbsp;shares
                                <Break />
                                {"\u2248"} <Purple>{wNearPart}</Purple>&nbsp;$wNEAR and <Purple>{stNEARPart}</Purple>
                                &nbsp;$stNEAR.
                                <Break />
                                <Note>Execution might take a while.</Note>
                            </Description>
                        }
                        completed={refresh[0]}
                        action={() => {
                            localStorage.setItem("stNEARminAmountOut", NEAR.oldPosition!.min_amounts[0])
                            localStorage.setItem("wNEARminAmountOut", NEAR.oldPosition!.min_amounts[1])
                            NEAR.exitOldPosition(
                                NEAR.oldPosition!.user_farm_shares,
                                NEAR.oldPosition!.user_total_shares,
                                NEAR.oldPosition!.min_amounts
                            )
                        }}
                    />
                    <NavButtonComponent
                        next
                        completed={refresh[0]}
                        action={() => {
                            localStorage.setItem("stNEARminAmountOut", NEAR.oldPosition!.min_amounts[0])
                            localStorage.setItem("wNEARminAmountOut", NEAR.oldPosition!.min_amounts[1])
                            NEAR.exitOldPosition(
                                NEAR.oldPosition!.user_farm_shares,
                                NEAR.oldPosition!.user_total_shares,
                                NEAR.oldPosition!.min_amounts,
                                false
                            )
                        }}
                    />
                </>
            )

        case 1:
            // Define Inputs
            if (NEAR.newPoolInfo !== undefined) {
                // const values = getMaxInvest(
                //     [
                //         /*BigInt(NEAR.stNEARBalanceOnRef!) + */ BigInt(NEAR.stNEARBalance!).toString(),
                //         NEAR.stNEARBalance!
                //     ],
                //     NEAR.newPoolInfo.amounts
                // )

                stNEARInput ??= new InputData({
                    value: yton(NEAR.stNEARBalance!),
                    pattern: /^\d+(\.\d{0,24})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.stNEARBalanceOnRef !== undefined &&
                                NEAR.stNEARBalance !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") >
                                    BigInt(NEAR.stNEARBalanceOnRef) + BigInt(NEAR.stNEARBalance),
                            msg: () =>
                                `Insufficient funds. You only have ${yton(
                                    (
                                        BigInt(NEAR.stNEARBalanceOnRef ?? "0") + BigInt(NEAR.stNEARBalance ?? "0")
                                    ).toString()
                                )} stNEAR in total.`
                        }
                    ]
                })
                wNearInput ??= new InputData({
                    value: yton(NEAR.wNEARBalanceOnRef!),
                    pattern: /^\d+(\.\d{0,18})?$/,
                    assert: [
                        {
                            test: (value: string) =>
                                NEAR.wNEARBalanceOnRef !== undefined &&
                                BigInt(utils.format.parseNearAmount(value) ?? "0") > BigInt(NEAR.wNEARBalanceOnRef),
                            msg: () =>
                                `Insufficient funds. You only have ${
                                    NEAR.wNEARBalanceOnRef !== undefined ? yton(NEAR.wNEARBalanceOnRef) : "..."
                                } $wNear.`
                        }
                    ]
                })

                NEAR.lpSharesToStake = NEAR.calcLpSharesFromAmountsForStableStNearWNear(
                    NEAR.newPoolInfo.total_shares,
                    NEAR.newPoolInfo.amounts,
                    [
                        utils.format.parseNearAmount(stNEARInput.data.error ? "0" : stNEARInput.data.value ?? "0")!,
                        utils.format.parseNearAmount(wNearInput.data.error ? "0" : wNearInput.data.value ?? "0")!
                    ]
                )
            }
            // Define Refresh
            refresh[2] ??= new Refresh(() =>
                Promise.all([
                    NEAR.getNewPoolInfo(),
                    NEAR.getWnearBalanceOnRef(),
                    NEAR.getStnearBalanceOnRef(),
                    NEAR.getStnearBalance(),
                    NEAR.getIsFarmActive(NEAR.NEW_POOL_ID)
                ]).then(res => {
                    NEAR.newPoolInfo = res[0]
                    NEAR.wNEARBalanceOnRef = res[1]
                    NEAR.stNEARBalanceOnRef = res[2]
                    NEAR.stNEARBalance = res[3]
                    NEAR.isFarmActive = res[4]
                    return false
                })
            )
            // Define Values
            const wNearBalance = Loading(!!NEAR.wNEARBalanceOnRef, NEAR.wNEARBalanceOnRef, s => yton(s)!)
            const inLPShares = Loading(!!NEAR.newPoolInfo, NEAR.lpSharesToStake, s => yton(s)!)
            const stNEARBalance =
                NEAR.stNEARBalance !== undefined && NEAR.stNEARBalanceOnRef !== undefined
                    ? yton((BigInt(NEAR.stNEARBalance) + BigInt(NEAR.stNEARBalanceOnRef)).toString())
                    : "..."
            return (
                <>
                    <TitleComponent title="Enter stable stNEAR <-> wNEAR" step={page + 1} />
                    <StepComponent
                        title={`Provide liquidity ${NEAR.isFarmActive ? "& farm." : ""}`}
                        description={
                            <Description>
                                <Break />
                                You have {""}
                                <Purple>{stNEARBalance}</Purple>&nbsp;$stNEAR and {""}
                                <Purple>{wNearBalance}</Purple>&nbsp;$wNear.
                                <Break />
                                <InputComponent
                                    data={stNEARInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="stNEAR"
                                    type="number"
                                    onChange={(value: string) => {
                                        if (NEAR.newPoolInfo !== undefined && !stNEARInput.data.error) {
                                            wNearInput.data.value = wNearInput.data.unmatched
                                        }
                                    }}
                                />
                                <Icon sx={{ alignSelf: "center" }}>link</Icon>
                                <InputComponent
                                    data={wNearInput ?? new InputData({ value: "" })}
                                    label="amount"
                                    unit="wNEAR"
                                    type="number"
                                    onChange={(value: string) => {
                                        if (NEAR.newPoolInfo !== undefined && !wNearInput.data.error) {
                                            stNEARInput.data.value = stNEARInput.data.unmatched
                                        }
                                    }}
                                />
                                {/* <Break />
                                {"\u2248"} <Purple>{inLPShares}</Purple>&nbsp;LP&nbsp;shares. */}
                                <Break />* because it is a stable pool, you can deposit different amounts
                            </Description>
                        }
                        completed={refresh[2]}
                    />
                    <NavButtonComponent
                        next
                        back
                        completed={refresh[2]}
                        action={() => {
                            NEAR.addLiquidityAndStake(
                                BigInt(utils.format.parseNearAmount(stNEARInput.data.value)!).toString(),
                                [
                                    utils.format.parseNearAmount(stNEARInput.data.value)!,
                                    utils.format.parseNearAmount(wNearInput.data.value)!
                                ],
                                NEAR.lpSharesToStake!
                            )
                        }}
                        denied={
                            (!wNearInput && !stNEARInput) ||
                            wNearInput.data.error ||
                            stNEARInput.data.error ||
                            (parseFloat(wNearInput.data.unmatched) === 0 &&
                                parseFloat(stNEARInput.data.unmatched) === 0)
                        }
                    />
                </>
            )

        case 2:
            // Define Inputs
            // -
            // Define Refresh
            refresh[3] ??= new Refresh(
                () =>
                    NEAR.getNewFarmingStake().then(res => {
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
                        NEAR.getOldPosition(),
                        NEAR.getWnearBalanceOnRef(),
                        NEAR.getStnearBalanceOnRef(),
                        NEAR.getWnearBalanceOnRef(),
                        NEAR.getStnearBalance(),
                        NEAR.getNativeNearBalance(),
                        NEAR.getNewPoolInfo(),
                        NEAR.getNewFarmingStake()
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
                    location: "stNEAR <-> wNEAR old Farm",
                    link: `https://app.ref.finance/farms`,
                    amount: NEAR?.oldPosition?.user_farm_shares,
                    unit: "LP"
                },
                {
                    location: "stNEAR <-> wNEAR old Pool",
                    link: `https://app.ref.finance/pool/${NEAR.OLD_POOL_ID}`,
                    amount: NEAR?.oldPosition?.user_lp_shares,
                    unit: "LP"
                },
                {
                    location: "NEAR wallet",
                    link: `https://wallet.near.org/`,
                    amount: NEAR?.wNEARBalanceOnRef,
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
                    location: "stNear <-> wNEAR new Pool",
                    link: `https://app.ref.finance/pool/${NEAR.NEW_POOL_ID}`,
                    amount: NEAR?.newPoolInfo?.user_shares,
                    unit: "LP"
                },
                {
                    location: "stNear <-> wNEAR new Farm",
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

export function APY() {
    const [percentage, setPercentage] = useState(0)
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

        getPercentage()
    }, [percentage])
    return <span>{percentage}%</span>
}
