import * as React from "react"
import { Button, Grid, Icon } from "@mui/material"
import { getPage, jumpTo } from "../utils/navigation"
import { Refresh } from "../utils/refresh"

function getState(completed: boolean | null, denied?: boolean) {
    if (window?.account?.accountId === undefined) return "SIGN IN TO RUN"
    else if (completed === true) return <Icon>done</Icon>
    else if (denied !== undefined && denied) return <Icon>block</Icon>
    else if (completed === false) return "RUN"
    else return "..."
}

export default function NavButtonComponent(props: {
    next?: boolean
    back?: boolean
    status?: boolean
    completed?: Refresh
    denied?: boolean
    action?: () => void
}) {
    return (
        <Grid
            item
            sx={{
                mb: 4,
                width: 0.9,
                display: "flex",
                justifyContent: "space-between"
            }}
        >
            {props.back ? (
                <Button
                    variant="outlined"
                    sx={{ borderRadius: "100px" }}
                    startIcon={<Icon>navigate_before</Icon>}
                    onClick={() => jumpTo(getPage() - 1)}
                >
                    BACK
                </Button>
            ) : (
                <div></div>
            )}
            <div>
                {props.status && props.completed !== undefined ? (
                    <Button
                        variant="contained"
                        sx={{
                            borderRadius: "100px",
                            mr: ".75em"
                            // position: "absolute",
                            // bottom: "-68px",
                            // right: "calc(5% + 100px + 2px)"
                        }}
                        disabled={props.completed.getResult() !== undefined || props.denied}
                        onClick={props?.action}
                    >
                        {getState(props.completed.getResult(), props.denied)}
                    </Button>
                ) : (
                    <div></div>
                )}

                {props.next ? (
                    <Button
                        variant="outlined"
                        sx={{ borderRadius: "100px" }}
                        endIcon={<Icon>navigate_next</Icon>}
                        onClick={() => jumpTo(getPage() + 1)}
                    >
                        NEXT
                    </Button>
                ) : (
                    <div></div>
                )}
            </div>
        </Grid>
    )
}
