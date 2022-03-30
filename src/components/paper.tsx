import { Paper } from "@mui/material"
import * as React from "react"
import { getPage } from "../utils/navigation"
import PageComponent from "./page"

export default function PaperComponent() {
    return (
        <Paper
            className={"secondary-container-h" + (getPage() == 4 ? " secondary-container-h-last" : "")}
            sx={{
                width: 1,
                // height: "fit-content",

                display: "flex",
                // "& > *": {
                //     height: "unset !important"
                // }
                height: "40em",
                // minHeight: .85,
                my: "auto"
            }}
            elevation={2}
        >
            {/* <PageComponent page={getPage()} /> */}
        </Paper>
    )
}
