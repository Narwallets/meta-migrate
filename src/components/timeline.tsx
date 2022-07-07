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
            className="timeline"
            sx={{
                flexBasis: "12.5rem",
                alignItems: "end",
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
                <TimelineItem key={i} className={`timeline-item steps${props.steps.length}`} onClick={() => jumpTo(i)}>
                    <TimelineSeparator className="timeline-item-separator">
                        <TimelineDot className="timeline-item-dot" color={getColor(i)} />
                        {i < props.steps.length - 2 ? <TimelineConnector className="timeline-item-conector" /> : <></>}
                    </TimelineSeparator>
                    <TimelineContent className="timeline-item-content">{s.toUpperCase()}</TimelineContent>
                </TimelineItem>
            ))}
        </Timeline>
    )
}
