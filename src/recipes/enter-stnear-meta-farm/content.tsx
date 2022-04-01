import { utils } from "near-api-js"
import * as React from "react"
import { ReactNode, useEffect, useState } from "react"
import { Refresh } from "../../utils/refresh"
import meme from "../../memes/1.png"
import { Break, Description, Loading, Purple } from "../../components/description"
import { InputComponent, InputData } from "../../components/input"
import LocateComponent from "../../components/locate"
import NavButtonComponent from "../../components/navbuttons"
import StepComponent from "../../components/step"
import TitleComponent from "../../components/title"
import { yton } from "../../utils/math"
import Logic from "./logic"
import { getFarmAPR } from "../../utils/apr"

const NEAR = new Logic()

let stakeInput: InputData
let refresh: Refresh[] = []

export const steps: string[] = ["get stNEAR", "get META", "enter farm", "profit"]

export function getContent(page: number): ReactNode | null {
    switch (page) {
        case 0:
            console.log(yton(NEAR.minDepositAmount!, 2))
            // Define Inputs
            stakeInput ??= new InputData({
                value: "0",
                pattern: /^\d+(\.\d{0,24})?$/,
                assert: [
                    {
                        test: (value: string) =>
                            NEAR.minDepositAmount !== undefined &&
                            BigInt(utils.format.parseNearAmount(value) ?? "0") < BigInt(NEAR.minDepositAmount),
                        msg: () =>
                            `Staking with MetaPool requires a minimum deposit of ${yton(
                                NEAR.minDepositAmount!,
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
                    Promise.all([NEAR.getNativeNearBalance(), NEAR.getMetapoolInfo()]).then(res => {
                        NEAR.nativeNEARBalance = res[0]
                        NEAR.stNEARPrice = res[1].st_near_price
                        NEAR.minDepositAmount = res[1].min_deposit_amount
                        return BigInt(NEAR.nativeNEARBalance) < BigInt(NEAR.minDepositAmount)
                    }),
                0
            )
            // Define Values
            const balance = Loading(!!NEAR?.nativeNEARBalance, NEAR.nativeNEARBalance, s => yton(s)!)
            const inStNEAR = Loading(
                !!NEAR?.stNEARPrice && !stakeInput.data.error && !!stakeInput.data.value,
                NEAR.estimateStnearOut(
                    utils.format.parseNearAmount(stakeInput.data.value ?? "0")!,
                    NEAR.stNEARPrice ?? "0"
                ),
                s => yton(s)!
            )
            return (
                <>
                    <TitleComponent title="NEAR -> stNEAR" step={1} />
                    <StepComponent
                        title={"Stake NEAR, get stNEAR."}
                        description={
                            <Description>
                                Stake NEAR with <Purple>MetaPool</Purple> to get stNEAR. You currently have {""}
                                <Purple>{balance}</Purple>&nbsp;$NEAR in your wallet.
                                <Break />
                                <InputComponent data={stakeInput} label="amount" unit="NEAR" type="number" />
                                {""} {"\u2248"} {""}
                                <Purple>{inStNEAR}</Purple>&nbsp;$stNEAR.
                            </Description>
                        }
                        completed={refresh[0]}
                        denied={stakeInput.data.error}
                        action={() => NEAR.stepOneAction(utils.format.parseNearAmount(stakeInput.data.value)!)}
                    />
                    <NavButtonComponent next />
                </>
            )

        case 1:
            // Define Inputs
            // -
            // Define Refresh
            refresh[1] ??= new Refresh(() => Promise.resolve(false))
            // Define Values
            // -
            return (
                <>
                    <TitleComponent title="stNEAR -> META" step={2} />
                    <StepComponent
                        title={"Buy META with stNEAR"}
                        description={<Description>{}</Description>}
                        completed={refresh[1]}
                        action={() => {}}
                    />
                    <NavButtonComponent next back />
                </>
            )

        case 2:
            // Define Inputs
            // -
            // Define Refresh
            refresh[2] ??= new Refresh(() => Promise.resolve(false))
            // Define Values
            // -
            return (
                <>
                    <TitleComponent title="Enter stNEAR <-> META farm" step={3} />
                    <StepComponent
                        title={"Provide liquidity & farm."}
                        description={<Description>{}</Description>}
                        completed={refresh[2]}
                        action={() => {}}
                    />
                    <NavButtonComponent next back />
                </>
            )

        case 3:
            // Define Inputs
            // -
            // Define Refresh
            refresh[3] ??= new Refresh(() => Promise.resolve(false))
            // Define Values
            // -
            return (
                <>
                    <TitleComponent title="Happy Farming!" />
                    <img src={meme} style={{ maxHeight: "75%" }} alt="meme" />
                    <NavButtonComponent back />
                </>
            )

        case 4:
            // Define Inputs
            // -
            // Define Refresh
            refresh[4] ??= new Refresh(() => Promise.resolve(false))
            // Define Values
            const rows: {
                location: string
                link: string
                amount?: string | undefined
                unit: string
                noline?: boolean | undefined
            }[] = []
            return <LocateComponent rows={rows} />

        default:
            return <TitleComponent title="Something went wrong" />
    }
}

export function APY() {
    return <span>--</span>
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
