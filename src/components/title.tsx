import * as React from "react"
import { Grid, useTheme } from "@mui/material"
import { positions } from "@mui/system"

export default function TitleComponent(props: {
    title: string
    step?: number
}) {
    const theme = useTheme() as any
    return (
        <Grid
            item
            xs={1}
            sx={{
                // display: "flex",
                alignItems: "center",
                fontSize: "2rem",
                fontWeight: 700
            }}
        >
            {props.step !== undefined ? (
                <span
                    style={{
                        color: theme.palette.primary.main,
                        // position: "absolute",
                        // transform: "translateX(calc(-100% - 24px))",
                        verticalAlign: "baseline",
                        marginRight: ".5em"
                    }}
                    
                >
                    {`Step ${props.step}:`}
                </span>
            ) : (
                <></>
            )}
            <span>{props.title}</span>
        </Grid>
    )
}
