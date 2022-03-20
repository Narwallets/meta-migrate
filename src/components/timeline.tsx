import * as React from "react"
import Timeline from "@mui/lab/Timeline"
import TimelineItem from "@mui/lab/TimelineItem"
import TimelineSeparator from "@mui/lab/TimelineSeparator"
import TimelineConnector from "@mui/lab/TimelineConnector"
import TimelineContent from "@mui/lab/TimelineContent"
import TimelineDot from "@mui/lab/TimelineDot"
import { getPage, jumpTo } from "../utils/navigation"

function getColor(page: number): "grey" | "primary" | "success" {
    const currentPage = getPage()

    if (currentPage === page) return "primary"

    return "grey"
}

export default function TimelineComponent(props: { steps: string[] }) {
    return (
        <Timeline
            sx={{
                flexBasis: "200px",
                alignItems: "flex-end",
                "& > .MuiTimelineItem-root::before": {
                    flex: 0
                },
                "& > *": {
                    cursor: "pointer"
                }
            }}
            position="left"
        >
            {props.steps.map((s, i) => (
                <TimelineItem onClick={() => jumpTo(i)}>
                    <TimelineSeparator>
                        <TimelineDot color={getColor(i)} />
                        {i !== props.steps.length - 1 ? <TimelineConnector /> : <></>}
                    </TimelineSeparator>
                    <TimelineContent>{s.toUpperCase()}</TimelineContent>
                </TimelineItem>
            ))}
            <TimelineItem onClick={() => jumpTo(props.steps.length)}>
                <TimelineSeparator>
                    <TimelineDot color={getColor(props.steps.length)} />
                </TimelineSeparator>
                <TimelineContent>LOCATE MY FUNDS</TimelineContent>
            </TimelineItem>
        </Timeline>
    )
}
