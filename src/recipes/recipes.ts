import { ReactNode } from "react"
import * as MigrateToOCTFarm from "./migrate-to-oct-farm/content"
import * as EnterStNEARMETAFarm from "./enter-stnear-meta-farm/content"
import * as EnterStNEARWNEARFarm from "./enter-stnear-wnear-farm/content"

type recipe = {
    id: number
    title: string
    description: string
    comingsoon?: boolean
    apy: () => ReactNode | null
    content: (page: number) => ReactNode | null
    steps: string[]
}

const recipes: recipe[] = [
    {
        id: 0,
        title: "Enter stNEAR <-> META farm",
        description: "Soooon [̲̅$̲̅(̲̅ ͡° ͜ʖ ͡°̲̅)̲̅$̲̅]",
        comingsoon: true,
        apy: EnterStNEARMETAFarm.APY,
        content: EnterStNEARMETAFarm.getContent,
        steps: EnterStNEARMETAFarm.steps
    },
    {
        id: 1,
        title: "Migrate wNEAR <-> OCT farm to stNEAR <-> OCT farm",
        description: "Migrate your liquidity in 3 easy steps!",
        apy: MigrateToOCTFarm.APY,
        content: MigrateToOCTFarm.getContent,
        steps: MigrateToOCTFarm.steps
    },
    {
        id: 2,
        title: "Enter stNEAR <-> wNEAR farm",
        description: "Two clicks to start farming!",
        apy: EnterStNEARWNEARFarm.APY,
        content: EnterStNEARWNEARFarm.getContent,
        steps: EnterStNEARWNEARFarm.steps
    }
]

export { recipes }
