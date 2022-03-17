import * as React from "react"
import { Grid, Button, Icon, SxProps } from "@mui/material"
import { Refresh } from "../utils/refresh"



export default function StepComponent(props: {
    sx?: SxProps
    title: string
    description: any
    completed?: Refresh
    denied?: boolean
    hide?: Refresh
    action?: () => void
}) {
    // const completed = props.completed.getResult()
    const hide = props?.hide?.getResult() ?? false

    if (hide !== false) return <></>

    return (
        <Grid
            container
            item
            sx={{
                bgcolor: "background.default",
                borderRadius: "8px",
                position: "relative",
                flex: 1,
                mb: "2rem",
                lineHeight: "1.5em",
                ...props.sx
            }}
            direction="row"
            justifyContent="space-evenly"
            alignItems="center"
        >
            <Grid item>
                
            </Grid>
            <Grid item xs={10}>
                <b>{props.title}</b>
                <br />
                {props.description}
            </Grid>
            <Grid item>
                
            </Grid>
        </Grid>
    )
}
