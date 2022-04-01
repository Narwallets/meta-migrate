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
    order: number
}

const recipes: recipe[] = [
    {
        id: 0,
        title: "Migrate REF-wNEAR farm -> REF-stNEAR farm",
        description: "Soooon [̲̅$̲̅(̲̅ ͡° ͜ʖ ͡°̲̅)̲̅$̲̅]",
        comingsoon: true,
        apy: EnterStNEARMETAFarm.APY,
        content: EnterStNEARMETAFarm.getContent,
        steps: EnterStNEARMETAFarm.steps,
        order: 3
    },
    {
        id: 1,
        title: "Migrate wNEAR-OCT farm -> stNEAR-OCT farm",
        description: "Migrate your liquidity in 3 easy steps!",
        apy: MigrateToOCTFarm.APY,
        content: MigrateToOCTFarm.getContent,
        steps: MigrateToOCTFarm.steps,
        order: 2
    },
    {
        id: 2,
        title: "Enter stNEAR-wNEAR farm",
        description: "Two clicks to start farming!",
        apy: EnterStNEARWNEARFarm.APY,
        content: EnterStNEARWNEARFarm.getContent,
        steps: EnterStNEARWNEARFarm.steps,
        order: 1
    }
]

export let recipesSorted: recipe[] = []

for (let recipe of recipes) {
    recipesSorted.push(recipe)
}

recipesSorted.sort((r1: recipe, r2: recipe) => r1.order - r2.order)

export { recipes }
