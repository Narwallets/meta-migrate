import { ReactNode } from "react"
import * as MigrateToOCTFarm from "./migrate-to-oct-farm/content"
import * as EnterStNEARMETAFarm from "./enter-stnear-meta-farm/content"
import * as EnterStNEARWNEARFarm from "./enter-stnear-wnear-farm/content"
import * as MigrateToStNearWNearStableFarm from "./migrate-stnear-wnear-stable-farm/content"
import * as EnterStNEARWNEARStableFarm from "./enter-stnear-wnear-farm-stable/content"

type recipe = {
    id: number
    title: string
    description: string
    comingsoon?: boolean
    apy: () => ReactNode | null
    content: (page: number) => ReactNode | null
    steps: string[]
    order: number
    display: boolean | "disabled"
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
        order: 4,
        display: false
    },
    {
        id: 1,
        title: "Migrate wNEAR-OCT farm -> stNEAR-OCT farm",
        description: "Migrate your liquidity in 3 easy steps!",
        apy: MigrateToOCTFarm.APY,
        content: MigrateToOCTFarm.getContent,
        steps: MigrateToOCTFarm.steps,
        order: 2,
        display: false
    },
    {
        id: 2,
        title: "Enter stNEAR-wNEAR farm",
        description: "Two clicks to start farming!",
        apy: EnterStNEARWNEARFarm.APY,
        content: EnterStNEARWNEARFarm.getContent,
        steps: EnterStNEARWNEARFarm.steps,
        order: 3,
        display: false
    },
    {
        id: 3,
        title: "Migrate stNEAR-wNEAR farm -> stNEAR-wNEAR stable farm",
        description: "Migrate your liquidity in 3 easy steps!",
        apy: MigrateToStNearWNearStableFarm.APY,
        content: MigrateToStNearWNearStableFarm.getContent,
        steps: MigrateToStNearWNearStableFarm.steps,
        order: 1,
        display: true
    },
    {
        id: 4,
        title: "Enter stNEAR-wNEAR stable farm",
        description: "Two clicks to start farming!",
        apy: EnterStNEARWNEARStableFarm.APY,
        content: EnterStNEARWNEARStableFarm.getContent,
        steps: EnterStNEARWNEARStableFarm.steps,
        order: 2,
        display: true
    }
]

export let recipesSorted: recipe[] = []

for (let recipe of recipes) {
    if (recipe.display) recipesSorted.push(recipe)
}

recipesSorted.sort((r1: recipe, r2: recipe) => r1.order - r2.order)

export { recipes }
