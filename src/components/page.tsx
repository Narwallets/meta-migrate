import { Grid } from "@mui/material"
import * as React from "react"
import { useReducer } from "react"
import * as Recipes from "../recipes/recipes"


export default function PageComponent(props: { recipe: number; page: number }) {
    const [, forceUpdate] = useReducer(x => x + 1, 0)
    window.updatePage = forceUpdate
    return (
        <Grid
            container
            sx={{
                width: 0.9,
                height: 0.85,
                m: "auto"
            }}
            direction="column"
            justifyContent="space-evenly"
            alignItems="center"
            wrap="nowrap"
        >
            {Recipes.recipes[props.recipe] !== undefined
                ? Recipes.recipes[props.recipe].content(props.page)
                : `No recipe with id ${props.recipe} found.`}
        </Grid>
    )
}
